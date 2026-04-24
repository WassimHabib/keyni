import { z } from "zod";

import {
  IsoDateSchema,
  MoneyCentsSchema,
  NonEmptyStringSchema,
  PercentSchema,
  SurfaceSchema,
  UlidSchema,
} from "@/lib/validation";

export const PropertyTypeSchema = z.enum([
  "appartement",
  "maison",
  "commerce",
  "bureau",
  "immeuble",
  "autre",
]);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

export const PropertyUsageSchema = z.enum([
  "location_nue",
  "location_meublee",
  "residence_principale",
  "residence_secondaire",
  "vacant",
]);
export type PropertyUsage = z.infer<typeof PropertyUsageSchema>;

export const PropertyFinancesSchema = z.object({
  loyerMensuelCents: MoneyCentsSchema.default(0),
  chargesMensuellesCents: MoneyCentsSchema.default(0),
  mensualiteCreditCents: MoneyCentsSchema.default(0),
  tauxInteret: PercentSchema.default(0),
  dureeRestantePretAnnees: z.number().int().min(0).max(50).default(0),
  apportPersonnelCents: MoneyCentsSchema.default(0),
});
export type PropertyFinances = z.infer<typeof PropertyFinancesSchema>;

export const PropertySchema = z.object({
  id: UlidSchema,
  userId: UlidSchema,
  name: NonEmptyStringSchema.max(80),
  city: NonEmptyStringSchema.max(80).optional(),
  type: PropertyTypeSchema,
  usage: PropertyUsageSchema,
  surface: SurfaceSchema,
  dateAcquisition: IsoDateSchema,
  prixAcquisitionCents: MoneyCentsSchema,
  valeurActuelleEstimeeCents: MoneyCentsSchema,
  finances: PropertyFinancesSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});
export type Property = z.infer<typeof PropertySchema>;
export type PropertyId = Property["id"];

export const CreatePropertyInputSchema = PropertySchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type CreatePropertyInput = z.infer<typeof CreatePropertyInputSchema>;

export const UpdatePropertyInputSchema = CreatePropertyInputSchema.partial();
export type UpdatePropertyInput = z.infer<typeof UpdatePropertyInputSchema>;

export function hasCredit(property: Property): boolean {
  return property.finances.mensualiteCreditCents > 0;
}

export function isRental(property: Property): boolean {
  return (
    property.usage === "location_nue" || property.usage === "location_meublee"
  );
}
