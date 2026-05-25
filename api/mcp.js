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

const SERVER_NAME = "Arcus Wear Agent";
const SERVER_VERSION = "0.2.0";
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
  return {
    id: p.handle,
    product_id: String(p.id),
    name: p.title,
    price: productPrice(p),
    currency: "USD",
    image_url: firstImage(p),
    description: plainText(p.body_html, p.title),
    available: p.variants.some((v) => v.available),
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
      "Add a product variant to a cart and return the updated cart (including a real Shopify checkout_url). Omit cart_id to start a new cart.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "Existing cart id (optional)" },
        variant_id: { type: "string", description: "Variant id or GID (from get_product variants[].id)" },
        quantity: { type: "number", description: "Quantity to add (default 1)" },
      },
      required: ["variant_id"],
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
      if (!args.variant_id) return { error: "variant_id is required" };
      const qty = Number(args.quantity) > 0 ? Number(args.quantity) : 1;
      const line = { merchandiseId: variantGid(args.variant_id), quantity: qty };
      const existingGid = decodeCartId(args.cart_id);
      let cart;
      if (existingGid) {
        // Confirm the cart still exists; if it expired, start a fresh one.
        const current = await cartFetch(existingGid);
        cart = current ? await cartLinesAdd(existingGid, [line]) : await cartCreate([line]);
      } else {
        cart = await cartCreate([line]);
      }
      return { cart: cartView(cart) };
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
