# Milestone 1 Analysis: Upstash Redis Rate Limiting

## 1. Executive Summary
This document analyzes the requirements, current implementation, and proposed architecture for integrating Upstash Redis-backed rate limiting into the Aerospace Alumni website. The primary goal of Milestone 1 (R1) is to replace/upgrade the current local/Redis rate limiter on the login and email verification endpoints using `@upstash/redis` and `@upstash/ratelimit`, while ensuring a robust local memory fallback, preserving Admin API security checks, and keeping other routes that rely on the legacy `rateLimit` helper functional.

---

## 2. Investigation Findings

### A. Current Rate Limiting Implementation
1. **`src/lib/rate-limit.ts`**:
   - Uses an `ioredis`-based client from `@/lib/redis` if configured via `REDIS_URL`.
   - Falls back to an in-memory `Map` (`memoryStore`) in development or if Redis is unavailable.
   - Sweep mechanism runs every 60 seconds to clean expired keys from the memory store.
   - Provides a `rateLimit` helper:
     ```typescript
     export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
     ```
   - Provides a `getClientIp` helper that resolves the client IP address by checking `x-forwarded-for` and `x-real-ip` headers.
2. **`src/app/api/auth/login/route.ts`**:
   - Currently calls `rateLimit` on a 10 requests / 60 seconds basis per IP address.
   - Returns status code 429 with a custom Chinese error message and `Retry-After` header when limit is exceeded.
3. **`src/app/api/auth/verify-email/route.ts`**:
   - Currently calls `rateLimit` on a 20 requests / 60 seconds basis per IP address.
   - Returns status code 429 with `error: "请求过于频繁"` when limit is exceeded.
4. **Other Routes**:
   - Multiple other endpoints (e.g. `forgot-password`, `register`, `resend-verification`, `posts`, `events`, `upload-bg`, `correction-requests`) call the existing `rateLimit` helper. Deleting `rateLimit` will break these routes.

### B. Upstash Redis & `@upstash/ratelimit` Configuration
- **Libraries**: Need to be added to `package.json` dependencies:
  - `@upstash/redis` (for REST-based connection, ideal for serverless).
  - `@upstash/ratelimit` (provides sliding window rate limiting).
- **Initialization**:
  - Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
  - Instantiated via `new Redis({ url, token })`.
  - Rate limiters instantiated via `new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(...) })`.
- **Dual-Tier Limits**:
  - `emailLimiter` requires 1 request/minute AND max 10 requests/day per IP.
  - Can be solved by creating two separate `Ratelimit` instances (one for minute window, one for daily window) and calling both sequentially.

