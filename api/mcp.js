// Arcus Wear — Agent Service (Model Context Protocol endpoint)
// ----------------------------------------------------------------------------
// A dependency-free MCP JSON-RPC 2.0 endpoint that exposes Arcus Wear's
// e-commerce catalog to AI agents (e.g. Roam's personal agent).
//
// Authored as plain CommonJS JavaScript on purpose: a Vercel serverless
// function that needs no transpilation and no module-format guessing, so it
// runs identically locally and on Vercel regardless of project tsconfig /
// package "type". Requires Node 18+ (global fetch).
//
// Design notes:
//   * Catalog source  : the LIVE store's public Shopify JSON endpoint
//                        (https://arcuswear.myshopify.com/products.json).
//                        No auth, no scraping, always current.
//   * Cart + checkout : the Shopify Storefront Cart API (cartCreate /
//                        cartLinesAdd). create_checkout returns the
//                        server-generated, signed cart.checkoutUrl — the real
//                        Shopify-hosted checkout. We never construct checkout
//                        URLs by hand (the legacy /cart/<id>:<qty> permalink is
//                        dead on this store) and we never touch payment.
//   * Cart id         : our opaque cart_id is just the Shopify cart GID
//                        (base64url-wrapped), so it round-trips across
//                        serverless invocations with no database.
//   * No LLM here     : this service is a dumb, fast protocol translator.
//                        The intelligence lives in the calling agent.
//
// Deployed as a Vercel serverless function at /api/mcp on arcuswear.store.

const SHOP_DOMAIN = "arcuswear.myshopify.com";
const STOREFRONT_API_VERSION = "2024-10";
// Public Storefront API token (the kind meant to ship in client storefronts —
// it's already exposed in arcuswear.myshopify.com's own page source). Override
// with SHOPIFY_STOREFRONT_TOKEN if it's ever rotated. This is NOT an Admin
// token and cannot place orders or read private data — it only reads the
// public catalog and manages anonymous carts.
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || "e0ace438311ad808ec4bb5bbae6bce30";

// --- Agentic payment (complete_order) config --------------------------------
// True pay-without-redirect: charge a PSP-tokenized payment method on OUR Stripe
// (Arcus is merchant-of-record) then create the PAID order via Shopify Admin.
// The caller relays a Stripe-minted payment-method token (pm_.../tok_...) — never
// a raw card — so card data stays in Stripe's PCI scope, not ours. All optional:
// without these creds complete_order returns a clear "not configured" error and
// the rest of the agent is unaffected.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";
const ADMIN_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";
const MAX_ORDER_USD = parseFloat(process.env.MAX_ORDER_USD || "2000"); // spend guard

const SERVER_NAME = "Arcus Wear Agent";
const SERVER_VERSION = "0.3.0";
const MCP_PROTOCOL_VERSION = "2025-06-18";

// ---------------------------------------------------------------------------
// Shopify catalog access (public, unauthenticated /products.json).
// Warm-invocation cache so we don't re-fetch the catalog on every tool call.
// ---------------------------------------------------------------------------
let _catalogCache = null;
const CATALOG_TTL_MS = 60000;

async function getCatalog() {
  if (_catalogCache && Date.now() - _catalogCache.at < CATALOG_TTL_MS) {
    return _catalogCache.products;
  }
  const res = await fetch(`https://${SHOP_DOMAIN}/products.json?limit=250`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Shopify catalog fetch failed (${res.status})`);
  const data = await res.json();
  const products = (data.products || []).filter((p) => p.variants && p.variants.length);
  _catalogCache = { at: Date.now(), products };
  return products;
}

// ---------------------------------------------------------------------------
// Shopify Storefront GraphQL (Cart API).
// ---------------------------------------------------------------------------
async function storefront(query, variables) {
  const res = await fetch(`https://${SHOP_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors && json.errors.length) {
    throw new Error("Shopify Storefront error: " + JSON.stringify(json.errors));
  }
  return json.data;
}

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
  lines(first: 50) {
    edges { node {
      id
      quantity
      merchandise { ... on ProductVariant {
        id
        title
        price { amount currencyCode }
        image { url }
        product { title handle }
      } }
    } }
  }
