import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Rolls Royce Celestial style - subtle twinkling dots
    const stars: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }> = [];

    // Lightning strikes
    const lightningStrikes: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      segments: Array<{ x: number; y: number }>;
    }> = [];

    // Create scattered stars - more like Rolls Royce headliner
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 0.8 + 0.3, // Very small
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.015 + 0.008, // Slow, gentle twinkle
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    // Function to create a lightning strike
    const createLightning = () => {
      const startX = Math.random() * canvas.width;
      const startY = -20;
      const segments: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

      // Create jagged lightning path
      let currentX = startX;
      let currentY = startY;
      const numSegments = 8 + Math.floor(Math.random() * 6);
      const segmentLength = 40 + Math.random() * 40;

      for (let i = 0; i < numSegments; i++) {
        currentY += segmentLength;
        currentX += (Math.random() - 0.5) * 60; // Zigzag
        segments.push({ x: currentX, y: currentY });
      }

      lightningStrikes.push({
        x: startX,
        y: startY,
        length: 0,
        speed: 15 + Math.random() * 10,
        opacity: 0.8 + Math.random() * 0.2,
        segments
      });
    };

    // Create lightning occasionally
    const lightningInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 3 seconds
        createLightning();
      }
    }, 3000);

    // Animation loop
    let animationFrame: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      // Draw glowing stars that STAND OUT
      stars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        const currentOpacity = star.opacity * (0.5 + twinkle * 0.5);

        // MUCH MORE GLOW - make them stand out!
        ctx.shadowBlur = 12 + currentOpacity * 15;
        ctx.shadowColor = `rgba(255, 255, 255, ${currentOpacity})`;

        // Draw bright glowing dot
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.fill();

        // Add extra glow layer for more prominence
        ctx.shadowBlur = 8 + currentOpacity * 10;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.8})`;
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
      });

      // Draw lightning strikes
      for (let i = lightningStrikes.length - 1; i >= 0; i--) {
        const lightning = lightningStrikes[i];

        // Draw the lightning bolt with glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(255, 255, 255, ${lightning.opacity * 0.8})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${lightning.opacity})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        for (let j = 0; j < lightning.segments.length; j++) {
          const segment = lightning.segments[j];
          if (j === 0) {
            ctx.moveTo(segment.x, segment.y);
          } else {
            ctx.lineTo(segment.x, segment.y);
          }
        }
        ctx.stroke();

        // Add thinner inner bolt for brightness
        ctx.shadowBlur = 15;
        ctx.strokeStyle = `rgba(255, 255, 255, ${lightning.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Update position - move down
        lightning.segments.forEach(segment => {
          segment.y += lightning.speed;
        });

        // Fade out
        lightning.opacity *= 0.96;

        // Remove if off screen or faded
        const lastSegment = lightning.segments[lightning.segments.length - 1];
        if (lastSegment.y > canvas.height + 100 || lightning.opacity < 0.05) {
          lightningStrikes.splice(i, 1);
        }
      }

      ctx.shadowBlur = 0;

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationFrame);
      clearInterval(lightningInterval);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      style={{
        mixBlendMode: 'screen'
      }}
    />
  );
}
