import type { Contract, ContractType } from "@/features/contracts/types";
import type {
  Document,
  DocumentType,
} from "@/features/documents/types";
import type { Property } from "@/features/properties/types";
import type { UserProfile } from "@/features/users/types";

import { levelForScore, scoreRules } from "./rules";
import type {
  PropertyScore,
  Recommendation,
  ScoreBreakdown,
  ScoreResult,
} from "./types";

export interface ScoreInput {
  profile: UserProfile;
  properties: Property[];
  contracts: Contract[];
  documents: Document[];
}

function profileCompletenessPoints(profile: UserProfile): {
  earned: number;
  possible: number;
} {
  const { maxPoints, weightedFields } = scoreRules.profile;
  const totalWeight = weightedFields.reduce((sum, f) => sum + f.weight, 0);
  const earnedWeight = weightedFields.reduce((sum, f) => {
    const value = (profile as Record<string, unknown>)[f.key];
    return value !== undefined && value !== null && value !== "" && value !== 0
      ? sum + f.weight
      : sum;
  }, 0);
  const ratio = totalWeight === 0 ? 1 : earnedWeight / totalWeight;
  return {
    earned: Math.round(maxPoints * ratio),
    possible: maxPoints,
  };
}

interface ContractPoints {
  earned: number;
  possible: number;
  missing: ContractType[];
}

function contractPointsForProperty(
  property: Property,
  contracts: Contract[],
): ContractPoints {
  const activeContractTypes = new Set(
    contracts
      .filter((c) => c.propertyId === property.id)
      .filter((c) => c.status === "actif" || c.status === "a_renouveler")
      .map((c) => c.type),
  );

  let possible = 0;
  let earned = 0;
  const missing: ContractType[] = [];

  (Object.entries(scoreRules.contracts) as Array<
    [keyof typeof scoreRules.contracts, (typeof scoreRules.contracts)[keyof typeof scoreRules.contracts]]
  >).forEach(([type, rule]) => {
    if (!rule.appliesTo(property)) return;
    possible += rule.points;
    if (activeContractTypes.has(type as ContractType)) {
      earned += rule.points;
    } else {
      missing.push(type as ContractType);
    }
  });

  return { earned, possible, missing };
}

interface LegalPoints {
  earned: number;
  possible: number;
  missingDocs: DocumentType[];
}

function legalPointsForProperty(
  property: Property,
  documents: Document[],
): LegalPoints {
  const relevant = scoreRules.legal.relevantTypes;
  const docsForProperty = documents.filter(
    (d) =>
      d.propertyId === property.id &&
      (relevant as readonly DocumentType[]).includes(d.type),
  );
  const possible = scoreRules.legal.maxPerProperty;
  const perDoc = scoreRules.legal.perConformDocument;
  const rawEarned = docsForProperty
    .filter((d) => d.conformity === "conform")
    .reduce((sum) => sum + perDoc, 0);
  const earned = Math.min(rawEarned, possible);

  const typesPresent = new Set(docsForProperty.map((d) => d.type));
  const missingDocs = (relevant as readonly DocumentType[]).filter(
    (t) => !typesPresent.has(t),
  );

  return { earned, possible, missingDocs };
}

function scoreForProperty(
  property: Property,
  contracts: Contract[],
  documents: Document[],
  profileShare: { earned: number; possible: number },
): PropertyScore {
  const financial = contractPointsForProperty(property, contracts);
  const legal = legalPointsForProperty(property, documents);

  const total =
    scoreRules.baseScore + financial.earned + legal.earned + profileShare.earned;

  const clamped = Math.max(0, Math.min(100, total));

  return {
    propertyId: property.id,
    value: clamped,
    level: levelForScore(clamped).key,
    financial,
    legal,
    profile: profileShare,
  };
}

const CONTRACT_RECO_LABEL: Record<ContractType, string> = {
  PNO: "Propriétaire Non Occupant",
  GLI: "Garantie Loyers Impayés",
  ADP: "Assurance de Prêt",
  MRH: "Multirisque Habitation",
  RC_PRO: "Responsabilité Civile Professionnelle",
  autre: "Contrat complémentaire",
};

