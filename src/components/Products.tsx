import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import LongArrowLeft from './LongArrowLeft';
import logo from '../assets/arcus-wordmark.png';
import Menu from './Menu';
import Cart from './Cart';
import Logo3DAutoRotate from './Logo3DAutoRotate';
import BundlePopup from './BundlePopup';
import ProductSkeleton from './ProductSkeleton';
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
  const [autoRotateProduct, setAutoRotateProduct] = useState<{ [key: string]: boolean }>({});
  const [productRotations, setProductRotations] = useState<{ [key: string]: number }>({});
  const [hoveringButton, setHoveringButton] = useState<string | null>(null);
  const [clickingButton, setClickingButton] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
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

    // Generate microscopic random rotations for each product (0.1-0.3 degrees)
    const rotations: { [key: string]: number } = {};
    mockProducts.forEach((product) => {
      rotations[product.id] = (Math.random() * 0.2 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
    });
    setProductRotations(rotations);

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

  // Calculate logo tint color based on hover/click state
  const getLogoTint = () => {
    if (clickingButton) {
      return 'rgba(150, 200, 255, 0.7)'; // Strong blue tint on click
    }
    if (hoveringButton === 'back' || hoveringButton === 'cart' || hoveringButton === 'menu') {
      return 'rgba(120, 180, 255, 0.5)'; // More visible blue tint on button hover
    }
    return undefined;
  };

  return (
    <motion.div
      className="min-h-screen w-screen text-off-white relative"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, #1A1A1A 0%, #181818 60%, #161616 100%)'
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Header Bar */}
      <header
        className="fixed w-full z-50"
        style={{
          top: '0px',
          paddingTop: '32px',
          paddingBottom: '96px',
          background: 'linear-gradient(180deg, #1A1A1A 0%, rgba(26, 26, 26, 0.95) 70%, transparent 100%)'
        }}
      >
        <div className="relative w-full px-16 flex items-center justify-between">
          {/* Back button on left */}
          <button
            onClick={() => {
              setClickingButton(true);
              setTimeout(() => setClickingButton(false), 200);
              navigate('/');
            }}
            onMouseEnter={() => setHoveringButton('back')}
            onMouseLeave={() => setHoveringButton(null)}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            style={{ transform: 'translateX(20px)' }}
            aria-label="Back to home"
          >
            <LongArrowLeft className="w-8 h-6 text-off-white" />
          </button>


          {/* Logo centered - Absolute positioning for true centering */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer group"
            style={{ height: '80px', width: '180px' }}
            onClick={() => {
              setSpinTrigger(Date.now());
              setTimeout(() => {
                navigate('/');
              }, 500);
            }}
          >
            <Logo3DAutoRotate tintColor={getLogoTint()} spinTrigger={spinTrigger} />
          </div>

          {/* Cart and Menu buttons on right */}
          <div className="flex items-center gap-4" style={{ transform: 'translateX(-20px)' }}>
            {/* Cart Icon */}
            <button
              onClick={() => {
                setClickingButton(true);
                setTimeout(() => setClickingButton(false), 200);
                setCartOpen(true);
              }}
              onMouseEnter={() => setHoveringButton('cart')}
              onMouseLeave={() => setHoveringButton(null)}
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
              onClick={() => {
                setClickingButton(true);
                setTimeout(() => setClickingButton(false), 200);
                setMenuOpen(true);
              }}
              onMouseEnter={() => setHoveringButton('menu')}
              onMouseLeave={() => setHoveringButton(null)}
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

      {/* Subtle vignette - darkens edges */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0, 0, 0, 0.3) 100%)',
        }}
      />

      {/* Invisible Grid Structure - For intentional spacing */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="h-full w-full max-w-7xl mx-auto relative">
          {/* Vertical grid lines - barely visible */}
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-off-white/[0.02]" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-off-white/[0.03]" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-off-white/[0.02]" />

          {/* Center column emphasis - slightly more visible */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-off-white/[0.04] -ml-px" />

          {/* Subtle horizontal rhythm lines */}
          <div className="absolute left-0 right-0 top-1/3 h-px bg-off-white/[0.015]" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-off-white/[0.02]" />
          <div className="absolute left-0 right-0 top-2/3 h-px bg-off-white/[0.015]" />
        </div>
      </div>

      {/* Products Grid */}
      <main className="min-h-screen w-screen flex items-center justify-center px-6 relative z-10 py-24 md:py-0" style={{ transform: 'translateY(-30px)' }}>
        <div className="w-full flex flex-col items-center">
          {loading && (
            <div className="text-off-white/70">Loading products...</div>
          )}

          {error && (
            <div className="text-red-400">Error: {error}</div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 w-full max-w-4xl">
              {[1, 2, 3, 4].map((i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-off-white/70">No products found</div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 w-full max-w-4xl relative">
              {/* Align products to the invisible grid structure */}
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group relative"
                  style={{
                    transform: `rotate(${productRotations[product.id] || 0}deg)`
                  }}
                  onMouseEnter={() => handleMouseEnter(product.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Studio spotlight behind product - very subtle */}
                  <div
                    className="absolute -inset-32 pointer-events-none z-0"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(22, 22, 22, 0.15) 0%, transparent 70%)',
                      filter: 'blur(60px)',
                    }}
                  />

                  <div
                    className="aspect-[3/4] mb-16 overflow-hidden relative cursor-pointer z-10"
                    style={{ backgroundColor: 'transparent' }}
                    onClick={() => handleProductClick(product.handle)}
                  >
                    {/* Micro-shadow - ambient occlusion under shirt with faint blur on edges */}
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
                      style={{
                        width: '60%',
                        height: '8%',
                        background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.08) 0%, transparent 70%)',
                        filter: 'blur(8px) contrast(0.95)',
                        zIndex: 1,
                      }}
                    />
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
                      style={{
                        filter: 'contrast(0.98)',
                        textShadow: '0 0 0.5px rgba(245, 245, 240, 0.3), 0 0 1px rgba(245, 245, 240, 0.1)'
                      }}
                      onClick={() => handleProductClick(product.handle)}
                    >
                      {product.name}
                    </h3>
                    <span
                      className="text-off-white/70 mt-2"
                      style={{
                        filter: 'contrast(0.98)',
                        textShadow: '0 0 0.5px rgba(245, 245, 240, 0.2), 0 0 1px rgba(245, 245, 240, 0.08)'
                      }}
                    >
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bundle Deal Popup */}
      <BundlePopup />
    </motion.div>
  );
}