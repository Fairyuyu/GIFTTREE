
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Snow: React.FC = () => {
  // 增加雪花数量以覆盖更大的空间
  const count = 3000;
  const pointsRef = useRef<THREE.Points>(null!);
  
  // 空间范围设置
  const bounds = {
    x: 60,
    y: 40,
    z: 60
  };

  const [positions, data] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const extra = new Float32Array(count * 3); // 存储: 0:速度, 1:摆动偏移, 2:摆动幅度
    
    for (let i = 0; i < count; i++) {
      // 在巨大的空间内随机分布
      pos[i * 3] = (Math.random() - 0.5) * bounds.x;
      pos[i * 3 + 1] = Math.random() * bounds.y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * bounds.z;

      // 赋予每片雪花不同的物理特性
      extra[i * 3] = 1.0 + Math.random() * 2.5; // 下落速度 (1.0 - 3.5)
      extra[i * 3 + 1] = Math.random() * Math.PI * 2; // 初始相位偏移
      extra[i * 3 + 2] = 0.02 + Math.random() * 0.08; // 左右漂移幅度
    }
    return [pos, extra];
  }, [count]);

  useFrame((state, delta) => {
    const attr = pointsRef.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      let x = attr.getX(i);
      let y = attr.getY(i);
      let z = attr.getZ(i);

      const speed = data[i * 3];
      const phase = data[i * 3 + 1];
      const drift = data[i * 3 + 2];

      // 独立的下落逻辑
      y -= speed * delta * 2.0;
      
      // 独立的漂移逻辑：结合正弦波，每片雪花的频率和幅度都不同
      x += Math.sin(time * (speed * 0.5) + phase) * drift;
      z += Math.cos(time * (speed * 0.3) + phase) * drift;

      // 循环重置：当雪花掉出底部边界时，回到顶部，并重新随机化水平位置
      if (y < -10) {
        y = bounds.y;
        x = (Math.random() - 0.5) * bounds.x;
        z = (Math.random() - 0.5) * bounds.z;
      }

      attr.setXYZ(i, x, y, z);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={count} 
          array={positions} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#ffffff" 
        size={0.12} 
        transparent 
        opacity={0.4} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default Snow;
