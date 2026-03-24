import { useEffect, useRef, useState } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';
import logo from '../assets/arcus-wordmark.png';

interface Logo3DTransformProps {
  tintColor?: string; // Color tint to apply (e.g., 'rgba(100, 150, 255, 0.3)')
  overridePosition?: { x: number; y: number } | null;
  autoRotate?: boolean; // If true, rotate automatically every 5-7 seconds instead of following mouse
  spinTrigger?: number; // Timestamp to trigger a manual spin
}

export default function Logo3DTransform({ tintColor, overridePosition, autoRotate = false, spinTrigger }: Logo3DTransformProps = {}) {
  const mousePosition = useMousePosition();
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [autoRotateAngle, setAutoRotateAngle] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  // Auto-rotate effect - spin every 5-7 seconds
  useEffect(() => {
    if (!autoRotate) return;

    const getRandomInterval = () => Math.random() * 2000 + 5000; // 5-7 seconds

    const scheduleNextRotation = () => {
      timeoutRef.current = window.setTimeout(() => {
        setAutoRotateAngle(prev => prev + 360); // Full rotation
        scheduleNextRotation(); // Schedule the next one
      }, getRandomInterval());
    };

    scheduleNextRotation();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoRotate]);

  // Manual spin trigger - spin on click
  useEffect(() => {
    if (spinTrigger && autoRotate) {
      setAutoRotateAngle(prev => prev + 360);
    }
  }, [spinTrigger, autoRotate]);

  useEffect(() => {
    if (containerRef.current) {
      if (autoRotate) {
        // Use auto-rotation
        containerRef.current.style.transform = `
          rotateY(${autoRotateAngle}deg)
          translateZ(0px)
        `;
      } else {
        // Use override position if provided, otherwise use mouse position
        const targetX = overridePosition ? overridePosition.x : mousePosition.x;
        const targetY = overridePosition ? overridePosition.y : mousePosition.y;

        // Map mouse position to rotation angles - BALANCED MOVEMENT
        // Mouse x: -1 to 1 -> Rotate Y: -30deg to 30deg
        // Mouse y: -1 to 1 -> Rotate X: -30deg to 30deg (FIXED: follows mouse direction)
        const rotateY = targetX * 30;
        const rotateX = targetY * 30; // Removed negative sign - now looks where mouse is!

        // Add subtle Z-axis movement for depth
        const translateZ = (Math.abs(targetX) + Math.abs(targetY)) * 20;

        // Apply 3D transform
        containerRef.current.style.transform = `
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          translateZ(${translateZ}px)
        `;
      }
    }
  }, [mousePosition, overridePosition, autoRotate, autoRotateAngle]);


  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1000px',
        perspectiveOrigin: 'center center',
        overflow: 'visible',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 'auto',
          transition: autoRotate ? 'transform 1.2s ease-in-out' : 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Deep 3D extrusion */}
        {[...Array(15)].map((_, i) => (
          <img
            key={i}
            ref={(el) => { layerRefs.current[i] = el; }}
            src={logo}
            alt=""
            aria-hidden="true"
            style={{
              width: '100%',
              height: 'auto',
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translateZ(${-i * 4}px)`, // 4px spacing = 60px total depth
              opacity: Math.max(0.05, 0.5 - i * 0.035), // Much more gradual fade - barely visible
              filter: `brightness(${Math.max(0.2, 0.7 - i * 0.04)}) contrast(1.05)`,
              pointerEvents: 'none',
              transition: 'transform 0.15s ease-out',
            }}
          />
        ))}

        {/* Front logo with GLOW and METALLIC effect */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'auto',
            transform: 'translateZ(0px)',
          }}
        >
          {/* Base logo with natural glow */}
          <img
            ref={(el) => { layerRefs.current[15] = el; }}
            src={logo}
            alt="ARCUS"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              filter: `
                drop-shadow(0 0 15px rgba(245, 245, 240, 0.3))
                drop-shadow(0 0 30px rgba(245, 245, 240, 0.15))
                drop-shadow(0 8px 20px rgba(0, 0, 0, 0.6))
                brightness(1.1)
                contrast(1.2)
                saturate(0.95)
              `,
            }}
          />

          {/* Color tint overlay if provided */}
          {tintColor && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: tintColor,
                WebkitMaskImage: `url(${logo})`,
                maskImage: `url(${logo})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                mixBlendMode: 'screen',
                pointerEvents: 'none',
                transition: 'background 0.3s ease',
              }}
            />
          )}

          {/* Very subtle metallic shine - masked to logo shape */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.04) 80%, transparent 100%)',
              WebkitMaskImage: `url(${logo})`,
              maskImage: `url(${logo})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
          />
        </div>

      </div>
    </div>
  );
}
