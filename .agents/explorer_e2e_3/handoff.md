# E2E Test Strategy & Inventory Report

## 1. Observation
During the read-only investigation, the following project aspects were directly observed:

1. **Test Framework Presence**:
   - `package.json` contains no Jest, Vitest, Cypress, Playwright, or Puppeteer dependencies under `dependencies` or `devDependencies` (lines 17-48).
   - The only existing test script is `"smoke": "node scripts/smoke-test.js"` (line 14).
2. **Existing Smoke Test Setup**:
   - `scripts/smoke-test.js` (lines 25-27) defines a lightweight fetch-based HTTP request helper:
     ```javascript
     async function request(path, options = {}) {
       return fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
     }
     ```
   - It asserts on response status codes (e.g., `401`, `410`, `302`) and headers (e.g., `Set-Cookie`, `Location`) directly inside a Node.js process.
3. **Rate Limiting Setup**:
   - `src/app/api/auth/login/route.ts` (line 13) has an in-memory/redis rate-limit check:
     ```typescript
     const limit = await rateLimit(`login:${getClientIp(req)}`, 10, 60_000);
     ```
     with a comment: `// TODO: 生产环境需替换为 Redis/Upstash IP 频控，限制 60s/次` (line 12).
   - `src/app/api/auth/verify-email/route.ts` (line 8) contains a similar check:
     ```typescript
     const limit = await rateLimit(`verify-email:${getClientIp(req)}`, 20, 60_000);
     ```
     with comment: `// TODO: 生产环境需替换为 Redis/Upstash IP 频控，限制 60s/次` (line 7).
   - `src/lib/rate-limit.ts` implements a dual-mode (Redis + Map-based in-memory fallback) rate limiter (lines 36-91).
4. **Global UI Toast & API Interceptor**:
   - `src/app/layout.tsx` does not import or use any toast component (e.g., `sonner`).
   - There is no `src/lib/apiClient.ts` file in the codebase.
5. **Database Seeding**:
   - `prisma/schema.prisma` contains models: `User`, `AuditLog`, `UserClaimRequest`, `WhitelistRoster`, `AlumniCorrectionRequest`, `Post`, `News`, `Event`, `EventRegistration`, `MemoryItem`, `TeacherSection`, `ContentSection`, `Story`, `Achievement`.
   - There is no `prisma/seed.ts` file. Existing seeds reside in `scripts/` (e.g., `seed_whitelist.js`, `seed_memories.js`) and use direct `better-sqlite3` operations rather than Prisma Client.
6. **Network Environment Capability**:
   - Command `npm ping` succeeded: `npm notice PONG 3940ms`.
   - Command `npm install --dry-run @upstash/redis @upstash/ratelimit` successfully completed in 21s:
     ```
     add uncrypto 0.1.3
     add @upstash/core-analytics 0.0.10
     add @upstash/redis 1.38.0
     add @upstash/ratelimit 2.0.8
     added 4 packages in 21s
     ```

---

## 2. Logic Chain
1. **Network Capability**: The host system can connect to the internet (as verified by npm ping PONG) and download packages (as verified by npm dry-run install). Therefore, we *can* run `npm installs` for new packages like `sonner`, `@upstash/redis`, and `@upstash/ratelimit`.
2. **E2E Testing Framework Selection**:
   - Heavy browser-based E2E frameworks (Playwright, Cypress, Puppeteer) require downloading heavy browser binaries (typically >100MB). In network-restricted or headless environments, binary downloads are high-risk, slow, and prone to installation or execution failures.
   - However, our specific E2E requirements are:
     - **Rate Limiting**: Can be tested purely at the HTTP level (inspecting status code `429` and headers).
     - **Database Seeding**: Can be verified by executing the seed script and querying the SQLite database records via Prisma.
     - **Global Error Interceptor**: Can be tested via unit/integration specs using a lightweight virtual DOM (e.g., JSDOM and a test runner like Vitest) to check if `toast()` is invoked with the expected parameters/classes.
   - Therefore, a **lightweight Node.js-based fetch framework (extending the existing `smoke-test.js` pattern)** is the most reliable, robust, and fastest E2E testing approach. It eliminates browser binary download overhead while achieving 100% verification coverage.
