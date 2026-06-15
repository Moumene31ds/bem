// /home/moumene/bem/frontend/app/party/page.tsx
"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import Scene from "@/components/3d/Scene";
import GlassHUD from "@/components/ui/GlassHUD";
import AudioManager from "@/components/ui/AudioManager";

export default function PartyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const initSocket = useGameStore((state) => state.initSocket);
  const disconnectSocket = useGameStore((state) => state.disconnectSocket);

  // Redirect unauthenticated graduates back to the landing page
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // Connect user identity details to the socket server
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const u = session.user as any;
      
      // Initialize the Socket connection pointing to the backend
      const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
      initSocket(SOCKET_SERVER_URL, {
        id: u.id || "",
        name: u.name || "Graduate",
        examType: u.examType || "BAC",
        grade: u.grade || "PASSABLE",
        avatarColor: u.avatarColor || "#3b82f6",
      });
    }

    // Disconnect socket cleanly on component unmount
    return () => {
      disconnectSocket();
    };
  }, [status, session, initSocket, disconnectSocket]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950">
        <svg className="animate-spin h-8 w-8 text-purple-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-semibold text-slate-400">Loading graduation party room...</span>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* 3D Scene Viewport */}
      <div className="w-full h-full z-0">
        <Scene />
      </div>

      {/* Floating 2D HUD Overlays */}
      <GlassHUD />
      <AudioManager />
    </div>
  );
}
