## 2026-06-25T12:54:27Z
You are teamwork_preview_explorer.
Your working directory is: c:\Users\lucky dog\Desktop\web_projects\aerospace-alumni-site\.agents\explorer_e2e_2
Your task:
1. Analyze the project structure, especially package.json, prisma/schema.prisma, src/lib/ratelimit.ts, src/lib/apiClient.ts, src/app/api/auth/login/route.ts, src/app/api/auth/verify-email/route.ts, src/app/layout.tsx, and prisma/seed.ts.
2. Determine what test runner/framework we should use for E2E testing. Since we are in a network-restricted (CODE_ONLY) environment, can we run npm installs? Check if packages can be downloaded or if they are cached, or if we can use a custom lightweight Node.js-based fetch/JSDOM/Puppeteer/Playwright approach to simulate E2E testing of API limits, error interceptor toasts, and database seeding.
3. Design a test case inventory following the 4-tier E2E testing methodology (Tier 1: Feature Coverage, Tier 2: Boundary, Tier 3: Cross-Feature, Tier 4: Real-World).
4. Outline how we should test:
   - Upstash Redis Rate Limiting (authLimiter: 5 req/min, emailLimiter: 1 req/min, 10/day).
   - Global Error UI & API Interceptor (Sonner toast, apiClient, status codes 429, 413, 401/403, 500).
   - Database Seeding (clearing, seeding 100 alumni, 50 news/events, 20 achievements).
5. Write your report to c:\Users\lucky dog\Desktop\web_projects\aerospace-alumni-site\.agents\explorer_e2e_2\handoff.md and notify the main orchestrator.
