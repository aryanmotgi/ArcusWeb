import { useEffect, useRef } from 'react';
import logoSymbol from '../assets/logo-symbol.png';

export default function LogoSymbol3DSpinning() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      if (containerRef.current) {
        const now = Date.now();
        const time = now / 1000;

        // Continuous smooth rotation on Y-axis
        const rotateY = (time * 30) % 360; // 30 degrees per second

        // Subtle tilt and float for depth
        const rotateX = Math.sin(time * 0.3) * 5;
        const translateZ = Math.sin(time * 0.5) * 10;

        containerRef.current.style.transform = `
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          translateZ(${translateZ}px)
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
        backgroundColor: 'transparent',
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
          backgroundColor: 'transparent',
        }}
      >
        {/* Deep 3D extrusion layers */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '100%',
              height: 'auto',
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translateZ(${-i * 3}px)`,
              opacity: Math.max(0.05, 0.6 - i * 0.03),
              pointerEvents: 'none',
              mixBlendMode: 'lighten',
            }}
          >
            <img
              src={logoSymbol}
              alt=""
              aria-hidden="true"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                filter: `brightness(${Math.max(0.3, 0.8 - i * 0.03)}) contrast(1.1)`,
              }}
            />
          </div>
        ))}

        {/* Front logo with glow */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'auto',
            transform: 'translateZ(0px)',
            mixBlendMode: 'lighten',
          }}
        >
          <img
            src={logoSymbol}
            alt="ARCUS Symbol"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              filter: `
                drop-shadow(0 0 20px rgba(245, 245, 240, 0.4))
                drop-shadow(0 0 40px rgba(245, 245, 240, 0.2))
                drop-shadow(0 10px 30px rgba(0, 0, 0, 0.7))
                brightness(1.15)
                contrast(1.15)
              `,
            }}
          />

          {/* Metallic shine overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.06) 80%, transparent 100%)',
              WebkitMaskImage: `url(${logoSymbol})`,
              maskImage: `url(${logoSymbol})`,
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
