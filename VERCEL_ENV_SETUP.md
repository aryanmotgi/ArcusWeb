# Vercel Environment Variables Setup

## Phase 7.2: Add Shopify Credentials to Vercel

To make your Shopify integration work on your deployed site, you need to add the same environment variables to your Vercel project.

## Steps to Add Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Click on your **Arcus** project (or whatever you named it)

3. **Navigate to Settings**
   - Click on **Settings** in the top navigation
   - Click on **Environment Variables** in the left sidebar

4. **Add Environment Variables**
   - Click **Add New** or the **+** button
   - Add each variable one at a time:

   **Variable 1:**
   - **Name:** `VITE_SHOPIFY_STORE_DOMAIN`
   - **Value:** `arcus-9752.myshopify.com`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

   **Variable 2:**
   - **Name:** `VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   - **Value:** `f36ce69e0cb56a46362b5fa20eaa1e1d`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

5. **Redeploy Your Site**
   - After adding the variables, you need to trigger a new deployment
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on your latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic deployment

## Verification

After redeploying:
1. Visit your deployed site: `https://arcuswear.store`
2. Navigate to the products page
3. Products should load from Shopify (instead of showing "Loading products...")
4. You should be able to add items to cart and checkout

## Important Notes

- **Never commit these values to Git** - They're already in `.gitignore`
- **Keep these values secure** - Don't share them publicly
- **Environment variables are case-sensitive** - Make sure to use exact names
- **Redeploy required** - Changes to environment variables require a new deployment to take effect

## Troubleshooting

If products aren't loading after deployment:
1. Check that environment variables are set correctly in Vercel
2. Verify the variable names match exactly (including `VITE_` prefix)
3. Make sure you selected all environments (Production, Preview, Development)
4. Trigger a new deployment after adding variables
5. Check Vercel deployment logs for any errors

## Quick Copy-Paste Values

For easy setup, here are the exact values:

```
VITE_SHOPIFY_STORE_DOMAIN=arcus-9752.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=f36ce69e0cb56a46362b5fa20eaa1e1d
```

