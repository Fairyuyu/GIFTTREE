
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppConfig, ParticleMode } from '../types';

interface DecorationsProps {
  config: AppConfig;
  mode: ParticleMode;
}

const Decorations: React.FC<DecorationsProps> = ({ config, mode }) => {
  const groupRef = useRef<THREE.Group>(null!);
  
  const decorationData = useMemo(() => {
    const { treeHeight, treeWidth } = config;
    const items: any[] = [];
    const minDistance = 0.4;
    
    const types = [
      ...Array(6).fill('STAR'),
      ...Array(8).fill('LIGHT_GOLD'),
      ...Array(8).fill('LIGHT_RED')
    ];

    const checkDistance = (newPos: THREE.Vector3) => {
      for (const item of items) {
        if (new THREE.Vector3(...item.pos).distanceTo(newPos) < minDistance) return false;
      }
      return true;
    };

    types.forEach(type => {
      for (let attempt = 0; attempt < 1000; attempt++) {
        const t = 0.1 + Math.random() * 0.85;
        const y = t * treeHeight;
        
        // Match tiered radius logic
        const tiers = 4;
        const tierIndex = Math.floor(t * tiers);
        const tInTier = (t * tiers) % 1;
        const baseWidth = treeWidth * 0.5;
        let radiusAtHeight = 0;
        if (tierIndex === 3) radiusAtHeight = baseWidth * 0.3 * (1 - tInTier);
        else if (tierIndex === 2) radiusAtHeight = baseWidth * 0.5 * (1 - tInTier * 0.6);
        else if (tierIndex === 1) radiusAtHeight = baseWidth * 0.75 * (1 - tInTier * 0.6);
        else radiusAtHeight = baseWidth * 1.0 * (1 - tInTier * 0.6);
        
        const r = radiusAtHeight * 0.92;
        const theta = Math.random() * Math.PI * 2;
        const pos = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
        
        if (checkDistance(pos)) {
          items.push({
            pos: [pos.x, pos.y, pos.z],
            type,
            color: type === 'LIGHT_GOLD' ? '#ffd700' : (type === 'LIGHT_RED' ? '#ff4444' : '#ffd700'),
            offset: Math.random() * Math.PI * 2,
            rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0]
          });
          break;
        }
      }
    });

    return items;
  }, [config]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const isTree = mode === ParticleMode.TREE;
    
    groupRef.current.children.forEach((child, i) => {
      const data = decorationData[i];
      if (!data) return;
      const mesh = child as THREE.Mesh;
      
      const targetScale = isTree ? 1 : 0.001;
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
      
      if (isTree && data.type.startsWith('LIGHT')) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0.3 + Math.sin(time * 3 + data.offset) * 0.4;
      }
    });
  });

  const starGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = 0.08, inner = 0.035;
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false });
  }, []);

  return (
    <group ref={groupRef}>
      {decorationData.map((d, i) => (
        <mesh 
          key={`dec-${i}`} 
          position={d.pos as [number, number, number]} 
          geometry={d.type === 'STAR' ? starGeo : undefined}
          rotation={d.rot as [number, number, number]}
        >
          {d.type !== 'STAR' ? <sphereGeometry args={[0.06, 12, 12]} /> : null}
          <meshStandardMaterial 
            color={d.color} 
            emissive={d.color} 
            emissiveIntensity={0.8} 
            metalness={0.9} 
            roughness={0.1} 
          />
        </mesh>
      ))}
    </group>
  );
};

export default Decorations;
