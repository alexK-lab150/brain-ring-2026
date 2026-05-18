const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DATA_FILE = path.join(__dirname, "data.json");

const DEFAULT_STATE = {
  // ── Global ─────────────────────────────────────────────────────────────────
  mode: "blitz", // "blitz" | "captains"
  soundEnabled: true,
  teams: [
    { id: 1, name: "Феникс",    score: 0, penalties: 0, usedHints: [] },
    { id: 2, name: "Эрудит",    score: 0, penalties: 0, usedHints: [] },
    { id: 3, name: "Олимп",     score: 0, penalties: 0, usedHints: [] },
    { id: 4, name: "Квант",     score: 0, penalties: 0, usedHints: [] },
    { id: 5, name: "Интеллект", score: 0, penalties: 0, usedHints: [] },
    { id: 6, name: "Гермес",    score: 0, penalties: 0, usedHints: [] },
  ],
  lastScoreChange: null,
  nextTeamId: 7,

  // ── Blitz mode ─────────────────────────────────────────────────────────────
  questions: [],
  currentIndex: 0,
  showAnswer: false,
  blitzAttempts: { attempt1: false, attempt2: false },

  // ── Captains mode ──────────────────────────────────────────────────────────
  captains: {
    categories: [],           // loaded from JSON
    selectedCategoryId: null, // category currently open
    selectedQuestionId: null, // question being answered
    activeTeamId: null,       // which team is answering
    showAnswer: false,
    hint: null,               // null | "phone" | "team"
    timerActive: false,
    timerValue: 120,
  },
};

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const saved = JSON.parse(raw);
      // Deep merge captains sub-object
      return {
        ...DEFAULT_STATE,
        ...saved,
        captains: { ...DEFAULT_STATE.captains, ...(saved.captains || {}) },
      };
    }
  } catch (e) {
    console.error("⚠ Could not load data.json:", e.message);
  }
  return { ...DEFAULT_STATE, captains: { ...DEFAULT_STATE.captains } };
}

function saveState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(gameState, null, 2), "utf-8");
  } catch (e) {
    console.error("⚠ Could not save data.json:", e.message);
  }
}

let gameState = loadState();

// Timer interval reference
let timerInterval = null;

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    if (gameState.captains.timerValue > 0) {
      gameState.captains.timerValue--;
      io.emit("state:sync", gameState);
    } else {
      stopTimer();
      gameState.captains.timerActive = false;
      gameState.captains.hint = null;
      saveState();
      io.emit("state:sync", gameState);
    }
  }, 1000);
}

