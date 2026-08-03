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

test("prod desktop: WebGL + deep link + lesson switch + search", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto(`${BASE}/#foundations`, { waitUntil: "domcontentloaded" });

  await expect(page.locator("#stage canvas")).toBeVisible({ timeout: 30000 });
  const hasGL = await page.evaluate(() => {
    const c = document.querySelector("#stage canvas") as HTMLCanvasElement | null;
    return !!c && (!!c.getContext("webgl2") || !!c.getContext("webgl"));
  });
  expect(hasGL).toBe(true);

  await expect(page.locator("#info h2")).toContainText(/Foundation/i, { timeout: 20000 });
  await expect(page).toHaveURL(/#foundations/);

  await page.goto(`${BASE}/#vectors`);
  await expect(page.locator("#info h2")).toContainText(/Vectors/i, { timeout: 20000 });
  await expect(page).toHaveURL(/#vectors/);

  await page.locator("#lesson-search").fill("circle");
  const visible = page.locator("#nav .nav-item:not(.hidden)");
  await expect(visible.first()).toBeVisible();
  const count = await visible.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(25);

  const first = visible.first();
  await first.scrollIntoViewIfNeeded();
  await first.click();
  await expect(page.locator("#info h2")).toBeVisible();
  await expect(page).toHaveURL(/circle/i);

  expect(errors, errors.join("\n")).toEqual([]);
});
