# Handoff Report: Upstash Redis Rate Limiting Analysis (Milestone 1)

## 1. Observation
- **Existing Rate Limiter**:
  - File: `src/lib/rate-limit.ts` (lines 36-91) implements a fixed-window rate limiter using `ioredis` or in-memory map.
  - File: `src/app/api/auth/login/route.ts` (line 13) calls:
    ```typescript
    const limit = await rateLimit(`login:${getClientIp(req)}`, 10, 60_000);
    ```
  - File: `src/app/api/auth/verify-email/route.ts` (line 8) calls:
    ```typescript
    const limit = await rateLimit(`verify-email:${getClientIp(req)}`, 20, 60_000);
    ```
- **Dependencies**:
  - File: `package.json` does not contain `@upstash/redis` or `@upstash/ratelimit`.
- **Environment Variables**:
  - File: `.env.example` does not contain `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN`.
- **Admin APIs**:
  - File: `src/lib/admin-auth.ts` (lines 89-96) shows that admin verification is strictly cookie and DB database-driven, relying on `yc_access_token` JWT cookie.

---

## 2. Logic Chain
1. **Scope and Safety**: Over 10 other API endpoints call the legacy `rateLimit` helper in `src/lib/rate-limit.ts`. To prevent breaking those endpoints, we must either keep `src/lib/rate-limit.ts` intact or make sure any refactoring to use Upstash maintains complete backward compatibility.
2. **Upstash Client Instantiation**: Upstash Redis is accessed via HTTP REST endpoints. We must conditionally initialize the Upstash Redis client from environment variables (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) so that local/CI environments that do not configure Upstash will fall back to in-memory mode without crashing.
3. **Double Limiting for Verification**: The email verification rate limiter must enforce two separate windows (1 request/minute and max 10 requests/day per IP). To minimize serverless execution latency, we can execute these two Upstash rate limiters concurrently using `Promise.all` rather than sequentially.
4. **Admin Protection**: Admin authorization occurs after authentication sessions are created. Thus, introducing rate limiting on login/verification endpoints does not touch or affect the security logic in `src/lib/admin-auth.ts`.

---

## 3. Caveats
- **IP Spoofing**: `getClientIp` retrieves the IP from `x-forwarded-for` and `x-real-ip`. In a production setting, a secure reverse proxy configuration is required to prevent clients from fabricating headers to bypass rate limits.
- **REST Latency**: While `@upstash/redis` uses REST over HTTP which is highly compatible with serverless Next.js, it introduces minor network overhead. Using `Promise.all` mitigates this for dual-rate checks.

---

## 4. Conclusion
Milestone 1 (R1) should be implemented by:
1. Installing `@upstash/redis` and `@upstash/ratelimit`.
2. Adding Upstash REST credentials to `.env.example`.
3. Creating a new file `src/lib/ratelimit.ts` declaring `authLimiter` and `emailLimiter` with conditional Upstash REST client initialization and a true sliding window memory fallback.
4. Modifying `/api/auth/login` and `/api/auth/verify-email` route handlers to import from `src/lib/ratelimit.ts` and use the new limiters.

---

## 5. Verification Method
- **TypeScript and Build Validation**:
  - Run `npm run lint` and `npm run build` to verify there are no compilation errors.
- **Verification of Rate Limit Rejection**:
  - Start the Next.js server locally in development mode: `npm run dev`.
  - Issue 6 concurrent requests to `/api/auth/login` and verify that the 6th receives `HTTP 429` with `error: "尝试过于频繁，请稍后再试"` and a valid `Retry-After` header.
  - Issue 2 concurrent requests to `/api/auth/verify-email` and verify that the 2nd receives `HTTP 429` with `error: "请求过于频繁，请稍后再试"`.
- **Authentication Smoke Test**:
  - Run `npm run smoke` to verify all primary user paths and administrative access still work correctly.
