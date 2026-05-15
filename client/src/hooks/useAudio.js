import { useCallback, useEffect, useRef } from "react";

function playChime(ctx) {
  const now = ctx.currentTime;
  [
    { freq: 523.25, t: 0,    dur: 0.22 },
    { freq: 659.25, t: 0.13, dur: 0.22 },
    { freq: 783.99, t: 0.26, dur: 0.40 },
  ].forEach(({ freq, t, dur }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + t);
    gain.gain.setValueAtTime(0, now + t);
    gain.gain.linearRampToValueAtTime(0.38, now + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
    osc.start(now + t);
    osc.stop(now + t + dur + 0.05);
  });
}

export function useAudio() {
  const ctxRef = useRef(null);

  // Разблокировка AudioContext после первого жеста пользователя
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

  // soundEnabled передаётся снаружи — хук сам не следит за настройкой
  const playSuccess = useCallback((soundEnabled = true) => {
    console.log("[Audio] playSuccess called, soundEnabled arg:", soundEnabled);
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