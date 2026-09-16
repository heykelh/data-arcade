"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { C, PIX, READ } from "@/lib/palette";
import { useI18n } from "@/lib/i18n";
import { useSound } from "@/lib/sound";
import Screen from "@/components/Screen";
import { generate, flowSet, Grid, Cell } from "./generate";

const EMPTY = "#4a4e70", FLOW = C.blue, PACKET = "#bfe3ff", BRONZE = "#c8862f", CLEAN = "#38d0c0";
const sizeFor = (lvl: number) => Math.min(6, 4 + Math.floor((lvl - 1) / 3));
const blocksFor = (lvl: number) => Math.min(sizeFor(lvl), Math.floor((lvl - 1) / 2));

export default function PipePlumber() {
  const { t } = useI18n();
  const { beep } = useSound();

  const [phase, setPhase] = useState<"intro" | "play" | "over">("intro");
  const [grid, setGrid] = useState<Grid | null>(null);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(60000);
  const [solving, setSolving] = useState(false);
  const solvingRef = useRef(false);
  const scoreRef = useRef(0);
  useEffect(() => { solvingRef.current = solving; }, [solving]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const genLevel = (l: number) => { setGrid(generate(sizeFor(l), sizeFor(l), blocksFor(l), l >= 3)); setMoves(0); };
  const start = () => {
    setLevel(1); setScore(0); setMoves(0); setTimeLeftMs(60000);
    setSolving(false); solvingRef.current = false;
    genLevel(1); setPhase("play");
  };

  const filled = grid ? flowSet(grid) : new Set<number>();
  const goldIdx = grid ? grid.gr * grid.cols + grid.gc : -1;
  let cleanIdx = -1;
  if (grid) grid.cells.forEach((row, r) => row.forEach((cell, c) => { if (cell.type === "clean") cleanIdx = r * grid.cols + c; }));
  const goldLit = filled.has(goldIdx);
  const cleanLit = cleanIdx < 0 || filled.has(cleanIdx);
  const solved = phase === "play" && !!grid && goldLit && cleanLit;
  const needClean = goldLit && !cleanLit;

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      if (solvingRef.current) return;
      setTimeLeftMs((tm) => {
        const n = tm - 100;
        if (n <= 0) { setBest((b) => Math.max(b, scoreRef.current)); setPhase("over"); return 0; }
        return n;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!solved || solving) return;
    setSolving(true); solvingRef.current = true;
    beep([[660, 0.06], [880, 0.08], [1047, 0.14]]);
    setScore((s) => s + 120 * level + Math.max(0, 100 - moves * 5));
    const to = setTimeout(() => {
      setTimeLeftMs((tm) => tm + 12000);
      const nl = level + 1; setLevel(nl); genLevel(nl);
      setSolving(false); solvingRef.current = false;
    }, 1300);
    return () => clearTimeout(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved]);

  const rotate = (r: number, c: number) => {
    if (!grid || phase !== "play" || solving) return;
    const cell = grid.cells[r][c];
    if (cell.fixed || cell.type === "block") return;
    beep([[440, 0.03]]);
    setGrid((g) => {
      if (!g) return g;
      const cells = g.cells.map((row) => row.slice());
      cells[r][c] = { ...cells[r][c], quarter: (cells[r][c].quarter + 1) % 4 };
      return { ...g, cells };
    });
    setMoves((m) => m + 1);
  };

  const secs = Math.max(0, Math.ceil(timeLeftMs / 1000));
  const lowTime = secs <= 10;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <style>{`@keyframes pipeflow { to { stroke-dashoffset: -48; } } .arc-flow { animation: pipeflow .7s linear infinite; }`}</style>

      {phase === "intro" && (
        <Screen>
          <h2 style={{ fontFamily: PIX, fontSize: 16, color: C.blue, margin: "4px 0 18px" }}>{t.pipe.title}</h2>
          <p style={St.p}>{t.pipe.intro1}</p>
          <p style={{ ...St.p, color: C.ink, margin: "10px 0" }}>{t.pipe.intro2}</p>
          <p style={{ ...St.p, fontSize: 16, color: C.dim, marginTop: 12 }}>{t.pipe.rules}</p>
          <button onClick={start} style={{ ...St.primary, background: C.blue, marginTop: 18 }}>{t.pipe.insertCoin}</button>
        </Screen>
      )}

      {phase === "play" && grid && (
        <Screen>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: PIX, fontSize: 9, marginBottom: 8 }}>
            <span style={{ color: C.dim }}>{t.pipe.level} <span style={{ color: C.ink }}>{level}</span></span>
            <span style={{ color: C.dim }}>{t.pipe.moves} <span style={{ color: C.ink }}>{moves}</span></span>
            <span style={{ color: lowTime ? C.red : C.dim }}>{t.pipe.time} <span style={{ color: lowTime ? C.red : C.yellow }}>{secs}s</span></span>
          </div>
          <div style={{ height: 8, background: C.bg, border: `1px solid ${C.line}`, marginBottom: 14 }}>
            <div style={{ height: "100%", width: `${Math.min(100, (timeLeftMs / 60000) * 100)}%`,
              background: lowTime ? C.red : C.blue, transition: "width 120ms linear" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, gap: 4,
            maxWidth: 380, margin: "0 auto",
            boxShadow: solving ? `0 0 22px ${FLOW}66` : "none", padding: 4, background: C.bg, border: `2px solid ${C.line}` }}>
            {grid.cells.map((row, r) =>
              row.map((cell, c) => (
                <PipeCell key={`${r}-${c}`} cell={cell} lit={filled.has(r * grid.cols + c)} onClick={() => rotate(r, c)} />
              ))
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 12, fontFamily: PIX, fontSize: 7, flexWrap: "wrap" }}>
            <span style={{ color: BRONZE }}>● {t.pipe.bronze}</span>
            <span style={{ color: CLEAN }}>◆ {t.pipe.clean}</span>
            <span style={{ color: C.yellow }}>● {t.pipe.gold}</span>
            <span style={{ color: C.red }}>▧ DATA ✗</span>
          </div>

          <div style={{ minHeight: 26, marginTop: 8, textAlign: "center" }}>
            {solving && <div style={{ fontFamily: PIX, fontSize: 12, color: C.green }}>{t.pipe.solved}</div>}
            {!solving && needClean && <div style={{ fontFamily: READ, fontSize: 16, color: CLEAN }}>{t.pipe.needClean}</div>}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 4, justifyContent: "center" }}>
            <button onClick={() => genLevel(level)} disabled={solving} style={{ ...St.ghost, opacity: solving ? 0.4 : 1 }}>{t.pipe.newLevel}</button>
          </div>
        </Screen>
      )}

      {phase === "over" && (
        <Screen>
          <div style={{ border: `2px solid ${C.blue}`, padding: "20px 18px", background: C.bg, boxShadow: `0 0 0 4px ${C.panel}` }}>
            <div style={{ fontFamily: PIX, fontSize: 8, color: C.purple, textAlign: "center" }}>DATA ARCADE</div>
            <div style={{ fontFamily: PIX, fontSize: 10, color: C.dim, textAlign: "center", marginTop: 6 }}>{t.pipe.title}</div>
            <div style={{ fontFamily: PIX, fontSize: 13, color: C.red, textAlign: "center", margin: "14px 0 6px" }}>{t.pipe.timeUp}</div>
            <div style={{ fontFamily: PIX, fontSize: 30, color: C.yellow, textAlign: "center", margin: "6px 0 4px" }}>{score}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 16 }}>
              <Stat label={t.pipe.cleared} value={level - 1} />
              <Stat label={t.pipe.best} value={Math.max(best, score)} />
            </div>
            <div style={{ fontFamily: PIX, fontSize: 7, color: C.dim, textAlign: "center", marginTop: 18 }}>▸ heykelhachiche.com</div>
          </div>
          {score >= best && score > 0 && <div style={{ ...St.p, color: C.green, fontSize: 16, marginTop: 12 }}>{t.pipe.newRecord}</div>}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={start} style={{ ...St.primary, background: C.blue }}>{t.pipe.replay}</button>
            <Link href="/" style={{ ...St.ghost, textDecoration: "none" }}>{t.pipe.backCabinet}</Link>
          </div>
        </Screen>
      )}
    </div>
  );
}

