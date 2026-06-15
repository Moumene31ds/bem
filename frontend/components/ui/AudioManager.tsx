// /home/moumene/bem/frontend/components/ui/AudioManager.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { useGameStore, Player } from "@/store/useGameStore";
import { useSession } from "next-auth/react";

export default function AudioManager() {
  const { data: session } = useSession();
  const socket = useGameStore((state) => state.socket);
  const players = useGameStore((state) => state.players);
  const registerPeerId = useGameStore((state) => state.registerPeerId);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const activeCalls = useRef<Map<string, any>>(new Map()); // Key: PeerID, Value: MediaConnection

  // Map to track remote audio DOM elements
  // Key: PeerID, Value: HTMLAudioElement
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [audioElements, setAudioElements] = useState<{ peerId: string; stream: MediaStream }[]>([]);

  const MAX_AUDIO_DISTANCE = 35; // Maximum distance to hear a player (in meters/units)

  useEffect(() => {
    if (!session?.user || !socket) return;

    const initPeerAndWebRTC = async () => {
      try {
        // 1. Capture microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        localStreamRef.current = stream;

        // 2. Initialize PeerJS connection pointing to the backend signalling mount
        const PEER_HOST = process.env.NEXT_PUBLIC_PEER_HOST || "localhost";
        const PEER_PORT = parseInt(process.env.NEXT_PUBLIC_PEER_PORT || "5000");

        const peer = new Peer({
          host: PEER_HOST,
          port: PEER_PORT,
          path: "/peerjs/spatial-audio",
          debug: 1, // Only errors to keep console clean
        });
        peerRef.current = peer;

        // 3. Register PeerID to the local socket registry once generated
        peer.on("open", (id) => {
          registerPeerId(id);
        });

        // 4. Handle incoming calls from other graduates
        peer.on("call", (call) => {
          call.answer(stream); // Send our local microphone audio
          call.on("stream", (remoteStream) => {
            addRemoteAudioStream(call.peer, remoteStream);
          });
          activeCalls.current.set(call.peer, call);
        });
      } catch (err) {
        console.warn("Microphone access denied or PeerJS connection failed. Spatial audio disabled.", err);
      }
    };

    initPeerAndWebRTC();

    return () => {
      // Cleanup WebRTC connections
      activeCalls.current.forEach((call) => call.close());
      activeCalls.current.clear();
      if (peerRef.current) peerRef.current.destroy();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [session, socket, registerPeerId]);

  // Handle calling newly connected players
  useEffect(() => {
    if (!peerRef.current || !localStreamRef.current) return;

    players.forEach((player) => {
      const peerId = player.peerId;
      if (peerId && !activeCalls.current.has(peerId)) {
        // Initiate outgoing audio WebRTC call
        const call = peerRef.current!.call(peerId, localStreamRef.current!);
        call.on("stream", (remoteStream) => {
          addRemoteAudioStream(peerId, remoteStream);
        });
        call.on("close", () => {
          removeRemoteAudioStream(peerId);
        });
        activeCalls.current.set(peerId, call);
      }
    });

    // Close calls with players that disconnected
    activeCalls.current.forEach((_, peerId) => {
      const stillOnline = players.some((p) => p.peerId === peerId);
      if (!stillOnline) {
        activeCalls.current.get(peerId)?.close();
        activeCalls.current.delete(peerId);
        removeRemoteAudioStream(peerId);
      }
    });
  }, [players]);

  // Track coordinates and adjust volumes dynamically relative to camera (ear position)
  useEffect(() => {
    let animationFrameId: number;

    const updateSpatialVolumes = () => {
      // In first-person navigation, local player position is represented by camera position
      if (typeof window !== "undefined" && window.THREE) {
        // Safety check if Three.js camera is initialized
      }
      
      const localPlayer = useGameStore.getState().localPlayer;
      if (localPlayer) {
        const [lx, ly, lz] = localPlayer.position;

        players.forEach((player) => {
          const peerId = player.peerId;
          const audioElement = remoteAudios.current.get(peerId || "");
          if (audioElement && peerId) {
            const [rx, ry, rz] = player.position;
            
            // Calculate Euclidean distance in 3D space
            const distance = Math.hypot(rx - lx, ry - ly, rz - lz);

            // Logarithmic dropoff mapping
            let volume = 0;
            if (distance < MAX_AUDIO_DISTANCE) {
              volume = 1 - (distance / MAX_AUDIO_DISTANCE);
              // Apply curve for realistic audio falloff
              volume = Math.pow(volume, 2); 
            }
            
            audioElement.volume = Math.max(0, Math.min(1, volume));
          }
        });
      }

      animationFrameId = requestAnimationFrame(updateSpatialVolumes);
    };

    updateSpatialVolumes();
    return () => cancelAnimationFrame(animationFrameId);
  }, [players]);

  const addRemoteAudioStream = (peerId: string, stream: MediaStream) => {
    setAudioElements((prev) => {
      if (prev.some((el) => el.peerId === peerId)) return prev;
      return [...prev, { peerId, stream }];
    });
  };

  const removeRemoteAudioStream = (peerId: string) => {
    setAudioElements((prev) => prev.filter((el) => el.peerId !== peerId));
    remoteAudios.current.delete(peerId);
  };

  return (
    <div className="absolute hidden">
      {/* Dynamic invisible audio elements rendered to bind media streams to browser context */}
      {audioElements.map(({ peerId, stream }) => (
        <audio
          key={peerId}
          autoPlay
          ref={(el) => {
            if (el) {
              el.srcObject = stream;
              remoteAudios.current.set(peerId, el);
            }
          }}
        />
      ))}
    </div>
  );
}
