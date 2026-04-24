"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/guards";
import {
  hashPassword,
  verifyPassword,
} from "@/features/auth/password";
import {
  invalidateAllUserSessions,
} from "@/features/auth/session";
import type { UpdatePropertyInput } from "@/features/properties/types";
import { UpdatePropertyInputSchema } from "@/features/properties/types";
import { repositories } from "@/lib/db/repositories";
import { logAuditEvent } from "@/features/auth/audit";
import { PasswordSchema } from "@/lib/validation";
import { z } from "zod";

import {
  UpdateUserProfileInputSchema,
} from "./types";

interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

const ProfileFormSchema = z.object({
  situation: z.string().optional(),
  displayName: z.string().optional(),
  revenusMensuelsNetsCents: z.coerce.number().int().nonnegative().optional(),
  chargesMensuellesCents: z.coerce.number().int().nonnegative().optional(),
  personnesFoyer: z.coerce.number().int().min(1).max(20).optional(),
  regimeFiscal: z.string().optional(),
});

export async function updateProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsedRaw = ProfileFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsedRaw.success) {
    return {
      ok: false,
      message: "Valeurs invalides",
      fieldErrors: parsedRaw.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsedRaw.data)) {
    if (v !== undefined && v !== "") sanitized[k] = v;
  }

  const parsed = UpdateUserProfileInputSchema.safeParse(sanitized);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Profil invalide",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await repositories.users.updateProfile(user.id, parsed.data);

  // Mise à jour du bien concerné si fourni
  const propertyId = formData.get("propertyId");
  if (typeof propertyId === "string" && propertyId.length > 0) {
    const rawProperty = {
      name: formData.get("name"),
      type: formData.get("type"),
      usage: formData.get("usage"),
      surface: formData.get("surface")
        ? Number(formData.get("surface"))
        : undefined,
      dateAcquisition: formData.get("dateAcquisition"),
      prixAcquisitionCents: formData.get("prixAcquisitionCents")
        ? Number(formData.get("prixAcquisitionCents"))
        : undefined,
      valeurActuelleEstimeeCents: formData.get("valeurActuelleEstimeeCents")
        ? Number(formData.get("valeurActuelleEstimeeCents"))
        : undefined,
      finances: {
        loyerMensuelCents: formData.get("loyerMensuelCents")
          ? Number(formData.get("loyerMensuelCents"))
          : 0,
        chargesMensuellesCents: formData.get("chargesMensuellesBienCents")
          ? Number(formData.get("chargesMensuellesBienCents"))
          : 0,
        mensualiteCreditCents: formData.get("mensualiteCreditCents")
          ? Number(formData.get("mensualiteCreditCents"))
          : 0,
        tauxInteret: formData.get("tauxInteret")
          ? Number(formData.get("tauxInteret"))
          : 0,
        dureeRestantePretAnnees: formData.get("dureeRestantePretAnnees")
          ? Number(formData.get("dureeRestantePretAnnees"))
          : 0,
        apportPersonnelCents: formData.get("apportPersonnelCents")
          ? Number(formData.get("apportPersonnelCents"))
          : 0,
      },
    };

    const cleaned = Object.fromEntries(
      Object.entries(rawProperty).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    );
    const parsedProperty = UpdatePropertyInputSchema.safeParse(cleaned);
    if (parsedProperty.success) {
      await repositories.properties.update(
        propertyId,
        parsedProperty.data as UpdatePropertyInput,
      );
    }
  }

  revalidatePath("/outils/informations");
  revalidatePath("/tableau-de-bord");
  revalidatePath("/outils/score");
  return { ok: true, message: "Modifications enregistrées." };
}

const PasswordChangeSchema = z
  .object({
    current: z.string().min(1, "Mot de passe actuel requis"),
    next: PasswordSchema,
    confirm: PasswordSchema,
  })
  .refine((v) => v.next === v.confirm, {
    path: ["confirm"],
    message: "Les mots de passe ne correspondent pas",
  });

export async function changePasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = PasswordChangeSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez les champs",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.current);
  if (!valid) {
    return { ok: false, message: "Mot de passe actuel incorrect" };
  }

  const newHash = await hashPassword(parsed.data.next);
  await repositories.users.updatePassword(user.id, newHash);
  await invalidateAllUserSessions(user.id);
  await logAuditEvent("password_changed", { userId: user.id });
  return {
    ok: true,
    message:
      "Mot de passe mis à jour. Vos autres sessions ont été déconnectées.",
  };
}
