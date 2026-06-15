// /home/moumene/bem/frontend/app/page.tsx
"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Sparkles, GraduationCap } from "lucide-react";

// Curated selection of neon graduation theme colors
const AVATAR_COLORS = [
  { name: "Electric Purple", hex: "#a855f7" },
  { name: "Cyber Blue", hex: "#3b82f6" },
  { name: "Hot Pink", hex: "#ec4899" },
  { name: "Neon Cyan", hex: "#06b6d4" },
  { name: "Algerian Green", hex: "#10b981" },
  { name: "Sunset Orange", hex: "#f97316" },
];

export default function EntrancePage() {
  const [name, setName] = useState("");
  const [examType, setExamType] = useState<"BEM" | "BAC">("BAC");
  const [grade, setGrade] = useState<"EXCELLENT" | "VERY_GOOD" | "GOOD" | "PASSABLE">("EXCELLENT");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].hex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("الرجاء إدخال الاسم الكامل لولوج الحفلة!");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        name: name.trim(),
        examType,
        grade,
        avatarColor: selectedColor,
        callbackUrl: "/party",
        redirect: true,
      });
      if (res?.error) {
        setError("فشل تسجيل الدخول. يرجى المحاولة مجدداً.");
        setLoading(false);
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع. يرجى التحقق من الخادم.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Decorative background blur blobs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg glass-morphism-dark rounded-3xl p-8 shadow-2xl relative border border-white/10"
      >
        {/* Glow Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            EpicGrad 2026
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            حفلة التخرج الافتراضية ثلاثية الأبعاد لطلاب البكالوريا والبيام
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          {/* Full Name */}
          <div className="flex flex-col">
            <label className="text-slate-300 text-sm font-semibold mb-2 text-right">الاسم الكامل</label>
            <input
              type="text"
              placeholder="أدخل اسمك هنا..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 rounded-xl glass-input text-right"
              maxLength={25}
              disabled={loading}
            />
          </div>

          {/* Exam Type Selector (BEM/BAC) */}
          <div className="flex flex-col">
            <label className="text-slate-300 text-sm font-semibold mb-2 text-right">الشهادة المحصل عليها</label>
            <div className="grid grid-cols-2 gap-4">
              {(["BEM", "BAC"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setExamType(type)}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                    examType === type
                      ? "bg-purple-600/20 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                      : "border-white/5 bg-white/2 text-slate-400 hover:bg-white/5"
                  }`}
                  disabled={loading}
                >
                  {type === "BAC" ? "بكالوريا 2026" : "بيام 2026"}
                </button>
              ))}
            </div>
          </div>

          {/* Grade Selector */}
          <div className="flex flex-col">
            <label className="text-slate-300 text-sm font-semibold mb-2 text-right">التقدير</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as any)}
              className="px-4 py-3 rounded-xl glass-input text-right appearance-none cursor-pointer"
              disabled={loading}
            >
              <option value="EXCELLENT" className="bg-slate-900 text-white">ممتاز (امتياز)</option>
              <option value="VERY_GOOD" className="bg-slate-900 text-white">جيد جداً</option>
              <option value="GOOD" className="bg-slate-900 text-white">جيد</option>
              <option value="PASSABLE" className="bg-slate-900 text-white">مقبول</option>
            </select>
          </div>

          {/* Color Selector */}
          <div className="flex flex-col">
            <label className="text-slate-300 text-sm font-semibold mb-2 text-right">اختر لون صورتك الرمزية (الـ Avatar)</label>
            <div className="flex justify-between items-center px-2 py-1">
              {AVATAR_COLORS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => setSelectedColor(col.hex)}
                  className="w-10 h-10 rounded-full transition-transform active:scale-95"
                  style={{
                    backgroundColor: col.hex,
                    border: selectedColor === col.hex ? "3px solid white" : "2px solid rgba(255,255,255,0.1)",
                    boxShadow: selectedColor === col.hex ? `0 0 15px ${col.hex}` : "none",
                  }}
                  title={col.name}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs font-semibold text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-extrabold text-md shadow-xl flex items-center justify-center gap-2 active:scale-99 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                ...جارِ الدخول إلى الشاطئ
              </span>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                دخول الحفلة الافتراضية
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