function PipeCell({ cell, lit, onClick }: { cell: Cell; lit: boolean; onClick: () => void }) {
  if (cell.type === "block") {
    return (
      <div style={{ aspectRatio: "1", background: "#2a1622", border: `1px solid ${C.red}`, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <span style={{ fontFamily: PIX, fontSize: 7, color: C.red }}>▧</span>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: "#ff8fa3" }}>{cell.label}</span>
      </div>
    );
  }
  const color = lit ? FLOW : EMPTY;
  const m = cell.base;
  const clickable = !cell.fixed;
  const arms: [number, number, number, number][] = [];
  if (m & 1) arms.push([50, 50, 50, 0]);
  if (m & 4) arms.push([50, 50, 50, 100]);
  if (m & 2) arms.push([50, 50, 100, 50]);
  if (m & 8) arms.push([50, 50, 0, 50]);

  return (
    <button onClick={onClick} disabled={!clickable}
      style={{ aspectRatio: "1", padding: 0, border: `1px solid ${C.line}`, background: C.bg2,
        cursor: clickable ? "pointer" : "default", overflow: "hidden" }}>
      <div style={{ width: "100%", height: "100%", transform: `rotate(${cell.quarter * 90}deg)`, transition: "transform 150ms ease" }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }}>
          {arms.map((a, i) => <line key={`b${i}`} x1={a[0]} y1={a[1]} x2={a[2]} y2={a[3]} stroke={color} strokeWidth={20} />)}
          {m !== 0 && <rect x={38} y={38} width={24} height={24} rx={3} fill={color} />}
          {lit && arms.map((a, i) => (
            <line key={`p${i}`} className="arc-flow" x1={a[0]} y1={a[1]} x2={a[2]} y2={a[3]}
              stroke={PACKET} strokeWidth={8} strokeDasharray="6 18" strokeLinecap="butt" />
          ))}
          {cell.type === "bronze" && <circle cx={50} cy={50} r={16} fill={BRONZE} stroke={C.bg} strokeWidth={3} />}
          {cell.type === "gold" && <circle cx={50} cy={50} r={16} fill={C.yellow} stroke={C.bg} strokeWidth={3} />}
          {cell.type === "clean" && (
            <g transform="rotate(45 50 50)">
              <rect x={38} y={38} width={24} height={24} fill={CLEAN} stroke={C.bg} strokeWidth={3} />
            </g>
          )}
        </svg>
      </div>
    </button>
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
  ghost: { fontFamily: PIX, fontSize: 9, color: C.dim, background: "transparent", border: `1px solid ${C.line}`, padding: "8px 12px", cursor: "pointer" } as const,
};
