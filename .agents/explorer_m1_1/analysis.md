# Analysis Report: Upstash Redis Rate Limiting (Milestone 1)

## Summary of Findings
- **Existing Rate Limiting**: The current rate-limiting is implemented in `src/lib/rate-limit.ts` using fixed windows with a memory store or fallback `ioredis` connection. The endpoints `/login` and `/verify-email` use this client-based rate limiting, which restricts requests to 10/min and 20/min respectively.
- **Proposed Upstash Strategy**: A new module `src/lib/ratelimit.ts` should be created to define `authLimiter` and `emailLimiter` powered by `@upstash/redis` and `@upstash/ratelimit`. For local/test environments where Upstash credentials are not configured, a seamless Map-based sliding window in-memory fallback will guarantee application functionality.

---

## 1. Observation

### Existing Implementation in `src/lib/rate-limit.ts`
The existing implementation provides a custom rate-limiting solution:
- **File**: `src/lib/rate-limit.ts` (lines 36-91)
- **Mechanism**: A fixed-window limiter using a map `memoryStore` or an optional Redis connection configured via `src/lib/redis.ts` (using `ioredis` with `REDIS_URL`).
- **Endpoint usages**:
  - `src/app/api/auth/login/route.ts` line 13:
    ```typescript
    const limit = await rateLimit(`login:${getClientIp(req)}`, 10, 60_000);
    ```
  - `src/app/api/auth/verify-email/route.ts` line 8:
    ```typescript
    const limit = await rateLimit(`verify-email:${getClientIp(req)}`, 20, 60_000);
    ```

### Missing Dependencies & Config
- **File**: `package.json`
- `@upstash/redis` and `@upstash/ratelimit` are currently missing from `dependencies`.
- **File**: `.env.example`
- Standard Upstash environment variables (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) are not defined.

### Admin API Security Checks
- **Files**: `src/lib/admin-auth.ts` and `src/app/api/admin/*`
- The admin check uses JWT auth cookies (`yc_access_token`) decoded and verified via database checks (checking `user.role === 'ADMIN'`). These security checks must not be altered.

---

## 2. Logic Chain

1. **Strict Rate Limiting Isolation**: Since we want Upstash Redis rate limiting to specifically protect auth entry points `/api/auth/login` and `/api/auth/verify-email`, we should introduce a dedicated module `src/lib/ratelimit.ts` to host the instances of `authLimiter` and `emailLimiter`.
2. **Environment Variable Configuration**: Upstash Redis is accessed via HTTP REST endpoints. We must expose `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.example` and load them at runtime using `@upstash/redis`'s automatic `.fromEnv()` constructor.
3. **Double Limiting for Verification**: Since `emailLimiter` must limit to **1 request/minute** AND **max 10 requests/day**, we must instantiate two sliding window limits and execute them sequentially. If either is violated, the overall check fails and we correctly return the rest details.
4. **Resilient Local/Test Fallback**: To ensure local dev modes, tests, and standard CI environments without external Upstash accounts do not break, the limiters in `src/lib/ratelimit.ts` must gracefully degrade to in-memory sliding window tracking when environment variables are omitted.
5. **No Interference with Admin Security**: The admin security checks verify user privilege level from verified JWT sessions. Modifying the rate limiting logic on login/verify-email does not require changes to `admin-auth.ts` or admin APIs.

---

## 3. Caveats
- **IP Spoofing**: `getClientIp` extracts the IP address from `x-forwarded-for` and `x-real-ip`. In production, a secure reverse proxy (like Nginx, Cloudflare, or Vercel) must sanitize these headers to prevent malicious IP-spoofing to bypass the rate limits.
- **Sequential Calls Performance**: The `emailLimiter` makes two sequential Redis calls (one for minute, one for day limit). While Redis latency is negligible, this is a minor overhead that could be parallelized if needed, although sequential checks are cleaner for reporting specific limits.

---

## 4. Conclusion & Proposed Fix Strategy

We propose the following implementation strategy:

### A. Dependencies Addition
Add the following dependencies to `package.json`:
```json
"dependencies": {
  ...
  "@upstash/ratelimit": "^2.0.5",
  "@upstash/redis": "^1.34.3"
}
```

### B. Environment Configuration
Add to `.env.example`:
```env
# Upstash Redis (限流)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### C. Create `src/lib/ratelimit.ts`
Implement `src/lib/ratelimit.ts` with sliding window rate limiting and in-memory fallback support:
```typescript
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getClientIp } from "./rate-limit";

