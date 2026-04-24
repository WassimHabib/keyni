import type { UserId } from "@/features/users/types";
import type { ScoreSnapshot } from "@/lib/db/store";

export interface ScoreSnapshotRepository {
  findRecentByUser(userId: UserId, months?: number): Promise<ScoreSnapshot[]>;
  create(input: Omit<ScoreSnapshot, "id">): Promise<ScoreSnapshot>;
}
