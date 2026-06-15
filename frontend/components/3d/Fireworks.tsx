// /home/moumene/bem/frontend/components/3d/Fireworks.tsx
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, FireworkEffect } from "@/store/useGameStore";

// Component representing a single Firework spherical burst
function FireworkInstance({ effect }: { effect: FireworkEffect }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 180;

  // Generate initial direction velocities for each star particle
  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vels = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);

    const baseColor = new THREE.Color(effect.color);

    for (let i = 0; i < particleCount; i++) {
      // Set initial origin position (where firework exploded)
      pos[i * 3] = effect.position[0];
      pos[i * 3 + 1] = effect.position[1];
      pos[i * 3 + 2] = effect.position[2];

      // Spherical distribution velocities
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 3 + Math.random() * 8; // Random burst speeds

      vels[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      vels[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vels[i * 3 + 2] = Math.cos(phi) * speed;

      // Map color shades with random luminescence
      const particleColor = baseColor.clone().multiplyScalar(0.7 + Math.random() * 0.6);
      cols[i * 3] = particleColor.r;
      cols[i * 3 + 1] = particleColor.g;
      cols[i * 3 + 2] = particleColor.b;
    }

    return [pos, vels, cols];
  }, [effect]);

  // Track particle physics update loop
  useFrame((state, delta) => {
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;

      if (!posAttr) return;

      const gravity = -3.5; // Downward pull
      const drag = 0.96; // Air friction resistance

      for (let i = 0; i < particleCount; i++) {
        // Apply air resistance to velocities
        velocities[i * 3] *= drag;
        velocities[i * 3 + 1] = (velocities[i * 3 + 1] + gravity * delta) * drag;
        velocities[i * 3 + 2] *= drag;

        // Apply velocities to positions
        posAttr.setX(i, posAttr.getX(i) + velocities[i * 3] * delta);
        posAttr.setY(i, posAttr.getY(i) + velocities[i * 3 + 1] * delta);
        posAttr.setZ(i, posAttr.getZ(i) + velocities[i * 3 + 2] * delta);
      }

      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      {/* Round circular glowing star material */}
      <pointsMaterial
        size={0.25}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Component representing a Confetti downward cascade
function ConfettiInstance({ effect }: { effect: FireworkEffect }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 120;

  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vels = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Scatter confetti box around spawn point
      pos[i * 3] = effect.position[0] + (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = effect.position[1] + Math.random() * 4;
      pos[i * 3 + 2] = effect.position[2] + (Math.random() - 0.5) * 12;

      // Slow downward falling and drift velocities
      vels[i * 3] = (Math.random() - 0.5) * 2; // Drift X
      vels[i * 3 + 1] = -2 - Math.random() * 2; // Falling speed Y
      vels[i * 3 + 2] = (Math.random() - 0.5) * 2; // Drift Z

      // Multi-colored party confetti palette
      const r = Math.random();
      const g = Math.random();
      const b = Math.random();
      cols[i * 3] = r;
      cols[i * 3 + 1] = g;
      cols[i * 3 + 2] = b;
    }

    return [pos, vels, cols];
  }, [effect]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;

      if (!posAttr) return;

      for (let i = 0; i < particleCount; i++) {
        // Slow sway simulation
        const sway = Math.sin(state.clock.getElapsedTime() * 4 + i) * 0.05;
        
        posAttr.setX(i, posAttr.getX(i) + (velocities[i * 3] + sway) * delta);
        posAttr.setY(i, posAttr.getY(i) + velocities[i * 3 + 1] * delta);
        posAttr.setZ(i, posAttr.getZ(i) + velocities[i * 3 + 2] * delta);
      }

      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.18}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function Fireworks() {
  const activeVfx = useGameStore((state) => state.activeVfx);

  return (
    <group>
      {activeVfx.map((effect) => {
        if (effect.type === "confetti") {
          return <ConfettiInstance key={effect.id} effect={effect} />;
        }
        return <FireworkInstance key={effect.id} effect={effect} />;
      })}
    </group>
  );
}
