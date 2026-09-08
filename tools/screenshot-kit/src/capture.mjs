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
  await page.waitForTimeout(options.settleMs ?? 500);
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

async function closeOverlay(page) {
  const close = page
    .locator(".side-drawer button, .confirm-dialog button, .action-menu")
    .filter({ hasText: /^Close$|^Cancel$/i })
    .first();
  if (await close.count()) {
    await close.click().catch(() => {});
    await page.waitForTimeout(250);
  }
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  // Expand demo accounts if present so the login screen shows helpers
  const demoToggle = page.getByRole("button", { name: /demo account/i });
  if (await demoToggle.count()) {
    const expanded = await demoToggle.getAttribute("aria-expanded");
    if (expanded !== "true") await demoToggle.click();
  }
  await shot(page, "01-login-page", { fullPage: true });
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/($|\?)/, { timeout: 20000 });
  await page.waitForSelector(".page-title, .estimate-search-panel, table", {
    timeout: 20000,
  });
}

async function clickNav(page, label) {
  // Prefer desktop nav when visible
  const desktop = page
    .locator(".app-nav-desktop a, .app-nav a")
    .filter({ hasText: new RegExp(`^${label}$`, "i") })
    .first();
  if ((await desktop.count()) && (await desktop.isVisible())) {
    await desktop.click();
  } else {
    const menu = page
      .locator('button[aria-label*="menu" i], .menu-toggle')
      .first();
    if (await menu.count()) {
      await menu.click();
      await page
        .locator(".mobile-drawer a, nav a")
        .filter({ hasText: new RegExp(`^${label}$`, "i") })
        .first()
        .click();
    } else {
      throw new Error(`Nav link not found: ${label}`);
    }
  }
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}

async function openFirstEstimate(page) {
  const rowLink = page
    .locator('a[href^="/estimates/"]:not([href="/estimates/new"])')
    .first();
  await rowLink.waitFor({ timeout: 15000 });
  await rowLink.click();
  await page.waitForURL(/\/estimates\/\d+/, { timeout: 20000 });
  await page.waitForSelector(".workflow-stepper, .page-title", { timeout: 20000 });
}

async function goWorkflowStep(page, label) {
  const step = page
    .locator("button.workflow-step")
    .filter({ hasText: new RegExp(label, "i") })
    .first();
  if (!(await step.count())) return false;
  if (await step.isDisabled()) return false;
  await step.click();
  await page.waitForTimeout(600);
  return true;
}

async function openActionMenuItem(page, menuLabel, itemLabel) {
  const menuBtn = page
    .getByRole("button", { name: new RegExp(menuLabel, "i") })
    .first();
  if (!(await menuBtn.count())) return false;
  await menuBtn.click();
  await page.waitForTimeout(200);
  const item = page
    .getByRole("menuitem", { name: new RegExp(itemLabel, "i") })
    .first();
  if (!(await item.count())) {
    await page.keyboard.press("Escape");
    return false;
  }
  await item.click();
  await page.waitForTimeout(500);
  return true;
}

