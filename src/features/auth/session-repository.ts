import type { UserId } from "@/features/users/types";

import type { Session, SessionId } from "./types";

export interface SessionRepository {
  create(input: Omit<Session, "id" | "createdAt" | "lastSeenAt">): Promise<Session>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  touch(id: SessionId, when: Date): Promise<void>;
  extend(id: SessionId, expiresAt: Date): Promise<void>;
  delete(id: SessionId): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteAllForUser(userId: UserId, except?: SessionId): Promise<void>;
  findAllForUser(userId: UserId): Promise<Session[]>;
}
