import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "../context/SocketContext";

// ─── Small reusable pieces ────────────────────────────────────────────────────

function Badge({ children, color = "blue" }) {
  const colors = {
    blue:   "bg-blue-900 text-blue-300",
    orange: "bg-orange-900 text-orange-300",
    green:  "bg-green-900 text-green-300",
    red:    "bg-red-900  text-red-300",
    gray:   "bg-gray-700 text-gray-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
}

function StatusDot({ connected }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full
      ${connected ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"}`}>
      <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
      {connected ? "ONLINE" : "OFFLINE"}
    </div>
  );
}

// ─── Question Editor (inline editing) ────────────────────────────────────────

function QuestionEditor({ question, onSave }) {
  const [draft, setDraft] = useState(question);

  useEffect(() => { setDraft(question); }, [question]);

  const isDirty =
    draft.textRu !== question.textRu ||
    draft.textUa !== question.textUa ||
    draft.answer !== question.answer ||
    draft.answerSynodal !== question.answerSynodal ||
    draft.answerOgienko !== question.answerOgienko;

  const field = (label, key, color = "white", rows = 2) => (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-1"
             style={{ color: color === "gold" ? "#f5c518" : "#6b7280" }}>
        {label}
      </label>
      {rows > 1 ? (
        <textarea
          rows={rows}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm
                     focus:border-blue-500 outline-none resize-none transition-colors"
          style={{ color: color === "gold" ? "#f5c518" : "#e5e7eb" }}
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      ) : (
        <input
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm
                     focus:border-blue-500 outline-none transition-colors"
          style={{ color: color === "gold" ? "#f5c518" : "#e5e7eb" }}
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {field("Вопрос (RU) — белый экран", "textRu", "white", 3)}
      {field("Вопрос (UA) — голубой экран", "textUa", "white", 3)}
      {field("Ответ (основной)", "answer", "gold", 1)}
      {field("Синодальный перевод", "answerSynodal", "white", 1)}
      {field("Переклад Огієнка", "answerOgienko", "white", 1)}
      {isDirty && (
        <button
          onClick={() => onSave(draft)}
          className="w-full py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors"
        >
          💾 Сохранить изменения
        </button>
      )}
    </div>
  );
}

// ─── Team Row ─────────────────────────────────────────────────────────────────

function TeamRow({ team, rank, onDelta, onSetScore, onRename, onRemove }) {
  const [editScore, setEditScore] = useState(false);
  const [scoreVal, setScoreVal]   = useState(String(team.score));
  const [editName, setEditName]   = useState(false);
  const [nameVal, setNameVal]     = useState(team.name);
  const scoreRef = useRef(null);
  const nameRef  = useRef(null);

  useEffect(() => { if (editScore) scoreRef.current?.focus(); }, [editScore]);
  useEffect(() => { if (editName)  nameRef.current?.focus();  }, [editName]);

  const commitScore = () => {
    const v = parseInt(scoreVal, 10);
    if (!isNaN(v)) onSetScore(team.id, v);
    setEditScore(false);
  };
  const commitName = () => {
    if (nameVal.trim()) onRename(team.id, nameVal.trim());
    setEditName(false);
  };

  const rankColors = ["#f5c518", "#c0c0c0", "#cd7f32"];
  const rankColor  = rankColors[rank] || "#6b7280";

  return (
    <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
      {/* rank */}
      <span className="w-6 text-center text-sm font-bold" style={{ color: rankColor }}>
        {rank + 1}
      </span>

      {/* name */}
      {editName ? (
        <input
          ref={nameRef}
          className="flex-1 bg-gray-800 border border-blue-500 rounded px-2 py-1 text-sm text-white outline-none"
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") setEditName(false); }}
        />
      ) : (
        <button
          className="flex-1 text-left text-sm text-gray-200 hover:text-white truncate"
          onClick={() => { setEditName(true); setNameVal(team.name); }}
          title="Нажмите для переименования"
        >
          {team.name}
        </button>
      )}

      {/* score */}
      {editScore ? (
        <input
          ref={scoreRef}
          type="number"
          className="w-14 bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-center text-yellow-400 text-sm font-bold outline-none"
          value={scoreVal}
          onChange={(e) => setScoreVal(e.target.value)}
          onBlur={commitScore}
          onKeyDown={(e) => { if (e.key === "Enter") commitScore(); if (e.key === "Escape") setEditScore(false); }}
        />
      ) : (
        <button
          className="w-12 text-center font-bold text-xl text-yellow-400 hover:bg-gray-800 rounded px-1 transition-colors"
          onClick={() => { setEditScore(true); setScoreVal(String(team.score)); }}
          title="Нажмите для ручного ввода очков"
        >
          {team.score}
        </button>
      )}

      {/* -1 */}
      <button
        onClick={() => onDelta(team.id, -1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-950 hover:bg-red-800 text-red-300 font-bold text-lg transition-colors select-none"
      >
        −
      </button>
      {/* +1 */}
      <button
        onClick={() => onDelta(team.id, 1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-950 hover:bg-green-700 text-green-300 font-bold text-lg transition-colors select-none"
      >
        +
      </button>
      {/* remove */}
      <button
        onClick={() => onRemove(team.id)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-500 hover:text-red-400 text-sm transition-colors"
        title="Удалить команду"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Question List (for quick navigation) ────────────────────────────────────

function QuestionList({ questions, currentIndex, onGoto }) {
  return (
    <div className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
      {questions.map((q, i) => (
        <button
          key={q.id}
          onClick={() => onGoto(i)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-start gap-2
            ${i === currentIndex
              ? "bg-blue-900 border border-blue-600 text-white"
              : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"}`}
        >
          <span className="text-xs text-gray-500 w-6 shrink-0 pt-0.5">{i + 1}.</span>
          <div className="flex-1 min-w-0">
            <div className="truncate">{q.textRu}</div>
            {q.type === "blitz" && (
              <Badge color="orange">блиц</Badge>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── AdminView ────────────────────────────────────────────────────────────────

export default function AdminView() {
  const { gameState, connected, emit, soundEnabled, toggleSound } = useSocket();
  const fileRef = useRef(null);
  const [tab, setTab] = useState("question"); // question | teams | list

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-lg">
        <span className="animate-pulse">Подключение к серверу…</span>
      </div>
    );
  }

  const { questions, currentIndex, showAnswer, blitzAttempts, teams } = gameState;
  const q           = questions[currentIndex] || null;
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const bothFailed  = blitzAttempts.attempt1 && blitzAttempts.attempt2;

  // ── Event handlers ─────────────────────────────────────────────────────────

  const loadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (!Array.isArray(arr)) throw new Error("Ожидается массив");
        emit("questions:load", arr);
        alert(`✅ Загружено ${arr.length} вопросов`);
      } catch (err) {
        alert("❌ Ошибка JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const nav = (dir) => emit("question:navigate", dir);

  const tabs = [
    { key: "question", label: "📝 Вопрос" },
    { key: "teams",    label: "🏆 Команды" },
    { key: "list",     label: "📋 Список" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3
                         flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h1 className="font-bold text-base leading-none">Brain-Ring Admin</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {questions.length
                ? `Вопрос ${currentIndex + 1} / ${questions.length}`
                : "Вопросы не загружены"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot connected={connected} />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
          >
            📂 Загрузить JSON
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={loadFile} />
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Выключить звук" : "Включить звук"}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap
              ${soundEnabled
                ? "bg-green-900 hover:bg-green-800 text-green-300"
                : "bg-gray-800 hover:bg-gray-700 text-gray-500 line-through"}`}
          >
            {soundEnabled ? "🔊 Звук вкл" : "🔇 Звук выкл"}
          </button>
          <a
            href="/player"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
          >
            🖥 Экран
          </a>
        </div>
      </header>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <nav className="bg-gray-900 border-b border-gray-800 px-4 flex gap-1 pt-1.5">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors
              ${tab === key
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4">

        {/* ════ TAB: Question ════════════════════════════════════════════════ */}
        {tab === "question" && (
          <div className="max-w-3xl mx-auto space-y-4">

            {!q ? (
              <div className="text-center py-24 text-gray-600">
                <p className="text-5xl mb-4">📭</p>
                <p>Загрузите файл вопросов (JSON) через кнопку вверху.</p>
              </div>
            ) : (
              <>
                {/* Navigation bar */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => nav("prev")}
                    disabled={currentIndex === 0}
                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30
                               rounded-xl font-semibold transition-colors"
                  >
                    ← Назад
                  </button>

                  <div className="flex-1 text-center space-x-2">
                    <span className="text-gray-400 text-sm">
                      {currentIndex + 1} / {questions.length}
                    </span>
                    {q.type === "blitz" && <Badge color="orange">БЛИЦ</Badge>}
                  </div>

                  <button
                    onClick={() => nav("next")}
                    disabled={currentIndex === questions.length - 1}
                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30
                               rounded-xl font-semibold transition-colors"
                  >
                    Вперёд →
                  </button>
                </div>

                {/* Host preview — always shows answer */}
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">
                    👁 Превью ведущего (ответ виден только вам)
                  </p>
                  <div className="bg-gray-800 rounded-xl p-3 space-y-1">
                    <p className="text-white font-semibold leading-relaxed">{q.textRu}</p>
                    <p className="text-blue-300 italic text-sm">{q.textUa}</p>
                  </div>
                  <div className="border-t border-gray-700 pt-3 space-y-1.5">
                    <p className="text-yellow-400 font-bold text-base">✅ {q.answer}</p>
                    <p className="text-gray-400 text-sm">📖 Синодальный: {q.answerSynodal}</p>
                    <p className="text-gray-400 text-sm">📗 Огієнко: {q.answerOgienko}</p>
                  </div>
                </div>

                {/* Show / Hide answer */}
                <button
                  onClick={() => emit("answer:toggle", !showAnswer)}
                  className={`w-full py-3 rounded-xl font-bold text-base transition-all
                    ${showAnswer
                      ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
                >
                  {showAnswer ? "🙈 Скрыть ответ" : "👁 Показать ответ"}
                </button>

                {/* Blitz controls — only for blitz questions */}
                {q.type === "blitz" && (
                  <div className="bg-gray-900 border border-orange-900 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-orange-400 font-semibold text-sm uppercase tracking-wide">
                        ⚡ Блиц — попытки
                      </p>
                      <button
                        onClick={() => emit("blitz:reset")}
                        className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
                      >
                        Сбросить
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "attempt1", label: "Попытка 1" },
                        { key: "attempt2", label: "Попытка 2" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => emit("blitz:attempt", { attempt: key, active: !blitzAttempts[key] })}
                          className={`py-3 rounded-xl font-semibold transition-all
                            ${blitzAttempts[key]
                              ? "bg-red-700 hover:bg-red-600 text-white ring-2 ring-red-400"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
                        >
                          {label} {blitzAttempts[key] ? "✗" : "○"}
                        </button>
                      ))}
                    </div>

                    {bothFailed && (
                      <div className="bg-red-950 border border-red-700 rounded-xl p-3 text-center">
                        <p className="text-red-400 font-bold">🚫 Обе попытки израсходованы</p>
                        <p className="text-red-300 text-sm">На экране игрока — оверлей «ВОПРОС СНЯТ»</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline editor */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                    ✏️ Редактирование вопроса
                  </p>
                  <QuestionEditor question={q} onSave={(updated) => emit("question:update", updated)} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ TAB: Teams ════════════════════════════════════════════════════ */}
        {tab === "teams" && (
          <div className="max-w-xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-300">
                Команды ({teams.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (window.confirm("Сбросить все очки до 0?")) emit("teams:reset-scores"); }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-red-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  🔄 Сбросить очки
                </button>
                <button
                  onClick={() => emit("team:add", "")}
                  className="px-3 py-1.5 bg-green-900 hover:bg-green-800 text-green-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  + Добавить
                </button>
              </div>
            </div>

            {sortedTeams.map((team, rank) => (
              <TeamRow
                key={team.id}
                team={team}
                rank={rank}
                onDelta={(id, d)   => emit("team:score:delta", { teamId: id, delta: d })}
                onSetScore={(id, s) => emit("team:score:set",   { teamId: id, score: s })}
                onRename={(id, n)  => emit("team:rename",        { teamId: id, name: n })}
                onRemove={(id)     => { if (window.confirm(`Удалить «${team.name}»?`)) emit("team:remove", id); }}
              />
            ))}

            {teams.length === 0 && (
              <div className="text-center py-10 text-gray-600">
                Нет команд. Нажмите «+ Добавить».
              </div>
            )}
          </div>
        )}

        {/* ════ TAB: List ════════════════════════════════════════════════════ */}
        {tab === "list" && (
          <div className="max-w-2xl mx-auto">
            {questions.length === 0 ? (
              <div className="text-center py-24 text-gray-600">
                Вопросы не загружены.
              </div>
            ) : (
              <QuestionList
                questions={questions}
                currentIndex={currentIndex}
                onGoto={(i) => { emit("question:goto", i); setTab("question"); }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
