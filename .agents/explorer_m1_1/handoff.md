# Handoff Report: Upstash Redis Rate Limiting (Milestone 1)

## 1. Observation
- **Existing Rate Limiter**:
  - Path: `src/lib/rate-limit.ts`
  - Current logic:
    ```typescript
    export async function rateLimit(
      key: string,
      limit: number,
      windowMs: number,
    ): Promise<RateLimitResult> { ... }
    ```
    This function uses `getRedisClient()` from `src/lib/redis.ts` (relying on `REDIS_URL` and `ioredis`) or falls back to `memoryStore` (a fixed-window Map).
  - `/api/auth/login` uses:
    ```typescript
    const limit = await rateLimit(`login:${getClientIp(req)}`, 10, 60_000);
    ```
  - `/api/auth/verify-email` uses:
    ```typescript
    const limit = await rateLimit(`verify-email:${getClientIp(req)}`, 20, 60_000);
    ```
- **Admin Security**:
  - Found that routes in `/api/admin/` import `requireAdmin` from `src/lib/admin-auth.ts`, which validates JWT and user roles (`user.role === 'ADMIN'`).
- **Dependencies**:
  - `package.json` contains `"ioredis": "^5.10.1"` but lacks `@upstash/redis` and `@upstash/ratelimit`.
- **Environment**:
  - `.env.example` has `REDIS_URL=""` but lacks `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

## 2. Logic Chain
1. **Creation of dedicated module**: To satisfy the Upstash specifications without breaking other parts of the system, we should create a new module `src/lib/ratelimit.ts` to export `authLimiter` and `emailLimiter`.
2. **Support for multiple limits**: Since the email verification endpoint requires a minute limit (1 request/minute) and a day limit (10 requests/day), we will create two independent `@upstash/ratelimit` instances and execute their `limit()` checks sequentially.
3. **Resilient local fallback**: Because local test runners, smoke tests, and developer environments may run without Upstash credentials configured, the new limiters must fall back to a local Map-based sliding window rate-limiting implementation when `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` are undefined.
4. **No impact on admin checks**: Since rate limiting protects public auth endpoints and admin routes rely on JWT cookies, no changes are needed in `src/lib/admin-auth.ts` or `/api/admin/` routes.

---

## 3. Caveats
- **IP spoofing potential**: The `getClientIp` function relies on standard headers (`x-forwarded-for`, `x-real-ip`). We assume the production hosting platform sanitizes these headers.
- **Upstash latency**: The `emailLimiter` checks two limits sequentially, meaning it performs up to two HTTP calls to Upstash Redis. While latency is usually very low (~10-20ms), it adds slight overhead over single-check limters.

---

## 4. Conclusion
We have completed the analysis for Milestone 1. The recommended strategy is:
1. Add `@upstash/redis` and `@upstash/ratelimit` to `package.json`.
2. Add Upstash credentials keys to `.env.example`.
3. Create `src/lib/ratelimit.ts` with the new limiter instances, sequential logic for `emailLimiter`, and an in-memory sliding-window fallback.
4. Integrate `authLimiter` and `emailLimiter` in `src/app/api/auth/login/route.ts` and `src/app/api/auth/verify-email/route.ts`.

All proposed changes and the full source code for `src/lib/ratelimit.ts` are documented in `analysis.md` in this directory.

---

## 5. Verification Method
- **Lint & Compile Check**: Run `npm run lint` and `npm run build` to confirm everything compiles without TypeScript errors.
- **Automated Smoke Tests**: Run `node scripts/smoke-test.js` to verify basic auth features continue to function.
- **Manual Rate Limiting Validation**:
  - Run the server locally.
  - Send 6 sequential POST requests to `/api/auth/login`.
  - Confirm the 6th request is rejected with HTTP status code 429 and contains the `Retry-After` header.
