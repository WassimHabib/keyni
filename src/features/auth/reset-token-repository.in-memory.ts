import { ulid } from "ulid";

import type { UserId } from "@/features/users/types";
import type { InMemoryStore } from "@/lib/db/store";

import type { PasswordResetTokenRepository } from "./reset-token-repository";
import type { PasswordResetToken } from "./types";

export class InMemoryPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  constructor(private readonly store: InMemoryStore) {}

  async create(
    userId: UserId,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    const token: PasswordResetToken = {
      id: ulid(),
      userId,
      tokenHash,
      createdAt: new Date(),
      expiresAt,
    };
    this.store.resetTokens.set(token.id, token);
    return token;
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    for (const token of this.store.resetTokens.values()) {
      if (token.tokenHash === tokenHash) return token;
    }
    return null;
  }

  async markUsed(id: string, when: Date): Promise<void> {
    const current = this.store.resetTokens.get(id);
    if (!current) return;
    this.store.resetTokens.set(id, { ...current, usedAt: when });
  }

  async deleteByUser(userId: UserId): Promise<void> {
    for (const [id, token] of this.store.resetTokens) {
      if (token.userId === userId) {
        this.store.resetTokens.delete(id);
      }
    }
  }
}
