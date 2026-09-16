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
    boss: {
      alert: string; rgpdName: string; batchName: string; doppelName: string;
      rgpdPrompt: string; batchPrompt: string; doppelPrompt: string;
      validate: string; reject: string; rgpd: string; submit: string;
      sensitiveLabel: string; cleared: string; failed: string; bonus: string; batchHint: string;
      sensitiveSamples: string[];
    };
  };
  sql: {
    title: string; intro1: string; intro2: string; rules: string; insertCoin: string;
    you: string; foe: string; combo: string; prompt: string;
    qcm: string; type: string; submit: string; placeholder: string;
    hit: string; miss: string; answer: string;
    victory: string; defeat: string; slain: string; accuracy: string; best: string;
    replay: string; backCabinet: string; newRecord: string;
    enemies: Record<string, string>; menaces: Record<string, string>;
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
    boss: {
      alert: "⚠ BOSS",
      rgpdName: "L'INSPECTEUR RGPD",
      batchName: "LE BATCH LEGACY 2003",
      doppelName: "LE DOPPELGÄNGER",
      rgpdPrompt: "Donnée sensible = non-conforme. Sinon, valide ou rejette normalement.",
      batchPrompt: "5 fiches d'un coup. Garde les propres, rejette les sales. Vite !",
      doppelPrompt: "Deux fiches, un seul doublon valable. Garde la plus complète.",
      validate: "✓ VALIDER", reject: "✗ REJETER", rgpd: "⚠ RGPD", submit: "VALIDER LE LOT ►",
      sensitiveLabel: "Donnée sensible",
      cleared: "BOSS VAINCU !", failed: "BOSS RATÉ", bonus: "+1 vie",
      batchHint: "Marque chaque fiche, puis valide le lot.",
      sensitiveSamples: [
        "N° Sécu : 1 85 12 78 123 456",
        "Santé : traitement diabète type 2",
        "Origine ethnique : renseignée",
        "N° carte : 4970 1234 5678 9012",
        "Opinion politique : renseignée",
      ],
    },
  },
  sql: {
    title: "SQL FIGHTER",
    intro1: "La mauvaise donnée a envahi l'entrepôt.",
    intro2: "Une seule arme : la bonne clause SQL.",
    rules: "Choisis la requête qui terrasse chaque menace. Mauvais choix, elle riposte.",
    insertCoin: "INSÉRER UNE PIÈCE ►",
    you: "TOI", foe: "ENNEMI", combo: "COMBO", prompt: "Quelle requête ?",
    qcm: "◉ CHOIX", type: "⌨ SAISIE", submit: "LANCER ►", placeholder: "tape la clause…",
    hit: "TOUCHÉ !", miss: "RATÉ !", answer: "Réponse :",
    victory: "VICTOIRE", defeat: "GAME OVER", slain: "MENACES VAINCUES", accuracy: "PRÉCISION", best: "BEST",
    replay: "REJOUER ►", backCabinet: "◄ BORNE", newRecord: "★ Nouveau record de session ★",
    enemies: {
      dupe: "Sire Duplicatout",
      nullz: "NULLzilla, Dévoreur de Valeurs",
      space: "Baron de l'Espace Sournois",
      flood: "Capitaine Scan-Total",
      legacy: "LEGACY-2003 : le Tableur Immortel",
    },
    menaces: {
      dup: "Des lignes identiques se reproduisent. Le même client, cinq fois.",
      nullz: "La moitié de la colonne email est… NULL. Le vide. Le néant.",
      space: "'  Paris  ' ne matche pas 'Paris'. Des espaces sournois partout.",
      flood: "La requête veut renvoyer 40 millions de lignes. Le serveur supplie.",
      caseMix: "'Paris', 'PARIS', 'paris' — une ville, trois déguisements.",
      ungrouped: "Il te faut une ligne par client, mais tu en as une par commande.",
      baddate: "Les dates sont du texte : '2003-13-40'. Ce mois n'existe pas.",
      orphan: "Des commandes pointent vers le client #999, jamais créé.",
    },
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
    boss: {
      alert: "⚠ BOSS",
      rgpdName: "THE GDPR INSPECTOR",
      batchName: "THE 2003 LEGACY BATCH",
      doppelName: "THE DOPPELGÄNGER",
      rgpdPrompt: "Sensitive data = non-compliant. Otherwise validate or reject as usual.",
      batchPrompt: "5 records at once. Keep the clean ones, reject the dirty. Fast!",
      doppelPrompt: "Two records, one valid duplicate. Keep the more complete one.",
      validate: "✓ VALIDATE", reject: "✗ REJECT", rgpd: "⚠ GDPR", submit: "SUBMIT BATCH ►",
      sensitiveLabel: "Sensitive data",
      cleared: "BOSS DOWN!", failed: "BOSS SURVIVED", bonus: "+1 life",
      batchHint: "Mark each record, then submit the batch.",
      sensitiveSamples: [
        "SSN: 078-05-1120",
        "Health: type 2 diabetes treatment",
        "Ethnic origin: recorded",
        "Card no.: 4970 1234 5678 9012",
        "Political opinion: recorded",
      ],
    },
  },
  sql: {
    title: "SQL FIGHTER",
    intro1: "Bad data has invaded the warehouse.",
    intro2: "One weapon: the right SQL clause.",
    rules: "Pick the query that defeats each menace. Wrong call, it hits back.",
    insertCoin: "INSERT COIN ►",
    you: "YOU", foe: "FOE", combo: "COMBO", prompt: "Which query?",
    qcm: "◉ CHOICES", type: "⌨ TYPE", submit: "CAST ►", placeholder: "type the clause…",
    hit: "HIT!", miss: "MISS!", answer: "Answer:",
    victory: "VICTORY", defeat: "GAME OVER", slain: "MENACES SLAIN", accuracy: "ACCURACY", best: "BEST",
    replay: "REPLAY ►", backCabinet: "◄ ARCADE", newRecord: "★ New session best ★",
    enemies: {
      dupe: "Sir Duplicatesalot",
      nullz: "NULLzilla, Devourer of Values",
      space: "Baron von Trailing-Space",
      flood: "Captain Full-Table-Scan",
      legacy: "LEGACY-2003: The Undying Spreadsheet",
    },
    menaces: {
      dup: "Identical rows are breeding in the table. Same customer, five times.",
      nullz: "Half the email column is just… NULL. Void. Nothing.",
      space: "'  Paris  ' won't match 'Paris'. Sneaky spaces everywhere.",
      flood: "The query wants to return 40 million rows. The server begs for mercy.",
      caseMix: "'Paris', 'PARIS', 'paris' — one city, three disguises.",
      ungrouped: "You need one line per customer, but you've got one per order.",
      baddate: "Birth dates are text: '2003-13-40'. That month doesn't exist.",
      orphan: "Orders point to customer #999, who was never created.",
    },
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
