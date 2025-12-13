import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import logo from 'figma:asset/ff5b86f92109795491adae82bfa15da8accc1415.png';
import allPathsBack from 'figma:asset/b9fcbcb977356b029bc24cbe8ddacf231511769c.png';
import allPathsFront from 'figma:asset/7d502c6c9f2b24601307a38b52465af931be6b8c.png';
import arcusTeeBack from 'figma:asset/2d4fa84f944baa8bee28bf776cbd073ade2daf43.png';
import arcusTeeFront from 'figma:asset/530d0d16fb4aefe091918da7659466cc0ab4f438.png';
import Menu from './Menu';
import MenuButton from './MenuButton';

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
    <div className="min-h-screen w-screen text-off-white relative overflow-hidden" style={{ backgroundColor: '#1A1A1A' }}>
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      {/* Header */}
      <header className="fixed top-0 w-full backdrop-blur-sm border-b border-off-white/5 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
        <div className="px-6 py-6 flex items-center justify-between">
          <Link to="/collection" className="text-off-white/70 hover:text-off-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link to="/" className="flex-1 flex justify-center">
            <img 
              src={logo} 
              alt="ARCUS" 
              className="h-8 brightness-0 invert opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
            />
          </Link>
          <MenuButton onClick={() => setMenuOpen(true)} />
        </div>
      </header>

      {/* Product Detail */}
      <main className="pt-24 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left Side - Images */}
            <div className="space-y-6" style={{ transform: 'translate(10px, 25px)' }}>
              {/* Main Image */}
              <div 
                className="aspect-[3/4] max-h-[75vh] overflow-hidden border border-off-white/30 border-t-2 border-t-off-white/50 relative group" 
                style={{ backgroundColor: '#1A1A1A' }}
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-off-white hover:text-off-white/80 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                >
                  <ChevronRight className="w-12 h-12" />
                </button>
              </div>

              {/* Thumbnail Images */}
              <div className="grid grid-cols-4 gap-4">
                {currentProductViews.map((view, index) => (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(index)}
                    className={`aspect-[3/4] overflow-hidden border transition-all duration-300 ${
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
            </div>

            {/* Right Side - Product Info */}
            <div className="space-y-24 flex flex-col justify-center max-w-md">
              {/* Title and Price */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
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
    </div>
  );
}