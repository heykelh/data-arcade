"use client";
import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from "react";

type Notes = Array<[number, number]>;

const SoundCtx = createContext<{
  sfxOn: boolean; musicOn: boolean;
  toggleSfx: () => void; toggleMusic: () => void;
  beep: (n: Notes) => void;
}>({ sfxOn: true, musicOn: true, toggleSfx: () => {}, toggleMusic: () => {}, beep: () => {} });

export function SoundProvider({ children }: { children: ReactNode }) {
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Prépare l'élément audio une seule fois
  useEffect(() => {
    const a = new Audio("/music.mp3");
    a.loop = true;      // ← boucle infinie
    a.volume = 0.4;     // ← volume (0 à 1), ajuste à ton goût
    audioRef.current = a;
    return () => { a.pause(); };
  }, []);

  // Démarre / coupe la musique selon le bouton
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (musicOn) a.play().catch(() => { /* attend le 1er clic, voir note */ });
    else a.pause();
  }, [musicOn]);

  // Au tout premier clic sur la page, on (re)tente le play si musicOn
  useEffect(() => {
    const kick = () => {
      if (musicOn && audioRef.current) audioRef.current.play().catch(() => {});
      window.removeEventListener("pointerdown", kick);
    };
    window.addEventListener("pointerdown", kick);
    return () => window.removeEventListener("pointerdown", kick);
  }, [musicOn]);

  // Bruitages (inchangé)
  const beep = useCallback((notes: Notes) => {
    if (!sfxOn) return;
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
  }, [sfxOn]);

  return (
    <SoundCtx.Provider value={{
      sfxOn, musicOn,
      toggleSfx: () => setSfxOn((v) => !v),
      toggleMusic: () => setMusicOn((v) => !v),
      beep,
    }}>
      {children}
    </SoundCtx.Provider>
  );
}

export const useSound = () => useContext(SoundCtx);
