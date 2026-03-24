import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

interface SizeHelperProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  productType?: 'hoodie' | 'sweatpants' | 'bundle' | 'tee';
}

const heightRanges = [
  { label: "Under 5'5\"", sublabel: "Under 165cm", size: 'S' },
  { label: "5'5\" - 5'9\"", sublabel: "165-175cm", size: 'M' },
  { label: "5'10\"+", sublabel: "175cm+", size: 'L' },
];

export default function SizeHelper({ isOpen, onClose, onSelectSize }: SizeHelperProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const handleSelectHeight = (size: string) => {
    setSelectedSize(size);
  };

  const handleConfirm = () => {
    if (selectedSize) {
      onSelectSize(selectedSize);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedSize(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="rounded-2xl border border-off-white/30 max-w-md w-full shadow-2xl" 
              style={{ 
                background: 'linear-gradient(135deg, #252525 0%, #1A1A1A 100%)', 
                padding: '32px' 
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-off-white text-xl font-bold uppercase tracking-widest">
                  Find Your Size
                </h2>
                <motion.button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-off-white/10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-off-white/70" />
                </motion.button>
              </div>

              {/* Height Selection */}
              <p className="text-off-white/60 text-sm mb-4 uppercase tracking-wide">
                What's your height?
              </p>
              
              <div className="space-y-3 mb-8">
                {heightRanges.map((range) => (
                  <motion.button
                    key={range.size}
                    onClick={() => handleSelectHeight(range.size)}
                    className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${
                      selectedSize === range.size
                        ? 'border-off-white bg-off-white/10'
                        : 'border-off-white/20 hover:border-off-white/40'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-off-white font-semibold text-base">{range.label}</span>
                        <span className="text-off-white/50 text-sm ml-2">{range.sublabel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-off-white/70 text-lg font-bold">Size {range.size}</span>
                        {selectedSize === range.size && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Confirm Button */}
              <motion.button
                onClick={handleConfirm}
                disabled={!selectedSize}
                className="w-full py-4 bg-off-white text-black font-bold uppercase tracking-widest rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                whileHover={selectedSize ? { scale: 1.02 } : {}}
                whileTap={selectedSize ? { scale: 0.98 } : {}}
              >
                {selectedSize ? `Select Size ${selectedSize}` : 'Select Your Height'}
              </motion.button>

              {/* Fit Note */}
              <p className="text-off-white/40 text-xs text-center mt-4">
                All items have a relaxed, oversized fit
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
