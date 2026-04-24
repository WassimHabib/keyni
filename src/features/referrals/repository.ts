import type { UserId } from "@/features/users/types";

import type {
  Referral,
  Reward,
  RewardId,
  RewardStatus,
} from "./types";

export interface RewardRepository {
  findAllByUser(userId: UserId): Promise<Reward[]>;
  findPendingByUser(userId: UserId): Promise<Reward[]>;
  findById(id: RewardId): Promise<Reward | null>;
  updateStatus(id: RewardId, status: RewardStatus): Promise<Reward>;
}

export interface ReferralRepository {
  findAllByUser(userId: UserId): Promise<Referral[]>;
}
