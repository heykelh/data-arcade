import { ReactNode } from "react";
import { C } from "@/lib/palette";

export default function Screen({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: C.panel, border: `2px solid ${C.line}`, padding: "22px 20px",
      boxShadow: `0 0 0 4px ${C.bg}, 0 0 0 6px ${C.line}` }}>
      {children}
    </div>
  );
}
