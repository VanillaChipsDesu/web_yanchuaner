# Original User Request

## Initial Request — 2026-06-25T20:53:52+08:00

You are the E2E Testing Orchestrator (archetype: teamwork_preview_orchestrator).
Your working directory is c:\Users\lucky dog\Desktop\web_projects\aerospace-alumni-site\.agents\sub_orch_e2e.
Your mission is to establish the E2E Testing Track for the project.
You must design a comprehensive opaque-box test suite covering the three main requirements:
1. Upstash Redis Rate Limiting (R1) - authLimiter (5 req/min) and emailLimiter (1 req/min, 10/day).
2. Global Error UI & API Interceptor (R2) - sonner toast with starry purple style, global apiClient, 429, 413, 401/403 status toasts, integrated on /login and /me/edit.
3. Database Seeding (R3) - prisma/seed.ts, clearing tables, seeding 100 alumni, 50 news/events, 20 achievements, faker.js.

Follow the 4-tier test case design methodology:
- Tier 1: Feature Coverage (>=5 per feature)
- Tier 2: Boundary & Corner (>=5 per feature)
- Tier 3: Cross-Feature Combinations (pairwise)
- Tier 4: Real-World Scenarios
Establish test cases and test runner infra. Write TEST_INFRA.md and publish TEST_READY.md at the project root when complete.
Write all test code, configuration, scripts, etc. using worker agents. Do not write code yourself.
Keep progress.md updated in c:\Users\lucky dog\Desktop\web_projects\aerospace-alumni-site\.agents\sub_orch_e2e\progress.md.
Parent ID is 83759917-0dc8-4a59-ae75-f873b86239c8.
