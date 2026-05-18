import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker({ teams }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const content = sorted.map((t) => `${t.name} (${t.score})`).join("  ·  ");
  return (
    <div className="ticker-wrap h-10 bg-black/60 border-t border-white/10 flex items-center shrink-0">
      <div className="ticker-inner text-sm font-semibold tracking-wide" style={{ color: "#f5c518" }}>
        {content}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{content}
      </div>
    </div>
  );
}

// ─── Active team info panel ───────────────────────────────────────────────────
function ActiveTeamPanel({ team, hint, timerValue, timerActive }) {
  if (!team) return null;

  const penalties   = team.penalties || 0;
  const usedHints   = team.usedHints || [];
  const phoneUsed   = usedHints.includes("phone");
  const teamUsed    = usedHints.includes("team");

  const timerColor  = timerValue > 30 ? "#4ade80" : timerValue > 10 ? "#facc15" : "#f87171";
  const hintLabel   = hint === "phone" ? "📞 Звонок другу" : hint === "team" ? "👥 Помощь команды" : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-6 mt-3 rounded-2xl overflow-hidden shrink-0"
      style={{ background: "rgba(10,20,40,0.85)", border: "1px solid rgba(126,200,227,0.2)" }}
    >
      <div className="flex items-stretch">

        {/* Team name + score */}
        <div className="flex flex-col justify-center px-5 py-3 border-r border-white/10 min-w-[180px]">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Отвечает</p>
          <p className="text-white font-bold text-lg leading-tight truncate">{team.name}</p>
          <p className="text-yellow-400 font-black text-2xl mt-0.5">{team.score} <span className="text-sm font-normal text-gray-500">очков</span></p>
        </div>

        {/* Hints */}
        <div className="flex flex-col justify-center px-5 py-3 border-r border-white/10 gap-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Подсказки</p>
          <div className="flex gap-3">
            {/* Phone */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold
              ${phoneUsed
                ? "bg-gray-800/60 text-gray-600"
                : hint === "phone"
                ? "bg-yellow-700/80 text-yellow-200 ring-1 ring-yellow-400"
                : "bg-indigo-900/60 text-indigo-300"}`}
            >
              <span>📞</span>
              <span>{phoneUsed ? "Использована" : "Звонок другу"}</span>
              {phoneUsed && <span className="text-gray-600">✓</span>}
            </div>

            {/* Team help */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold
              ${teamUsed
                ? "bg-gray-800/60 text-gray-600"
                : hint === "team"
                ? "bg-yellow-700/80 text-yellow-200 ring-1 ring-yellow-400"
                : "bg-indigo-900/60 text-indigo-300"}`}
            >
              <span>👥</span>
              <span>{teamUsed ? "Использована" : "Помощь команды"}</span>
              {teamUsed && <span className="text-gray-600">✓</span>}
            </div>
          </div>
        </div>

        {/* Penalties */}
        <div className="flex flex-col justify-center px-5 py-3 border-r border-white/10 min-w-[120px]">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Замечания</p>
          <div className="flex gap-2 items-center">
            {[0, 1].map((i) => (
              <div key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all
                  ${i < penalties
                    ? penalties >= 2
                      ? "bg-red-700 text-white ring-1 ring-red-400"
                      : "bg-orange-700 text-white"
                    : "bg-gray-800 text-gray-700 border border-gray-700"}`}
              >
                {i < penalties ? "⚠" : i + 1}
              </div>
            ))}
            {penalties >= 2 && (
              <span className="text-red-400 text-xs font-bold ml-1">Лимит!</span>
            )}
          </div>
        </div>

        {/* Timer (only when hint active) */}
        <AnimatePresence>
          {hint && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-col justify-center px-5 py-3 overflow-hidden"
            >
              <p className="text-xs uppercase tracking-widest mb-0.5 whitespace-nowrap"
                style={{ color: timerColor }}>
                {hintLabel}
              </p>
              <p className="font-black tabular-nums text-3xl"
                style={{ color: timerColor, textShadow: `0 0 16px ${timerColor}88` }}>
                {String(Math.floor(timerValue / 60)).padStart(2, "0")}:{String(timerValue % 60).padStart(2, "0")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Hint banner (full-width, above question) ─────────────────────────────────
function HintBanner({ hint, timerValue, timerActive }) {
  if (!hint) return null;
  const hintLabel  = hint === "phone" ? "📞 ЗВОНОК ДРУГУ" : "👥 ПОМОЩЬ КОМАНДЫ";
  const timerColor = timerValue > 30 ? "#4ade80" : timerValue > 10 ? "#facc15" : "#f87171";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-6 mt-3 rounded-2xl px-6 py-3 flex items-center justify-between shrink-0"
      style={{ background: "rgba(80,40,0,0.95)", border: "2px solid #f5c518" }}
    >
      <div>
        <p className="text-yellow-300 text-xs uppercase tracking-widest font-bold">⚠ ВНИМАНИЕ — ТИШИНА!</p>
        <p className="text-white font-black text-xl uppercase tracking-wide">АКТИВНА ПОДСКАЗКА: {hintLabel}</p>
      </div>
      <p className="font-black tabular-nums text-5xl ml-6"
        style={{ color: timerColor, textShadow: `0 0 20px ${timerColor}88` }}>
        {String(Math.floor(timerValue / 60)).padStart(2, "0")}:{String(timerValue % 60).padStart(2, "0")}
      </p>
    </motion.div>
  );
}

// ─── Scoreboard top bar ───────────────────────────────────────────────────────
function ScoreBar({ teams, activeTeamId }) {
  const sorted    = [...teams].sort((a, b) => b.score - a.score);
  const topColors = ["#f5c518", "#c0c0c0", "#cd7f32"];

  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-black/40 border-b border-white/5 flex-wrap shrink-0">
      <span className="text-xs font-bold uppercase tracking-widest mr-1" style={{ color: "#f5c518" }}>
        Знатоки
      </span>
      {sorted.map((team, i) => (
        <div key={team.id}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all
            ${team.id === activeTeamId
              ? "bg-blue-900/70 ring-1 ring-blue-400"
              : i < 3 ? "bg-white/10" : "bg-white/5"}`}
        >
          <span className="text-xs font-bold" style={{ color: topColors[i] || "#6b7280" }}>#{i + 1}</span>
          <span className="text-sm text-gray-300 font-medium">{team.name}</span>
          <span className="font-black text-base ml-1" style={{ color: topColors[i] || "#9ca3af" }}>{team.score}</span>
          {(team.penalties || 0) >= 2 && <span className="text-red-400 text-xs">⚠⚠</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Bubbles (category selection screen) ─────────────────────────────────────
function BubblesScreen({ categories, selectedCategoryId }) {
  const colors = [
    "#1a3a5c", "#2d1b5c", "#1a4a2e", "#5c1a1a",
    "#1a4a4a", "#4a3a1a", "#3a1a4a", "#1a3a3a",
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
      <p className="text-gray-500 text-sm uppercase tracking-widest mb-8 animate-pulse">
        Выберите категорию
      </p>
      <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
        <AnimatePresence>
          {categories.map((cat, i) => {
            const isSelected = cat.id === selectedCategoryId;
            const total      = cat.questions.length;
            const opened     = cat.questions.filter((q) => q.isOpened).length;
            const allDone    = opened === total;

            if (selectedCategoryId && !isSelected) return null;

            return (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: allDone ? 0.25 : 1, scale: isSelected ? 1.18 : 1 }}
                exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.3 } }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="flex items-center justify-center rounded-full select-none"
                style={{
                  width: 160, height: 160,
                  background: `radial-gradient(circle at 35% 35%, ${colors[i % colors.length]}cc, ${colors[i % colors.length]}44)`,
                  border: `2px solid ${colors[i % colors.length]}88`,
                  boxShadow: isSelected
                    ? `0 0 50px ${colors[i % colors.length]}99`
                    : "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                <div className="text-center px-4">
                  <p className="text-white font-bold text-lg leading-tight">{cat.title}</p>
                  <p className="text-white/40 text-xs mt-1">{opened}/{total}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Question numbers screen ──────────────────────────────────────────────────
function QuestionNumbersScreen({ category, selectedQuestionId }) {
  const available = category.questions.filter((q) => !q.isOpened);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Категория</p>
        <p className="font-black uppercase tracking-wide"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            color: "#f5c518",
            textShadow: "0 0 30px rgba(245,197,24,0.4)",
            fontFamily: "Oswald, sans-serif",
          }}>
          {category.title}
        </p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-5">
        <AnimatePresence>
          {available.map((q, i) => {
            const isActive = q.id === selectedQuestionId;
            return (
              <motion.div key={q.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: isActive ? 1.2 : 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                className="flex items-center justify-center rounded-2xl select-none"
                style={{
                  width: 100, height: 100,
                  background: isActive
                    ? "linear-gradient(135deg, #1a4a8c, #0d2a5c)"
                    : "linear-gradient(135deg, #1a2a3a, #0d1b2a)",
                  border: isActive ? "2px solid #7ec8e3" : "2px solid #1a3a5c",
                  boxShadow: isActive ? "0 0 30px rgba(126,200,227,0.4)" : "none",
                }}
              >
                <span className="font-black text-4xl"
                  style={{ color: isActive ? "#7ec8e3" : "#4a6a8a" }}>
                  {i + 1}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Active question screen ───────────────────────────────────────────────────
function ActiveQuestionScreen({ question, captains }) {
  const { showAnswer } = captains;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-10 py-6">
      <div className="w-full max-w-5xl text-center space-y-7 select-none">
        <p className="font-bold leading-snug"
          style={{
            color: "#ffffff",
            fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)",
            textShadow: "0 2px 20px rgba(255,255,255,0.08)",
          }}>
          {question.textRu}
        </p>
        <p className="italic leading-snug"
          style={{
            color: "#7ec8e3",
            fontSize: "clamp(1.2rem, 2.5vw, 2rem)",
            textShadow: "0 2px 16px rgba(126,200,227,0.12)",
          }}>
          {question.textUa}
        </p>

        <AnimatePresence>
          {showAnswer && (
            <motion.div key="answer"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.55, ease: "easeOut" }}
              className="border-t border-white/10 pt-6"
            >
              <p className="font-black uppercase tracking-wide"
                style={{
                  color: "#f5c518",
                  fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                  textShadow: "0 0 30px rgba(245,197,24,0.35)",
                }}>
                {question.answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Waiting screen ───────────────────────────────────────────────────────────
function WaitingScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center select-none">
      <div className="font-black uppercase tracking-[0.2em] text-center"
        style={{
          fontSize: "clamp(2rem, 5vw, 4rem)",
          fontFamily: "Oswald, sans-serif",
          color: "#f5c518",
          textShadow: "0 0 40px rgba(245,197,24,0.4)",
        }}>
        КОНКУРС ЗНАТОКОВ
      </div>
      <p className="mt-4 text-gray-500 tracking-widest text-sm uppercase animate-pulse">
        Ожидание начала…
      </p>
    </div>
  );
}

// ─── Root CaptainsPlayer ──────────────────────────────────────────────────────
export default function CaptainsPlayer({ gameState }) {
  const { captains, teams } = gameState;
  const {
    categories, selectedCategoryId, selectedQuestionId,
    activeTeamId, hint, timerValue, timerActive,
  } = captains;

  const activeTeam       = teams.find((t) => t.id === activeTeamId) || null;
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedQuestion = selectedCategory?.questions.find((q) => q.id === selectedQuestionId);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #080d1a 0%, #0d1b2a 60%, #0a1628 100%)" }}>

      {/* Top scoreboard */}
      <ScoreBar teams={teams} activeTeamId={activeTeamId} />

      {/* Active team panel — shown whenever a team is selected */}
      <AnimatePresence>
        {activeTeam && (
          <ActiveTeamPanel
            key="team-panel"
            team={activeTeam}
            hint={hint}
            timerValue={timerValue}
            timerActive={timerActive}
          />
        )}
      </AnimatePresence>

      {/* Hint banner — shown ONLY when hint is active (above question) */}
      <AnimatePresence>
        {hint && selectedQuestion && (
          <HintBanner
            key="hint-banner"
            hint={hint}
            timerValue={timerValue}
            timerActive={timerActive}
          />
        )}
      </AnimatePresence>

      {/* Main content area */}
      <AnimatePresence mode="wait">
        {!categories.length ? (
          <WaitingScreen key="waiting" />
        ) : selectedQuestion ? (
          <motion.div key="active-q" className="flex-1 flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ActiveQuestionScreen question={selectedQuestion} captains={captains} />
          </motion.div>
        ) : selectedCategoryId && selectedCategory ? (
          <motion.div key="q-numbers" className="flex-1 flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuestionNumbersScreen
              category={selectedCategory}
              selectedQuestionId={selectedQuestionId}
            />
          </motion.div>
        ) : (
          <motion.div key="bubbles" className="flex-1 flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BubblesScreen categories={categories} selectedCategoryId={selectedCategoryId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom ticker */}
      {teams.length > 0 && <Ticker teams={teams} />}
    </div>
  );
}
