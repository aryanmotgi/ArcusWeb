import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Logo3DSimple from './Logo3DSimple';
import { useMousePosition } from '../hooks/useMousePosition';

export default function Scene3D() {
  const mousePosition = useMousePosition();

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '185px' }}>
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={1.2} />
          <directionalLight
            position={[mousePosition.x * 2, mousePosition.y * 2, 5]}
            intensity={0.8}
          />

          {/* 3D Logo */}
          <Logo3DSimple mousePosition={mousePosition} />
        </Suspense>
      </Canvas>
    </div>
  );
}
