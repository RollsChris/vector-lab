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
    await expect(page.locator("#tabbar-lesson")).toBeVisible();
    await expect(page.locator("#tabbar-animate")).toBeVisible();

    // Sidebars are drawers on a phone — not permanently in the layout flow.
    await expect(page.locator("body")).not.toHaveClass(/nav-open|panel-open/);

    await page.locator("#nav-toggle").click();
    await expect(page.locator("body")).toHaveClass(/nav-open/);
    await expect(page.locator("#sidebar")).toBeVisible();
    await expect(page.locator("#lesson-search")).toBeVisible();

    await page.locator("#sheet-backdrop").click({ force: true, position: { x: 370, y: 400 } });
    await expect(page.locator("body")).not.toHaveClass(/nav-open/);

    await page.locator("#tabbar-lesson").click();
    await expect(page.locator("body")).toHaveClass(/panel-open/);
    await expect(page.locator("#panel")).toBeVisible();
    await expect(page.locator("#info h2")).toBeVisible();
    await expect(page.locator("#page-learn")).toHaveAttribute("aria-selected", "true");
    await page.locator("#page-practice").click();
    await expect(page.locator("body")).toHaveClass(/panel-open/);
    await expect(page.locator("#lesson-practice")).toBeVisible();
    await page.locator("#page-learn").click();
    await expect(page.locator("body")).toHaveClass(/panel-open/);

    // Animate uses the sheet slot and hides the lesson panel so the stage stays visible.
    const controlDock = page.locator("#control-dock");
    await expect(controlDock).not.toBeInViewport();
    await expect(controlDock).toHaveAttribute("aria-hidden", "true");
    await page.locator("#tabbar-animate").click();
    await expect(page.locator("body")).toHaveClass(/controls-open/);
    await expect(page.locator("body")).not.toHaveClass(/panel-open|panel-half/);
    await expect(page.locator("#panel")).toBeHidden();
    await expect(controlDock).toBeInViewport();
    await expect(controlDock).toHaveAttribute("aria-hidden", "false");
    await expect(page.locator("#control-dock #gui")).toBeAttached();
    await expect(page.locator("#panel #gui")).toHaveCount(0);
    await page.locator("#controls-close").click();
    await expect(page.locator("body")).not.toHaveClass(/controls-open/);
    await expect(controlDock).not.toBeInViewport();
    await expect(controlDock).toHaveAttribute("aria-hidden", "true");
    await page.locator("#tabbar-animate").click();
    await page.keyboard.press("Escape");
    await expect(page.locator("body")).not.toHaveClass(/controls-open/);
    await expect(page.locator("#tabbar-lesson")).toHaveAttribute("aria-selected", "true");

    // Picking a lesson from the library opens the Lesson sheet on Learn.
    await page.locator("#nav-toggle").click();
    await expect(page.locator("body")).toHaveClass(/nav-open/);
    await expect(page.locator("body")).not.toHaveClass(/panel-open/);
    await page.locator(".nav-item:not(.hidden)").nth(1).click();
    await expect(page.locator("body")).not.toHaveClass(/nav-open/);
    await expect(page.locator("body")).toHaveClass(/panel-open/);
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
    await expect(page.locator(".hint")).toContainText(/Lessons \/ Lesson \/ Animate|pinch to zoom/);
  });

  test("investigations disables visible topbar prev/next lesson controls", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/#geometry");
    await expect(page.locator("#topbar")).toBeVisible();
    await expect(page.locator("#prev-lesson")).toBeVisible();
    await expect(page.locator("#next-lesson")).toBeVisible();
    await expect(page.locator("#next-lesson")).toBeEnabled();

    // Hash route (avoids drawer/topbar hit-testing flakiness on narrow chrome).
    await page.goto("/#investigations");
    await expect(page.locator("#investigations-chrome")).toBeVisible();
    await expect(page.locator("#tabbar-lesson")).toHaveText("Notes");
    await expect(page.locator("#tabbar-animate")).toBeHidden();
    await expect(page.locator("body")).toHaveClass(/panel-open/);
    await expect(page.locator("#prev-lesson")).toBeVisible();
    await expect(page.locator("#next-lesson")).toBeVisible();
    await expect(page.locator("#prev-lesson")).toBeDisabled();
    await expect(page.locator("#next-lesson")).toBeDisabled();
    await expect(page.locator("#prev-lesson")).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#next-lesson")).toHaveAttribute("aria-disabled", "true");

    await page.goto("/#geometry");
    await expect(page.locator("#info h2")).toHaveText("Geometry");
    await expect(page.locator("#prev-lesson")).toBeEnabled();
    await expect(page.locator("#next-lesson")).toBeEnabled();
    await expect(page.locator("#prev-lesson")).toHaveAttribute("aria-disabled", "false");
    await expect(page.locator("#next-lesson")).toHaveAttribute("aria-disabled", "false");

    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("sheet and dock sit beside the canvas instead of covering it", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    const canvas = page.locator("#stage canvas");
    await expect(canvas).toBeVisible();

    await page.locator("#tabbar-lesson").click();
    await expect(page.locator("body")).toHaveClass(/panel-open/);
    await expectCanvasClearsSheet(page, "#panel", "bottom");
    const stageBox = await page.locator("#stage").boundingBox();
    expect(stageBox!.height).toBeGreaterThanOrEqual(page.viewportSize()!.height * 0.2);

    await page.locator("#stage").click();
    await expect(page.locator("body")).toHaveClass(/panel-half/);
    await expect(page.locator("body")).not.toHaveClass(/panel-open/);
    await expectCanvasClearsSheet(page, "#panel", "bottom");

    const openCanvas = await canvas.boundingBox();
    await page.locator("#tabbar-lesson").click();
    await expect(page.locator("body")).not.toHaveClass(/panel-open|panel-half/);
    await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0).toBeGreaterThan(openCanvas!.height);

    await page.locator("#tabbar-animate").click();
    await expect(page.locator("body")).toHaveClass(/controls-open/);
    await expect(page.locator("#panel")).toBeHidden();
    await expect(page.locator("#control-dock")).toBeVisible();
    await expectCanvasClearsSheet(page, "#control-dock", "bottom");

    expect(errors, errors.join("\n")).toEqual([]);
  });
});

