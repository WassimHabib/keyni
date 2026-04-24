import type { UserId } from "@/features/users/types";

import type { AuditEvent, AuditLog } from "./types";

export interface AuditLogRepository {
  log(input: Omit<AuditLog, "id" | "at"> & { at?: Date }): Promise<AuditLog>;
  findByUser(userId: UserId, limit?: number): Promise<AuditLog[]>;
  findByEvent(event: AuditEvent, limit?: number): Promise<AuditLog[]>;
}
