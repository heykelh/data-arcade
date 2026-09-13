"use client";
import { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react";

type Notes = Array<[number, number]>; // paires [fréquence, durée]

const SoundCtx = createContext<{ muted: boolean; toggle: () => void; beep: (n: Notes) => void }>({
  muted: false, toggle: () => {}, beep: () => {},
});

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const beep = useCallback((notes: Notes) => {
    if (muted) return;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    let t = ctx.currentTime;
    notes.forEach(([freq, dur]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + dur);
      t += dur;
    });
  }, [muted]);

  return <SoundCtx.Provider value={{ muted, toggle: () => setMuted((m) => !m), beep }}>{children}</SoundCtx.Provider>;
}

export const useSound = () => useContext(SoundCtx);
