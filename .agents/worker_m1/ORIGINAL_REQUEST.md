## 2026-06-25T12:55:58Z
You are the Worker for Milestone 1 (archetype: teamwork_preview_worker).
Your working directory is c:\Users\lucky dog\Desktop\web_projects\aerospace-alumni-site\.agents\worker_m1.
Your task is to implement Upstash Redis Rate Limiting (R1) based on the findings from the Explorers.

Key requirements:
1. Install `@upstash/redis` and `@upstash/ratelimit`.
2. Create/update `src/lib/rate-limit.ts` to initialize Upstash Redis rate limiters:
   - `authLimiter`: limits login attempts to 5 requests per minute per client IP.
   - `emailLimiter`: limits email verification attempts to 1 request per minute AND max 10 requests per day per client IP.
   - Provide a Map-based sliding window local memory fallback for both limiters in case the Upstash environment variables (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) are not configured or are unavailable.
   - Ensure the legacy `rateLimit` helper (used by other endpoints) is refactored to conditionally use Upstash Redis or fall back to memory, so that existing routes do not break.
3. Create/update `src/lib/ratelimit.ts` to re-export everything from `src/lib/rate-limit.ts` (satisfying the interface contracts).
4. Update `src/app/api/auth/login/route.ts` to use `authLimiter` instead of the legacy `rateLimit`. Parse client IP via `getClientIp(req)` or `x-forwarded-for`. Set the `Retry-After` header when returning a 429 status code.
5. Update `src/app/api/auth/verify-email/route.ts` to use `emailLimiter`. Parse client IP via `getClientIp(req)` or `x-forwarded-for`. Return a 429 status code when limited.
6. Do NOT modify existing Admin API security checks or admin auth functions (such as `requireAdmin` or files under `src/app/api/admin`).
7. Update `.env.example` to define:
   ```env
   # Upstash Redis
   UPSTASH_REDIS_REST_URL=""
   UPSTASH_REDIS_REST_TOKEN=""
   ```
8. Verify your implementation by running a build (npm run build) and making sure it completes without TypeScript or compilation errors.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

Please report your progress in c:\Users\lucky dog\Desktop\web_projects\aerospace-alumni-site\.agents\worker_m1\progress.md. Write your completion report/handoff to handoff.md inside your directory and send a message when done.
Parent conversation ID is 83759917-0dc8-4a59-ae75-f873b86239c8.
