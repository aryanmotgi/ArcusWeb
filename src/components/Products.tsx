import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import logo from '../assets/arcus-wordmark.png';
import Menu from './Menu';
import Cart from './Cart';
// import { executeQuery } from '../utils/shopify/client';
// import { GET_PRODUCTS } from '../utils/shopify/queries';
// import { ShopifyProductsResponse } from '../types/shopify';
import { useCart } from '../contexts/CartContext';
import { products as mockProducts } from '../data/products';

interface Product {
  id: string; // Changed to string to match Shopify IDs
  name: string;
  price: number;
  image: string;
  backImage: string;
  imagePosition?: string;
  description: string;
  handle: string; // Shopify handle for navigation
}

export default function Products() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [autoRotateProduct, setAutoRotateProduct] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();
  const hoverTimeoutRef = useRef<number | null>(null);
  const autoRotateIntervalRef = useRef<Record<string, number>>({});
  const { getCartItemCount } = useCart();

  // Detect if device is touch-enabled (mobile)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Load products from local data
  useEffect(() => {
    setLoading(true);
    setProducts(mockProducts);
    setLoading(false);
  }, []);

  // Auto-rotate images on mobile every 3 seconds
  useEffect(() => {
    if (isTouchDevice && products.length > 0) {
      products.forEach((product) => {
        autoRotateIntervalRef.current[product.id] = window.setInterval(() => {
          setAutoRotateProduct(prev => ({
            ...prev,
            [product.id]: !prev[product.id]
          }));
        }, 3000);
      });

      return () => {
        Object.values(autoRotateIntervalRef.current).forEach((intervalId) => {
          clearInterval(intervalId);
        });
      };
    }
  }, [isTouchDevice, products]);

  const handleProductClick = (productHandle: string) => {
    navigate(`/product/${productHandle}`);
  };

  const handleMouseEnter = (productId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredProduct(productId);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredProduct(null);
  };

  return (
    <motion.div 
      className="min-h-screen w-screen text-off-white relative" 
      style={{ backgroundColor: '#1A1A1A' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      
      {/* Header Bar */}
      <header className="fixed top-0 w-full z-50 py-8" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="w-full px-16 flex items-center justify-between">
          {/* Back button on left */}
          <button
            onClick={() => navigate('/')}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            style={{ transform: 'translateX(20px)' }}
            aria-label="Back to home"
          >
            <ChevronLeft className="w-6 h-6 text-off-white" />
          </button>
          
          {/* Logo centered */}
          <div className="flex items-center">
            <img 
              src={logo} 
              alt="ARCUS" 
              className="brightness-0 invert opacity-90"
              style={{ height: '72px' }}
            />
          </div>
          
          {/* Cart and Menu buttons on right */}
          <div className="flex items-center gap-4" style={{ transform: 'translateX(-20px)' }}>
            {/* Cart Icon */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-6 h-6 text-off-white" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-off-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
            
            {/* Menu button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex flex-col gap-1 w-5"
              aria-label="Open menu"
            >
              <motion.div
                className="h-0.5 w-full bg-off-white"
                animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="h-0.5 w-full bg-off-white"
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="h-0.5 w-full bg-off-white"
                animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="min-h-screen w-screen flex items-center justify-center px-6 relative z-10 py-24 md:py-0" style={{ transform: 'translateY(-30px)' }}>
        <div className="w-full flex flex-col items-center">
          {loading && (
            <div className="text-off-white/70">Loading products...</div>
          )}
          
          {error && (
            <div className="text-red-400">Error: {error}</div>
          )}
          
          {!loading && !error && products.length === 0 && (
            <div className="text-off-white/70">No products found</div>
          )}
          
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 w-full max-w-4xl">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="group"
                  onMouseEnter={() => handleMouseEnter(product.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div 
                    className="aspect-[3/4] mb-16 overflow-hidden relative cursor-pointer" 
                    style={{ backgroundColor: '#1A1A1A' }}
                    onClick={() => handleProductClick(product.handle)}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={(isTouchDevice ? autoRotateProduct[product.id] : hoveredProduct === product.id) ? 'back' : 'front'}
                        src={(isTouchDevice ? autoRotateProduct[product.id] : hoveredProduct === product.id) ? product.image : product.backImage}
                        alt={product.name}
                        className="w-full h-full object-cover absolute"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ 
                          objectPosition: 'center center',
                          left: 0,
                          width: '100%',
                          top: 0,
                          height: '100%'
                        }}
                      />
                    </AnimatePresence>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <h3 
                      className="text-off-white tracking-wide uppercase cursor-pointer hover:text-off-white/70 transition-colors whitespace-nowrap"
                      onClick={() => handleProductClick(product.handle)}
                    >
                      {product.name}
                    </h3>
                    <span className="text-off-white/70 mt-2">${product.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}