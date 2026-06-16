// /home/moumene/bem/frontend/components/3d/Scene.tsx
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sky, Environment, PointerLockControls, Html } from "@react-three/drei";
import * as THREE from "three";
import Player from "./Player";
import RemotePlayers from "./RemotePlayers";
import Fireworks from "./Fireworks";
import { useGameStore } from "@/store/useGameStore";

// Stylized Palm Tree Component
function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk (Segmented for organic curved look) */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 3, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 3.8, 0]} rotation={[0, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.8, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>

      {/* Leaves Star Pattern */}
      <group position={[0.3, 4.6, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i * Math.PI) / 3;
          return (
            <mesh
              key={i}
              rotation={[0.2, angle, 0.4]}
              position={[Math.cos(angle) * 0.8, -0.2, Math.sin(angle) * 0.8]}
              castShadow
            >
              <boxGeometry args={[1.8, 0.05, 0.4]} />
              <meshStandardMaterial color="#065f46" roughness={0.8} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// Interactive Beach Bonfire with Flickering Light and rising fire sparks
function Bonfire({ position }: { position: [number, number, number] }) {
  const fireLightRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 20;

  // Setup initial sparks positions once using useMemo
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vels = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.3;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.random() * 1.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      vels[i * 3] = (Math.random() - 0.5) * 0.3; // Drift X
      vels[i * 3 + 1] = 0.8 + Math.random() * 0.8; // Upwards speed Y
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.3; // Drift Z
    }
    return { positions: pos, velocities: vels };
  }, []);

  useFrame((state, delta) => {
    // 1. Flicker the bonfire point light
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 1.8 + Math.sin(state.clock.getElapsedTime() * 15) * 0.4 + Math.random() * 0.3;
    }

    // 2. Animate rising hot sparks
    if (particlesRef.current) {
      const geo = particlesRef.current.geometry;
      const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
      if (posAttr) {
        for (let i = 0; i < particleCount; i++) {
          let y = posAttr.getY(i) + velocities[i * 3 + 1] * delta;
          let x = posAttr.getX(i) + velocities[i * 3] * delta;
          let z = posAttr.getZ(i) + velocities[i * 3 + 2] * delta;

          // Recycle particle if it goes too high
          if (y > 2.0) {
            y = 0;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.2;
            x = Math.cos(angle) * radius;
            z = Math.sin(angle) * radius;
          }

          posAttr.setX(i, x);
          posAttr.setY(i, y);
          posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group position={position}>
      {/* Wooden Logs Ring */}
      <mesh rotation={[0, 0, 0.7]} position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      <mesh rotation={[0.7, 0, -0.7]} position={[0.2, 0.1, 0.2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      <mesh rotation={[-0.7, 0.7, 0]} position={[-0.2, 0.1, -0.2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>

      {/* Glowing Red Coals Base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 0.1, 16]} />
        <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={3} />
      </mesh>

      {/* Flickering Bonfire Light */}
      <pointLight
        ref={fireLightRef}
        color="#f97316"
        intensity={2}
        distance={10}
        castShadow
        position={[0, 0.6, 0]}
      />

      {/* Drifting Fire Sparks */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#f97316"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// Pulsing DJ Speakers
function PulsingSpeaker({ position, isLeft }: { position: [number, number, number]; isLeft: boolean }) {
  const speakerRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (speakerRef.current) {
      // Rhythmic heartbeat scale pulsing (around 120bpm)
      const t = state.clock.getElapsedTime();
      const beat = Math.sin(t * 8) * 0.04;
      const pulse = 1 + Math.max(0, beat);
      speakerRef.current.scale.set(1, pulse, 1);
    }
  });

  return (
    <group position={position} ref={speakerRef}>
      {/* Outer Case */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[1.0, 2.4, 0.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Speaker Woofer Cones */}
      <mesh position={[0, 1.8, 0.41]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.02, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.8, 0.41]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.02, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} />
      </mesh>
    </group>
  );
}

// Sweeping DJ Stage Lasers
function StageLaser({ position, color }: { position: [number, number, number]; color: string }) {
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (beamRef.current) {
      // Swing rotation back and forth
      const t = state.clock.getElapsedTime();
      const angleX = Math.sin(t * 1.5) * 0.4;
      const angleZ = Math.cos(t * 2.0) * 0.3;
      beamRef.current.rotation.set(angleX, 0, angleZ + 0.5);
    }
  });

  return (
    <group position={position}>
      {/* Light bulb emitter base */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Glowing swing beam */}
      <mesh ref={beamRef} position={[0, 4, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.02, 0.15, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Waving Algerian Flag on a Pole
function AlgerianFlag({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Flagpole */}
      <mesh castShadow position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 5, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
      </mesh>
      
      {/* Waving HTML Flag */}
      <Html position={[0.7, 4.3, 0]} center distanceFactor={12}>
        <div className="w-24 h-16 border border-white/20 rounded shadow-2xl overflow-hidden relative flex animate-[pulse_3s_infinite] select-none pointer-events-none">
          {/* Green Half */}
          <div className="w-1/2 h-full bg-[#006633]" />
          {/* White Half */}
          <div className="w-1/2 h-full bg-white relative flex items-center justify-center">
            {/* Red Crescent & Star centered */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 flex items-center justify-center z-10">
              {/* Crescent */}
              <div className="w-7 h-7 rounded-full bg-[#d21034] relative">
                <div className="w-6 h-6 rounded-full bg-white absolute top-0.5 right-0.5" />
              </div>
              {/* Star */}
              <div className="absolute text-[9px] text-[#d21034] -right-0.5 top-[9px]">★</div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// DJ Party Stage Booth Component (Low-Poly sleek design)
function PartyStage() {
  return (
    <group position={[0, 0, -5]}>
      {/* Main DJ Platform Deck */}
      <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[8, 0.8, 4]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Glowing Neon DJ Deck Header Panel */}
      <mesh position={[0, 1.0, 1.95]}>
        <boxGeometry args={[6, 0.4, 0.1]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Stage Backdrop Neon Board */}
      <mesh position={[0, 3, -1.9]}>
        <boxGeometry args={[10, 5, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Neon Gradient Accent Strip */}
      <mesh position={[0, 3, -1.75]}>
        <boxGeometry args={[9, 0.1, 0.1]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={2}
        />
      </mesh>
      
      <mesh position={[0, 4, -1.75]}>
        <boxGeometry args={[9, 0.1, 0.1]} />
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Decorative DJ Turntable Boxes */}
      <mesh position={[-1.5, 0.85, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} />
      </mesh>
      <mesh position={[1.5, 0.85, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} />
      </mesh>

      {/* Arabic Congratulations banner above the DJ stage */}
      <Html position={[0, 5.8, 0]} center distanceFactor={15}>
        <div className="glass-morphism-dark border border-purple-500/30 px-8 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[340px] text-center select-none shadow-[0_0_25px_rgba(168,85,247,0.3)]">
          <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 whitespace-nowrap leading-none tracking-wide">
            🏆 مبروك النجاح والتخرج لدفعة 2026 🏆
          </span>
          <span className="text-[10px] font-bold text-slate-300 mt-1 leading-none">
            حفلة طلاب البيام BEM وبكالوريا BAC الجزائرية الافتراضية
          </span>
        </div>
      </Html>
    </group>
  );
}

// Interactive Neon Dance Floor Grid Component
function NeonDanceFloor() {
  const localPlayer = useGameStore((state) => state.localPlayer);
  const players = useGameStore((state) => state.players);

  const rows = 4;
  const cols = 6;
  const tileSize = 1.4;
  const gap = 0.15;

  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = (c - (cols - 1) / 2) * (tileSize + gap);
      const tz = (r - (rows - 1) / 2) * (tileSize + gap) + 2.5;
      const tilePos: [number, number, number] = [tx, 0.02, tz];

      tiles.push(
        <DanceFloorTile
          key={`${r}-${c}`}
          position={tilePos}
          size={tileSize}
          localPlayer={localPlayer}
          players={players}
        />
      );
    }
  }

  return <group>{tiles}</group>;
}

// Single Tile with proximity glow
function DanceFloorTile({
  position,
  size,
  localPlayer,
  players,
}: {
  position: [number, number, number];
  size: number;
  localPlayer: any;
  players: any[];
}) {
  const tileRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!tileRef.current) return;

    let isSteppedOn = false;
    const allPlayers = [
      ...(localPlayer ? [localPlayer] : []),
      ...players,
    ];

    for (const p of allPlayers) {
      const px = p.position[0];
      const pz = p.position[2];
      const dist = Math.hypot(px - position[0], pz - position[2]);
      if (dist < size * 0.8) {
        isSteppedOn = true;
        break;
      }
    }

    const mat = tileRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      const time = state.clock.getElapsedTime();
      if (isSteppedOn) {
        mat.emissive.setHSL((time * 2) % 1.0, 0.9, 0.6);
        mat.emissiveIntensity = 2.5;
      } else {
        const pulse = Math.sin(time * 2.5 + position[0] * 0.3 + position[2] * 0.3) * 0.5 + 0.5;
        mat.emissive.setHSL((position[0] * 0.05 + 0.6) % 1.0, 0.8, 0.25);
        mat.emissiveIntensity = 0.2 + pulse * 0.6;
      }
    }
  });

  return (
    <mesh ref={tileRef} position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color="#111827"
        roughness={0.2}
        metalness={0.8}
        emissive="#000000"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

// Graduation Star collectible
function GraduationStar({ star }: { star: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const localPlayer = useGameStore((state) => state.localPlayer);
  const socket = useGameStore((state) => state.socket);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 2;
      meshRef.current.position.y = star.position[1] + Math.sin(state.clock.getElapsedTime() * 4) * 0.2;
    }

    if (localPlayer) {
      const px = localPlayer.position[0];
      const pz = localPlayer.position[2];
      const sx = star.position[0];
      const sz = star.position[2];
      const dist = Math.hypot(px - sx, pz - sz);
      if (dist < 1.6) {
        if (socket && socket.connected) {
          socket.emit("collect_star", { starId: star.id });
        }
      }
    }
  });

  return (
    <mesh ref={meshRef} position={star.position} castShadow>
      <octahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial
        color="#fbbf24"
        emissive="#d97706"
        emissiveIntensity={2.0}
        roughness={0.1}
        metalness={0.9}
      />
      <pointLight color="#fbbf24" intensity={1.2} distance={5} />
    </mesh>
  );
}

// Coastal beach floor plane
function BeachFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial
        color="#0b132b" // Dark night sand tone
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

export default function Scene() {
  const viewMode = useGameStore((state) => state.viewMode);
  const stars = useGameStore((state) => state.stars);

  return (
    <div className="w-full h-full bg-slate-950">
      <Canvas
        shadows
        camera={{ fov: 60, position: [0, 1.6, 10] }}
        gl={{ antialias: true }}
      >
        {/* Night sky configuration */}
        <Sky
          distance={450000}
          sunPosition={[0, -1, 0]} // Hides the sun for night beach atmosphere
          inclination={0}
          azimuth={0.25}
        />
        <Environment preset="night" />

        {/* Ambient night lighting */}
        <ambientLight intensity={0.15} />

        {/* Moon spotlight lighting */}
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        {/* Dynamic party spotlights (Neon pink and blue) */}
        <pointLight
          position={[-6, 4, -3]}
          intensity={3}
          distance={15}
          color="#3b82f6" // Electric blue
          castShadow
        />
        <pointLight
          position={[6, 4, -3]}
          intensity={3}
          distance={15}
          color="#ec4899" // Hot pink
          castShadow
        />
        <pointLight
          position={[0, 5, 2]}
          intensity={2}
          distance={12}
          color="#a855f7" // Glowing purple
        />

        {/* Game World Objects */}
        <BeachFloor />
        <PartyStage />
        <NeonDanceFloor />

        {/* Sweeping Lasers */}
        <StageLaser position={[-3, 0.8, -6.5]} color="#06b6d4" />
        <StageLaser position={[3, 0.8, -6.5]} color="#a855f7" />

        {/* Pulsing Speaker Columns */}
        <PulsingSpeaker position={[-5.2, 0, -4.5]} isLeft={true} />
        <PulsingSpeaker position={[5.2, 0, -4.5]} isLeft={false} />

        {/* Beach Bonfires */}
        <Bonfire position={[7, 0, 5]} />
        <Bonfire position={[-7, 0, 5]} />

        {/* Waving Algerian Flags */}
        <AlgerianFlag position={[-4.5, 0.8, -6]} />
        <AlgerianFlag position={[4.5, 0.8, -6]} />

        {/* Stylized Palm Trees scattered around */}
        <PalmTree position={[-20, 0, -15]} />
        <PalmTree position={[20, 0, -15]} />
        <PalmTree position={[-18, 0, 18]} />
        <PalmTree position={[18, 0, 18]} />

        {/* Floating Stars Collectibles */}
        {stars.map((star) => (
          <GraduationStar key={star.id} star={star} />
        ))}

        {/* Connected Graduates */}
        <Player />
        <RemotePlayers />
        <Fireworks />

        {/* First Person Controls: Render only in first-person mode. Click to look; ESC to release */}
        {viewMode === "first-person" && (
          <PointerLockControls selector="#canvas-overlay" />
        )}
      </Canvas>

      {/* Visual Click Target Layer for PointerLockControls when in first-person */}
      {viewMode === "first-person" && (
        <div
          id="canvas-overlay"
          className="absolute inset-0 z-0 cursor-pointer flex items-center justify-center pointer-events-auto"
          onClick={(e) => {
            // PointerLockControls listens to this element
          }}
        />
      )}
    </div>
  );
}
