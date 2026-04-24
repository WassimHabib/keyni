import type { InMemoryStore } from "@/lib/db/store";

import type { RateLimitStore } from "./rate-limit-repository";

interface Bucket {
  hits: number[];
}

export class InMemoryRateLimitStore implements RateLimitStore {
  constructor(private readonly store: InMemoryStore) {}

  private getBucket(key: string): Bucket {
    const raw = this.store.kv.get(`rl:${key}`);
    if (raw && typeof raw === "object" && "hits" in raw) {
      return raw as Bucket;
    }
    const bucket: Bucket = { hits: [] };
    this.store.kv.set(`rl:${key}`, bucket);
    return bucket;
  }

  async hit(
    key: string,
    windowMs: number,
  ): Promise<{ count: number; oldestAt: Date }> {
    const bucket = this.getBucket(key);
    const now = Date.now();
    const windowStart = now - windowMs;
    bucket.hits = bucket.hits.filter((t) => t >= windowStart);
    bucket.hits.push(now);
    const oldest = bucket.hits[0] ?? now;
    return { count: bucket.hits.length, oldestAt: new Date(oldest) };
  }

  async reset(key: string): Promise<void> {
    this.store.kv.delete(`rl:${key}`);
  }
}
