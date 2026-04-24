"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/guards";
import { repositories } from "@/lib/db/repositories";

import { MockDocumentAnalyzer } from "./mock-analyzer";
import type { DocumentType } from "./types";

const analyzer = new MockDocumentAnalyzer();

function inferType(filename: string): DocumentType {
  const lower = filename.toLowerCase();
  if (lower.includes("bail")) return "bail";
  if (lower.includes("etat") || lower.includes("edl")) return "etat_des_lieux";
  if (lower.includes("avenant")) return "avenant";
  if (lower.includes("attestation")) return "attestation";
  if (lower.includes("facture")) return "facture";
  if (lower.includes("echeancier")) return "echeancier";
  if (lower.includes("devis")) return "devis";
  return "autre";
}

export async function uploadDocumentAction(
  formData: FormData,
): Promise<{ ok: boolean; documentId?: string; message?: string }> {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Aucun fichier fourni" };
  }

  const propertyId = formData.get("propertyId");
  const doc = await repositories.documents.create({
    userId: user.id,
    propertyId: typeof propertyId === "string" && propertyId.length > 0 ? propertyId : undefined,
    type: inferType(file.name),
    filename: file.name,
    mime: file.type || "application/octet-stream",
    sizeBytes: file.size,
    storageKey: `uploads/${user.id}/${Date.now()}-${file.name}`,
    conformity: "pending",
  });

  revalidatePath("/outils/score");
  revalidatePath("/tableau-de-bord");
  return { ok: true, documentId: doc.id };
}

export async function analyzeDocumentAction(documentId: string) {
  const user = await requireUser();
  const doc = await repositories.documents.findById(documentId);
  if (!doc || doc.userId !== user.id) {
    return { ok: false as const, message: "Document introuvable" };
  }

  const result = await analyzer.analyze(doc);
  const updated = await repositories.documents.updateAnalysis(doc.id, {
    conformity: result.conformity,
    report: result.report,
  });

  revalidatePath("/outils/score");
  revalidatePath("/tableau-de-bord");

  return {
    ok: true as const,
    conformity: updated.conformity,
    report: updated.analysisReport!,
  };
}
