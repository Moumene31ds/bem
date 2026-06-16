// /home/moumene/bem/frontend/components/3d/Player.tsx
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { useGameStore } from "@/store/useGameStore";

// Custom hook to detect active keyboard inputs
const useKeyboardControls = () => {
  const keys = useRef({
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is typing in chat input
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.code in keys.current) {
        keys.current[e.code as keyof typeof keys.current] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keys.current) {
        keys.current[e.code as keyof typeof keys.current] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keys;
};

// Reusable 3D Graduation Cap component
export function GraduationCap3D({ color }: { color: string }) {
  return (
    <group position={[0, 0.9, 0]}>
      {/* Cap Dome/Base */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.15, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>
      {/* Cap Square Board */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.02, 0.55]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>
      {/* Button on top */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Tassel Hanging Thread */}
      <mesh position={[0.2, 0.02, 0.2]}>
        <boxGeometry args={[0.015, 0.15, 0.015]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function Player() {
  const { camera } = useThree();
  const keys = useKeyboardControls();
  
  const updateLocalMovement = useGameStore((state) => state.updateLocalMovement);
  const viewMode = useGameStore((state) => state.viewMode);
  const localPlayer = useGameStore((state) => state.localPlayer);
  
  // Position reference (rest coordinate on beach sand, y=0 is ground level)
  const playerPos = useRef(new THREE.Vector3(0, 0, 10)); 
  const playerRot = useRef(new THREE.Euler(0, 0, 0));
  const orbitControlsRef = useRef<any>(null);

  const SPEED = 8; // Movement speed units/sec
  const BOUNDS = 45; // Coastal beach stage boundaries

  useFrame((state, delta) => {
    const activeKeys = keys.current;

    // Determine direction vectors relative to current camera rotation
    const frontVector = new THREE.Vector3(0, 0, 0);
    const sideVector = new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3(0, 0, 0);

    // W / S or Up / Down
    if (activeKeys.KeyW || activeKeys.ArrowUp) frontVector.set(0, 0, -1);
    if (activeKeys.KeyS || activeKeys.ArrowDown) frontVector.set(0, 0, 1);

    // A / D or Left / Right
    if (activeKeys.KeyA || activeKeys.ArrowLeft) sideVector.set(-1, 0, 0);
    if (activeKeys.KeyD || activeKeys.ArrowRight) sideVector.set(1, 0, 0);

    // Calculate movement vector aligned with camera horizontal looking direction
    const camEuler = new THREE.Euler(0, camera.rotation.y, 0, "YXZ");
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED * delta)
      .applyEuler(camEuler);

    // Apply movement while checking boundaries
    const nextX = playerPos.current.x + direction.x;
    const nextZ = playerPos.current.z + direction.z;

    if (Math.abs(nextX) < BOUNDS) {
      playerPos.current.x = nextX;
      // In orbit mode, drag the camera along with the player position shifts
      if (viewMode === "orbit") {
        camera.position.x += direction.x;
      }
    }
    if (Math.abs(nextZ) < BOUNDS) {
      playerPos.current.z = nextZ;
      if (viewMode === "orbit") {
        camera.position.z += direction.z;
      }
    }

    // Adjust heights and cameras based on view modes
    if (viewMode === "first-person") {
      playerPos.current.y = 0; // Ground level coordinate
      camera.position.set(playerPos.current.x, 1.6, playerPos.current.z); // Eye height 1.6
      playerRot.current.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
    } else {
      // Orbit mode: Let camera look at the player avatar center (y = 0.8)
      playerPos.current.y = 0;
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(playerPos.current.x, 0.8, playerPos.current.z);
        orbitControlsRef.current.update();
      }
      
      // Face movement direction if moving
      if (direction.lengthSq() > 0) {
        // Rotates the character mesh to look in direction of movement
        playerRot.current.y = Math.atan2(direction.x, direction.z);
      }
    }

    const isMoving = direction.lengthSq() > 0;

    // Send high-frequency updates to the Zustand store (throttled implicitly inside store)
    updateLocalMovement(
      [playerPos.current.x, playerPos.current.y, playerPos.current.z],
      [playerRot.current.x, playerRot.current.y, playerRot.current.z],
      isMoving
    );
  });

  const avatarColor = localPlayer?.avatarColor || "#a855f7";

  return (
    <group>
      {viewMode === "orbit" && (
        <OrbitControls
          ref={orbitControlsRef}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera going under floor
          minDistance={2}
          maxDistance={25}
        />
      )}

      {/* Local player 3D avatar mesh visible only in Orbit Drone view */}
      {viewMode === "orbit" && (
        <mesh
          position={[playerPos.current.x, 0.8, playerPos.current.z]}
          rotation={[0, playerRot.current.y, 0]}
          castShadow
        >
          <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
          <meshPhysicalMaterial
            color={avatarColor}
            roughness={0.15}
            transmission={0.6}
            thickness={0.8}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            emissive={avatarColor}
            emissiveIntensity={0.2}
          />
          <GraduationCap3D color={avatarColor} />
        </mesh>
      )}
    </group>
  );
}
