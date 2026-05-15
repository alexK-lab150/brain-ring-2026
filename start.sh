#!/usr/bin/env bash
# Brain-Ring 2026 — startup helper
# Run from the brain-ring/ root directory

echo "🎯  Brain-Ring 2026 — Setup & Start"
echo "======================================"

# Install server deps
echo ""
echo "📦  Installing server dependencies…"
cd server && npm install && cd ..

# Install client deps
echo ""
echo "📦  Installing client dependencies…"
cd client && npm install && cd ..

echo ""
echo "✅  Dependencies installed."
echo ""
echo "🚀  Starting server on :3001 …"
cd server && npm start &
SERVER_PID=$!

sleep 2

echo "🚀  Starting client on :3000 …"
cd ../client && npm start &

echo ""
echo "────────────────────────────────────"
echo "  Admin  →  http://localhost:3000/admin"
echo "  Player →  http://localhost:3000/player"
echo "────────────────────────────────────"
echo "Press Ctrl+C to stop."

wait $SERVER_PID