### C. Environment Variables
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` must be added to `.env.example`.
- Server routes access them standardly via `process.env.UPSTASH_REDIS_REST_URL` and `process.env.UPSTASH_REDIS_REST_TOKEN`.
- To avoid runtime crash when variables are unset (e.g. during local development), Upstash clients should only be initialized if both variables are present.

### D. Admin API Constraints
- Admin API routes in `src/app/api/admin/*` import and use authentication functions from `src/lib/admin-auth.ts`.
- These checks (such as `requireAdmin`, `getAuthenticatedUser`) are NOT modified.
- No modifications are made to `src/lib/admin-auth.ts` or admin controllers.

---

## 3. Proposed Fix Strategy

### Phase 1: Dependency Installation
Add the following packages to `package.json` under `dependencies`:
- `@upstash/redis`
- `@upstash/ratelimit`

### Phase 2: Environment Variables Update
Add placeholder variables to `.env.example`:
```env
# Upstash Redis (Milestone 1 Rate Limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### Phase 3: Implement Upstash Rate Limit Helpers (`src/lib/rate-limit.ts`)
1. Re-implement the module to conditionally load the `@upstash/redis` client.
2. Maintain the legacy `rateLimit` function signature and implementation using Upstash Redis commands directly (e.g., `incr`, `pexpire`, `pttl`) or using memory fallback so that existing routes do not break.
3. Export `authLimiter` and `emailLimiter` objects with a `.limit(ip: string)` method that implements:
   - Upstash rate limiters if configured.
   - The memory-based fallback with matching limits if not configured.
   - Dual-tier limit validation for `emailLimiter` (1 request/min AND 10 requests/day).
4. Create a re-export bridge `src/lib/ratelimit.ts` to satisfy the interface contract while avoiding import path breakage:
   ```typescript
   export * from './rate-limit';
   ```

### Phase 4: Update API Routes
1. **`src/app/api/auth/login/route.ts`**:
   Replace the call to `rateLimit` with `authLimiter.limit(ip)` and use `limit.reset` to calculate the `Retry-After` header.
2. **`src/app/api/auth/verify-email/route.ts`**:
   Replace the call to `rateLimit` with `emailLimiter.limit(ip)` and handle 429 response cleanly.

---

## 4. Proposed Code Snippets

### A. Code Proposal for `src/lib/rate-limit.ts`
```typescript
import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
  fallback: "redis" | "memory";
};

export type LimiterResult = {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp in ms
};

// Memory fallback store
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

// 1. Initialize Upstash Redis client conditionally
const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
export const upstashRedisClient = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// 2. Initialize Upstash Rate Limiters
const authUpstashLimiter = upstashRedisClient
  ? new Ratelimit({
      redis: upstashRedisClient,
      limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per minute
      prefix: "@upstash/auth-limiter",
    })
  : null;

const emailMinUpstashLimiter = upstashRedisClient
  ? new Ratelimit({
      redis: upstashRedisClient,
      limiter: Ratelimit.slidingWindow(1, "60 s"), // 1 request per minute
      prefix: "@upstash/email-min-limiter",
    })
  : null;

const emailDayUpstashLimiter = upstashRedisClient
  ? new Ratelimit({
      redis: upstashRedisClient,
      limiter: Ratelimit.slidingWindow(10, "86400 s"), // 10 requests per day (24 hours)
      prefix: "@upstash/email-day-limiter",
    })
  : null;

// Helper for local memory fallback
function memoryRateLimit(key: string, limit: number, windowMs: number): LimiterResult {
  const now = Date.now();
  sweepMemory(now);

  const bucket = memoryStore.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: limit - 1,
      reset: resetAt,
    };
  }

  bucket.count += 1;
  return {
    success: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    reset: bucket.resetAt,
  };
}

// 3. authLimiter export
export const authLimiter = {
  async limit(ip: string): Promise<LimiterResult> {
    const key = `auth:${ip}`;
    if (authUpstashLimiter) {
      try {
        const result = await authUpstashLimiter.limit(key);
        return {
          success: result.success,
          remaining: result.remaining,
          reset: result.reset,
        };
      } catch (err) {
        console.warn("authLimiter failed, falling back to memory:", err);
      }
    }
    return memoryRateLimit(key, 5, 60_000);
  }
};

// 4. emailLimiter export (Dual-tier check)
export const emailLimiter = {
  async limit(ip: string): Promise<LimiterResult> {
    const key = `email:${ip}`;
    if (emailMinUpstashLimiter && emailDayUpstashLimiter) {
      try {
        const resMin = await emailMinUpstashLimiter.limit(key);
        if (!resMin.success) {
          return { success: false, remaining: 0, reset: resMin.reset };
        }
        const resDay = await emailDayLimiter.limit(key);
        if (!resDay.success) {
          return { success: false, remaining: 0, reset: resDay.reset };
        }
        return {
          success: true,
          remaining: Math.min(resMin.remaining, resDay.remaining),
          reset: Math.max(resMin.reset, resDay.reset),
        };
      } catch (err) {
        console.warn("emailLimiter failed, falling back to memory:", err);
      }
    }
    // Memory fallback
    const resMin = memoryRateLimit(`${key}:min`, 1, 60_000);
    if (!resMin.success) return resMin;

    const resDay = memoryRateLimit(`${key}:day`, 10, 24 * 60 * 60 * 1000);
    if (!resDay.success) return resDay;

    return {
      success: true,
      remaining: Math.min(resMin.remaining, resDay.remaining),
      reset: Math.max(resMin.reset, resDay.reset),
    };
  }
};

// 5. Refactored Legacy rateLimit function (compatible with existing code)
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();

  if (!upstashRedisClient && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil(windowMs / 1000),
      fallback: "memory",
    };
  }

  if (upstashRedisClient) {
    try {
      const redisKey = `rl:${key}`;
      const count = await upstashRedisClient.incr(redisKey);
      if (count === 1) {
        await upstashRedisClient.pexpire(redisKey, windowMs);
      }
      const ttl = await upstashRedisClient.pttl(redisKey);
      const retryAfter = ttl > 0 ? Math.ceil(ttl / 1000) : Math.ceil(windowMs / 1000);
      return {
        ok: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfter,
        fallback: "redis",
      };
    } catch (err) {
      console.warn("Upstash Redis error during rateLimit, falling back to memory:", err);
    }
  }

  // Local Memory Fallback
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
```

### B. Code Proposal for `src/lib/ratelimit.ts`
```typescript
// Re-export bridge to satisfy interface contracts
export * from "./rate-limit";
```

### C. Code Proposal for `src/app/api/auth/login/route.ts`
Replace:
```typescript
import { getClientIp, rateLimit } from "@/lib/rate-limit";
...
  const limit = await rateLimit(`login:${getClientIp(req)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "尝试过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
```
with:
```typescript
import { getClientIp, authLimiter } from "@/lib/rate-limit";
...
  const ip = getClientIp(req);
  const limit = await authLimiter.limit(ip);
  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "尝试过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
```

### D. Code Proposal for `src/app/api/auth/verify-email/route.ts`
Replace:
```typescript
import { getClientIp, rateLimit } from "@/lib/rate-limit";
...
  const limit = await rateLimit(`verify-email:${getClientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }
```
with:
```typescript
import { getClientIp, emailLimiter } from "@/lib/rate-limit";
...
  const ip = getClientIp(req);
  const limit = await emailLimiter.limit(ip);
  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
```
