import { z } from "zod";

import { IsoDateSchema, NonEmptyStringSchema, UlidSchema } from "@/lib/validation";

export const SinistreTypeSchema = z.enum([
  "degat_des_eaux",
  "incendie",
  "vol",
  "bris_de_glace",
  "catastrophe_naturelle",
  "vandalisme",
  "loyer_impaye",
  "autre",
]);
export type SinistreType = z.infer<typeof SinistreTypeSchema>;

export const SINISTRE_TYPE_LABEL: Record<SinistreType, string> = {
  degat_des_eaux: "Dégât des eaux",
  incendie: "Incendie",
  vol: "Vol",
  bris_de_glace: "Bris de glace",
  catastrophe_naturelle: "Catastrophe naturelle",
  vandalisme: "Vandalisme",
  loyer_impaye: "Loyer impayé",
  autre: "Autre",
};

export const SinistreStatusSchema = z.enum([
  "declare",
  "en_cours",
  "en_attente",
  "cloture",
  "refuse",
]);
export type SinistreStatus = z.infer<typeof SinistreStatusSchema>;

export const SINISTRE_STATUS_LABEL: Record<SinistreStatus, string> = {
  declare: "Déclaré",
  en_cours: "En cours",
  en_attente: "En attente",
  cloture: "Clôturé",
  refuse: "Refusé",
};

export const SinistreEventSchema = z.object({
  at: IsoDateSchema,
  label: NonEmptyStringSchema,
  description: z.string().optional(),
});
export type SinistreEvent = z.infer<typeof SinistreEventSchema>;

export const SinistreSchema = z.object({
  id: UlidSchema,
  userId: UlidSchema,
  propertyId: UlidSchema,
  contractId: UlidSchema.optional(),
  type: SinistreTypeSchema,
  status: SinistreStatusSchema,
  dateSurvenue: IsoDateSchema,
  dateDeclaration: IsoDateSchema,
  description: NonEmptyStringSchema.max(2000),
  documentIds: z.array(UlidSchema).default([]),
  timeline: z.array(SinistreEventSchema).default([]),
  referenceInterne: NonEmptyStringSchema.max(30),
});
export type Sinistre = z.infer<typeof SinistreSchema>;
export type SinistreId = Sinistre["id"];
