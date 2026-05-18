import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import { useAudio } from "../hooks/useAudio";
import CaptainsPlayer from "./CaptainsPlayer";

// ─── Blitz: Ticker ────────────────────────────────────────────────────────────
function Ticker({ teams }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const content = sorted.map((t) => `${t.name} (${t.score})`).join("  ·  ");
  return (
    <div className="ticker-wrap h-10 bg-black/60 border-t border-white/10 flex items-center">
      <div className="ticker-inner text-sm font-semibold tracking-wide" style={{ color: "#f5c518" }}>
        {content}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{content}
      </div>
    </div>
  );
}

// ─── Blitz: Overlays ──────────────────────────────────────────────────────────
function RemovedOverlay() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-40 overlay-pulse"
      style={{ background: "rgba(140,0,0,0.82)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center select-none">
        <p className="font-black uppercase tracking-[0.15em] drop-shadow-2xl"
          style={{ fontSize: "clamp(3rem, 8vw, 7rem)", color: "#fff", fontFamily: "Oswald, sans-serif" }}>
          ВОПРОС СНЯТ
        </p>
        <p className="text-red-300 text-xl mt-2 tracking-widest">ПИТАННЯ ЗНЯТО</p>
      </div>
    </motion.div>
  );
}

function WaitingScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center select-none">
      <div className="font-black uppercase tracking-[0.2em] text-center"
        style={{
          fontSize: "clamp(2.5rem, 6vw, 5rem)",
          fontFamily: "Oswald, sans-serif",
          color: "#f5c518",
          textShadow: "0 0 40px rgba(245,197,24,0.4)",
        }}>
        BRAIN-RING
      </div>
      <p className="mt-4 text-gray-500 tracking-widest text-sm uppercase animate-pulse">
        Ожидание вопроса…
      </p>
    </div>
  );
}

// ─── Blitz Player ─────────────────────────────────────────────────────────────
function BlitzPlayer({ gameState }) {
  const { questions, currentIndex, showAnswer, blitzAttempts, teams } = gameState;
  const q           = questions[currentIndex] || null;
  const bothFailed  = blitzAttempts.attempt1 && blitzAttempts.attempt2;
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #080d1a 0%, #0d1b2a 60%, #0a1628 100%)" }}>

      {/* Scoreboard */}
      <div className="flex items-center gap-3 px-6 py-3 bg-black/40 border-b border-white/5 flex-wrap">
        {sortedTeams.map((team, i) => {
          const topColors = ["#f5c518", "#c0c0c0", "#cd7f32"];
          return (
            <div key={team.id}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${i < 3 ? "bg-white/10" : "bg-white/5"}`}>
              <span className="text-xs font-bold" style={{ color: topColors[i] || "#6b7280" }}>#{i + 1}</span>
              <span className="text-sm text-gray-300 font-medium">{team.name}</span>
              <span className="font-black text-base ml-1" style={{ color: topColors[i] || "#9ca3af" }}>
                {team.score}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-8 relative">
        <AnimatePresence>
          {bothFailed && <RemovedOverlay />}
        </AnimatePresence>

        {!q ? <WaitingScreen /> : (
          <div className="w-full max-w-5xl space-y-8 text-center select-none">
            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-600 text-lg font-semibold">Вопрос {currentIndex + 1}</span>
              {q.type === "blitz" && (
                <span className="px-3 py-1 rounded-full text-sm font-bold uppercase tracking-widest"
                  style={{ background: "#7c2d00", color: "#fdba74" }}>⚡ Блиц</span>
              )}
            </div>
            <p className="font-bold leading-snug"
              style={{ color: "#ffffff", fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)", textShadow: "0 2px 20px rgba(255,255,255,0.08)" }}>
              {q.textRu}
            </p>
            <p className="italic leading-snug"
              style={{ color: "#7ec8e3", fontSize: "clamp(1.2rem, 2.5vw, 2rem)", textShadow: "0 2px 16px rgba(126,200,227,0.12)" }}>
              {q.textUa}
            </p>
            <AnimatePresence>
              {showAnswer && (
                <motion.div key="answer"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.55, ease: "easeOut" }}
                  className="border-t border-white/10 pt-6">
                  <p className="font-black uppercase tracking-wide"
                    style={{ color: "#f5c518", fontSize: "clamp(1.5rem, 3vw, 2.5rem)", textShadow: "0 0 30px rgba(245,197,24,0.35)" }}>
                    {q.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {teams.length > 0 && <Ticker teams={teams} />}
    </div>
  );
}

// ─── PlayerView (root) ────────────────────────────────────────────────────────
export default function PlayerView() {
  const { gameState, soundEnabled } = useSocket();
  const { playSuccess } = useAudio();
  const prevTsRef = useRef(null);
  const [scorePopId, setScorePopId] = useState(null);

  useEffect(() => {
    if (!gameState?.lastScoreChange) return;
    const { teamId, delta, ts } = gameState.lastScoreChange;
    if (delta > 0 && ts !== prevTsRef.current) {
      prevTsRef.current = ts;
      playSuccess(soundEnabled);
      setScorePopId(teamId);
      setTimeout(() => setScorePopId(null), 400);
    }
  }, [gameState?.lastScoreChange, playSuccess, soundEnabled]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080d1a" }}>
        <span className="text-gray-500 text-lg animate-pulse">Подключение…</span>
      </div>
    );
  }

  // Switch view by mode
  if (gameState.mode === "captains") {
    return <CaptainsPlayer gameState={gameState} />;
  }

  return <BlitzPlayer gameState={gameState} />;
}
