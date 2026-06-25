# BRIEFING — 2026-06-25T12:56:00Z

## Mission
Implement Upstash Redis rate limiting for auth and verify-email endpoints with local memory fallback.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\lucky dog\Desktop\web_projects\aerospace-alumni-site\.agents\worker_m1
- Original parent: 83759917-0dc8-4a59-ae75-f873b86239c8
- Milestone: Milestone 1

## 🔒 Key Constraints
- Install `@upstash/redis` and `@upstash/ratelimit`.
- Implement Map-based sliding window local memory fallback when Upstash keys are missing/unavailable.
- Refactor the legacy `rateLimit` helper without breaking other endpoints.
- Update login endpoint to use `authLimiter` with Retry-After header.
- Update verify-email endpoint to use `emailLimiter`.
- DO NOT modify existing Admin API security checks or admin auth functions.
- Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to `.env.example`.
- Ensure clean build via `npm run build`.

## Current Parent
- Conversation ID: 83759917-0dc8-4a59-ae75-f873b86239c8
- Updated: not yet

## Task Summary
- **What to build**: Upstash Redis Rate Limiting integration with a local sliding window fallback.
- **Success criteria**: Limiting rules applied correctly (auth: 5/min, email: 1/min AND 10/day), local fallback operational, build compiles without errors.
- **Interface contracts**: `src/lib/rate-limit.ts` / `src/lib/ratelimit.ts`.
- **Code layout**: Source in `src/`.

## Key Decisions Made
- Use memory Map for sliding window algorithm to ensure standard rate-limit behavior when fallback is active.

## Artifact Index
- None yet.

## Change Tracker
- **Files modified**: None yet.
- **Build status**: TBD
- **Pending issues**: None.

## Quality Status
- **Build/test result**: TBD
- **Lint status**: TBD
- **Tests added/modified**: TBD

## Loaded Skills
- None.
