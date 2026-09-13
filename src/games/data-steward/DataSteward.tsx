"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { C, PIX } from "@/lib/palette";
import { useI18n } from "@/lib/i18n";
import { useSound } from "@/lib/sound";
import Screen from "@/components/Screen";
import { newFiche, Fiche, FIELDS_ORDER } from "./records";
import { grade } from "./grades";

type ActionKey = "conforme" | "rejete" | "none";
type Reveal = { actionKey: ActionKey; ok: boolean; tag: "good" | "missed" | "tooSlow"; reasonKey: string | null };

export default function DataSteward() {
  const { t } = useI18n();
  const { beep } = useSound();

  const [phase, setPhase] = useState<"intro" | "play" | "over">("intro");
  const [rec, setRec] = useState<Fiche | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [lives, setLives] = useState(3);
  const [rounds, setRounds] = useState(0);
  const [hits, setHits] = useState(0);
  const [seen, setSeen] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [timeLeft, setTimeLeft] = useState(1);
  const [maxTime, setMaxTime] = useState(4200);
  const [roundId, setRoundId] = useState(0);
  const [best, setBest] = useState(0);
  const deadline = useRef(0);
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const nextRound = (diff: number) => {
    const mt = Math.max(1700, 4200 - diff * 55);
    setMaxTime(mt); setRec(newFiche()); setReveal(null);
    deadline.current = performance.now() + mt; setTimeLeft(mt); setRoundId((i) => i + 1);
  };
  const start = () => {
    setScore(0); setCombo(1); setLives(3); setRounds(0); setHits(0); setSeen(0);
    setPhase("play"); nextRound(0);
  };

  useEffect(() => {
    if (phase !== "play" || reveal) return;
    let raf = 0;
    const tick = () => {
      const left = deadline.current - performance.now();
      if (left <= 0) { handleTimeout(); return; }
      setTimeLeft(left); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reveal, roundId]);

  const advance = (nextLives: number) => {
    setTimeout(() => {
      if (nextLives <= 0) { setBest((b) => Math.max(b, scoreRef.current)); setPhase("over"); }
      else setRounds((r) => { nextRound(r + 1); return r + 1; });
    }, 950);
  };

  const handleTimeout = () => {
    beep([[180, 0.16]]);
    setSeen((s) => s + 1); setCombo(1);
    setLives((l) => { const nl = l - 1; advance(nl); return nl; });
    setReveal({ actionKey: "none", ok: false, tag: "tooSlow", reasonKey: rec?.clean ? "conform" : rec?.reasonKey ?? null });
  };

  const judge = (saysClean: boolean) => {
    if (!rec || reveal) return;
    const ok = saysClean === rec.clean;
    const actionKey: ActionKey = saysClean ? "conforme" : "rejete";
    setSeen((s) => s + 1);
    if (ok) {
      const gain = 100 * combo;
      const nc = Math.min(combo + 1, 9);
      beep(nc % 3 === 0 ? [[988, 0.05], [1319, 0.12]] : [[660, 0.06], [880, 0.08]]);
      setHits((h) => h + 1); setScore((s) => s + gain); setCombo(nc);
      setReveal({ actionKey, ok: true, tag: "good", reasonKey: rec.clean ? "conform" : rec.reasonKey });
      advance(lives);
    } else {
      beep([[200, 0.16], [140, 0.14]]);
      setCombo(1);
      setLives((l) => { const nl = l - 1; advance(nl); return nl; });
      setReveal({ actionKey, ok: false, tag: "missed", reasonKey: rec.clean ? "wasConform" : rec.reasonKey });
    }
  };

  useEffect(() => {
    if (phase !== "over") return;
    if (score >= best && score > 0) beep([[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.18]]);
    else beep([[392, 0.12], [311, 0.12], [262, 0.22]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((phase === "intro" || phase === "over") && (e.key === "Enter" || e.key === " ")) start();
      else if (phase === "play" && !reveal) {
        if (e.key === "ArrowLeft") judge(true);
        if (e.key === "ArrowRight") judge(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reveal, rec, combo, lives]);

  const timePct = Math.max(0, Math.min(1, timeLeft / maxTime));
  const timeColor = timePct > 0.5 ? C.green : timePct > 0.25 ? C.yellow : C.red;
  const acc = seen ? Math.round((hits / seen) * 100) : 0;
  const g = grade(score);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ fontFamily: PIX, fontSize: 9, color: C.red }}>
          {"♥".repeat(Math.max(0, lives))}<span style={{ color: C.line }}>{"♥".repeat(3 - Math.max(0, lives))}</span>
        </div>
      </div>

      {phase === "intro" && (
        <Screen>
          <h2 style={{ fontFamily: PIX, fontSize: 16, color: C.green, margin: "4px 0 18px" }}>{t.steward.title}</h2>
          <p style={S.p}>{t.steward.introLine1}</p>
          <p style={{ ...S.p, color: C.ink, margin: "10px 0" }}>{t.steward.introLine2}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "18px 0 8px", flexWrap: "wrap" }}>
            <span style={S.hint}><b style={{ color: C.green }}>◄</b> {t.steward.validate}</span>
            <span style={S.hint}><b style={{ color: C.red }}>►</b> {t.steward.reject}</span>
          </div>
          <p style={{ ...S.p, fontSize: 11, color: C.dim }}>{t.steward.rules}</p>
          <button onClick={start} style={{ ...S.primary, marginTop: 18 }}>{t.steward.insertCoin}</button>
        </Screen>
      )}

      {phase === "play" && rec && (
        <Screen>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: PIX, fontSize: 9, marginBottom: 10 }}>
            <span style={{ color: C.dim }}>{t.steward.score} <span style={{ color: C.ink }}>{score}</span></span>
            <span style={{ color: combo > 1 ? C.purple : C.dim }}>{t.steward.combo} x{combo}</span>
            <span style={{ color: C.dim }}>{t.steward.best} <span style={{ color: C.yellow }}>{Math.max(best, score)}</span></span>
          </div>

          <div style={{ height: 8, background: C.bg, border: `1px solid ${C.line}`, marginBottom: 14 }}>
            <div style={{ height: "100%", width: `${timePct * 100}%`, background: timeColor, transition: "width 60ms linear" }} />
          </div>

          <div style={{ position: "relative", animation: reveal && !reveal.ok ? "arcShake 260ms" : "none",
            boxShadow: reveal ? `0 0 0 2px ${reveal.ok ? C.green : C.red}, 0 0 18px ${reveal.ok ? C.green : C.red}55` : "none" }}>
            <div style={{ background: C.bg, border: `2px solid ${C.line}`, padding: "14px 14px 6px" }}>
              <div style={{ fontFamily: PIX, fontSize: 8, color: C.dim, marginBottom: 12 }}>{t.steward.fiche} #{1000 + rounds}</div>
              {FIELDS_ORDER.map((k) => {
                const showBad = !!reveal && rec.flag === k && !rec.clean;
                return (
                  <div key={k} style={{ display: "flex", padding: "5px 0", borderBottom: `1px solid ${C.panel}` }}>
                    <span style={{ ...S.mono, color: C.dim, width: 92, flexShrink: 0 }}>{t.steward.fields[k]}</span>
                    <span style={{ ...S.mono, color: showBad ? C.red : C.ink, wordBreak: "break-all" }}>
                      {rec[k]}{showBad ? "  ◄" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            {reveal && reveal.actionKey !== "none" && (
              <div key={roundId} style={{ position: "absolute", left: "50%", top: "50%",
                animation: "arcStamp 240ms ease-out both", border: `3px solid ${reveal.ok ? C.green : C.red}`,
                padding: "8px 14px", background: "rgba(18,19,31,0.82)", textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontFamily: PIX, fontSize: 12, color: reveal.ok ? C.green : C.red }}>{t.steward[reveal.actionKey]}</div>
                <div style={{ fontFamily: PIX, fontSize: 8, color: reveal.ok ? C.green : C.red, marginTop: 5 }}>{t.steward[reveal.tag]}</div>
              </div>
            )}
          </div>

          <div style={{ minHeight: 30, marginTop: 12, textAlign: "center" }}>
            {reveal?.reasonKey && <div style={{ ...S.p, fontSize: 11, color: C.dim }}>{t.reasons[reveal.reasonKey]}</div>}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button onClick={() => judge(true)} disabled={!!reveal} style={{ ...S.big, borderColor: C.green, color: C.green, opacity: reveal ? 0.45 : 1 }}>{t.steward.validateBtn}</button>
            <button onClick={() => judge(false)} disabled={!!reveal} style={{ ...S.big, borderColor: C.red, color: C.red, opacity: reveal ? 0.45 : 1 }}>{t.steward.rejectBtn}</button>
          </div>
        </Screen>
      )}

      {phase === "over" && (
        <Screen>
          <div style={{ border: `2px solid ${g.color}`, padding: "20px 18px", background: C.bg, boxShadow: `0 0 0 4px ${C.panel}` }}>
            <div style={{ fontFamily: PIX, fontSize: 8, color: C.purple, textAlign: "center" }}>DATA ARCADE</div>
            <div style={{ fontFamily: PIX, fontSize: 10, color: C.dim, textAlign: "center", marginTop: 6 }}>{t.steward.title}</div>
            <div style={{ fontFamily: PIX, fontSize: 30, color: C.yellow, textAlign: "center", margin: "16px 0 4px" }}>{score}</div>
            <div style={{ fontFamily: PIX, fontSize: 11, color: g.color, textAlign: "center" }}>{t.grades[g.key]}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 18 }}>
              <Stat label={t.steward.precision} value={`${acc}%`} />
              <Stat label={t.steward.fiches} value={seen} />
              <Stat label={t.steward.best} value={Math.max(best, score)} />
            </div>
            <div style={{ fontFamily: PIX, fontSize: 7, color: C.dim, textAlign: "center", marginTop: 18 }}>▸ heykelhachiche.com</div>
          </div>
          {score >= best && score > 0 && <div style={{ ...S.p, color: C.green, fontSize: 11, marginTop: 12 }}>{t.steward.newRecord}</div>}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={start} style={S.primary}>{t.steward.replay}</button>
            <Link href="/" style={{ ...S.ghost, textDecoration: "none" }}>{t.steward.backCabinet}</Link>
          </div>
        </Screen>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: PIX, fontSize: 13, color: C.ink }}>{value}</div>
      <div style={{ fontFamily: PIX, fontSize: 7, color: C.dim, marginTop: 5 }}>{label}</div>
    </div>
  );
}

const S = {
  p: { fontFamily: "ui-sans-serif, system-ui", fontSize: 13, lineHeight: 1.6, color: C.dim, textAlign: "center", margin: 0 } as const,
  mono: { fontFamily: "ui-monospace, monospace", fontSize: 13 } as const,
  hint: { fontFamily: "ui-sans-serif, system-ui", fontSize: 12, color: C.dim } as const,
  primary: { fontFamily: PIX, fontSize: 11, color: C.bg, background: C.green, border: "none", padding: "12px 16px", cursor: "pointer" } as const,
  ghost: { fontFamily: PIX, fontSize: 9, color: C.dim, background: "transparent", border: `1px solid ${C.line}`, padding: "8px 10px", cursor: "pointer" } as const,
  big: { flex: 1, fontFamily: PIX, fontSize: 12, background: C.bg, border: "2px solid", padding: "16px 8px", cursor: "pointer" } as const,
};