test.describe("mobile shell landscape", () => {
  test.use({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
  });

  test("lesson sheet is a right column and does not cover the canvas", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await page.locator("#tabbar-lesson").click();
    await expect(page.locator("body")).toHaveClass(/panel-open/);
    await expect(page.locator("#panel")).toBeVisible();
    await expectCanvasClearsSheet(page, "#panel", "right");
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

async function expectCanvasClearsSheet(
  page: Page,
  sheetSelector: string,
  edge: "bottom" | "right",
): Promise<void> {
  const canvas = page.locator("#stage canvas");
  const sheet = page.locator(sheetSelector);
  await expect.poll(async () => {
    const canvasBox = await canvas.boundingBox();
    const sheetBox = await sheet.boundingBox();
    if (!canvasBox || !sheetBox || canvasBox.height <= 0) return false;
    const gap =
      edge === "bottom"
        ? sheetBox.y - (canvasBox.y + canvasBox.height)
        : sheetBox.x - (canvasBox.x + canvasBox.width);
    return gap >= -1;
  }).toBe(true);
  expect((await canvas.boundingBox())!.height).toBeGreaterThan(0);
  await expect.poll(() =>
    page.evaluate(() => {
      const c = document.querySelector("#stage canvas") as HTMLCanvasElement | null;
      const s = document.getElementById("stage");
      if (!c || !s || c.height === 0 || s.clientHeight === 0) return 1;
      return Math.abs(c.width / c.height - s.clientWidth / s.clientHeight);
    }),
  ).toBeLessThan(0.02);
}