export type LimiterResult = {
  success: boolean;
  remaining: number;
  reset: number; // UNIX timestamp in milliseconds
};

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
let rawAuthLimiter: Ratelimit | null = null;
let rawEmailMinLimiter: Ratelimit | null = null;
let rawEmailDayLimiter: Ratelimit | null = null;

if (hasUpstash) {
  redisClient = Redis.fromEnv();

  rawAuthLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "@upstash/ratelimit:auth",
  });

  rawEmailMinLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(1, "60 s"),
    analytics: true,
    prefix: "@upstash/ratelimit:email-min",
  });

  rawEmailDayLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, "86400 s"),
    analytics: true,
    prefix: "@upstash/ratelimit:email-day",
  });
}

// In-memory fallback rate limiter for development/test environments
type MemoryBucket = { count: number; resetAt: number };
const memoryStores = new Map<string, Map<string, MemoryBucket>>();

function checkMemoryLimit(
  storeName: string,
  key: string,
  limit: number,
  windowMs: number
): LimiterResult {
  const now = Date.now();
  if (!memoryStores.has(storeName)) {
    memoryStores.set(storeName, new Map());
  }
  const store = memoryStores.get(storeName)!;

  // Evict expired keys
  for (const [k, v] of store.entries()) {
    if (v.resetAt <= now) {
      store.delete(k);
    }
  }

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: limit - 1,
      reset: resetAt,
    };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return {
    success,
    remaining: Math.max(0, limit - bucket.count),
    reset: bucket.resetAt,
  };
}

/**
 * authLimiter: rate limits 5 requests/minute per IP.
 */
export async function authLimiter(ip: string): Promise<LimiterResult> {
  if (rawAuthLimiter) {
    const res = await rawAuthLimiter.limit(ip);
    return {
      success: res.success,
      remaining: res.remaining,
      reset: res.reset,
    };
  }
  return checkMemoryLimit("auth", ip, 5, 60_000);
}

/**
 * emailLimiter: rate limits 1 request/minute and max 10 requests/day per IP.
 */
export async function emailLimiter(ip: string): Promise<LimiterResult> {
  if (rawEmailMinLimiter && rawEmailDayLimiter) {
    const resMin = await rawEmailMinLimiter.limit(ip);
    if (!resMin.success) {
      return {
        success: false,
        remaining: resMin.remaining,
        reset: resMin.reset,
      };
    }
    const resDay = await rawEmailDayLimiter.limit(ip);
    if (!resDay.success) {
      return {
        success: false,
        remaining: resDay.remaining,
        reset: resDay.reset,
      };
    }
    return {
      success: true,
      remaining: Math.min(resMin.remaining, resDay.remaining),
      reset: Math.max(resMin.reset, resDay.reset),
    };
  }

  const resMin = checkMemoryLimit("email-min", ip, 1, 60_000);
  if (!resMin.success) return resMin;

  const resDay = checkMemoryLimit("email-day", ip, 10, 86_400_000);
  if (!resDay.success) return resDay;

  return {
    success: true,
    remaining: Math.min(resMin.remaining, resDay.remaining),
    reset: Math.max(resMin.reset, resDay.reset),
  };
}
```

### D. Update Routes
Update route handlers to use the new Upstash-backed limiters:
- **`src/app/api/auth/login/route.ts`**:
  ```typescript
  import { getClientIp } from "@/lib/rate-limit";
  import { authLimiter } from "@/lib/ratelimit";
  // inside POST:
  const ip = getClientIp(req);
  const limit = await authLimiter(ip);
  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "尝试过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  ```
- **`src/app/api/auth/verify-email/route.ts`**:
  ```typescript
  import { getClientIp } from "@/lib/rate-limit";
  import { emailLimiter } from "@/lib/ratelimit";
  // inside POST:
  const ip = getClientIp(req);
  const limit = await emailLimiter(ip);
  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  ```

---

## 5. Verification Method

1. **Verify No Type or Build Errors**:
   After installing the packages and saving files:
   - Run `npm run lint` to check for code issues.
   - Run `npm run build` to verify Next.js builds successfully.
2. **Execute Smoke Test**:
   - Run `node scripts/smoke-test.js` to ensure authentication functions successfully.
3. **Verify Rate Limiting Behavior**:
   - Start the server (`npm run dev`).
   - Send requests repeatedly to `/api/auth/login`:
     ```bash
     for i in {1..6}; do curl -X POST http://localhost:3000/api/auth/login -i; done
     ```
   - Check that the 6th request is rejected with `HTTP 429 Too Many Requests` containing the header `Retry-After: 60` (or similar reset time).
