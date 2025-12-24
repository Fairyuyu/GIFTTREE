
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AppConfig, ParticleMode } from '../types';
import ParticleTree from './ParticleTree';

interface MiniPreviewProps {
  config: AppConfig;
}

const MiniPreview: React.FC<MiniPreviewProps> = ({ config }) => {
  return (
    <Canvas shadows gl={{ antialias: true }}>
      <PerspectiveCamera makeDefault position={[0, 3, 11]} fov={40} />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 5, 5]} intensity={1.5} color="#ffffff" />
      
      <Suspense fallback={null}>
        <Environment preset="city" />
        <ParticleTree 
          config={config} 
          mode={ParticleMode.TREE} 
          onStarClick={() => {}} 
        />
        <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={15} blur={2} far={10} color="#000000" />
      </Suspense>

      <EffectComposer>
        <Bloom intensity={config.bloomIntensity * 0.8} luminanceThreshold={0.5} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
};

export default MiniPreview;
