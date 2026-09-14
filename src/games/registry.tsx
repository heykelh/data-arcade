import { ComponentType, ReactNode } from "react";
import { C } from "@/lib/palette";
import { emblems } from "@/components/Cabinet";
import DataSteward from "./data-steward/DataSteward";
import SqlFighter from "./sql-fighter/SqlFighter";

export type GenreKey = "steward" | "pipe" | "sql" | "quest";
export type GameEntry = {
  slug: string; title: string; genreKey: GenreKey; color: string;
  emblem: ReactNode; live: boolean; Component?: ComponentType;
  music?: string;
};

export const GAMES: GameEntry[] = [
  { slug: "data-steward", title: "DATA STEWARD", genreKey: "steward", color: C.green, emblem: emblems.steward, live: true, Component: DataSteward },
  { slug: "sql-fighter", title: "SQL FIGHTER", genreKey: "sql", color: C.purple, emblem: emblems.sword, live: true, Component: SqlFighter, music: "/musicsql.mp3" },
  { slug: "pipe-plumber", title: "PIPE PLUMBER", genreKey: "pipe", color: C.blue, emblem: emblems.pipe, live: false },
  { slug: "rigobert-quest", title: "RIGOBERT'S QUEST", genreKey: "quest", color: C.yellow, emblem: emblems.coin, live: false },
];

export const getGame = (slug: string) => GAMES.find((g) => g.slug === slug);
