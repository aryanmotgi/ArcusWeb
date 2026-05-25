// End-to-end test of the Arcus Wear MCP agent service.
// Drives api/mcp.ts the same way Roam's agent does (JSON-RPC 2.0), against
// the REAL live Shopify store. Run with:  npx tsx scripts/test-agent-mcp.ts
//
// Exits non-zero if any assertion fails.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const handler = require("../api/mcp.js");

// --- minimal mock req/res that mimics Vercel's serverless invocation -------
function invoke(method: string, body?: any): Promise<{ status: number; json: any }> {
  return new Promise((resolve) => {
    let statusCode = 200;
    const res: any = {
      _headers: {} as Record<string, string>,
      setHeader(k: string, v: string) {
        this._headers[k] = v;
      },
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: any) {
        resolve({ status: statusCode, json: payload });
      },
      end(payload?: any) {
        resolve({ status: statusCode, json: payload ?? null });
      },
    };
    const req: any = { method, body, headers: {} };
    handler(req, res);
  });
}

const rpc = (id: number, method: string, params?: any) =>
  invoke("POST", { jsonrpc: "2.0", id, method, params });

let failures = 0;
function check(label: string, cond: boolean, detail?: any) {
  const mark = cond ? "✅" : "❌";
  console.log(`${mark} ${label}`);
  if (!cond) {
    failures++;
    if (detail !== undefined) console.log("   ↳", JSON.stringify(detail).slice(0, 300));
  }
}

// tools/call returns content[0].text as JSON-stringified result.
// `rpc()` resolves to { status, json }, so reach into .json.result.
function unwrap(rpcResult: any): any {
  const result = rpcResult?.json?.result;
  const text = result?.content?.[0]?.text;
  return text ? JSON.parse(text) : result;
}

