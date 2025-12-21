import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
// import { createCheckout } from '../utils/shopify/checkout';

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

    // try {
    //   setIsCreatingCheckout(true);
    //   setCheckoutError(null);

    //   // Set return URL to thank you page after checkout completion
    //   const returnUrl = `${window.location.origin}/thank-you`;
    //   
    //   // Create checkout and get checkout URL
    //   const checkoutUrl = await createCheckout(items, returnUrl);

    //   // Redirect to Shopify checkout
    //   window.location.href = checkoutUrl;
    // } catch (error) {
    //   console.error('Error creating checkout:', error);
    //   setCheckoutError(
    //     error instanceof Error 
    //       ? error.message 
    //       : 'Failed to create checkout. Please try again.'
    //   );
    //   setIsCreatingCheckout(false);
    // }
    setCheckoutError('Checkout is temporarily unavailable');
    setIsCreatingCheckout(false);
  };

  const subtotal = getCartTotal();
  const shipping = 0; // TODO: Calculate shipping
  const tax = 0; // TODO: Calculate tax
  const total = subtotal + shipping + tax;

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
            <div className="flex items-center justify-between p-6 border-b border-off-white/10">
              <h2 className="text-off-white uppercase tracking-wide text-xl">Cart</h2>
              <button
                onClick={onClose}
                className="p-2 hover:opacity-70 transition-opacity"
                aria-label="Close cart"
              >
                <X className="w-6 h-6 text-off-white" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
                  <ShoppingBag className="w-16 h-16 text-off-white/30" />
                  <p className="text-off-white/70 uppercase tracking-wide">Your cart is empty</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {items.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex gap-4 pb-6 border-b border-off-white/10 last:border-0 last:pb-0"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-24 flex-shrink-0 overflow-hidden bg-[#1A1A1A] border border-off-white/10">
                        <img
                          src={item.image}
                          alt={item.productTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info - Takes remaining space */}
                      <div className="flex-1 flex flex-col gap-3 min-w-0">
                        {/* Product Title and Size */}
                        <div className="flex-1">
                          <h3 className="text-off-white uppercase tracking-wide text-sm mb-1 truncate">
                            {item.productTitle}
                          </h3>
                          <p className="text-off-white/60 text-xs uppercase tracking-wide">
                            Size: {item.size}
                          </p>
                        </div>

                        {/* Bottom Row: Quantity and Price/Remove */}
                        <div className="flex items-center justify-between gap-4 mt-auto">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-off-white/30">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="p-2 hover:bg-off-white/10 transition-colors flex-shrink-0"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4 text-off-white" />
                            </button>
                            <span className="text-off-white px-4 min-w-[3rem] text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              className="p-2 hover:bg-off-white/10 transition-colors flex-shrink-0"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4 text-off-white" />
                            </button>
                          </div>

                          {/* Price and Remove Button */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <p className="text-off-white text-sm whitespace-nowrap">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.variantId)}
                              className="p-1 text-off-white/60 hover:text-off-white transition-colors flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Totals and Checkout */}
            {items.length > 0 && (
              <div className="border-t border-off-white/10 p-6 space-y-4 flex-shrink-0">
                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-off-white/70 uppercase tracking-wide text-sm">
                    <span>Subtotal</span>
                    <span className="whitespace-nowrap">${subtotal.toFixed(2)}</span>
                  </div>
                  {shipping > 0 && (
                    <div className="flex justify-between items-center text-off-white/70 uppercase tracking-wide text-sm">
                      <span>Shipping</span>
                      <span className="whitespace-nowrap">${shipping.toFixed(2)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between items-center text-off-white/70 uppercase tracking-wide text-sm">
                      <span>Tax</span>
                      <span className="whitespace-nowrap">${tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-off-white uppercase tracking-wide text-lg pt-3 border-t border-off-white/10">
                    <span>Total</span>
                    <span className="whitespace-nowrap">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Error Message */}
                {checkoutError && (
                  <div className="text-red-400 text-sm text-center uppercase tracking-wide py-2">
                    {checkoutError}
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isCreatingCheckout || items.length === 0}
                  className="w-full px-8 py-4 bg-off-white text-black uppercase tracking-wide hover:bg-off-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingCheckout ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating checkout...</span>
                    </>
                  ) : (
                    'Checkout'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

