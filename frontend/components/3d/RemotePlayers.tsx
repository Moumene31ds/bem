// /home/moumene/bem/frontend/components/3d/RemotePlayers.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore, Player } from "@/store/useGameStore";

// Separate Single Remote Player component for optimized frame rates
function RemotePlayer({ player }: { player: Player }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = new THREE.Vector3(...player.position);
  const targetRot = new THREE.Euler(...player.rotation);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smoothly interpolate (lerp) position to avoid jittering from tick updates
      meshRef.current.position.lerp(targetPos, 0.15);

      // Smoothly interpolate rotation
      const currentRotation = meshRef.current.rotation;
      currentRotation.x = THREE.MathUtils.lerp(currentRotation.x, targetRot.x, 0.15);
      currentRotation.y = THREE.MathUtils.lerp(currentRotation.y, targetRot.y, 0.15);
      currentRotation.z = THREE.MathUtils.lerp(currentRotation.z, targetRot.z, 0.15);

      // Apply subtle bobbing animation when they are standing still, jumping when moving
      if (!player.isMoving) {
        meshRef.current.position.y = player.position[1] + Math.sin(state.clock.getElapsedTime() * 2 + player.name.charCodeAt(0)) * 0.1;
      } else {
        meshRef.current.position.y = player.position[1] + Math.abs(Math.sin(state.clock.getElapsedTime() * 10)) * 0.3;
      }
    }
  });

  // Map grades to badge styling
  const gradeBadgeStyles = {
    EXCELLENT: "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    VERY_GOOD: "bg-purple-500/20 border-purple-400 text-purple-300",
    GOOD: "bg-blue-500/20 border-blue-400 text-blue-300",
    PASSABLE: "bg-slate-500/20 border-slate-400 text-slate-300",
  };

  const badgeStyle = gradeBadgeStyles[player.grade] || gradeBadgeStyles.PASSABLE;

  return (
    <mesh ref={meshRef} position={player.position} rotation={player.rotation}>
      {/* 3D Glassmorphic Avatar Capsule */}
      <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
      <meshPhysicalMaterial
        color={player.avatarColor}
        roughness={0.15}
        transmission={0.6} // Semi-transparent glass style
        thickness={0.8}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        emissive={player.avatarColor}
        emissiveIntensity={0.2}
      />

      {/* Floating HTML Name & Grade Label */}
      <Html position={[0, 1.3, 0]} center distanceFactor={15}>
        <div className="flex flex-col items-center pointer-events-none select-none">
          <div className="px-3 py-1 bg-black/75 border border-white/10 rounded-full backdrop-blur-md shadow-lg flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-white text-xs font-semibold whitespace-nowrap">{player.name}</span>
            <span className={`mt-0.5 px-1.5 py-0.2 text-[8px] font-bold border rounded uppercase ${badgeStyle}`}>
              {player.examType} - {player.grade}
            </span>
          </div>
          {/* Arrow anchor point */}
          <div className="w-2 h-2 bg-black/75 border-r border-b border-white/10 rotate-45 -mt-1" />
        </div>
      </Html>
    </mesh>
  );
}

export default function RemotePlayers() {
  const players = useGameStore((state) => state.players);

  return (
    <group>
      {players.map((player) => (
        <RemotePlayer key={player.id} player={player} />
      ))}
    </group>
  );
}
