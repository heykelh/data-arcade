import { C } from "@/lib/palette";

export function grade(score: number): { key: string; color: string } {
  if (score >= 6000) return { key: "cdo", color: C.purple };
  if (score >= 3000) return { key: "guardian", color: C.blue };
  if (score >= 1600) return { key: "lead", color: C.green };
  if (score >= 800) return { key: "steward", color: C.green };
  if (score >= 300) return { key: "junior", color: C.yellow };
  return { key: "intern", color: C.dim };
}
