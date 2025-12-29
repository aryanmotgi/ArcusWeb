import { ChevronDown, ChevronRight, ShoppingBag } from 'lucide-react';
import LongArrowLeft from './LongArrowLeft';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/arcus-wordmark.png';
import Menu from './Menu';
import Cart from './Cart';
import Logo3DAutoRotate from './Logo3DAutoRotate';
import BundlePopup from './BundlePopup';
import SizeHelper from './SizeHelper';
import ScrollProgress from './ScrollProgress';
// import { executeQuery } from '../utils/shopify/client';
// import { GET_PRODUCT_BY_HANDLE } from '../utils/shopify/queries';
import { ShopifyProductResponse, ShopifyProduct } from '../types/shopify';
import { useCart } from '../contexts/CartContext';
import { products } from '../data/products';

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
  const [localProduct, setLocalProduct] = useState<typeof products[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const [hoveringButton, setHoveringButton] = useState<string | null>(null);
  const [clickingButton, setClickingButton] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [detailsPopupOpen, setDetailsPopupOpen] = useState(false);
  const [isHoveringAddToCart, setIsHoveringAddToCart] = useState(false);
  const [sizeHelperOpen, setSizeHelperOpen] = useState(false);
  const { addToCart, getCartItemCount } = useCart();

  // Touch swipe support - MUST be at the top with all other hooks
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Scroll to top and reset view when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(0);
    setSelectedSize('');
    setSelectedVariantId('');
  }, [id]);

  // Load product from local data
  useEffect(() => {
    if (!id) {
      setError('Product handle not provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Find product by handle
    const foundProduct = products.find(p => p.handle === id);

    if (!foundProduct) {
      setError('Product not found');
      setLoading(false);
      return;
    }

    // Convert local product to Shopify format for compatibility
    // Use real Shopify variant IDs from product data
    const sizes = ['S', 'M', 'L', 'XL'] as const;
    const variants = sizes.map(size => ({
      node: {
        id: foundProduct.shopifyVariants[size],
        title: size,
        price: {
          amount: foundProduct.price.toString(),
          currencyCode: 'USD'
        },
        availableForSale: true,
        quantityAvailable: 10,
        selectedOptions: [
          {
            name: 'Size',
            value: size
          }
        ]
      }
    }));

    const shopifyProduct: ShopifyProduct = {
      id: foundProduct.id,
      title: foundProduct.name,
      handle: foundProduct.handle,
      description: foundProduct.description,
      priceRange: {
        minVariantPrice: {
          amount: foundProduct.price.toString(),
          currencyCode: 'USD'
        }
      },
      images: {
        edges: [
          {
            node: {
              id: '1',
              url: foundProduct.image,
              altText: foundProduct.name,
              width: 800,
              height: 1000
            }
          },
          {
            node: {
              id: '2',
              url: foundProduct.backImage,
              altText: `${foundProduct.name} - Back`,
              width: 800,
              height: 1000
            }
          },
          // Add additional images if they exist
          ...(foundProduct.additionalImages || []).map((imgUrl, index) => ({
            node: {
              id: `${index + 3}`,
              url: imgUrl,
              altText: `${foundProduct.name} - View ${index + 3}`,
              width: 800,
              height: 1000
            }
          }))
        ]
      },
      variants: {
        edges: variants
      }
    };

    setProduct(shopifyProduct);
    setLocalProduct(foundProduct);
    setLoading(false);
  }, [id]);

  // Get product views from product images
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

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    const cartItem = {
      variantId: selectedVariantId,
      productId: product.id,
      productHandle: product.handle,
      productTitle: product.title,
      variantTitle: selectedVariant.title,
      size: selectedSize,
      price: parseFloat(selectedVariant.price.amount),
      quantity: 1,
      image: productViews[0]?.image || ''
    };

    addToCart(cartItem);

    // Show success animation
    setAddToCartSuccess(true);
    setTimeout(() => setAddToCartSuccess(false), 2000);

    // Auto-open cart after brief delay (let user see the success state first)
    setTimeout(() => {
      setCartOpen(true);
    }, 400);
  };

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
      key={id} // Key forces re-animation when product changes
      className="min-h-screen w-screen text-off-white relative overflow-hidden"
      style={{ backgroundColor: '#1A1A1A' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <ScrollProgress />
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Header Bar */}
      <header className="fixed w-full z-50" style={{ top: '0px', paddingTop: '24px', paddingBottom: '24px', backgroundColor: '#1A1A1A' }}>
        <div className="relative w-full px-16 flex items-center justify-between">
          {/* Back button on left */}
          <button
            onClick={() => {
              setClickingButton(true);
              setTimeout(() => setClickingButton(false), 200);
              navigate('/products');
            }}
            onMouseEnter={() => setHoveringButton('back')}
            onMouseLeave={() => setHoveringButton(null)}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            style={{ transform: 'translateX(20px)' }}
            aria-label="Back to products"
          >
            <LongArrowLeft className="w-7 h-5 text-off-white" />
          </button>


          {/* Logo centered - Absolute positioning for true centering */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer group"
            style={{ height: '60px', width: '140px' }}
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
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-off-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {getCartItemCount()}
                </motion.span>
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

      {/* Product Detail */}
      <main className="px-12 md:px-16 min-h-screen flex items-center justify-center pt-24">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center justify-items-center">
            {/* Left Side - Images */}
            <div className="flex gap-3 items-center justify-center">
              {/* Thumbnail Images - Vertical Column on Left */}
              {productViews.length > 0 && (
                <div className="flex flex-col gap-2">
                  {/* Show first 2 thumbnails */}
                  {productViews.slice(0, 2).map((view, index) => (
                    <button
                      key={view.id}
                      onClick={() => setCurrentView(index)}
                      className={`w-12 aspect-[3/4] overflow-hidden rounded-md transition-all duration-300 ${
                        currentView === index ? 'ring-2 ring-off-white' : 'ring-1 ring-off-white/20 hover:ring-off-white/40'
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

                  {/* Show "+X More" box if there are additional images */}
                  {productViews.length > 2 && (
                    <motion.button
                      onClick={() => setCurrentView(2)}
                      className={`w-12 aspect-[3/4] rounded-md flex flex-col items-center justify-center relative overflow-hidden ${
                        currentView >= 2 ? 'ring-2 ring-off-white' : 'ring-1 ring-off-white/20 hover:ring-off-white/40'
                      }`}
                      style={{
                        backgroundColor: '#1A1A1A'
                      }}
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: 'rgba(245, 245, 240, 0.03)'
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Grid icon pattern */}
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[1px] p-2.5 opacity-10">
                        <div className="bg-off-white/40 rounded-[1px]"></div>
                        <div className="bg-off-white/40 rounded-[1px]"></div>
                        <div className="bg-off-white/40 rounded-[1px]"></div>
                        <div className="bg-off-white/40 rounded-[1px]"></div>
                      </div>

                      {/* Text */}
                      <div className="relative z-10 text-center">
                        <p className="text-off-white/60 text-base font-semibold leading-none">+{productViews.length - 2}</p>
                      </div>
                    </motion.button>
                  )}
                </div>
              )}

              {/* Main Image */}
              {productViews.length > 0 && (
                <div
                  className="overflow-hidden rounded-2xl relative group flex-shrink-0"
                  style={{
                    backgroundColor: '#1A1A1A',
                    width: '400px',
                    height: '533px',
                    aspectRatio: '3/4',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(245, 245, 240, 0.08)'
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

                    {/* Dark overlay for images with white backgrounds (additional images) */}
                    {currentView >= 2 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at center, transparent 40%, rgba(26, 26, 26, 0.6) 100%)'
                        }}
                      />
                    )}
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
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-off-white/70 uppercase tracking-wide text-sm">Size</label>
                    <motion.button
                      onClick={() => setSizeHelperOpen(true)}
                      className="text-off-white/50 hover:text-off-white text-xs uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-off-white/10 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Find My Size</span>
                    </motion.button>
                  </div>
                  <div className="flex gap-3">
                    {availableSizes.map((size) => (
                      <motion.button
                        key={size.variantId}
                        onClick={() => handleSizeSelect(size.value)}
                        className={`px-8 py-3 border-2 rounded-lg font-semibold ${
                          selectedSize === size.value
                            ? 'border-off-white bg-gradient-to-br from-off-white/20 to-off-white/5 shadow-lg shadow-off-white/20'
                            : 'border-off-white/40 bg-off-white/5 shadow-md shadow-black/50'
                        } ${!size.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={!size.available}
                        whileHover={
                          !size.available
                            ? {}
                            : {
                                scale: 1.08,
                                borderColor: 'rgb(245, 245, 240)',
                                boxShadow: '0 8px 24px rgba(245, 245, 240, 0.3)',
                                transition: { duration: 0.2 }
                              }
                        }
                        whileTap={
                          !size.available
                            ? {}
                            : {
                                scale: 0.95,
                                transition: { duration: 0.1 }
                              }
                        }
                        animate={
                          selectedSize === size.value
                            ? {
                                borderColor: 'rgb(245, 245, 240)',
                                backgroundColor: 'rgba(245, 245, 240, 0.15)',
                                boxShadow: '0 4px 16px rgba(245, 245, 240, 0.2), inset 0 1px 4px rgba(245, 245, 240, 0.1)'
                              }
                            : {
                                borderColor: 'rgba(245, 245, 240, 0.4)',
                                backgroundColor: 'rgba(245, 245, 240, 0.05)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                              }
                        }
                        transition={{
                          duration: 0.3,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      >
                        <span className="text-off-white uppercase tracking-widest text-base">{size.value}</span>
                      </motion.button>
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

              {/* View Details Button */}
              {localProduct && (
                <motion.button
                  onClick={() => {
                    console.log('Button clicked, opening popup');
                    setDetailsPopupOpen(true);
                  }}
                  className="w-full py-3 px-6 border-2 border-off-white/30 rounded-lg text-off-white uppercase tracking-wider text-sm font-medium flex items-center justify-between"
                  whileHover={{
                    borderColor: 'rgba(245, 245, 240, 0.6)',
                    backgroundColor: 'rgba(245, 245, 240, 0.05)',
                    scale: 1.01
                  }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span>View Product Details</span>
                  <ChevronDown className="w-5 h-5" />
                </motion.button>
              )}

              {/* Hidden Expandable Product Details - Moved to Popup */}
              {false && localProduct && (
                <div className="space-y-0">
                  {/* Material Section */}
                  {localProduct.material && (
                    <div className="border-t border-off-white/20">
                      <motion.button
                        onClick={() => toggleSection('material')}
                        className="w-full py-5 px-4 flex justify-between items-center text-off-white transition-colors rounded-lg"
                        whileHover={{
                          backgroundColor: 'rgba(245, 245, 240, 0.05)',
                          color: 'rgb(245, 245, 240)',
                          transition: { duration: 0.2 }
                        }}
                      >
                        <span className="uppercase tracking-wider text-sm font-medium">Material</span>
                        <motion.div
                          animate={{ rotate: expandedSection === 'material' ? 180 : 0 }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {expandedSection === 'material' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <p className="pb-4 text-off-white/60 text-sm">
                              {localProduct.material}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Care Instructions Section */}
                  {localProduct.careInstructions && (
                    <div className="border-t border-off-white/20">
                      <motion.button
                        onClick={() => toggleSection('care')}
                        className="w-full py-5 px-4 flex justify-between items-center text-off-white transition-colors rounded-lg"
                        whileHover={{
                          backgroundColor: 'rgba(245, 245, 240, 0.05)',
                          color: 'rgb(245, 245, 240)',
                          transition: { duration: 0.2 }
                        }}
                      >
                        <span className="uppercase tracking-wider text-sm font-medium">Care Instructions</span>
                        <motion.div
                          animate={{ rotate: expandedSection === 'care' ? 180 : 0 }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {expandedSection === 'care' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <p className="pb-4 text-off-white/60 text-sm">
                              {localProduct.careInstructions}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Size Guide Section */}
                  {localProduct.sizeGuide && (
                    <div className="border-t border-off-white/20">
                      <motion.button
                        onClick={() => toggleSection('size')}
                        className="w-full py-5 px-4 flex justify-between items-center text-off-white transition-colors rounded-lg"
                        whileHover={{
                          backgroundColor: 'rgba(245, 245, 240, 0.05)',
                          color: 'rgb(245, 245, 240)',
                          transition: { duration: 0.2 }
                        }}
                      >
                        <span className="uppercase tracking-wider text-sm font-medium">Size & Fit</span>
                        <motion.div
                          animate={{ rotate: expandedSection === 'size' ? 180 : 0 }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {expandedSection === 'size' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <p className="pb-4 text-off-white/60 text-sm">
                              {localProduct.sizeGuide}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Bottom Border */}
                  <div className="border-t border-off-white/20"></div>
                </div>
              )}

              {/* Add to Cart Button */}
              <motion.button
                onClick={handleAddToCart}
                onMouseEnter={() => setIsHoveringAddToCart(true)}
                onMouseLeave={() => setIsHoveringAddToCart(false)}
                disabled={!selectedVariant}
                className="w-full px-10 py-5 text-black text-lg font-bold uppercase tracking-widest disabled:cursor-not-allowed border-2 border-off-white relative overflow-hidden rounded-xl"
                style={{
                  background: addToCartSuccess
                    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                    : 'linear-gradient(135deg, rgb(250, 250, 245) 0%, rgb(240, 240, 235) 100%)'
                }}
                animate={{
                  scale: addToCartSuccess ? [1, 1.05, 1] : 1,
                  opacity: !selectedVariant ? 0.3 : 1,
                  boxShadow: addToCartSuccess
                    ? '0 10px 40px rgba(74, 222, 128, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                    : '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                }}
                whileHover={
                  !selectedVariant
                    ? {}
                    : {
                        scale: 1.03,
                        boxShadow: '0 12px 32px rgba(245, 245, 240, 0.6), 0 0 40px rgba(245, 245, 240, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        transition: { duration: 0.2 }
                      }
                }
                whileTap={
                  !selectedVariant
                    ? {}
                    : {
                        scale: 0.98,
                        transition: { duration: 0.1 }
                      }
                }
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                {/* Animated Shimmer Light Bar */}
                <motion.div
                  className="absolute inset-0 z-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
                    width: '30%',
                  }}
                  animate={{
                    x: isHoveringAddToCart ? ['-100%', '400%'] : ['-100%', '400%']
                  }}
                  transition={{
                    duration: 1.2,
                    ease: 'easeInOut',
                    repeat: isHoveringAddToCart ? 0 : Infinity,
                    repeatDelay: 2
                  }}
                />

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {addToCartSuccess ? '✓ Added to Cart' : (
                    <>
                      Add to Cart
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </motion.button>

              {/* You Might Also Like Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-32 pt-12 border-t border-off-white/10"
              >
                <h3 className="text-off-white uppercase tracking-widest text-sm font-bold mb-6 flex items-center gap-2">
                  <div className="w-1 h-5 bg-off-white rounded-full" />
                  You Might Also Like
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {products.filter(p => p.handle !== id).map((otherProduct) => (
                    <motion.div
                      key={otherProduct.id}
                      onClick={() => {
                        navigate(`/product/${otherProduct.handle}`);
                      }}
                      className="group cursor-pointer relative overflow-hidden rounded-2xl border-2 border-off-white/20 bg-gradient-to-br from-off-white/[0.03] to-off-white/[0.01] transition-all duration-500"
                      whileHover={{
                        scale: 1.03,
                        borderColor: 'rgba(245, 245, 240, 0.5)',
                        boxShadow: '0 12px 40px rgba(245, 245, 240, 0.15)'
                      }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {/* Hover glow effect */}
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at center, rgba(245, 245, 240, 0.05) 0%, transparent 70%)'
                        }}
                      />

                      <div className="relative flex gap-6 p-6">
                        {/* Product Image */}
                        <div className="w-32 h-40 flex-shrink-0 overflow-hidden rounded-xl bg-[#0A0A0A] border border-off-white/10 shadow-lg">
                          <img
                            src={otherProduct.backImage}
                            alt={otherProduct.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 flex flex-col justify-between py-2">
                          {/* Top Section */}
                          <div className="space-y-3">
                            <h4 className="text-off-white uppercase tracking-widest text-lg font-bold">
                              {otherProduct.name}
                            </h4>
                            <p className="text-off-white/70 text-sm leading-relaxed">
                              {otherProduct.description}
                            </p>
                          </div>

                          {/* Bottom Section - Price and Button on same line */}
                          <div className="flex items-center gap-8 pt-4 mt-auto border-t border-off-white/10">
                            <span className="text-off-white text-2xl font-bold">
                              ${otherProduct.price.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-2 text-off-white/70 group-hover:text-off-white transition-colors ml-auto">
                              <span className="text-sm uppercase tracking-widest font-semibold">View</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Product Details Popup - Centered Modal */}
      <AnimatePresence>
        {detailsPopupOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailsPopupOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
            />

            {/* Popup Modal - Centered */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-8 pointer-events-none">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{
                  type: 'spring',
                  damping: 25,
                  stiffness: 300,
                  duration: 0.4
                }}
                className="relative w-full max-w-2xl pointer-events-auto rounded-2xl shadow-2xl border-2 border-off-white/40 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
                  maxHeight: '80vh'
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-off-white/20 bg-off-white/5">
                  <h3 className="text-off-white text-2xl font-bold uppercase tracking-widest">Product Details</h3>
                  <motion.button
                    onClick={() => setDetailsPopupOpen(false)}
                    className="p-2 text-off-white/60 hover:text-off-white rounded-lg hover:bg-off-white/10 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto px-8 py-8 space-y-8" style={{ maxHeight: 'calc(80vh - 100px)' }}>
                  {/* Material */}
                  {localProduct?.material && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                    >
                      <h4 className="text-off-white uppercase tracking-widest text-sm font-bold mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-off-white rounded-full" />
                        Material
                      </h4>
                      <p className="text-off-white/80 text-base leading-relaxed ml-3">{localProduct.material}</p>
                    </motion.div>
                  )}

                  {/* Care Instructions */}
                  {localProduct?.careInstructions && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25, duration: 0.4 }}
                      className="border-t border-off-white/10 pt-8"
                    >
                      <h4 className="text-off-white uppercase tracking-widest text-sm font-bold mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-off-white rounded-full" />
                        Care Instructions
                      </h4>
                      <p className="text-off-white/80 text-base leading-relaxed ml-3">{localProduct.careInstructions}</p>
                    </motion.div>
                  )}

                  {/* Size & Fit */}
                  {localProduct?.sizeGuide && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35, duration: 0.4 }}
                      className="border-t border-off-white/10 pt-8"
                    >
                      <h4 className="text-off-white uppercase tracking-widest text-sm font-bold mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-off-white rounded-full" />
                        Size & Fit
                      </h4>
                      <p className="text-off-white/80 text-base leading-relaxed ml-3">{localProduct.sizeGuide}</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Bundle Deal Popup */}
      <BundlePopup />

      {/* Size Helper */}
      <SizeHelper
        isOpen={sizeHelperOpen}
        onClose={() => setSizeHelperOpen(false)}
        onSelectSize={(size) => {
          handleSizeSelect(size);
          setSizeHelperOpen(false);
        }}
      />
    </motion.div>
  );
}