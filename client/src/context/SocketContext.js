import React, {
  createContext, useContext, useEffect,
  useState, useRef, useCallback,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SERVER =
  process.env.REACT_APP_SERVER_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetch(`${SERVER}/api/state`)
      .then((r) => r.json())
      .then((state) => {
        setGameState(state);
        // soundEnabled хранится прямо в gameState на сервере
        if (typeof state.soundEnabled === "boolean") {
          setSoundEnabled(state.soundEnabled);
        }
      })
      .catch(() => {});

    const socket = io(SERVER, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("state:sync", (state) => {
      setGameState(state);
      if (typeof state.soundEnabled === "boolean") {
        setSoundEnabled(state.soundEnabled);
      }
    });

    return () => socket.disconnect();
  }, []);

  const emit = useCallback((event, payload) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, payload);
    }
  }, []);

  // toggleSound отправляет на сервер → сервер бродкастит всем вкладкам
  const toggleSound = useCallback(() => {
    emit("sound:toggle");
  }, [emit]);

  return (
    <SocketContext.Provider value={{ gameState, connected, emit, soundEnabled, toggleSound }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be inside SocketProvider");
  return ctx;
}
