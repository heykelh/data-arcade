"use client";
import { useEffect } from "react";
import { useSound } from "@/lib/sound";

// Bascule sur la musique du jeu à l'entrée, revient à celle par défaut en sortant.
export default function GameMusic({ src }: { src?: string }) {
  const { setTrack } = useSound();
  useEffect(() => {
    setTrack(src ?? "/music.mp3");
    return () => setTrack("/music.mp3");
  }, [src, setTrack]);
  return null;
}
