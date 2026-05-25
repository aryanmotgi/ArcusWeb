
  # Arcus

  This is a code bundle for Arcus. The original project is available at https://www.figma.com/design/UB4lubtWRalvL83T8EFVi9/Arcus.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

---

## Arcus Wear Agent Service (MCP)

Arcus Wear exposes its catalog to AI agents (e.g. Roam) over the
[Model Context Protocol](https://modelcontextprotocol.io) — so an agent can
discover the brand, browse products, build a cart, and hand the shopper a
ready-to-pay checkout, all without a human touching the storefront.

This is **additive**: it adds new files only and does not change any
customer-facing storefront code.

### What's where

| Path | Purpose |
|------|---------|
| `api/mcp.js` | The agent service — a Vercel serverless function at **`/api/mcp`** implementing MCP JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`) plus a `GET` liveness/discovery response. Plain CommonJS, zero dependencies. |
| `public/.well-known/agent-card.json` | Google A2A manifest. Served at `/.well-known/agent-card.json`. |
| `public/llms.txt` | `llms.txt` content + the `## Agent` extension block declaring the MCP endpoint. Served at `/llms.txt`. |
| `scripts/test-agent-mcp.ts` | End-to-end test (`npm run test:agent`). |

### How it works (and what it deliberately does not do)

- **Catalog** is read live from the store's **public** Shopify JSON endpoint
  `https://arcuswear.myshopify.com/products.json` — no auth, no scraping, always
  current. (The Storefront API token in older env docs points at a dead dev
  store, `arcus-9752.myshopify.com`, and is **not used**.)
- **Checkout** hands off to a **Shopify cart permalink**
  (`https://arcuswear.myshopify.com/cart/<variant>:<qty>,…`) which redirects to a
  real Shopify-hosted checkout. We never handle payment or card data.
- **Cart is stateless**: its contents are base64url-encoded into the `cart_id`
  the tools return, so it survives serverless cold starts with no database.
- **No LLM in this service** — it is a dumb, fast protocol translator. The
  intelligence lives in the calling agent.

### MCP tools exposed

`list_products` · `get_product` · `search_products` · `get_cart` ·
`add_to_cart` · `get_shipping_quote` · `create_checkout`

### Deploy

The service ships with the rest of the site. `public/` is copied into the build
output and `api/mcp.js` is built by Vercel as a serverless function — static
files and `/api` functions take precedence over the SPA catch-all rewrite in
`vercel.json`, so all three URLs resolve correctly.

```bash
git push origin main      # Vercel auto-deploys to https://www.arcuswear.store
```

No environment variables or secrets are required.

### Verify the live endpoint

```bash
# Liveness + advertised tools
curl https://www.arcuswear.store/api/mcp

# Initialize handshake
curl -X POST https://www.arcuswear.store/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# List the catalog (real live products)
curl -X POST https://www.arcuswear.store/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_products","arguments":{"query":"hoodie"}}}'
```

Discovery files:

```bash
curl https://www.arcuswear.store/.well-known/agent-card.json
curl https://www.arcuswear.store/llms.txt
```

### Run the end-to-end test locally

```bash
npm run test:agent
```

Drives the function exactly as Roam does (`initialize` → `tools/list` →
`tools/call`) against the live store and asserts a real product + a working
Shopify checkout URL come back (14 checks).
