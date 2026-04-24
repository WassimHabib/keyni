"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/features/auth/guards";
import { repositories } from "@/lib/db/repositories";
import { UlidSchema } from "@/lib/validation";

import { SinistreTypeSchema } from "./types";

interface ActionResult {
  ok: boolean;
  message?: string;
  sinistreId?: string;
}

const DeclareSchema = z.object({
  propertyId: UlidSchema,
  contractId: UlidSchema.optional(),
  type: SinistreTypeSchema,
  dateSurvenue: z.string().min(1, "Date requise"),
  description: z.string().min(10, "Décrivez le sinistre (10 caractères min)"),
});

export async function declareSinistreAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = DeclareSchema.safeParse({
    propertyId: formData.get("propertyId"),
    contractId: formData.get("contractId") || undefined,
    type: formData.get("type"),
    dateSurvenue: formData.get("dateSurvenue"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Informations incomplètes",
    };
  }
  const sinistre = await repositories.sinistres.create({
    userId: user.id,
    propertyId: parsed.data.propertyId,
    contractId: parsed.data.contractId,
    type: parsed.data.type,
    status: "declare",
    dateSurvenue: new Date(parsed.data.dateSurvenue),
    description: parsed.data.description,
    documentIds: [],
    timeline: [],
  });
  revalidatePath("/tableau-de-bord");
  revalidatePath("/mes-contrats");
  return {
    ok: true,
    sinistreId: sinistre.id,
    message: `Sinistre ${sinistre.referenceInterne} déclaré.`,
  };
}