async function main() {
  console.log("\n=== Arcus Wear MCP agent — end-to-end test (live store) ===\n");

  // 1. GET liveness (Roam pings this)
  const live = await invoke("GET");
  check("GET liveness returns 200 + protocol=mcp", live.status === 200 && live.json?.protocol === "mcp", live.json);

  // 2. initialize
  const init = await rpc(1, "initialize");
  check(
    "initialize returns serverInfo + tools capability",
    init.json?.result?.serverInfo?.name === "Arcus Wear Agent" && !!init.json?.result?.capabilities?.tools,
    init.json
  );

  // 3. tools/list
  const tools = await rpc(2, "tools/list");
  const toolNames: string[] = (tools.json?.result?.tools || []).map((t: any) => t.name);
  const expected = [
    "list_products",
    "get_product",
    "search_products",
    "get_cart",
    "add_to_cart",
    "get_shipping_quote",
    "create_checkout",
  ];
  check("tools/list advertises all 7 capabilities", expected.every((t) => toolNames.includes(t)), toolNames);

  // 4. list_products(query=hoodie) — the demo query
  const listed = unwrap(await rpc(3, "tools/call", { name: "list_products", arguments: { query: "hoodie" } }));
  const hoodie = (listed.products || []).find((p: any) => /hoodie/i.test(p.name));
  check("list_products('hoodie') returns the Arcus Hoodie with a real price", !!hoodie && hoodie.price > 0, listed);
  if (hoodie) console.log(`   → ${hoodie.name} — $${hoodie.price} (${hoodie.id}), image: ${hoodie.image_url ? "yes" : "no"}`);

  // 5. get_product(arcus-hoodie) — variants with availability
  const detail = unwrap(await rpc(4, "tools/call", { name: "get_product", arguments: { product_id: "arcus-hoodie" } }));
  const variants = detail.product?.variants || [];
  const mediumVariant = variants.find((v: any) => /^M$/i.test(v.size) || /medium/i.test(v.title));
  check("get_product('arcus-hoodie') returns size variants", variants.length >= 3, detail);
  check("hoodie has a Medium variant with a real variant id", !!mediumVariant?.variant_id, mediumVariant);
  if (mediumVariant) console.log(`   → Medium variant: ${mediumVariant.variant_id} (available: ${mediumVariant.available})`);

  // 6. search_products
  const search = unwrap(await rpc(5, "tools/call", { name: "search_products", arguments: { query: "tee" } }));
  check("search_products('tee') returns at least one tee", (search.products || []).some((p: any) => /tee/i.test(p.name)), search);

  // 7. add_to_cart (start a new cart with the hoodie Medium)
  const variantId = mediumVariant?.variant_id;
  const cart1 = unwrap(await rpc(6, "tools/call", { name: "add_to_cart", arguments: { variant_id: variantId, quantity: 1 } }));
  check("add_to_cart returns a cart with 1 item + a cart_id", cart1.cart?.item_count === 1 && !!cart1.cart?.cart_id, cart1);
  const cartId = cart1.cart?.cart_id;
  console.log(`   → cart_id: ${cartId}`);
  console.log(`   → subtotal: $${cart1.cart?.subtotal}`);

  // 8. get_cart round-trips the stateless cart_id
  const cart2 = unwrap(await rpc(7, "tools/call", { name: "get_cart", arguments: { cart_id: cartId } }));
  check("get_cart round-trips the cart_id (1 item)", cart2.cart?.item_count === 1, cart2);

  // 8b. search results carry variant ids (so an agent can add straight from search)
  check(
    "search_products results include variants[] + default_variant_id",
    Array.isArray((search.products?.[0] || {}).variants) && !!search.products?.[0]?.default_variant_id,
    search.products?.[0]
  );

  // 8c. add_to_cart by product HANDLE + size (the search->add path that was failing)
  const byHandle = unwrap(
    await rpc(20, "tools/call", { name: "add_to_cart", arguments: { product_id: "arcus-hoodie", size: "M" } })
  );
  check(
    "add_to_cart by handle+size resolves the real variant",
    byHandle.cart?.item_count === 1 && byHandle.cart?.added?.product_name === "Arcus Hoodie",
    byHandle
  );

  // 8d. add_to_cart by numeric product_id (no size) falls back to an available variant
  const byProductId = unwrap(
    await rpc(21, "tools/call", { name: "add_to_cart", arguments: { product_id: detail.product.product_id } })
  );
  check("add_to_cart by product_id falls back to an available variant", byProductId.cart?.item_count === 1, byProductId);

  // 8e. a bogus variant returns a helpful error (not a raw Shopify failure)
  const bogus = unwrap(
    await rpc(22, "tools/call", { name: "add_to_cart", arguments: { variant_id: "not-a-real-variant" } })
  );
  check("add_to_cart with a bogus id returns a helpful error + available list", !!bogus.error && Array.isArray(bogus.available), bogus);

  // 9. get_shipping_quote
  const shipping = unwrap(
    await rpc(8, "tools/call", {
      name: "get_shipping_quote",
      arguments: { cart_id: cartId, address: { country: "US", province: "CA", zip: "94103" } },
    })
  );
  check("get_shipping_quote returns shipping options", (shipping.shipping_options || []).length > 0, shipping);

  // 10. create_checkout → real Shopify Cart API checkout URL
  const checkout = unwrap(
    await rpc(9, "tools/call", {
      name: "create_checkout",
      arguments: { cart_id: cartId, customer_email: "demo@example.com" },
    })
  );
  const url: string = checkout.checkout_url || "";
  // Cart API checkout URLs look like .../cart/c/<token>?key=<key> (NOT the dead
  // legacy /cart/<variantId>:<qty> permalink).
  check("create_checkout returns a Cart API checkout URL (/cart/c/)", /\/cart\/c\/[A-Za-z0-9]/.test(url), checkout);
  console.log(`   → checkout_url: ${url.replace(/key=[^&]*/, "key=…").replace(/\/c\/[^/?]*/, "/c/…")}`);

  // 11. Verify the checkout URL's first hop heads into a real checkout
  //     (shop.app callback or /checkouts/cn/...) — NOT a bounce to the store root.
  if (url) {
    try {
      const r = await fetch(url, { method: "GET", redirect: "manual" });
      const loc = r.headers.get("location") || "";
      const reachesCheckout = /shop\.app\/checkout|\/checkouts\//.test(loc);
      const bouncedToRoot = /^https?:\/\/[^/]+\/?$/.test(loc);
      check(
        "checkout URL heads into a live Shopify checkout (not a root bounce)",
        reachesCheckout && !bouncedToRoot,
        { status: r.status, location: loc.slice(0, 90) }
      );
    } catch (e: any) {
      check("checkout URL heads into a live Shopify checkout (not a root bounce)", false, e?.message);
    }
  }

  console.log(`\n=== ${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"} ===\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test harness crashed:", e);
  process.exit(1);
});
