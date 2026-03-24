// Shopify client - not used (using direct checkout URLs instead)
export const shopifyClient = null;

export async function executeQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
  throw new Error('Not implemented - using direct checkout URLs');
}
