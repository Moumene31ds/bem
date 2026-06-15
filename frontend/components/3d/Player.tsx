// /home/moumene/bem/frontend/components/3d/Player.tsx
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
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

export default function Player() {
  const { camera } = useThree();
  const keys = useKeyboardControls();
  const updateLocalMovement = useGameStore((state) => state.updateLocalMovement);
  
  // Position reference to prevent garbage collection allocations on every frame
  const playerPos = useRef(new THREE.Vector3(0, 1.6, 10)); // Initial spawn (y=1.6 represents eye height)
  const playerRot = useRef(new THREE.Euler(0, 0, 0));
  const velocity = useRef(new THREE.Vector3());

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

    if (Math.abs(nextX) < BOUNDS) playerPos.current.x = nextX;
    if (Math.abs(nextZ) < BOUNDS) playerPos.current.z = nextZ;

    // Pin player height to the virtual beach ground (y = 0 or 1.6 for eye level)
    playerPos.current.y = 1.6; 

    // Update camera position to mimic first-person navigation
    camera.position.copy(playerPos.current);

    // Sync orientation
    playerRot.current.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);

    const isMoving = direction.lengthSq() > 0;

    // Send high-frequency updates to the Zustand store (throttled implicitly inside store)
    updateLocalMovement(
      [playerPos.current.x, playerPos.current.y - 1.6, playerPos.current.z], // Send ground-level coord
      [playerRot.current.x, playerRot.current.y, playerRot.current.z],
      isMoving
    );
  });

  return (
    <mesh position={[playerPos.current.x, playerPos.current.y - 0.8, playerPos.current.z]}>
      {/* Invisible capsule container for the local user's virtual avatar placeholder */}
      <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
