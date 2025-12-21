// Product data with local images
// Using the actual image files from assets folder

// Import your product images
import arcusTeeFront from '../assets/arcusTeeFront.png';
import arcusTeeBack from '../assets/arcusTeeBack.png';
import allPathsTeeFront from '../assets/allPathsTeeFront.png';
import allPathsTeeBack from '../assets/allPathsTeeBack.png';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string; // Front image
  backImage: string; // Back image
  description: string;
  handle: string; // URL-friendly name
}

// Your products - 2 shirts only
export const products: Product[] = [
  {
    id: '1',
    name: 'ARCUS Tee',
    price: 17.00,
    image: arcusTeeFront,
    backImage: arcusTeeBack,
    description: 'Black t-shirt featuring the ARCUS logo',
    handle: 'arcus-tee'
  },
  {
    id: '2',
    name: 'Puff Print Tee',
    price: 20.00,
    image: allPathsTeeFront,
    backImage: allPathsTeeBack,
    description: 'Black t-shirt with "All Paths" puff print design in purple',
    handle: 'all-paths-puff-print-tee'
  },
];

