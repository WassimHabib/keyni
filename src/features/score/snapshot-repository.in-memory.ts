import { ulid } from "ulid";

import type { UserId } from "@/features/users/types";
import type { InMemoryStore, ScoreSnapshot } from "@/lib/db/store";

import type { ScoreSnapshotRepository } from "./snapshot-repository";

export class InMemoryScoreSnapshotRepository
  implements ScoreSnapshotRepository
{
  constructor(private readonly store: InMemoryStore) {}

  async findRecentByUser(userId: UserId, months = 6): Promise<ScoreSnapshot[]> {
    await this.store.ensureSeeded();
    return Array.from(this.store.scoreSnapshots.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime())
      .slice(-months);
  }

  async create(input: Omit<ScoreSnapshot, "id">): Promise<ScoreSnapshot> {
    const snap: ScoreSnapshot = { ...input, id: ulid() };
    this.store.scoreSnapshots.set(snap.id, snap);
    return snap;
  }
}
