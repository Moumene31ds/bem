// /home/moumene/bem/frontend/components/ui/GlassHUD.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useGameStore } from "@/store/useGameStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Users,
  Sparkles,
  LogOut,
  Radio,
  HelpCircle,
  Trophy,
  Eye,
  Camera,
  Music,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getAudioEngine } from "./SynthesizedAudio";

const EMOTE_OPTIONS = [
  { type: "cap", label: "🎓 قبعة تخرج" },
  { type: "heart", label: "❤️ حب" },
  { type: "clap", label: "👏 تصفيق" },
  { type: "laugh", label: "😂 ضحك" },
  { type: "fire", label: "🔥 حماس" },
];

export default function GlassHUD() {
  const { data: session } = useSession();
  
  // Game states from Zustand
  const isConnected = useGameStore((state) => state.isConnected);
  const players = useGameStore((state) => state.players);
  const chatMessages = useGameStore((state) => state.chatMessages);
  const sendChatMessage = useGameStore((state) => state.sendChatMessage);
  const triggerVfx = useGameStore((state) => state.triggerVfx);
  const triggerEmote = useGameStore((state) => state.triggerEmote);
  const viewMode = useGameStore((state) => state.viewMode);
  const setViewMode = useGameStore((state) => state.setViewMode);
  const localPlayer = useGameStore((state) => state.localPlayer);

  // Local HUD states
  const [inputVal, setInputVal] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [bgmTrack, setBgmTrack] = useState<"waves" | "party" | "none">("none");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat wall to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Synchronize audio engine state changes
  useEffect(() => {
    const audio = getAudioEngine();
    if (soundEnabled) {
      audio.setMasterVolume(audioVolume);
      if (bgmTrack === "waves") {
        audio.stopMusic();
        audio.startWaves();
      } else if (bgmTrack === "party") {
        audio.stopWaves();
        audio.startMusic();
      } else {
        audio.stopWaves();
        audio.stopMusic();
      }
    } else {
      audio.stopWaves();
      audio.stopMusic();
    }
  }, [soundEnabled, bgmTrack, audioVolume]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendChatMessage(inputVal.trim());
    setInputVal("");
  };

  const handleToggleSound = () => {
    if (!soundEnabled) {
      // First activation requires user gesture
      setSoundEnabled(true);
      setBgmTrack("waves"); // Default to peaceful ocean waves
    } else {
      setSoundEnabled(false);
      setBgmTrack("none");
    }
  };

  const activeCount = players.length + 1; // Remote players + Local player

  // Compile a full list of graduates online for the Wall of Honor
  const graduatesList = [
    ...(localPlayer
      ? [
          {
            id: "local",
            name: `${localPlayer.name} (أنت)`,
            examType: localPlayer.examType,
            grade: localPlayer.grade,
            avatarColor: localPlayer.avatarColor,
            isLocal: true,
          },
        ]
      : []),
    ...players.map((p) => ({
      id: p.id,
      name: p.name,
      examType: p.examType,
      grade: p.grade,
      avatarColor: p.avatarColor,
      isLocal: false,
    })),
  ];

  // Sorting and grading formatting
  const gradeArabic = {
    EXCELLENT: "امتياز (ممتاز)",
    VERY_GOOD: "جيد جداً",
    GOOD: "جيد",
    PASSABLE: "مقبول",
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 select-none font-sans" dir="rtl">
      {/* Top HUD Row */}
      <div className="w-full flex justify-between items-start pointer-events-auto gap-4">
        {/* Right Side: Server Status & Count */}
        <div className="flex flex-col gap-2">
          <div className="glass-morphism px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-red-500"}`} />
            <span className="text-white text-xs font-semibold">
              {isConnected ? "متصل بحفلة الشاطئ الافتراضية" : "جاري الاتصال بالخادم..."}
            </span>
          </div>

          <div className="glass-morphism px-4 py-2 rounded-full flex items-center gap-2 shadow-lg w-fit">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-white text-xs font-bold">
              الخريجون المتصلون الآن: {activeCount}
            </span>
          </div>
        </div>

        {/* Center: Celebration Title banner */}
        <div className="hidden md:flex glass-morphism px-6 py-2 rounded-full items-center gap-2 shadow-xl border-purple-500/20">
          <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-pulse">
            🎓 احتفالية خريجي الجزائر 2026 🎉
          </span>
        </div>

        {/* Left Side: Buttons Panel (Leaderboard, View, Audio, Exit) */}
        <div className="flex items-center gap-2">
          {/* Instructions Guide */}
          <div className="hidden lg:flex glass-morphism px-4 py-2 rounded-full items-center gap-2 shadow-lg text-slate-300 text-xs font-medium">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>انقر على الشاشة للتوجيه. تحرك بـ WASD.</span>
          </div>

          {/* Leaderboard Button */}
          <button
            onClick={() => setShowLeaderboard(true)}
            className="glass-morphism px-4 py-2 rounded-full text-amber-400 hover:text-white hover:bg-amber-500/20 active:scale-95 transition-all shadow-lg flex items-center gap-1.5 text-xs font-bold"
            title="لوحة الشرف"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>لوحة الشرف 🏆</span>
          </button>

          {/* Camera View Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === "first-person" ? "orbit" : "first-person")}
            className="glass-morphism p-2.5 rounded-full text-blue-400 hover:text-white hover:bg-blue-500/20 active:scale-95 transition-all shadow-lg flex items-center justify-center"
            title={viewMode === "first-person" ? "تغيير إلى كاميرا طائرة (منظور ثالث)" : "تغيير إلى منظور شخص أول"}
          >
            {viewMode === "first-person" ? <Camera className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Synthesized Audio Control Panel */}
          <div className="glass-morphism px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <button
              onClick={handleToggleSound}
              className="text-emerald-400 hover:text-white transition-colors flex items-center justify-center"
              title="كتم/تفعيل الأصوات"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {soundEnabled && (
              <div className="flex items-center gap-2">
                {/* Select procedurally synthesized audio track */}
                <select
                  value={bgmTrack}
                  onChange={(e) => setBgmTrack(e.target.value as any)}
                  className="bg-transparent border-0 text-[10px] text-slate-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="waves" className="bg-slate-950 text-white">أمواج البحر 🌊</option>
                  <option value="party" className="bg-slate-950 text-white">إيقاع الحفل 🎵</option>
                  <option value="none" className="bg-slate-950 text-white">صامت</option>
                </select>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="w-12 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  title="مستوى الصوت"
                />
              </div>
            )}
          </div>

          {/* Exit Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="glass-morphism p-2.5 rounded-full text-red-400 hover:text-white hover:bg-red-600/20 active:scale-95 transition-all shadow-lg flex items-center justify-center"
            title="مغادرة الحفلة"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle/Bottom Layout */}
      <div className="w-full flex justify-between items-end gap-6 mt-auto">
        {/* Right Bottom corner: Chat Wall */}
        <div className="glass-morphism-dark rounded-2xl w-80 max-h-[380px] shadow-2xl pointer-events-auto flex flex-col overflow-hidden border border-white/10" dir="ltr">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-white/2 flex items-center justify-between">
            <span className="text-xs font-bold text-white">دردشة الخريجين المباشرة</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Live</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[220px] no-scrollbar">
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
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-0.5"
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-[8px] text-slate-500 mr-auto">{msg.timestamp}</span>
                      {msg.examType && (
                        <span className="text-[8px] font-bold px-1 bg-white/5 border border-white/10 text-slate-400 rounded">
                          {msg.examType}
                        </span>
                      )}
                      <span className="text-[10px] font-extrabold text-purple-400">{msg.name}</span>
                    </div>
                    <p className="text-xs text-slate-200 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 break-words text-right">
                      {msg.text}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSendChat} className="p-3 bg-black/40 border-t border-white/5 flex gap-2" dir="rtl">
            <input
              type="text"
              placeholder="اكتب رسالة..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 text-right"
              maxLength={120}
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all text-white shadow-lg flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>
        </div>

        {/* Center Bottom: VFX Action Controls & Emote Panel */}
        <div className="flex flex-col gap-3 items-center pointer-events-auto max-w-lg">
          {/* Emote Panel */}
          <div className="glass-morphism p-2 rounded-2xl flex items-center gap-2 shadow-xl border-white/10">
            <span className="text-[10px] font-bold text-slate-400 px-2 select-none">تعبيرات:</span>
            {EMOTE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => triggerEmote(opt.type)}
                className="p-2 bg-white/5 hover:bg-white/10 hover:scale-110 active:scale-95 text-sm rounded-xl transition-all"
                title={opt.label}
              >
                {opt.label.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* VFX Buttons */}
          <div className="glass-morphism p-3 rounded-2xl flex items-center gap-3 shadow-2xl border-white/10">
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
        </div>

        {/* Left Bottom corner: Spatial Voice Chat Details */}
        <div className="glass-morphism p-4 rounded-2xl w-64 shadow-xl pointer-events-auto flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              غرفة الصوت المجالي
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              نشط
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed text-right">
            يتحكم القرب المكاني في مستوى الصوت. اقترب من الخريجين الآخرين للدردشة معهم صوتياً!
          </p>
        </div>
      </div>

      {/* Leaderboard Modal Backdrop */}
      <AnimatePresence>
        {showLeaderboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg glass-morphism-dark rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"
            >
              {/* Leaderboard Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
                    لوحة شرف الخريجين المتصلين
                  </h2>
                </div>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
                >
                  إغلاق
                </button>
              </div>

              {/* Leaderboard Body */}
              <div className="p-6 max-h-[380px] overflow-y-auto space-y-3 no-scrollbar">
                {graduatesList.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-8">لا يوجد خريجون متصلون حالياً.</p>
                ) : (
                  graduatesList.map((grad, idx) => (
                    <div
                      key={grad.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        grad.isLocal
                          ? "bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                          : "bg-white/2 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 min-w-[20px]">{idx + 1}.</span>
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: grad.avatarColor }}
                        />
                        <span className="text-white text-xs font-bold">{grad.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full">
                          {grad.examType === "BAC" ? "بكالوريا 2026" : "بيام 2026"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            grad.grade === "EXCELLENT"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              : grad.grade === "VERY_GOOD"
                              ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                              : grad.grade === "GOOD"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                              : "bg-slate-500/10 border-slate-500/30 text-slate-300"
                          }`}
                        >
                          {gradeArabic[grad.grade as keyof typeof gradeArabic] || grad.grade}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
