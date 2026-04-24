import { ulid } from "ulid";

import type { UserId } from "@/features/users/types";
import type { InMemoryStore } from "@/lib/db/store";

import type { SessionRepository } from "./session-repository";
import type { Session, SessionId } from "./types";

export class InMemorySessionRepository implements SessionRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(
    input: Omit<Session, "id" | "createdAt" | "lastSeenAt">,
  ): Promise<Session> {
    await this.store.ensureSeeded();
    const now = new Date();
    const session: Session = {
      ...input,
      id: ulid(),
      createdAt: now,
      lastSeenAt: now,
    };
    this.store.sessions.set(session.id, session);
    return session;
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    await this.store.ensureSeeded();
    for (const session of this.store.sessions.values()) {
      if (session.tokenHash === tokenHash) return session;
    }
    return null;
  }

  async touch(id: SessionId, when: Date): Promise<void> {
    const current = this.store.sessions.get(id);
    if (!current) return;
    this.store.sessions.set(id, { ...current, lastSeenAt: when });
  }

  async extend(id: SessionId, expiresAt: Date): Promise<void> {
    const current = this.store.sessions.get(id);
    if (!current) return;
    this.store.sessions.set(id, { ...current, expiresAt });
  }

  async delete(id: SessionId): Promise<void> {
    this.store.sessions.delete(id);
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    for (const [id, session] of this.store.sessions) {
      if (session.tokenHash === tokenHash) {
        this.store.sessions.delete(id);
        return;
      }
    }
  }

  async deleteAllForUser(userId: UserId, except?: SessionId): Promise<void> {
    for (const [id, session] of this.store.sessions) {
      if (session.userId === userId && id !== except) {
        this.store.sessions.delete(id);
      }
    }
  }

  async findAllForUser(userId: UserId): Promise<Session[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.sessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime());
  }
}
