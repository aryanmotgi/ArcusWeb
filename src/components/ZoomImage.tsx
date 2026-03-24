import { useState, useRef } from 'react';
import { motion } from 'motion/react';

interface ZoomImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ZoomImage({ src, alt, className = '' }: ZoomImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  };

  return (
    <div
      ref={imageRef}
      className={`relative overflow-hidden cursor-zoom-in ${className}`}
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        animate={{
          scale: isZoomed ? 1.5 : 1,
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1]
        }}
        style={{
          transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`
        }}
      />

      {/* Zoom indicator */}
      {isZoomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg text-off-white text-xs uppercase tracking-wider flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          <span>Zoom</span>
        </motion.div>
      )}
    </div>
  );
}
