# E2E Testing Framework Strategy & Test Case Inventory

## 1. Observation
During read-only codebase investigation, the following structural files, configurations, and environment attributes were observed:

- **Missing/Planned Files (`PROJECT.md`):**
  - `src/lib/apiClient.ts` (API Interceptor client) does not exist yet (planned for Milestone 2).
  - `prisma/seed.ts` (Prisma faker seed script) does not exist yet (planned for Milestone 3).
  - `src/lib/ratelimit.ts` does not exist; the actual implementation is at `src/lib/rate-limit.ts` (with a hyphen).

- **Current Rate Limiting Implementation (`src/lib/rate-limit.ts` & Routes):**
  - `src/lib/rate-limit.ts` implements a fixed-window rate limiter. It attempts to connect to Redis via `getRedisClient()` from `src/lib/redis.ts` (using `process.env.REDIS_URL`).
  - If Redis is unavailable, it sweeps and falls back to an in-memory Map called `memoryStore` (lines 12, 73-90).
  - In `src/app/api/auth/login/route.ts` (line 13):
    ```typescript
    const limit = await rateLimit(`login:${getClientIp(req)}`, 10, 60_000);
    ```
    This is currently set to 10 requests per minute (will be updated to 5 req/min).
  - In `src/app/api/auth/verify-email/route.ts` (line 8):
    ```typescript
    const limit = await rateLimit(`verify-email:${getClientIp(req)}`, 20, 60_000);
    ```
    This is currently set to 20 requests per minute (will be updated to 1 req/min, 10/day).

- **Root Layout (`src/app/layout.tsx`):**
  - The layout wraps page contents with `<AuthProvider>` (lines 82-94) but does not import or mount the Sonner `<Toaster />` component yet.

- **Environment & Package Management:**
  - `npm ping` command completed successfully (pong in 82s):
    ```
    npm notice PING https://registry.npmjs.org/
    npm notice PONG 82496ms
    ```
  - A dry-run installation of `puppeteer-core` completed successfully:
    ```
    npm install -D puppeteer-core --dry-run
    added 26 packages in 2m
    ```
  - Google Chrome is installed on the host machine at:
    ```
    C:\Program Files\Google\Chrome\Application\chrome.exe (True)
    ```

---

## 2. Logic Chain
Based on these observations, the following logical steps lead to our testing framework decisions:

