import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";

import type { DocumentAnalyzer } from "./analyzer";
import type {
  AnalysisClause,
  AnalysisReport,
  Conformity,
  Document,
  DocumentType,
} from "./types";

interface SeededRandom {
  next(): number;
}

function hashToInt(value: string): number {
  const bytes = sha256(new TextEncoder().encode(value));
  const hex = encodeHexLowerCase(bytes).slice(0, 8);
  return parseInt(hex, 16);
}

function seededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;
  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0xffffffff;
    },
  };
}

const CLAUSES_BY_TYPE: Record<DocumentType, AnalysisClause[]> = {
  bail: [
    {
      id: "revision-irl",
      label: "Clause de révision IRL",
      severity: "info",
      description: "Indexation annuelle sur l'IRL détectée, formulation conforme.",
    },
    {
      id: "depot-garantie",
      label: "Dépôt de garantie",
      severity: "info",
      description: "Montant équivalent à 1 mois de loyer hors charges.",
    },
    {
      id: "clause-resolutoire",
      label: "Clause résolutoire",
      severity: "warning",
      description:
        "Rédaction à préciser pour renforcer votre protection en cas d'impayés.",
    },
    {
      id: "solidarite-colocataires",
      label: "Clause de solidarité",
      severity: "info",
      description: "Solidarité entre colocataires correctement mentionnée.",
    },
    {
      id: "duree",
      label: "Durée du bail",
      severity: "info",
      description: "Durée conforme au type de location.",
    },
  ],
  etat_des_lieux: [
    {
      id: "photos",
      label: "Photos annexées",
      severity: "info",
      description: "Annexes photographiques présentes, horodatage OK.",
    },
    {
      id: "signature",
      label: "Signatures des parties",
      severity: "warning",
      description: "La signature du bailleur n'est pas datée. À régulariser.",
    },
    {
      id: "compteurs",
      label: "Relevés de compteurs",
      severity: "info",
      description: "Relevés électricité / eau / gaz présents.",
    },
  ],
  avenant: [
    {
      id: "reference-bail",
      label: "Référence au bail initial",
      severity: "info",
      description: "Avenant correctement rattaché au bail principal.",
    },
    {
      id: "objet",
      label: "Objet de l'avenant",
      severity: "warning",
      description:
        "L'objet pourrait être plus précis pour éviter toute contestation.",
    },
  ],
  attestation: [
    {
      id: "periode",
      label: "Période de couverture",
      severity: "info",
      description: "Période de couverture cohérente avec le contrat.",
    },
  ],
  echeancier: [
    {
      id: "dates",
      label: "Dates d'échéance",
      severity: "info",
      description: "Cadencement mensuel correctement mentionné.",
    },
  ],
  facture: [
    {
      id: "mentions-legales",
      label: "Mentions légales",
      severity: "info",
      description: "TVA et mentions obligatoires présentes.",
    },
  ],
  devis: [
    {
      id: "details",
      label: "Détail des prestations",
      severity: "info",
      description: "Décomposition détaillée, conditions de validité précisées.",
    },
  ],
  autre: [
    {
      id: "generique",
      label: "Analyse générique",
      severity: "info",
      description: "Structure du document cohérente.",
    },
  ],
};

function pickClauses(
  document: Document,
  random: SeededRandom,
): AnalysisClause[] {
  const base = CLAUSES_BY_TYPE[document.type];
  // On en garde entre 2 et tous, pour varier.
  const keep = Math.max(2, Math.floor(random.next() * base.length) + 1);
  return base.slice(0, keep);
}

function determineConformity(clauses: AnalysisClause[]): Conformity {
  const hasCritical = clauses.some((c) => c.severity === "critical");
  if (hasCritical) return "non_conform";
  const warnings = clauses.filter((c) => c.severity === "warning").length;
  if (warnings >= 2) return "needs_review";
  return "conform";
}

function buildRecommendations(clauses: AnalysisClause[]): string[] {
  const recs = clauses
    .filter((c) => c.severity !== "info")
    .map((c) => `Revoir : ${c.label} — ${c.description}`);
  if (recs.length === 0) {
    recs.push("Document conforme, aucune action requise.");
  }
  return recs;
}

export class MockDocumentAnalyzer implements DocumentAnalyzer {
  constructor(
    private readonly delayRangeMs: [number, number] = [2000, 4000],
  ) {}

  async analyze(document: Document): Promise<{
    conformity: Conformity;
    report: AnalysisReport;
  }> {
    const seed = hashToInt(`${document.filename}:${document.sizeBytes}`);
    const random = seededRandom(seed);

    const [min, max] = this.delayRangeMs;
    const delay = Math.floor(min + random.next() * (max - min));
    await new Promise((resolve) => setTimeout(resolve, delay));

    const clauses = pickClauses(document, random);
    const atRisk = clauses.filter((c) => c.severity !== "info");
    const conformity = determineConformity(clauses);
    const conformityScore = Math.max(
      40,
      Math.round(100 - atRisk.length * 12 - random.next() * 5),
    );

    const report: AnalysisReport = {
      analyzedAt: new Date(),
      clausesAnalyzed: clauses.length,
      clausesAtRisk: atRisk,
      conformityScore,
      recommendations: buildRecommendations(clauses),
    };

    return { conformity, report };
  }
}
