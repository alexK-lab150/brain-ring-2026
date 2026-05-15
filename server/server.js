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

// ─── Persistence ──────────────────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, "data.json");

const DEFAULT_STATE = {
  questions: [],
  currentIndex: 0,
  showAnswer: false,
  blitzAttempts: { attempt1: false, attempt2: false },
  // Test teams — names/scores editable, add/remove via UI
  teams: [
    { id: 1, name: "Феникс",    score: 0 },
    { id: 2, name: "Эрудит",    score: 0 },
    { id: 3, name: "Олимп",     score: 0 },
    { id: 4, name: "Квант",     score: 0 },
    { id: 5, name: "Интеллект", score: 0 },
    { id: 6, name: "Гермес",    score: 0 },
  ],
  // Triggers audio on player screen: { teamId, delta, ts }
  lastScoreChange: null,
  nextTeamId: 7,
  soundEnabled: true,
};

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const saved = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...saved };
    }
  } catch (e) {
    console.error("⚠ Could not load data.json, using defaults:", e.message);
  }
  return { ...DEFAULT_STATE };
}

function saveState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(gameState, null, 2), "utf-8");
  } catch (e) {
    console.error("⚠ Could not save data.json:", e.message);
  }
}

let gameState = loadState();

// ─── REST — state hydration on page refresh ────────────────────────────────
app.get("/api/state", (_req, res) => res.json(gameState));

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[+] ${socket.id} connected  (total: ${io.engine.clientsCount})`);

  // Send current state immediately on connect/reconnect
  socket.emit("state:sync", gameState);

  // ── Questions ──────────────────────────────────────────────────────────────

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
    if (idx !== -1) {
      gameState.questions[idx] = updated;
      saveState();
      io.emit("state:sync", gameState);
    }
  });

  socket.on("answer:toggle", (visible) => {
    gameState.showAnswer = visible;
    saveState();
    io.emit("state:sync", gameState);
  });

  // ── Blitz ──────────────────────────────────────────────────────────────────

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

  socket.on("sound:toggle", () => {
    gameState.soundEnabled = !gameState.soundEnabled;
    saveState();
    io.emit("state:sync", gameState);
  });

  // ── Teams ──────────────────────────────────────────────────────────────────

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
    gameState.teams.push({ id, name: name || `Команда ${id}`, score: 0 });
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("team:remove", (teamId) => {
    gameState.teams = gameState.teams.filter((t) => t.id !== teamId);
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("teams:reset-scores", () => {
    gameState.teams = gameState.teams.map((t) => ({ ...t, score: 0 }));
    gameState.lastScoreChange = null;
    saveState();
    io.emit("state:sync", gameState);
  });

  socket.on("disconnect", () => {
    console.log(`[-] ${socket.id} disconnected`);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n🎯  Brain-Ring Server  →  http://localhost:${PORT}`);
  console.log(`    Admin panel  →  http://localhost:3000/admin`);
  console.log(`    Player view  →  http://localhost:3000/player  (проектор)\n`);
});