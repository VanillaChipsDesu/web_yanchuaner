# Analysis and Proposed Fix Strategy: Upstash Redis Rate Limiting (Milestone 1)

## 1. Executive Summary
This report analyzes the requirements, current implementation, and proposed architecture for integrating Upstash Redis-backed rate limiting into the Aerospace Alumni site. The goal of Milestone 1 (R1) is to implement rate limiting on the `/login` and `/verify-email` endpoints using `@upstash/redis` and `@upstash/ratelimit`. We will:
- Introduce a new limiter configuration file `src/lib/ratelimit.ts` declaring `authLimiter` (5 req/min) and `emailLimiter` (1 req/min, max 10 req/day).
- Add support for environment variables `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Provide a robust local in-memory sliding window fallback for environments where Upstash is not configured.
- Update `/api/auth/login` and `/api/auth/verify-email` endpoints to use the new limiters.
- Keep the legacy `rateLimit` helper functional for other existing routes, optionally migrating it to use `@upstash/redis` if configured.
- Ensure admin security checks (`src/lib/admin-auth.ts`) remain untouched.

---

## 2. Investigation Findings

### A. Current Rate Limiting Implementation
1. **Helper (`src/lib/rate-limit.ts`)**:
   - Uses `ioredis` configured via `REDIS_URL` if present.
   - Falls back to in-memory `Map`-based fixed-window rate limiting in local/dev environments.
   - Exposes `rateLimit(key, limit, windowMs)` and `getClientIp(req)`.
2. **Endpoints Using `rateLimit`**:
   - **`src/app/api/auth/login/route.ts`**: Currently limits to 10 requests / 60 seconds.
   - **`src/app/api/auth/verify-email/route.ts`**: Currently limits to 20 requests / 60 seconds.
   - **Other Endpoints**: Over 10 other endpoints (including register, forgot-password, reset-password, posts, events, certificate upload, etc.) rely on the legacy `rateLimit` helper. Therefore, we must preserve this helper to avoid breaking the site.
3. **IP Address Identification**:
   - Resolved using `getClientIp` which checks `x-forwarded-for` and `x-real-ip` headers.

### B. Upstash Redis & `@upstash/ratelimit` Configuration
- **Dependencies**: Need to add `@upstash/redis` and `@upstash/ratelimit` to `package.json`.
- **Initialization**: Requires Rest URL and Token. We can instantiate the client conditionally to avoid crashing when credentials are not configured in local/CI environments.
- **Limiting Policy**:
  - `authLimiter`: `Ratelimit.slidingWindow(5, "60 s")`
  - `emailLimiter`: Requires dual-tier checks: 1 req/min (`slidingWindow(1, "60 s")`) AND max 10 req/day (`slidingWindow(10, "86400 s")`). We can execute these in parallel using `Promise.all` to minimize round-trip latency.

### C. Environment Variables
- Placeholders `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` must be added to `.env.example`.
- Next.js automatically loads these variables at runtime, exposing them via `process.env`.

### D. Admin API Constraints
- Admin authorization logic resides in `src/lib/admin-auth.ts` and `/api/admin/*`. It verifies admin cookies (`yc_access_token`) and checks database records (`user.role === 'ADMIN'`).
- The rate limiting changes only apply to the login/email verification pathways and do not touch or compromise the admin authentication checks.

---

## 3. Consensus and Synthesis of Options
To integrate Upstash rate limiting while keeping legacy routes functional, we analyzed two implementation strategies:
1. **Option 1: Dual Helper Files (Recommended)**: Keep `src/lib/rate-limit.ts` intact for legacy routes, and create a brand-new `src/lib/ratelimit.ts` specifically for Upstash-backed limiters.
2. **Option 2: Unified Upgrade**: Update `src/lib/rate-limit.ts` to replace `ioredis` with `@upstash/redis` REST client, and export all rate limiters from `src/lib/ratelimit.ts` by bridging them.

To minimize risk and ensure maximum stability, we propose **Option 1** as the primary solution, with `src/lib/ratelimit.ts` importing `getClientIp` from `src/lib/rate-limit.ts` to avoid code duplication.

---

## 4. Proposed Fix Strategy

### Step 1: Package Installation
Add the required dependencies to `package.json`:
```bash
npm install @upstash/redis @upstash/ratelimit
```

### Step 2: Environment Variables
Append the following variables to `.env.example`:
```env
# Upstash Redis Rate Limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### Step 3: Implement Upstash Limiter (`src/lib/ratelimit.ts`)
Create a new file `src/lib/ratelimit.ts` with sliding window logic and robust local in-memory fallback.

```typescript
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export type LimiterResult = {
  success: boolean;
  remaining: number;
  reset: number;      // Unix timestamp in ms
  retryAfter: number; // Duration in seconds
};

// Check configuration
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasUpstash = !!(url && token);

// Initialize Upstash Redis and Limiters conditionally
export const upstashRedisClient = hasUpstash ? new Redis({ url, token }) : null;

const authUpstashLimiter = upstashRedisClient
  ? new Ratelimit({
      redis: upstashRedisClient,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "@upstash/auth-limiter",
    })
  : null;

const emailMinUpstashLimiter = upstashRedisClient
  ? new Ratelimit({
      redis: upstashRedisClient,
      limiter: Ratelimit.slidingWindow(1, "60 s"),
      prefix: "@upstash/email-min-limiter",
    })
  : null;

const emailDayUpstashLimiter = upstashRedisClient
  ? new Ratelimit({
      redis: upstashRedisClient,
      limiter: Ratelimit.slidingWindow(10, "86400 s"),
      prefix: "@upstash/email-day-limiter",
    })
  : null;

// Memory Fallback Store (True Sliding Window)
const memoryStores = new Map<string, number[]>();

function checkMemoryLimit(
  key: string,
  limit: number,
  windowMs: number,
  commit = true
): LimiterResult {
  const now = Date.now();
  let bucket = memoryStores.get(key) || [];
  bucket = bucket.filter((ts) => ts > now - windowMs);

  if (bucket.length < limit) {
    if (commit) {
      bucket.push(now);
      memoryStores.set(key, bucket);
    }
    const oldest = bucket[0] ?? now;
    const reset = oldest + windowMs;
    return {
      success: true,
      remaining: limit - (commit ? bucket.length : bucket.length + 1),
      reset,
      retryAfter: Math.max(1, Math.ceil((reset - now) / 1000)),
    };
  } else {
    const oldest = bucket[0];
    const reset = oldest + windowMs;
    return {
      success: false,
      remaining: 0,
      reset,
      retryAfter: Math.max(1, Math.ceil((reset - now) / 1000)),
    };
  }
}

/**
 * authLimiter: rate limits 5 requests/minute per IP.
 */
