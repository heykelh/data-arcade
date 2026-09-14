export type ClauseId = "distinct" | "notnull" | "trim" | "limit" | "lower" | "groupby" | "cast" | "join";

// Le SQL est universel → pas besoin de traduction pour les clauses
export const CLAUSES: Record<ClauseId, string> = {
  distinct: "SELECT DISTINCT …",
  notnull: "WHERE … IS NOT NULL",
  trim: "TRIM(col)",
  limit: "LIMIT 1000",
  lower: "LOWER(col)",
  groupby: "GROUP BY customer_id",
  cast: "CAST(col AS DATE)",
  join: "JOIN customers ON …",
};

// Jetons à retrouver dans la saisie libre (mode ⌨) — tout en MAJ, espaces réduits
export const CLAUSE_MATCH: Record<ClauseId, string[]> = {
  distinct: ["DISTINCT"],
  notnull: ["IS NOT NULL"],
  trim: ["TRIM"],
  limit: ["LIMIT"],
  lower: ["LOWER"],
  groupby: ["GROUP BY"],
  cast: ["CAST"],
  join: ["JOIN"],
};

export type MenaceId = "dup" | "nullz" | "space" | "flood" | "caseMix" | "ungrouped" | "baddate" | "orphan";

// Chaque menace = un problème data → la clause qui la terrasse
export const MENACES: Record<MenaceId, { answer: ClauseId }> = {
  dup: { answer: "distinct" },
  nullz: { answer: "notnull" },
  space: { answer: "trim" },
  flood: { answer: "limit" },
  caseMix: { answer: "lower" },
  ungrouped: { answer: "groupby" },
  baddate: { answer: "cast" },
  orphan: { answer: "join" },
};

export type Enemy = { id: string; color: string; hp: number; power: number; boss?: boolean; pool: MenaceId[] };

export const ENEMIES: Enemy[] = [
  { id: "dupe", color: "#4aa8ff", hp: 100, power: 16, pool: ["dup", "caseMix"] },
  { id: "nullz", color: "#4bd66c", hp: 110, power: 18, pool: ["nullz", "orphan"] },
  { id: "space", color: "#ffcd75", hp: 120, power: 20, pool: ["space", "caseMix"] },
  { id: "flood", color: "#b478ff", hp: 130, power: 22, pool: ["flood", "ungrouped"] },
  { id: "legacy", color: "#f24e6b", hp: 240, power: 26, boss: true, pool: ["dup", "nullz", "space", "flood", "caseMix", "ungrouped", "baddate", "orphan"] },
];
