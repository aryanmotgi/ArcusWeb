import { CartItem } from '../../contexts/CartContext';

/**
 * Creates a direct Shopify checkout URL from cart items
 * Uses Shopify's permalink format - no API needed
 */
export async function createCheckout(
  cartItems: CartItem[],
  returnUrl?: string
): Promise<string> {
  if (cartItems.length === 0) {
    throw new Error('Cannot create checkout with empty cart');
  }

  // Store domain
  const storeDomain = 'arcuswear.myshopify.com';

  // Build the cart URL with variant IDs and quantities
  // Format: /cart/VARIANT_ID:QUANTITY,VARIANT_ID:QUANTITY
  const cartItems_formatted = cartItems.map((item) => {
    // Extract numeric variant ID from GID format
    // "gid://shopify/ProductVariant/47574866690213" -> "47574866690213"
    let variantId = item.variantId;
    if (variantId.startsWith('gid://')) {
      const parts = variantId.split('/');
      variantId = parts[parts.length - 1];
    }
    return `${variantId}:${item.quantity}`;
  });

  const cartPath = cartItems_formatted.join(',');
  
  // This URL adds items to cart and shows the cart
  const checkoutUrl = `https://${storeDomain}/cart/${cartPath}`;
  
  console.log('Checkout URL:', checkoutUrl);
  
  return checkoutUrl;
}
