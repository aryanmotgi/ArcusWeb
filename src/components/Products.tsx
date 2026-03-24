import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import LongArrowLeft from './LongArrowLeft';
import Menu from './Menu';
import Cart from './Cart';
import Logo3DTransform from './Logo3DTransform';
import { useCart } from '../contexts/CartContext';
import { products as mockProducts } from '../data/products';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  backImage: string;
  imagePosition?: string;
  description: string;
  handle: string;
  isPreOrder?: boolean;
}

export default function Products() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(1); // Start on Arcus Set (middle product)
  const [hoveringButton, setHoveringButton] = useState<string | null>(null);
  const [clickingButton, setClickingButton] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const unicornContainerRef = useRef<HTMLDivElement>(null);
  const { getCartItemCount } = useCart();

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load products
  useEffect(() => {
    setLoading(true);
    setProducts(mockProducts);
    setLoading(false);
  }, []);

  // Initialize UnicornStudio on mount
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="unicornStudio"]');
    
    if (existingScript) {
      const u = (window as any).UnicornStudio;
      if (u && u.init) {
        u.init();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.3/dist/unicornStudio.umd.js';
    script.async = true;
    script.onload = () => {
      const u = (window as any).UnicornStudio;
      if (u && u.init) {
        u.init();
      }
    };
    document.body.appendChild(script);

    return () => {
      const u = (window as any).UnicornStudio;
      if (u && u.destroy) {
        u.destroy();
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex(prev => (prev - 1 + products.length) % products.length);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex(prev => (prev + 1) % products.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products.length]);

  // Scroll wheel navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) {
          setActiveIndex(prev => (prev + 1) % products.length);
        } else {
          setActiveIndex(prev => (prev - 1 + products.length) % products.length);
        }
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [products.length]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    const didDrag = Math.abs(info.offset.x) > threshold;
    
    if (didDrag) {
      setIsDragging(true);
      if (info.offset.x < -threshold) {
        setActiveIndex(prev => (prev + 1) % products.length);
      } else if (info.offset.x > threshold) {
        setActiveIndex(prev => (prev - 1 + products.length) % products.length);
      }
      // Reset dragging state after a short delay
      setTimeout(() => setIsDragging(false), 150);
    }
  };

  const handleProductClick = (productHandle: string) => {
    navigate(`/product/${productHandle}`);
  };

  const goToProduct = (index: number) => {
    setActiveIndex(index);
  };

  const getLogoTint = () => {
    if (clickingButton) return 'rgba(150, 200, 255, 0.7)';
    if (hoveringButton) return 'rgba(120, 180, 255, 0.5)';
    return undefined;
  };

  // Responsive dimensions
  const cardWidth = isMobile ? 260 : 280;
  const cardHeight = isMobile ? 400 : 420;
  const carouselRadius = isMobile ? 280 : 320;

  // Calculate carousel item positions
  const getItemStyle = (index: number) => {
    const totalItems = products.length;
    const anglePerItem = 360 / Math.max(totalItems, 3);
    const currentAngle = (index - activeIndex) * anglePerItem;
    
    let normalizedAngle = currentAngle % 360;
    if (normalizedAngle > 180) normalizedAngle -= 360;
    if (normalizedAngle < -180) normalizedAngle += 360;
    
    const isActive = index === activeIndex;
    const zOffset = Math.cos((normalizedAngle * Math.PI) / 180) * carouselRadius;
    const xOffset = Math.sin((normalizedAngle * Math.PI) / 180) * carouselRadius;
    const scale = isActive ? 1 : 0.65;
    const opacity = isActive ? 1 : 0.4;
    
    return {
      x: xOffset,
      z: zOffset,
      scale,
      opacity,
      zIndex: Math.round(zOffset + carouselRadius),
      blur: isActive ? 0 : 4,
    };
  };

  return (
    <motion.div
      ref={containerRef}
      className="min-h-screen w-screen text-off-white relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, #1A1A1A 0%, #181818 60%, #161616 100%)'
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* CSS to hide UnicornStudio watermark - Method 1: Hide link attribution */}
      <style>{`
        a[href*="unicorn.studio?utm_source=public-url"] {
          display: none !important;
        }
        a[href*="unicorn.studio"],
        a[href*="unicorn"],
        [data-us-project] a,
        [data-us-project] > div > a,
        [data-us-project] a[target="_blank"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* UnicornStudio Background */}
      <div 
        ref={unicornContainerRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ opacity: 0.25, width: '100vw', height: '100vh' }}
      >
        <div 
          data-us-project="YEazk7CI7OaMWbLeIPBw" 
          style={{ width: '100vw', height: '100vh' }}
        />
        {/* Method 2: Cover canvas attribution with solid overlay */}
        <div 
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: '80px', 
            background: '#1A1A1A',
            zIndex: 100
          }}
        />
      </div>

      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Header Bar */}
      <header
        className="fixed w-full z-50"
        style={{
          top: '0px',
          paddingTop: '32px',
          paddingBottom: '40px',
          background: 'linear-gradient(180deg, #1A1A1A 0%, rgba(26, 26, 26, 0.98) 60%, rgba(26, 26, 26, 0.7) 85%, transparent 100%)'
        }}
      >
        <div className="relative w-full flex items-center justify-between" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
          <button
            onClick={() => {
              setClickingButton(true);
              setTimeout(() => setClickingButton(false), 200);
              navigate('/');
            }}
            onMouseEnter={() => setHoveringButton('back')}
            onMouseLeave={() => setHoveringButton(null)}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            style={{ marginLeft: '16px' }}
            aria-label="Back to home"
          >
            <LongArrowLeft className="w-8 h-6 text-off-white -scale-y-100" />
          </button>

          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer group"
            style={{ height: '80px', width: '180px', perspective: '1000px', overflow: 'visible' }}
            onClick={() => {
              setSpinTrigger(Date.now());
              setTimeout(() => navigate('/'), 1200);
            }}
          >
            <Logo3DTransform tintColor={getLogoTint()} autoRotate={true} spinTrigger={spinTrigger} />
          </div>

          <div className="flex items-center gap-8">
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

            <button
              onClick={() => {
                setClickingButton(true);
                setTimeout(() => setClickingButton(false), 200);
                setMenuOpen(true);
              }}
              onMouseEnter={() => setHoveringButton('menu')}
              onMouseLeave={() => setHoveringButton(null)}
              className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex flex-col gap-1 w-5"
              style={{ marginRight: '16px' }}
              aria-label="Open menu"
            >
              <motion.div className="h-0.5 w-full bg-off-white" animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.3 }} />
              <motion.div className="h-0.5 w-full bg-off-white" animate={menuOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.3 }} />
              <motion.div className="h-0.5 w-full bg-off-white" animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.3 }} />
            </button>
          </div>
        </div>
      </header>

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0, 0, 0, 0.5) 70%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />
      
      {/* Ambient color spots */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at 10% 50%, rgba(100, 150, 255, 0.03) 0%, transparent 40%), radial-gradient(ellipse at 90% 50%, rgba(150, 100, 255, 0.03) 0%, transparent 40%)',
        }}
      />

      {/* Main 3D Carousel */}
      <main className="h-screen w-screen flex items-center justify-center relative z-10">
        {loading ? (
          <div className="text-off-white/50 text-xl uppercase tracking-widest">Loading...</div>
        ) : (
          <motion.div
            className="relative w-full h-full flex items-center justify-center"
            style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {/* 3D Carousel Container */}
            <div 
              className="relative flex items-center justify-center"
              style={{ 
                transformStyle: 'preserve-3d',
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
              }}
            >
              <AnimatePresence>
                {products.map((product, index) => {
                  const isActive = index === activeIndex;
                  const itemStyle = getItemStyle(index);
                  
                  return (
                    <motion.div
                      key={product.id}
                      className="absolute cursor-pointer"
                      style={{
                        width: `${cardWidth}px`,
                        transformStyle: 'preserve-3d',
                        zIndex: itemStyle.zIndex,
                        filter: `blur(${itemStyle.blur}px)`,
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: itemStyle.opacity,
                        scale: itemStyle.scale,
                        x: itemStyle.x,
                        z: itemStyle.z,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) {
                          setActiveIndex(index);
                        }
                      }}
                    >
                      {/* Product Card */}
                      <div 
                        className="relative overflow-hidden rounded-xl"
                        style={{
                          background: 'rgba(20, 20, 20, 0.6)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: isActive ? '2px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                          boxShadow: isActive 
                            ? '0 0 40px rgba(255, 255, 255, 0.2), 0 0 80px rgba(200, 200, 200, 0.15), 0 30px 60px rgba(0,0,0,0.5), 0 15px 30px rgba(0,0,0,0.4)' 
                            : '0 20px 40px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.3)',
                        }}
                      >
                        {/* Product Image */}
                        <div 
                          className={`${product.isPreOrder ? 'aspect-square' : 'aspect-[3/4]'} overflow-hidden relative`}
                          style={{
                            backgroundColor: product.isPreOrder ? '#e8e4e0' : 'transparent'
                          }}
                        >
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className={`w-full h-full ${product.isPreOrder ? 'object-contain' : 'object-cover'}`}
                          />
                          
                          {/* Gradient overlay */}
                          <div 
                            className="absolute inset-0"
                            style={{
                              background: 'linear-gradient(0deg, rgba(20,20,20,1) 0%, rgba(20,20,20,0.6) 25%, transparent 50%)',
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="p-4 md:p-6 text-center" style={{ marginTop: '-20px', position: 'relative', zIndex: 2 }}>
                          <h3 
                            className="text-xl md:text-2xl font-medium uppercase tracking-wider mb-2"
                            style={{
                              letterSpacing: '0.1em',
                              background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 20%, #FFFFFF 40%, #C0C0C0 60%, #E8E8E8 80%, #FFFFFF 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
                            }}
                          >
                            {product.name}
                          </h3>
                          
                          {/* Price with glow effect */}
                          <div className="flex items-center justify-center gap-2">
                            {product.originalPrice && (
                              <span 
                                className="text-lg md:text-xl font-bold text-off-white/40"
                                style={{
                                  textDecoration: 'line-through',
                                  textDecorationColor: 'rgba(239, 68, 68, 0.8)',
                                  textDecorationThickness: '2px'
                                }}
                              >
                                ${product.originalPrice.toFixed(0)}
                              </span>
                            )}
                            <div 
                              className="text-2xl md:text-3xl font-bold tracking-wide"
                              style={{
                                background: product.isPreOrder 
                                  ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)'
                                  : 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 20%, #FFFFFF 40%, #C0C0C0 60%, #E8E8E8 80%, #FFFFFF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                letterSpacing: '0.08em',
                                filter: product.isPreOrder
                                  ? 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.6)) drop-shadow(0 0 25px rgba(74, 222, 128, 0.4))'
                                  : 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 25px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 40px rgba(200, 200, 200, 0.3))',
                              }}
                            >
                              ${product.price.toFixed(0)}
                            </div>
                          </div>

                          {/* Shop Now / Pre-order button - only on active */}
                          {isActive && (
                            <motion.button
                              className="mt-4 md:mt-5 px-6 md:px-8 py-2 md:py-3 uppercase tracking-widest text-sm font-bold rounded-sm"
                              style={{
                                background: product.isPreOrder
                                  ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 30%, #16a34a 70%, #15803d 100%)'
                                  : 'linear-gradient(135deg, #E0E0E0 0%, #A8A8A8 20%, #F0F0F0 40%, #B0B0B0 60%, #D8D8D8 80%, #C0C0C0 100%)',
                                color: product.isPreOrder ? '#ffffff' : '#1A1A1A',
                                border: product.isPreOrder ? '1px solid rgba(74, 222, 128, 0.5)' : '1px solid rgba(255, 255, 255, 0.3)',
                                cursor: 'pointer',
                                boxShadow: product.isPreOrder
                                  ? '0 4px 20px rgba(74, 222, 128, 0.4), 0 0 40px rgba(74, 222, 128, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                  : '0 2px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                              }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              whileHover={{ 
                                scale: 1.05, 
                                boxShadow: product.isPreOrder
                                  ? '0 6px 30px rgba(74, 222, 128, 0.6), 0 0 50px rgba(74, 222, 128, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                                  : '0 0 25px rgba(200, 200, 200, 0.4), 0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                              }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(product.handle);
                              }}
                            >
                              {product.isPreOrder ? '🔥 Pre-order Now' : 'Shop Now'}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </main>

    </motion.div>
  );
}
