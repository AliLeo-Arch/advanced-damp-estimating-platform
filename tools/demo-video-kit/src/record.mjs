/**
 * Standalone product demo video recorder for Trade Estimating & Quoting.
 * Does not import application source — drives the UI via Playwright only.
 *
 * Output: WebM (Playwright native). Optional MP4 if ffmpeg is on PATH.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KIT_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(KIT_ROOT, "..", "..");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5173";
const EMAIL = process.env.DEMO_EMAIL || "admin@northbridge-demo.example";
const PASSWORD = process.env.DEMO_PASSWORD || "DemoAdmin1!";
const WIDTH = Number(process.env.VIEWPORT_WIDTH || 1920);
const HEIGHT = Number(process.env.VIEWPORT_HEIGHT || 1080);
const OUT_DIR = process.env.OUT_DIR || path.join(KIT_ROOT, "output");
const DOCS_OUT =
  process.env.DOCS_OUT ||
  path.join(REPO_ROOT, "docs", "demos", "trade-estimating", "v1.0.0", "video");
const HOLD_MS = Number(process.env.HOLD_MS || 1400);
const TITLE_MS = Number(process.env.TITLE_MS || 2400);
const SLOW_MO = Number(process.env.SLOW_MO || 85);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clearDir(dir) {
  ensureDir(dir);
  for (const file of fs.readdirSync(dir)) {
    fs.unlinkSync(path.join(dir, file));
  }
}

async function hold(page, ms = HOLD_MS) {
  await page.waitForTimeout(ms);
}

async function showTitle(page, title, subtitle = "") {
  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <style>
    :root {
      --navy: #0c1644;
      --orange: #ff5f14;
      --blue: #2c93f5;
      --muted: #706f6f;
      --canvas: #f5f7fa;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: "Montserrat", "Segoe UI", system-ui, sans-serif;
      color: white;
      background:
        radial-gradient(ellipse 70% 50% at 15% 20%, rgba(255, 95, 20, 0.28), transparent 55%),
        radial-gradient(ellipse 50% 40% at 85% 80%, rgba(44, 147, 245, 0.22), transparent 60%),
        linear-gradient(155deg, #0a1238 0%, var(--navy) 48%, #15235c 100%);
    }
    .card {
      text-align: center;
      max-width: 52rem;
      padding: 2rem;
      animation: fade 0.55s ease both;
    }
    @keyframes fade {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .kicker {
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 0.78rem;
      font-weight: 700;
      color: rgba(255,255,255,0.7);
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0;
      font-family: "Red Hat Display", "Segoe UI", system-ui, sans-serif;
      font-size: clamp(2.2rem, 4vw, 3.4rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.15;
    }
    p {
      margin: 1rem auto 0;
      max-width: 36rem;
      font-size: 1.15rem;
      line-height: 1.5;
      color: rgba(255,255,255,0.82);
    }
    .rule {
      width: 4.5rem;
      height: 3px;
      margin: 1.25rem auto 0;
      border-radius: 2px;
      background: linear-gradient(90deg, var(--navy), var(--blue), var(--orange));
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="kicker">Trade Estimating &amp; Quoting</div>
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    <div class="rule" aria-hidden="true"></div>
  </div>
</body>
</html>`;
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await hold(page, TITLE_MS);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function ensureAppShell(page) {
  // Title cards use page.setContent() and leave the SPA — restore the app first.
  const onApp = await page
    .locator(".app-nav, .app-shell, .page-title, .login-page")
    .first()
    .isVisible()
    .catch(() => false);
  if (!onApp) {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForSelector(".app-nav, .page-title, table", { timeout: 20000 });
    await hold(page, 600);
  }
}

async function clickNav(page, label) {
  await ensureAppShell(page);
  const desktop = page
    .locator(".app-nav-desktop a, .app-nav a")
    .filter({ hasText: new RegExp(`^${label}$`, "i") })
    .first();
  if ((await desktop.count()) && (await desktop.isVisible())) {
    await desktop.hover();
    await hold(page, 350);
    await desktop.click();
  } else {
    const menu = page.locator('button[aria-label*="menu" i], .menu-toggle').first();
    if (!(await menu.count())) {
      throw new Error(`Nav link not found: ${label}`);
    }
    await menu.click();
    await page
      .locator(".mobile-drawer a, nav a")
      .filter({ hasText: new RegExp(`^${label}$`, "i") })
      .first()
      .click();
  }
  await page.waitForLoadState("networkidle");
  await hold(page);
}

async function closeOverlay(page) {
  const close = page
    .locator(".side-drawer button")
    .filter({ hasText: /^Close$|^Cancel$/i })
    .first();
  if (await close.count()) {
    await close.click().catch(() => {});
  }
  await page.keyboard.press("Escape").catch(() => {});
  await hold(page, 400);
}

async function goWorkflowStep(page, label) {
  const step = page
    .locator("button.workflow-step")
    .filter({ hasText: new RegExp(label, "i") })
    .first();
  if (!(await step.count()) || (await step.isDisabled())) return false;
  await step.hover();
  await hold(page, 300);
  await step.click();
  await hold(page, 900);
  return true;
}

async function openActionMenuItem(page, menuLabel, itemLabel) {
  const menuBtn = page
    .getByRole("button", { name: new RegExp(menuLabel, "i") })
    .first();
  if (!(await menuBtn.count())) return false;
  await menuBtn.click();
  await hold(page, 450);
  const item = page
    .getByRole("menuitem", { name: new RegExp(itemLabel, "i") })
    .first();
  if (!(await item.count())) {
    await page.keyboard.press("Escape");
    return false;
  }
  await item.hover();
  await hold(page, 350);
  await item.click();
  await hold(page, 900);
  return true;
}

async function smoothScroll(page, y = 420) {
  await page.evaluate(async (distance) => {
    const step = 28;
    let moved = 0;
    while (moved < distance) {
      window.scrollBy(0, step);
      moved += step;
      await new Promise((r) => setTimeout(r, 16));
    }
  }, y);
  await hold(page, 500);
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await hold(page, 1000);
  await page.fill("#email", EMAIL);
  await hold(page, 400);
  await page.fill("#password", PASSWORD);
  await hold(page, 600);
  const demoToggle = page.getByRole("button", { name: /demo account/i });
  if (await demoToggle.count()) {
    const expanded = await demoToggle.getAttribute("aria-expanded");
    if (expanded !== "true") {
      await demoToggle.click();
      await hold(page, 700);
    }
  }
  await page.locator('button[type="submit"]').hover();
  await hold(page, 350);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/($|\?)/, { timeout: 20000 });
  await page.waitForSelector(".page-title, .estimate-search-panel, table", {
    timeout: 20000,
  });
  await hold(page, 1600);
}

function tryConvertMp4(webmPath, mp4Path) {
  const probe = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) {
    console.log("  · ffmpeg not found — keeping WebM only");
    return false;
  }
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      webmPath,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      mp4Path,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    console.log("  · ffmpeg convert failed — keeping WebM only");
    if (result.stderr) console.log(result.stderr.slice(-400));
    return false;
  }
  console.log(`  ✓ ${path.basename(mp4Path)}`);
  return true;
}

async function main() {
  clearDir(OUT_DIR);
  ensureDir(DOCS_OUT);

  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output:   ${OUT_DIR}`);
  console.log(`Docs:     ${DOCS_OUT}`);
  console.log(`Viewport: ${WIDTH}x${HEIGHT} · slowMo=${SLOW_MO}ms`);

  const channel = process.env.BROWSER_CHANNEL || "";
  const launchOptions = { headless: true, slowMo: SLOW_MO };
  if (channel) {
    launchOptions.channel = channel;
  } else {
    for (const candidate of ["msedge", "chrome"]) {
      try {
        const probe = await chromium.launch({ headless: true, channel: candidate });
        await probe.close();
        launchOptions.channel = candidate;
        break;
      } catch {
        // try next
      }
    }
  }

  console.log(
    `Browser: ${launchOptions.channel ? `channel=${launchOptions.channel}` : "bundled chromium"}`,
  );

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: OUT_DIR,
      size: { width: WIDTH, height: HEIGHT },
    },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  const chapters = [];

  try {
    await showTitle(
      page,
      "Product demo",
      "Survey → estimate → margin-controlled quote → job actuals",
    );
    chapters.push("Opening title");

    await showTitle(page, "Sign in", "Organisation access with role-based permissions");
    await login(page);
    chapters.push("Login & estimates dashboard");

    await showTitle(page, "Estimates dashboard", "Search, pipeline counts, and commercial status");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await hold(page, 1600);
    const advanced = page.getByRole("button", { name: /advanced/i }).first();
    if (await advanced.count()) {
      await advanced.click();
      await hold(page, 1400);
    }
    const statusChip = page.locator(".status-filter-chip").first();
    if (await statusChip.count()) {
      await statusChip.hover();
      await hold(page, 500);
    }
    chapters.push("Dashboard filters");

    await showTitle(page, "Customers", "CRM records for sites, surveys, and estimates");
    await clickNav(page, "Customers");
    await hold(page, 1200);
    const addCustomer = page.getByRole("button", { name: /add customer/i }).first();
    if (await addCustomer.count()) {
      await addCustomer.click();
      await page.waitForSelector(".side-drawer", { timeout: 8000 });
      await hold(page, 1400);
      await closeOverlay(page);
    }
    const viewCustomer = page.getByRole("link", { name: /view customer/i }).first();
    if (await viewCustomer.isVisible().catch(() => false)) {
      await viewCustomer.click();
      await page.waitForURL(/\/customers\/\d+/);
      await hold(page, 1200);
      const sitesTab = page.getByRole("tab", { name: /sites/i }).first();
      if (await sitesTab.count()) {
        await sitesTab.click();
        await hold(page, 900);
      }
      const surveysTab = page.getByRole("tab", { name: /surveys/i }).first();
      if (await surveysTab.count()) {
        await surveysTab.click();
        await hold(page, 900);
      }
    }
    chapters.push("Customers & CRM detail");

    await showTitle(page, "Reports", "Pipeline and quoted-vs-actual overview");
    await clickNav(page, "Reports");
    await hold(page, 1600);
    chapters.push("Reports");

    await showTitle(page, "Rate library", "Versioned materials, labour, and package costs");
    await clickNav(page, "Rates");
    await hold(page, 1400);
    await smoothScroll(page, 360);
    const addRate = page.getByRole("button", { name: /^add rate$/i }).first();
    if (await addRate.count()) {
      await addRate.click();
      await page.waitForSelector(".side-drawer", { timeout: 8000 });
      await hold(page, 1300);
      await closeOverlay(page);
    }
    await openActionMenuItem(page, "More", "Cost history");
    await hold(page, 1400);
    await closeOverlay(page);
    chapters.push("Rates admin");

    await showTitle(page, "Settings", "Company identity and commercial pricing rules");
    await clickNav(page, "Settings");
    await hold(page, 1200);
    await smoothScroll(page, 500);
    chapters.push("Settings");

    await showTitle(page, "Admin", "Backups, health, and restore controls");
    await clickNav(page, "Admin");
    await hold(page, 1600);
    chapters.push("Admin backups");

    await showTitle(page, "New estimate", "Start from customer and site survey details");
    await page.goto(`${BASE_URL}/estimates/new`, { waitUntil: "networkidle" });
    await hold(page, 1600);
    chapters.push("New estimate");

    await showTitle(
      page,
      "Estimate workflow",
      "Customer → scope → measurements → price review → quotation → actuals",
    );
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const estimateLink = page
      .locator('a[href^="/estimates/"]:not([href="/estimates/new"])')
      .first();
    await estimateLink.waitFor({ timeout: 15000 });
    await estimateLink.click();
    await page.waitForURL(/\/estimates\/\d+/);
    await page.waitForSelector(".workflow-stepper, .page-title", { timeout: 20000 });
    await hold(page, 1400);

    const steps = [
      ["Customer", "Customer & site"],
      ["Scope", "Work scope"],
      ["Measurements", "Measurements & allowances"],
      ["Price review", "Internal price review"],
      ["Quotation", "Customer quotation"],
      ["Job actuals", "Job actuals"],
    ];
    for (const [label] of steps) {
      const ok = await goWorkflowStep(page, label);
      if (ok) {
        await smoothScroll(page, 280);
        await hold(page, 1100);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await hold(page, 400);
      }
    }
    chapters.push("Estimate wizard");

    await showTitle(page, "Lifecycle actions", "Issue, revise, and manage commercial status");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const commercial = page
      .locator("tr")
      .filter({ hasText: /ready to quote|quoted|accepted|priced|review/i })
      .locator('a[href^="/estimates/"]:not([href="/estimates/new"])')
      .first();
    if (await commercial.count()) {
      await commercial.click();
      await page.waitForURL(/\/estimates\/\d+/);
      await hold(page, 1200);
      const more = page.getByRole("button", { name: /^more$/i }).first();
      if (await more.count()) {
        await more.click();
        await hold(page, 1200);
        await page.keyboard.press("Escape");
      }
      if (await goWorkflowStep(page, "Quotation")) {
        await smoothScroll(page, 520);
        await hold(page, 1400);
      }
      if (await goWorkflowStep(page, "Job actuals")) {
        await hold(page, 1400);
      }
    }
    chapters.push("Lifecycle & quotation");

    await showTitle(page, "Field mode", "Compact site entry from the account menu");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const userMenu = page.locator(".user-menu-trigger").first();
    if (await userMenu.count()) {
      await userMenu.click();
      await hold(page, 1400);
      await page.keyboard.press("Escape");
    }
    chapters.push("User menu");

    await showTitle(
      page,
      "Trade Estimating & Quoting",
      "Configurable estimating for specialist contractors",
    );
    chapters.push("Closing title");
  } finally {
    await context.close();
    await browser.close();
  }

  // Playwright names the video with a random id — rename to a stable file
  const recorded = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => ({
      name: f,
      path: path.join(OUT_DIR, f),
      mtime: fs.statSync(path.join(OUT_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (!recorded.length) {
    throw new Error("No WebM video was produced by Playwright.");
  }

  const finalWebm = path.join(OUT_DIR, "trade-estimating-product-demo.webm");
  fs.renameSync(recorded[0].path, finalWebm);
  // Remove any leftover temporary videos
  for (const leftover of recorded.slice(1)) {
    fs.unlinkSync(leftover.path);
  }

  console.log(`  ✓ ${path.basename(finalWebm)}`);

  const finalMp4 = path.join(OUT_DIR, "trade-estimating-product-demo.mp4");
  const hasMp4 = tryConvertMp4(finalWebm, finalMp4);

  // Copy into versioned docs pack
  for (const existing of fs.readdirSync(DOCS_OUT)) {
    if (/\.(webm|mp4|json)$/i.test(existing)) {
      fs.unlinkSync(path.join(DOCS_OUT, existing));
    }
  }
  fs.copyFileSync(finalWebm, path.join(DOCS_OUT, path.basename(finalWebm)));
  if (hasMp4) {
    fs.copyFileSync(finalMp4, path.join(DOCS_OUT, path.basename(finalMp4)));
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    viewport: { width: WIDTH, height: HEIGHT },
    user: EMAIL,
    chapters,
    files: fs.readdirSync(OUT_DIR).filter((f) => /\.(webm|mp4)$/i.test(f)).sort(),
  };
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(DOCS_OUT, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\nDemo video ready (${chapters.length} chapters).`);
  console.log(`Working copy: ${OUT_DIR}`);
  console.log(`Docs pack:    ${DOCS_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
