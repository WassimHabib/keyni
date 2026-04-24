"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "./guards";
import { logAuditEvent } from "./audit";
import { repositories } from "@/lib/db/repositories";

export async function revokeSessionAction(sessionId: string): Promise<void> {
  const user = await requireUser();
  const sessions = await repositories.sessions.findAllForUser(user.id);
  const target = sessions.find((s) => s.id === sessionId);
  if (!target) return;
  await repositories.sessions.delete(sessionId);
  await logAuditEvent("session.revoked", {
    userId: user.id,
    metadata: { sessionId },
  });
  revalidatePath("/profil");
}

export async function revokeAllOtherSessionsAction(
  currentSessionId: string,
): Promise<void> {
  const user = await requireUser();
  await repositories.sessions.deleteAllForUser(user.id, currentSessionId);
  await logAuditEvent("session.revoked", {
    userId: user.id,
    metadata: { scope: "all_others" },
  });
  revalidatePath("/profil");
}
