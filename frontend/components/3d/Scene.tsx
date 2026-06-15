// /home/moumene/bem/frontend/components/3d/Scene.tsx
import { Canvas } from "@react-three/fiber";
import { Sky, Environment, PointerLockControls } from "@react-three/drei";
import Player from "./Player";
import RemotePlayers from "./RemotePlayers";
import Fireworks from "./Fireworks";

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
    </group>
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

        {/* Connected Graduates */}
        <Player />
        <RemotePlayers />
        <Fireworks />

        {/* First Person Controls. Click on screen to capture mouse; ESC to release */}
        <PointerLockControls selector="#canvas-overlay" />
      </Canvas>

      {/* Visual Click Target Layer for PointerLockControls */}
      <div
        id="canvas-overlay"
        className="absolute inset-0 z-0 cursor-pointer flex items-center justify-center pointer-events-auto"
        onClick={(e) => {
          // PointerLockControls listens to this element
        }}
      />
    </div>
  );
}
