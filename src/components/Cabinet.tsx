import { ReactNode } from "react";
import { C } from "@/lib/palette";

export const emblems: Record<string, ReactNode> = {
  steward: (<><rect x="-2" y="-6" width="4" height="6" /><rect x="-6" y="0" width="12" height="4" /><rect x="-8" y="4" width="16" height="3" /></>),
  pipe: (<><rect x="-8" y="-2" width="6" height="4" /><rect x="-2" y="-2" width="4" height="8" /><rect x="2" y="2" width="6" height="4" /></>),
  sword: (<><rect x="-1" y="-8" width="3" height="12" /><rect x="-4" y="4" width="9" height="2" /><rect x="-1" y="6" width="3" height="3" /></>),
  coin: (<><rect x="-5" y="-5" width="10" height="10" /><rect x="-3" y="-3" width="6" height="6" fill={C.bg} /><rect x="-1" y="-3" width="2" height="6" fill={C.yellow} /></>),
};

export default function Cabinet({ screen, emblem, dim }: { screen: string; emblem: ReactNode; dim?: boolean }) {
  return (
    <svg viewBox="0 0 64 88" width="100%" height="110" shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated", opacity: dim ? 0.55 : 1 }}>
      <rect x="8" y="4" width="48" height="80" fill={C.panel2} />
      <rect x="8" y="4" width="48" height="80" fill="none" stroke={C.line} />
      <rect x="12" y="8" width="40" height="10" fill={screen} opacity="0.35" />
      <rect x="12" y="8" width="40" height="10" fill="none" stroke={C.line} />
      <rect x="12" y="22" width="40" height="30" fill={C.bg} />
      <rect x="12" y="22" width="40" height="30" fill={screen} opacity="0.14" />
      <rect x="12" y="22" width="40" height="30" fill="none" stroke={screen} />
      <g transform="translate(26 30)" fill={screen}>{emblem}</g>
      <rect x="12" y="56" width="40" height="10" fill={C.panel} />
      <circle cx="20" cy="61" r="2.4" fill={C.red} />
      <circle cx="27" cy="61" r="2.4" fill={C.yellow} />
      <rect x="40" y="59" width="8" height="4" fill={C.blue} />
      <rect x="14" y="70" width="36" height="14" fill={C.panel} />
    </svg>
  );
}