app.get("/api/state", (_req, res) => res.json(gameState));

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id} connected`);
  socket.emit("state:sync", gameState);

  // ── Global ────────────────────────────────────────────────────────────────

  socket.on("mode:set", (mode) => {
    gameState.mode = mode;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("sound:toggle", () => {
    gameState.soundEnabled = !gameState.soundEnabled;
    saveState();
    io.emit("state:sync", gameState);
  });

  // ── Teams ─────────────────────────────────────────────────────────────────

  socket.on("team:score:delta", ({ teamId, delta }) => {
    const team = gameState.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.score += delta;
    gameState.lastScoreChange = { teamId, delta, ts: Date.now() };
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("team:score:set", ({ teamId, score }) => {
    const team = gameState.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.score = Number(score);
    gameState.lastScoreChange = null;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("team:rename", ({ teamId, name }) => {
    const team = gameState.teams.find((t) => t.id === teamId);
    if (!team || !name.trim()) return;
    team.name = name.trim();
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("team:add", (name) => {
    const id = gameState.nextTeamId++;
    gameState.teams.push({ id, name: name || `Команда ${id}`, score: 0, penalties: 0, usedHints: [] });
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("team:remove", (teamId) => {
    gameState.teams = gameState.teams.filter((t) => t.id !== teamId);
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("teams:reset-scores", () => {
    gameState.teams = gameState.teams.map((t) => ({ ...t, score: 0, penalties: 0, usedHints: [] }));
    gameState.lastScoreChange = null;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("team:penalty", (teamId) => {
    const team = gameState.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.penalties = (team.penalties || 0) + 1;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("team:penalty:reset", (teamId) => {
    const team = gameState.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.penalties = 0;
    saveState();
    io.emit("state:sync", gameState);
  });

  // ── Blitz questions ───────────────────────────────────────────────────────

  socket.on("questions:load", (questions) => {
    gameState.questions = questions;
    gameState.currentIndex = 0;
    gameState.showAnswer = false;
    gameState.blitzAttempts = { attempt1: false, attempt2: false };
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("question:navigate", (direction) => {
    const len = gameState.questions.length;
    if (!len) return;
    if (direction === "next" && gameState.currentIndex < len - 1) gameState.currentIndex++;
    if (direction === "prev" && gameState.currentIndex > 0) gameState.currentIndex--;
    gameState.showAnswer = false;
    gameState.blitzAttempts = { attempt1: false, attempt2: false };
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("question:goto", (index) => {
    if (index >= 0 && index < gameState.questions.length) {
      gameState.currentIndex = index;
      gameState.showAnswer = false;
      gameState.blitzAttempts = { attempt1: false, attempt2: false };
      saveState();
      io.emit("state:sync", gameState);
    }
  });

  socket.on("question:update", (updated) => {
    const idx = gameState.questions.findIndex((q) => q.id === updated.id);
    if (idx !== -1) { gameState.questions[idx] = updated; saveState(); io.emit("state:sync", gameState); }
  });

  socket.on("answer:toggle", (visible) => {
    gameState.showAnswer = visible;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("blitz:attempt", ({ attempt, active }) => {
    gameState.blitzAttempts[attempt] = active;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("blitz:reset", () => {
    gameState.blitzAttempts = { attempt1: false, attempt2: false };
    saveState();
    io.emit("state:sync", gameState);
  });

  // ── Captains mode ─────────────────────────────────────────────────────────

  socket.on("captains:load", (categories) => {
    gameState.captains.categories = categories;
    gameState.captains.selectedCategoryId = null;
    gameState.captains.selectedQuestionId = null;
    gameState.captains.activeTeamId = null;
    gameState.captains.showAnswer = false;
    gameState.captains.hint = null;
    gameState.captains.timerActive = false;
    gameState.captains.timerValue = 120;
    stopTimer();
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("captains:select-category", (categoryId) => {
    gameState.captains.selectedCategoryId = categoryId;
    gameState.captains.selectedQuestionId = null;
    gameState.captains.showAnswer = false;
    gameState.captains.hint = null;
    gameState.captains.timerActive = false;
    gameState.captains.timerValue = 120;
    stopTimer();
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("captains:select-question", (questionId) => {
    gameState.captains.selectedQuestionId = questionId;
    gameState.captains.showAnswer = false;
    gameState.captains.hint = null;
    gameState.captains.timerActive = false;
    gameState.captains.timerValue = 120;
    stopTimer();
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("captains:set-team", (teamId) => {
    gameState.captains.activeTeamId = teamId;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("captains:show-answer", (visible) => {
    gameState.captains.showAnswer = visible;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("captains:hint", (hintType) => {
    // hintType: "phone" | "team" | null
    const teamId = gameState.captains.activeTeamId;
    const team = gameState.teams.find((t) => t.id === teamId);
    if (!team) return;

    if (hintType === null) {
      // Cancel hint
      stopTimer();
      gameState.captains.hint = null;
      gameState.captains.timerActive = false;
      gameState.captains.timerValue = 120;
    } else {
      // Mark hint as used for this team
      if (!team.usedHints) team.usedHints = [];
      if (!team.usedHints.includes(hintType)) {
        team.usedHints.push(hintType);
      }
      gameState.captains.hint = hintType;
      gameState.captains.timerActive = true;
      gameState.captains.timerValue = 120;
      startTimer();
    }
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("captains:finish-turn", () => {
    // Mark current question as opened
    const { selectedCategoryId, selectedQuestionId } = gameState.captains;
    if (selectedCategoryId && selectedQuestionId) {
      const cat = gameState.captains.categories.find((c) => c.id === selectedCategoryId);
      if (cat) {
        const q = cat.questions.find((q) => q.id === selectedQuestionId);
        if (q) q.isOpened = true;
      }
    }
    // Reset turn state
    stopTimer();
    gameState.captains.selectedQuestionId = null;
    gameState.captains.selectedCategoryId = null;
    gameState.captains.activeTeamId = null;
    gameState.captains.showAnswer = false;
    gameState.captains.hint = null;
    gameState.captains.timerActive = false;
    gameState.captains.timerValue = 120;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("disconnect", () => {
    console.log(`[-] ${socket.id} disconnected`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n🎯  Brain-Ring Server  →  http://localhost:${PORT}`);
  console.log(`    Admin  →  http://localhost:3000/admin`);
  console.log(`    Player →  http://localhost:3000/player\n`);
});
