# Original User Request

## Initial Request — 2026-06-25T12:52:32Z

System-level integration and finalization for the Aerospace Alumni Site, implementing Upstash Redis rate-limiting, a global API interceptor with "starry purple" themed toast notifications, and a Prisma database seed script for UI testing.

Working directory: c:\Users\lucky dog\Desktop\web_projects\aerospace-alumni-site

## Requirements

### R1. Redis Rate Limiting (防线落地)
Install `@upstash/redis` and `@upstash/ratelimit`. Create `authLimiter` (5 requests/minute) and `emailLimiter` (1 request/minute, max 10/day) in `src/lib/ratelimit.ts`. Apply these limiters to `src/app/api/auth/login/route.ts` and `src/app/api/auth/verify-email/route.ts`, replacing existing placeholders. Use `req.ip` or `x-forwarded-for` for identification. Ensure `.env.example` is updated. Do not modify existing Admin API security checks.

### R2. Global Error UI & API Interceptor (前端防御与优雅反馈)
Install the `sonner` toast library and configure it in the global `layout.tsx`. Force the toast styles to match the "starry purple" theme (e.g., `bg-[#0f0a1d]/80 backdrop-blur-md border border-purple-500/30 text-purple-100`). Create a global API client/interceptor (`src/lib/apiClient.ts` or similar) that automatically parses HTTP status codes (e.g., 429, 413, 401/403) and displays appropriate toasts. Replace native `fetch` calls with this client in 2-3 core pages (e.g., `/login` and `/me/edit`).

### R3. Database Seeding (开发环境数据播种)
Create a `prisma/seed.ts` script. The script must first clear existing tables (respecting foreign key constraints) and then use `faker.js` to generate high-quality dummy data: 100 alumni accounts (including edge cases like very long names), 50 news/event records, and 20 alumni achievements with long descriptions. Add the `prisma.seed` command to `package.json`.

## Acceptance Criteria

### Verification & Testing
- [ ] `npm run build` completes successfully without type errors.
- [ ] `npx prisma db seed` runs successfully and populates the database with the expected volume of dummy data.
- [ ] Code inspection confirms `sonner` is integrated and styled according to the "starry purple" specifications.
- [ ] Code inspection confirms the API interceptor is implemented and integrated into at least `/login` and `/me/edit`.