3. **Rate Limiting Test Strategy**:
   - The test script will invoke the `/api/auth/login` and `/api/auth/verify-email` endpoints in a rapid loop.
   - It will assert that the 6th login request (authLimiter: 5 req/min) returns `429` with `Retry-After` header.
   - It will assert that the 2nd email verification request (emailLimiter: 1 req/min) returns `429`.
4. **Global Error UI Toast Strategy**:
   - Create mock routes returning `429`, `413`, `401/403`, and `500`.
   - Make requests using `apiClient.ts` in a virtual DOM environment (JSDOM).
   - Assert that `sonner` creates a toast DOM element matching the "starry purple" theme classes (`bg-[#0f0a1d]/80`, `border-purple-500/30`, etc.).
5. **Database Seeding Strategy**:
   - The seed script `prisma/seed.ts` must truncate existing database records (to ensure idempotency) and write 100 alumni, 50 news/events, and 20 achievements.
   - The test script will execute the seed command, query the SQLite database via Prisma Client, and assert the correct count in each table.

---

## 3. Caveats
- Since we are not using a full headless browser (like Playwright), we cannot test visual rendering artifacts (e.g. overlapping elements, actual pixel layout on screens). However, we can assert on DOM presence and classes, which is sufficient for verifying the starry purple style application.
- The Redis rate limiting tests assume either a test Redis instance is configured (e.g., in a local Docker container or via mock environment variables) or the test script falls back to checking the memory-based rate limiting logic if Redis is not running. The test suite should handle both scenarios gracefully.

---

## 4. Conclusion
We recommend using a **lightweight hybrid Node-based test approach** (extending the existing `smoke-test.js` fetch pattern for API limits/seeding + JSDOM for UI toasts) rather than installing heavy browser-based E2E frameworks like Playwright or Cypress. This satisfies the restricted network/headless environment constraints while ensuring fast, deterministic, and complete test coverage.

We have designed a 4-tier E2E test inventory and outlined detailed test scenarios for Rate Limiting, API Interceptor, and Database Seeding.

---

## 5. E2E Test Case Inventory (4-Tier)

### Tier 1: Feature Coverage (Happy Path)
* **TC-1.1: Database Seeding Verification**
  * *Description*: Verify that running the database seed script successfully populates all target tables.
  * *Method*: Run `npx prisma db seed`, then query counts: `User` (100 alumni + admin), `News` (25), `Event` (25), `Achievement` (20).
* **TC-1.2: Standard Login Success**
  * *Description*: Verify that a valid alumni/admin can login successfully without hitting rate limits.
  * *Method*: HTTP POST to `/api/auth/login` with correct credentials. Assert `200 OK` and presence of `yc_access_token` cookie.
* **TC-1.3: Standard Email Verification Success**
  * *Description*: Verify that a valid email verification token updates the user's status.
  * *Method*: HTTP POST to `/api/auth/verify-email` with a valid token. Assert `200 OK` and database update.
* **TC-1.4: API Client Standard Request**
  * *Description*: Verify that `apiClient` parses JSON and returns data on standard `200 OK` responses.
  * *Method*: Invoke `apiClient.get('/api/health')`. Assert successful promise resolution with parsed body.

### Tier 2: Boundary & Edge Cases
* **TC-2.1: Auth Limiter (5 requests/minute)**
  * *Description*: Verify that the rate limit triggers exactly on the 6th login request within a 60-second window.
  * *Method*: Rapidly send 6 POST requests to `/api/auth/login` from the same IP. Assert the first 5 return standard responses (`401` or `200`) and the 6th returns `429` with `Retry-After` header.
* **TC-2.2: Email Limiter (1 request/minute)**
  * *Description*: Verify that the rate limit triggers on the 2nd request to verify email within a 60-second window.
  * *Method*: Send 2 POST requests to `/api/auth/verify-email`. Assert the 1st returns standard validation response, and the 2nd returns `429`.