const DOCUMENT_RECO_LABEL: Record<DocumentType, string> = {
  bail: "Déposer le bail de location",
  etat_des_lieux: "Déposer l'état des lieux",
  avenant: "Déposer l'avenant au bail",
  attestation: "Déposer l'attestation",
  echeancier: "Déposer l'échéancier",
  facture: "Déposer la facture",
  devis: "Déposer le devis",
  autre: "Déposer le document",
};

export function computeScore(input: ScoreInput): ScoreResult {
  const { profile, properties, contracts, documents } = input;
  const profileShare = profileCompletenessPoints(profile);

  if (properties.length === 0) {
    const base = Math.min(
      100,
      scoreRules.baseScore + profileShare.earned,
    );
    const level = levelForScore(base);
    return {
      global: base,
      level: level.key,
      levelLabel: level.label,
      target: scoreRules.targetScore,
      gap: Math.max(0, scoreRules.targetScore - base),
      perProperty: {},
      breakdown: [
        {
          category: "profile",
          label: "Profil complété",
          earned: profileShare.earned,
          possible: profileShare.possible,
        },
      ],
      recommendations: [],
    };
  }

  // Partager les points profil sur chaque bien (valeurs par bien informatives).
  const perPropertyShare = {
    earned: Math.round(profileShare.earned / properties.length),
    possible: Math.round(profileShare.possible / properties.length),
  };

  const perProperty: Record<string, PropertyScore> = {};
  let sumPondere = 0;
  let sumWeights = 0;
  let totalFinancialEarned = 0;
  let totalFinancialPossible = 0;
  let totalLegalEarned = 0;
  let totalLegalPossible = 0;

  const recommendations: Recommendation[] = [];

  for (const property of properties) {
    const s = scoreForProperty(property, contracts, documents, perPropertyShare);
    perProperty[property.id] = s;

    const weight = property.valeurActuelleEstimeeCents || 1;
    sumPondere += s.value * weight;
    sumWeights += weight;

    totalFinancialEarned += s.financial.earned;
    totalFinancialPossible += s.financial.possible;
    totalLegalEarned += s.legal.earned;
    totalLegalPossible += s.legal.possible;

    for (const missingContract of s.financial.missing) {
      const rule = scoreRules.contracts[missingContract as keyof typeof scoreRules.contracts];
      if (!rule) continue;
      recommendations.push({
        id: `contract:${property.id}:${missingContract}`,
        label: `Souscrire ${CONTRACT_RECO_LABEL[missingContract]}`,
        description: `Pour ${property.name} : +${rule.points} pts`,
        impactPoints: rule.points,
        action: {
          href: "/outils/score",
          label: "Voir les offres",
        },
      });
    }
    for (const missingDoc of s.legal.missingDocs) {
      recommendations.push({
        id: `document:${property.id}:${missingDoc}`,
        label: `${DOCUMENT_RECO_LABEL[missingDoc]}`,
        description: `Pour ${property.name} : jusqu'à +${scoreRules.legal.perConformDocument} pts`,
        impactPoints: scoreRules.legal.perConformDocument,
        action: {
          href: "/outils/score",
          label: "Analyser mes documents",
        },
      });
    }
  }

  const global = Math.round(sumPondere / sumWeights);
  const level = levelForScore(global);
  const breakdown: ScoreBreakdown[] = [
    {
      category: "contracts",
      label: "Assurances souscrites",
      earned: totalFinancialEarned,
      possible: totalFinancialPossible,
    },
    {
      category: "documents",
      label: "Documents conformes",
      earned: totalLegalEarned,
      possible: totalLegalPossible,
    },
    {
      category: "profile",
      label: "Profil complété",
      earned: profileShare.earned,
      possible: profileShare.possible,
    },
  ];

  recommendations.sort((a, b) => b.impactPoints - a.impactPoints);

  return {
    global,
    level: level.key,
    levelLabel: level.label,
    target: scoreRules.targetScore,
    gap: Math.max(0, scoreRules.targetScore - global),
    perProperty,
    breakdown,
    recommendations: recommendations.slice(0, 5),
  };
}
