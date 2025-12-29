import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import type { MousePosition } from '../hooks/useMousePosition';

interface Logo3DSimpleProps {
  mousePosition: MousePosition;
}

export default function Logo3DSimple({ mousePosition }: Logo3DSimpleProps) {
  const imageRef = useRef<any>(null);

  // Animation loop for smooth rotation
  useFrame(() => {
    if (imageRef.current) {
      // Calculate target rotation based on mouse position
      const targetRotationX = mousePosition.y * 0.2; // ±11 degrees
      const targetRotationY = mousePosition.x * 0.3; // ±17 degrees

      // Smooth interpolation using lerp
      imageRef.current.rotation.x = THREE.MathUtils.lerp(
        imageRef.current.rotation.x,
        targetRotationX,
        0.1
      );
      imageRef.current.rotation.y = THREE.MathUtils.lerp(
        imageRef.current.rotation.y,
        targetRotationY,
        0.1
      );
    }
  });

  return (
    <Image
      ref={imageRef}
      url="/src/assets/arcus-wordmark.png"
      scale={4}
      transparent
      opacity={0.9}
    />
  );
}
