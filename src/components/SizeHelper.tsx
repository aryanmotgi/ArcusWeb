import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ruler, X, Check, Sparkles } from 'lucide-react';

interface SizeHelperProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
}

type MeasurementUnit = 'inches' | 'cm';

interface SizeRecommendation {
  size: string;
  confidence: number;
  fit: 'perfect' | 'slightly loose' | 'slightly tight';
}

export default function SizeHelper({ isOpen, onClose, onSelectSize }: SizeHelperProps) {
  const [unit, setUnit] = useState<MeasurementUnit>('inches');
  const [chest, setChest] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Size chart data (chest measurements)
  const sizeChart = {
    inches: {
      S: { chest: [34, 36], height: [64, 68], weight: [120, 150] },
      M: { chest: [38, 40], height: [68, 72], weight: [150, 180] },
      L: { chest: [42, 44], height: [70, 74], weight: [180, 210] },
      XL: { chest: [46, 48], height: [72, 76], weight: [210, 240] }
    },
    cm: {
      S: { chest: [86, 91], height: [163, 173], weight: [54, 68] },
      M: { chest: [97, 102], height: [173, 183], weight: [68, 82] },
      L: { chest: [107, 112], height: [178, 188], weight: [82, 95] },
      XL: { chest: [117, 122], height: [183, 193], weight: [95, 109] }
    }
  };

  const calculateSize = () => {
    if (!chest && !height && !weight) return;

    setIsCalculating(true);

    // Simulate AI calculation delay for better UX
    setTimeout(() => {
      const chestNum = parseFloat(chest);
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);

      let bestSize = '';
      let bestScore = -Infinity;
      let fit: 'perfect' | 'slightly loose' | 'slightly tight' = 'perfect';

      // Score each size based on measurements
      Object.entries(sizeChart[unit]).forEach(([size, ranges]) => {
        let score = 0;
        let measurements = 0;

        if (chest) {
          measurements++;
          const [min, max] = ranges.chest;
          const mid = (min + max) / 2;
          const tolerance = (max - min) / 2;

          if (chestNum >= min && chestNum <= max) {
            score += 10; // Perfect fit
          } else if (chestNum > max && chestNum <= max + tolerance) {
            score += 5; // Slightly tight
          } else if (chestNum < min && chestNum >= min - tolerance) {
            score += 5; // Slightly loose
          }
        }

        if (height) {
          measurements++;
          const [min, max] = ranges.height;
          if (heightNum >= min && heightNum <= max) {
            score += 5;
          }
        }

        if (weight) {
          measurements++;
          const [min, max] = ranges.weight;
          if (weightNum >= min && weightNum <= max) {
            score += 5;
          }
        }

        // Normalize score by number of measurements
        const normalizedScore = measurements > 0 ? score / measurements : 0;

        if (normalizedScore > bestScore) {
          bestScore = normalizedScore;
          bestSize = size;

          // Determine fit type
          if (chest) {
            const [min, max] = ranges.chest;
            const mid = (min + max) / 2;
            if (chestNum < mid - 1) fit = 'slightly loose';
            else if (chestNum > mid + 1) fit = 'slightly tight';
            else fit = 'perfect';
          }
        }
      });

      // Calculate confidence (0-100)
      const confidence = Math.min(100, Math.max(0, (bestScore / 10) * 100));

      setRecommendation({
        size: bestSize,
        confidence: Math.round(confidence),
        fit
      });

      setIsCalculating(false);
    }, 800);
  };

  const handleSelectSize = () => {
    if (recommendation) {
      onSelectSize(recommendation.size);
      onClose();
    }
  };

  const reset = () => {
    setChest('');
    setHeight('');
    setWeight('');
    setRecommendation(null);
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
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0a0a0a] rounded-3xl border-2 border-off-white/40 p-8 md:p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 245, 240, 0.1)' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-off-white/20 to-off-white/5">
                    <Sparkles className="w-7 h-7 text-off-white" />
                  </div>
                  <h2 className="text-off-white text-3xl md:text-4xl font-bold uppercase tracking-widest">
                    Size Guide
                  </h2>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-3 rounded-xl hover:bg-off-white/10 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-7 h-7 text-off-white" />
                </motion.button>
              </div>

              {/* Description */}
              <p className="text-off-white/70 text-base md:text-lg mb-10 leading-relaxed">
                Enter your measurements below and we'll recommend the perfect size for you.
              </p>

              {/* Unit Toggle */}
              <div className="flex gap-3 mb-10">
                <motion.button
                  onClick={() => setUnit('inches')}
                  className={`flex-1 py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-base transition-colors ${
                    unit === 'inches'
                      ? 'bg-off-white text-black shadow-lg'
                      : 'bg-off-white/10 text-off-white/60 hover:bg-off-white/20'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  Inches
                </motion.button>
                <motion.button
                  onClick={() => setUnit('cm')}
                  className={`flex-1 py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-base transition-colors ${
                    unit === 'cm'
                      ? 'bg-off-white text-black shadow-lg'
                      : 'bg-off-white/10 text-off-white/60 hover:bg-off-white/20'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  Centimeters
                </motion.button>
              </div>

              {/* Input Fields */}
              <div className="space-y-8 mb-12">
                <div>
                  <label className="block text-off-white text-base md:text-lg uppercase tracking-wide mb-3 font-semibold">
                    Chest ({unit})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      placeholder="e.g. 38"
                      className="w-full bg-off-white/5 border-2 border-off-white/20 rounded-xl px-6 py-4 text-off-white text-lg placeholder:text-off-white/30 focus:border-off-white/50 focus:outline-none transition-colors"
                    />
                    <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-off-white/30" />
                  </div>
                </div>

                <div>
                  <label className="block text-off-white text-base md:text-lg uppercase tracking-wide mb-3 font-semibold">
                    Height ({unit}) <span className="text-off-white/50 text-sm font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder={unit === 'inches' ? 'e.g. 70' : 'e.g. 178'}
                      className="w-full bg-off-white/5 border-2 border-off-white/20 rounded-xl px-6 py-4 text-off-white text-lg placeholder:text-off-white/30 focus:border-off-white/50 focus:outline-none transition-colors"
                    />
                    <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-off-white/30" />
                  </div>
                </div>

                <div>
                  <label className="block text-off-white text-base md:text-lg uppercase tracking-wide mb-3 font-semibold">
                    Weight ({unit === 'inches' ? 'lbs' : 'kg'}) <span className="text-off-white/50 text-sm font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder={unit === 'inches' ? 'e.g. 165' : 'e.g. 75'}
                      className="w-full bg-off-white/5 border-2 border-off-white/20 rounded-xl px-6 py-4 text-off-white text-lg placeholder:text-off-white/30 focus:border-off-white/50 focus:outline-none transition-colors"
                    />
                    <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-off-white/30" />
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              {!recommendation && (
                <motion.button
                  onClick={calculateSize}
                  disabled={!chest && !height && !weight}
                  className="w-full py-5 px-8 bg-gradient-to-br from-off-white to-off-white/90 text-black text-lg font-bold uppercase tracking-widest rounded-xl disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                  whileHover={
                    chest || height || weight
                      ? { scale: 1.02, boxShadow: '0 12px 32px rgba(245, 245, 240, 0.4)' }
                      : {}
                  }
                  whileTap={chest || height || weight ? { scale: 0.98 } : {}}
                >
                  {isCalculating ? (
                    <span className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-6 h-6" />
                      </motion.div>
                      Calculating...
                    </span>
                  ) : (
                    'Find My Size'
                  )}
                </motion.button>
              )}

              {/* Recommendation */}
              <AnimatePresence mode="wait">
                {recommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 p-8 md:p-10 bg-gradient-to-br from-off-white/15 to-off-white/5 border-2 border-off-white/40 rounded-2xl shadow-xl"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 rounded-full bg-green-500/20">
                        <Check className="w-7 h-7 text-green-400" strokeWidth={3} />
                      </div>
                      <h3 className="text-off-white font-bold uppercase tracking-widest text-xl md:text-2xl">
                        Recommended Size
                      </h3>
                    </div>

                    <div className="flex items-baseline gap-6 mb-8">
                      <span className="text-off-white text-6xl md:text-7xl font-bold">
                        {recommendation.size}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-off-white/70 text-base uppercase tracking-wide">
                            Confidence
                          </span>
                          <span className="text-off-white text-xl font-bold">
                            {recommendation.confidence}%
                          </span>
                        </div>
                        <div className="w-full bg-off-white/20 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${recommendation.confidence}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-green-400 to-green-500"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-off-white/70 text-base md:text-lg mb-8 leading-relaxed">
                      Based on your measurements, this size should fit{' '}
                      <span className="text-off-white font-bold">
                        {recommendation.fit === 'perfect'
                          ? 'perfectly'
                          : recommendation.fit === 'slightly loose'
                          ? 'slightly loose'
                          : 'slightly snug'}
                      </span>
                      .
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <motion.button
                        onClick={handleSelectSize}
                        className="flex-1 py-4 px-8 bg-off-white text-black text-base font-bold uppercase tracking-widest rounded-xl shadow-lg"
                        whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(245, 245, 240, 0.3)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Select Size {recommendation.size}
                      </motion.button>
                      <motion.button
                        onClick={reset}
                        className="px-8 py-4 border-2 border-off-white/40 text-off-white hover:bg-off-white/10 font-bold uppercase tracking-wider text-base rounded-xl transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Reset
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
