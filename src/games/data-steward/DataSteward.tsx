"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { C, PIX, READ } from "@/lib/palette";
import { useI18n } from "@/lib/i18n";
import { useSound } from "@/lib/sound";
import Screen from "@/components/Screen";
import { newFiche, Fiche, FIELDS_ORDER, Field } from "./records";
import { grade } from "./grades";

type ActionKey = "conforme" | "rejete" | "none";
type Reveal = { actionKey: ActionKey; ok: boolean; tag: "good" | "missed" | "tooSlow"; reasonKey: string | null };
type BossState =
  | { v: "rgpd"; fiche: Fiche; sensitive: string | null; kind: "clean" | "dirty" | "sensitive" }
  | { v: "batch"; fiches: Fiche[]; choices: (boolean | null)[] }
  | { v: "doppel"; left: Fiche; right: Fiche; correct: 0 | 1 };

const genClean = (): Fiche => { for (let i = 0; i < 25; i++) { const f = newFiche(); if (f.clean) return f; } return newFiche(); };
const genDirty = (): Fiche => { for (let i = 0; i < 25; i++) { const f = newFiche(); if (!f.clean) return f; } return newFiche(); };

export default function DataSteward() {
  const { t } = useI18n();
  const { beep } = useSound();

  const [phase, setPhase] = useState<"intro" | "play" | "boss" | "over">("intro");
  const [rec, setRec] = useState<Fiche | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [lives, setLives] = useState(3);
  const [rounds, setRounds] = useState(0);
  const [hits, setHits] = useState(0);
  const [seen, setSeen] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [bossCount, setBossCount] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [timeLeft, setTimeLeft] = useState(1);
  const [maxTime, setMaxTime] = useState(4200);
  const [roundId, setRoundId] = useState(0);
  const [best, setBest] = useState(0);
  // boss
  const [boss, setBoss] = useState<BossState | null>(null);
  const [bossReveal, setBossReveal] = useState<{ ok: boolean } | null>(null);
  const [bossTimeLeft, setBossTimeLeft] = useState(1);
  const [bossMaxTime, setBossMaxTime] = useState(1);
  const deadline = useRef(0);
  const bossDeadline = useRef(0);
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const sampleSensitive = () => t.steward.boss.sensitiveSamples[Math.floor(Math.random() * t.steward.boss.sensitiveSamples.length)];

  const nextRound = (diff: number) => {
    const mt = Math.max(1700, 4200 - diff * 55);
    setMaxTime(mt); setRec(newFiche()); setReveal(null);
    deadline.current = performance.now() + mt; setTimeLeft(mt); setRoundId((i) => i + 1);
  };
  const start = () => {
    setScore(0); setCombo(1); setLives(3); setRounds(0); setHits(0); setSeen(0);
    setCleared(0); setBossCount(0); setBoss(null); setBossReveal(null);
    setPhase("play"); nextRound(0);
  };

  /* ---------- timer normal ---------- */
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

  /* ---------- timer boss ---------- */
  useEffect(() => {
    if (phase !== "boss" || bossReveal) return;
    let raf = 0;
    const tick = () => {
      const left = bossDeadline.current - performance.now();
      if (left <= 0) { handleBossTimeout(); return; }
      setBossTimeLeft(left); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bossReveal, boss?.v]);

  const advance = (nextLives: number, bossDue: boolean) => {
    setTimeout(() => {
      if (nextLives <= 0) { setBest((b) => Math.max(b, scoreRef.current)); setPhase("over"); }
      else if (bossDue) enterBoss();
      else setRounds((r) => { nextRound(r + 1); return r + 1; });
    }, 950);
  };

  const handleTimeout = () => {
    beep([[180, 0.16]]);
    setSeen((s) => s + 1); setCombo(1);
    setLives((l) => { const nl = l - 1; advance(nl, false); return nl; });
    setReveal({ actionKey: "none", ok: false, tag: "tooSlow", reasonKey: rec?.clean ? "conform" : rec?.reasonKey ?? null });
  };

  const judge = (saysClean: boolean) => {
    if (!rec || reveal) return;
    const ok = saysClean === rec.clean;
    const actionKey: ActionKey = saysClean ? "conforme" : "rejete";
    setSeen((s) => s + 1);
    if (ok) {
      const gain = 100 * combo; const nc = Math.min(combo + 1, 9);
      beep(nc % 3 === 0 ? [[988, 0.05], [1319, 0.12]] : [[660, 0.06], [880, 0.08]]);
      setHits((h) => h + 1); setScore((s) => s + gain); setCombo(nc);
      const nCleared = cleared + 1; setCleared(nCleared);
      setReveal({ actionKey, ok: true, tag: "good", reasonKey: rec.clean ? "conform" : rec.reasonKey });
      advance(lives, nCleared % 10 === 0);
    } else {
      beep([[200, 0.16], [140, 0.14]]);
      setCombo(1);
      setLives((l) => { const nl = l - 1; advance(nl, false); return nl; });
      setReveal({ actionKey, ok: false, tag: "missed", reasonKey: rec.clean ? "wasConform" : rec.reasonKey });
    }
  };

  /* ---------- boss ---------- */
  const enterBoss = () => {
    const v = (["rgpd", "batch", "doppel"] as const)[bossCount % 3];
    setBossCount((c) => c + 1);
    let mt = 8000;
    if (v === "rgpd") {
      const r = Math.random();
      const kind = r < 0.34 ? "clean" : r < 0.67 ? "dirty" : "sensitive";
      const fiche = kind === "dirty" ? genDirty() : genClean();
      setBoss({ v, fiche, kind, sensitive: kind === "sensitive" ? sampleSensitive() : null });
      mt = 7000;
    } else if (v === "batch") {
      setBoss({ v, fiches: Array.from({ length: 5 }, () => newFiche()), choices: [null, null, null, null, null] });
      mt = 14000;
    } else {
      const good = genClean();
      const opts = FIELDS_ORDER.slice(1) as Field[]; // pas le nom
      const badField = opts[Math.floor(Math.random() * opts.length)];
      const bad: Fiche = { ...good, [badField]: "—", clean: false, flag: badField, reasonKey: "missing" };
      const correct = Math.random() < 0.5 ? 0 : 1;
      setBoss(correct === 0 ? { v, left: good, right: bad, correct: 0 } : { v, left: bad, right: good, correct: 1 });
      mt = 9000;
    }
    setBossReveal(null); setBossMaxTime(mt); bossDeadline.current = performance.now() + mt; setBossTimeLeft(mt);
    setPhase("boss"); beep([[330, 0.1], [262, 0.1], [392, 0.16]]);
  };

  const resolveBoss = (ok: boolean, pts: number) => {
    if (bossReveal) return;
    let livesAfter = lives;
    if (ok) { beep([[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.16]]); setScore((s) => s + pts); setLives((l) => { livesAfter = Math.min(3, l + 1); return livesAfter; }); }
    else { beep([[200, 0.16], [140, 0.16]]); setScore((s) => s + pts); setCombo(1); setLives((l) => { livesAfter = l - 1; return livesAfter; }); }
    setBossReveal({ ok });
    setTimeout(() => {
      setBossReveal(null); setBoss(null);
      if (!ok && livesAfter <= 0) { setBest((b) => Math.max(b, scoreRef.current)); setPhase("over"); return; }
      setPhase("play"); setRounds((r) => { nextRound(r + 1); return r + 1; });
    }, 1500);
  };

  const handleBossTimeout = () => { if (boss?.v === "batch") submitBatch(); else resolveBoss(false, 0); };

  const answerRgpd = (choice: "validate" | "reject" | "rgpd") => {
    if (boss?.v !== "rgpd" || bossReveal) return;
    const correct = boss.kind === "clean" ? "validate" : boss.kind === "dirty" ? "reject" : "rgpd";
    resolveBoss(choice === correct, choice === correct ? 600 : 0);
  };
  const answerDoppel = (pick: 0 | 1) => {
    if (boss?.v !== "doppel" || bossReveal) return;
    resolveBoss(pick === boss.correct, pick === boss.correct ? 700 : 0);
  };
  const setBatchChoice = (i: number, keep: boolean) => {
    setBoss((b) => (b && b.v === "batch" ? { ...b, choices: b.choices.map((c, j) => (j === i ? keep : c)) } : b));
  };
  const submitBatch = () => {
    if (boss?.v !== "batch" || bossReveal) return;
    const correct = boss.fiches.reduce((acc, f, i) => acc + (boss.choices[i] === f.clean ? 1 : 0), 0);
    resolveBoss(correct >= 4, correct * 120);
  };

  /* ---------- clavier ---------- */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((phase === "intro" || phase === "over") && (e.key === "Enter" || e.key === " ")) start();
      else if (phase === "play" && !reveal) {
        if (e.key === "ArrowLeft") judge(true);
        if (e.key === "ArrowRight") judge(false);
      } else if (phase === "boss" && !bossReveal) {
        if (boss?.v === "rgpd") { if (e.key === "1") answerRgpd("validate"); if (e.key === "2") answerRgpd("reject"); if (e.key === "3") answerRgpd("rgpd"); }
        else if (boss?.v === "doppel") { if (e.key === "ArrowLeft") answerDoppel(0); if (e.key === "ArrowRight") answerDoppel(1); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reveal, rec, combo, lives, cleared, boss, bossReveal]);

  const timePct = Math.max(0, Math.min(1, timeLeft / maxTime));
  const timeColor = timePct > 0.5 ? C.green : timePct > 0.25 ? C.yellow : C.red;
  const bossPct = Math.max(0, Math.min(1, bossTimeLeft / bossMaxTime));
  const acc = seen ? Math.round((hits / seen) * 100) : 0;
  const g = grade(score);

  // vue fiche complète (réutilisée par les boss)
  const FicheView = ({ f, showFlag }: { f: Fiche; showFlag: boolean }) => (
    <div style={{ background: C.bg, border: `2px solid ${C.line}`, padding: "12px 12px 4px" }}>
      {FIELDS_ORDER.map((k) => {
        const bad = showFlag && f.flag === k && !f.clean;
        return (
          <div key={k} style={{ display: "flex", padding: "4px 0", borderBottom: `1px solid ${C.panel}` }}>
            <span style={{ ...S.mono, color: C.dim, width: 84, flexShrink: 0 }}>{t.steward.fields[k]}</span>
            <span style={{ ...S.mono, color: bad ? C.red : C.ink, wordBreak: "break-all" }}>{f[k]}{bad ? "  ◄" : ""}</span>
          </div>
        );
      })}
    </div>
  );

  const bossName = boss ? (boss.v === "rgpd" ? t.steward.boss.rgpdName : boss.v === "batch" ? t.steward.boss.batchName : t.steward.boss.doppelName) : "";
  const bossPrompt = boss ? (boss.v === "rgpd" ? t.steward.boss.rgpdPrompt : boss.v === "batch" ? t.steward.boss.batchPrompt : t.steward.boss.doppelPrompt) : "";
  const bossColor = boss?.v === "doppel" ? C.purple : boss?.v === "batch" ? C.yellow : C.red;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ fontFamily: PIX, fontSize: 9, color: C.red }}>
          {"♥".repeat(Math.max(0, lives))}<span style={{ color: C.line }}>{"♥".repeat(Math.max(0, 3 - lives))}</span>
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
          <p style={{ ...S.p, fontSize: 16, color: C.dim }}>{t.steward.rules}</p>
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
                    <span style={{ ...S.mono, color: showBad ? C.red : C.ink, wordBreak: "break-all" }}>{rec[k]}{showBad ? "  ◄" : ""}</span>
                  </div>
                );
              })}
            </div>
            {reveal && reveal.actionKey !== "none" && (
              <div key={roundId} style={{ position: "absolute", left: "50%", top: "50%", animation: "arcStamp 240ms ease-out both",
                border: `3px solid ${reveal.ok ? C.green : C.red}`, padding: "8px 14px", background: "rgba(18,19,31,0.82)", textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontFamily: PIX, fontSize: 12, color: reveal.ok ? C.green : C.red }}>{t.steward[reveal.actionKey]}</div>
                <div style={{ fontFamily: PIX, fontSize: 8, color: reveal.ok ? C.green : C.red, marginTop: 5 }}>{t.steward[reveal.tag]}</div>
              </div>
            )}
          </div>
          <div style={{ minHeight: 30, marginTop: 12, textAlign: "center" }}>
            {reveal?.reasonKey && <div style={{ ...S.p, fontSize: 16, color: C.dim }}>{t.reasons[reveal.reasonKey]}</div>}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button onClick={() => judge(true)} disabled={!!reveal} style={{ ...S.big, borderColor: C.green, color: C.green, opacity: reveal ? 0.45 : 1 }}>{t.steward.validateBtn}</button>
            <button onClick={() => judge(false)} disabled={!!reveal} style={{ ...S.big, borderColor: C.red, color: C.red, opacity: reveal ? 0.45 : 1 }}>{t.steward.rejectBtn}</button>
          </div>
        </Screen>
      )}

      {phase === "boss" && boss && (
        <Screen>
          <div style={{ fontFamily: PIX, fontSize: 9, color: bossColor, textAlign: "center", marginBottom: 4 }}>{t.steward.boss.alert}</div>
          <div style={{ fontFamily: PIX, fontSize: 13, color: C.ink, textAlign: "center", marginBottom: 10 }}>{bossName}</div>
          <div style={{ height: 8, background: C.bg, border: `1px solid ${C.line}`, marginBottom: 10 }}>
            <div style={{ height: "100%", width: `${bossPct * 100}%`, background: bossColor, transition: "width 60ms linear" }} />
          </div>
          <p style={{ ...S.p, fontSize: 16, color: C.dim, marginBottom: 12 }}>{bossPrompt}</p>

          <div style={{ boxShadow: bossReveal ? `0 0 0 2px ${bossReveal.ok ? C.green : C.red}, 0 0 18px ${bossReveal.ok ? C.green : C.red}55` : "none" }}>
            {boss.v === "rgpd" && (
              <>
                <FicheView f={boss.fiche} showFlag={!!bossReveal} />
                {boss.sensitive && (
                  <div style={{ display: "flex", padding: "8px 12px", marginTop: 6, background: "#2a1420", border: `2px solid ${C.red}` }}>
                    <span style={{ ...S.mono, color: C.red, width: 92, flexShrink: 0 }}>{t.steward.boss.sensitiveLabel}</span>
                    <span style={{ ...S.mono, color: C.yellow, wordBreak: "break-all" }}>{boss.sensitive}</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => answerRgpd("validate")} disabled={!!bossReveal} style={{ ...S.big, fontSize: 10, borderColor: C.green, color: C.green, opacity: bossReveal ? 0.45 : 1 }}>{t.steward.boss.validate}</button>
                  <button onClick={() => answerRgpd("reject")} disabled={!!bossReveal} style={{ ...S.big, fontSize: 10, borderColor: C.red, color: C.red, opacity: bossReveal ? 0.45 : 1 }}>{t.steward.boss.reject}</button>
                  <button onClick={() => answerRgpd("rgpd")} disabled={!!bossReveal} style={{ ...S.big, fontSize: 10, borderColor: C.yellow, color: C.yellow, opacity: bossReveal ? 0.45 : 1 }}>{t.steward.boss.rgpd}</button>
                </div>
              </>
            )}

            {boss.v === "batch" && (
              <>
                <div style={{ fontFamily: PIX, fontSize: 7, color: C.dim, marginBottom: 8 }}>{t.steward.boss.batchHint}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {boss.fiches.map((f, i) => {
                    const choice = boss.choices[i];
                    const rowColor = bossReveal ? (choice === f.clean ? C.green : C.red) : C.line;
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                        background: C.bg, border: `2px solid ${rowColor}`, padding: "8px 10px" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ ...S.mono, color: C.ink }}>{f.nom}</div>
                          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.dim, wordBreak: "break-all" }}>
                            {f.email} · {f.tel} · {f.naissance} · {f.iban} · {f.ville}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => setBatchChoice(i, true)} disabled={!!bossReveal}
                            style={{ ...miniBtn, borderColor: choice === true ? C.green : C.line, color: choice === true ? C.green : C.dim }}>✓</button>
                          <button onClick={() => setBatchChoice(i, false)} disabled={!!bossReveal}
                            style={{ ...miniBtn, borderColor: choice === false ? C.red : C.line, color: choice === false ? C.red : C.dim }}>✗</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={submitBatch} disabled={!!bossReveal} style={{ ...S.primary, background: C.yellow, width: "100%", marginTop: 12, opacity: bossReveal ? 0.45 : 1 }}>{t.steward.boss.submit}</button>
              </>
            )}

            {boss.v === "doppel" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[boss.left, boss.right].map((f, i) => {
                  const isCorrect = bossReveal && i === boss.correct;
                  return (
                    <button key={i} onClick={() => answerDoppel(i as 0 | 1)} disabled={!!bossReveal}
                      style={{ flex: "1 1 45%", minWidth: 150, textAlign: "left", background: C.bg, cursor: bossReveal ? "default" : "pointer",
                        borderWidth: 2, borderStyle: "solid", borderColor: isCorrect ? C.green : C.line, padding: 0 }}>
                      <FicheView f={f} showFlag={!!bossReveal} />
                      <div style={{ fontFamily: PIX, fontSize: 8, color: isCorrect ? C.green : C.dim, textAlign: "center", padding: "8px 0" }}>
                        {t.steward.boss.validate.includes("✓") ? (i === 0 ? "◄ " : "") : ""}{t.steward.boss.submit && ""}{i === 0 ? "◄" : "►"} {i === 0 ? "A" : "B"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ minHeight: 30, marginTop: 12, textAlign: "center" }}>
            {bossReveal && (
              <div>
                <div style={{ fontFamily: PIX, fontSize: 12, color: bossReveal.ok ? C.green : C.red }}>
                  {bossReveal.ok ? t.steward.boss.cleared : t.steward.boss.failed}
                </div>
                {bossReveal.ok && <div style={{ ...S.p, fontSize: 16, color: C.green, marginTop: 5 }}>{t.steward.boss.bonus}</div>}
              </div>
            )}
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
          {score >= best && score > 0 && <div style={{ ...S.p, color: C.green, fontSize: 16, marginTop: 12 }}>{t.steward.newRecord}</div>}
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

const miniBtn = { fontFamily: PIX, fontSize: 10, background: C.bg, borderWidth: 2, borderStyle: "solid", padding: "8px 10px", cursor: "pointer" } as const;

const S = {
  p: { fontFamily: READ, fontSize: 18, lineHeight: 1.4, color: C.dim, textAlign: "center", margin: 0 } as const,
  mono: { fontFamily: "ui-monospace, monospace", fontSize: 13 } as const,
  hint: { fontFamily: READ, fontSize: 17, color: C.dim } as const,
  primary: { fontFamily: PIX, fontSize: 11, color: C.bg, background: C.green, border: "none", padding: "12px 16px", cursor: "pointer" } as const,
  ghost: { fontFamily: PIX, fontSize: 9, color: C.dim, background: "transparent", border: `1px solid ${C.line}`, padding: "8px 10px", cursor: "pointer" } as const,
  big: { flex: 1, fontFamily: PIX, fontSize: 12, background: C.bg, border: "2px solid", padding: "20px 8px", cursor: "pointer" } as const,
};
