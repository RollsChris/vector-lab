import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

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

test.describe("mobile shell", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("boots stage-first chrome and opens drawers", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");

    await expect(page.locator("#stage canvas")).toBeVisible();
    await expect(page.locator("#topbar")).toBeVisible();
    await expect(page.locator("#nav-toggle")).toBeVisible();
    await expect(page.locator("#controls-toggle")).toBeVisible();
    await expect(page.locator("#panel-toggle")).toBeVisible();

    // Sidebars are drawers on a phone — not permanently in the layout flow.
    await expect(page.locator("body")).not.toHaveClass(/nav-open|panel-open/);

    await page.locator("#nav-toggle").click();
    await expect(page.locator("body")).toHaveClass(/nav-open/);
    await expect(page.locator("#sidebar")).toBeVisible();
    await expect(page.locator("#lesson-search")).toBeVisible();

    await page.locator("#sheet-backdrop").click({ force: true, position: { x: 370, y: 400 } });
    await expect(page.locator("body")).not.toHaveClass(/nav-open/);

    await page.locator("#panel-toggle").click();
    await expect(page.locator("body")).toHaveClass(/panel-open/);
    await expect(page.locator("#panel")).toBeVisible();
    await expect(page.locator("#info h2")).toBeVisible();

    // Controls use a shallow dock over the viewport, so animation controls remain
    // available without covering the stage in the Learn sheet.
    const controlDock = page.locator("#control-dock");
    await expect(controlDock).not.toBeInViewport();
    await expect(controlDock).toHaveAttribute("aria-hidden", "true");
    await page.locator("#controls-toggle").click();
    await expect(page.locator("body")).toHaveClass(/controls-open/);
    await expect(controlDock).toBeInViewport();
    await expect(controlDock).toHaveAttribute("aria-hidden", "false");
    await expect(page.locator("#control-dock #gui")).toBeAttached();
    await expect(page.locator("#panel #gui")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveClass(/panel-open/);
    await page.locator("#controls-close").click();
    await expect(page.locator("body")).not.toHaveClass(/controls-open/);
    await expect(controlDock).not.toBeInViewport();
    await expect(controlDock).toHaveAttribute("aria-hidden", "true");
    await page.locator("#controls-toggle").click();
    await page.keyboard.press("Escape");
    await expect(page.locator("body")).not.toHaveClass(/controls-open/);

    // Switching to Lessons from an open Learn sheet must work (topbar sits above the backdrop).
    await page.locator("#nav-toggle").click();
    await expect(page.locator("body")).toHaveClass(/nav-open/);
    await expect(page.locator("body")).not.toHaveClass(/panel-open/);
    await page.locator(".nav-item:not(.hidden)").nth(1).click();
    await expect(page.locator("body")).not.toHaveClass(/nav-open|panel-open/);
    await expect(page.locator("#topbar-lesson")).not.toHaveText("");

    // Prev/next chrome advances lessons.
    const before = await page.evaluate(() => (window as any).__lab.manager.activeLesson.id);
    await page.locator("#next-lesson").click();
    const after = await page.evaluate(() => (window as any).__lab.manager.activeLesson.id);
    expect(after).not.toBe(before);

    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("touch hint copy is used on coarse pointers", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".hint")).toContainText(/Lessons \/ Learn|pinch to zoom/);
  });
});
