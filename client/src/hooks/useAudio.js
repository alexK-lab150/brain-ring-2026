import { useCallback, useEffect, useRef } from "react";

function playChime(ctx) {
  const now = ctx.currentTime;
  const note = (freq, t, dur) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + t);
    gain.gain.setValueAtTime(0, now + t);
    gain.gain.linearRampToValueAtTime(0.18, now + t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
    osc.start(now + t);
    osc.stop(now + t + dur + 0.05);
  };

  // Фанфара — торжественный восходящий аккорд
  note(523.25, 0,    0.12);
  note(659.25, 0.08, 0.12);
  note(783.99, 0.16, 0.15);
  note(1046.50,0.24, 0.45);
}

export function useAudio() {
  const ctxRef = useRef(null);

  useEffect(() => {
    const unlock = () => {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume();
      }
    };
    window.addEventListener("click",      unlock);
    window.addEventListener("keydown",    unlock);
    window.addEventListener("touchstart", unlock);
    return () => {
      window.removeEventListener("click",      unlock);
      window.removeEventListener("keydown",    unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  const playSuccess = useCallback((soundEnabled = true) => {
    if (!soundEnabled) return;
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().then(() => playChime(ctx));
      } else {
        playChime(ctx);
      }
    } catch (e) { /* audio not supported */ }
  }, []);

  return { playSuccess };
}
