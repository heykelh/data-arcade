"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import type { Field } from "@/games/data-steward/records";

export type Lang = "fr" | "en";

type Dict = {
  ui: { credits: string; music: string; sfx: string; home: string };
  hub: { insertCoin: string; chooseCabinet: string; playable: string; soon: string; footer: string };
  genres: { steward: string; pipe: string; sql: string; quest: string };
  steward: {
    title: string; introLine1: string; introLine2: string; validate: string; reject: string;
    validateBtn: string; rejectBtn: string; rules: string; insertCoin: string;
    score: string; combo: string; best: string; fiche: string;
    conforme: string; rejete: string; good: string; missed: string; tooSlow: string;
    precision: string; fiches: string; replay: string; backCabinet: string; newRecord: string;
    fields: Record<Field, string>;
  };
  reasons: Record<string, string>;
  grades: Record<string, string>;
};

const fr: Dict = {
  ui: { credits: "▲ CRÉDITS 1", music: "MUSIQUE", sfx: "SONS", home: "ARCADE" },
  hub: {
    insertCoin: "—— insère une pièce ——",
    chooseCabinet: "CHOISIS TA BORNE",
    playable: "● JOUABLE",
    soon: "○ BIENTÔT",
    footer: "Chaque borne est un mini-jeu bâti sur la même coquille. On en ajoute une quand elle est vraiment prête — jamais avant.",
  },
  genres: {
    steward: "Tri qualité · réflexes",
    pipe: "Puzzle · pipelines data",
    sql: "Combat · requêtes SQL",
    quest: "Aventure · le CV jouable",
  },
  steward: {
    title: "DATA STEWARD",
    introLine1: "Des fiches défilent sur ton guichet. Une seule question :",
    introLine2: "la donnée est-elle propre, ou faut-il la rejeter ?",
    validate: "Valider", reject: "Rejeter",
    validateBtn: "✓ VALIDER", rejectBtn: "✗ REJETER",
    rules: "3 vies. Ça accélère. Le combo multiplie tes points.",
    insertCoin: "INSÉRER UNE PIÈCE ►",
    score: "SCORE", combo: "COMBO", best: "BEST", fiche: "FICHE CLIENT",
    conforme: "CONFORME", rejete: "REJETÉ", good: "BON !", missed: "RATÉ", tooSlow: "TROP LENT",
    precision: "PRÉCISION", fiches: "FICHES", replay: "REJOUER ►", backCabinet: "◄ BORNE",
    newRecord: "★ Nouveau record de session ★",
    fields: { nom: "Nom", email: "Email", tel: "Téléphone", naissance: "Naissance", iban: "IBAN", ville: "Ville" },
  },
  reasons: {
    emailNoAt: "Email mal formaté (@ manquant)",
    emailSpace: "Email : espaces non autorisés",
    telLetter: "Téléphone : caractère invalide (lettre O)",
    telShort: "Téléphone : format incomplet",
    dobFuture: "Date de naissance dans le futur",
    dateInvalid: "Date invalide (jour/mois hors bornes)",
    ibanLen: "IBAN : longueur incorrecte",
    swapped: "Champs inversés (email ↔ téléphone)",
    missing: "Champ obligatoire manquant",
    conform: "Fiche conforme",
    wasConform: "Elle était conforme, il fallait valider",
  },
  grades: {
    intern: "STAGIAIRE DATA", junior: "DATA STEWARD JUNIOR", steward: "DATA STEWARD",
    lead: "LEAD DATA STEWARD", guardian: "DATA GUARDIAN", cdo: "CHIEF DATA OFFICER",
  },
};

const en: Dict = {
  ui: { credits: "▲ CREDITS 1", music: "MUSIC", sfx: "SFX", home: "ARCADE" },
  hub: {
    insertCoin: "—— insert coin ——",
    chooseCabinet: "CHOOSE YOUR CABINET",
    playable: "● PLAYABLE",
    soon: "○ SOON",
    footer: "Each cabinet is a mini-game built on the same shell. A new one ships only when it's truly ready — never before.",
  },
  genres: {
    steward: "Quality triage · reflexes",
    pipe: "Puzzle · data pipelines",
    sql: "Combat · SQL queries",
    quest: "Adventure · the playable résumé",
  },
  steward: {
    title: "DATA STEWARD",
    introLine1: "Records stream across your desk. One question:",
    introLine2: "is the data clean, or should you reject it?",
    validate: "Validate", reject: "Reject",
    validateBtn: "✓ VALIDATE", rejectBtn: "✗ REJECT",
    rules: "3 lives. It speeds up. Combos multiply your points.",
    insertCoin: "INSERT COIN ►",
    score: "SCORE", combo: "COMBO", best: "BEST", fiche: "CUSTOMER RECORD",
    conforme: "CLEAN", rejete: "REJECTED", good: "NICE!", missed: "MISSED", tooSlow: "TOO SLOW",
    precision: "ACCURACY", fiches: "RECORDS", replay: "REPLAY ►", backCabinet: "◄ ARCADE",
    newRecord: "★ New session best ★",
    fields: { nom: "Name", email: "Email", tel: "Phone", naissance: "Birth date", iban: "IBAN", ville: "City" },
  },
  reasons: {
    emailNoAt: "Malformed email (missing @)",
    emailSpace: "Email: spaces not allowed",
    telLetter: "Phone: invalid character (letter O)",
    telShort: "Phone: incomplete format",
    dobFuture: "Date of birth in the future",
    dateInvalid: "Invalid date (day/month out of range)",
    ibanLen: "IBAN: incorrect length",
    swapped: "Swapped fields (email ↔ phone)",
    missing: "Required field missing",
    conform: "Record is clean",
    wasConform: "It was clean — you should have validated",
  },
  grades: {
    intern: "DATA INTERN", junior: "JUNIOR DATA STEWARD", steward: "DATA STEWARD",
    lead: "LEAD DATA STEWARD", guardian: "DATA GUARDIAN", cdo: "CHIEF DATA OFFICER",
  },
};

const dict: Record<Lang, Dict> = { fr, en };

const I18nCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en", setLang: () => {}, t: en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return <I18nCtx.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
