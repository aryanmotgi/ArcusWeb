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
  const scrollYRef = useRef<number>(0);
  const rotationOffsetRef = useRef<number>(0);

  // Watch for external spin triggers
  useEffect(() => {
    if (spinTrigger) {
      isSpinningRef.current = true;
      spinStartTimeRef.current = Date.now();
    }
  }, [spinTrigger]);

  // Periodic internal spin trigger (every 5-7 seconds)
  useEffect(() => {
    const triggerSpin = () => {
      isSpinningRef.current = true;
      spinStartTimeRef.current = Date.now();

      // Schedule next spin at a random interval between 5 and 6 seconds
      const nextDelay = 5000 + Math.random() * 1000;
      spinIntervalRef.current = window.setTimeout(triggerSpin, nextDelay);
    };

    const initialDelay = 5000 + Math.random() * 1000;
    spinIntervalRef.current = window.setTimeout(triggerSpin, initialDelay);

    return () => {
      if (spinIntervalRef.current) {
        clearTimeout(spinIntervalRef.current);
      }
    };
  }, []);

  // Scroll listener for interactive effects
  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    let lastTime = startTime;

    const animate = () => {
      if (containerRef.current) {
        const now = Date.now();
        const deltaTime = (now - lastTime) / 1000;
        lastTime = now;

        // No constant idle rotation
        let speed = 0;

        // Add periodic/trigger "Quick Flick Spin" boost (Fast spin to the right)
        if (isSpinningRef.current) {
          const spinElapsed = (now - spinStartTimeRef.current) / 1000;
          const spinDuration = 0.6; // Faster flick duration

          if (spinElapsed < spinDuration) {
            // Sharper, faster burst curve for a "flick" feel
            const t = spinElapsed / spinDuration;
            const boost = Math.sin(t * Math.PI) * 1800; // Even faster boost
            speed += boost;
          } else {
            isSpinningRef.current = false;
          }
        }

        // Speed up based on scroll momentum (subtle)
        const scrollFactor = Math.min(Math.abs(scrollYRef.current / 500), 2.5);
        speed += (scrollFactor * 45); // Increase speed based on scroll

        rotationOffsetRef.current += speed * deltaTime;

        // Vertical tilt based on scroll
        const tiltX = Math.sin(scrollYRef.current / 400) * 8;

        containerRef.current.style.transform = `
          scale(1.55)
          rotateX(${tiltX}deg)
          rotateY(${rotationOffsetRef.current}deg)
          translateZ(0px)
        `;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
        {/* Massively intense radiant aura glow */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(245, 245, 240, 0.45) 0%, rgba(245, 245, 240, 0.2) 40%, rgba(245, 245, 240, 0.1) 60%, transparent 85%)',
            filter: 'blur(50px)',
            transform: 'scale(2.2)',
            opacity: isSpinningRef.current ? 0.95 : 0.6,
            transition: 'opacity 0.3s ease'
          }}
        />

        {/* Deep 3D extrusion - Thick 'Shadow Stack' look */}
        {[...Array(35)].map((_, i) => (
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
              // Adding subtle X/Y offsets for a more realistic 'offset 3D' block effect
              transform: `translateZ(${-i * 3}px) translateX(${-i * 0.4}px) translateY(${i * 0.4}px)`,
              opacity: Math.max(0.05, 0.5 - i * 0.012),
              filter: `brightness(${Math.max(0.1, 0.7 - i * 0.02)}) contrast(1.15) saturate(0.8)`,
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
                drop-shadow(0 0 40px rgba(245, 245, 240, 0.9))
                drop-shadow(0 0 80px rgba(245, 245, 240, 0.6))
                drop-shadow(0 0 120px rgba(245, 245, 240, 0.4))
                drop-shadow(0 0 180px rgba(245, 245, 240, 0.25))
                drop-shadow(0 15px 50px rgba(0, 0, 0, 1))
                brightness(1.3)
                contrast(1.5)
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
