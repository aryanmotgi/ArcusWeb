// Product data with local images
// Using the actual image files from assets folder

// Import your product images
import arcusTeeChestFront from '../assets/C3BC1D50-1252-4886-ABD0-7D47C2A21B7A.PNG';
import arcusTeeBackLarge from '../assets/E3E9B683-88FB-4F3B-A42D-B8A815B24708.PNG';
import allPathsTeeChestFront from '../assets/223094EB-D0E8-444F-B007-981183524B75.PNG';
import allPathsTeeBackLarge from '../assets/3357396B-D316-4F31-B0AF-A7F060702ADB.PNG';
import setFront from '../assets/SetFront.png';
import setBack from '../assets/SetBack.png';
import arcusPantsTxt from '../assets/ArcusPantsTxt.png';
import hoodieFrontNew from '../assets/HoodieFront.png';
import pantsFront from '../assets/PantsFront.png';
import pantsBack from '../assets/PantsBack.png';
import hoodieBackNew from '../assets/Hoodieback.png';

export interface BundleItem {
  productId: string;
  name: string;
  variants: {
    S?: string;
    M?: string;
    L?: string;
    XL?: string;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // Original price for pre-order/sale display (crossed out)
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
  isPreOrder?: boolean; // Flag for pre-order items
  isBundle?: boolean; // Flag for bundle products
  bundleItems?: {
    hoodie?: BundleItem;
    sweatpants?: BundleItem;
  };
}

// Your products - ordered for carousel display
export const products: Product[] = [
  {
    id: 'gid://shopify/Product/10434439544997',
    name: 'ARCUS Tee',
    price: 20.00,
    image: arcusTeeChestFront,
    backImage: arcusTeeBackLarge,
    additionalImages: [],
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
    id: 'gid://shopify/Product/10510557544613',
    name: 'Arcus Set',
    price: 50.00,
    originalPrice: 65.00,
    image: setFront,
    backImage: setBack,
    additionalImages: [hoodieFrontNew, hoodieBackNew, pantsFront, pantsBack, arcusPantsTxt],
    description: 'The complete Arcus Set - Hoodie + Sweatpants bundle at a special pre-order price',
    handle: 'arcus-set',
    shopifyProductId: 'gid://shopify/Product/10510557544613',
    isBundle: true,
    bundleItems: {
      hoodie: {
        productId: 'gid://shopify/Product/10506306519205',
        name: 'Arcus Hoodie',
        variants: {
          S: 'gid://shopify/ProductVariant/47574866690213',
          M: 'gid://shopify/ProductVariant/47574866722981',
          L: 'gid://shopify/ProductVariant/47574866755749',
        }
      },
      sweatpants: {
        productId: 'gid://shopify/Product/10506306551973',
        name: 'Arcus Sweatpants',
        variants: {
          S: 'gid://shopify/ProductVariant/47574870524069',
          M: 'gid://shopify/ProductVariant/47574870556837',
          L: 'gid://shopify/ProductVariant/47574870589605',
        }
      }
    },
    shopifyVariants: {
      S: '',
      M: '',
      L: '',
      XL: '',
    },
    material: '100% Cotton',
    careInstructions: 'Machine wash cold with like colors. Tumble dry low. Do not bleach.',
    sizeGuide: 'Unisex sizing. True to size with a relaxed fit. Size up for an oversized look.',
    isPreOrder: true
  },
  {
    id: 'gid://shopify/Product/10434520613029',
    name: 'All Paths Tee',
    price: 17.00,
    image: allPathsTeeChestFront,
    backImage: allPathsTeeBackLarge,
    additionalImages: [],
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

