"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/features/auth/guards";
import { repositories } from "@/lib/db/repositories";

interface ActionResult {
  ok: boolean;
  message?: string;
}

const IbanSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9 ]{10,30}$/i, "IBAN invalide");

export async function claimRewardAction(
  rewardId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = IbanSchema.safeParse(formData.get("iban"));
  if (!parsed.success) {
    return { ok: false, message: "IBAN invalide" };
  }
  const reward = await repositories.rewards.findById(rewardId);
  if (!reward || reward.userId !== user.id) {
    return { ok: false, message: "Gain introuvable" };
  }
  await repositories.rewards.updateStatus(rewardId, "valide");
  revalidatePath("/bons-plans");
  return {
    ok: true,
    message: "Demande envoyée. Vous recevrez le virement sous 5 jours ouvrés.",
  };
}
