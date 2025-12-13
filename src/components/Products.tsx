import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import logo from 'figma:asset/ff5b86f92109795491adae82bfa15da8accc1415.png';
import allPathsBack from 'figma:asset/b9fcbcb977356b029bc24cbe8ddacf231511769c.png';
import allPathsFront from 'figma:asset/7d502c6c9f2b24601307a38b52465af931be6b8c.png';
import arcusTeeBack from 'figma:asset/2d4fa84f944baa8bee28bf776cbd073ade2daf43.png';
import arcusTeeFront from 'figma:asset/530d0d16fb4aefe091918da7659466cc0ab4f438.png';
import centerLogo from 'figma:asset/53d95e7fc22a39d2cf38bca1e2be78db23c51c97.png';
import { ArrowLeft } from 'lucide-react';
import Menu from './Menu';
import MenuButton from './MenuButton';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  backImage: string;
  imagePosition?: string;
  description: string;
}

const products: Product[] = [
  {
    id: 2,
    name: 'Purple puff tee',
    price: 25,
    image: allPathsBack,
    backImage: allPathsFront,
    description: 'Exclusive purple puff print design on high-quality fabric. Bold statement piece that embodies the Arcus philosophy.'
  },
  {
    id: 1,
    name: 'Arcus tee',
    price: 20,
    image: arcusTeeBack,
    backImage: arcusTeeFront,
    description: 'Premium cotton t-shirt featuring the ARCUS logo. Comfortable fit with a modern streetwear aesthetic. All paths lead to Arcus.'
  }
];

export default function Products() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [autoRotateProduct, setAutoRotateProduct] = useState<{[key: number]: boolean}>({});
  const navigate = useNavigate();
  const hoverTimeoutRef = useRef<number | null>(null);
  const autoRotateIntervalRef = useRef<{[key: number]: number}>({});

  // Detect if device is touch-enabled (mobile)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Auto-rotate images on mobile every 3 seconds
  useEffect(() => {
    if (isTouchDevice) {
      products.forEach((product) => {
        autoRotateIntervalRef.current[product.id] = window.setInterval(() => {
          setAutoRotateProduct(prev => ({
            ...prev,
            [product.id]: !prev[product.id]
          }));
        }, 3000);
      });

      return () => {
        Object.values(autoRotateIntervalRef.current).forEach(interval => {
          clearInterval(interval);
        });
      };
    }
  }, [isTouchDevice]);

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const handleMouseEnter = (productId: number) => {
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
    <div className="min-h-screen w-screen text-off-white relative" style={{ backgroundColor: '#1A1A1A' }}>
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      {/* Header */}
      <header className="fixed top-0 w-full backdrop-blur-sm border-b border-off-white/5 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
        <div className="px-6 py-6 flex items-center justify-between">
          <Link to="/" className="text-off-white/70 hover:text-off-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link to="/" className="flex-1 flex justify-center">
            <img 
              src={logo} 
              alt="ARCUS" 
              className="h-8 brightness-0 invert opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
            />
          </Link>
          <button 
            onClick={() => setMenuOpen(true)}
            className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex flex-col gap-1 w-5"
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
      </header>

      {/* Products Grid */}
      <main className="min-h-screen w-screen flex items-center justify-center px-6 relative z-10 py-24 md:py-0" style={{ transform: 'translateY(-30px)' }}>
        <div className="w-full flex flex-col items-center">
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
                  onClick={() => handleProductClick(product.id)}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={(isTouchDevice ? autoRotateProduct[product.id] : hoveredProduct === product.id) ? 'back' : 'front'}
                      src={(isTouchDevice ? autoRotateProduct[product.id] : hoveredProduct === product.id) ? product.image : product.backImage}
                      alt={product.name}
                      className="w-full h-full object-cover absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ 
                        objectPosition: 'center center',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        transform: (isTouchDevice ? autoRotateProduct[product.id] : hoveredProduct === product.id) ? 'translateY(0)' : 'translateY(30px)'
                      }}
                    />
                  </AnimatePresence>
                </div>
                <div className="text-center flex items-center justify-center gap-3">
                  <h3 
                    className="text-off-white tracking-wide uppercase cursor-pointer hover:text-off-white/70 transition-colors whitespace-nowrap"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {product.name}
                  </h3>
                  <span className="text-off-white/70">${product.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}