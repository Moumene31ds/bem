// /home/moumene/bem/frontend/store/useGameStore.ts
import { create } from "zustand";
import { io, Socket } from "socket.io-client";

export interface Player {
  id: string;
  userId: string;
  name: string;
  examType: "BEM" | "BAC";
  grade: "EXCELLENT" | "VERY_GOOD" | "GOOD" | "PASSABLE";
  avatarColor: string;
  peerId: string | null;
  position: [number, number, number];
  rotation: [number, number, number];
  isMoving: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  examType?: string;
  text: string;
  timestamp: string;
}

export interface FireworkEffect {
  id: string;
  senderName: string;
  type: "firework" | "confetti";
  position: [number, number, number];
  color: string;
}

interface GameState {
  // Sockets & WebRTC Instance States
  socket: Socket | null;
  socketId: string | null;
  peerId: string | null;
  isConnected: boolean;

  // Player States
  players: Player[];
  localPlayer: {
    name: string;
    examType: "BEM" | "BAC";
    grade: "EXCELLENT" | "VERY_GOOD" | "GOOD" | "PASSABLE";
    avatarColor: string;
    position: [number, number, number];
    rotation: [number, number, number];
    isMoving: boolean;
  } | null;

  // Interaction States
  chatMessages: ChatMessage[];
  activeVfx: FireworkEffect[];

  // Actions
  initSocket: (serverUrl: string, user: { id: string; name: string; examType: string; grade: string; avatarColor: string }) => void;
  registerPeerId: (peerId: string) => void;
  updateLocalMovement: (position: [number, number, number], rotation: [number, number, number], isMoving: boolean) => void;
  sendChatMessage: (text: string) => void;
  triggerVfx: (type: "firework" | "confetti", position?: [number, number, number]) => void;
  disconnectSocket: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  socketId: null,
  peerId: null,
  isConnected: false,
  players: [],
  localPlayer: null,
  chatMessages: [],
  activeVfx: [],

  initSocket: (serverUrl, user) => {
    // Prevent double initialization
    if (get().socket) return;

    const socketInstance = io(serverUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    set({
      socket: socketInstance,
      localPlayer: {
        name: user.name,
        examType: user.examType as any,
        grade: user.grade as any,
        avatarColor: user.avatarColor,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        isMoving: false,
      },
    });

    socketInstance.on("connect", () => {
      set({ isConnected: true, socketId: socketInstance.id });
      
      // Register with the socket server
      socketInstance.emit("user_joined", {
        id: user.id,
        name: user.name,
        examType: user.examType,
        grade: user.grade,
        avatarColor: user.avatarColor,
        peerId: get().peerId,
      });
    });

    socketInstance.on("welcome", (data: { socketId: string; currentPlayers: Player[] }) => {
      set({
        socketId: data.socketId,
        players: data.currentPlayers.filter((p) => p.id !== data.socketId),
      });
    });

    // Handle high-frequency tick updates from server
    socketInstance.on("state_update", (updatedPlayers: Player[]) => {
      const currentSocketId = get().socketId;
      if (!currentSocketId) return;

      // Filter out local player coordinates to prevent jittering / local override
      const remotePlayers = updatedPlayers.filter((p) => p.id !== currentSocketId);
      set({ players: remotePlayers });
    });

    socketInstance.on("chat_message", (msg: ChatMessage) => {
      set((state) => ({
        chatMessages: [...state.chatMessages.slice(-99), msg], // Limit chat buffer to 100 entries
      }));
    });

    socketInstance.on("fireworks_triggered", (vfx: FireworkEffect) => {
      set((state) => ({
        activeVfx: [...state.activeVfx, vfx],
      }));

      // Cleanup visual effect after duration (e.g., 4 seconds) to free memory
      setTimeout(() => {
        set((state) => ({
          activeVfx: state.activeVfx.filter((effect) => effect.id !== vfx.id),
        }));
      }, 4000);
    });

    socketInstance.on("user_left", (leftSocketId: string) => {
      set((state) => ({
        players: state.players.filter((p) => p.id !== leftSocketId),
      }));
    });

    socketInstance.on("disconnect", () => {
      set({ isConnected: false, socketId: null });
    });
  },

  registerPeerId: (peerId) => {
    const { socket } = get();
    set({ peerId });
    if (socket && socket.connected) {
      socket.emit("register_peer_id", peerId);
    }
  },

  updateLocalMovement: (position, rotation, isMoving) => {
    const { socket, localPlayer } = get();
    if (!localPlayer) return;

    // Local state update
    set({
      localPlayer: {
        ...localPlayer,
        position,
        rotation,
        isMoving,
      },
    });

    // Direct WebSockets emission
    if (socket && socket.connected) {
      socket.emit("user_moved", { position, rotation, isMoving });
    }
  },

  sendChatMessage: (text) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit("chat_message", text);
    }
  },

  triggerVfx: (type, position) => {
    const { socket, localPlayer } = get();
    if (!localPlayer) return;

    if (socket && socket.connected) {
      // If position is not specified, place it relative to the local player's height
      const targetPos = position || [
        localPlayer.position[0] + (Math.random() - 0.5) * 6,
        localPlayer.position[1] + 12 + Math.random() * 4,
        localPlayer.position[2] + (Math.random() - 0.5) * 6,
      ];

      socket.emit("fireworks_triggered", {
        type,
        position: targetPos,
        color: localPlayer.avatarColor,
      });
    }
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, socketId: null, isConnected: false, players: [] });
    }
  },
}));
