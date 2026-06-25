# Project: Aerospace Alumni Site Enhancements

## Architecture
- **Authentication Services**: Next.js API routes with Upstash Redis-backed rate limiting.
- **Client Toast Notification & API Interceptor**: React client-side error interceptor (`apiClient.ts`) displaying toasts matching the "starry purple" theme.
- **Database Layer**: Prisma ORM with SQLite (`dev.db`), utilizing a faker-driven seed script (`seed.ts`) for testing environments.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 0 | E2E Testing Track | Design E2E test infra, features inventory, test cases | None | IN_PROGRESS (d5799224-1dc9-4edd-9f88-ade6cb6da100) |
| 1 | Redis Rate Limiting | Add Upstash client & rate limiting to /login & /verify-email | None | IN_PROGRESS (466fc61e-cd8b-4656-875d-b7cb1de0f933) |
| 2 | Global Error UI & API Client | Install sonner, style toast, create apiClient, update login/me/edit | M1 | PLANNED |
| 3 | Database Seeding | Prisma seed script clearing tables & seeding faker data | M2 | PLANNED |
| 4 | Final Integration & E2E Validation | Pass E2E tests, run builds, auditor verify | M0, M3 | PLANNED |

## Interface Contracts
### Upstash Redis Limiter (`src/lib/ratelimit.ts`)
- `authLimiter`: rate limits 5 requests/minute per IP
- `emailLimiter`: rate limits 1 request/minute and max 10 requests/day per IP
- Functions return status indicating whether the request is allowed, remaining tokens, and time to reset.

### API Interceptor (`src/lib/apiClient.ts`)
- Wraps/extends fetch API to intercept responses
- Inspects response status codes:
  - 429: Show toast "请求过于频繁，请稍后再试" (or similar rate limit message)
  - 413: Show toast "上传文件过大"
  - 401/403: Show toast "登录已失效/无权访问"
  - 500: Show toast "服务器 internal 错误"
- Seamlessly propagates data back to pages.

## Code Layout
- `src/lib/ratelimit.ts`: Rate limiting setup
- `src/lib/apiClient.ts`: Intercepting fetch client
- `src/app/api/auth/login/route.ts`: Login API
- `src/app/api/auth/verify-email/route.ts`: Email verification API
- `src/app/layout.tsx`: Global layout with Toast provider
- `prisma/seed.ts`: Seed script
- `package.json`: Prisma seed configuration
