import type { Property } from "@/features/properties/types";

import type { ScoreLevel } from "./types";

export const SCORE_LEVELS: readonly ScoreLevel[] = [
  { key: "critique", min: 0, label: "Critique", color: "danger" },
  { key: "modere", min: 40, label: "Modéré", color: "warning" },
  { key: "bon", min: 70, label: "Bon", color: "success" },
  { key: "excellent", min: 85, label: "Excellent", color: "primary" },
] as const;

export const scoreRules = {
  baseScore: 50,
  targetScore: 75,

  contracts: {
    PNO: {
      points: 10,
      appliesTo: (p: Property): boolean =>
        p.usage === "location_nue" || p.usage === "location_meublee",
    },
    GLI: {
      points: 8,
      appliesTo: (p: Property): boolean =>
        p.usage === "location_nue" || p.usage === "location_meublee",
    },
    ADP: {
      points: 5,
      appliesTo: (p: Property): boolean =>
        p.finances.mensualiteCreditCents > 0,
    },
    MRH: {
      points: 3,
      appliesTo: (p: Property): boolean =>
        p.usage === "residence_principale" ||
        p.usage === "residence_secondaire",
    },
  },

  legal: {
    perConformDocument: 3,
    maxPerProperty: 15,
    relevantTypes: ["bail", "etat_des_lieux", "avenant"] as const,
  },

  profile: {
    maxPoints: 10,
    weightedFields: [
      { key: "revenusMensuelsNetsCents", weight: 3 },
      { key: "chargesMensuellesCents", weight: 2 },
      { key: "situation", weight: 2 },
      { key: "regimeFiscal", weight: 2 },
      { key: "personnesFoyer", weight: 1 },
    ] as const,
  },
} as const;

export function levelForScore(score: number): ScoreLevel {
  let chosen = SCORE_LEVELS[0]!;
  for (const level of SCORE_LEVELS) {
    if (score >= level.min) chosen = level;
  }
  return chosen;
}
