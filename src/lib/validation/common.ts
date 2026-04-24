import { z } from "zod";

/**
 * Schémas partagés par toutes les features.
 * ULIDs pour les IDs, montants en centimes pour éviter les floats,
 * validation explicite des emails et mots de passe.
 */

export const UlidSchema = z
  .string()
  .length(26, "ULID invalide")
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "ULID invalide");

export type Ulid = z.infer<typeof UlidSchema>;

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email invalide")
  .max(254, "Email trop long");

export const MoneyCentsSchema = z
  .number()
  .int("Le montant doit être en centimes (entier)")
  .nonnegative("Le montant ne peut pas être négatif");

export const PositiveMoneyCentsSchema = z
  .number()
  .int()
  .positive("Le montant doit être strictement positif");

export const PercentSchema = z
  .number()
  .nonnegative()
  .max(100, "Pourcentage invalide");

export const SurfaceSchema = z
  .number()
  .positive("La surface doit être strictement positive")
  .max(100000, "Surface invalide");

export const IsoDateSchema = z
  .union([z.string().datetime(), z.date()])
  .transform((value) => (value instanceof Date ? value : new Date(value)));

export const PasswordSchema = z
  .string()
  .min(12, "Le mot de passe doit contenir au moins 12 caractères")
  .max(128, "Le mot de passe est trop long");

export const NonEmptyStringSchema = z
  .string()
  .trim()
  .min(1, "Ce champ est obligatoire");
