"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { C, PIX, READ } from "@/lib/palette";
import { useI18n } from "@/lib/i18n";
import { useSound } from "@/lib/sound";
import Screen from "@/components/Screen";
import { ENEMIES, CHALLENGES, Challenge, QType, Loc } from "./enemies";

const PLAYER_HP = 100;
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

const BADGE: Record<QType, Loc> = {
  clause:    { fr: "◈ QUELLE CLAUSE ?", en: "◈ WHICH CLAUSE?" },
  fixerror:  { fr: "✗ TROUVE LE BUG",   en: "✗ FIND THE BUG" },
  fillblank: { fr: "▭ COMPLÈTE LE TROU", en: "▭ FILL THE BLANK" },
  output:    { fr: "▶ QUE RENVOIE-T-ELLE ?", en: "▶ WHAT DOES IT RETURN?" },
};

type Feedback = { ok: boolean } | null;

export default function SqlFighter() {
  const { t, lang } = useI18n();
  const { beep } = useSound();
  const L = (x: Loc) => x[lang];

  const [phase, setPhase] = useState<"intro" | "fight" | "win" | "over">("intro");
  const [enemyIndex, setEnemyIndex] = useState(0);
  const [enemyHp, setEnemyHp] = useState(ENEMIES[0].hp);
  const [playerHp, setPlayerHp] = useState(PLAYER_HP);
  const [combo, setCombo] = useState(1);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [best, setBest] = useState(0);
  const [ch, setCh] = useState<Challenge | null>(null);
  const [opts, setOpts] = useState<Loc[]>([]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [mode, setMode] = useState<"qcm" | "type">("qcm");
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [hurtEnemy, setHurtEnemy] = useState(false);
  const [hurtPlayer, setHurtPlayer] = useState(false);
  const scoreRef = useRef(0);
  const queueRef = useRef<string[]>([]);
  const lastIdRef = useRef<string>("");
  useEffect(() => { scoreRef.current = score; }, [score]);

  const enemy = ENEMIES[enemyIndex];
  const canType = !!ch?.match;
  const effectiveMode: "qcm" | "type" = canType ? mode : "qcm";

  const buildQueue = (e = enemy) =>
    shuffle(CHALLENGES.filter((c) => e.levels.includes(c.level)).map((c) => c.id));

  const loadChallenge = (e = enemy) => {
    if (queueRef.current.length === 0) queueRef.current = buildQueue(e);
    let id = queueRef.current.pop()!;
    if (id === lastIdRef.current && queueRef.current.length > 0) {
      queueRef.current.unshift(id);
      id = queueRef.current.pop()!;
    }
    lastIdRef.current = id;
    const c = CHALLENGES.find((x) => x.id === id)!;
    const indexed = c.options.map((o, i) => ({ o, ok: i === c.answer }));
    const sh = shuffle(indexed);
    setCh(c);
    setOpts(sh.map((x) => x.o));
    setCorrectIdx(sh.findIndex((x) => x.ok));
    setTyped("");
    setFeedback(null);
  };

  const start = () => {
    setEnemyIndex(0); setEnemyHp(ENEMIES[0].hp); setPlayerHp(PLAYER_HP);
    setCombo(1); setScore(0); setHits(0); setMisses(0);
    queueRef.current = buildQueue(ENEMIES[0]); lastIdRef.current = "";
    setPhase("fight"); loadChallenge(ENEMIES[0]);
  };

  const matchesTyped = () => {
    if (!ch?.match) return false;
    const norm = typed.toUpperCase().replace(/\s+/g, " ").trim();
    return ch.match.every((tok) => norm.includes(tok));
  };

  const resolve = (ok: boolean) => {
    if (feedback || !ch) return;
    let newEnemyHp = enemyHp, newPlayerHp = playerHp;
    if (ok) {
      const dmg = Math.min(60, 28 + combo * 6);
      newEnemyHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newEnemyHp);
      setCombo((c) => Math.min(c + 1, 9));
      setScore((s) => s + 100 * combo * ch.level);
      setHits((h) => h + 1);
      setHurtEnemy(true);
      beep([[660, 0.06], [880, 0.09]]);
      setFeedback({ ok: true });
    } else {
      newPlayerHp = Math.max(0, playerHp - enemy.power);
      setPlayerHp(newPlayerHp);
      setCombo(1);
      setMisses((m) => m + 1);
      setHurtPlayer(true);
      beep([[200, 0.16], [140, 0.14]]);
      setFeedback({ ok: false });
    }
    setTimeout(() => {
      setHurtEnemy(false); setHurtPlayer(false);
      if (newPlayerHp <= 0) { setBest((b) => Math.max(b, scoreRef.current)); setPhase("over"); }
      else if (newEnemyHp <= 0) {
        if (enemyIndex + 1 >= ENEMIES.length) { setBest((b) => Math.max(b, scoreRef.current)); setPhase("win"); }
        else {
          const ni = enemyIndex + 1;
          setEnemyIndex(ni); setEnemyHp(ENEMIES[ni].hp); setCombo(1);
          queueRef.current = buildQueue(ENEMIES[ni]); lastIdRef.current = "";
          loadChallenge(ENEMIES[ni]);
        }
      } else loadChallenge(enemy);
    }, 1250);
  };

  // Clavier : 1-4 en QCM, Entrée pour démarrer/rejouer
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((phase === "intro" || phase === "win" || phase === "over") && (e.key === "Enter" || e.key === " ")) start();
      else if (phase === "fight" && effectiveMode === "qcm" && !feedback) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= opts.length) resolve(n - 1 === correctIdx);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, effectiveMode, feedback, opts, correctIdx, enemyHp, playerHp, combo, enemyIndex, ch]);

  const acc = hits + misses ? Math.round((hits / (hits + misses)) * 100) : 0;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {phase === "intro" && (
        <Screen>
          <h2 style={{ fontFamily: PIX, fontSize: 16, color: C.purple, margin: "4px 0 18px" }}>{t.sql.title}</h2>
          <p style={St.p}>{t.sql.intro1}</p>
          <p style={{ ...St.p, color: C.ink, margin: "10px 0" }}>{t.sql.intro2}</p>
          <p style={{ ...St.p, fontSize: 16, color: C.dim, marginTop: 12 }}>{t.sql.rules}</p>
          <button onClick={start} style={{ ...St.primary, background: C.purple, marginTop: 18 }}>{t.sql.insertCoin}</button>
        </Screen>
      )}

      {phase === "fight" && ch && (
        <Screen>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: PIX, fontSize: 9, marginBottom: 6 }}>
            <span style={{ color: enemy.boss ? C.red : C.ink }}>{enemy.boss ? "☠ " : ""}{t.sql.enemies[enemy.id]}</span>
            <span style={{ color: C.dim }}>{"◆".repeat(ch.level)}</span>
          </div>
          <Bar pct={enemyHp / enemy.hp} color={enemy.color} />

          <div style={{ display: "flex", justifyContent: "center", margin: "14px 0", animation: hurtEnemy ? "arcShake 260ms" : "none" }}>
            <EnemySprite id={enemy.id} color={enemy.color} boss={enemy.boss} />
          </div>

          {/* énoncé */}
          <div style={{ background: C.bg, border: `2px solid ${C.line}`, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontFamily: PIX, fontSize: 8, color: C.purple, marginBottom: 8 }}>{L(BADGE[ch.type])}</div>
            <div style={{ fontFamily: READ, fontSize: 18, color: C.ink, lineHeight: 1.35 }}>{L(ch.prompt)}</div>
            {ch.code && (
              <pre style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: C.green, background: "#0c0d16",
                border: `1px solid ${C.line}`, padding: "10px 12px", marginTop: 10, marginBottom: 0, whiteSpace: "pre-wrap", overflowX: "auto" }}>
{ch.code}</pre>
            )}
          </div>

          {/* bascule mode (saisie seulement si la question s'y prête) */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={() => setMode("qcm")} style={{ ...St.tab, ...(effectiveMode === "qcm" ? St.tabOn : {}) }}>{t.sql.qcm}</button>
            <button onClick={() => canType && setMode("type")} disabled={!canType}
              style={{ ...St.tab, ...(effectiveMode === "type" ? St.tabOn : {}), opacity: canType ? 1 : 0.35, cursor: canType ? "pointer" : "not-allowed" }}>
              {t.sql.type}
            </button>
          </div>

          {effectiveMode === "qcm" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {opts.map((o, i) => {
                const reveal = feedback && i === correctIdx;
                return (
                  <button key={i} onClick={() => resolve(i === correctIdx)} disabled={!!feedback}
                    style={{ ...St.opt, borderColor: reveal ? C.green : C.line, color: reveal ? C.green : C.ink,
                      opacity: feedback && !reveal ? 0.4 : 1 }}>
                    <span style={{ color: C.dim, marginRight: 8 }}>{i + 1}.</span>{L(o)}{reveal ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} disabled={!!feedback}
                placeholder={t.sql.placeholder} spellCheck={false} autoCapitalize="off"
                onKeyDown={(e) => { if (e.key === "Enter" && !feedback) resolve(matchesTyped()); }}
                style={{ flex: 1, fontFamily: "ui-monospace, monospace", fontSize: 16, background: C.bg, color: C.ink,
                  border: `2px solid ${C.line}`, padding: "12px", outline: "none" }} />
              <button onClick={() => resolve(matchesTyped())} disabled={!!feedback} style={{ ...St.primary, background: C.purple }}>{t.sql.submit}</button>
            </div>
          )}

          {/* feedback + explication */}
          <div style={{ minHeight: 40, marginTop: 12, textAlign: "center" }}>
            {feedback && (
              <div>
                <div style={{ fontFamily: PIX, fontSize: 12, color: feedback.ok ? C.green : C.red }}>
                  {feedback.ok ? t.sql.hit : t.sql.miss}
                </div>
                <div style={{ fontFamily: READ, fontSize: 16, color: C.dim, marginTop: 5, lineHeight: 1.35 }}>{L(ch.explain)}</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: PIX, fontSize: 9, margin: "6px 0 6px" }}>
            <span style={{ color: C.green }}>{t.sql.you}</span>
            <span style={{ color: combo > 1 ? C.purple : C.dim }}>{t.sql.combo} x{combo}</span>
          </div>
          <div style={{ animation: hurtPlayer ? "arcShake 260ms" : "none" }}>
            <Bar pct={playerHp / PLAYER_HP} color={C.green} />
          </div>
        </Screen>
      )}

      {(phase === "win" || phase === "over") && (
        <Screen>
          <div style={{ border: `2px solid ${phase === "win" ? C.green : C.red}`, padding: "20px 18px", background: C.bg, boxShadow: `0 0 0 4px ${C.panel}` }}>
            <div style={{ fontFamily: PIX, fontSize: 8, color: C.purple, textAlign: "center" }}>DATA ARCADE</div>
            <div style={{ fontFamily: PIX, fontSize: 10, color: C.dim, textAlign: "center", marginTop: 6 }}>{t.sql.title}</div>
            <div style={{ fontFamily: PIX, fontSize: 16, color: phase === "win" ? C.green : C.red, textAlign: "center", margin: "16px 0 6px" }}>
              {phase === "win" ? t.sql.victory : t.sql.defeat}
            </div>
            <div style={{ fontFamily: PIX, fontSize: 30, color: C.yellow, textAlign: "center", margin: "6px 0 4px" }}>{score}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 16 }}>
              <Stat label={t.sql.slain} value={hits} />
              <Stat label={t.sql.accuracy} value={`${acc}%`} />
              <Stat label={t.sql.best} value={Math.max(best, score)} />
            </div>
            <div style={{ fontFamily: PIX, fontSize: 7, color: C.dim, textAlign: "center", marginTop: 18 }}>▸ heykelhachiche.com</div>
          </div>
          {score >= best && score > 0 && <div style={{ ...St.p, color: C.green, fontSize: 16, marginTop: 12 }}>{t.sql.newRecord}</div>}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={start} style={{ ...St.primary, background: C.purple }}>{t.sql.replay}</button>
            <Link href="/" style={{ ...St.ghost, textDecoration: "none" }}>{t.sql.backCabinet}</Link>
          </div>
        </Screen>
      )}
    </div>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 12, background: C.bg, border: `1px solid ${C.line}` }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(1, pct)) * 100}%`, background: color, transition: "width 200ms ease" }} />
    </div>
  );
}

function EnemySprite({ id, color, boss }: { id: string; color: string; boss?: boolean }) {
  const s = boss ? 132 : 104;
  const P = { imageRendering: "pixelated" as const };
  const eye = C.bg, glint = C.ink;

  if (id === "dupe") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} shapeRendering="crispEdges" style={P}>
        <rect x="13" y="8" width="11" height="13" fill={color} opacity="0.45" />
        <rect x="8" y="6" width="11" height="13" fill={color} />
        <rect x="10" y="9" width="3" height="3" fill={eye} /><rect x="14" y="9" width="3" height="3" fill={eye} />
        <rect x="11" y="10" width="1" height="1" fill={glint} /><rect x="15" y="10" width="1" height="1" fill={glint} />
        <rect x="10" y="15" width="7" height="2" fill={eye} />
        <rect x="8" y="19" width="3" height="3" fill={color} /><rect x="16" y="19" width="3" height="3" fill={color} />
      </svg>
    );
  }
  if (id === "nullz") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} shapeRendering="crispEdges" style={P}>
        <rect x="7" y="4" width="3" height="3" fill={color} /><rect x="22" y="4" width="3" height="3" fill={color} />
        <rect x="8" y="7" width="16" height="15" fill={color} />
        <rect x="6" y="11" width="2" height="7" fill={color} /><rect x="24" y="11" width="2" height="7" fill={color} />
        <rect x="10" y="10" width="4" height="4" fill={eye} /><rect x="18" y="10" width="4" height="4" fill={eye} />
        <rect x="11" y="11" width="2" height="2" fill={C.red} /><rect x="19" y="11" width="2" height="2" fill={C.red} />
        <rect x="9" y="16" width="14" height="2" fill={C.bg} />
        <rect x="10" y="18" width="2" height="2" fill={C.ink} /><rect x="14" y="18" width="2" height="2" fill={C.ink} /><rect x="18" y="18" width="2" height="2" fill={C.ink} />
        <rect x="9" y="21" width="14" height="5" fill={C.bg} />
        <text x="16" y="25" textAnchor="middle" fontSize="4" fill={color} fontFamily="monospace" fontWeight="bold">NULL</text>
      </svg>
    );
  }
  if (id === "space") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} shapeRendering="crispEdges" style={P}>
        <rect x="4" y="6" width="3" height="3" fill={color} opacity="0.5" /><rect x="25" y="6" width="3" height="3" fill={color} opacity="0.5" />
        <rect x="4" y="22" width="3" height="3" fill={color} opacity="0.5" /><rect x="25" y="22" width="3" height="3" fill={color} opacity="0.5" />
        <rect x="10" y="7" width="12" height="14" fill={color} />
        <rect x="9" y="10" width="1" height="11" fill={color} /><rect x="22" y="10" width="1" height="11" fill={color} />
        <rect x="10" y="21" width="2" height="3" fill={color} /><rect x="14" y="21" width="2" height="3" fill={color} />
        <rect x="18" y="21" width="2" height="3" fill={color} /><rect x="20" y="21" width="2" height="3" fill={color} />
        <rect x="12" y="11" width="3" height="3" fill={eye} /><rect x="17" y="11" width="3" height="3" fill={eye} />
        <rect x="6" y="14" width="2" height="6" fill={C.dim} /><rect x="6" y="14" width="4" height="1" fill={C.dim} /><rect x="6" y="19" width="4" height="1" fill={C.dim} />
        <rect x="24" y="14" width="2" height="6" fill={C.dim} /><rect x="22" y="14" width="4" height="1" fill={C.dim} /><rect x="22" y="19" width="4" height="1" fill={C.dim} />
      </svg>
    );
  }
  if (id === "flood") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} shapeRendering="crispEdges" style={P}>
        <rect x="7" y="5" width="18" height="22" fill={color} />
        <rect x="9" y="7" width="14" height="2" fill={C.bg} /><rect x="9" y="10" width="14" height="2" fill={C.bg} />
        <rect x="9" y="13" width="14" height="2" fill={C.bg} /><rect x="9" y="16" width="14" height="2" fill={C.bg} />
        <rect x="9" y="19" width="14" height="2" fill={C.bg} /><rect x="9" y="22" width="14" height="2" fill={C.bg} />
        <rect x="20" y="7" width="2" height="2" fill={C.green} /><rect x="20" y="13" width="2" height="2" fill={C.red} />
        <rect x="17" y="15" width="7" height="7" fill="none" stroke={C.yellow} strokeWidth="1.5" />
        <rect x="23" y="21" width="4" height="2" fill={C.yellow} transform="rotate(45 25 22)" />
      </svg>
    );
  }
  if (id === "legacy") {
    return (
      <svg viewBox="0 0 32 32" width={s} height={s} shapeRendering="crispEdges" style={P}>
        <rect x="8" y="1" width="2" height="4" fill={C.yellow} /><rect x="15" y="0" width="2" height="5" fill={C.yellow} /><rect x="22" y="1" width="2" height="4" fill={C.yellow} />
        <rect x="8" y="4" width="16" height="2" fill={C.yellow} />
        <rect x="4" y="6" width="24" height="18" fill="#c8c8c8" />
        <rect x="6" y="8" width="20" height="12" fill="#1c3a2a" />
        <rect x="6" y="11" width="20" height="1" fill={C.green} /><rect x="6" y="14" width="20" height="1" fill={C.green} /><rect x="6" y="17" width="20" height="1" fill={C.green} />
        <rect x="12" y="8" width="1" height="12" fill={C.green} /><rect x="19" y="8" width="1" height="12" fill={C.green} />
        <rect x="8" y="9" width="3" height="2" fill={C.red} /><rect x="21" y="9" width="3" height="2" fill={C.red} />
        <rect x="12" y="24" width="8" height="2" fill="#9a9a9a" /><rect x="9" y="26" width="14" height="2" fill="#7a7a7a" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" width={s} height={s} shapeRendering="crispEdges" style={P}>
      <rect x="8" y="8" width="16" height="14" fill={color} />
      <rect x="11" y="12" width="3" height="3" fill={C.bg} /><rect x="18" y="12" width="3" height="3" fill={C.bg} />
    </svg>
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

const St = {
  p: { fontFamily: READ, fontSize: 18, lineHeight: 1.4, color: C.dim, textAlign: "center", margin: 0 } as const,
  primary: { fontFamily: PIX, fontSize: 11, color: C.bg, border: "none", padding: "12px 16px", cursor: "pointer" } as const,
  ghost: { fontFamily: PIX, fontSize: 9, color: C.dim, background: "transparent", border: `1px solid ${C.line}`, padding: "8px 10px", cursor: "pointer" } as const,
  opt: { fontFamily: READ, fontSize: 18, textAlign: "left", background: C.bg, borderWidth: 2, borderStyle: "solid", padding: "12px 14px", cursor: "pointer" } as const,
  tab: { flex: 1, fontFamily: PIX, fontSize: 8, color: C.dim, background: "transparent", borderWidth: 1, borderStyle: "solid", borderColor: C.line, padding: "8px", cursor: "pointer" } as const,
  tabOn: { color: C.ink, borderColor: C.purple } as const,
};
