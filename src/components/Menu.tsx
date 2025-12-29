import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { to: '/', label: 'Home', number: '01', special: false },
  { to: '/products', label: 'Collection', number: '02', special: false },
  { to: '/about', label: 'About', number: '03', special: false },
  { to: '/representers', label: 'Exclusive Access', number: '04', special: true },
];

export default function Menu({ isOpen, onClose }: MenuProps) {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [clickedItem, setClickedItem] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              background: 'radial-gradient(circle at 80% 50%, rgba(20, 20, 20, 0.5) 0%, rgba(0, 0, 0, 0.95) 100%)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Menu Panel */}
          <motion.div
            className="fixed top-0 right-0 h-screen w-full max-w-lg z-[100] flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 300 }}
            style={{
              background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
              boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.9)',
              borderLeft: '1px solid rgba(245, 245, 240, 0.05)'
            }}
          >
            {/* Animated gradient orb in background */}
            <motion.div
              className="absolute -right-32 top-1/4 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(40, 40, 40, 0.12) 0%, transparent 70%)',
                filter: 'blur(60px)',
              }}
              animate={{
                y: [0, 30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Close Button */}
            <motion.div
              className="flex justify-end p-8"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <button
                onClick={onClose}
                className="text-off-white/60 hover:text-off-white transition-all duration-300 hover:rotate-90 group relative"
              >
                <X className="w-7 h-7" />
                <div className="absolute inset-0 bg-off-white/10 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 -z-10" />
              </button>
            </motion.div>

            {/* Menu Links */}
            <nav className="flex-1 flex flex-col items-center justify-center gap-16 px-8 relative">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  className="relative w-full"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.1 + index * 0.1,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Background glow on hover */}
                  <motion.div
                    className="absolute inset-0 -left-6 -right-6 rounded-lg pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredItem === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(245, 245, 240, 0.03) 50%, transparent 100%)',
                    }}
                  />

                  <Link
                    to={item.to}
                    onClick={() => {
                      setClickedItem(index);
                      setTimeout(() => onClose(), 400);
                    }}
                    className="flex items-center justify-center py-4 group relative w-full"
                  >
                    {/* Label */}
                    <motion.span
                      className="text-3xl tracking-wide uppercase relative text-center"
                      style={{
                        color: item.special ? 'rgba(150, 200, 255, 0.9)' : 'rgba(245, 245, 240, 0.7)',
                        fontWeight: item.special ? 400 : 300,
                        letterSpacing: '0.1em',
                        textShadow: item.special ? '0 0 20px rgba(100, 150, 255, 0.5), 0 0 40px rgba(100, 150, 255, 0.3)' : 'none',
                      }}
                      animate={{
                        color: hoveredItem === index
                          ? (item.special ? 'rgba(200, 230, 255, 1)' : 'rgba(245, 245, 240, 1)')
                          : (item.special ? 'rgba(150, 200, 255, 0.9)' : 'rgba(245, 245, 240, 0.7)'),
                        x: hoveredItem === index ? 8 : 0,
                        scale: clickedItem === index ? 0.95 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Special shine overlay for Exclusive Access - only over the text */}
                      {item.special && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{ overflow: 'visible' }}
                        >
                          <motion.div
                            className="absolute top-0 bottom-0"
                            style={{
                              width: '100px',
                              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 100%)',
                              boxShadow: '0 0 40px rgba(255, 255, 255, 1), 0 0 60px rgba(255, 255, 255, 0.8)',
                              filter: 'blur(2px)',
                            }}
                            animate={{
                              left: ['-100px', 'calc(100% + 100px)', '-100px'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        </motion.div>
                      )}
                      {item.label}

                      {/* Underline effect */}
                      <motion.div
                        className="absolute bottom-0 left-0 h-[1px]"
                        style={{
                          background: item.special
                            ? 'linear-gradient(90deg, rgba(100, 150, 255, 0.8), rgba(150, 200, 255, 1), rgba(100, 150, 255, 0.8))'
                            : 'rgba(245, 245, 240, 1)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: hoveredItem === index ? '100%' : 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </motion.span>
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}