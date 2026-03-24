import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BundlePopup() {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  const lines = ['$35', 'for both', 'T-Shirts!'];

  useEffect(() => {
    if (isExpanded && lineIndex < lines.length) {
      if (charIndex < lines[lineIndex].length) {
        const timer = setTimeout(() => {
          setCharIndex(charIndex + 1);
        }, 80);
        return () => clearTimeout(timer);
      } else if (lineIndex < lines.length - 1) {
        const timer = setTimeout(() => {
          setLineIndex(lineIndex + 1);
          setCharIndex(0);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isExpanded, lineIndex, charIndex]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 300,
          delay: 1.5
        }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.div
          animate={{
            boxShadow: isExpanded
              ? '0 0 40px 15px rgba(245, 245, 240, 0.2), 0 0 70px 30px rgba(245, 245, 240, 0.08)'
              : [
                  '0 0 0 0 rgba(245, 245, 240, 0), 0 0 20px 8px rgba(245, 245, 240, 0)',
                  '0 0 20px 8px rgba(245, 245, 240, 0.25), 0 0 40px 15px rgba(245, 245, 240, 0.12)',
                  '0 0 0 0 rgba(245, 245, 240, 0), 0 0 20px 8px rgba(245, 245, 240, 0)'
                ],
            width: isExpanded ? '180px' : '120px',
            height: isExpanded ? '180px' : '120px'
          }}
          transition={isExpanded ? { duration: 0.4 } : {
            boxShadow: { duration: 2, repeat: Infinity, ease: 'easeOut' },
            width: { duration: 0.4 },
            height: { duration: 0.4 }
          }}
          onClick={() => {
            if (!isExpanded) {
              setIsExpanded(true);
              setLineIndex(0);
              setCharIndex(0);
            }
          }}
          className="relative rounded-full cursor-pointer overflow-hidden"
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1000px',
            background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000000 100%)'
          }}
          whileHover={!isExpanded ? { scale: 1.05 } : {}}
          whileTap={!isExpanded ? { scale: 0.95 } : {}}
        >
          {/* TRUE 3D SPHERE SHADING */}

          {/* Main sphere gradient - creates the round form */}
          <div className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 35% 35%,
                  #2a2a2a 0%,
                  #1a1a1a 20%,
                  #0f0f0f 40%,
                  #050505 60%,
                  #000000 100%
                )
              `
            }}
          />

          {/* Specular highlight - bright glossy spot */}
          <div className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 30% 28%,
                  rgba(255, 255, 255, 0.5) 0%,
                  rgba(255, 255, 255, 0.3) 8%,
                  rgba(255, 255, 255, 0.1) 15%,
                  transparent 25%
                )
              `
            }}
          />

          {/* Ambient occlusion - deep shadow on bottom right */}
          <div className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 70% 70%,
                  rgba(0, 0, 0, 0.8) 0%,
                  rgba(0, 0, 0, 0.4) 30%,
                  transparent 60%
                )
              `
            }}
          />

          {/* Subsurface scattering / edge glow */}
          <div className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 50% 50%,
                  transparent 0%,
                  transparent 70%,
                  rgba(245, 245, 240, 0.12) 85%,
                  rgba(245, 245, 240, 0.25) 95%,
                  rgba(245, 245, 240, 0.15) 100%
                )
              `,
              boxShadow: `
                inset -15px -15px 40px rgba(0, 0, 0, 0.9),
                inset 15px 15px 30px rgba(255, 255, 255, 0.03)
              `
            }}
          />

          {/* Reflected light - subtle bounce light on shadow side */}
          <div className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 75% 75%,
                  rgba(245, 245, 240, 0.08) 0%,
                  transparent 30%
                )
              `
            }}
          />

          {/* Close button - only show when expanded */}
          {isExpanded && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-off-white rounded-full flex items-center justify-center shadow-xl z-10"
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4 text-black" />
            </motion.button>
          )}

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            {!isExpanded ? (
              /* Initial state - TAP ME */
              <motion.div
                animate={{
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <p className="text-off-white text-sm font-bold uppercase tracking-widest">TAP ME</p>
              </motion.div>
            ) : (
              /* Expanded state - Line by line, character by character reveal */
              <div className="text-center px-4 flex flex-col items-center justify-center gap-1">
                {lines.map((line, lIndex) => (
                  <div key={lIndex} className="text-off-white font-black uppercase tracking-wide leading-tight">
                    {lIndex <= lineIndex && line.split('').map((char, cIndex) => (
                      <motion.span
                        key={cIndex}
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: lIndex < lineIndex || (lIndex === lineIndex && cIndex < charIndex) ? 1 : 0
                        }}
                        transition={{
                          duration: 0.1,
                          ease: 'easeIn'
                        }}
                        className={`inline-block ${line === '$35' ? 'text-2xl font-extrabold' : 'text-sm'}`}
                        style={{ minWidth: char === ' ' ? '3px' : 'auto' }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rotating shine effect */}
          {!isExpanded && (
            <motion.div
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="absolute inset-0 rounded-full opacity-30"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(245, 245, 240, 0.15) 50%, transparent 70%)'
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
