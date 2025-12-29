import { useEffect, useRef } from 'react';

interface SmoothScrollOptions {
  friction?: number; // 0-1, higher = more resistance
  ease?: number; // 0-1, how smooth the easing is
  scrollSpeed?: number; // multiplier for scroll speed
}

export function useSmoothScroll({
  friction = 0.85,
  ease = 0.1,
  scrollSpeed = 0.7,
}: SmoothScrollOptions = {}) {
  const scrollTargetRef = useRef(0);
  const currentScrollRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    let velocity = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Add scroll delta to target with reduced speed
      scrollTargetRef.current += e.deltaY * scrollSpeed;

      // Clamp target to valid range
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollTargetRef.current = Math.max(0, Math.min(scrollTargetRef.current, maxScroll));

      // Add velocity for momentum
      velocity += e.deltaY * scrollSpeed * 0.3;
    };

    const animate = () => {
      // Calculate difference between current and target
      const diff = scrollTargetRef.current - currentScrollRef.current;

      // Apply easing
      currentScrollRef.current += diff * ease;

      // Apply friction to velocity
      velocity *= friction;

      // Add velocity to current scroll
      currentScrollRef.current += velocity;

      // Clamp current scroll
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      currentScrollRef.current = Math.max(0, Math.min(currentScrollRef.current, maxScroll));

      // Actually scroll the page
      window.scrollTo(0, currentScrollRef.current);

      // Continue animation
      rafRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    rafRef.current = requestAnimationFrame(animate);

    // Add wheel listener with passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('wheel', handleWheel);
    };
  }, [friction, ease, scrollSpeed]);

  return null;
}
