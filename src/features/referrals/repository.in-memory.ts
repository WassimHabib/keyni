import type { UserId } from "@/features/users/types";
import type { InMemoryStore } from "@/lib/db/store";

import type { ReferralRepository, RewardRepository } from "./repository";
import type {
  Referral,
  Reward,
  RewardId,
  RewardStatus,
} from "./types";

export class InMemoryRewardRepository implements RewardRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findAllByUser(userId: UserId): Promise<Reward[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.rewards.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findPendingByUser(userId: UserId): Promise<Reward[]> {
    const all = await this.findAllByUser(userId);
    return all.filter((r) => r.status === "en_attente");
  }

  async findById(id: RewardId): Promise<Reward | null> {
    await this.store.ensureSeeded();
    return this.store.rewards.get(id) ?? null;
  }

  async updateStatus(id: RewardId, status: RewardStatus): Promise<Reward> {
    await this.store.ensureSeeded();
    const current = this.store.rewards.get(id);
    if (!current) throw new Error("Gain introuvable");
    const next: Reward = {
      ...current,
      status,
      paidAt: status === "paye" ? new Date() : current.paidAt,
    };
    this.store.rewards.set(id, next);
    return next;
  }
}

export class InMemoryReferralRepository implements ReferralRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findAllByUser(userId: UserId): Promise<Referral[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.referrals.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.invitedAt.getTime() - a.invitedAt.getTime());
  }
}
