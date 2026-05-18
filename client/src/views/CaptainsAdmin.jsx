import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";

// ─── Sample JSON helper ───────────────────────────────────────────────────────
const SAMPLE_JSON = JSON.stringify([
  {
    "id": 1,
    "title": "История",
    "questions": [
      { "id": 101, "textRu": "Вопрос по истории 1", "textUa": "Питання з історії 1", "answer": "Ответ 1", "answerSynodal": "", "answerOgienko": "", "isOpened": false },
      { "id": 102, "textRu": "Вопрос по истории 2", "textUa": "Питання з історії 2", "answer": "Ответ 2", "answerSynodal": "", "answerOgienko": "", "isOpened": false }
    ]
  },
  {
    "id": 2,
    "title": "Наука",
    "questions": [
      { "id": 201, "textRu": "Вопрос по науке 1", "textUa": "Питання з науки 1", "answer": "Ответ 1", "answerSynodal": "", "answerOgienko": "", "isOpened": false }
    ]
  }
], null, 2);

// ─── Hint button ──────────────────────────────────────────────────────────────
function HintButton({ label, icon, hintKey, activeTeam, hint, onActivate, onCancel }) {
  const used = activeTeam?.usedHints?.includes(hintKey);
  const active = hint === hintKey;

  if (active) {
    return (
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-yellow-700 hover:bg-yellow-600 text-white ring-2 ring-yellow-400 transition-all"
      >
        ⏹ Остановить таймер
      </button>
    );
  }
  return (
    <button
      onClick={() => !used && onActivate(hintKey)}
      disabled={used || !!hint}
      className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all
        ${used
          ? "bg-gray-800 text-gray-600 line-through cursor-not-allowed"
          : hint
          ? "bg-gray-800 text-gray-500 cursor-not-allowed"
          : "bg-indigo-800 hover:bg-indigo-700 text-white"}`}
    >
      {icon} {label}
      {used && <span className="ml-1 text-xs">(использована)</span>}
    </button>
  );
}

// ─── Team selector ────────────────────────────────────────────────────────────
function TeamSelector({ teams, activeTeamId, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {teams.map((team) => {
        const active = team.id === activeTeamId;
        return (
          <button
            key={team.id}
            onClick={() => onSelect(team.id)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all
              ${active
                ? "bg-blue-700 text-white ring-2 ring-blue-400"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
          >
            <div className="truncate">{team.name}</div>
            <div className="flex gap-2 mt-0.5 text-xs">
              <span style={{ color: "#f5c518" }}>★ {team.score}</span>
              {(team.penalties || 0) > 0 && (
                <span className="text-red-400">⚠ {team.penalties}</span>
              )}
              {team.usedHints?.includes("phone") && <span className="text-gray-500">📞✓</span>}
              {team.usedHints?.includes("team")  && <span className="text-gray-500">👥✓</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Category grid ────────────────────────────────────────────────────────────
function CategoryGrid({ categories, onSelect }) {
  if (!categories.length) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p className="text-4xl mb-3">📭</p>
        <p>Загрузите JSON с категориями</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((cat) => {
        const total = cat.questions.length;
        const opened = cat.questions.filter((q) => q.isOpened).length;
        const allDone = opened === total;
        return (
          <button
            key={cat.id}
            onClick={() => !allDone && onSelect(cat.id)}
            disabled={allDone}
            className={`p-4 rounded-2xl border text-left transition-all
              ${allDone
                ? "bg-gray-900 border-gray-800 opacity-40 cursor-not-allowed"
                : "bg-gray-900 border-gray-700 hover:border-blue-500 hover:bg-gray-800"}`}
          >
            <div className="font-semibold text-white truncate">{cat.title}</div>
            <div className="text-xs text-gray-400 mt-1">
              {opened}/{total} вопросов использовано
            </div>
            <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${total ? (opened / total) * 100 : 0}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Question picker ──────────────────────────────────────────────────────────
function QuestionPicker({ category, onSelect, onBack }) {
  const available = category.questions.filter((q) => !q.isOpened);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors"
        >
          ← Назад
        </button>
        <h3 className="font-semibold text-white">{category.title}</h3>
      </div>
      {available.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">Все вопросы использованы</p>
      ) : (
        <div className="space-y-2">
          {available.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelect(q.id)}
              className="w-full text-left p-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl text-sm text-gray-300 transition-all"
            >
              <div className="font-medium text-white">Вопрос #{q.id}</div>
              <div className="text-gray-400 truncate mt-0.5">{q.textRu}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Active question panel ────────────────────────────────────────────────────
function ActiveQuestion({ question, category, captains, teams, emit }) {
  const activeTeam = teams.find((t) => t.id === captains.activeTeamId);
  const { showAnswer, hint, timerActive, timerValue } = captains;

  const timerColor = timerValue > 30
    ? "text-green-400"
    : timerValue > 10
    ? "text-yellow-400"
    : "text-red-400 animate-pulse";

  return (
    <div className="space-y-3">
      {/* Question preview */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            {category?.title} · Вопрос #{question.id}
          </span>
          {timerActive && (
            <span className={`text-2xl font-black tabular-nums ${timerColor}`}>
              {String(Math.floor(timerValue / 60)).padStart(2, "0")}:{String(timerValue % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        <p className="text-white font-semibold leading-relaxed">{question.textRu}</p>
        <p className="text-blue-300 italic text-sm">{question.textUa}</p>
        <div className="border-t border-gray-700 pt-2 space-y-1">
          <p className="text-yellow-400 font-bold">✅ {question.answer}</p>
          {question.answerSynodal && <p className="text-gray-400 text-xs">📖 {question.answerSynodal}</p>}
          {question.answerOgienko  && <p className="text-gray-400 text-xs">📗 {question.answerOgienko}</p>}
        </div>
      </div>

      {/* Active team + show answer */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => emit("captains:show-answer", !showAnswer)}
          className={`py-2.5 rounded-xl font-semibold text-sm transition-all
            ${showAnswer
              ? "bg-yellow-600 hover:bg-yellow-500 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
        >
          {showAnswer ? "🙈 Скрыть ответ" : "👁 Показать ответ"}
        </button>
        <button
          onClick={() => emit("captains:finish-turn")}
          className="py-2.5 rounded-xl font-semibold text-sm bg-green-800 hover:bg-green-700 text-white transition-all"
        >
          ✅ Завершить ход
        </button>
      </div>

      {/* Hints */}
      {activeTeam && (
        <div className="bg-gray-900 border border-indigo-900 rounded-2xl p-3 space-y-2">
          <p className="text-xs text-indigo-400 uppercase tracking-widest font-semibold">
            Подсказки — {activeTeam.name}
          </p>
          <div className="flex gap-2">
            <HintButton
              label="Звонок другу"
              icon="📞"
              hintKey="phone"
              activeTeam={activeTeam}
              hint={hint}
              onActivate={(h) => emit("captains:hint", h)}
              onCancel={() => emit("captains:hint", null)}
            />
            <HintButton
              label="Помощь команды"
              icon="👥"
              hintKey="team"
              activeTeam={activeTeam}
              hint={hint}
              onActivate={(h) => emit("captains:hint", h)}
              onCancel={() => emit("captains:hint", null)}
            />
          </div>
        </div>
      )}

      {/* Penalty + score for active team */}
      {activeTeam && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Управление — {activeTeam.name}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => emit("team:score:delta", { teamId: activeTeam.id, delta: 1 })}
              className="flex-1 py-2 rounded-xl bg-green-900 hover:bg-green-800 text-green-300 font-bold text-sm transition-colors"
            >
              +1 балл
            </button>
            <button
              onClick={() => emit("team:score:delta", { teamId: activeTeam.id, delta: -1 })}
              className="flex-1 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-400 font-bold text-sm transition-colors"
            >
              −1 балл
            </button>
            <button
              onClick={() => {
                emit("team:penalty", activeTeam.id);
                const newCount = (activeTeam.penalties || 0) + 1;
                if (newCount >= 2) {
                  alert(`⚠ Внимание! Лимит предупреждений для «${activeTeam.name}» исчерпан!\nСнимите −1 балл.`);
                }
              }}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors
                ${(activeTeam.penalties || 0) >= 2
                  ? "bg-red-700 hover:bg-red-600 text-white ring-1 ring-red-400"
                  : "bg-orange-950 hover:bg-orange-900 text-orange-400"}`}
            >
              ⚠ Замечание ({activeTeam.penalties || 0})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main CaptainsAdmin ───────────────────────────────────────────────────────
export default function CaptainsAdmin() {
  const { gameState, emit } = useSocket();
  const fileRef = useRef(null);
  const [tab, setTab] = useState("game"); // "game" | "teams"

  const { captains, teams } = gameState;
  const { categories, selectedCategoryId, selectedQuestionId, activeTeamId } = captains;

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedQuestion = selectedCategory?.questions.find((q) => q.id === selectedQuestionId);

  const loadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (!Array.isArray(arr)) throw new Error("Ожидается массив категорий");
        emit("captains:load", arr);
        alert(`✅ Загружено ${arr.length} категорий`);
      } catch (err) {
        alert("❌ Ошибка JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_JSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "captains_sample.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => fileRef.current?.click()}
          className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm font-semibold transition-colors"
        >
          📂 JSON Знатоков
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={loadFile} />
        <button
          onClick={downloadSample}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
        >
          📄 Пример JSON
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {[
          { key: "game",  label: "🎯 Игра" },
          { key: "teams", label: "🏆 Команды" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg
              ${tab === key
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Game ── */}
      {tab === "game" && (
        <AnimatePresence mode="wait">
          {/* Step 3: Active question */}
          {selectedQuestion ? (
            <motion.div key="question"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveQuestion
                question={selectedQuestion}
                category={selectedCategory}
                captains={captains}
                teams={teams}
                emit={emit}
              />
            </motion.div>

          /* Step 2: Pick question from category */
          ) : selectedCategoryId ? (
            <motion.div key="questions"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-3">
                {/* Team selector */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Выберите команду</p>
                  <TeamSelector
                    teams={teams}
                    activeTeamId={activeTeamId}
                    onSelect={(id) => emit("captains:set-team", id)}
                  />
                </div>
                <QuestionPicker
                  category={selectedCategory}
                  onSelect={(qId) => emit("captains:select-question", qId)}
                  onBack={() => emit("captains:select-category", null)}
                />
              </div>
            </motion.div>

          /* Step 1: Pick category */
          ) : (
            <motion.div key="categories"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <CategoryGrid
                categories={categories}
                onSelect={(id) => emit("captains:select-category", id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── TAB: Teams ── */}
      {tab === "teams" && (
        <div className="space-y-2">
          {[...teams].sort((a, b) => b.score - a.score).map((team, rank) => {
            const rankColors = ["#f5c518", "#c0c0c0", "#cd7f32"];
            return (
              <div key={team.id}
                className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
                <span className="w-5 text-xs font-bold text-center" style={{ color: rankColors[rank] || "#6b7280" }}>
                  {rank + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-200 truncate">{team.name}</span>
                <span className="text-xs text-red-400 w-12 text-center">
                  {(team.penalties || 0) > 0 ? `⚠ ${team.penalties}` : ""}
                </span>
                <span className="text-xs text-gray-500 w-16 text-center">
                  {team.usedHints?.map(h => h === "phone" ? "📞" : "👥").join(" ") || "—"}
                </span>
                <span className="font-bold text-yellow-400 text-lg w-8 text-center">{team.score}</span>
                <button onClick={() => emit("team:score:delta", { teamId: team.id, delta: -1 })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-950 hover:bg-red-800 text-red-300 font-bold text-base transition-colors">−</button>
                <button onClick={() => emit("team:score:delta", { teamId: team.id, delta: 1 })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-950 hover:bg-green-700 text-green-300 font-bold text-base transition-colors">+</button>
                <button
                  onClick={() => {
                    emit("team:penalty", team.id);
                    const next = (team.penalties || 0) + 1;
                    if (next >= 2) alert(`⚠ Лимит предупреждений для «${team.name}» исчерпан! Снимите −1 балл.`);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors
                    ${(team.penalties || 0) >= 2
                      ? "bg-red-700 text-white ring-1 ring-red-400"
                      : "bg-gray-800 hover:bg-gray-700 text-orange-400"}`}
                >
                  ⚠{team.penalties || 0}
                </button>
                <button onClick={() => emit("team:penalty:reset", team.id)}
                  className="text-xs text-gray-600 hover:text-gray-400 px-1 transition-colors" title="Сбросить замечания">↺</button>
              </div>
            );
          })}
          <button
            onClick={() => { if (window.confirm("Сбросить всё (очки, замечания, подсказки)?")) emit("teams:reset-scores"); }}
            className="w-full py-2 mt-2 bg-gray-800 hover:bg-gray-700 text-red-400 rounded-xl text-sm font-semibold transition-colors"
          >
            🔄 Сбросить всё
          </button>
        </div>
      )}
    </div>
  );
}
