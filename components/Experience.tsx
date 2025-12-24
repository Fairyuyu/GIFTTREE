
import React, { Suspense, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AppConfig, ParticleMode, ImageData } from '../types';
import ParticleTree from './ParticleTree';
import Snow from './Snow';

interface ExperienceProps {
  config: AppConfig;
  particleMode: ParticleMode;
  setParticleMode: (mode: ParticleMode) => void;
  selectedImage?: ImageData;
  onStarClick: () => void;
  onSceneClick: () => void;
  isBlurred?: boolean;
  isContentVisible?: boolean;
}

const SceneController: React.FC<{ isImageMode: boolean }> = ({ isImageMode }) => {
  const referenceDistance = 14; // The distance at which IMG_DISPLAY_SCALE (6.96) is 3/5 of the screen height

  useFrame((state) => {
    const controls = state.controls as any;
    if (controls && isImageMode) {
      // 1. Reset Rotation (Front-Facing)
      controls.setAzimuthalAngle(THREE.MathUtils.lerp(controls.getAzimuthalAngle(), 0, 0.1));
      controls.setPolarAngle(THREE.MathUtils.lerp(controls.getPolarAngle(), Math.PI / 2, 0.1));
      
      // 2. Reset Distance (Ensure 3/5 scale is visually consistent)
      // We calculate current distance and lerp it to our reference
      const currentDist = state.camera.position.distanceTo(controls.target);
      const newDist = THREE.MathUtils.lerp(currentDist, referenceDistance, 0.1);
      
      // Update camera distance while maintaining direction
      const direction = new THREE.Vector3().subVectors(state.camera.position, controls.target).normalize();
      state.camera.position.copy(direction.multiplyScalar(newDist).add(controls.target));
    }
  });
  return null;
};

const Experience: React.FC<ExperienceProps> = ({ 
  config, 
  particleMode, 
  setParticleMode, 
  selectedImage, 
  onStarClick, 
  onSceneClick,
  isBlurred = false,
  isContentVisible = true
}) => {
  const isImageMode = particleMode === ParticleMode.IMAGE;
  const controlsRef = useRef<any>(null!);

  const handleDoubleClick = useCallback(() => {
    setParticleMode(isImageMode ? ParticleMode.TREE : ParticleMode.IMAGE);
  }, [isImageMode, setParticleMode]);

  return (
    <div className={`w-full h-full relative transition-all duration-1000 ${isBlurred ? 'blur-md brightness-50' : 'blur-0 brightness-100'}`}>
      <Canvas 
        shadows 
        className="w-full h-full bg-[#02050a]" 
        gl={{ antialias: true }}
        onClick={(e) => { 
          if (isImageMode) onSceneClick(); 
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Default initial camera */}
        <PerspectiveCamera makeDefault position={[0, 1.2, 14]} fov={45} />
        <color attach="background" args={['#010205']} />
        <ambientLight intensity={isImageMode ? 2.0 : 0.8} />
        <pointLight position={[0, 0, 5]} intensity={isImageMode ? 1.5 : 0.5} color="#ffffff" />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          
          <Snow />

          <group visible={isContentVisible}>
            <ParticleTree 
              config={config} 
              mode={particleMode} 
              imageData={selectedImage} 
              onStarClick={onStarClick} 
            />
            {particleMode === ParticleMode.TREE && (
              <ContactShadows position={[0, -1.5, 0]} opacity={0.3} scale={30} blur={2.5} far={10} color="#000000" />
            )}
          </group>
        </Suspense>

        <SceneController isImageMode={isImageMode} />

        <OrbitControls 
          ref={controlsRef}
          enablePan={false} 
          enableRotate={!isImageMode && !isBlurred && isContentVisible}
          minDistance={2} 
          maxDistance={40}
          autoRotate={particleMode === ParticleMode.TREE && isContentVisible}
          autoRotateSpeed={config.rotationSpeed}
          target={[0, 1.2, 0]}
          makeDefault
        />

        <EffectComposer multisampling={4}>
          <Bloom intensity={config.bloomIntensity} luminanceThreshold={0.5} luminanceSmoothing={0.8} mipmapBlur />
          <Vignette offset={isImageMode ? 0.05 : 0.15} darkness={isImageMode ? 0.3 : 0.9} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Experience;
