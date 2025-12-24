
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppConfig, ParticleMode, ImageData } from '../types';
import Decorations from './Decorations';

interface ParticleTreeProps {
  config: AppConfig;
  mode: ParticleMode;
  imageData?: ImageData;
  onStarClick: () => void;
}

const Ribbon: React.FC<{ height: number, width: number, visible: boolean }> = ({ height, width, visible }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 300;
    const loops = 3.3;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * loops;
      const r = width * 0.45 * (1 - t) + 0.005; 
      points.push(new THREE.Vector3(Math.cos(angle) * r, t * height, Math.sin(angle) * r));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [height, width]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.visible = visible;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.4;
    }
  });

  return (
    <mesh ref={meshRef}>
      <tubeGeometry args={[curve, 150, 0.01, 8, false]} />
      <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.05} emissive="#ffd700" emissiveIntensity={0.8} />
    </mesh>
  );
};

const ParticleTree: React.FC<ParticleTreeProps> = ({ config, mode, imageData, onStarClick }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const starRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const imagePlaneRef = useRef<THREE.Mesh>(null!);
  const isBursting = useRef(false);
  const [showRealImage, setShowRealImage] = useState(false);
  
  // MATHEMATICAL CONSTANT: 3/5 of screen height at Distance=14, FOV=45
  // Height = 2 * 14 * tan(22.5) = 11.597.  3/5 * 11.597 = 6.958.
  const IMG_DISPLAY_SCALE = 6.96;
  
  // CENTER: Matches the OrbitControls target for perfect alignment
  const IMG_Y_CENTER = 1.2;

  const count = config.particleCount;
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const velocities = useMemo(() => new Float32Array(count * 3), [count]); 
  const targetPositions = useMemo(() => new Float32Array(count * 3), [count]);
  const colors = useMemo(() => new Float32Array(count * 3), [count]);
  const targetColors = useMemo(() => new Float32Array(count * 3), [count]);

  const snowColor = useMemo(() => new THREE.Color('#ffffff'), []);
  const trunkColor = useMemo(() => new THREE.Color('#4d3319'), []); 
  
  const texture = useMemo(() => {
    if (!imageData) return null;
    return new THREE.TextureLoader().load(imageData.url);
  }, [imageData]);

  const updateTreeTargets = () => {
    const { treeHeight, treeWidth, particleColor } = config;
    const currentBaseColor = new THREE.Color(particleColor);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      if (Math.random() < 0.05) { // Trunk
        const r = Math.random() * 0.18;
        const theta = Math.random() * Math.PI * 2;
        const y = Math.random() * 0.8 - 0.5;
        targetPositions[i3] = Math.cos(theta) * r;
        targetPositions[i3+1] = y;
        targetPositions[i3+2] = Math.sin(theta) * r;
        trunkColor.toArray(targetColors, i3);
      } else { 
        const t = 1 - Math.sqrt(Math.random()); 
        const theta = Math.random() * Math.PI * 2;
        
        const tiers = 4;
        const tierIndex = Math.floor(t * tiers); 
        const tInTier = (t * tiers) % 1; 
        const baseWidth = treeWidth * 0.5;
        
        let radiusAtHeight = 0;
        if (tierIndex === 3) radiusAtHeight = baseWidth * 0.3 * (1 - tInTier);
        else if (tierIndex === 2) radiusAtHeight = baseWidth * 0.5 * (1 - tInTier * 0.7);
        else if (tierIndex === 1) radiusAtHeight = baseWidth * 0.75 * (1 - tInTier * 0.7);
        else radiusAtHeight = baseWidth * 1.0 * (1 - tInTier * 0.7);
        
        const distRand = Math.sqrt(Math.random());
        const r = Math.max(0, radiusAtHeight * distRand); 
        
        targetPositions[i3] = Math.cos(theta) * r;
        targetPositions[i3+1] = t * treeHeight;
        targetPositions[i3+2] = Math.sin(theta) * r;

        const vibrantColor = currentBaseColor.clone().multiplyScalar(1.2);
        
        const isAtEdge = distRand > 0.90; 
        const isBaseOfTier = tInTier < 0.18; 

        if (isAtEdge && isBaseOfTier) {
            const snowProbability = tierIndex <= 1 ? 1.0 : 0.85;
            if (Math.random() < snowProbability) {
              snowColor.toArray(targetColors, i3);
            } else {
              vibrantColor.toArray(targetColors, i3);
            }
        } else {
            vibrantColor.toArray(targetColors, i3);
        }
      }
      velocities[i3] = 0;
      velocities[i3+1] = 0;
      velocities[i3+2] = 0;
    }
  };

  const updateImageTargets = () => {
    if (!imageData) {
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = 12 + Math.random() * 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        targetPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
        targetPositions[i3+1] = r * Math.sin(phi) * Math.sin(theta) + IMG_Y_CENTER;
        targetPositions[i3+2] = r * Math.cos(phi);
        
        const isGold = Math.random() > 0.4;
        if (isGold) {
          targetColors[i3] = 1.0; targetColors[i3+1] = 0.85; targetColors[i3+2] = 0.3;
        } else {
          targetColors[i3] = 1.0; targetColors[i3+1] = 1.0; targetColors[i3+2] = 1.0;
        }

        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 80;
        velocities[i3] = Math.cos(angle) * speed;
        velocities[i3+1] = Math.sin(angle) * speed;
        velocities[i3+2] = (Math.random() - 0.5) * speed;
      }
      return;
    }

    const { pixels } = imageData;
    const size = 100; 
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const pIdx = i % (size * size);
      const px = pIdx % size;
      const py = Math.floor(pIdx / size);
      
      // Explicitly decoupled from treeHeight:
      targetPositions[i3] = ((px / (size - 1)) - 0.5) * IMG_DISPLAY_SCALE;
      targetPositions[i3+1] = (0.5 - (py / (size - 1))) * IMG_DISPLAY_SCALE + IMG_Y_CENTER;
      targetPositions[i3+2] = 0; 
      
      const p4 = pIdx * 4;
      targetColors[i3] = pixels[p4];
      targetColors[i3+1] = pixels[p4+1];
      targetColors[i3+2] = pixels[p4+2];
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      velocities[i3] = Math.cos(angle) * speed;
      velocities[i3+1] = Math.sin(angle) * speed;
      velocities[i3+2] = (Math.random() - 0.5) * speed;
    }
  };

  useEffect(() => {
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 60;
      colors[i] = 1.0; 
    }
    updateTreeTargets();
  }, []);

  useEffect(() => {
    if (mode === ParticleMode.TREE) {
      updateTreeTargets();
      isBursting.current = false;
      setShowRealImage(false);
    } else {
      updateImageTargets();
      isBursting.current = true;
      setShowRealImage(false);
      const burstTimeout = setTimeout(() => {
        isBursting.current = false;
        const imageTimeout = setTimeout(() => setShowRealImage(true), 800);
        return () => clearTimeout(imageTimeout);
      }, 400);
      return () => clearTimeout(burstTimeout);
    }
  }, [mode, imageData, config.treeHeight, config.treeWidth, config.particleColor]);

  useFrame((state, delta) => {
    const isImage = mode === ParticleMode.IMAGE;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const colAttr = pointsRef.current.geometry.attributes.color;
    const pointsMat = pointsRef.current.material as THREE.PointsMaterial;

    if (!isImage) {
      groupRef.current.rotation.y += delta * config.rotationSpeed;
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
    }

    if (isBursting.current) {
      for (let i = 0; i < count * 3; i++) {
        positions[i] += velocities[i] * delta;
        velocities[i] *= 0.92; 
        colors[i] += (targetColors[i] - colors[i]) * delta * 5;
      }
    } else {
      const lerpSpeed = (isImage ? 9.0 : 4.0) * delta;
      for (let i = 0; i < count * 3; i++) {
        positions[i] += (targetPositions[i] - positions[i]) * lerpSpeed;
        colors[i] += (targetColors[i] - colors[i]) * lerpSpeed;
      }
    }
    
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    if (starRef.current) {
      const s = !isImage ? 0.4 : 0.0; 
      starRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.15);
    }

    if (imagePlaneRef.current) {
      const planeMat = imagePlaneRef.current.material as THREE.MeshBasicMaterial;
      const targetPlaneOpacity = (showRealImage && imageData) ? 1 : 0;
      planeMat.opacity = THREE.MathUtils.lerp(planeMat.opacity, targetPlaneOpacity, 0.1);
      imagePlaneRef.current.visible = planeMat.opacity > 0.01;
      
      if (imageData) {
        pointsMat.opacity = THREE.MathUtils.lerp(pointsMat.opacity, 1 - planeMat.opacity, 0.1);
      } else {
        pointsMat.opacity = THREE.MathUtils.lerp(pointsMat.opacity, 1, 0.1);
      }
    } else {
      pointsMat.opacity = THREE.MathUtils.lerp(pointsMat.opacity, 1, 0.1);
    }
  });

  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = 0.5, inner = 0.22;
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 + Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04 });
  }, []);

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={config.particleSize} transparent opacity={1} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} color="#ffffff" />
      </points>

      {mode === ParticleMode.TREE && (
        <>
          <Decorations config={config} mode={mode} />
          <Ribbon height={config.treeHeight} width={config.treeWidth} visible={true} />
          <mesh 
            ref={starRef} 
            geometry={starGeometry} 
            position={[0, config.treeHeight + 0.05, 0]} 
            onPointerDown={(e) => { e.stopPropagation(); onStarClick(); }}
          >
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1.5} metalness={1} />
            <pointLight intensity={5} color="#ffd700" distance={5} />
          </mesh>
        </>
      )}

      {mode === ParticleMode.IMAGE && (
        <mesh ref={imagePlaneRef} position={[0, IMG_Y_CENTER, 0.1]}>
          <planeGeometry args={[IMG_DISPLAY_SCALE, IMG_DISPLAY_SCALE]} />
          <meshBasicMaterial map={texture} transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

export default ParticleTree;
