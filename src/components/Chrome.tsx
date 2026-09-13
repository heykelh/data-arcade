"use client";
import Link from "next/link";
import { C, PIX } from "@/lib/palette";
import { useI18n } from "@/lib/i18n";
import { useSound } from "@/lib/sound";

export default function Chrome() {
  const { t, lang, setLang } = useI18n();
  const { sfxOn, musicOn, toggleSfx, toggleMusic } = useSound();
  const pill = { fontFamily: PIX, fontSize: 8, color: C.dim, background: "transparent",
    border: `1px solid ${C.line}`, padding: "8px 10px", cursor: "pointer", textDecoration: "none" } as const;

  return (
    <header style={{ position: "relative", zIndex: 20, maxWidth: 760, margin: "0 auto",
      padding: "20px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Link href="/" style={{ ...pill, color: C.purple }}>◄ {t.ui.home}</Link>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button onClick={() => setLang(lang === "fr" ? "en" : "fr")} style={pill}>
          {lang === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
        </button>
        <button onClick={toggleMusic} style={{ ...pill, color: musicOn ? C.green : C.dim }}>
          {musicOn ? "♪" : "♪̶"} {t.ui.music}
        </button>
        <button onClick={toggleSfx} style={{ ...pill, color: sfxOn ? C.green : C.dim }}>
          {sfxOn ? "🔊" : "🔇"} {t.ui.sfx}
        </button>
      </div>
    </header>
  );
}
