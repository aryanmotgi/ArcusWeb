import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import logo from '../assets/arcus-wordmark.png';
import { useCart } from '../contexts/CartContext';
import Menu from './Menu';

interface OrderInfo {
  orderNumber?: string;
  orderId?: string;
  checkoutId?: string;
  orderName?: string;
  orderStatusUrl?: string;
}

export default function ThankYou() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart, items } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({});

  // Extract order information from URL parameters (Shopify may pass various formats)
  useEffect(() => {
    const extractedInfo: OrderInfo = {};

    // Common Shopify URL parameters
    extractedInfo.orderNumber = searchParams.get('order') || searchParams.get('order_number') || undefined;
    extractedInfo.orderId = searchParams.get('order_id') || searchParams.get('orderId') || undefined;
    extractedInfo.checkoutId = searchParams.get('checkout_id') || searchParams.get('checkoutId') || undefined;
    extractedInfo.orderName = searchParams.get('order_name') || searchParams.get('orderName') || undefined;
    extractedInfo.orderStatusUrl = searchParams.get('order_status_url') || searchParams.get('orderStatusUrl') || undefined;

    // Also check for Shopify's standard return_to parameter
    const returnTo = searchParams.get('return_to');
    if (returnTo) {
      // If return_to contains order info, try to extract it
      try {
        const returnUrl = new URL(returnTo);
        extractedInfo.orderNumber = extractedInfo.orderNumber || returnUrl.searchParams.get('order') || undefined;
        extractedInfo.orderId = extractedInfo.orderId || returnUrl.searchParams.get('order_id') || undefined;
      } catch {
        // If return_to is not a valid URL, ignore
      }
    }

    setOrderInfo(extractedInfo);

    // Store order info in localStorage for reference (optional)
    if (extractedInfo.orderNumber || extractedInfo.orderId) {
      try {
        const orderHistory = JSON.parse(localStorage.getItem('arcus_order_history') || '[]');
        const newOrder = {
          ...extractedInfo,
          date: new Date().toISOString(),
        };
        orderHistory.unshift(newOrder);
        // Keep only last 10 orders
        localStorage.setItem('arcus_order_history', JSON.stringify(orderHistory.slice(0, 10)));
      } catch (error) {
        console.error('Failed to save order to history:', error);
      }
    }
  }, [searchParams]);

  // Clear cart when component mounts (order is complete)
  useEffect(() => {
    // Only clear cart if we have order confirmation or if cart has items
    // This prevents clearing cart if user navigates directly to /thank-you
    if (orderInfo.orderNumber || orderInfo.orderId || items.length > 0) {
      clearCart();
    }
  }, [clearCart, orderInfo.orderNumber, orderInfo.orderId, items.length]);

  return (
    <motion.div
      className="min-h-screen w-screen text-off-white relative"
      style={{ backgroundColor: '#1A1A1A' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Header Bar */}
      <header className="fixed top-0 w-full z-50 py-8" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="w-full px-16 flex items-center justify-between">
          {/* Logo centered */}
          <div className="flex items-center flex-1 justify-center">
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

      {/* Thank You Content */}
      <main className="min-h-screen flex items-center justify-center px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-8 py-24">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center"
          >
            <div className="w-24 h-24 rounded-full bg-off-white/10 flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-off-white" />
            </div>
          </motion.div>

          {/* Thank You Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-6xl uppercase tracking-wider">
              Thank You
            </h1>
            <p className="text-off-white/70 text-lg uppercase tracking-wide">
              Your order has been confirmed
            </p>
          </motion.div>

          {/* Order Information */}
          {(orderInfo.orderNumber || orderInfo.orderId || orderInfo.orderName) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2 text-off-white/60 uppercase tracking-wide text-sm border border-off-white/20 rounded-lg p-6 bg-off-white/5"
            >
              <p className="text-off-white/80 mb-3 text-base">Order Details</p>
              {orderInfo.orderNumber && (
                <p>
                  Order Number: <span className="text-off-white font-mono">{orderInfo.orderNumber}</span>
                </p>
              )}
              {orderInfo.orderName && (
                <p>
                  Order Name: <span className="text-off-white font-mono">{orderInfo.orderName}</span>
                </p>
              )}
              {orderInfo.orderId && (
                <p>
                  Order ID: <span className="text-off-white font-mono text-xs">{orderInfo.orderId}</span>
                </p>
              )}
              {orderInfo.orderStatusUrl && (
                <p className="pt-2">
                  <a
                    href={orderInfo.orderStatusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-off-white hover:text-off-white/70 underline"
                  >
                    View Order Status →
                  </a>
                </p>
              )}
            </motion.div>
          )}

          {/* Confirmation Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4 text-off-white/70 uppercase tracking-wide"
          >
            <p>
              We've received your order and will send you a confirmation email shortly.
            </p>
            <p className="text-sm">
              You'll receive another email when your order ships.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-4 bg-off-white text-black uppercase tracking-wide hover:bg-off-white/90 transition-colors flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 border border-off-white/30 text-off-white uppercase tracking-wide hover:border-off-white hover:bg-off-white/10 transition-colors flex items-center gap-2"
            >
              Back to Home
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}

