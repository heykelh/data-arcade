"use client";
import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from "react";

type Notes = Array<[number, number]>;
const DEFAULT_TRACK = "/music.mp3";

const SoundCtx = createContext<{
  sfxOn: boolean; musicOn: boolean;
  toggleSfx: () => void; toggleMusic: () => void;
  beep: (n: Notes) => void;
  setTrack: (src: string) => void;
}>({
  sfxOn: true, musicOn: true, toggleSfx: () => {}, toggleMusic: () => {},
  beep: () => {}, setTrack: () => {},
});

export function SoundProvider({ children }: { children: ReactNode }) {
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<string>(DEFAULT_TRACK);
  const musicOnRef = useRef(true);
  useEffect(() => { musicOnRef.current = musicOn; }, [musicOn]);

  // Élément audio unique, créé une fois
  useEffect(() => {
    const a = new Audio(DEFAULT_TRACK);
    a.loop = true;
    a.volume = 0.4;
    audioRef.current = a;
    return () => { a.pause(); };
  }, []);

  // Change de piste avec un léger fondu ; ne coupe pas si c'est déjà la même
  const setTrack = useCallback((src: string) => {
    const a = audioRef.current;
    if (!a || trackRef.current === src) return;
    trackRef.current = src;
    const swap = () => {
      a.src = src;
      a.load();
      if (musicOnRef.current) a.play().catch(() => {});
    };
    if (a.paused) { swap(); return; }
    // petit fondu sortant avant de changer
    const from = a.volume;
    let v = from;
    const fade = setInterval(() => {
      v -= from / 6;
      if (v <= 0) { clearInterval(fade); a.volume = from; swap(); }
      else a.volume = v;
    }, 30);
  }, []);

  // Bouton musique on/off
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (musicOn) a.play().catch(() => {});
    else a.pause();
  }, [musicOn]);

  // Premier clic → débloque l'audio (politique navigateur)
  useEffect(() => {
    const kick = () => {
      if (musicOnRef.current && audioRef.current) audioRef.current.play().catch(() => {});
      window.removeEventListener("pointerdown", kick);
    };
    window.addEventListener("pointerdown", kick);
    return () => window.removeEventListener("pointerdown", kick);
  }, []);

  // Bruitages
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
      beep, setTrack,
    }}>
      {children}
    </SoundCtx.Provider>
  );
}

export const useSound = () => useContext(SoundCtx);