1. **Package Installation Feasibility:** Since `npm ping` returned a successful PONG and `npm install --dry-run` succeeded, installing npm packages in the CODE_ONLY sandbox environment is possible.
2. **Download Constraints:** The dry-run command took 2 minutes for just 26 packages, indicating that package downloads are relatively slow. Heavy E2E frameworks like Playwright or Cypress (which download full browser binaries exceeding 100MB-200MB) are highly likely to timeout or fail during installation.
3. **Host Chrome Availability:** Since Google Chrome is already pre-installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`, we can bypass browser downloads entirely by using `puppeteer-core` (which only downloads lightweight Node.js bindings) and pointing its `executablePath` directly to the host Chrome.
4. **Lightweight Test Runner:** Node.js v20 is used in the workspace (indicated by devDependencies typescript/node typings). Node.js v20 contains a built-in test runner (`node:test`) and assertion module (`node:assert`). This eliminates the need to download heavy test runners like Jest or Vitest, reducing dependency overhead to zero.
5. **Rate Limit Testing Fallback:** Since `rate-limit.ts` automatically falls back to an in-memory `memoryStore` if `REDIS_URL` is empty, E2E tests can test rate-limiting features without running a live Redis instance.

---

## 3. Caveats
- Since `src/lib/apiClient.ts` and `prisma/seed.ts` are planned but not yet implemented, E2E tests cannot be executed immediately. They must be developed in tandem with those milestones.
- To test the daily rate limit (10 requests/day per IP) in a fast E2E suite, we cannot wait 24 hours. The testing suite must programmatically clear/mock the rate limiter's internal state or speed up the system clock.
- Launching the host Google Chrome application from the sandboxed shell requires execution permissions and headless mode configuration.

---

## 4. Conclusion & Testing Strategy
We recommend using **Node.js Native Test Runner (`node:test`)** as the primary E2E testing framework, combined with one of two execution modes:

### Strategy Option A: Real Browser E2E (Recommended for UI & Toast Verification)
- **Framework:** `node:test` + `puppeteer-core` (pointing to the host Chrome).
- **Execution Flow:**
  1. Boot the dev server: `npm run dev` (run programmatically or as a pre-test script).
  2. Launch Puppeteer-core:
     ```typescript
     import puppeteer from 'puppeteer-core';
     const browser = await puppeteer.launch({
       executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
       headless: true
     });
     ```
  3. Navigate to pages (e.g. `/login`), input values, click buttons, and assert that the Sonner toast container renders elements with class names matching the starry purple theme (`bg-[#0f0a1d]/80 backdrop-blur-md border border-purple-500/30 text-purple-100`).

### Strategy Option B: Lightweight Node-based API & Interceptor Simulation (Recommended if Puppeteer fails to launch)
- **Framework:** `node:test` + JSDOM or mock-browser environment.
- **Execution Flow:**
  1. Instantiate a simple mock JSDOM instance in the test script.
  2. Import the client-side `apiClient` (which wraps `fetch`).
  3. Mock the global `fetch` to return specific HTTP status codes (e.g. 429, 413, 401, 500).
  4. Call `apiClient` functions and verify that the Sonner `toast()` method is invoked with correct styled options.

---

## 5. 4-Tier Test Case Inventory

### Tier 1: Feature Coverage (Happy Path)
- **TC-1.1: Database Seeding verification**
  - **Action:** Run the Prisma seed script (`npx prisma db seed`).
  - **Expected:** Clear all existing database tables, and insert exactly 100 alumni, 50 news/events, and 20 achievements. Check counts using Prisma Client query.
- **TC-1.2: Normal Login Flow**
  - **Action:** Send a POST to `/api/auth/login` with valid user credentials.
  - **Expected:** Returns status code 200 with `success: true` and cookie `AUTH_COOKIE` is set on the response headers.
- **TC-1.3: Normal Email Verification Flow**
  - **Action:** Send a POST to `/api/auth/verify-email` with a valid, unexpired verify token.
  - **Expected:** Returns status code 200, updates user's `emailVerified` field, and clears the token hashes.
- **TC-1.4: API Client Normal Request**
  - **Action:** Call `apiClient.get('/api/health')`.
  - **Expected:** Propagates data correctly, does not show any error toasts.

### Tier 2: Boundary (Edge Cases & Limits)
- **TC-2.1: Login Rate Limiting (authLimiter)**
  - **Action:** Make 5 requests to `/api/auth/login` from the same simulated IP, followed by a 6th request.
  - **Expected:** The first 5 requests return standard business responses (200/401). The 6th request returns status `429` with error message `"尝试过于频繁，请稍后再试"` and includes the `Retry-After` header.
- **TC-2.2: Email Verification Minute Rate Limiting**
  - **Action:** Make 2 requests to `/api/auth/verify-email` from the same simulated IP in under 60 seconds.
  - **Expected:** The 2nd request returns status `429` with error `"请求过于频繁"`.
- **TC-2.3: Email Verification Daily Rate Limiting**
  - **Action:** Send 10 requests to `/api/auth/verify-email` from the same IP (simulating spacing them out or mocking time), followed by an 11th request.
  - **Expected:** The 11th request returns `429` with rate-limit errors.
- **TC-2.4: API Interceptor - Payload Too Large (413)**
  - **Action:** Send an excessively large request body that triggers 413, or mock a 413 response.
  - **Expected:** `apiClient` intercepts the 413 status and displays a Sonner toast with `"上传文件过大"`.
- **TC-2.5: API Interceptor - Invalid Credentials/Session (401/403)**
  - **Action:** Trigger a 401/403 response on a page utilizing `apiClient`.
  - **Expected:** `apiClient` intercepts the status and displays a Sonner toast with `"登录已失效/无权访问"`.
- **TC-2.6: API Interceptor - Internal Server Error (500)**
  - **Action:** Trigger a 500 error response.
  - **Expected:** `apiClient` intercepts the status and displays a Sonner toast with `"服务器 internal 错误"`.

### Tier 3: Cross-Feature (State Transitions & Integration)
- **TC-3.1: Reset/Seed and Login Integration**
  - **Action:** Run database seed script, then attempt to login as a seeded user who is marked as "unverified" in the database.
  - **Expected:** Login returns `403` status with code `"EMAIL_NOT_VERIFIED"`. The UI interceptor displays a warning toast.
- **TC-3.2: Rate Limit Recovery**
  - **Action:** Trigger a 429 block on login. Wait for the duration specified in `Retry-After` (or mock clearing the limit key) and request again.
  - **Expected:** Request goes through and returns standard 200/401 response instead of 429.
- **TC-3.3: Global Toast Styles Match Starry Purple Theme**
  - **Action:** Trigger 429, 413, 401, or 500 toasts in a Puppeteer test window. Inspect the toast DOM element.
  - **Expected:** Elements must contain background class `bg-[#0f0a1d]/80`, backdrop blur class `backdrop-blur-md`, purple border class `border-purple-500/30`, and text class `text-purple-100`.

### Tier 4: Real-World (Simulations & Reliability)
- **TC-4.1: Upstash Redis Service Downtime Fallback**
  - **Action:** Simulate Redis server down by setting an invalid `REDIS_URL`. Trigger multiple login and verify requests.
  - **Expected:** The server does not crash (no 500 error), and successfully falls back to in-memory rate limiting (`memoryStore`).
- **TC-4.2: High Concurrency Rate Limiting**
  - **Action:** Send 20 concurrent requests to `/api/auth/login` from the same IP at the exact same millisecond.
  - **Expected:** Exactly 5 requests are permitted, and 15 requests are rejected with a 429 status.
- **TC-4.3: Seed Data Integrity and Uniqueness Constraints**
  - **Action:** Run the seed script twice consecutively.
  - **Expected:** The second run clears the database cleanly and recreates the 100/50/20 data without unique constraint or foreign key violations.

---

## 6. Verification Method

### Framework setup verification:
Create a test file `test-env.js` in a test folder:
```javascript
const test = require('node:test');
const assert = require('node:assert');

test('Verify Native Test Runner is active', () => {
  assert.strictEqual(1 + 1, 2);
});
```
Run this file using:
```bash
node test-env.js
```
Expected output:
```
✔ Verify Native Test Runner is active (0.5283ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ todo 0
ℹ duration_ms 55.4328
```

### Puppeteer Launch Verification:
Create a script `test-chrome-launch.js`:
```javascript
const puppeteer = require('puppeteer-core');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true
    });
    console.log('Successfully launched host Google Chrome!');
    await browser.close();
  } catch (err) {
    console.error('Failed to launch host Chrome:', err);
  }
})();
```
Run:
```bash
node test-chrome-launch.js
```
Expected output:
```
Successfully launched host Google Chrome!
```
Invalidation conditions: If the host Google Chrome binary is uninstalled or moved from `C:\Program Files\Google\Chrome\Application\chrome.exe`, the test launcher will fail.