export async function authLimiter(ip: string): Promise<LimiterResult> {
  const key = `auth:${ip}`;
  if (authUpstashLimiter) {
    try {
      const res = await authUpstashLimiter.limit(key);
      return {
        success: res.success,
        remaining: res.remaining,
        reset: res.reset,
        retryAfter: Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
      };
    } catch (err) {
      console.warn("authLimiter failed, falling back to memory:", err);
    }
  }
  return checkMemoryLimit(key, 5, 60_000, true);
}

/**
 * emailLimiter: rate limits 1 request/minute and max 10 requests/day per IP.
 */
export async function emailLimiter(ip: string): Promise<LimiterResult> {
  const minKey = `email-min:${ip}`;
  const dayKey = `email-day:${ip}`;

  if (emailMinUpstashLimiter && emailDayUpstashLimiter) {
    try {
      // Evaluate both in parallel to reduce network latency
      const [resMin, resDay] = await Promise.all([
        emailMinUpstashLimiter.limit(minKey),
        emailDayLimiter.limit(dayKey),
      ]);

      const success = resMin.success && resDay.success;
      const reset = Math.max(resMin.reset, resDay.reset);
      return {
        success,
        remaining: Math.min(resMin.remaining, resDay.remaining),
        reset,
        retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
      };
    } catch (err) {
      console.warn("emailLimiter failed, falling back to memory:", err);
    }
  }

  // Memory fallback evaluation
  const checkMin = checkMemoryLimit(minKey, 1, 60_000, false);
  if (!checkMin.success) return checkMin;

  const checkDay = checkMemoryLimit(dayKey, 10, 86_400_000, false);
  if (!checkDay.success) return checkDay;

  // Commit both
  const resMin = checkMemoryLimit(minKey, 1, 60_000, true);
  const resDay = checkMemoryLimit(dayKey, 10, 86_400_000, true);

  const reset = Math.max(resMin.reset, resDay.reset);
  return {
    success: true,
    remaining: Math.min(resMin.remaining, resDay.remaining),
    reset,
    retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
  };
}
```

### Step 4: Update Login Route (`src/app/api/auth/login/route.ts`)
Replace the legacy rate limiting code:
```typescript
<<<< Before
import { getClientIp, rateLimit } from "@/lib/rate-limit";
...
  // TODO: 生产环境需替换为 Redis/Upstash IP 频控，限制 60s/次
  const limit = await rateLimit(`login:${getClientIp(req)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "尝试过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
==== After
import { getClientIp } from "@/lib/rate-limit";
import { authLimiter } from "@/lib/ratelimit";
...
  const ip = getClientIp(req);
  const limit = await authLimiter(ip);
  if (!limit.success) {
    return NextResponse.json(
      { error: "尝试过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
>>>>
```

### Step 5: Update Email Verification Route (`src/app/api/auth/verify-email/route.ts`)
Replace the legacy rate limiting code:
```typescript
<<<< Before
import { getClientIp, rateLimit } from "@/lib/rate-limit";
...
  // TODO: 生产环境需替换为 Redis/Upstash IP 频控，限制 60s/次
  const limit = await rateLimit(`verify-email:${getClientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }
==== After
import { getClientIp } from "@/lib/rate-limit";
import { emailLimiter } from "@/lib/ratelimit";
...
  const ip = getClientIp(req);
  const limit = await emailLimiter(ip);
  if (!limit.success) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
>>>>
```

---

## 5. Verification Plan
1. **Build and Type Validation**:
   - Run `npm run lint` to ensure no TypeScript or syntax compilation errors.
   - Run `npm run build` to verify Next.js builds successfully.
2. **End-to-End & Smoke Tests**:
   - Run `npm run smoke` (or `node scripts/smoke-test.js`) to confirm authentication flows still succeed.
3. **Limiting Accuracy Verification**:
   - Test login rate limits (local memory) by issuing 6 concurrent requests to `/api/auth/login` and verifying the 6th receives `HTTP 429` with `Retry-After: 60`.
   - Test verify-email rate limits (local memory) by issuing 2 concurrent requests to `/api/auth/verify-email` and verifying the 2nd receives `HTTP 429` with `Retry-After: 60`.