`;

async function cartCreate(lines) {
  const data = await storefront(
    `mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) { cart { ${CART_FIELDS} } userErrors { field message } }
    }`,
    { input: { lines } }
  );
  const r = data.cartCreate;
  if (r.userErrors && r.userErrors.length) throw new Error(r.userErrors.map((e) => e.message).join("; "));
  return r.cart;
}

async function cartLinesAdd(cartId, lines) {
  const data = await storefront(
    `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { field message } }
    }`,
    { cartId, lines }
  );
  const r = data.cartLinesAdd;
  if (r.userErrors && r.userErrors.length) throw new Error(r.userErrors.map((e) => e.message).join("; "));
  return r.cart;
}

async function cartFetch(cartId) {
  const data = await storefront(`query getCart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id: cartId });
  return data.cart; // null if expired/unknown
}

async function cartSetEmail(cartId, email) {
  const data = await storefront(
    `mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart { ${CART_FIELDS} } userErrors { field message }
      }
    }`,
    { cartId, buyerIdentity: { email } }
  );
  const r = data.cartBuyerIdentityUpdate;
  if (r.userErrors && r.userErrors.length) throw new Error(r.userErrors.map((e) => e.message).join("; "));
  return r.cart;
}

// ---------------------------------------------------------------------------
// Agentic payment — Stripe charge + Shopify Admin paid-order creation.
// Dependency-free: both are plain REST calls over global fetch.
// ---------------------------------------------------------------------------

// Create + confirm a Stripe PaymentIntent with a caller-supplied payment-method
// token (pm_.../tok_...). Idempotency-Key makes a retried checkout safe.
async function stripeChargeOnce(amountCents, currency, paymentMethod, idempotencyKey, metadata) {
  const form = new URLSearchParams();
  form.set("amount", String(amountCents));
  form.set("currency", String(currency || "usd").toLowerCase());
  form.set("payment_method", paymentMethod);
  form.set("confirm", "true");
  form.set("off_session", "true");
  form.append("payment_method_types[]", "card"); // card only — no redirect-based methods
  for (const [k, v] of Object.entries(metadata || {})) form.set(`metadata[${k}]`, String(v));

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: form.toString(),
  });
  const pi = await res.json();
  if (!res.ok) {
    const msg = pi && pi.error ? pi.error.message : `Stripe error ${res.status}`;
    return { ok: false, error: msg, code: pi && pi.error ? pi.error.code : undefined };
  }
  if (pi.status !== "succeeded") {
    // e.g. requires_action (3DS) — can't be completed off-session/headless.
    return { ok: false, error: `Payment not completed (status: ${pi.status}). This card needs interactive authentication; use the hosted checkout instead.`, status: pi.status, payment_intent_id: pi.id };
  }
  return { ok: true, payment_intent_id: pi.id, amount: pi.amount, currency: pi.currency };
}

// Create a PAID order in Shopify via the Admin API (records the Stripe charge as
// the transaction). Requires an Admin token with write_orders.
async function adminCreateOrder({ lineItems, email, shippingAddress, amount, currency, piId }) {
  const order = {
    line_items: lineItems, // [{ variant_id: <numeric>, quantity }]
    financial_status: "paid",
    email: email || undefined,
    shipping_address: shippingAddress || undefined,
    note: `Agentic checkout via Roam. Stripe PaymentIntent ${piId}.`,
    tags: "agentic, roam",
    transactions: [{ kind: "sale", status: "success", amount: String(amount), currency, gateway: "stripe" }],
  };
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/${ADMIN_API_VERSION}/orders.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN },
    body: JSON.stringify({ order }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data && data.errors ? JSON.stringify(data.errors) : `Shopify Admin error ${res.status}`;
    return { ok: false, error: msg };
  }
  return { ok: true, order: data.order };
}

