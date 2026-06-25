# Handoff Report: Upstash Redis Rate Limiting Analysis (Milestone 1)

## 1. Observation
- **Current rate limiter file location**: `src/lib/rate-limit.ts`
  - Uses `ioredis` for connection: `import getRedisClient from "@/lib/redis";` (line 2).
  - Uses memory store: `const memoryStore = new Map<string, Bucket>();` (line 12).
- **Current login rate limit implementation**: `src/app/api/auth/login/route.ts`
  - Line 13: `const limit = await rateLimit(\`login:\${getClientIp(req)}\`, 10, 60_000);`
- **Current email verification rate limit implementation**: `src/app/api/auth/verify-email/route.ts`
  - Line 8: `const limit = await rateLimit(\`verify-email:\${getClientIp(req)}\`, 20, 60_000);`
- **Other rate-limiting endpoints**:
  - `grep_search` found 10 other routes calling the same legacy `rateLimit` helper, such as `src/app/api/auth/forgot-password/route.ts` (lines 19-20), `src/app/api/auth/register/route.ts` (line 31), and `src/app/api/posts/route.ts` (line 18).
- **Environment variables**:
  - `package.json` does not contain `@upstash/redis` or `@upstash/ratelimit`.
  - `.env.example` only includes `REDIS_URL=""` (line 22).
- **Admin authentication checks**:
  - Located in `src/lib/admin-auth.ts`. It verifies session tokens using prisma and JWT signatures (such as `requireAdmin` at line 89). These are independent of the IP-based API rate limiters.

---

## 2. Logic Chain
1. **Adding Upstash Dependencies**: To use Upstash rate limiting, `@upstash/redis` and `@upstash/ratelimit` must be added to `package.json` dependencies.
2. **Preserving Other Routes**: Since `grep_search` showed multiple other API endpoints using the `rateLimit` helper, we cannot simply delete it. The legacy `rateLimit` function must be refactored to use `@upstash/redis` (or memory fallback) rather than being deleted.
3. **Fulfilling Interface Contracts**:
   - `PROJECT.md` specifies `authLimiter` should limit 5 requests/minute per IP, and `emailLimiter` should limit 1 request/minute and max 10 requests/day per IP.
   - We must export `authLimiter` and `emailLimiter` objects with a `.limit(ip: string)` function from `src/lib/rate-limit.ts` (or `src/lib/ratelimit.ts`).
   - For `emailLimiter`, since it requires dual-tier limiting (minute-level and day-level), we will instantiate two separate `@upstash/ratelimit` instances and run them sequentially, returning the aggregate result.
4. **Memory Fallback Robustness**:
   - To make the rate limiters safe for local development and outages, if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are missing, or if an error is caught during Redis communication, the system will fall back to an equivalent local memory rate limiting check.
5. **No Admin Impact**: No changes will be made to `src/lib/admin-auth.ts` or `src/app/api/admin/*`, satisfying the constraint not to modify existing Admin API security checks.

---

## 3. Caveats
- **Verification Environment**: The actual rate limiting behaviour on Upstash can only be fully verified once the environment variables `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correctly populated. If they are absent, the system transparently runs the memory-based rate limiting check.

---

## 4. Conclusion
Milestone 1 can be successfully implemented by updating dependencies, extending environment variables in `.env.example`, refactoring `src/lib/rate-limit.ts` to support `@upstash/redis` & `@upstash/ratelimit` alongside memory-based fallbacks, exporting `authLimiter` and `emailLimiter`, and updating `login` and `verify-email` routes to consume them. Existing admin security controls will remain fully intact.

---

## 5. Verification Method
1. **Build Verification**: Run `npm run build` after adding dependencies and modifying the files to ensure TypeScript compilation passes.
2. **Smoke Test Verification**: Run `npm run smoke` to ensure no route logic is broken.
3. **Manual Validation**:
   - Start the dev server using `npm run dev`.
   - Send 6 rapid POST requests to `/api/auth/login`. Verify that the 6th request fails with status code `429` and includes the `Retry-After` header.
   - Send 2 rapid POST requests to `/api/auth/verify-email`. Verify that the 2nd request fails with status code `429`.
