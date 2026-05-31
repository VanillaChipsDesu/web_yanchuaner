import type { NextRequest } from "next/server";
import getRedisClient from "@/lib/redis";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
  fallback: "redis" | "memory";
};

type Bucket = { count: number; resetAt: number };
const memoryStore = new Map<string, Bucket>();

let lastSweep = 0;
function sweepMemory(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of memoryStore) {
    if (v.resetAt <= now) memoryStore.delete(k);
  }
}

export function getClientIp(req: NextRequest | Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  if (first) return first;
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window rate limiter.
 * @param key Unique key per-bucket (e.g. `login:${ip}`).
 * @param limit Max requests within the window.
 * @param windowMs Window length in milliseconds.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const redis = getRedisClient();

  if (redis) {
    try {
      const redisKey = `rl:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pexpire(redisKey, windowMs);
      }
      const ttl = await redis.pttl(redisKey);
      const retryAfter = ttl > 0 ? Math.ceil(ttl / 1000) : Math.ceil(windowMs / 1000);
      return {
        ok: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfter,
        fallback: "redis",
      };
    } catch {
      // fall through to in-memory
    }
  }

  sweepMemory(now);
  const bucket = memoryStore.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      ok: true,
      remaining: limit - 1,
      retryAfter: Math.ceil(windowMs / 1000),
      fallback: "memory",
    };
  }
  bucket.count += 1;
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    fallback: "memory",
  };
}
