"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { C, PIX } from "@/lib/palette";
import { useI18n } from "@/lib/i18n";
import { useSound } from "@/lib/sound";
import Cabinet from "@/components/Cabinet";
import { GAMES } from "@/games/registry";

export default function Hub() {
  const { t } = useI18n();
  const { beep } = useSound();
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <main style={{ position: "relative", zIndex: 10, maxWidth: 760, margin: "0 auto", padding: "8px 16px 40px", color: C.ink }}>
      <div style={{ textAlign: "center", margin: "18px 0 6px" }}>
        <div style={{ fontFamily: PIX, fontSize: 12, color: C.purple, letterSpacing: 2 }}>{t.hub.insertCoin}</div>
        <h1 style={{ fontFamily: PIX, fontSize: 30, lineHeight: 1.25, margin: "16px 0 6px",
          color: C.green, textShadow: `3px 3px 0 ${C.blue}, 6px 6px 0 ${C.panel2}` }}>DATA<br />ARCADE</h1>
        <div style={{ fontFamily: PIX, fontSize: 8, color: C.dim, marginTop: 10, opacity: blink ? 1 : 0.15 }}>{t.hub.chooseCabinet}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 26 }}>
        {GAMES.map((game) => {
          const inner = (
            <>
              <Cabinet screen={game.color} emblem={game.emblem} dim={!game.live} />
              <div style={{ fontFamily: PIX, fontSize: 9, color: game.live ? C.ink : C.dim, marginTop: 8 }}>{game.title}</div>
              <div style={{ fontFamily: "ui-sans-serif, system-ui", fontSize: 11, color: C.dim, marginTop: 5 }}>{t.genres[game.genreKey]}</div>
              <div style={{ fontFamily: PIX, fontSize: 7, marginTop: 9, color: game.live ? C.green : C.yellow }}>
                {game.live ? t.hub.playable : t.hub.soon}
              </div>
            </>
          );
          const card = { background: C.bg2, border: `2px solid ${game.live ? game.color : C.line}`,
            padding: "14px 12px 16px", textAlign: "center", display: "block", textDecoration: "none",
            boxShadow: game.live ? `0 0 12px ${game.color}44` : "none" } as const;

          return game.live ? (
            <Link key={game.slug} href={`/jeux/${game.slug}`} onClick={() => beep([[520, 0.05], [720, 0.07]])} style={{ ...card, cursor: "pointer" }}>
              {inner}
            </Link>
          ) : (
            <div key={game.slug} style={{ ...card, cursor: "not-allowed" }}>{inner}</div>
          );
        })}
      </div>

      <p style={{ fontFamily: "ui-sans-serif, system-ui", fontSize: 12, color: C.dim, textAlign: "center",
        marginTop: 30, lineHeight: 1.7, maxWidth: 460, marginInline: "auto" }}>{t.hub.footer}</p>
    </main>
  );
}
