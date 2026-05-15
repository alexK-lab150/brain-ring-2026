import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import AdminView  from "./views/AdminView";
import PlayerView from "./views/PlayerView";

export default function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/"       element={<Navigate to="/player" replace />} />
        <Route path="/admin"  element={<AdminView />} />
        <Route path="/player" element={<PlayerView />} />
      </Routes>
    </SocketProvider>
  );
}
