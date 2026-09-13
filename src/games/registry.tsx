import { ComponentType, ReactNode } from "react";
import { C } from "@/lib/palette";
import { emblems } from "@/components/Cabinet";
import DataSteward from "./data-steward/DataSteward";

export type GenreKey = "steward" | "pipe" | "sql" | "quest";
export type GameEntry = {
  slug: string; title: string; genreKey: GenreKey; color: string;
  emblem: ReactNode; live: boolean; Component?: ComponentType;
};

export const GAMES: GameEntry[] = [
  { slug: "data-steward", title: "DATA STEWARD", genreKey: "steward", color: C.green, emblem: emblems.steward, live: true, Component: DataSteward },
  { slug: "pipe-plumber", title: "PIPE PLUMBER", genreKey: "pipe", color: C.blue, emblem: emblems.pipe, live: false },
  { slug: "sql-fighter", title: "SQL FIGHTER", genreKey: "sql", color: C.purple, emblem: emblems.sword, live: false },
  { slug: "rigobert-quest", title: "RIGOBERT'S QUEST", genreKey: "quest", color: C.yellow, emblem: emblems.coin, live: false },
];

export const getGame = (slug: string) => GAMES.find((g) => g.slug === slug);
