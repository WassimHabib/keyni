import { z } from "zod";

import {
  EmailSchema,
  IsoDateSchema,
  MoneyCentsSchema,
  NonEmptyStringSchema,
  UlidSchema,
} from "@/lib/validation";

export const SituationProSchema = z.enum([
  "salarie",
  "cadre",
  "independant",
  "chef_entreprise",
  "retraite",
  "etudiant",
  "sans_emploi",
]);
export type SituationPro = z.infer<typeof SituationProSchema>;

export const RegimeFiscalSchema = z.enum([
  "micro_foncier",
  "reel_simplifie",
  "lmnp_micro",
  "lmnp_reel",
  "lmp",
  "sci_is",
  "sci_ir",
  "autre",
]);
export type RegimeFiscal = z.infer<typeof RegimeFiscalSchema>;

export const UserProfileSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  displayName: NonEmptyStringSchema.max(40),
  situation: SituationProSchema.optional(),
  revenusMensuelsNetsCents: MoneyCentsSchema.optional(),
  chargesMensuellesCents: MoneyCentsSchema.optional(),
  personnesFoyer: z.number().int().min(1).max(20).optional(),
  regimeFiscal: RegimeFiscalSchema.optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UserSchema = z.object({
  id: UlidSchema,
  email: EmailSchema,
  passwordHash: z.string().min(20),
  profile: UserProfileSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});
export type User = z.infer<typeof UserSchema>;
export type UserId = User["id"];

export const CreateUserInputSchema = z.object({
  email: EmailSchema,
  passwordHash: z.string().min(20),
  profile: UserProfileSchema,
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserProfileInputSchema = UserProfileSchema.partial();
export type UpdateUserProfileInput = z.infer<
  typeof UpdateUserProfileInputSchema
>;

export function userWithoutSecrets(
  user: User,
): Omit<User, "passwordHash"> {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export type PublicUser = ReturnType<typeof userWithoutSecrets>;
