import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import allPathsBack from '../assets/b9fcbcb977356b029bc24cbe8ddacf231511769c.png';
import allPathsFront from '../assets/7d502c6c9f2b24601307a38b52465af931be6b8c.png';
import arcusTeeBack from '../assets/2d4fa84f944baa8bee28bf776cbd073ade2daf43.png';
import arcusTeeFront from '../assets/530d0d16fb4aefe091918da7659466cc0ab4f438.png';
import logo from '../assets/arcus-wordmark.png';
import Menu from './Menu';

const productsData = {
  '1': {
    name: 'Arcus Tee',
    price: '$20.00',
    color: 'Black',
    image: arcusTeeBack,
    features: [
      '100% Premium Cotton',
      'Screen Printed Logo'
    ]
  },
  '2': {
    name: 'Purple Puff Tee',
    price: '$25.00',
    color: 'Black',
    image: allPathsBack,
    features: [
      '100% Premium Cotton',
      'Puff Printed Graphics'
    ]
  }
};

const sizeNames: { [key: string]: string } = {
  '1': 'Small',
  '2': 'Medium',
  '3': 'Large'
};

const productViews: { [key: string]: Array<{ id: number; label: string; image: string }> } = {
  '1': [
    { id: 1, label: 'Front', image: arcusTeeFront },
    { id: 2, label: 'Back', image: arcusTeeBack },
  ],
  '2': [
    { id: 1, label: 'Front', image: allPathsFront },
    { id: 2, label: 'Back', image: allPathsBack },
  ]
};

const sizes = ['S', 'M', 'L'];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const product = productsData[id as keyof typeof productsData];
  const sizeParam = searchParams.get('size');
  
  // Get the display name with size prefix if size is provided
  const displayName = sizeParam && sizeNames[sizeParam] 
    ? `${sizeNames[sizeParam]} ${product?.name}` 
    : product?.name;

  if (!product) {
    return <div>Product not found</div>;
  }

  // Get product views for current product
  const currentProductViews = productViews[id || '1'] || productViews['1'];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const nextImage = () => {
    setCurrentView((prev) => (prev + 1) % currentProductViews.length);
  };

  const prevImage = () => {
    setCurrentView((prev) => (prev - 1 + currentProductViews.length) % currentProductViews.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, currentProductViews.length]);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
  };

  return (
    <motion.div 
      className="min-h-screen w-screen text-off-white relative overflow-hidden" 
      style={{ backgroundColor: '#1A1A1A' }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      {/* Header Bar */}
      <header className="fixed top-0 w-full z-50 py-8" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="w-full px-16 flex items-center justify-between">
          {/* Back button on left */}
          <button
            onClick={() => navigate('/products')}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            style={{ transform: 'translateX(20px)' }}
            aria-label="Back to products"
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
          
          {/* Menu button on right */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex flex-col gap-1 w-5"
            style={{ transform: 'translateX(-20px)' }}
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
      </header>

      {/* Product Detail */}
      <main className="px-12 md:px-16 min-h-screen flex items-center justify-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center justify-items-center">
            {/* Left Side - Images */}
            <div className="flex gap-3 items-center justify-center">
              {/* Thumbnail Images - Vertical Column on Left */}
              <div className="flex flex-col gap-2">
                {currentProductViews.map((view, index) => (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(index)}
                    className={`w-12 aspect-[3/4] overflow-hidden border transition-all duration-300 ${
                      currentView === index
                        ? 'border-off-white'
                        : 'border-off-white/20 hover:border-off-white/40'
                    }`}
                    style={{ backgroundColor: '#1A1A1A' }}
                  >
                    <img
                      src={view.image}
                      alt={view.label}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: 'center center' }}
                    />
                  </button>
                ))}
              </div>

              {/* Main Image */}
              <div 
                className="aspect-[3/4] overflow-hidden border border-off-white/30 border-t-2 border-t-off-white/50 relative group" 
                style={{ backgroundColor: '#1A1A1A', width: '400px' }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  src={currentProductViews[currentView].image}
                  alt={currentProductViews[currentView].label}
                  className="w-full h-full object-cover"
                  style={{ 
                    objectPosition: 'center center',
                    ...(currentView === 0 && {
                      transform: 'translateY(30px)'
                    })
                  }}
                />
                
                {/* Navigation Arrow */}
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-off-white hover:text-off-white/80 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-10"
                >
                  <ChevronRight className="w-12 h-12" />
                </button>
              </div>
            </div>

            {/* Right Side - Product Info */}
            <div className="space-y-8 flex flex-col justify-center max-w-md">
              {/* Title and Price */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h1 className={`tracking-wider uppercase text-4xl ${id === '2' ? 'whitespace-normal lg:whitespace-nowrap' : 'whitespace-nowrap'}`}>{displayName}</h1>
                <p className="text-off-white/70">{product.price}</p>
              </div>

              {/* Product Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }} className="text-off-white/60 uppercase tracking-wide">
                {product.features.map((feature, index) => (
                  <p key={index}>{feature}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}