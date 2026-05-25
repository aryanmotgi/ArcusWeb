// Arcus Wear — Agent Service (Model Context Protocol endpoint)
// ----------------------------------------------------------------------------
// A dependency-free MCP JSON-RPC 2.0 endpoint that exposes Arcus Wear's
// e-commerce catalog to AI agents (e.g. Roam's personal agent).
//
// Design notes:
//   * Catalog source  : the LIVE store's public Shopify JSON endpoints
//                        (https://arcuswear.myshopify.com/products.json).
//                        No auth, no scraping, always current.
//   * Checkout        : Shopify cart permalinks (.../cart/<variant>:<qty>,...)
//                        which redirect to a real Shopify-hosted checkout.
//                        We never touch payment.
//   * Cart            : stateless — the cart's contents are encoded directly
//                        into the cart_id (base64url JSON). Serverless-safe,
//                        no database, survives cold starts.
//   * No LLM here     : this service is a dumb, fast protocol translator.
//                        The intelligence lives in the calling agent.
//
// Deployed as a Vercel serverless function at /api/mcp on arcuswear.store.

const SHOP_DOMAIN = "arcuswear.myshopify.com";
const SERVER_NAME = "Arcus Wear Agent";
const SERVER_VERSION = "0.1.0";
const MCP_PROTOCOL_VERSION = "2025-06-18";

// ---------------------------------------------------------------------------
// Minimal Vercel handler types (avoids adding @vercel/node as a dependency).
// ---------------------------------------------------------------------------
interface Req {
  method?: string;
  body?: any;
  headers?: Record<string, any>;
}
interface Res {
  setHeader(name: string, value: string): void;
  status(code: number): Res;
  json(body: any): void;
  end(body?: any): void;
}

// ---------------------------------------------------------------------------
// Shopify catalog access (public, unauthenticated /products.json).
// ---------------------------------------------------------------------------
interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}
interface ShopifyImage {
  src: string;
}
interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string | null;
  product_type: string;
  tags: string[] | string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options?: { name: string; values: string[] }[];
}

// Warm-invocation cache so we don't re-fetch the catalog on every tool call.
let _catalogCache: { at: number; products: ShopifyProduct[] } | null = null;
const CATALOG_TTL_MS = 60_000;

