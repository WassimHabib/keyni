import { z } from "zod";

import {
  IsoDateSchema,
  MoneyCentsSchema,
  NonEmptyStringSchema,
  UlidSchema,
} from "@/lib/validation";

export const RewardStatusSchema = z.enum([
  "en_attente",
  "valide",
  "paye",
  "annule",
]);
export type RewardStatus = z.infer<typeof RewardStatusSchema>;

export const REWARD_STATUS_LABEL: Record<RewardStatus, string> = {
  en_attente: "En attente",
  valide: "Validé",
  paye: "Payé",
  annule: "Annulé",
};

export const RewardSourceSchema = z.enum([
  "parrainage",
  "promo_bienvenue",
  "fidelite",
  "autre",
]);
export type RewardSource = z.infer<typeof RewardSourceSchema>;

export const RewardSchema = z.object({
  id: UlidSchema,
  userId: UlidSchema,
  amountCents: MoneyCentsSchema,
  source: RewardSourceSchema,
  status: RewardStatusSchema,
  label: NonEmptyStringSchema,
  createdAt: IsoDateSchema,
  paidAt: IsoDateSchema.optional(),
});
export type Reward = z.infer<typeof RewardSchema>;
export type RewardId = Reward["id"];

export const ReferralStatusSchema = z.enum([
  "invite",
  "en_cours",
  "valide",
  "expire",
]);
export type ReferralStatus = z.infer<typeof ReferralStatusSchema>;

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  invite: "Invité",
  en_cours: "En cours",
  valide: "Validé",
  expire: "Expiré",
};

export const ReferralSchema = z.object({
  id: UlidSchema,
  userId: UlidSchema,
  maskedName: NonEmptyStringSchema,
  status: ReferralStatusSchema,
  invitedAt: IsoDateSchema,
  completedAt: IsoDateSchema.optional(),
  rewardCents: MoneyCentsSchema.default(0),
});
export type Referral = z.infer<typeof ReferralSchema>;
export type ReferralId = Referral["id"];
