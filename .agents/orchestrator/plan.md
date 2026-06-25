# Implementation Plan: Aerospace Alumni Site Enhancements

## Milestones
- **M0: Planning & Test Preparation (Dual Track)**
  - Establish E2E testing framework, features inventory, and design opaque-box test scenarios.
  - Deliver `TEST_INFRA.md` and prepare tests.
- **M1: Upstash Redis Rate Limiting (R1)**
  - Install `@upstash/redis` and `@upstash/ratelimit`.
  - Create Upstash Redis client and limiters (`authLimiter` and `emailLimiter`) in `src/lib/ratelimit.ts`.
  - Update `src/app/api/auth/login/route.ts` and `src/app/api/auth/verify-email/route.ts` to use new limiters.
  - Update `.env.example` with Upstash configuration.
- **M2: Global Error UI & API Interceptor (R2)**
  - Install `sonner`.
  - Integrate and style `sonner` Toast provider inside the global `layout.tsx` to match the "starry purple" theme.
  - Implement a global API client (`src/lib/apiClient.ts`) that intercepts responses and triggers styled toasts for HTTP status codes (e.g., 429, 413, 401/403).
  - Integrate `apiClient` into core pages: `/login` and `/me/edit`.
- **M3: Database Seeding (R3)**
  - Install dev dependency `@faker-js/faker`.
  - Create `prisma/seed.ts` to clear database tables (respecting foreign keys) and generate high-quality dummy data (100 alumni, 50 news/events, 20 achievements with long descriptions).
  - Add `prisma.seed` config to `package.json`.
- **M4: Integration & E2E Verification**
  - Run all E2E test cases.
  - Perform adversarial coverage testing.
  - Complete the forensic integrity audit.
  - Run `npm run build` to verify there are no compilation errors.

## Phase Decompositions & Parallelization
- Track 1: E2E Testing Track (spawns `teamwork_preview_orchestrator` in sub-orchestrator role)
- Track 2: Implementation Track (runs sequentially: M1 -> M2 -> M3)
- Final Track: E2E Verification & Auditing (M4)
