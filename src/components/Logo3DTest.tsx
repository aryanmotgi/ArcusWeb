import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MousePosition } from '../hooks/useMousePosition';

interface Logo3DTestProps {
  mousePosition: MousePosition;
}

export default function Logo3DTest({ mousePosition }: Logo3DTestProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animation loop for smooth rotation
  useFrame(() => {
    if (meshRef.current) {
      // Calculate target rotation based on mouse position
      const targetRotationX = mousePosition.y * 0.2;
      const targetRotationY = mousePosition.x * 0.3;

      // Smooth interpolation using lerp
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        targetRotationX,
        0.1
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotationY,
        0.1
      );
    }
  });

  const aspectRatio = 588 / 424;
  const width = 4;
  const height = width / aspectRatio;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color="#f5f5f0"
        transparent={true}
        opacity={0.9}
      />
    </mesh>
  );
}
