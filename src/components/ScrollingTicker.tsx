import { motion } from 'motion/react';

interface TickerItem {
  text: string;
}

const tickerItems: TickerItem[] = [
  { text: 'ARCUS®' },
  { text: '✦' },
  { text: 'FREMONT, CALIFORNIA' },
  { text: '✦' },
  { text: '37.5485° N, 121.9886° W' },
  { text: '✦' },
  { text: 'ALL PATHS LEAD FORWARD' },
  { text: '✦' },
  { text: 'PREMIUM STREETWEAR' },
  { text: '✦' },
];

export default function ScrollingTicker() {
  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-black border-b border-off-white/20 overflow-hidden">
      <div className="relative flex">
        {/* First set */}
        <motion.div
          className="flex whitespace-nowrap py-2"
          animate={{
            x: [0, -1920],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span
              key={`ticker-1-${index}`}
              className="text-off-white/70 uppercase tracking-widest text-xs font-mono px-8"
              style={{
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                letterSpacing: '0.15em',
              }}
            >
              {item.text}
            </span>
          ))}
        </motion.div>

        {/* Second set for seamless loop */}
        <motion.div
          className="flex whitespace-nowrap py-2"
          animate={{
            x: [0, -1920],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span
              key={`ticker-2-${index}`}
              className="text-off-white/70 uppercase tracking-widest text-xs font-mono px-8"
              style={{
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                letterSpacing: '0.15em',
              }}
            >
              {item.text}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
