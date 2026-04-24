import { repositories } from "@/lib/db/repositories";

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const { key, limit, windowMs } = config;
  const { count, oldestAt } = await repositories.rateLimit.hit(key, windowMs);
  const resetAt = new Date(oldestAt.getTime() + windowMs);
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

export const LOGIN_LIMITS = {
  perIp: { limit: 20, windowMs: 15 * 60 * 1000 },
  perEmail: { limit: 5, windowMs: 15 * 60 * 1000 },
} as const;

export const RESET_LIMITS = {
  perIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  perEmail: { limit: 3, windowMs: 60 * 60 * 1000 },
} as const;
