import { ulid } from "ulid";

import type { UserId } from "@/features/users/types";
import type { InMemoryStore } from "@/lib/db/store";

import type { AuditLogRepository } from "./audit-repository";
import type { AuditEvent, AuditLog } from "./types";

export class InMemoryAuditLogRepository implements AuditLogRepository {
  constructor(private readonly store: InMemoryStore) {}

  async log(
    input: Omit<AuditLog, "id" | "at"> & { at?: Date },
  ): Promise<AuditLog> {
    const entry: AuditLog = {
      id: ulid(),
      at: input.at ?? new Date(),
      event: input.event,
      userId: input.userId,
      ip: input.ip,
      userAgent: input.userAgent,
      metadata: input.metadata,
    };
    this.store.auditLogs.set(entry.id, entry);
    return entry;
  }

  async findByUser(userId: UserId, limit = 50): Promise<AuditLog[]> {
    return Array.from(this.store.auditLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit);
  }

  async findByEvent(event: AuditEvent, limit = 100): Promise<AuditLog[]> {
    return Array.from(this.store.auditLogs.values())
      .filter((log) => log.event === event)
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit);
  }
}
