import type { UserId } from "@/features/users/types";

import type { PasswordResetToken } from "./types";

export interface PasswordResetTokenRepository {
  create(userId: UserId, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(id: string, when: Date): Promise<void>;
  deleteByUser(userId: UserId): Promise<void>;
}
