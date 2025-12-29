import { useRef, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import type { MousePosition } from '../hooks/useMousePosition';

interface Logo3DProps {
  mousePosition: MousePosition;
}

function Logo3DMesh({ mousePosition }: Logo3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Dynamically import the texture URL
  const texture = useLoader(TextureLoader, '/src/assets/arcus-wordmark.png');

  // Animation loop for smooth rotation
  useFrame(() => {
    if (meshRef.current) {
      // Calculate target rotation based on mouse position
      const targetRotationX = mousePosition.y * 0.2; // ±11 degrees
      const targetRotationY = mousePosition.x * 0.3; // ±17 degrees

      // Smooth interpolation using lerp
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        targetRotationX,
        0.1 // Lerp factor: lower = smoother, higher = snappier
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotationY,
        0.1
      );
    }
  });

  // Calculate aspect ratio to match logo dimensions (588x424)
  const aspectRatio = 588 / 424;
  const width = 4;
  const height = width / aspectRatio;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        alphaTest={0.1}
        metalness={0.2}
        roughness={0.8}
        emissive="#ffffff"
        emissiveIntensity={0.05}
      />
    </mesh>
  );
}

export default function Logo3D({ mousePosition }: Logo3DProps) {
  return (
    <Suspense fallback={null}>
      <Logo3DMesh mousePosition={mousePosition} />
    </Suspense>
  );
}
