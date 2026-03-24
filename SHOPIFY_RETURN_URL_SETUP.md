# Shopify Return URL Configuration

## Phase 5.3: Configure Return URL

After a customer completes checkout on Shopify, they should be redirected back to your site's thank you page.

## Method 1: Shopify Admin Settings (Recommended)

1. Go to your Shopify Admin: https://arcus-9752.myshopify.com/admin
2. Navigate to: **Settings** → **Checkout**
3. Scroll down to **"Order status page"** section
4. Look for **"Additional scripts"** or **"Order status page customization"**
5. If available, set the redirect URL to: `https://arcuswear.store/thank-you`

**Note:** The exact location of this setting may vary depending on your Shopify plan. If you can't find it, use Method 2.

## Method 2: Checkout URL Parameter (Already Implemented)

We've already implemented this in the code! The checkout utility automatically appends the return URL as a query parameter when creating the checkout.

The return URL (`https://arcuswear.store/thank-you`) is automatically added to the checkout URL.

## Verification

After configuration:
1. Add items to cart
2. Click "Checkout"
3. Complete a test purchase on Shopify
4. After payment, you should be redirected to `https://arcuswear.store/thank-you`

## Troubleshooting

If customers aren't being redirected:
- Check that the `/thank-you` route exists in your app (Phase 6)
- Verify the return URL is correctly formatted
- Check Shopify checkout settings for any redirect restrictions

