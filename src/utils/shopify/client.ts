import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Get credentials from environment variables
const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

// Validate that credentials are set
if (!storeDomain) {
  throw new Error('VITE_SHOPIFY_STORE_DOMAIN is not set in environment variables');
}

if (!storefrontAccessToken) {
  throw new Error('VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set in environment variables');
}

// Create and export the Shopify Storefront API client
export const shopifyClient = createStorefrontApiClient({
  storeDomain,
  apiVersion: '2024-10',
  publicAccessToken: storefrontAccessToken,
});

// Helper function to execute GraphQL queries
export async function executeQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
  try {
    const response = await shopifyClient.request(query, {
      variables: variables || {},
    });

    // Check for network-level errors (like 402 Payment Required)
    if (response.errors) {
      const error = response.errors[0];
      const networkStatusCode = (error as any)?.networkStatusCode;

      if (networkStatusCode === 402) {
        throw new Error(
          'Shopify store is frozen due to outstanding balance. Please log in to your Shopify admin and settle any unpaid invoices in the Billing section.'
        );
      }

      throw new Error(`Shopify API Error: ${JSON.stringify(response.errors)}`);
    }

    return response.data as T;
  } catch (error: any) {
    // Handle network errors
    if (error?.networkStatusCode === 402) {
      throw new Error(
        'Shopify store is frozen due to outstanding balance. Please log in to your Shopify admin and settle any unpaid invoices in the Billing section.'
      );
    }

    // Re-throw if it's already a formatted error
    if (error instanceof Error) {
      throw error;
    }

    // Otherwise, throw a generic error
    throw new Error(`Shopify API Error: ${JSON.stringify(error)}`);
  }
}

