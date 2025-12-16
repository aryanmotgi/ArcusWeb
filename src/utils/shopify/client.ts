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
  const response = await shopifyClient.request(query, {
    variables: variables || {},
  });

  if (response.errors) {
    throw new Error(`Shopify API Error: ${JSON.stringify(response.errors)}`);
  }

  return response.data as T;
}

