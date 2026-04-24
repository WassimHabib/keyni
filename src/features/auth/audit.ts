import { repositories } from "@/lib/db/repositories";
import { logger } from "@/lib/logger";

import type { AuditEvent } from "./types";

export interface AuditContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(
  event: AuditEvent,
  ctx: AuditContext = {},
): Promise<void> {
  try {
    await repositories.auditLog.log({
      event,
      userId: ctx.userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: ctx.metadata,
    });
    logger.debug("audit", { event, userId: ctx.userId });
  } catch (error) {
    logger.error("audit log failure", {
      event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
