import { z } from "zod";

import { IsoDateSchema, NonEmptyStringSchema, UlidSchema } from "@/lib/validation";

export const DocumentTypeSchema = z.enum([
  "attestation",
  "echeancier",
  "facture",
  "bail",
  "etat_des_lieux",
  "avenant",
  "devis",
  "autre",
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  attestation: "Attestation",
  echeancier: "Échéancier",
  facture: "Facture",
  bail: "Bail",
  etat_des_lieux: "État des lieux",
  avenant: "Avenant",
  devis: "Devis",
  autre: "Autre",
};

export const ConformitySchema = z.enum([
  "pending",
  "conform",
  "non_conform",
  "needs_review",
]);
export type Conformity = z.infer<typeof ConformitySchema>;

export const AnalysisClauseSchema = z.object({
  id: z.string(),
  label: NonEmptyStringSchema,
  severity: z.enum(["info", "warning", "critical"]),
  description: z.string(),
});
export type AnalysisClause = z.infer<typeof AnalysisClauseSchema>;

export const AnalysisReportSchema = z.object({
  analyzedAt: IsoDateSchema,
  clausesAnalyzed: z.number().int().nonnegative(),
  clausesAtRisk: z.array(AnalysisClauseSchema),
  conformityScore: z.number().min(0).max(100),
  recommendations: z.array(NonEmptyStringSchema),
});
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

export const DocumentSchema = z.object({
  id: UlidSchema,
  userId: UlidSchema,
  propertyId: UlidSchema.optional(),
  contractId: UlidSchema.optional(),
  type: DocumentTypeSchema,
  filename: NonEmptyStringSchema.max(255),
  mime: NonEmptyStringSchema,
  sizeBytes: z.number().int().nonnegative(),
  storageKey: NonEmptyStringSchema,
  conformity: ConformitySchema,
  analysisReport: AnalysisReportSchema.optional(),
  uploadedAt: IsoDateSchema,
});
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentId = Document["id"];
