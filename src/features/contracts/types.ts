import { z } from "zod";

import {
  IsoDateSchema,
  MoneyCentsSchema,
  NonEmptyStringSchema,
  UlidSchema,
} from "@/lib/validation";

export const ContractTypeSchema = z.enum([
  "PNO",
  "GLI",
  "ADP",
  "MRH",
  "RC_PRO",
  "autre",
]);
export type ContractType = z.infer<typeof ContractTypeSchema>;

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  PNO: "Propriétaire Non Occupant",
  GLI: "Garantie Loyers Impayés",
  ADP: "Assurance de Prêt",
  MRH: "Multirisque Habitation",
  RC_PRO: "Responsabilité Civile Professionnelle",
  autre: "Autre",
};

export const ContractStatusSchema = z.enum([
  "actif",
  "a_renouveler",
  "en_attente",
  "expire",
  "resilie",
]);
export type ContractStatus = z.infer<typeof ContractStatusSchema>;

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  actif: "Actif",
  a_renouveler: "À renouveler",
  en_attente: "En attente",
  expire: "Expiré",
  resilie: "Résilié",
};

export const ContractSchema = z.object({
  id: UlidSchema,
  userId: UlidSchema,
  propertyId: UlidSchema,
  type: ContractTypeSchema,
  assureur: NonEmptyStringSchema.max(120),
  numeroPolice: NonEmptyStringSchema.max(60),
  status: ContractStatusSchema,
  primeAnnuelleCents: MoneyCentsSchema,
  dateDebut: IsoDateSchema,
  dateEcheance: IsoDateSchema,
  garanties: z.array(NonEmptyStringSchema).default([]),
  attestationDocumentId: UlidSchema.optional(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});
export type Contract = z.infer<typeof ContractSchema>;
export type ContractId = Contract["id"];
