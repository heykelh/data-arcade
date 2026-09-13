export const C = {
  bg: "#12131f", bg2: "#1a1c2c", panel: "#232538", panel2: "#2e3150",
  line: "#3a3d5c", ink: "#f4f4f8", dim: "#8b8fb0",
  green: "#4bd66c", red: "#f24e6b", yellow: "#ffcd75", blue: "#4aa8ff", purple: "#b478ff",
} as const;

// La police est auto-hébergée via next/font (voir layout.tsx) et exposée en variable CSS.
export const PIX = "var(--font-press-start), ui-monospace, 'Courier New', monospace";