async function main() {
  ensureDir(OUT_DIR);
  ensureDir(DOCS_OUT);

  // Fresh output each run
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.endsWith(".png") || file === "manifest.json") {
      fs.unlinkSync(path.join(OUT_DIR, file));
    }
  }

  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output:   ${OUT_DIR}`);
  console.log(`Docs:     ${DOCS_OUT}`);

  const channel = process.env.BROWSER_CHANNEL || "";
  const launchOptions = { headless: true };
  if (channel) {
    launchOptions.channel = channel;
  } else {
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
    const advanced = page.getByRole("button", { name: /advanced/i }).first();
    if (await advanced.count()) {
      await advanced.click();
      await page.waitForTimeout(350);
      await shot(page, "03-estimates-advanced-filters");
    }

    // Quoted vs actual panel if present
    if (await page.getByText(/quoted vs actual/i).count()) {
      await shot(page, "04-dashboard-actuals-summary");
    }

    // --- Customers ---
    await clickNav(page, "Customers");
    await page.waitForSelector(".page-title", { timeout: 15000 });
    await shot(page, "05-customers");

    const addCustomer = page.getByRole("button", { name: /add customer/i }).first();
    if (await addCustomer.count()) {
      await addCustomer.click();
      await page.waitForSelector(".side-drawer", { timeout: 8000 });
      await shot(page, "05b-customers-add-drawer");

      // Seed a customer when the library is empty so detail screens are available
      const emptyList = await page.getByText(/no customers yet|0 customers/i).count();
      if (emptyList) {
        await page.locator("#add-customer-name").waitFor({ state: "visible" });
        await page.fill("#add-customer-name", "Demo Customer Ltd");
        await page.selectOption("#add-customer-type", "commercial");
        await page.fill("#add-company-name", "Northbridge Demo Customer");
        await page.fill("#add-telephone", "0118 496 0100");
        await page.fill("#add-email", "demo.customer@northbridge-demo.example");
        await page
          .locator(".side-drawer form")
          .getByRole("button", { name: /^add customer$/i })
          .click();
        try {
          await page.waitForURL(/\/customers\/\d+/, { timeout: 20000 });
        } catch {
          const banner = page.locator(".error-banner, .info-banner").first();
          const bannerText = (await banner.textContent().catch(() => "")) || "";
          console.log(`  · customer create did not navigate (${bannerText.trim() || "no banner"})`);
          await shot(page, "05b-customers-add-failed");
          await closeOverlay(page);
        }
        if (/\/customers\/\d+/.test(page.url())) {
          await page.waitForSelector(".page-title, .customer-tabs", { timeout: 15000 });
          await shot(page, "05c-customer-detail");
          const sitesTab = page.getByRole("tab", { name: /sites/i }).first();
          if (await sitesTab.count()) {
            await sitesTab.click();
            await page.waitForTimeout(400);
            await shot(page, "05d-customer-sites");
          }
          const surveysTab = page.getByRole("tab", { name: /surveys/i }).first();
          if (await surveysTab.count()) {
            await surveysTab.click();
            await page.waitForTimeout(400);
            await shot(page, "05f-customer-surveys");
          }
          const estimatesTab = page.getByRole("tab", { name: /estimates/i }).first();
          if (await estimatesTab.count()) {
            await estimatesTab.click();
            await page.waitForTimeout(400);
            await shot(page, "05h-customer-estimates");
          }
          await clickNav(page, "Customers");
          await page.waitForSelector(".page-title", { timeout: 10000 });
          await shot(page, "05g-customers-populated");
        }
      } else {
        await closeOverlay(page);
        await page.waitForTimeout(500);
        const firstCustomer = page
          .getByRole("link", { name: /view customer/i })
          .first();
        if (await firstCustomer.isVisible().catch(() => false)) {
          await firstCustomer.click();
          await page.waitForURL(/\/customers\/\d+/);
          await page.waitForSelector(".page-title, .customer-tabs", {
            timeout: 15000,
          });
          await shot(page, "05c-customer-detail");
          const sitesTab = page.getByRole("tab", { name: /sites/i }).first();
          if (await sitesTab.count()) {
            await sitesTab.click();
            await page.waitForTimeout(400);
            await shot(page, "05d-customer-sites");
          }
          const surveysTab = page.getByRole("tab", { name: /surveys/i }).first();
          if (await surveysTab.count()) {
            await surveysTab.click();
            await page.waitForTimeout(400);
            await shot(page, "05f-customer-surveys");
          }
          const estimatesTab = page.getByRole("tab", { name: /estimates/i }).first();
          if (await estimatesTab.count()) {
            await estimatesTab.click();
            await page.waitForTimeout(400);
            await shot(page, "05h-customer-estimates");
          }
        }
      }
    }

    // --- Reports ---
    await clickNav(page, "Reports");
    await page.waitForSelector(".page-title", { timeout: 15000 });
    await shot(page, "05e-reports");

    // --- Rates ---
    await clickNav(page, "Rates");
    await page.waitForSelector(".page-title, .rate-table", { timeout: 15000 });
    await shot(page, "06-rates-library");

    const addRate = page.getByRole("button", { name: /^add rate$/i }).first();
    if (await addRate.count()) {
      await addRate.click();
      await page.waitForSelector(".side-drawer", { timeout: 8000 });
      await shot(page, "07-rates-add-drawer");
      await closeOverlay(page);
    }

    // Cost history via More menu
    const openedHistory =
      (await openActionMenuItem(page, "More", "Cost history")) ||
      (await openActionMenuItem(page, "More", "History"));
    if (openedHistory) {
      await page.waitForSelector(".side-drawer, table", { timeout: 8000 });
      await shot(page, "08-rates-cost-history");
      await closeOverlay(page);
    } else {
      console.log('  · skipped rates cost history (menu unavailable)');
    }

    // --- Settings ---
    await clickNav(page, "Settings");
    await page.waitForSelector(".page-title, .settings-form, .settings-section", {
      timeout: 15000,
    });
    await shot(page, "08b-settings");

    // --- Admin ---
    await clickNav(page, "Admin");
    await page.waitForSelector(".page-title, .admin-status-panel, .panel-title", {
      timeout: 15000,
    });
    await shot(page, "09-admin-backups");

    // --- New estimate ---
    await page.goto(`${BASE_URL}/estimates/new`, { waitUntil: "networkidle" });
    await page.waitForSelector(".page-title, form", { timeout: 15000 });
    await shot(page, "10-estimate-new");

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

    // Lifecycle from a commercial estimate
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const commercialRow = page
      .locator("tr")
      .filter({ hasText: /ready to quote|quoted|accepted|priced|review/i })
      .locator('a[href^="/estimates/"]:not([href="/estimates/new"])')
      .first();
    if (await commercialRow.count()) {
      await commercialRow.click();
      await page.waitForURL(/\/estimates\/\d+/);
      await page.waitForTimeout(700);
      await shot(page, "18-estimate-lifecycle-actions");

      // Open More menu if present to show lifecycle options
      const more = page.getByRole("button", { name: /^more$/i }).first();
      if (await more.count()) {
        await more.click();
        await page.waitForTimeout(300);
        await shot(page, "18a-estimate-more-menu");
        await page.keyboard.press("Escape");
      }

      const issueQuote = page.getByRole("button", {
        name: /issue quotation|mark as quoted|approve for quotation/i,
      });
      if (await issueQuote.count()) {
        // Capture button state only — do not mutate commercial data mid-demo pack
        await issueQuote.first().scrollIntoViewIfNeeded();
        await shot(page, "18b-estimate-primary-action");
      }

      if (await goWorkflowStep(page, "Quotation")) {
        await shot(page, "19-estimate-quotation-detail");
      }
      if (await goWorkflowStep(page, "Job actuals")) {
        await shot(page, "20-estimate-actuals-detail");
      } else {
        const actualsBtn = page.getByRole("button", { name: /job actuals/i });
        if (await actualsBtn.count()) {
          await actualsBtn.click();
          await page.waitForTimeout(800);
          await shot(page, "20-estimate-actuals-detail");
        } else {
          console.log('  · skipped "Job actuals" (not unlocked on this estimate)');
        }
      }
    }

    // Field mode from user menu
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const userMenu = page.locator(".user-menu-trigger").first();
    if (await userMenu.count()) {
      await userMenu.click();
      await page.waitForTimeout(300);
      await shot(page, "21-user-menu-field-mode");
      await page.keyboard.press("Escape");
    }

    // Copy to versioned docs pack (replace previous set)
    for (const existing of fs.readdirSync(DOCS_OUT)) {
      if (existing.endsWith(".png") || existing === "manifest.json") {
        fs.unlinkSync(path.join(DOCS_OUT, existing));
      }
    }
    const files = fs
      .readdirSync(OUT_DIR)
      .filter((f) => f.endsWith(".png"))
      .sort();
    for (const file of files) {
      fs.copyFileSync(path.join(OUT_DIR, file), path.join(DOCS_OUT, file));
    }

    const manifest = {
      generated_at: new Date().toISOString(),
      base_url: BASE_URL,
      viewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
      user: EMAIL,
      files,
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
