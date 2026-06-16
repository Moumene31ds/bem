// /home/moumene/bem/frontend/components/3d/RemotePlayers.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useGameStore, Player, ActiveEmote } from "@/store/useGameStore";
import { GraduationCap3D } from "./Player";

const EMOJI_MAP: Record<string, string> = {
  cap: "🎓",
  heart: "❤️",
  clap: "👏",
  laugh: "😂",
  fire: "🔥",
};

// Single Remote Player component
function RemotePlayer({ player }: { player: Player }) {
  const meshRef = useRef<THREE.Group>(null);
  
  const targetPos = new THREE.Vector3(...player.position);
  const targetRot = new THREE.Euler(...player.rotation);

  // Read active emotes from store and filter for this player
  const activeEmotes = useGameStore((state) => state.activeEmotes);
  const playerEmotes = activeEmotes.filter((e) => e.playerId === player.id);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smoothly interpolate (lerp) position to avoid jittering from tick updates
      // player.position represents the ground coordinate [x, 0, z]. Capsule center is offset to y=0.8
      const currentPos = meshRef.current.position;
      currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetPos.x, 0.15);
      currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetPos.z, 0.15);

      // Smoothly interpolate rotation
      const currentRotation = meshRef.current.rotation;
      currentRotation.x = THREE.MathUtils.lerp(currentRotation.x, targetRot.x, 0.15);
      currentRotation.y = THREE.MathUtils.lerp(currentRotation.y, targetRot.y, 0.15);
      currentRotation.z = THREE.MathUtils.lerp(currentRotation.z, targetRot.z, 0.15);

      // Apply subtle bobbing animation when standing still, jumping when moving
      let targetY = targetPos.y;
      if (!player.isMoving) {
        targetY += Math.sin(state.clock.getElapsedTime() * 2 + player.name.charCodeAt(0)) * 0.1;
      } else {
        targetY += Math.abs(Math.sin(state.clock.getElapsedTime() * 10)) * 0.3;
      }
      currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY, 0.15);
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
    <group ref={meshRef} position={player.position} rotation={player.rotation}>
      {/* 3D Glassmorphic Avatar Capsule offset by y=0.8 to sit on ground */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
        <meshPhysicalMaterial
          color={player.avatarColor}
          roughness={0.15}
          transmission={0.6}
          thickness={0.8}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          emissive={player.avatarColor}
          emissiveIntensity={0.2}
        />
        {/* Render graduation cap on top of capsule */}
        <GraduationCap3D color={player.avatarColor} />
      </mesh>

      {/* Floating HTML Name & Grade Label */}
      <Html position={[0, 2.1, 0]} center distanceFactor={15}>
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

      {/* Floating Emotes Renderer */}
      <Html position={[0, 2.8, 0]} center distanceFactor={15}>
        <div className="flex flex-col gap-1 items-center pointer-events-none select-none h-24 justify-end">
          <AnimatePresence>
            {playerEmotes.map((emote) => (
              <motion.div
                key={emote.id}
                initial={{ opacity: 1, y: 10, scale: 0.5 }}
                animate={{ opacity: 0, y: -60, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.0, ease: "easeOut" }}
                className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
              >
                {EMOJI_MAP[emote.type] || "🎓"}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Html>
    </group>
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
