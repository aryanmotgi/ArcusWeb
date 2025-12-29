import { useEffect, useRef } from 'react';
import logo from '../assets/arcus-wordmark.png';

interface Logo3DAutoRotateProps {
  tintColor?: string; // Color tint to apply (e.g., 'rgba(100, 150, 255, 0.3)')
  spinTrigger?: number; // Change this value to trigger a spin
}

export default function Logo3DAutoRotate({ tintColor, spinTrigger }: Logo3DAutoRotateProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const spinIntervalRef = useRef<number>();
  const isSpinningRef = useRef<boolean>(false);
  const spinStartTimeRef = useRef<number>(0);

  // Watch for external spin triggers
  useEffect(() => {
    if (spinTrigger) {
      isSpinningRef.current = true;
      spinStartTimeRef.current = Date.now();
    }
  }, [spinTrigger]);

  useEffect(() => {
    // Trigger a spin every 5-7 seconds (random)
    const scheduleNextSpin = () => {
      const randomDelay = 5000 + Math.random() * 2000; // 5000-7000ms (5-7 seconds)
      spinIntervalRef.current = window.setTimeout(() => {
        isSpinningRef.current = true;
        spinStartTimeRef.current = Date.now();
        // Schedule next spin after this one completes
        setTimeout(scheduleNextSpin, 1000); // Wait 1 second for spin to complete
      }, randomDelay);
    };

    scheduleNextSpin(); // Start the first spin

    const animate = () => {
      if (containerRef.current) {
        const now = Date.now();

        if (isSpinningRef.current) {
          // SPINNING MODE - Fast horizontal spin for 0.7 seconds
          const spinElapsed = (now - spinStartTimeRef.current) / 1000; // seconds

          if (spinElapsed < 0.7) {
            // Fast spin animation - 0.7 second duration
            const progress = spinElapsed / 0.7;

            // Full 360 rotation on Y-axis (HORIZONTAL ONLY)
            const rotateY = progress * 360;

            // Zoom out slightly during spin
            const scale = 1 - (Math.sin(progress * Math.PI) * 0.1);
            const translateZ = Math.sin(progress * Math.PI) * 30;

            containerRef.current.style.transform = `
              rotateX(0deg)
              rotateY(${rotateY}deg)
              translateZ(${translateZ}px)
              scale(${scale})
            `;
          } else {
            // Spin complete - return to rest position
            isSpinningRef.current = false;
            containerRef.current.style.transform = `
              rotateX(0deg)
              rotateY(0deg)
              translateZ(0px)
              scale(1)
            `;
          }
        } else {
          // RESTING MODE - Gentle idle animation
          const idleTime = now / 1000;

          // Subtle breathing/floating effect
          const idleRotateY = Math.sin(idleTime * 0.5) * 3; // ±3 degrees horizontal sway
          const idleTranslateZ = Math.sin(idleTime * 0.4) * 3;

          containerRef.current.style.transform = `
            rotateX(0deg)
            rotateY(${idleRotateY}deg)
            translateZ(${idleTranslateZ}px)
            scale(1)
          `;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (spinIntervalRef.current) {
        clearTimeout(spinIntervalRef.current);
      }
    };
  }, []);

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
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 'auto',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          position: 'relative',
        }}
      >
        {/* Deep 3D extrusion - like a LEGO block with THICKNESS */}
        {[...Array(15)].map((_, i) => (
          <img
            key={i}
            src={logo}
            alt=""
            aria-hidden="true"
            style={{
              width: '100%',
              height: 'auto',
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translateZ(${-i * 4}px)`,
              opacity: Math.max(0.05, 0.5 - i * 0.035),
              filter: `brightness(${Math.max(0.2, 0.7 - i * 0.04)}) contrast(1.05)`,
              pointerEvents: 'none',
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
