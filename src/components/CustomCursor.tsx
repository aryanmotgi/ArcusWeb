import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface CustomCursorProps {
  onProduct?: boolean;
}

export default function CustomCursor({ onProduct = false }: CustomCursorProps) {
  const [isHovering, setIsHovering] = useState(false);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Smooth spring animation for cursor movement
  const springConfig = { damping: 30, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if hovering over interactive elements
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.style.cursor === 'pointer' ||
        target.className.includes('cursor-pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Hide default cursor */}
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>

      {/* Custom cursor dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        {onProduct ? (
          // Two arcs when on product
          <div className="relative w-8 h-8">
            <motion.div
              className="absolute inset-0 border-2 border-off-white rounded-full"
              style={{
                clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              }}
              initial={{ rotate: 0, scale: 1 }}
              animate={{ rotate: -10, scale: 1.2 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-off-white rounded-full"
              style={{
                clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
              }}
              initial={{ rotate: 0, scale: 1 }}
              animate={{ rotate: 10, scale: 1.2 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        ) : (
          // Default dot that expands on hover
          <motion.div
            className="bg-off-white rounded-full"
            initial={{ width: 6, height: 6 }}
            animate={{
              width: isHovering ? 12 : 6,
              height: isHovering ? 12 : 6,
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        )}
      </motion.div>
    </>
  );
}
