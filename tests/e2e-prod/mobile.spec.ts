import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

const BASE = "https://math-lab-delta.vercel.app";

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error" && !m.text().includes("favicon")) {
      errors.push(`console: ${m.text()}`);
    }
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

test("prod mobile shell drawers and next lesson", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(`${BASE}/#foundations`, { waitUntil: "domcontentloaded" });

  await expect(page.locator("#stage canvas")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#topbar")).toBeVisible();
  await expect(page.locator("#nav-toggle")).toBeVisible();
  await expect(page.locator("#panel-toggle")).toBeVisible();

  await page.locator("#nav-toggle").click();
  await expect(page.locator("body")).toHaveClass(/nav-open/);
  await expect(page.locator("#sidebar")).toBeVisible();

  await page.locator("#panel-toggle").click();
  await expect(page.locator("body")).toHaveClass(/panel-open/);
  await expect(page.locator("body")).not.toHaveClass(/nav-open/);
  await expect(page.locator("#info h2")).toBeVisible();

  const titleBefore = await page.locator("#topbar-lesson").innerText();
  await page.locator("#next-lesson").click();
  await expect(page.locator("#topbar-lesson")).not.toHaveText(titleBefore, { timeout: 15000 });
  await expect(page.locator("body")).not.toHaveClass(/nav-open|panel-open/);

  expect(errors, errors.join("\n")).toEqual([]);
});
