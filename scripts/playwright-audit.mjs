import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const URLS = [
  "/",
  "/abogados-en-nacaome",
  "/abogados-en-choluteca",
  "/abogados-en-san-lorenzo",
  "/abogado-penalista-nacaome",
  "/abogado-laboralista-nacaome",
  "/abogado-de-familia-nacaome",
  "/abogado-civil-nacaome",
  "/solicitar-consulta",
  "/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras",
];

const BASE = "https://www.pinedayasociadoshn.com";

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
};

/**
 * @param {import("playwright").Page} page
 * @param {string} url
 * @returns {Promise<object>}
 */
async function auditUrl(page, url) {
  const fullUrl = BASE + url;
  const result = {
    url: fullUrl,
    viewport: `${page.viewportSize().width}x${page.viewportSize().height}`,
    checks: {},
    consoleErrors: [],
    timestamp: new Date().toISOString(),
  };

  // Collect console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      result.consoleErrors.push(msg.text());
    }
  });

  // Navigate
  let response;
  try {
    response = await page.goto(fullUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  } catch (err) {
    result.checks.http200 = { pass: false, detail: `Navigation failed: ${err.message}` };
    return result;
  }

  // 1. HTTP status
  const status = response?.status();
  result.checks.http200 = {
    pass: status === 200,
    detail: `HTTP ${status}`,
  };

  // If not 200, skip remaining checks
  if (status !== 200) {
    return result;
  }

  // Small wait for JS to render
  await page.waitForTimeout(2000);

  const pageContent = await page.content();
  const pageText = pageContent.toLowerCase();

  // 2. WhatsApp link
  const waLink = await page.$('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
  result.checks.whatsappLink = {
    pass: waLink !== null,
    detail: waLink ? await waLink.getAttribute("href") : "No WhatsApp link found",
  };

  // 3. Phone link
  const telLink = await page.$('a[href^="tel:"]');
  result.checks.phoneLink = {
    pass: telLink !== null,
    detail: telLink ? await telLink.getAttribute("href") : "No phone link found",
  };

  // 4. Form or consulta link
  const form = await page.$("form");
  const consultaLink = await page.$('a[href*="solicitar-consulta"], a[href*="contacto"]');
  result.checks.formOrConsulta = {
    pass: form !== null || consultaLink !== null,
    detail: form
      ? "Form found on page"
      : consultaLink
        ? `Consulta link: ${await consultaLink.getAttribute("href")}`
        : "No form or consulta link found",
  };

  // 5. Console errors (warnings are ok, errors are not)
  result.checks.noConsoleErrors = {
    pass: result.consoleErrors.length === 0,
    detail:
      result.consoleErrors.length === 0
        ? "No console errors"
        : `Errors: ${result.consoleErrors.join(" | ")}`,
  };

  // 6. Page title
  const title = await page.title();
  result.checks.title = {
    pass: title.trim().length > 0,
    detail: title || "(empty)",
  };

  // 7. Meta description
  const metaDesc = await page.$('meta[name="description"]');
  const descContent = metaDesc ? await metaDesc.getAttribute("content") : null;
  result.checks.metaDescription = {
    pass: descContent !== null && descContent.trim().length > 0,
    detail: descContent || "(missing)",
  };

  return result;
}

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  try {
    for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
      console.log(`\n=== Viewport: ${vpName} (${vpSize.width}x${vpSize.height}) ===\n`);

      const context = await browser.newContext({ viewport: vpSize });
      const page = await context.newPage();

      for (const url of URLS) {
        console.log(`Auditing: ${BASE}${url}`);
        const res = await auditUrl(page, url);
        allResults.push(res);

        // Summary line
        const checks = res.checks;
        const allPass = Object.values(checks).every((c) => c.pass);
        const statusIcon = allPass ? "✅" : "❌";
        console.log(`  ${statusIcon} HTTP:${checks.http200?.detail} | WA:${checks.whatsappLink?.pass ? "✅" : "❌"} | Tel:${checks.phoneLink?.pass ? "✅" : "❌"} | Form:${checks.formOrConsulta?.pass ? "✅" : "❌"} | Err:${checks.noConsoleErrors?.pass ? "✅" : "❌"} | Title:${checks.title?.pass ? "✅" : "❌"} | Meta:${checks.metaDescription?.pass ? "✅" : "❌"}`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  // Summary
  const total = allResults.length;
  const passed = allResults.filter((r) =>
    Object.values(r.checks).every((c) => c.pass)
  ).length;
  const failed = total - passed;

  console.log(`\n========================================`);
  console.log(`AUDIT SUMMARY`);
  console.log(`Total checks: ${total} (${URLS.length} URLs × ${Object.keys(VIEWPORTS).length} viewports)`);
  console.log(`All passed: ${passed}`);
  console.log(`With failures: ${failed}`);
  console.log(`========================================\n`);

  // Detailed failures
  const failures = allResults.filter(
    (r) => !Object.values(r.checks).every((c) => c.pass)
  );
  if (failures.length > 0) {
    console.log("FAILURES DETAIL:");
    for (const f of failures) {
      console.log(`\n  ${f.url} [${f.viewport}]:`);
      for (const [name, check] of Object.entries(f.checks)) {
        if (!check.pass) {
          console.log(`    ❌ ${name}: ${check.detail}`);
        }
      }
    }
  }

  // Save results
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, ".playwright-audit.json");
  const output = {
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed },
    results: allResults,
  };
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nResults saved to: ${outPath}`);
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
