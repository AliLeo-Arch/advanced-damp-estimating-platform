/**
 * Standalone product screenshot capture for Trade Estimating & Quoting.
 * Does not import application source — drives the UI via Playwright only.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KIT_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(KIT_ROOT, "..", "..");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5173";
const EMAIL = process.env.DEMO_EMAIL || "admin@northbridge-demo.example";
const PASSWORD = process.env.DEMO_PASSWORD || "DemoAdmin1!";
const WIDTH = Number(process.env.VIEWPORT_WIDTH || 1440);
const HEIGHT = Number(process.env.VIEWPORT_HEIGHT || 900);
const OUT_DIR = process.env.OUT_DIR || path.join(KIT_ROOT, "output");
const DOCS_OUT =
  process.env.DOCS_OUT ||
  path.join(REPO_ROOT, "docs", "demos", "trade-estimating", "v1.0.0", "screenshots");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function shot(page, name, options = {}) {
  const file = `${name}.png`;
  const target = path.join(OUT_DIR, file);
  await page.waitForTimeout(options.settleMs ?? 400);
  await page.screenshot({
    path: target,
    fullPage: options.fullPage ?? true,
    animations: "disabled",
    scale: "device",
    type: "png",
  });
  console.log(`  ✓ ${file}`);
  return file;
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await shot(page, "01-login-page", { fullPage: true });
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/($|\?)/, { timeout: 20000 });
  await page.waitForSelector(".page-title, .estimate-search-panel, table", {
    timeout: 20000,
  });
}

async function clickNav(page, label) {
  const link = page.locator(`nav a, .app-nav a, header a`).filter({ hasText: label }).first();
  if (await link.count()) {
    await link.click();
  } else {
    // Mobile drawer fallback
    const menu = page.locator('button[aria-label*="menu" i], .menu-toggle, .nav-toggle').first();
    if (await menu.count()) {
      await menu.click();
      await page.locator("a").filter({ hasText: label }).first().click();
    } else {
      throw new Error(`Nav link not found: ${label}`);
    }
  }
  await page.waitForLoadState("networkidle");
}

async function openFirstEstimate(page) {
  const rowLink = page
    .locator('a[href^="/estimates/"]:not([href="/estimates/new"])')
    .first();
  await rowLink.waitFor({ timeout: 15000 });
  const href = await rowLink.getAttribute("href");
  await rowLink.click();
  await page.waitForURL(/\/estimates\/\d+/, { timeout: 20000 });
  await page.waitForSelector(".workflow-stepper, .page-title", { timeout: 20000 });
  return href;
}

async function goWorkflowStep(page, label) {
  const step = page
    .locator("button.workflow-step")
    .filter({ hasText: label })
    .first();
  if (!(await step.count())) return false;
  const disabled = await step.isDisabled();
  if (disabled) return false;
  await step.click();
  await page.waitForTimeout(500);
  return true;
}

async function main() {
  ensureDir(OUT_DIR);
  ensureDir(DOCS_OUT);

  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output:   ${OUT_DIR}`);
  console.log(`Docs:     ${DOCS_OUT}`);

  const channel = process.env.BROWSER_CHANNEL || "";
  const launchOptions = { headless: true };
  if (channel) {
    launchOptions.channel = channel;
  } else {
    // Prefer system browsers so the kit works without downloading Chromium.
    for (const candidate of ["msedge", "chrome"]) {
      try {
        const probe = await chromium.launch({
          headless: true,
          channel: candidate,
        });
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
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  try {
    // --- Auth ---
    await login(page);
    await shot(page, "02-estimates-dashboard");

    // Advanced filters on dashboard
    const advanced = page.getByRole("button", { name: /advanced filters/i });
    if (await advanced.count()) {
      await advanced.click();
      await page.waitForTimeout(300);
      await shot(page, "03-estimates-advanced-filters");
    }

    // Quoted vs actual panel if present
    if (await page.getByText(/quoted vs actual/i).count()) {
      await shot(page, "04-dashboard-actuals-summary");
    }

    // --- Customers ---
    await clickNav(page, "Customers");
    await page.waitForSelector("h1, .page-title", { timeout: 15000 });
    await shot(page, "05-customers");

    // --- Rates (admin) ---
    await clickNav(page, "Rates");
    await page.waitForSelector(".page-title, .panel-title", { timeout: 15000 });
    await shot(page, "06-rates-company-and-settings");

    const addRate = page.getByRole("button", { name: /add rate/i });
    if (await addRate.count()) {
      await addRate.click();
      await page.waitForTimeout(300);
      await shot(page, "07-rates-add-form");
      const hide = page.getByRole("button", { name: /hide add form/i });
      if (await hide.count()) await hide.click();
    }

    const historyBtn = page.getByRole("button", { name: /^history$/i }).first();
    if (await historyBtn.count()) {
      await historyBtn.click();
      await page.waitForTimeout(500);
      await shot(page, "08-rates-cost-history");
    }

    // --- Admin ---
    await clickNav(page, "Admin");
    await page.waitForSelector(".page-title, .panel-title", { timeout: 15000 });
    await shot(page, "09-admin-backups");

    // --- New estimate ---
    await page.goto(`${BASE_URL}/estimates/new`, { waitUntil: "networkidle" });
    await page.waitForSelector(".page-title, form", { timeout: 15000 });
    await shot(page, "10-estimate-new-customer");

    // --- Existing demo estimate (full workflow) ---
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await openFirstEstimate(page);
    await shot(page, "11-estimate-editor-overview");

    const steps = [
      ["Customer", "12-estimate-customer"],
      ["Scope", "13-estimate-scope"],
      ["Measurements", "14-estimate-measurements"],
      ["Price review", "15-estimate-pricing"],
      ["Quotation", "16-estimate-quotation"],
      ["Job actuals", "17-estimate-actuals"],
    ];

    for (const [label, file] of steps) {
      const ok = await goWorkflowStep(page, label);
      if (ok) {
        await shot(page, file);
      } else {
        console.log(`  · skipped step "${label}" (unavailable)`);
      }
    }

    // Lifecycle + quotation detail from a ready-to-quote / priced job
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const commercialRow = page
      .locator("tr")
      .filter({ hasText: /ready to quote|quoted|accepted|priced/i })
      .locator('a[href^="/estimates/"]:not([href="/estimates/new"])')
      .first();
    if (await commercialRow.count()) {
      await commercialRow.click();
      await page.waitForURL(/\/estimates\/\d+/);
      await page.waitForTimeout(600);
      await shot(page, "18-estimate-lifecycle-actions");

      const markQuoted = page.getByRole("button", { name: /mark as quoted/i });
      if (await markQuoted.count()) {
        await markQuoted.click();
        await page.waitForTimeout(1000);
        await shot(page, "18b-estimate-marked-quoted");
      }

      if (await goWorkflowStep(page, "Quotation")) {
        await shot(page, "19-estimate-quotation-detail");
      }
      if (await goWorkflowStep(page, "Job actuals")) {
        await shot(page, "17-estimate-actuals");
        await shot(page, "20-estimate-actuals-detail");
      } else {
        // Force navigate via stepper visibility / command bar
        const actualsBtn = page.getByRole("button", { name: /job actuals/i });
        if (await actualsBtn.count()) {
          await actualsBtn.click();
          await page.waitForTimeout(800);
          await shot(page, "17-estimate-actuals");
          await shot(page, "20-estimate-actuals-detail");
        } else {
          console.log('  · skipped "Job actuals" (not unlocked on this estimate)');
        }
      }
    }

    // Copy to versioned docs pack
    const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png"));
    for (const file of files) {
      fs.copyFileSync(path.join(OUT_DIR, file), path.join(DOCS_OUT, file));
    }

    // Manifest
    const manifest = {
      generated_at: new Date().toISOString(),
      base_url: BASE_URL,
      viewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
      user: EMAIL,
      files: files.sort(),
    };
    fs.writeFileSync(
      path.join(OUT_DIR, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    fs.writeFileSync(
      path.join(DOCS_OUT, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );

    console.log(`\nCaptured ${files.length} screenshots.`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
