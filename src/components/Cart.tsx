import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { createCheckout } from '../utils/shopify/checkout';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

  const subtotal = getCartTotal();

  // Check if both tees are in cart for bundle discount
  const hasArcusTee = items.some(item => item.productHandle === 'arcus-tee');
  const hasAllPathsTee = items.some(item => item.productHandle === 'all-paths-tee');
  const bundleDiscount = (hasArcusTee && hasAllPathsTee) ? 2.00 : 0;

  const shipping = 0; // TODO: Calculate shipping
  const tax = 0; // TODO: Calculate tax
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
            className="fixed inset-0 bg-black/50 z-[90]"
          />

          {/* Cart Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] z-[100] flex flex-col"
            style={{ 
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.8)',
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
                <div className="p-3 space-y-2">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.variantId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-2 pb-2 border-b border-off-white/10 last:border-0 last:pb-0"
                    >
                      {/* Product Image - Much Smaller */}
                      <div className="w-12 h-14 flex-shrink-0 overflow-hidden bg-[#1A1A1A] rounded border border-off-white/20">
                        <img
                          src={item.image}
                          alt={item.productTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info - Very Compact */}
                      <div className="flex-1 flex flex-col justify-between gap-1 min-w-0">
                        {/* Product Title and Size */}
                        <div>
                          <h3 className="text-off-white uppercase tracking-wide text-xs font-semibold truncate">
                            {item.productTitle}
                          </h3>
                          <p className="text-off-white/60 text-[10px] uppercase tracking-wider">
                            Size: {item.size}
                          </p>
                        </div>

                        {/* Bottom Row: Quantity and Price/Remove */}
                        <div className="flex items-center justify-between gap-2">
                          {/* Quantity Controls - Very Compact */}
                          <div className="flex items-center border border-off-white/30 rounded overflow-hidden bg-off-white/5">
                            <motion.button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="p-1 hover:bg-off-white/10 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-2.5 h-2.5 text-off-white" />
                            </motion.button>
                            <span className="text-off-white px-1.5 text-[10px] font-semibold">
                              {item.quantity}
                            </span>
                            <motion.button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              className="p-1 hover:bg-off-white/10 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-2.5 h-2.5 text-off-white" />
                            </motion.button>
                          </div>

                          {/* Price and Remove Button */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <p className="text-off-white text-xs font-bold whitespace-nowrap">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <motion.button
                              onClick={() => removeFromCart(item.variantId)}
                              className="p-0.5 text-off-white/60 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
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
                  <div className="flex justify-between items-center text-off-white uppercase tracking-widest text-lg font-bold pt-3 border-t border-off-white/20">
                    <span>Total</span>
                    <span className="whitespace-nowrap">${total.toFixed(2)}</span>
                  </div>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

