export type CellType = "bronze" | "gold" | "pipe" | "block" | "clean";
export type Cell = { type: CellType; base: number; quarter: number; fixed: boolean; label?: string };
export type Grid = { cells: Cell[][]; rows: number; cols: number; sr: number; sc: number; gr: number; gc: number };

// Directions en bits : N=1, E=2, S=4, W=8
const DELTA: Record<number, [number, number, number]> = {
  1: [-1, 0, 4], 2: [0, 1, 8], 4: [1, 0, 1], 8: [0, -1, 2],
};
export const rotateCW = (m: number) => ((m << 1) | (m >> 3)) & 15;
export const rotateN = (m: number, n: number) => { let x = m; for (let i = 0; i < (n & 3); i++) x = rotateCW(x); return x; };
export const effMask = (c: Cell) => rotateN(c.base, c.quarter);

const ERR_LABELS = ["NULL", "DUP", "#999", "0/0", "' '", "NaN", "∅", "32/13"];
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const dirBit = (from: [number, number], to: [number, number]) => {
  const dr = to[0] - from[0], dc = to[1] - from[1];
  if (dr === -1) return 1; if (dr === 1) return 4; if (dc === 1) return 2; return 8;
};

function carvePath(rows: number, cols: number, sr: number, sc: number, gr: number, gc: number): [number, number][] | null {
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const path: [number, number][] = [];
  function dfs(r: number, c: number): boolean {
    visited[r][c] = true; path.push([r, c]);
    if (r === gr && c === gc) return true;
    for (const b of shuffle([1, 2, 4, 8])) {
      const [dr, dc] = DELTA[b]; const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && dfs(nr, nc)) return true;
    }
    path.pop(); visited[r][c] = false; return false;
  }
  return dfs(sr, sc) ? path : null;
}

export function flowSet(g: Grid): Set<number> {
  const start = g.sr * g.cols + g.sc;
  const seen = new Set<number>([start]);
  const stack: [number, number][] = [[g.sr, g.sc]];
  while (stack.length) {
    const [r, c] = stack.pop()!;
    const m = effMask(g.cells[r][c]);
    for (const b of [1, 2, 4, 8]) {
      if (!(m & b)) continue;
      const [dr, dc, opp] = DELTA[b]; const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= g.rows || nc < 0 || nc >= g.cols) continue;
      const nb = g.cells[nr][nc];
      if (nb.type === "block" || !(effMask(nb) & opp)) continue;
      const id = nr * g.cols + nc;
      if (!seen.has(id)) { seen.add(id); stack.push([nr, nc]); }
    }
  }
  return seen;
}
export const goldReached = (g: Grid) => flowSet(g).has(g.gr * g.cols + g.gc);

const STRAIGHTS = [5, 10];
const ELBOWS = [3, 6, 12, 9];

export function generate(rows: number, cols: number, nBlocks: number, withClean: boolean): Grid {
  let path: [number, number][] | null = null, sr = 0, gr = 0, tries = 0;
  const sc = 0, gc = cols - 1;
  while (!path && tries < 40) {
    sr = Math.floor(Math.random() * rows);
    gr = Math.floor(Math.random() * rows);
    path = carvePath(rows, cols, sr, sc, gr, gc); tries++;
  }
  if (!path) { sr = 0; gr = 0; path = []; for (let c = 0; c < cols; c++) path.push([0, c]); }

  const onPath = new Set(path.map(([r, c]) => r * cols + c));
  const cells: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: "block" as CellType, base: 0, quarter: 0, fixed: false })));

  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i]; let m = 0;
    if (i > 0) m |= dirBit(path[i], path[i - 1]);
    if (i < path.length - 1) m |= dirBit(path[i], path[i + 1]);
    const isS = i === 0, isG = i === path.length - 1;
    cells[r][c] = { type: isS ? "bronze" : isG ? "gold" : "pipe", base: m, quarter: 0, fixed: isS || isG };
  }

  // Nœud CLEAN obligatoire sur le trajet (niveaux avancés)
  if (withClean && path.length >= 4) {
    const [r, c] = path[Math.floor(path.length / 2)];
    if (cells[r][c].type === "pipe") cells[r][c].type = "clean";
  }

  const free: [number, number][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!onPath.has(r * cols + c)) free.push([r, c]);
  const blockSet = new Set(shuffle(free).slice(0, Math.min(nBlocks, free.length)).map(([r, c]) => r * cols + c));
  for (const [r, c] of free) {
    if (blockSet.has(r * cols + c)) cells[r][c] = { type: "block", base: 0, quarter: 0, fixed: false, label: ERR_LABELS[Math.floor(Math.random() * ERR_LABELS.length)] };
    else {
      const base = Math.random() < 0.4 ? STRAIGHTS[Math.floor(Math.random() * 2)] : ELBOWS[Math.floor(Math.random() * 4)];
      cells[r][c] = { type: "pipe", base, quarter: Math.floor(Math.random() * 4), fixed: false };
    }
  }
  for (let i = 1; i < path.length - 1; i++) { const [r, c] = path[i]; cells[r][c].quarter = Math.floor(Math.random() * 4); }

  const g: Grid = { cells, rows, cols, sr, sc, gr, gc };
  let guard = 0;
  while (goldReached(g) && guard < 12 && path.length > 2) {
    const [r, c] = path[Math.max(1, Math.floor(path.length / 3))];
    g.cells[r][c].quarter = (g.cells[r][c].quarter + 1) % 4; guard++;
  }
  return g;
}
