import { motion, AnimatePresence } from 'motion/react';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  handle: string;
}

interface CartRecommendationProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedProduct: RecommendedProduct | null;
  onAddToCart: (productId: string, productHandle: string) => void;
  currentSize: string;
}

export default function CartRecommendation({
  isOpen,
  onClose,
  recommendedProduct,
  onAddToCart,
  currentSize
}: CartRecommendationProps) {
  const [isAdding, setIsAdding] = useState(false);

  if (!recommendedProduct) return null;

  const handleAddToCart = () => {
    setIsAdding(true);
    onAddToCart(recommendedProduct.id, recommendedProduct.handle);
    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90vw] max-w-md"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="relative bg-[#1A1A1A] rounded-lg overflow-hidden"
              style={{
                border: '1px solid rgba(245, 245, 240, 0.2)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 245, 240, 0.1)'
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-off-white" />
              </button>

              {/* Content */}
              <div className="p-8">
                <motion.h3
                  className="text-off-white/90 text-sm uppercase tracking-wider mb-6 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  Complete Your Collection
                </motion.h3>

                {/* Product Image */}
                <motion.div
                  className="relative w-full aspect-[3/4] mb-6 overflow-hidden rounded-lg"
                  style={{ backgroundColor: '#161616' }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <img
                    src={recommendedProduct.image}
                    alt={recommendedProduct.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center center' }}
                  />
                  {/* Faded edge overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at center, transparent 0%, transparent 45%, rgba(22, 22, 22, 0.3) 70%, rgba(22, 22, 22, 0.8) 90%, rgba(22, 22, 22, 0.95) 100%)'
                    }}
                  />
                </motion.div>

                {/* Product Info */}
                <motion.div
                  className="text-center mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <h4 className="text-off-white uppercase tracking-wide mb-2">
                    {recommendedProduct.name}
                  </h4>
                  <p className="text-off-white/70 text-sm mb-1">
                    ${recommendedProduct.price.toFixed(2)}
                  </p>
                  <p className="text-off-white/50 text-xs">
                    Size: {currentSize}
                  </p>
                </motion.div>

                {/* Add to Cart Button */}
                <motion.button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full py-4 bg-off-white text-black uppercase tracking-wider font-medium rounded-lg flex items-center justify-center gap-2 transition-all relative overflow-hidden"
                  style={{
                    boxShadow: '0 4px 12px rgba(245, 245, 240, 0.3)'
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(245, 245, 240, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isAdding ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Adding...
                    </motion.span>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add to Cart
                    </>
                  )}
                </motion.button>

                {/* Skip button */}
                <motion.button
                  onClick={onClose}
                  className="w-full mt-3 py-2 text-off-white/50 hover:text-off-white/70 text-sm uppercase tracking-wide transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  No Thanks
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
