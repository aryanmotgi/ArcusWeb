import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { createCheckout } from '../utils/shopify/checkout';
import { products } from '../data/products';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart, addToCart } = useCart();
  const navigate = useNavigate();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [recommendedProduct, setRecommendedProduct] = useState<typeof products[0] | null>(null);
  const [recommendedSize, setRecommendedSize] = useState<string>('');

  // Check if we should show recommendation when cart opens
  useEffect(() => {
    if (items.length > 0) {
      // Check if they only have one type of product
      const hasArcusTee = items.some(item => item.productHandle === 'arcus-tee');
      const hasAllPathsTee = items.some(item => item.productHandle === 'all-paths-tee');

      // Only show recommendation if they have one product type but not both
      if ((hasArcusTee && !hasAllPathsTee) || (!hasArcusTee && hasAllPathsTee)) {
        // Get the product handle they have
        const currentProductHandle = hasArcusTee ? 'arcus-tee' : 'all-paths-tee';

        // Get their size from the first item
        const firstItem = items[0];
        const size = firstItem.size;

        // Find the complementary tee to recommend
        const recommendHandle = currentProductHandle === 'arcus-tee' ? 'all-paths-tee' : 'arcus-tee';
        const otherProduct = products.find(p => p.handle === recommendHandle);

        if (otherProduct) {
          setRecommendedProduct(otherProduct);
          setRecommendedSize(size);

          // Show recommendation after a brief delay
          setTimeout(() => {
            setRecommendationOpen(true);
          }, 1000);
        }
      } else {
        setRecommendationOpen(false);
      }
    } else {
      setRecommendationOpen(false);
    }
  }, [items]);

  const handleCheckout = async () => {
    if (items.length === 0) {
      return;
    }

    try {
      setIsCreatingCheckout(true);
      setCheckoutError(null);

      // Set return URL to home page after checkout completion
      const returnUrl = `${window.location.origin}`;

      // Create checkout and get checkout URL
      const checkoutUrl = await createCheckout(items, returnUrl);

      // Redirect to Shopify checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Failed to create checkout. Please try again.'
      );
      setIsCreatingCheckout(false);
    }
  };

  const handleRecommendationAddToCart = (productId: string, productHandle: string) => {
    if (!recommendedProduct || !recommendedSize) return;

    // Find the variant ID for the recommended size
    const variantId = recommendedProduct.shopifyVariants[recommendedSize as 'S' | 'M' | 'L' | 'XL'];
    if (!variantId) return;

    const cartItem = {
      variantId: variantId,
      productId: productId,
      productHandle: productHandle,
      productTitle: recommendedProduct.name,
      variantTitle: recommendedSize,
      size: recommendedSize,
      price: recommendedProduct.price,
      quantity: 1,
      image: recommendedProduct.image
    };

    addToCart(cartItem);

    // Close the recommendation popup after adding
    setRecommendationOpen(false);
  };

  const subtotal = getCartTotal();

  // Check if both tees are in cart for bundle discount
  const hasArcusTee = items.some(item => item.productHandle === 'arcus-tee');
  const hasAllPathsTee = items.some(item => item.productHandle === 'all-paths-tee');
  const teeBundleDiscount = (hasArcusTee && hasAllPathsTee) ? 2.00 : 0;

  // Check if both hoodie + sweatpants set items are in cart for set discount
  const hasSetHoodie = items.some(item => item.productHandle === 'arcus-set-hoodie');
  const hasSetPants = items.some(item => item.productHandle === 'arcus-set-sweatpants');
  const setBundleDiscount = (hasSetHoodie && hasSetPants) ? 15.00 : 0;

  const bundleDiscount = teeBundleDiscount + setBundleDiscount;

  const shipping = 0; // Handled at Shopify checkout
  const tax = 0; // Handled at Shopify checkout
  const total = subtotal - bundleDiscount + shipping + tax;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90]"
            style={{
              background: 'radial-gradient(circle at 0% 0%, rgba(30, 30, 30, 0.3) 0%, rgba(0, 0, 0, 0.85) 100%)',
              backdropFilter: 'blur(16px)',
            }}
          />

          {/* Cart Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] z-[100] flex flex-col border-l border-off-white/10"
            style={{
              boxShadow: '-4px 0 32px rgba(0, 0, 0, 0.9), -1px 0 0 rgba(245, 245, 240, 0.1)',
              backgroundColor: '#1A1A1A'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-off-white/20 bg-gradient-to-b from-off-white/5 to-transparent">
              <h2 className="text-off-white uppercase tracking-widest text-2xl font-bold">Cart</h2>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-off-white/10 transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close cart"
              >
                <X className="w-6 h-6 text-off-white" />
              </motion.button>
            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-6 px-6"
                >
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ShoppingBag className="w-20 h-20 text-off-white/40" strokeWidth={1.5} />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <p className="text-off-white/80 uppercase tracking-widest text-lg font-semibold">Your cart is empty</p>
                    <p className="text-off-white/50 text-sm tracking-wide">Add some products to get started</p>
                  </div>
                </motion.div>
              ) : (
                <div className="p-4 space-y-4">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.variantId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 pb-4 border-b border-off-white/10 last:border-0 last:pb-0"
                      whileHover={{
                        backgroundColor: 'rgba(245, 245, 240, 0.03)',
                        transition: { duration: 0.2 }
                      }}
                      style={{
                        borderRadius: '8px',
                        padding: '8px'
                      }}
                    >
                      {/* Product Image - Improved with faded edges */}
                      <div className="flex-shrink-0 overflow-hidden bg-[#1A1A1A] rounded-lg relative" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', width: '76px', height: '88px' }}>
                        <img
                          src={item.image}
                          alt={item.productTitle}
                          className="w-full h-full object-cover"
                        />
                        {/* Stronger faded edge overlay */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 25%, rgba(26, 26, 26, 0.5) 55%, rgba(26, 26, 26, 0.9) 85%, rgba(26, 26, 26, 1) 100%)'
                          }}
                        />
                      </div>

                      {/* Product Info - Better spacing */}
                      <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
                        {/* Product Title and Size */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-off-white uppercase tracking-wide text-sm font-semibold truncate">
                              {item.productTitle}
                            </h3>
                          </div>
                          <p className="text-off-white/60 text-xs uppercase tracking-wider mt-1">
                            Size: {item.size}
                          </p>
                        </div>

                        {/* Bottom Row: Quantity and Price/Remove */}
                        <div className="flex items-center justify-between gap-3">
                          {/* Quantity Controls - Better size */}
                          <div className="flex items-center border border-off-white/30 rounded-lg overflow-hidden bg-off-white/5">
                            <motion.button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="p-1.5 hover:bg-off-white/10 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3 text-off-white" />
                            </motion.button>
                            <span className="text-off-white px-2.5 text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <motion.button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              className="p-1.5 hover:bg-off-white/10 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3 text-off-white" />
                            </motion.button>
                          </div>

                          {/* Price and Remove Button */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <p className="text-sm font-bold whitespace-nowrap text-off-white">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <motion.button
                              onClick={() => removeFromCart(item.variantId)}
                              className="p-1 text-off-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Totals and Checkout - Always Visible */}
            {items.length > 0 && (
              <div className="border-t border-off-white/20 p-4 space-y-4 flex-shrink-0 bg-gradient-to-t from-off-white/5 to-transparent">
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-off-white/70 uppercase tracking-wider text-sm">
                    <span>Subtotal</span>
                    <span className="whitespace-nowrap font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  {items.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between items-center uppercase tracking-wider text-sm"
                    >
                      <span
                        className="text-green-400 font-bold"
                        style={{
                          textShadow: '0 0 10px rgba(34, 197, 94, 0.6), 0 0 20px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)',
                          filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))'
                        }}
                      >
                        Free Shipping
                      </span>
                      <span className="whitespace-nowrap font-semibold flex items-center gap-4 text-off-white/70">
                        <span
                          className="text-off-white/40 relative"
                          style={{
                            textDecoration: 'line-through',
                            textDecorationColor: 'rgba(239, 68, 68, 0.8)',
                            textDecorationThickness: '2px'
                          }}
                        >
                          $7.00
                        </span>
                        <span className="text-green-400 font-bold">$0.00</span>
                      </span>
                    </motion.div>
                  )}
                  {bundleDiscount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between items-center text-green-400 uppercase tracking-wider text-sm"
                    >
                      <span>Bundle Discount</span>
                      <span className="whitespace-nowrap font-semibold">-${bundleDiscount.toFixed(2)}</span>
                    </motion.div>
                  )}
                  {shipping > 0 && (
                    <div className="flex justify-between items-center text-off-white/70 uppercase tracking-wider text-sm">
                      <span>Shipping</span>
                      <span className="whitespace-nowrap font-semibold">${shipping.toFixed(2)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between items-center text-off-white/70 uppercase tracking-wider text-sm">
                      <span>Tax</span>
                      <span className="whitespace-nowrap font-semibold">${tax.toFixed(2)}</span>
                    </div>
                  )}
                  <motion.div
                    className="flex justify-between items-center text-off-white uppercase tracking-widest text-lg font-bold pt-3 border-t border-off-white/20"
                    animate={{
                      textShadow: [
                        '0 0 10px rgba(245, 245, 240, 0.4), 0 0 20px rgba(245, 245, 240, 0.2)',
                        '0 0 20px rgba(245, 245, 240, 0.8), 0 0 40px rgba(245, 245, 240, 0.4)',
                        '0 0 10px rgba(245, 245, 240, 0.4), 0 0 20px rgba(245, 245, 240, 0.2)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <span>Total</span>
                    <span className="whitespace-nowrap">${total.toFixed(2)}</span>
                  </motion.div>
                </div>

                {/* Error Message */}
                {checkoutError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center uppercase tracking-wide py-2 bg-red-400/10 rounded-lg border border-red-400/30"
                  >
                    {checkoutError}
                  </motion.div>
                )}

                {/* Checkout Button */}
                <motion.button
                  onClick={handleCheckout}
                  disabled={isCreatingCheckout || items.length === 0}
                  className="w-full px-6 py-4 text-black text-base font-bold uppercase tracking-widest disabled:cursor-not-allowed border-2 border-off-white relative overflow-hidden rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgb(250, 250, 245) 0%, rgb(240, 240, 235) 100%)'
                  }}
                  animate={{
                    opacity: isCreatingCheckout || items.length === 0 ? 0.5 : 1,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  }}
                  whileHover={
                    isCreatingCheckout || items.length === 0
                      ? {}
                      : {
                        scale: 1.02,
                        boxShadow: '0 12px 32px rgba(245, 245, 240, 0.6), 0 0 40px rgba(245, 245, 240, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        transition: { duration: 0.2 }
                      }
                  }
                  whileTap={
                    isCreatingCheckout || items.length === 0
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
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isCreatingCheckout ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating checkout...</span>
                      </>
                    ) : (
                      <>
                        Checkout
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            )}

            {/* Recommendation Section - Centered in Cart */}
            <AnimatePresence>
              {recommendationOpen && recommendedProduct && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed right-0 top-0 h-full w-full max-w-md flex items-center justify-center z-[110]"
                  onClick={() => setRecommendationOpen(false)}
                  style={{
                    pointerEvents: 'auto',
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="bg-off-white/15 rounded-2xl border-2 border-off-white/20 w-[420px] relative"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      boxShadow: '0 0 30px rgba(245, 245, 240, 0.15), 0 0 60px rgba(245, 245, 240, 0.08), inset 0 0 80px rgba(245, 245, 240, 0.04)',
                      backdropFilter: 'blur(10px)',
                      padding: '60px',
                      pointerEvents: 'auto'
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 0 40px rgba(245, 245, 240, 0.25), 0 0 80px rgba(245, 245, 240, 0.12), inset 0 0 100px rgba(245, 245, 240, 0.06)',
                      transition: { duration: 0.3 }
                    }}
                  >
                    {/* Close Button */}
                    <motion.button
                      onClick={() => setRecommendationOpen(false)}
                      className="absolute top-4 right-4 p-2 rounded-lg hover:bg-off-white/20 transition-colors z-10"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Close recommendation"
                    >
                      <X className="w-5 h-5 text-off-white" />
                    </motion.button>

                    <div className="flex flex-col items-center gap-3 w-full">
                      {/* Product Image */}
                      <div className="w-12 h-20 overflow-hidden bg-[#1A1A1A] rounded-lg relative">
                        <img
                          src={recommendedProduct.image}
                          alt={recommendedProduct.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Faded edge overlay */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 35%, rgba(26, 26, 26, 0.4) 65%, rgba(26, 26, 26, 0.85) 90%, rgba(26, 26, 26, 0.95) 100%)'
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex flex-col gap-1 text-center">
                        <h3 className="text-off-white uppercase tracking-wider text-xs font-semibold">
                          {recommendedProduct.name}
                        </h3>
                        <p className="text-off-white/60 text-xs">
                          Size: {recommendedSize}
                        </p>
                        <p className="text-off-white text-sm font-bold">
                          ${recommendedProduct.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Add Button */}
                      <motion.button
                        onClick={() => handleRecommendationAddToCart(recommendedProduct.id, recommendedProduct.handle)}
                        className="w-full px-6 py-3 bg-off-white text-black rounded-lg uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2"
                        style={{
                          boxShadow: '0 4px 12px rgba(245, 245, 240, 0.2)'
                        }}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: '0 8px 24px rgba(245, 245, 240, 0.5), 0 0 30px rgba(245, 245, 240, 0.3)',
                          backgroundColor: 'rgb(255, 255, 255)',
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </motion.button>

                      {/* Free Shipping Text */}
                      <p className="text-green-400 text-xs uppercase tracking-wider font-semibold">
                        Free Shipping
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

