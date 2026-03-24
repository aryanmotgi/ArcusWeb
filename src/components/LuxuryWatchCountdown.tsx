import { useState, useEffect } from 'react';
import { motion } from 'motion/react';


interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function LuxuryWatchCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date('2026-03-27T00:00:00');
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isExpired) return null;

  return (
    <motion.div
      className="fixed z-[9999]"
      style={{ 
        position: 'fixed',
        bottom: '100px',
        right: '40px',
      }}
      initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
    >
      {/* 3D Watch Container */}
      <motion.div
        className="relative"
        style={{ perspective: '1000px' }}
        animate={{ rotateY: [0, 5, 0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Watch Body */}
        <motion.div
          className="relative w-36 h-36 md:w-44 md:h-44 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #1a1a1a, #2a2a2a, #0a0a0a, #1a1a1a)',
            boxShadow: `
              0 0 0 4px #0a0a0a,
              0 0 0 6px linear-gradient(135deg, #c0c0c0, #808080),
              0 0 60px rgba(200, 200, 200, 0.15),
              0 20px 60px rgba(0, 0, 0, 0.8),
              inset 0 0 40px rgba(0, 0, 0, 0.5)
            `,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateX: [0, 2, 0, -2, 0],
            rotateZ: [0, 1, 0, -1, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Chrome Bezel */}
          <div 
            className="absolute -inset-2 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #e8e8e8 0%, #a0a0a0 20%, #f5f5f5 40%, #707070 60%, #c0c0c0 80%, #909090 100%)',
              padding: '3px',
              borderRadius: '50%',
            }}
          >
            <div 
              className="w-full h-full rounded-full"
              style={{
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
              }}
            />
          </div>

          {/* Diamond Markers */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 30}deg) translateY(-62px) translateX(-50%)`,
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rotate-45"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #c0c0c0 50%, #808080 100%)',
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 15px rgba(200, 200, 200, 0.5)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            </motion.div>
          ))}

          {/* Inner Ring with Bling */}
          <div 
            className="absolute inset-6 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #2a2a2a 0%, #0a0a0a 70%)',
              border: '1px solid rgba(200, 200, 200, 0.2)',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(200, 200, 200, 0.1)',
            }}
          />

          {/* Watch Face Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Pre-order Text */}
            <motion.div
              className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] mb-0.5"
              style={{
                background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #a0a0a0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Pre-order Ends
            </motion.div>

            {/* Main Time Display */}
            <div className="flex items-center gap-0.5 md:gap-1">
              <TimeUnit value={timeLeft.days} label="D" />
              <Separator />
              <TimeUnit value={timeLeft.hours} label="H" />
              <Separator />
              <TimeUnit value={timeLeft.minutes} label="M" />
              <Separator />
              <TimeUnit value={timeLeft.seconds} label="S" isSeconds />
            </div>

            {/* Arcus Logo Text */}
            <motion.div
              className="mt-1 text-[7px] md:text-[8px] uppercase tracking-[0.4em] font-bold"
              style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 8px rgba(74, 222, 128, 0.6))',
              }}
            >
              Limited Drop
            </motion.div>
          </div>

          {/* Spinning Second Hand */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-0.5 h-12 md:h-14 origin-bottom"
            style={{
              background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)',
              boxShadow: '0 0 10px rgba(74, 222, 128, 0.8)',
              transform: 'translateX(-50%)',
              marginTop: '-48px',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          />

          {/* Center Jewel */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-3 h-3 md:w-4 md:h-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #c0c0c0 40%, #606060 100%)',
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(200, 200, 200, 0.5)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(200, 200, 200, 0.5)',
                '0 0 25px rgba(255, 255, 255, 1), 0 0 50px rgba(200, 200, 200, 0.8)',
                '0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(200, 200, 200, 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Reflection Highlight */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%, transparent 100%)',
            }}
          />
        </motion.div>

        {/* Watch Crown */}
        <motion.div
          className="absolute top-1/2 -right-3 w-3 h-6 -translate-y-1/2"
          style={{
            background: 'linear-gradient(90deg, #909090 0%, #e0e0e0 30%, #a0a0a0 70%, #707070 100%)',
            borderRadius: '2px',
            boxShadow: '2px 0 10px rgba(0, 0, 0, 0.5)',
          }}
          animate={{ rotateY: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {/* Crown ridges */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-0.5"
              style={{
                top: `${20 + i * 18}%`,
                background: 'linear-gradient(90deg, #606060 0%, #a0a0a0 50%, #606060 100%)',
              }}
            />
          ))}
        </motion.div>

        {/* Floating Sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: '#ffffff',
              boxShadow: '0 0 6px #ffffff, 0 0 12px rgba(200, 200, 200, 0.8)',
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

function TimeUnit({ value, label, isSeconds }: { value: number; label: string; isSeconds?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="text-base md:text-lg font-bold tabular-nums"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #c0c0c0 50%, #808080 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))',
          fontFamily: 'monospace',
        }}
        animate={isSeconds ? { scale: [1, 1.05, 1] } : {}}
        transition={isSeconds ? { duration: 1, repeat: Infinity } : {}}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <span 
        className="text-[6px] uppercase tracking-wider"
        style={{ color: 'rgba(200, 200, 200, 0.6)' }}
      >
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <motion.span
      className="text-sm md:text-base font-bold"
      style={{
        background: 'linear-gradient(180deg, #808080 0%, #404040 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      :
    </motion.span>
  );
}
