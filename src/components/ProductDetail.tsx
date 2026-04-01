import { ChevronDown, ChevronRight, ChevronLeft, ShoppingBag } from 'lucide-react';
import LongArrowLeft from './LongArrowLeft';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/arcus-wordmark.png';
import Menu from './Menu';
import Cart from './Cart';
import Logo3DTransform from './Logo3DTransform';
import SizeHelper from './SizeHelper';
import ScrollProgress from './ScrollProgress';
import { ShopifyProduct } from '../types/shopify';
import { useCart } from '../contexts/CartContext';
import { products, type BundleItem } from '../data/products';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>(); // This is now the product handle
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  // Bundle size selections
  const [selectedHoodieSize, setSelectedHoodieSize] = useState('');
  const [selectedPantsSize, setSelectedPantsSize] = useState('');
  // Purchase mode for bundle products: 'set', 'hoodie', or 'sweatpants'
  const [purchaseMode, setPurchaseMode] = useState<'set' | 'hoodie' | 'sweatpants'>('set');
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
  const [isHoveringAddToCart, setIsHoveringAddToCart] = useState(false);
  const [sizeHelperOpen, setSizeHelperOpen] = useState(false);
  const { addToCart, getCartItemCount } = useCart();
  const unicornContainerRef = useRef<HTMLDivElement>(null);

  // Initialize UnicornStudio on mount
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="unicornStudio"]');
    
    if (existingScript) {
      const u = (window as any).UnicornStudio;
      if (u && u.init) {
        setTimeout(() => u.init(), 100);
      }
    } else {
      (window as any).UnicornStudio = { isInitialized: false };
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.3/dist/unicornStudio.umd.js';
      script.onload = () => {
        (window as any).UnicornStudio.init();
      };
      document.head.appendChild(script);
    }
  }, []);

  // Touch swipe support - MUST be at the top with all other hooks
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Window resize handler for manual image sizing (Tailwind fallback)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate image dimensions based on screen width
  // Mobile: scale to fit screen. Desktop: original fixed sizes.
  const imageDimensions = windowWidth >= 768
    ? { width: '500px', height: '667px' }
    : { width: `${Math.min(windowWidth - 32, 340)}px`, height: `${Math.min(windowWidth - 32, 340) * 1.33}px` };

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
    // Handle bundle products (like Arcus Set)
    if (localProduct?.isBundle && localProduct.bundleItems) {
      if (purchaseMode === 'set') {
        // Full set mode - need both sizes
        if (!selectedHoodieSize || !selectedPantsSize) return;

        const hoodieVariantId = localProduct.bundleItems.hoodie?.variants[selectedHoodieSize as keyof BundleItem['variants']];
        const pantsVariantId = localProduct.bundleItems.sweatpants?.variants[selectedPantsSize as keyof BundleItem['variants']];

        if (!hoodieVariantId || !pantsVariantId) return;

        // Split bundle price evenly: $32.50 each = $65.00 total
        const pricePerItem = localProduct.price / 2;

        // Add hoodie to cart
        addToCart({
          variantId: hoodieVariantId,
          productId: localProduct.bundleItems.hoodie?.productId || '',
          productHandle: 'arcus-set-hoodie',
          productTitle: `${localProduct.name} - Hoodie`,
          variantTitle: selectedHoodieSize,
          size: selectedHoodieSize,
          price: pricePerItem,
          image: productViews[0]?.image || '',
        });

        // Add sweatpants to cart
        addToCart({
          variantId: pantsVariantId,
          productId: localProduct.bundleItems.sweatpants?.productId || '',
          productHandle: 'arcus-set-sweatpants',
          productTitle: `${localProduct.name} - Sweatpants`,
          variantTitle: selectedPantsSize,
          size: selectedPantsSize,
          price: pricePerItem,
          image: productViews[0]?.image || '',
        });
      } else if (purchaseMode === 'hoodie') {
        // Hoodie only
        if (!selectedHoodieSize) return;
        const hoodieVariantId = localProduct.bundleItems.hoodie?.variants[selectedHoodieSize as keyof BundleItem['variants']];
        if (!hoodieVariantId) return;

        addToCart({
          variantId: hoodieVariantId,
          productId: localProduct.bundleItems.hoodie?.productId || '',
          productHandle: 'arcus-hoodie',
          productTitle: 'Arcus Hoodie',
          variantTitle: selectedHoodieSize,
          size: selectedHoodieSize,
          price: localProduct.bundleItems.hoodie?.price || 45,
          image: productViews[0]?.image || '',
        });
      } else if (purchaseMode === 'sweatpants') {
        // Sweatpants only
        if (!selectedPantsSize) return;
        const pantsVariantId = localProduct.bundleItems.sweatpants?.variants[selectedPantsSize as keyof BundleItem['variants']];
        if (!pantsVariantId) return;

        addToCart({
          variantId: pantsVariantId,
          productId: localProduct.bundleItems.sweatpants?.productId || '',
          productHandle: 'arcus-sweatpants',
          productTitle: 'Arcus Sweatpants',
          variantTitle: selectedPantsSize,
          size: selectedPantsSize,
          price: localProduct.bundleItems.sweatpants?.price || 35,
          image: productViews[0]?.image || '',
        });
      }

      // Show success animation
      setAddToCartSuccess(true);
      setTimeout(() => setAddToCartSuccess(false), 2000);

      // Open cart after brief delay
      setTimeout(() => {
        setCartOpen(true);
      }, 400);
      return;
    }

    // Regular product add to cart
    if (!product || !selectedVariant) return;

    const cartItem = {
      variantId: selectedVariantId,
      productId: product.id,
      productHandle: product.handle,
      productTitle: product.title,
      variantTitle: selectedVariant.title,
      size: selectedSize,
      price: parseFloat(selectedVariant.price.amount),
      originalPrice: localProduct?.originalPrice,
      quantity: 1,
      image: productViews[0]?.image || '',
      isPreOrder: localProduct?.isPreOrder
    };

    addToCart(cartItem);

    // Show success animation
    setAddToCartSuccess(true);
    setTimeout(() => setAddToCartSuccess(false), 2000);

    // Open cart after brief delay
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
  // For bundle products, adjust price based on purchase mode
  const price = localProduct?.isBundle
    ? purchaseMode === 'hoodie'
      ? (localProduct.bundleItems?.hoodie?.price || 40)
      : purchaseMode === 'sweatpants'
        ? (localProduct.bundleItems?.sweatpants?.price || 30)
        : localProduct.price
    : selectedVariant
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
    <>
      {/* Header Bar - Outside motion.div to avoid stacking context issues */}
      <header
        className="fixed w-full z-[100]"
        style={{
          top: '0px',
          paddingTop: '32px',
          paddingBottom: '40px',
          background: 'linear-gradient(180deg, #1A1A1A 0%, rgba(26, 26, 26, 0.98) 60%, rgba(26, 26, 26, 0.7) 85%, transparent 100%)'
        }}
      >
        <div className="relative w-full flex items-center justify-between" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setClickingButton(true);
              setTimeout(() => setClickingButton(false), 200);
              navigate('/products');
            }}
            onMouseEnter={() => setHoveringButton('back')}
            onMouseLeave={() => setHoveringButton(null)}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            style={{ marginLeft: '16px' }}
            aria-label="Back to products"
          >
            <LongArrowLeft className="w-8 h-6 text-off-white -scale-y-100" />
          </button>

          {/* Logo centered */}
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

          {/* Cart and Menu */}
          <div className="flex items-center gap-8">
            <button
              type="button"
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
              type="button"
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

      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <motion.div
        key={id}
        className="min-h-screen w-screen text-off-white relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #1A1A1A 0%, #181818 60%, #161616 100%)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* CSS to hide UnicornStudio watermark */}
        <style>{`
          a[href*="unicorn.studio"],
          a[href*="unicorn"],
          a[href*="unicorn.studio?utm_source=public-url"],
          [data-us-project] a,
          [data-us-project] > div > a,
          [data-us-project] a[target="_blank"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            clip: rect(0, 0, 0, 0) !important;
            clip-path: inset(100%) !important;
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
          <div 
            style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              height: '80px', 
              background: '#1A1A1A',
              zIndex: 10
            }}
          />
        </div>

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

        <ScrollProgress />

      {/* Product Detail */}
      <main className="px-4 lg:px-16 min-h-screen flex items-center justify-center pt-28 pb-8 lg:pt-32 lg:pb-8 relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 md:items-center justify-items-center">
            {/* Left Side - Images */}
            <div className="flex gap-3 items-center justify-center">
              {/* Thumbnail Images - Only visible when 2-column layout is active (lg+) */}
              {productViews.length > 0 && (
                <div className="hidden lg:flex flex-col gap-4 md:gap-6">
                  {/* Show first 2 thumbnails */}
                  {productViews.slice(0, 2).map((view, index) => (
                    <motion.button
                      key={view.id}
                      onClick={() => setCurrentView(index)}
                      className="w-16 md:w-24 aspect-[3/4] overflow-hidden rounded-lg md:rounded-xl relative"
                      style={{
                        backgroundColor: '#1A1A1A',
                        background: currentView === index
                          ? 'linear-gradient(135deg, rgba(224, 224, 224, 0.3) 0%, rgba(168, 168, 168, 0.2) 50%, rgba(200, 200, 200, 0.3) 100%)'
                          : 'rgba(26, 26, 26, 0.8)',
                        border: currentView === index
                          ? '2px solid transparent'
                          : '1px solid rgba(150, 150, 150, 0.2)',
                        backgroundClip: 'padding-box',
                        boxShadow: currentView === index
                          ? '0 0 20px rgba(200, 200, 200, 0.3), 0 0 40px rgba(180, 180, 180, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                          : '0 4px 12px rgba(0, 0, 0, 0.4)',
                      }}
                      whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(200, 200, 200, 0.4), 0 8px 20px rgba(0, 0, 0, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Chrome border gradient overlay for active */}
                      {currentView === index && (
                        <div 
                          className="absolute -inset-[2px] rounded-lg md:rounded-xl pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, #E0E0E0 0%, #A0A0A0 25%, #F0F0F0 50%, #B0B0B0 75%, #D0D0D0 100%)',
                            zIndex: -1,
                          }}
                        />
                      )}
                      <img
                        src={view.image}
                        alt={view.label}
                        className="w-full h-full object-cover rounded-lg md:rounded-xl"
                        style={{ objectPosition: 'center center' }}
                      />
                      {/* Faded edge overlay for thumbnails */}
                      <div
                        className="absolute inset-0 pointer-events-none rounded-lg md:rounded-xl"
                        style={{
                          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(26, 26, 26, 0.3) 60%, rgba(26, 26, 26, 0.7) 90%)'
                        }}
                      />
                    </motion.button>
                  ))}

                  {/* Show "+X More" box if there are additional images */}
                  {productViews.length > 2 && (
                    <motion.button
                      onClick={() => setCurrentView(2)}
                      className="w-16 md:w-24 aspect-[3/4] rounded-lg md:rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                      style={{
                        backgroundColor: '#1A1A1A',
                        background: currentView >= 2
                          ? 'linear-gradient(135deg, rgba(224, 224, 224, 0.3) 0%, rgba(168, 168, 168, 0.2) 50%, rgba(200, 200, 200, 0.3) 100%)'
                          : 'rgba(26, 26, 26, 0.8)',
                        border: currentView >= 2
                          ? '2px solid transparent'
                          : '1px solid rgba(150, 150, 150, 0.2)',
                        boxShadow: currentView >= 2
                          ? '0 0 20px rgba(200, 200, 200, 0.3), 0 0 40px rgba(180, 180, 180, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                          : '0 4px 12px rgba(0, 0, 0, 0.4)',
                      }}
                      whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(200, 200, 200, 0.4), 0 8px 20px rgba(0, 0, 0, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Chrome border gradient overlay for active */}
                      {currentView >= 2 && (
                        <div 
                          className="absolute -inset-[2px] rounded-lg md:rounded-xl pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, #E0E0E0 0%, #A0A0A0 25%, #F0F0F0 50%, #B0B0B0 75%, #D0D0D0 100%)',
                            zIndex: -1,
                          }}
                        />
                      )}
                      
                      {/* Grid icon pattern */}
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[1px] p-2 opacity-20">
                        <div className="bg-gray-400 rounded-[1px]"></div>
                        <div className="bg-gray-400 rounded-[1px]"></div>
                        <div className="bg-gray-400 rounded-[1px]"></div>
                        <div className="bg-gray-400 rounded-[1px]"></div>
                      </div>

                      {/* Text with chrome effect */}
                      <div 
                        className="relative z-10 text-center font-bold text-xs md:text-sm"
                        style={{
                          background: 'linear-gradient(135deg, #E8E8E8 0%, #B8B8B8 25%, #F5F5F5 50%, #A0A0A0 75%, #D0D0D0 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        +{productViews.length - 2}
                      </div>
                    </motion.button>
                  )}
                </div>
              )}

              {/* Main Image Container with Arrows */}
              {productViews.length > 0 && (
                <div className="relative group flex-shrink-0">
                  {/* Spotlight/Gradient Background Behind Product */}
                  <div 
                    className="absolute -inset-8 md:-inset-12 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(200, 200, 200, 0.08) 0%, rgba(150, 150, 150, 0.04) 30%, transparent 70%)',
                      filter: 'blur(20px)',
                    }}
                  />
                  
                  {/* Chrome Glowing Frame */}
                  <motion.div
                    className="overflow-hidden rounded-xl md:rounded-2xl relative"
                    style={{
                      backgroundColor: '#1A1A1A',
                      boxShadow: '0 0 40px rgba(200, 200, 200, 0.15), 0 0 80px rgba(180, 180, 180, 0.08), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(200, 200, 200, 0.2)',
                      ...imageDimensions
                    }}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 4,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
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
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                      />

                      {/* Stronger faded edge overlay - blends image into background */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 35%, rgba(26, 26, 26, 0.4) 60%, rgba(26, 26, 26, 0.85) 85%, rgba(26, 26, 26, 1) 100%)'
                        }}
                      />
                    </AnimatePresence>
                  </motion.div>

                  {/* Navigation Arrows - Placed Outside Overflow-Hidden for Clarity */}
                  {productViews.length > 1 && (
                    <>
                      {/* Left Arrow */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 text-off-white transition-all duration-300 cursor-pointer hover:scale-125 active:scale-90 p-2"
                        style={{
                          left: '10px',
                          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))'
                        }}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-10 h-10 md:w-16 md:h-16" strokeWidth={2} />
                      </button>

                      {/* Right Arrow */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-off-white transition-all duration-300 cursor-pointer hover:scale-125 active:scale-90 p-2"
                        style={{
                          right: '10px',
                          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))'
                        }}
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-10 h-10 md:w-16 md:h-16" strokeWidth={2} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right Side - Product Info */}
            <div className="space-y-6 flex flex-col justify-center max-w-md mt-12 md:mt-0">
              {/* Title and Price */}
              <div className="flex flex-col gap-3">
                <h1 className="tracking-wider uppercase text-3xl md:text-4xl">{product.title}</h1>
                <div className="flex items-center gap-3">
                  <p
                    className="text-xl font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #E8E8E8 0%, #B8B8B8 25%, #F5F5F5 50%, #A0A0A0 75%, #D0D0D0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: '0 0 20px rgba(200, 200, 200, 0.3)',
                    }}
                  >${price.toFixed(2)}</p>
                </div>
              </div>

              {/* Purchase Mode Selector for Bundle */}
              {localProduct?.isBundle && localProduct.bundleItems && (
                <div className="flex flex-col gap-3">
                  <label className="text-off-white/70 uppercase tracking-widest text-sm font-semibold">Purchase Option</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { mode: 'set' as const, label: 'Full Set', price: localProduct.price },
                      { mode: 'hoodie' as const, label: 'Hoodie Only', price: localProduct.bundleItems.hoodie?.price || 45 },
                      { mode: 'sweatpants' as const, label: 'Sweatpants Only', price: localProduct.bundleItems.sweatpants?.price || 35 },
                    ].map(({ mode, label, price: modePrice }) => (
                      <motion.button
                        key={mode}
                        onClick={() => setPurchaseMode(mode)}
                        className={`px-4 py-2.5 border-2 rounded-lg font-semibold cursor-pointer text-sm ${purchaseMode === mode
                          ? 'border-off-white bg-gradient-to-br from-off-white/20 to-off-white/5 shadow-lg shadow-off-white/20'
                          : 'border-off-white/40 bg-off-white/5 shadow-md shadow-black/50'
                          }`}
                        whileHover={{
                          scale: 1.05,
                          borderColor: 'rgb(245, 245, 240)',
                          boxShadow: '0 8px 24px rgba(245, 245, 240, 0.3)',
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                        animate={
                          purchaseMode === mode
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
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <span className="text-off-white uppercase tracking-wider">{label}</span>
                        <span className="text-off-white/60 ml-2">${modePrice}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bundle Size Selection (Hoodie + Sweatpants) */}
              {localProduct?.isBundle && localProduct.bundleItems && (
                <div className="flex flex-col gap-6">
                  {/* Hoodie Size - shown for 'set' and 'hoodie' modes */}
                  {(purchaseMode === 'set' || purchaseMode === 'hoodie') && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-off-white/70 uppercase tracking-widest text-sm font-semibold">Hoodie Size</label>
                      <motion.button
                        onClick={() => setSizeHelperOpen(true)}
                        className="text-off-white/50 hover:text-off-white text-xs uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-off-white/10 transition-colors flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Find My Size</span>
                      </motion.button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {['S', 'M', 'L'].filter(size => localProduct.bundleItems?.hoodie?.variants[size as 'S' | 'M' | 'L']).map((size) => (
                        <motion.button
                          key={`hoodie-${size}`}
                          onClick={() => setSelectedHoodieSize(size)}
                          className={`px-6 py-3 md:px-8 md:py-3 border-2 rounded-lg font-semibold cursor-pointer ${selectedHoodieSize === size
                            ? 'border-off-white bg-gradient-to-br from-off-white/20 to-off-white/5 shadow-lg shadow-off-white/20'
                            : 'border-off-white/40 bg-off-white/5 shadow-md shadow-black/50'
                            }`}
                          whileHover={{
                            scale: 1.08,
                            borderColor: 'rgb(245, 245, 240)',
                            boxShadow: '0 8px 24px rgba(245, 245, 240, 0.3)',
                            transition: { duration: 0.2 }
                          }}
                          whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                          animate={
                            selectedHoodieSize === size
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
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <span className="text-off-white uppercase tracking-widest text-base">{size}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Sweatpants Size - shown for 'set' and 'sweatpants' modes */}
                  {(purchaseMode === 'set' || purchaseMode === 'sweatpants') && (
                  <div className="flex flex-col gap-3">
                    <label className="text-off-white/70 uppercase tracking-widest text-sm font-semibold">Sweatpants Size</label>
                    <div className="flex flex-wrap gap-3">
                      {['S', 'M', 'L'].filter(size => localProduct.bundleItems?.sweatpants?.variants[size as 'S' | 'M' | 'L']).map((size) => (
                        <motion.button
                          key={`pants-${size}`}
                          onClick={() => setSelectedPantsSize(size)}
                          className={`px-6 py-3 md:px-8 md:py-3 border-2 rounded-lg font-semibold cursor-pointer ${selectedPantsSize === size
                            ? 'border-off-white bg-gradient-to-br from-off-white/20 to-off-white/5 shadow-lg shadow-off-white/20'
                            : 'border-off-white/40 bg-off-white/5 shadow-md shadow-black/50'
                            }`}
                          whileHover={{
                            scale: 1.08,
                            borderColor: 'rgb(245, 245, 240)',
                            boxShadow: '0 8px 24px rgba(245, 245, 240, 0.3)',
                            transition: { duration: 0.2 }
                          }}
                          whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                          animate={
                            selectedPantsSize === size
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
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <span className="text-off-white uppercase tracking-widest text-base">{size}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Fit Guide */}
                  <div 
                    className="px-4 py-3 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-violet-400 font-bold text-sm">Normal size</span>
                        <span className="text-off-white text-sm">= Baggy fit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-violet-400 font-bold text-sm">Size down</span>
                        <span className="text-off-white text-sm">= Relaxed fit</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Size Selection (for non-bundle products) */}
              {!localProduct?.isBundle && availableSizes.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-off-white/70 uppercase tracking-widest text-sm font-semibold">Size</label>
                    <motion.button
                      onClick={() => setSizeHelperOpen(true)}
                      className="text-off-white/50 hover:text-off-white text-xs uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-off-white/10 transition-colors flex-shrink-0"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Find My Size</span>
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => (
                      <motion.button
                        key={size.variantId}
                        onClick={() => handleSizeSelect(size.value)}
                        className={`px-6 py-3 md:px-8 md:py-3 border-2 rounded-lg font-semibold ${selectedSize === size.value
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

                  {/* Fit Guide */}
                  <div 
                    className="px-4 py-3 rounded-xl mt-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-violet-400 font-bold text-sm">Normal size</span>
                        <span className="text-off-white text-sm">= Baggy fit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-violet-400 font-bold text-sm">Size down</span>
                        <span className="text-off-white text-sm">= Relaxed fit</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Description */}
              {product.description && (
                <div className="text-off-white/60 uppercase tracking-wide text-sm leading-relaxed">
                  <p>{product.description}</p>
                </div>
              )}



              {/* Add to Cart Button */}
              <motion.button
                onClick={handleAddToCart}
                onMouseEnter={() => setIsHoveringAddToCart(true)}
                onMouseLeave={() => setIsHoveringAddToCart(false)}
                disabled={localProduct?.isBundle ? (purchaseMode === 'set' ? (!selectedHoodieSize || !selectedPantsSize) : purchaseMode === 'hoodie' ? !selectedHoodieSize : !selectedPantsSize) : !selectedVariant}
                className="w-full px-6 py-4 md:px-10 md:py-6 text-sm md:text-lg font-bold uppercase tracking-widest disabled:cursor-not-allowed relative overflow-hidden rounded-xl md:rounded-2xl"
                style={{
                  background: addToCartSuccess
                    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                    : 'linear-gradient(135deg, #E0E0E0 0%, #A8A8A8 20%, #F0F0F0 40%, #B0B0B0 60%, #D8D8D8 80%, #C0C0C0 100%)',
                  color: '#1A1A1A',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
                animate={{
                  scale: addToCartSuccess ? [1, 1.05, 1] : 1,
                  opacity: (localProduct?.isBundle ? (purchaseMode === 'set' ? (!selectedHoodieSize || !selectedPantsSize) : purchaseMode === 'hoodie' ? !selectedHoodieSize : !selectedPantsSize) : !selectedVariant) ? 0.3 : 1,
                  boxShadow: addToCartSuccess
                    ? '0 15px 50px rgba(74, 222, 128, 0.6), 0 0 60px rgba(74, 222, 128, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.6)'
                    : '0 10px 30px rgba(200, 200, 200, 0.3), 0 0 40px rgba(200, 200, 200, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.5)'
                }}
                whileHover={
                  (localProduct?.isBundle ? (purchaseMode === 'set' ? (!selectedHoodieSize || !selectedPantsSize) : purchaseMode === 'hoodie' ? !selectedHoodieSize : !selectedPantsSize) : !selectedVariant)
                    ? {}
                    : {
                        scale: 1.04,
                        y: -2,
                        boxShadow: '0 20px 50px rgba(200, 200, 200, 0.5), 0 0 60px rgba(200, 200, 200, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.6)',
                        transition: { duration: 0.2 }
                      }
                }
                whileTap={
                  (localProduct?.isBundle ? (purchaseMode === 'set' ? (!selectedHoodieSize || !selectedPantsSize) : purchaseMode === 'hoodie' ? !selectedHoodieSize : !selectedPantsSize) : !selectedVariant)
                    ? {}
                    : {
                        scale: 0.97,
                        y: 0,
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
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%)',
                    width: '40%',
                    filter: 'blur(20px)'
                  }}
                  animate={{
                    x: isHoveringAddToCart ? ['-100%', '400%'] : ['-100%', '400%']
                  }}
                  transition={{
                    duration: 1.5,
                    ease: 'easeInOut',
                    repeat: isHoveringAddToCart ? 0 : Infinity,
                    repeatDelay: 2.5
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
            </div>
          </div>
        </div>
      </main>


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
    </>
  );
}