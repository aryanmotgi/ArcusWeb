import { executeQuery } from './client';
import { CREATE_CART } from './queries';
import { CartItem } from '../../contexts/CartContext';

interface CartCreateResponse {
  cartCreate: {
    cart: {
      id: string;
      checkoutUrl: string;
      totalQuantity: number;
      cost: {
        totalAmount: {
          amount: string;
          currencyCode: string;
        };
      };
    } | null;
    userErrors: {
      field: string[];
      message: string;
    }[];
  };
}

/**
 * Creates a Shopify cart from cart items and returns checkout URL
 * @param cartItems - Array of cart items to add to cart
 * @param returnUrl - Optional URL to redirect to after checkout completion
 * @returns The checkout URL or throws an error
 */
export async function createCheckout(
  cartItems: CartItem[],
  returnUrl?: string
): Promise<string> {
  if (cartItems.length === 0) {
    throw new Error('Cannot create checkout with empty cart');
  }

  // Convert cart items to Shopify cart line items format
  const lines = cartItems.map((item) => ({
    merchandiseId: item.variantId, // Should already be in GID format from Shopify
    quantity: item.quantity,
  }));

  // Prepare input for cartCreate mutation
  const input = {
    lines,
  };

  try {
    const data = await executeQuery<CartCreateResponse>(CREATE_CART, {
      input,
    });

    // Check for errors
    if (data.cartCreate.userErrors.length > 0) {
      const errors = data.cartCreate.userErrors
        .map((error) => error.message)
        .join(', ');
      throw new Error(`Cart creation failed: ${errors}`);
    }

    // Check if cart was created
    if (!data.cartCreate.cart) {
      throw new Error('Failed to create cart');
    }

    // Get the checkout URL
    let checkoutUrl = data.cartCreate.cart.checkoutUrl;

    // Append return URL as query parameter if provided
    // Shopify will redirect to this URL after successful checkout
    if (returnUrl) {
      const url = new URL(checkoutUrl);
      url.searchParams.set('return_to', returnUrl);
      checkoutUrl = url.toString();
    }

    // Return the checkout URL with return URL parameter
    return checkoutUrl;
  } catch (error) {
    console.error('Error creating cart/checkout:', error);
    throw error;
  }
}

/**
 * Helper function to format variant ID if needed
 * Shopify expects GID format: "gid://shopify/ProductVariant/123456789"
 */
export function formatVariantId(variantId: string): string {
  // If already in GID format, return as is
  if (variantId.startsWith('gid://')) {
    return variantId;
  }
  
  // Otherwise, assume it's just the numeric ID and format it
  // Note: This might not be needed if Shopify API already returns GIDs
  return `gid://shopify/ProductVariant/${variantId}`;
}