async function getCatalog(): Promise<ShopifyProduct[]> {
  if (_catalogCache && Date.now() - _catalogCache.at < CATALOG_TTL_MS) {
    return _catalogCache.products;
  }
  const res = await fetch(`https://${SHOP_DOMAIN}/products.json?limit=250`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Shopify catalog fetch failed (${res.status})`);
  const data = (await res.json()) as { products: ShopifyProduct[] };
  const products = (data.products || []).filter((p) => p.variants?.length);
  _catalogCache = { at: Date.now(), products };
  return products;
}

// ---------------------------------------------------------------------------
// Shaping helpers — translate Shopify shapes into the agent-facing contract.
// ---------------------------------------------------------------------------
function productPrice(p: ShopifyProduct): number {
  const prices = p.variants.map((v) => parseFloat(v.price)).filter((n) => !isNaN(n));
  return prices.length ? Math.min(...prices) : 0;
}

function firstImage(p: ShopifyProduct): string | null {
  return p.images?.[0]?.src ?? null;
}

function plainText(html: string | null, fallback: string): string {
  if (!html) return fallback;
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

// A product can be referenced by numeric id, Shopify GID, or handle.
function matchesProductRef(p: ShopifyProduct, ref: string): boolean {
  if (!ref) return false;
  const r = String(ref).trim();
  if (p.handle === r) return true;
  if (String(p.id) === r) return true;
  if (r === `gid://shopify/Product/${p.id}`) return true;
  return false;
}

function summarizeProduct(p: ShopifyProduct) {
  return {
    id: p.handle, // stable, human-readable; accepted back by get_product
    product_id: String(p.id),
    name: p.title,
    price: productPrice(p),
    currency: "USD",
    image_url: firstImage(p),
    description: plainText(p.body_html, p.title),
    available: p.variants.some((v) => v.available),
  };
}

function detailProduct(p: ShopifyProduct) {
  return {
    id: p.handle,
    product_id: String(p.id),
    name: p.title,
    description: plainText(p.body_html, p.title),
    price: productPrice(p),
    currency: "USD",
    product_url: `https://www.arcuswear.store/products`,
    variants: p.variants.map((v) => ({
      id: `gid://shopify/ProductVariant/${v.id}`,
      variant_id: String(v.id),
      title: v.title,
      size: v.option1,
      color: v.option2, // null for single-option products
      price: parseFloat(v.price),
      available: v.available,
      inventory_count: null, // not exposed via public catalog endpoint
    })),
    images: (p.images || []).map((i) => i.src),
  };
}

// ---------------------------------------------------------------------------
// Stateless cart: contents are base64url-encoded into the cart_id itself.
// ---------------------------------------------------------------------------
interface CartLine {
  variant_id: string;
  quantity: number;
}

function b64urlEncode(obj: any): string {
  return Buffer.from(JSON.stringify(obj), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): any {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

const CART_PREFIX = "cart_";

function decodeCart(cartId?: string): CartLine[] {
  if (!cartId) return [];
  try {
    const payload = cartId.startsWith(CART_PREFIX) ? cartId.slice(CART_PREFIX.length) : cartId;
    const lines = b64urlDecode(payload);
    if (!Array.isArray(lines)) return [];
    return lines
      .filter((l) => l && l.variant_id && l.quantity > 0)
      .map((l) => ({ variant_id: String(l.variant_id), quantity: Number(l.quantity) }));
  } catch {
    return [];
  }
}

function encodeCart(lines: CartLine[]): string {
  return CART_PREFIX + b64urlEncode(lines);
}

function numericVariantId(variantId: string): string {
  if (variantId.startsWith("gid://")) return variantId.split("/").pop() || variantId;
  return variantId;
}

function cartPermalink(lines: CartLine[], email?: string): string {
  const path = lines.map((l) => `${numericVariantId(l.variant_id)}:${l.quantity}`).join(",");
  let url = `https://${SHOP_DOMAIN}/cart/${path}`;
  if (email) url += `?checkout[email]=${encodeURIComponent(email)}`;
  return url;
}

// Resolve a variant_id to its product/variant detail (for cart display).
async function describeLine(line: CartLine) {
  const wanted = numericVariantId(line.variant_id);
  const catalog = await getCatalog();
  for (const p of catalog) {
    const v = p.variants.find((vv) => String(vv.id) === wanted);
    if (v) {
      return {
        variant_id: String(v.id),
        product_name: p.title,
        variant_title: v.title,
        size: v.option1,
        unit_price: parseFloat(v.price),
        quantity: line.quantity,
        line_total: parseFloat(v.price) * line.quantity,
        available: v.available,
        image_url: firstImage(p),
      };
    }
  }
  return {
    variant_id: wanted,
    product_name: "Unknown item",
    variant_title: null,
    size: null,
    unit_price: 0,
    quantity: line.quantity,
    line_total: 0,
    available: false,
    image_url: null,
  };
}

async function buildCartView(lines: CartLine[]) {
  const items = await Promise.all(lines.map(describeLine));
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  return {
    cart_id: encodeCart(lines),
    items,
    item_count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: Math.round(subtotal * 100) / 100,
    currency: "USD",
    checkout_hint: lines.length
      ? "Call create_checkout to get a one-tap Shopify-hosted checkout URL."
      : "Cart is empty. Use add_to_cart to add a variant.",
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
      "Get the contents of a cart. Pass the cart_id returned by a previous call; omit it to start a new empty cart.",
    inputSchema: {
      type: "object",
      properties: { cart_id: { type: "string", description: "Opaque cart id from a prior call" } },
      required: [],
    },
  },
  {
    name: "add_to_cart",
    description:
      "Add a product variant to a cart and return the updated cart (with a new cart_id). Omit cart_id to start a new cart.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: { type: "string", description: "Existing cart id (optional)" },
        variant_id: {
          type: "string",
          description: "Variant id or GID (from get_product variants[].id)",
        },
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
      "Create a Shopify-hosted checkout for the cart and return a one-tap checkout URL the customer completes in their browser. Payment is handled by Shopify.",
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
async function runTool(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case "list_products": {
      const catalog = await getCatalog();
      let products = catalog;
      const q = (args.query || "").toLowerCase().trim();
      const cat = (args.category || "").toLowerCase().trim();
      if (cat) {
        products = products.filter((p) => (p.product_type || "").toLowerCase().includes(cat));
      }
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
      return { cart: await buildCartView(decodeCart(args.cart_id)) };
    }

    case "add_to_cart": {
      if (!args.variant_id) return { error: "variant_id is required" };
      const lines = decodeCart(args.cart_id);
      const variantId = numericVariantId(String(args.variant_id));
      const qty = Number(args.quantity) > 0 ? Number(args.quantity) : 1;
      const existing = lines.find((l) => numericVariantId(l.variant_id) === variantId);
      if (existing) existing.quantity += qty;
      else lines.push({ variant_id: variantId, quantity: qty });
      return { cart: await buildCartView(lines) };
    }

    case "get_shipping_quote": {
      const lines = decodeCart(args.cart_id);
      const view = await buildCartView(lines);
      const country = (args.address?.country || args.address?.country_code || "US")
        .toString()
        .toUpperCase();
      const domestic = ["US", "USA", "UNITED STATES"].includes(country);
      const options = domestic
        ? [
            {
              id: "standard",
              label: "Standard Shipping",
              price: view.subtotal >= 75 ? 0 : 5.0,
              currency: "USD",
              estimated_delivery: "5–7 business days",
            },
            {
              id: "express",
              label: "Express Shipping",
              price: 15.0,
              currency: "USD",
              estimated_delivery: "2–3 business days",
            },
          ]
        : [
            {
              id: "international",
              label: "International Shipping",
              price: 25.0,
              currency: "USD",
              estimated_delivery: "10–18 business days",
            },
          ];
      return {
        cart_id: view.cart_id,
        destination: args.address,
        shipping_options: options,
        note: "Estimated rates. Final shipping is calculated by Shopify at checkout.",
      };
    }

    case "create_checkout": {
      const lines = decodeCart(args.cart_id);
      if (!lines.length) return { error: "Cart is empty — add items before checkout." };
      const url = cartPermalink(lines, args.customer_email);
      const view = await buildCartView(lines);
      return {
        checkout_url: url,
        cart_id: view.cart_id,
        item_count: view.item_count,
        subtotal: view.subtotal,
        currency: "USD",
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
async function handleRpc(msg: any): Promise<any> {
  const { id, method, params } = msg || {};
  const reply = (result: any) => ({ jsonrpc: "2.0", id: id ?? null, result });
  const fail = (code: number, message: string) => ({
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  });

  switch (method) {
    case "initialize":
      return reply({
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        capabilities: { tools: {} },
      });

    case "notifications/initialized":
      return null; // notification: no response

    case "ping":
      return reply({});

    case "tools/list":
      return reply({ tools: TOOLS });

    case "tools/call": {
      const toolName = params?.name;
      const args = params?.arguments || {};
      if (!toolName) return fail(-32602, "Missing tool name");
      try {
        const result = await runTool(toolName, args);
        return reply({
          content: [{ type: "text", text: JSON.stringify(result) }],
          isError: !!(result && result.error),
        });
      } catch (err: any) {
        if (err && typeof err.code === "number") return fail(err.code, err.message);
        return reply({
          content: [{ type: "text", text: JSON.stringify({ error: err?.message || String(err) }) }],
          isError: true,
        });
      }
    }

    default:
      return fail(-32601, `Method not found: ${method}`);
  }
}

// ---------------------------------------------------------------------------
// HTTP entrypoint.
// ---------------------------------------------------------------------------
export default async function handler(req: Req, res: Res) {
  // CORS — allow agents from any origin (public, read-mostly endpoint).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // GET → liveness / discovery (Roam's A2A probe pings with GET).
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

  // Parse body (Vercel usually pre-parses JSON; handle string bodies too).
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      return;
    }
  }

  try {
    // Support JSON-RPC batches.
    if (Array.isArray(body)) {
      const responses = (await Promise.all(body.map(handleRpc))).filter((r) => r !== null);
      res.status(200).json(responses);
      return;
    }
    const response = await handleRpc(body);
    if (response === null) {
      res.status(204).end(); // notification
      return;
    }
    res.status(200).json(response);
  } catch (err: any) {
    res.status(500).json({
      jsonrpc: "2.0",
      id: body?.id ?? null,
      error: { code: -32603, message: err?.message || "Internal error" },
    });
  }
}
