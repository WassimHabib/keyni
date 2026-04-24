import type { ContractType } from "@/features/contracts/types";
import type { DocumentType } from "@/features/documents/types";
import type { PropertyId } from "@/features/properties/types";

export type ScoreLevelKey = "critique" | "modere" | "bon" | "excellent";

export interface ScoreLevel {
  key: ScoreLevelKey;
  min: number;
  label: string;
  color: "danger" | "warning" | "success" | "primary";
}

export interface CategoryBreakdown {
  earned: number;
  possible: number;
}

export interface PropertyScore {
  propertyId: PropertyId;
  value: number;
  level: ScoreLevelKey;
  financial: CategoryBreakdown & { missing: ContractType[] };
  legal: CategoryBreakdown & { missingDocs: DocumentType[] };
  profile: CategoryBreakdown;
}

export interface ScoreBreakdown {
  category: "contracts" | "documents" | "profile";
  label: string;
  earned: number;
  possible: number;
}

export interface Recommendation {
  id: string;
  label: string;
  description: string;
  impactPoints: number;
  action?: { href: string; label: string };
}

export interface ScoreResult {
  global: number;
  level: ScoreLevelKey;
  levelLabel: string;
  target: number;
  gap: number;
  perProperty: Record<PropertyId, PropertyScore>;
  breakdown: ScoreBreakdown[];
  recommendations: Recommendation[];
}