* **TC-2.3: Email Limiter (10 requests/day)**
  * *Description*: Verify that daily email limits are enforced.
  * *Method*: Seed Redis with 10 requests for an IP, send the 11th request. Assert status `429`.
* **TC-2.4: Empty/Malformed payload handling**
  * *Description*: Verify the API client handles non-JSON or truncated payloads gracefully.
  * *Method*: Call API client pointing to an endpoint returning empty or invalid JSON. Assert client handles error without crashing.
* **TC-2.5: Seeding Idempotency**
  * *Description*: Verify that running the seed script multiple times does not result in duplicate records.
  * *Method*: Run `npx prisma db seed` twice consecutively. Verify record counts remain exactly at their target numbers.

### Tier 3: Cross-Feature Integration
* **TC-3.1: API Interceptor - Rate Limit Toast**
  * *Description*: Verify that a `429` status from the API triggers the global starry-purple Sonner toast.
  * *Method*: Simulate a `429` response using a mock endpoint or mock fetch in JSDOM. Verify a toast is displayed containing the text "请求过于频繁，请稍后再试" and styled with starry purple classes (e.g. `bg-[#0f0a1d]/80`).
* **TC-3.2: API Interceptor - Payload Too Large Toast**
  * *Description*: Verify that a `413` status from the API triggers the upload limit toast.
  * *Method*: Simulate a `413` response. Verify a toast containing "上传文件过大" is displayed.
* **TC-3.3: API Interceptor - Authentication Expiry (401/403)**
  * *Description*: Verify that a `401` or `403` status triggers the warning toast and eventual login redirect.
  * *Method*: Simulate `401` response. Verify toast containing "未登录或权限不足" appears.
* **TC-3.4: API Interceptor - Internal Server Error (500)**
  * *Description*: Verify that a `500` status triggers the generic failure toast.
  * *Method*: Simulate `500` response. Verify toast containing "服务器错误，请稍后再试" appears.

### Tier 4: Real-World Scenarios
* **TC-4.1: Brute-Force Login Recovery**
  * *Description*: Simulate a user attempting to guess password repeatedly, getting locked, waiting for rate limit to decay, and logging in.
  * *Method*:
    1. Send 5 invalid login requests (passwords).
    2. Send 6th login request -> verify blocked (`429`).
    3. Advance mock time or wait for `Retry-After` duration.
    4. Send valid login request -> verify success (`200`).
* **TC-4.2: Large File Upload Error Recovery**
  * *Description*: Simulate an admin editing their profile or adding a news post, uploading an oversized image, receiving a toast error, and successfully resubmitting a valid image.
  * *Method*:
    1. Send mock upload request resulting in `413`.
    2. Verify error toast appears on UI.
    3. Send valid upload request resulting in `200`.
    4. Verify success toast appears and error toast is closed.
* **TC-4.3: High-load concurrent rate-limiting**
  * *Description*: Verify that Redis accurately handles multiple clients hitting the rate limits concurrently without race conditions.
  * *Method*: Spawn multiple concurrent Node.js fetch workers hitting `/api/auth/login`. Verify that all requests beyond the cumulative threshold (5 * number of IPs) are correctly rejected with `429`.

---

## 6. Verification Method
To independently verify the test design:
1. Ensure Next.js server is running: `npm run dev` or `npm run build && npm run start`.
2. Inspect the proposed test runner command inside package.json (once the implementer creates the script, e.g. `npx tsx scripts/e2e-test.ts` or `npm run test:e2e`).
3. Check the database file `prisma/dev.db` count before and after seeding using:
   ```bash
   npx prisma studio
   # Or a simple query:
   npx sqlite3 prisma/dev.db "SELECT COUNT(*) FROM WhitelistRoster;"
   ```
4. If rate limiting is active, verify blocking using:
   ```bash
   # Execute 6 consecutive curl commands or a loop in PowerShell:
   1..6 | ForEach-Object { Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method Post -Body '{"username":"test","password":"pwd"}' -ContentType "application/json" }
   # The 6th request must yield StatusCode 429
   ```
