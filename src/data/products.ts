// Product data with local images
// Using the actual image files from assets folder

// Import your product images
import arcusTeeFront from '../assets/arcusTeeOriginalFront.png';
import arcusTeeBack from '../assets/arcusTeeOriginalBack.png';
import arcusTeeChestFront from '../assets/C3BC1D50-1252-4886-ABD0-7D47C2A21B7A.PNG';
import arcusTeeBackLarge from '../assets/E3E9B683-88FB-4F3B-A42D-B8A815B24708.PNG';
import allPathsTeeFront from '../assets/allPathsTeeFront.png';
import allPathsTeeBack from '../assets/allPathsTeeBack.png';
import allPathsTeeChestFront from '../assets/223094EB-D0E8-444F-B007-981183524B75.PNG';
import allPathsTeeBackLarge from '../assets/3357396B-D316-4F31-B0AF-A7F060702ADB.PNG';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string; // Front image
  backImage: string; // Back image
  additionalImages?: string[]; // Additional product images
  description: string;
  handle: string; // URL-friendly name
  shopifyProductId: string; // Shopify Product GID
  shopifyVariants: {
    S: string;
    M: string;
    L: string;
    XL: string;
  };
  material?: string; // Fabric composition
  careInstructions?: string; // Washing/care guidelines
  sizeGuide?: string; // Sizing info and fit description
}

// Your products - 2 shirts only with real Shopify IDs
export const products: Product[] = [
  {
    id: 'gid://shopify/Product/10434439544997',
    name: 'ARCUS Tee',
    price: 17.00,
    image: arcusTeeFront,
    backImage: arcusTeeBack,
    additionalImages: [arcusTeeChestFront, arcusTeeBackLarge],
    description: 'Black t-shirt featuring the ARCUS logo',
    handle: 'arcus-tee',
    shopifyProductId: 'gid://shopify/Product/10434439544997',
    shopifyVariants: {
      S: 'gid://shopify/ProductVariant/47333038456997',
      M: 'gid://shopify/ProductVariant/47333038489765',
      L: 'gid://shopify/ProductVariant/47333038522533',
      XL: 'gid://shopify/ProductVariant/47333038555301',
    },
    material: '100% Cotton',
    careInstructions: 'Machine wash cold with like colors. Tumble dry low. Do not bleach. Do not iron directly on design.',
    sizeGuide: 'Unisex sizing. True to size with a relaxed fit. Size up for an oversized look.'
  },
  {
    id: 'gid://shopify/Product/10434520613029',
    name: 'All Paths Tee',
    price: 20.00,
    image: allPathsTeeFront,
    backImage: allPathsTeeBack,
    additionalImages: [allPathsTeeChestFront, allPathsTeeBackLarge],
    description: 'Black t-shirt with "All Paths" puff print design in purple',
    handle: 'all-paths-tee',
    shopifyProductId: 'gid://shopify/Product/10434520613029',
    shopifyVariants: {
      S: 'gid://shopify/ProductVariant/47333025153189',
      M: 'gid://shopify/ProductVariant/47333025185957',
      L: 'gid://shopify/ProductVariant/47333025218725',
      XL: 'gid://shopify/ProductVariant/47333025251493',
    },
    material: '100% Cotton',
    careInstructions: 'Machine wash cold with like colors. Tumble dry low. Do not bleach. Do not iron directly on puff print design.',
    sizeGuide: 'Unisex sizing. True to size with a relaxed fit. Size up for an oversized look.'
  },
];