// ---------------------------------------------------------------------------
// Catalog shaping helpers — Shopify shapes -> agent-facing contract.
// ---------------------------------------------------------------------------
function productPrice(p) {
  const prices = p.variants.map((v) => parseFloat(v.price)).filter((n) => !isNaN(n));
  return prices.length ? Math.min(...prices) : 0;
}
function firstImage(p) {
  return (p.images && p.images[0] && p.images[0].src) || null;
}
function plainText(html, fallback) {
  if (!html) return fallback;
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text || fallback;
}
function matchesProductRef(p, ref) {
  if (!ref) return false;
  const r = String(ref).trim();
  return p.handle === r || String(p.id) === r || r === `gid://shopify/Product/${p.id}`;
}
function summarizeProduct(p) {
  // Include variants so an agent can add to cart straight from search/list
  // results without a separate get_product call.
  const variants = p.variants.map((v) => ({
    variant_id: String(v.id),
    size: v.option1,
    available: v.available,
  }));
  const firstAvail = p.variants.find((v) => v.available) || p.variants[0];
  return {
    id: p.handle,
    product_id: String(p.id),
    name: p.title,
    price: productPrice(p),
    currency: "USD",
    image_url: firstImage(p),
    description: plainText(p.body_html, p.title),
    available: p.variants.some((v) => v.available),
    variants,
    default_variant_id: firstAvail ? String(firstAvail.id) : null,
  };
}
function detailProduct(p) {
  return {
    id: p.handle,
    product_id: String(p.id),
    name: p.title,
    description: plainText(p.body_html, p.title),
    price: productPrice(p),
    currency: "USD",
    product_url: "https://www.arcuswear.store/products",
    variants: p.variants.map((v) => ({
      id: `gid://shopify/ProductVariant/${v.id}`,
      variant_id: String(v.id),
      title: v.title,
      size: v.option1,
      color: v.option2,
      price: parseFloat(v.price),
      available: v.available,
      inventory_count: null,
    })),
    images: (p.images || []).map((i) => i.src),
  };
}

