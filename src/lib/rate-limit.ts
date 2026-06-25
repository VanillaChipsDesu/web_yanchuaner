import type { NextRequest } from "next/server";
import getRedisClient from "@/lib/redis";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
  fallback: "redis" | "memory";
};

export interface LimiterResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp in ms
  retryAfter: number; // in seconds
}

export interface Limiter {
  limit: (key: string) => Promise<LimiterResult>;
}

// Legacy fixed-window memory store
type LegacyBucket = { count: number; resetAt: number };
const legacyMemoryStore = new Map<string, LegacyBucket>();
let lastLegacySweep = 0;

function sweepLegacyMemory(now: number) {
  if (now - lastLegacySweep < 60_000) return;
  lastLegacySweep = now;
  for (const [k, v] of legacyMemoryStore) {
    if (v.resetAt <= now) legacyMemoryStore.delete(k);
  }
}

// Sliding-window memory store
const localMemoryStore = new Map<string, number[]>();
let lastLocalSweep = 0;

function sweepLocalMemory(now: number) {
  if (now - lastLocalSweep < 60_000) return;
  lastLocalSweep = now;
  for (const [k, timestamps] of localMemoryStore) {
    const activeTimestamps = timestamps.filter((t) => t > now - 86_400_000);
    if (activeTimestamps.length === 0) {
      localMemoryStore.delete(k);
    } else {
      localMemoryStore.set(k, activeTimestamps);
    }
  }
}

export function getClientIp(req: NextRequest | Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  if (first) return first;
  return req.headers.get("x-real-ip") || "unknown";
}

// Initialize Upstash Redis if configured
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let upstashRedis: Redis | null = null;
let authLimiterRedis: Ratelimit | null = null;
let emailMinLimiterRedis: Ratelimit | null = null;
let emailDayLimiterRedis: Ratelimit | null = null;

if (isUpstashConfigured) {
  try {
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    authLimiterRedis = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "ratelimit:auth",
    });

    emailMinLimiterRedis = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(1, "1 m"),
      prefix: "ratelimit:email-min",
    });

    emailDayLimiterRedis = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(10, "1 d"),
      prefix: "ratelimit:email-day",
    });
  } catch (err) {
    console.error("Failed to initialize Upstash Redis:", err);
  }
}

// Sliding-window local memory fallback helper
function slidingWindowMemoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): LimiterResult {
  const now = Date.now();
  sweepLocalMemory(now);

  const timestamps = localMemoryStore.get(key) || [];
  const activeTimestamps = timestamps.filter((t) => t > now - windowMs);

  if (activeTimestamps.length < limit) {
    activeTimestamps.push(now);
    localMemoryStore.set(key, activeTimestamps);
    const remaining = limit - activeTimestamps.length;
    const oldest = activeTimestamps[0] || now;
    const reset = oldest + windowMs;
    return {
      success: true,
      remaining,
      reset,
      retryAfter: 0,
    };
  } else {
    const oldest = activeTimestamps[0];
    const reset = oldest + windowMs;
    const retryAfter = Math.max(1, Math.ceil((reset - now) / 1000));
    return {
      success: false,
      remaining: 0,
      reset,
      retryAfter,
    };
  }
}

// Local memory fallback for email limiter (sequential sliding window checks)
function emailLimiterMemory(key: string): LimiterResult {
  const minKey = `email-min:${key}`;
  const dayKey = `email-day:${key}`;

  const dayRes = slidingWindowMemoryLimit(dayKey, 10, 86_400_000);
  if (!dayRes.success) {
    return dayRes;
  }

  const minRes = slidingWindowMemoryLimit(minKey, 1, 60_000);
  if (!minRes.success) {
    // Compensate the day limiter since minute limiter blocked the attempt
    const dayTimestamps = localMemoryStore.get(dayKey);
    if (dayTimestamps && dayTimestamps.length > 0) {
      dayTimestamps.pop();
      localMemoryStore.set(dayKey, dayTimestamps);
    }
    return minRes;
  }

  return {
    success: true,
    remaining: Math.min(minRes.remaining, dayRes.remaining),
    reset: Math.max(minRes.reset, dayRes.reset),
    retryAfter: 0,
  };
}

// Exported Auth Limiter
export const authLimiter: Limiter = {
  async limit(key: string): Promise<LimiterResult> {
    if (authLimiterRedis) {
      try {
        const res = await authLimiterRedis.limit(key);
        return {
          success: res.success,
          remaining: res.remaining,
          reset: res.reset,
          retryAfter: res.success ? 0 : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
        };
      } catch (err) {
        console.error("Upstash authLimiter error, falling back to memory:", err);
      }
    }
    return slidingWindowMemoryLimit(`auth:${key}`, 5, 60_000);
  },
};

// Exported Email Limiter
export const emailLimiter: Limiter = {
  async limit(key: string): Promise<LimiterResult> {
    if (emailMinLimiterRedis && emailDayLimiterRedis) {
      try {
        const minRes = await emailMinLimiterRedis.limit(key);
        if (!minRes.success) {
          return {
            success: false,
            remaining: minRes.remaining,
            reset: minRes.reset,
            retryAfter: Math.max(1, Math.ceil((minRes.reset - Date.now()) / 1000)),
          };
        }
        const dayRes = await emailDayLimiterRedis.limit(key);
        if (!dayRes.success) {
          return {
            success: false,
            remaining: dayRes.remaining,
            reset: dayRes.reset,
            retryAfter: Math.max(1, Math.ceil((dayRes.reset - Date.now()) / 1000)),
          };
        }
        return {
          success: true,
          remaining: Math.min(minRes.remaining, dayRes.remaining),
          reset: Math.max(minRes.reset, dayRes.reset),
          retryAfter: 0,
        };
      } catch (err) {
        console.error("Upstash emailLimiter error, falling back to memory:", err);
      }
    }
    return emailLimiterMemory(key);
  },
};

/**
 * Legacy fixed-window rate limiter, refactored to use Upstash Redis if configured/available,
 * or fallback to ioredis, or memory.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();

  // Try Upstash Redis first
  if (upstashRedis) {
    try {
      const redisKey = `rl:${key}`;
      const count = await upstashRedis.incr(redisKey);
      if (count === 1) {
        await upstashRedis.pexpire(redisKey, windowMs);
      }
      const ttl = await upstashRedis.pttl(redisKey);
      const retryAfter = ttl > 0 ? Math.ceil(ttl / 1000) : Math.ceil(windowMs / 1000);
      return {
        ok: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfter,
        fallback: "redis",
      };
    } catch (err) {
      console.error("Upstash Redis error in legacy rateLimit, falling back:", err);
    }
  }

  // Try legacy Redis (ioredis) next
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
    } catch (err) {
      console.error("ioredis error in legacy rateLimit, falling back:", err);
    }
  }

  // Memory fallback
  sweepLegacyMemory(now);
  const bucket = legacyMemoryStore.get(key);
  if (!bucket || bucket.resetAt <= now) {
    legacyMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
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
