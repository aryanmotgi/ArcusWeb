import { ChevronDown, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/arcus-wordmark.png';
import Menu from './Menu';
import Cart from './Cart';
import { executeQuery } from '../utils/shopify/client';
import { GET_PRODUCT_BY_HANDLE } from '../utils/shopify/queries';
import { ShopifyProductResponse, ShopifyProduct } from '../types/shopify';
import { useCart } from '../contexts/CartContext';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>(); // This is now the product handle
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const { addToCart, getCartItemCount } = useCart();
  
  // Touch swipe support - MUST be at the top with all other hooks
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Fetch product from Shopify
  useEffect(() => {
    async function fetchProduct() {
      if (!id) {
        setError('Product handle not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await executeQuery<ShopifyProductResponse>(GET_PRODUCT_BY_HANDLE, { handle: id });
        
        if (!data.product) {
          setError('Product not found');
          setLoading(false);
          return;
        }

        setProduct(data.product);
        
        // Set default selected variant (first available variant)
        const firstAvailableVariant = data.product.variants.edges.find(
          edge => edge.node.availableForSale
        );
        if (firstAvailableVariant) {
          setSelectedVariantId(firstAvailableVariant.node.id);
          // Extract size from variant title (e.g., "Small", "Medium", "Large")
          const sizeOption = firstAvailableVariant.node.selectedOptions.find(
            opt => opt.name.toLowerCase() === 'size'
          );
          if (sizeOption) {
            setSelectedSize(sizeOption.value);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  // Get product views from Shopify images - MUST be computed before useEffect that uses it
  const productViews = useMemo(() => {
    return product ? product.images.edges.map((edge, index) => ({
      id: index + 1,
      label: index === 0 ? 'Front' : index === 1 ? 'Back' : `View ${index + 1}`,
      image: edge.node.url
    })) : [];
  }, [product]);

  // Keyboard navigation - MUST be before any conditional returns
  useEffect(() => {
    if (productViews.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentView((prev) => (prev + 1) % productViews.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentView((prev) => (prev - 1 + productViews.length) % productViews.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, productViews.length]);

  // Get available sizes from variants
  const availableSizes = product ? product.variants.edges
    .filter(edge => edge.node.availableForSale)
    .map(edge => {
      const sizeOption = edge.node.selectedOptions.find(opt => opt.name.toLowerCase() === 'size');
      return {
        value: sizeOption?.value || edge.node.title,
        variantId: edge.node.id,
        available: edge.node.availableForSale,
        quantity: edge.node.quantityAvailable
      };
    })
    .filter((size, index, self) => 
      index === self.findIndex(s => s.value === size.value)
    ) : [];

  // Handle size selection
  const handleSizeSelect = (sizeValue: string) => {
    setSelectedSize(sizeValue);
    // Find the variant ID for this size
    const variant = product?.variants.edges.find(edge => {
      const sizeOption = edge.node.selectedOptions.find(opt => opt.name.toLowerCase() === 'size');
      return sizeOption?.value === sizeValue && edge.node.availableForSale;
    });
    if (variant) {
      setSelectedVariantId(variant.node.id);
    }
  };

  // Get selected variant
  const selectedVariant = product?.variants.edges.find(
    edge => edge.node.id === selectedVariantId
  )?.node;

  // Get price from selected variant or product price range
  const price = selectedVariant 
    ? parseFloat(selectedVariant.price.amount)
    : product 
    ? parseFloat(product.priceRange.minVariantPrice.amount)
    : 0;

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen w-screen text-off-white relative overflow-hidden" 
        style={{ backgroundColor: '#1A1A1A' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-off-white/70">Loading product...</div>
        </div>
      </motion.div>
    );
  }

  if (error || !product) {
    return (
      <motion.div 
        className="min-h-screen w-screen text-off-white relative overflow-hidden" 
        style={{ backgroundColor: '#1A1A1A' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-400">Error: {error || 'Product not found'}</div>
        </div>
      </motion.div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const nextImage = () => {
    if (productViews.length > 0) {
      setCurrentView((prev) => (prev + 1) % productViews.length);
    }
  };

  const prevImage = () => {
    if (productViews.length > 0) {
      setCurrentView((prev) => (prev - 1 + productViews.length) % productViews.length);
    }
  };

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
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      
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

      {/* Product Detail */}
      <main className="px-12 md:px-16 min-h-screen flex items-center justify-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center justify-items-center">
            {/* Left Side - Images */}
            <div className="flex gap-3 items-center justify-center">
              {/* Thumbnail Images - Vertical Column on Left */}
              {productViews.length > 0 && (
                <div className="flex flex-col gap-2">
                  {productViews.map((view, index) => (
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
              )}

              {/* Main Image */}
              {productViews.length > 0 && (
                <div 
                  className="overflow-hidden border border-off-white/30 border-t-2 border-t-off-white/50 relative group flex-shrink-0" 
                  style={{ 
                    backgroundColor: '#1A1A1A', 
                    width: '400px',
                    height: '533px',
                    aspectRatio: '3/4'
                  }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentView}
                      src={productViews[currentView].image}
                      alt={productViews[currentView].label}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ 
                        objectPosition: 'center center'
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </AnimatePresence>
                
                  {/* Navigation Arrow */}
                  {productViews.length > 1 && (
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-off-white hover:text-off-white/80 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-10"
                    >
                      <ChevronRight className="w-12 h-12" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Side - Product Info */}
            <div className="space-y-8 flex flex-col justify-center max-w-md">
              {/* Title and Price */}
              <div className="flex flex-col">
                <h1 className="tracking-wider uppercase text-4xl whitespace-nowrap">{product.title}</h1>
                <p className="text-off-white/70 mt-5">${price.toFixed(2)}</p>
              </div>

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div className="flex flex-col gap-3">
                  <label className="text-off-white/70 uppercase tracking-wide text-sm">Size</label>
                  <div className="flex gap-3">
                    {availableSizes.map((size) => (
                      <button
                        key={size.variantId}
                        onClick={() => handleSizeSelect(size.value)}
                        className={`px-6 py-2 border transition-all ${
                          selectedSize === size.value
                            ? 'border-off-white bg-off-white/10'
                            : 'border-off-white/30 hover:border-off-white/60'
                        } ${!size.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={!size.available}
                      >
                        <span className="text-off-white uppercase tracking-wide">{size.value}</span>
                      </button>
                    ))}
                  </div>
                  {selectedVariant && selectedVariant.quantityAvailable <= 5 && selectedVariant.quantityAvailable > 0 && (
                    <p className="text-off-white/50 text-sm">Only {selectedVariant.quantityAvailable} left in stock</p>
                  )}
                  {selectedVariant && !selectedVariant.availableForSale && (
                    <p className="text-red-400 text-sm">Out of stock</p>
                  )}
                </div>
              )}

              {/* Product Description */}
              {product.description && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="text-off-white/60 uppercase tracking-wide">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Add to Cart Button - Coming Soon (Disabled) */}
              <button
                disabled={true}
                className="px-8 py-4 bg-off-white/30 text-off-white/50 uppercase tracking-wide cursor-not-allowed border border-off-white/20 relative"
              >
                Coming Soon...
              </button>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}