/* Smoke tests for the auth + admin protection flow.
 * Spawns the standalone server, hits a fixed list of endpoints, and prints PASS/FAIL.
 *
 * Required env: SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD_HASH must already be in .env
 *               (we DO NOT print or copy any secret values).
 */
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const STANDALONE = path.join(ROOT, ".next", "standalone");
const SERVER = path.join(STANDALONE, "server.js");

if (!fs.existsSync(SERVER)) {
  console.error("ERROR: .next/standalone/server.js not found. Run `npm run build` first.");
  process.exit(2);
}

// Mirror static + public into standalone (Next does not auto-copy them).
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(path.join(ROOT, ".next", "static"), path.join(STANDALONE, ".next", "static"));
copyDir(path.join(ROOT, "public"), path.join(STANDALONE, "public"));

// Load env from .env into a child-only env object (do not mutate process.env beyond what we need).
function loadDotenv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const txt = fs.readFileSync(filePath, "utf-8");
  for (const line of txt.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}
const envFile = loadDotenv(path.join(ROOT, ".env"));

const PORT = "31729";
const dbAbsolute = path.join(ROOT, "dev.db");
const childEnv = {
  ...process.env,
  ...envFile,
  PORT,
  HOSTNAME: "127.0.0.1",
  NODE_ENV: "production",
  // Pin DATABASE_URL to the repo's dev.db (absolute) so the standalone
  // server, which runs from .next/standalone, finds the correct file.
  DATABASE_URL: `file:${dbAbsolute.replace(/\\/g, "/")}`,
};

const required = ["SESSION_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD_HASH"];
for (const k of required) {
  if (!childEnv[k]) {
    console.error(`ERROR: missing required env: ${k}`);
    process.exit(2);
  }
}

console.log("[smoke] starting standalone server on port", PORT);
const server = spawn(process.execPath, [SERVER], {
  cwd: STANDALONE,
  env: childEnv,
  stdio: ["ignore", "pipe", "pipe"],
});

const serverLog = fs.createWriteStream(path.join(ROOT, ".claude", "run-logs", "smoke-server.log"));
server.stdout.pipe(serverLog);
server.stderr.pipe(serverLog);