// ---------------------------------------------------------------------------
// Cart id <-> Shopify cart GID (base64url-wrapped opaque token).
// ---------------------------------------------------------------------------
const CART_PREFIX = "cart_";
function b64url(s) {
  return Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(s) {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString("utf8");
}
function encodeCartId(shopifyCartId) {
  return CART_PREFIX + b64url(shopifyCartId);
}
function decodeCartId(cartId) {
  if (!cartId) return null;
  try {
    const payload = cartId.startsWith(CART_PREFIX) ? cartId.slice(CART_PREFIX.length) : cartId;
    const gid = unb64url(payload);
    return gid.startsWith("gid://shopify/Cart/") ? gid : null;
  } catch (e) {
    return null;
  }
}

function variantGid(variantId) {
  const v = String(variantId);
  return v.startsWith("gid://") ? v : `gid://shopify/ProductVariant/${v}`;
}

// Resolve whatever the agent passed into a real, existing variant id.
// Accepts a true variant id/GID, OR a product handle / product id / product GID
// (optionally + a size), and falls back to the first available variant.
// Returns { variant_id, product, variant } or { error, available }.
async function resolveVariant(args) {
  const catalog = await getCatalog();
  const rawVariant = args.variant_id != null ? String(args.variant_id).trim() : "";
  const numeric = rawVariant.startsWith("gid://") ? rawVariant.split("/").pop() : rawVariant;

  // 1) Direct, valid variant id?
  if (numeric) {
    for (const p of catalog) {
      const v = p.variants.find((vv) => String(vv.id) === numeric);
      if (v) return { variant_id: String(v.id), product: p, variant: v };
    }
  }

  // 2) Treat the reference as a product (explicit product_id, else the variant
  //    field may actually be a handle / product id the agent guessed).
  const productRef = args.product_id != null ? String(args.product_id).trim() : rawVariant;
  const product = catalog.find((p) => matchesProductRef(p, productRef));
  if (product) {
    const wantSize = (args.size != null ? String(args.size) : "").trim().toLowerCase();
    let v = null;
    if (wantSize) {
      v = product.variants.find(
        (vv) => (vv.option1 || "").toLowerCase() === wantSize || (vv.title || "").toLowerCase() === wantSize
      );
      if (!v) {
        return {
          error: `Product '${product.title}' has no size '${args.size}'.`,
          available: product.variants.map((vv) => ({ variant_id: String(vv.id), size: vv.option1, available: vv.available })),
        };
      }
    }
    if (!v) v = product.variants.find((vv) => vv.available) || product.variants[0];
    if (v) return { variant_id: String(v.id), product, variant: v };
  }

  return {
    error: `Could not resolve a product variant from variant_id='${args.variant_id ?? ""}' product_id='${args.product_id ?? ""}'. Use a variant_id from get_product/list_products, or a product handle plus a size.`,
    available: catalog.map((p) => ({ id: p.handle, name: p.title, sizes: p.variants.map((vv) => vv.option1) })),
  };
}

// Shape a Shopify cart object into the agent-facing cart view.
function cartView(cart) {
  if (!cart) {
    return {
      cart_id: null,
      items: [],
      item_count: 0,
      subtotal: 0,
      currency: "USD",
      checkout_url: null,
      checkout_hint: "Cart is empty. Use add_to_cart to add a variant.",
    };
  }
  const items = (cart.lines.edges || []).map((e) => {
    const n = e.node;
    const m = n.merchandise || {};
    const price = m.price ? parseFloat(m.price.amount) : 0;
    return {
      line_id: n.id,
      variant_id: m.id ? m.id.split("/").pop() : null,
      product_name: m.product ? m.product.title : null,
      variant_title: m.title || null,
      unit_price: price,
      quantity: n.quantity,
      line_total: Math.round(price * n.quantity * 100) / 100,
      image_url: m.image ? m.image.url : null,
    };
  });
  const subtotal = cart.cost && cart.cost.subtotalAmount ? parseFloat(cart.cost.subtotalAmount.amount) : 0;
  const currency =
    (cart.cost && cart.cost.subtotalAmount && cart.cost.subtotalAmount.currencyCode) || "USD";
  return {
    cart_id: encodeCartId(cart.id),
    items,
    item_count: cart.totalQuantity,
    subtotal: Math.round(subtotal * 100) / 100,
    currency,
    checkout_url: cart.checkoutUrl,
    checkout_hint: "Open checkout_url to complete payment, or call create_checkout to (re)fetch it.",
  };
}

// ---------------------------------------------------------------------------
// Tool definitions (advertised via tools/list).
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    name: "list_products",
    description:
      "List products in the Arcus Wear catalog. Optionally filter by a keyword query. Returns id, name, price, image_url, description, and availability.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional category/product-type filter" },
        query: { type: "string", description: "Optional keyword to filter products" },
        limit: { type: "number", description: "Max number of products to return" },
      },
      required: [],
    },
  },
  {
    name: "get_product",
    description:
      "Get full detail for one product, including every size/color variant with availability, by product handle or id.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "Product handle (e.g. 'arcus-hoodie'), numeric id, or Shopify GID",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "search_products",
    description: "Keyword search over the Arcus Wear catalog (name + description).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_cart",
    description:
      "Get the contents of a cart. Pass the cart_id returned by a previous call; omit it to describe an empty cart.",
    inputSchema: {
      type: "object",
      properties: { cart_id: { type: "string", description: "Opaque cart id from a prior call" } },
      required: [],
    },
  },
  {
    name: "add_to_cart",
    description:
      "Add an item to a cart and return the updated cart (including a real Shopify checkout_url). Identify the item by variant_id (preferred, from list_products/get_product), OR by product_id/handle plus an optional size — the server resolves the right variant. Omit cart_id to start a new cart.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "Existing cart id (optional)" },
        variant_id: { type: "string", description: "Variant id or GID (from variants[].id). Preferred." },
        product_id: { type: "string", description: "Product handle or id, if you don't have a variant_id" },
        size: { type: "string", description: "Size (e.g. 'M'), used with product_id to pick the variant" },
        quantity: { type: "number", description: "Quantity to add (default 1)" },
      },
      required: [],
    },
  },
  {
    name: "get_shipping_quote",
    description:
      "Get available shipping options and estimated delivery for a cart shipping to an address. Final rates are confirmed at checkout.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "Cart id" },
        address: {
          type: "object",
          description: "Shipping address (country, province/state, zip/postal_code, city)",
        },
      },
      required: ["cart_id", "address"],
    },
  },
  {
    name: "create_checkout",
    description:
      "Return the real Shopify-hosted checkout URL for the cart (optionally prefilling the customer email). The customer completes payment in their browser; Shopify handles payment, shipping and taxes.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "Cart id to check out" },
        customer_email: { type: "string", description: "Customer email (prefilled at checkout)" },
        shipping_address: { type: "object", description: "Optional shipping address" },
        billing_address: { type: "object", description: "Optional billing address" },
      },
      required: ["cart_id"],
    },
  },
  {
    name: "complete_order",
    description:
      "Complete a purchase WITHOUT a browser redirect: charges a Stripe-tokenized payment method and places the paid order. Pass cart_id and payment_method (a Stripe payment-method or test token, e.g. 'pm_card_visa' — NOT a raw card; the buyer's card is tokenized by Stripe, never handled here). Arcus Wear is the merchant of record and charges its own Stripe; the caller only relays the token. Returns the order id/number and paid status. If the card needs interactive 3-D Secure, this returns an error and you should fall back to create_checkout.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "Cart id from add_to_cart (must contain items)." },
        payment_method: { type: "string", description: "Stripe payment-method id or token (pm_.../tok_...). Use a Stripe test token like 'pm_card_visa' in test mode." },
        customer_email: { type: "string", description: "Buyer email for the order/receipt." },
        shipping_address: { type: "object", description: "Shipping address (first_name, last_name, address1, city, province, zip, country)." },
      },
      required: ["cart_id", "payment_method"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool implementations.
// ---------------------------------------------------------------------------
async function runTool(name, args) {
  switch (name) {
    case "list_products": {
      const catalog = await getCatalog();
      let products = catalog;
      const q = (args.query || "").toLowerCase().trim();
      const cat = (args.category || "").toLowerCase().trim();
      if (cat) products = products.filter((p) => (p.product_type || "").toLowerCase().includes(cat));
      if (q) {
        products = products.filter((p) => {
          const hay = `${p.title} ${plainText(p.body_html, "")} ${p.product_type}`.toLowerCase();
          return q.split(/\s+/).every((term) => hay.includes(term));
        });
      }
      const limit = Number(args.limit) > 0 ? Number(args.limit) : products.length;
      return { products: products.slice(0, limit).map(summarizeProduct) };
    }

    case "get_product": {
      const ref = String(args.product_id || "");
      const catalog = await getCatalog();
      const p = catalog.find((pp) => matchesProductRef(pp, ref));
      if (!p) return { error: `No product found for '${ref}'` };
      return { product: detailProduct(p) };
    }

    case "search_products": {
      const q = String(args.query || "").toLowerCase().trim();
      const catalog = await getCatalog();
      const terms = q.split(/\s+/).filter(Boolean);
      const scored = catalog
        .map((p) => {
          const hay = `${p.title} ${plainText(p.body_html, "")} ${p.product_type} ${p.handle}`.toLowerCase();
          const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
          return { p, score };
        })
        .filter((x) => (terms.length ? x.score > 0 : true))
        .sort((a, b) => b.score - a.score);
      const limit = Number(args.limit) > 0 ? Number(args.limit) : scored.length;
      return { products: scored.slice(0, limit).map((x) => summarizeProduct(x.p)) };
    }

    case "get_cart": {
      const gid = decodeCartId(args.cart_id);
      if (!gid) return { cart: cartView(null) };
      const cart = await cartFetch(gid);
      return { cart: cartView(cart) };
    }

    case "add_to_cart": {
      if (args.variant_id == null && args.product_id == null) {
        return { error: "Provide variant_id, or product_id (+ optional size)." };
      }
      // Resolve to a real variant — tolerates an agent passing a product handle
      // or product id instead of a variant id (the common search -> add path).
      const resolved = await resolveVariant(args);
      if (resolved.error) return resolved;
      const qty = Number(args.quantity) > 0 ? Number(args.quantity) : 1;
      const line = { merchandiseId: variantGid(resolved.variant_id), quantity: qty };
      const existingGid = decodeCartId(args.cart_id);
      let cart;
      if (existingGid) {
        // Confirm the cart still exists; if it expired, start a fresh one.
        const current = await cartFetch(existingGid);
        cart = current ? await cartLinesAdd(existingGid, [line]) : await cartCreate([line]);
      } else {
        cart = await cartCreate([line]);
      }
      const view = cartView(cart);
      view.added = {
        variant_id: resolved.variant_id,
        product_name: resolved.product.title,
        size: resolved.variant.option1,
      };
      return { cart: view };
    }

    case "get_shipping_quote": {
      const gid = decodeCartId(args.cart_id);
      const cart = gid ? await cartFetch(gid) : null;
      const view = cartView(cart);
      const country = ((args.address && (args.address.country || args.address.country_code)) || "US")
        .toString()
        .toUpperCase();
      const domestic = ["US", "USA", "UNITED STATES"].includes(country);
      const options = domestic
        ? [
            { id: "standard", label: "Standard Shipping", price: view.subtotal >= 75 ? 0 : 5.0, currency: "USD", estimated_delivery: "5–7 business days" },
            { id: "express", label: "Express Shipping", price: 15.0, currency: "USD", estimated_delivery: "2–3 business days" },
          ]
        : [
            { id: "international", label: "International Shipping", price: 25.0, currency: "USD", estimated_delivery: "10–18 business days" },
          ];
      return {
        cart_id: view.cart_id,
        destination: args.address,
        shipping_options: options,
        note: "Estimated rates. Final shipping is calculated by Shopify at checkout.",
      };
    }

    case "create_checkout": {
      const gid = decodeCartId(args.cart_id);
      if (!gid) return { error: "Unknown or empty cart — add items with add_to_cart first." };
      // Optionally prefill the buyer email; this also returns the live cart.
      let cart;
      if (args.customer_email) {
        try {
          cart = await cartSetEmail(gid, args.customer_email);
        } catch (e) {
          cart = await cartFetch(gid); // email prefill is best-effort
        }
      } else {
        cart = await cartFetch(gid);
      }
      if (!cart) return { error: "Cart no longer exists — create a new one with add_to_cart." };
      if (!cart.totalQuantity) return { error: "Cart is empty — add items before checkout." };
      const view = cartView(cart);
      return {
        checkout_url: cart.checkoutUrl, // real, signed, Shopify-hosted checkout
        cart_id: view.cart_id,
        item_count: view.item_count,
        subtotal: view.subtotal,
        currency: view.currency,
        customer_email: args.customer_email || null,
        instructions:
          "Open checkout_url in a browser to complete payment. Shipping and taxes are calculated by Shopify on the checkout page.",
      };
    }

    case "complete_order": {
      if (!STRIPE_SECRET_KEY || !SHOPIFY_ADMIN_TOKEN) {
        return {
          error:
            "Agentic checkout isn't configured on this store yet. Set STRIPE_SECRET_KEY and SHOPIFY_ADMIN_TOKEN (Admin token with write_orders) to enable complete_order. Meanwhile use create_checkout for the hosted checkout URL.",
        };
      }
      const paymentMethod = String(args.payment_method || "").trim();
      if (!paymentMethod) return { error: "payment_method is required (a Stripe pm_/tok_ token, e.g. 'pm_card_visa' in test mode)." };
      const gid = decodeCartId(args.cart_id);
      if (!gid) return { error: "Unknown or empty cart — add items with add_to_cart first." };
      const cart = await cartFetch(gid);
      if (!cart || !cart.totalQuantity) return { error: "Cart is empty or expired — add items with add_to_cart first." };

      // Storefront carts carry no tax until hosted checkout; charge total if present, else subtotal.
      const amtObj = (cart.cost && (cart.cost.totalAmount || cart.cost.subtotalAmount)) || null;
      const amount = amtObj ? parseFloat(amtObj.amount) : 0;
      const currency = (amtObj && amtObj.currencyCode) || "USD";
      if (!(amount > 0)) return { error: "Could not determine cart total." };
      if (amount > MAX_ORDER_USD) return { error: `Order total $${amount} exceeds this store's agentic spend cap ($${MAX_ORDER_USD}).` };

      // 1) Charge on Arcus's own Stripe (idempotent per cart → safe to retry).
      const charge = await stripeChargeOnce(Math.round(amount * 100), currency, paymentMethod, `arcus_${gid}`, {
        cart_id: args.cart_id,
        store: "arcuswear",
      });
      if (!charge.ok) return { error: charge.error, payment_status: charge.status || "failed", payment_intent_id: charge.payment_intent_id };

      // 2) Record the PAID order in Shopify via the Admin API.
      const lineItems = (cart.lines.edges || []).map((e) => ({
        variant_id: Number(e.node.merchandise.id.split("/").pop()),
        quantity: e.node.quantity,
      }));
      const made = await adminCreateOrder({
        lineItems,
        email: args.customer_email,
        shippingAddress: args.shipping_address,
        amount,
        currency,
        piId: charge.payment_intent_id,
      });
      if (!made.ok) {
        // Charged but order creation failed — surface loudly for reconcile/refund.
        return {
          error: `Payment succeeded (Stripe ${charge.payment_intent_id}) but order creation failed: ${made.error}. Reconcile or refund the charge.`,
          paid: true,
          order_created: false,
          payment_intent_id: charge.payment_intent_id,
        };
      }
      const o = made.order;
      return {
        ok: true,
        status: "paid",
        order_id: o.id,
        order_number: o.name || `#${o.order_number}`,
        total: amount,
        currency,
        payment_intent_id: charge.payment_intent_id,
        email: o.email || args.customer_email || null,
        message:
          "Order placed and paid — no redirect. Arcus Wear (merchant of record) charged its own Stripe; the buyer's card was tokenized by Stripe and never handled by the agent or Roam.",
      };
    }

    default:
      throw { code: -32601, message: `Unknown tool: ${name}` };
  }
}

// ---------------------------------------------------------------------------
// JSON-RPC dispatch.
// ---------------------------------------------------------------------------
async function handleRpc(msg) {
  const id = msg && msg.id;
  const method = msg && msg.method;
  const params = msg && msg.params;
  const reply = (result) => ({ jsonrpc: "2.0", id: id != null ? id : null, result });
  const fail = (code, message) => ({ jsonrpc: "2.0", id: id != null ? id : null, error: { code, message } });

  switch (method) {
    case "initialize":
      return reply({
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        capabilities: { tools: {} },
      });
    case "notifications/initialized":
      return null;
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS });
    case "tools/call": {
      const toolName = params && params.name;
      const args = (params && params.arguments) || {};
      if (!toolName) return fail(-32602, "Missing tool name");
      try {
        const result = await runTool(toolName, args);
        return reply({ content: [{ type: "text", text: JSON.stringify(result) }], isError: !!(result && result.error) });
      } catch (err) {
        if (err && typeof err.code === "number") return fail(err.code, err.message);
        return reply({
          content: [{ type: "text", text: JSON.stringify({ error: (err && err.message) || String(err) }) }],
          isError: true,
        });
      }
    }
    default:
      return fail(-32601, `Method not found: ${method}`);
  }
}

// ---------------------------------------------------------------------------
// HTTP entrypoint (Vercel Node serverless signature).
// ---------------------------------------------------------------------------
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      protocol: "mcp",
      protocolVersion: MCP_PROTOCOL_VERSION,
      transport: "http-jsonrpc",
      description: "Arcus Wear streetwear agent. POST MCP JSON-RPC 2.0 to this endpoint.",
      tools: TOOLS.map((t) => t.name),
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      return;
    }
  }

  try {
    if (Array.isArray(body)) {
      const responses = (await Promise.all(body.map(handleRpc))).filter((r) => r !== null);
      res.status(200).json(responses);
      return;
    }
    const response = await handleRpc(body);
    if (response === null) {
      res.status(204).end();
      return;
    }
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({
      jsonrpc: "2.0",
      id: (body && body.id) != null ? body.id : null,
      error: { code: -32603, message: (err && err.message) || "Internal error" },
    });
  }
}

module.exports = handler;
module.exports.default = handler;
