// /home/moumene/bem/frontend/components/ui/GlassHUD.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useGameStore } from "@/store/useGameStore";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Users, Sparkles, LogOut, Radio, HelpCircle } from "lucide-react";

export default function GlassHUD() {
  const { data: session } = useSession();
  const isConnected = useGameStore((state) => state.isConnected);
  const players = useGameStore((state) => state.players);
  const chatMessages = useGameStore((state) => state.chatMessages);
  const sendChatMessage = useGameStore((state) => state.sendChatMessage);
  const triggerVfx = useGameStore((state) => state.triggerVfx);

  const [inputVal, setInputVal] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat wall to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendChatMessage(inputVal.trim());
    setInputVal("");
  };

  const activeCount = players.length + 1; // Remote players + Local player

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
      {/* Top HUD Row */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        {/* Left Side: Server Status & Count */}
        <div className="flex flex-col gap-2">
          <div className="glass-morphism px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-red-500"}`} />
            <span className="text-white text-xs font-semibold">
              {isConnected ? "Connected to Beach Party" : "Connecting..."}
            </span>
          </div>

          <div className="glass-morphism px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-white text-xs font-bold">
              Graduates online: {activeCount}
            </span>
          </div>
        </div>

        {/* Center: Celebration Title banner */}
        <div className="hidden md:flex glass-morphism px-6 py-2 rounded-full items-center gap-2 shadow-xl border-purple-500/20">
          <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Algerian Graduates Celebration 2026 🎉
          </span>
        </div>

        {/* Right Side: Exit Button & Quick Guide */}
        <div className="flex items-center gap-2">
          <div className="glass-morphism px-4 py-2 rounded-full flex items-center gap-2 shadow-lg text-slate-300 text-xs font-medium">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Click canvas to look. WASD to move.</span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="glass-morphism p-2 rounded-full text-red-400 hover:text-white hover:bg-red-600/20 active:scale-95 transition-all shadow-lg"
            title="Leave Party"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle/Bottom Layout */}
      <div className="w-full flex justify-between items-end gap-6 mt-auto">
        {/* Left Bottom corner: Spatial Voice Chat Overlay placeholder */}
        <div className="glass-morphism p-4 rounded-2xl w-64 shadow-xl pointer-events-auto flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Spatial Voice Room
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Mouth distance controls volume. Walk closer to other graduates to chat!
          </p>
        </div>

        {/* Center Bottom: VFX Action Controls */}
        <div className="glass-morphism p-3 rounded-2xl flex items-center gap-4 shadow-2xl pointer-events-auto border-white/10">
          <button
            onClick={() => triggerVfx("firework")}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            أطلق ألعاب نارية 🎆
          </button>
          <button
            onClick={() => triggerVfx("confetti")}
            className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-600/30 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            انثر قصاصات ورقية 🎉
          </button>
        </div>

        {/* Right Bottom corner: Chat Wall */}
        <div className="glass-morphism-dark rounded-2xl w-80 max-h-[380px] shadow-2xl pointer-events-auto flex flex-col overflow-hidden border border-white/10">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-white/2 flex items-center justify-between">
            <span className="text-xs font-bold text-white">Graduates Chat Wall</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Live</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[250px] no-scrollbar">
            <AnimatePresence initial={false}>
              {chatMessages.map((msg) => {
                const isSystem = msg.userId === "system";

                if (isSystem) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 text-center font-medium"
                    >
                      {msg.text}
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-0.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-purple-400">{msg.name}</span>
                      {msg.examType && (
                        <span className="text-[8px] font-bold px-1 bg-white/5 border border-white/10 text-slate-400 rounded">
                          {msg.examType}
                        </span>
                      )}
                      <span className="text-[8px] text-slate-500 ml-auto">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-200 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 break-words">
                      {msg.text}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSendChat} className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
            <input
              type="text"
              placeholder="اكتب رسالة..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              maxLength={120}
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all text-white shadow-lg"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