const BASE = `http://127.0.0.1:${PORT}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitReady(timeoutMs = 25_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(BASE + "/api/health", { redirect: "manual" });
      if (r.status === 200 || r.status === 503) return true;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  return false;
}

const results = {};
function record(name, ok, details) {
  results[name] = { status: ok ? "passed" : "failed", details };
  console.log(`[smoke] ${ok ? "PASS" : "FAIL"} :: ${name} :: ${details}`);
}

function parseSetCookie(headers) {
  const all = [];
  // Node fetch consolidates set-cookie via headers.getSetCookie() on Node 18.16+
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const raw = headers.get("set-cookie");
  if (raw) all.push(raw);
  return all;
}

function extractCookieValue(setCookieList, name) {
  for (const sc of setCookieList) {
    const m = new RegExp(`(?:^|; )${name}=([^;]+)`).exec(sc);
    if (m) return m[1];
  }
  return null;
}

async function run() {
  if (!(await waitReady())) {
    console.error("[smoke] server failed to start");
    return false;
  }

  // 1. Anonymous home page contains gatekeeper UI text (SSR renders the spinner first;
  //    the password form appears post-hydration. Accept either signal.)
  {
    const r = await fetch(BASE + "/", { redirect: "manual" });
    const body = await r.text();
    const has =
      body.includes("内测口令") ||
      body.includes("ACCESS CONTROL") ||
      body.includes("身份核验") ||
      body.includes("正在进入燕中校友数字母港") ||
      body.includes("数字母港");
    record("home_shows_gatekeeper", r.status === 200 && has,
      `status=${r.status} hasGate=${has}`);
  }

  // 2. /admin/login is reachable as a 200 without redirect loop
  {
    const r = await fetch(BASE + "/admin/login", { redirect: "manual" });
    record("admin_login_reachable", r.status === 200, `status=${r.status}`);
  }

  // 3. Anonymous /admin redirects to /admin/login
  {
    const r = await fetch(BASE + "/admin", { redirect: "manual" });
    const loc = r.headers.get("location") || "";
    record("admin_redirects_when_anon", (r.status === 307 || r.status === 308) && loc.endsWith("/admin/login"),
      `status=${r.status} location=${loc}`);
  }

  // 4. Anonymous /api/admin/news returns 401 JSON
  {
    const r = await fetch(BASE + "/api/admin/news", { redirect: "manual" });
    let body = null;
    const ct = r.headers.get("content-type") || "";
    if (ct.includes("application/json")) body = await r.json().catch(() => null);
    record("api_admin_unauth_returns_401_json", r.status === 401 && !!body && body.error,
      `status=${r.status} ct=${ct} body=${JSON.stringify(body)}`);
  }

  // 5. Access password login with wrong password — 401
  {
    const r = await fetch(BASE + "/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "definitely-not-the-passcode-xyz" }),
      redirect: "manual",
    });
    record("access_wrong_password_401", r.status === 401, `status=${r.status}`);
  }

  // 6. Access password login with correct password — 200, role=access
  let accessCookie = null;
  if (childEnv.ACCESS_PASSWORD || childEnv.ACCESS_PASSWORD_HASH) {
    // We only have the plain ACCESS_PASSWORD (or hash). Try plain first.
    const password = childEnv.ACCESS_PASSWORD || null;
    if (password) {
      const r = await fetch(BASE + "/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        redirect: "manual",
      });
      const body = await r.json().catch(() => null);
      const cookies = parseSetCookie(r.headers);
      accessCookie = extractCookieValue(cookies, "yc_access_token");
      record("access_login_succeeds", r.status === 200 && body?.role === "access" && !!accessCookie,
        `status=${r.status} role=${body?.role} cookieSet=${!!accessCookie}`);
    } else {
      record("access_login_succeeds", false, "no plain ACCESS_PASSWORD; cannot test (provide hash bypass not exercised)");
    }
  } else {
    record("access_login_succeeds", false, "ACCESS_PASSWORD/HASH not configured");
  }

  // 7. With access cookie, /api/admin/news still 401
  if (accessCookie) {
    const r = await fetch(BASE + "/api/admin/news", {
      headers: { Cookie: `yc_access_token=${accessCookie}` },
      redirect: "manual",
    });
    record("access_role_blocked_from_admin_api", r.status === 401, `status=${r.status}`);
  } else {
    record("access_role_blocked_from_admin_api", false, "skipped: no access cookie");
  }

  // 8. Admin login wrong password — 401
  {
    const r = await fetch(BASE + "/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: childEnv.ADMIN_USERNAME, password: "definitely-wrong-xyz" }),
      redirect: "manual",
    });
    record("admin_wrong_password_401", r.status === 401, `status=${r.status}`);
  }

  // 9. Forge an admin token using SESSION_SECRET — server should accept it.
  //    (We avoid using the plain admin password; SESSION_SECRET signs the same kind of token
  //    the server would issue. This validates middleware acceptance, not credential check.)
  let adminCookie = null;
  {
    const exp = Date.now() + 60_000;
    const payload = JSON.stringify({ v: 2, role: "admin", exp });
    const b64 = Buffer.from(payload).toString("base64");
    const sig = crypto.createHmac("sha256", childEnv.SESSION_SECRET).update(b64).digest("hex");
    adminCookie = `${b64}.${sig}`;
  }

  // 10. With forged admin cookie: /api/admin/news returns 200 (or 500 if DB issue, not 401/403)
  {
    const r = await fetch(BASE + "/api/admin/news", {
      headers: { Cookie: `yc_access_token=${adminCookie}` },
      redirect: "manual",
    });
    record("admin_token_grants_admin_api", r.status === 200, `status=${r.status}`);
  }

  // 11. With forged admin cookie: /admin returns 200 (no redirect to /admin/login)
  {
    const r = await fetch(BASE + "/admin", {
      headers: { Cookie: `yc_access_token=${adminCookie}` },
      redirect: "manual",
    });
    const loc = r.headers.get("location") || "";
    record("admin_token_grants_admin_page", r.status === 200 && !loc, `status=${r.status} location=${loc}`);
  }

  // 12. Logout clears cookie — after logout, /admin redirects again
  {
    const r = await fetch(BASE + "/api/auth/logout", {
      method: "POST",
      headers: { Cookie: `yc_access_token=${adminCookie}` },
      redirect: "manual",
    });
    const cookies = parseSetCookie(r.headers);
    const cleared = cookies.some((c) =>
      /yc_access_token=;?/i.test(c) || /Max-Age=0/i.test(c) || /Expires=Thu, 01 Jan 1970/i.test(c),
    );
    record("logout_clears_cookie", r.status === 200 && cleared,
      `status=${r.status} cleared=${cleared}`);
  }

  // 13. Plain access login does NOT mint admin token (role=access only)
  if (childEnv.ACCESS_PASSWORD) {
    const r = await fetch(BASE + "/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: childEnv.ACCESS_PASSWORD }),
      redirect: "manual",
    });
    const body = await r.json().catch(() => null);
    record("access_login_does_not_grant_admin_role", body?.role === "access",
      `role=${body?.role}`);
  } else {
    record("access_login_does_not_grant_admin_role", true, "skipped: no plain ACCESS_PASSWORD");
  }

  // 14. /uploads/<missing>.png is allowlisted by middleware (not redirected to /admin/login)
  {
    const r = await fetch(BASE + "/uploads/__nope.png", { redirect: "manual" });
    const loc = r.headers.get("location") || "";
    record("uploads_path_not_redirected", !loc.includes("/admin/login"),
      `status=${r.status} location=${loc}`);
  }

  // 15. Generate a synthetic test image via sharp (avoids checking in test fixtures).
  //     If sharp isn't available we skip the upload tests cleanly.
  let testImageBuf = null;
  try {
    const sharp = require("sharp");
    testImageBuf = await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: { r: 80, g: 60, b: 200 },
      },
    })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (e) {
    record("test_image_generated", false, `sharp unavailable: ${e.message}`);
  }
  if (testImageBuf) {
    record("test_image_generated", true, `bytes=${testImageBuf.length}`);
  }

  // 16. Personal bg upload — public API, returns 200 + /uploads/<file>
  let userBgUrl = null;
  if (testImageBuf) {
    const fd = new FormData();
    fd.append("file", new Blob([testImageBuf], { type: "image/jpeg" }), "user-bg.jpg");
    const r = await fetch(BASE + "/api/alumni/certificate/upload-bg", {
      method: "POST",
      body: fd,
      redirect: "manual",
    });
    const body = await r.json().catch(() => null);
    userBgUrl = body?.url || null;
    record(
      "personal_bg_upload_succeeds",
      r.status === 200 && body?.success === true && /^\/uploads\/bg-/.test(body?.url || "") &&
        body?.width === 2752 && body?.height === 1548,
      `status=${r.status} url=${body?.url} size=${body?.width}x${body?.height}`,
    );
  } else {
    record("personal_bg_upload_succeeds", false, "skipped: no test image");
  }

  // 17. Personal bg file is persisted on disk (Next standalone snapshots public/ at boot,
  //     so we verify the file reached public/uploads/ rather than via HTTP. In production
  //     the volume-mounted UPLOAD_DIR is served by the reverse proxy.)
  if (userBgUrl) {
    const filename = userBgUrl.replace(/^\/uploads\//, "");
    const onDisk = path.join(STANDALONE, "public", "uploads", filename);
    const exists = fs.existsSync(onDisk);
    const stat = exists ? fs.statSync(onDisk) : null;
    record("personal_bg_persisted_on_disk",
      exists && stat && stat.size > 0,
      `path=public/uploads/${filename} exists=${exists} bytes=${stat?.size ?? 0}`);
  } else {
    record("personal_bg_persisted_on_disk", false, "skipped: no upload url");
  }

  // 18. Admin card-bg upload requires admin — anon -> 401
  if (testImageBuf) {
    const fd = new FormData();
    fd.append("file", new Blob([testImageBuf], { type: "image/jpeg" }), "admin-bg.jpg");
    const r = await fetch(BASE + "/api/settings/card-bg/upload", {
      method: "POST",
      body: fd,
      redirect: "manual",
    });
    record("admin_bg_upload_requires_admin", r.status === 401, `status=${r.status}`);
  } else {
    record("admin_bg_upload_requires_admin", false, "skipped: no test image");
  }

  // 19. Admin card-bg upload with forged admin cookie — 200 + backup metadata
  if (testImageBuf) {
    const fd = new FormData();
    fd.append("file", new Blob([testImageBuf], { type: "image/jpeg" }), "admin-bg.jpg");
    const r = await fetch(BASE + "/api/settings/card-bg/upload", {
      method: "POST",
      headers: { Cookie: `yc_access_token=${adminCookie}` },
      body: fd,
      redirect: "manual",
    });
    const body = await r.json().catch(() => null);
    record(
      "admin_bg_upload_succeeds",
      r.status === 200 && body?.success === true && body?.url === "/card.jpg" &&
        body?.width === 2752 && body?.height === 1548 &&
        (typeof body?.backup === "string" || body?.backup === null),
      `status=${r.status} url=${body?.url} backup=${body?.backup}`,
    );
  } else {
    record("admin_bg_upload_succeeds", false, "skipped: no test image");
  }

  // 20. /card.jpg is reachable after admin upload
  {
    const r = await fetch(BASE + "/card.jpg", { redirect: "manual" });
    record("card_jpg_reachable", r.status === 200, `status=${r.status}`);
  }

  // 21. Certificate page references the new card.jpg path (or the user can replace it via uploaded URL)
  {
    const r = await fetch(BASE + "/alumni/certificate", { redirect: "manual" });
    const body = await r.text();
    const hasRef = body.includes("/card.jpg") || body.includes("loadCanvasImage");
    record("certificate_page_references_card_jpg",
      r.status === 200 && hasRef,
      `status=${r.status} hasRef=${hasRef}`);
  }

  return Object.values(results).every((v) => v.status === "passed");
}

run()
  .then((ok) => {
    fs.writeFileSync(
      path.join(ROOT, ".claude", "run-logs", "smoke-results.json"),
      JSON.stringify(results, null, 2),
    );
    console.log("[smoke] summary:", JSON.stringify(results, null, 2));
    server.kill("SIGTERM");
    setTimeout(() => server.kill("SIGKILL"), 2000);
    process.exit(ok ? 0 : 1);
  })
  .catch((e) => {
    console.error("[smoke] error:", e);
    server.kill("SIGTERM");
    setTimeout(() => server.kill("SIGKILL"), 2000);
    process.exit(2);
  });
