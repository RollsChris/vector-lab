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

test("investigations section switches, deep-links, and keeps lesson nav independent", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#geometry");
  await expect(page.locator("#info h2")).toHaveText("Geometry");
  await expect(page.locator(".nav-item.active .nav-title")).toContainText("Geometry");

  // Enter Investigations via primary switcher.
  await page.locator('.section-tab[data-section="investigations"]').click();
  await expect(page).toHaveURL(/#investigations$/);
  await expect(page.locator("#investigations-chrome")).toBeVisible();
  await expect(page.locator("#lessons-chrome")).toBeHidden();
  await expect(page.locator(".inv-nav-item")).toHaveCount(100);
  await expect(page.locator(".nav-item")).toHaveCount(74);
  // Investigation controls must not use .nav-item (preserves unscoped lesson e2e).
  await expect(page.locator(".inv-nav-item.nav-item")).toHaveCount(0);
  await expect(page.locator(".inv-nav-group")).toHaveCount(8);

  // Active stage group is open; collapsed stages hide their item lists (display:none).
  await expect(page.locator(".inv-nav-group.is-open")).toHaveCount(1);
  await expect(page.locator(".inv-nav-group.is-active-stage")).toHaveCount(1);
  await expect(page.locator(".inv-nav-group.is-open.is-active-stage")).toHaveCount(1);
  const openItems = page.locator(".inv-nav-group.is-open .inv-nav-items");
  const collapsedItems = page.locator(".inv-nav-group:not(.is-open) .inv-nav-items");
  await expect(collapsedItems).toHaveCount(7);
  await expect
    .poll(async () =>
      openItems.evaluate((el) => ({
        hidden: (el as HTMLElement).hidden,
        display: getComputedStyle(el).display,
        visibleButtons: el.querySelectorAll("button.inv-nav-item").length,
      })),
    )
    .toEqual(
      expect.objectContaining({
        hidden: false,
        display: "flex",
      }),
    );
  await expect
    .poll(async () =>
      collapsedItems.evaluateAll((els) =>
        els.map((el) => ({
          hidden: (el as HTMLElement).hidden,
          display: getComputedStyle(el).display,
          visibleButtons: Array.from(el.querySelectorAll("button.inv-nav-item")).filter(
            (btn) => getComputedStyle(btn).display !== "none" && (btn as HTMLElement).offsetParent !== null,
          ).length,
        })),
      ),
    )
    .toEqual(
      Array.from({ length: 7 }, () => ({
        hidden: true,
        display: "none",
        visibleButtons: 0,
      })),
    );

  // Expanding a collapsed stage restores its items; collapsing again hides them.
  const complexGroup = page.locator('.inv-nav-group[data-stage-id="inv-complex-harmonic"]');
  await expect(complexGroup).not.toHaveClass(/is-open/);
  await page.locator('.inv-nav-section[data-stage-id="inv-complex-harmonic"]').click();
  await expect(complexGroup).toHaveClass(/is-open/);
  const complexItems = complexGroup.locator(".inv-nav-items");
  await expect
    .poll(async () =>
      complexItems.evaluate((el) => ({
        hidden: (el as HTMLElement).hidden,
        display: getComputedStyle(el).display,
        buttonCount: el.querySelectorAll("button.inv-nav-item").length,
      })),
    )
    .toEqual(
      expect.objectContaining({
        hidden: false,
        display: "flex",
      }),
    );
  await expect
    .poll(async () =>
      complexItems.evaluate(
        (el) => el.querySelectorAll("button.inv-nav-item").length,
      ),
    )
    .toBeGreaterThan(0);
  await page.locator('.inv-nav-section[data-stage-id="inv-complex-harmonic"]').click();
  await expect(complexGroup).not.toHaveClass(/is-open/);
  await expect
    .poll(async () =>
      complexItems.evaluate((el) => ({
        hidden: (el as HTMLElement).hidden,
        display: getComputedStyle(el).display,
        visibleButtons: Array.from(el.querySelectorAll("button.inv-nav-item")).filter(
          (btn) => getComputedStyle(btn).display !== "none" && (btn as HTMLElement).offsetParent !== null,
        ).length,
      })),
    )
    .toEqual({ hidden: true, display: "none", visibleButtons: 0 });

  // Reading surface has real study material.
  await expect(page.locator("#investigations-stage")).toContainText("Why this matters for RH");
  await expect(page.locator("#investigations-stage .inv-lesson-surface h1")).toBeVisible();
  await expect(page.locator("#investigations-stage")).toContainText("Study task");
  await expect(page.locator("#investigations-stage")).toContainText("Readings");

  // Lessons panel: claim badges; status legend collapsed until opened.
  await expect(page.locator(".inv-status-badge").first()).toBeVisible();
  const legend = page.locator(".inv-status-legend");
  await expect(legend).toBeVisible();
  await expect(legend).not.toHaveAttribute("open", "");
  await expect(legend.locator("ul")).toBeHidden();
  await legend.locator("summary").click();
  await expect(legend).toHaveAttribute("open", "");
  await expect(legend).toContainText("Status legend");
  await expect(legend.locator("ul")).toBeVisible();

  // Panel a11y: not a live region; region role; stage is the tabpanel.
  await expect(page.locator("#investigations-panel")).toHaveAttribute("aria-live", "off");
  await expect(page.locator("#investigations-panel")).toHaveAttribute("role", "region");
  await expect(page.locator("#investigations-stage")).toHaveAttribute("role", "tabpanel");
  await expect(page.locator("#inv-selection-status")).toHaveAttribute("role", "status");

  // Experiments deep path + permanent caveat; lessons nav must fully hide.
  const invNav = page.locator("#inv-lessons-nav");
  await page.locator('.inv-tab[data-route="experiments"]').click();
  await expect(page).toHaveURL(/#investigations\/experiments$/);
  const caveat = page.getByTestId("rh-evidence-caveat");
  await expect(caveat).toHaveText(
    "RH is unsolved; a finite computation is evidence, never a proof.",
  );
  await expect(page.locator(".inv-experiments-canvas")).toBeVisible();
  await expect(page.locator("#inv-exp-tMax")).toBeVisible();
  await expect(invNav).toBeHidden();
  await expect
    .poll(async () =>
      invNav.evaluate((el) => ({
        hidden: (el as HTMLElement).hidden,
        display: getComputedStyle(el).display,
      })),
    )
    .toEqual({ hidden: true, display: "none" });

  // Re-clicking the already-active Experiments tab must not blank the workbench.
  await page.locator('.inv-tab[data-route="experiments"]').click();
  await expect(page).toHaveURL(/#investigations\/experiments$/);
  await expect(page.locator(".inv-experiments-canvas")).toBeVisible();
  await expect(page.locator("#inv-exp-tMax")).toBeVisible();
  await expect(page.locator("#inv-exp-samples")).toBeVisible();
  await expect(page.getByTestId("rh-evidence-caveat")).toHaveText(
    "RH is unsolved; a finite computation is evidence, never a proof.",
  );
  await expect(page.locator(".inv-exp-readout")).toBeVisible();
  await expect(invNav).toBeHidden();

  // Resize keeps the workbench painted from cache (no blank stage).
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(page.locator(".inv-experiments-canvas")).toBeVisible();
  await expect(page.locator("#inv-exp-tMax")).toBeVisible();
  await expect(page.getByTestId("rh-evidence-caveat")).toBeVisible();

  // Deep link cold load.
  await page.goto("/#investigations/experiments");
  await expect(page.getByTestId("rh-evidence-caveat")).toBeVisible();
  await expect(page.locator("#investigations-stage")).toBeVisible();
  await expect(invNav).toBeHidden();
  await expect
    .poll(async () =>
      invNav.evaluate((el) => ({
        hidden: (el as HTMLElement).hidden,
        display: getComputedStyle(el).display,
      })),
    )
    .toEqual({ hidden: true, display: "none" });

  // Back to Investigations Lessons restores the roadmap list.
  await page.locator('.inv-tab[data-route="lessons"]').click();
  await expect(page).toHaveURL(/#investigations$/);
  await expect(invNav).toBeVisible();
  await expect
    .poll(async () =>
      invNav.evaluate((el) => ({
        hidden: (el as HTMLElement).hidden,
        display: getComputedStyle(el).display,
      })),
    )
    .toEqual({ hidden: false, display: "flex" });
  await expect(page.locator(".inv-nav-item")).toHaveCount(100);

  // Return to Lessons and re-enter the previous lesson cleanly after suspend.
  await page.locator('.section-tab[data-section="lessons"]').click();
  await expect(page.locator("#lessons-chrome")).toBeVisible();
  await expect(page.locator("#investigations-chrome")).toBeHidden();
  await expect(page.locator("#info h2")).toHaveText("Geometry");
  await expect(page).toHaveURL(/#geometry$/);

  // Keyboard lesson nav must work again and must not keep investigations hash.
  await page.keyboard.press("]");
  await expect(page.locator("#info h2")).toHaveText("Angles");
  await expect(page).toHaveURL(/#angles$/);

  // Investigations hash is not claimed as a lesson.
  await page.goto("/#investigations");
  await expect(page.locator("#investigations-chrome")).toBeVisible();
  await expect(page.locator(".inv-nav-item")).toHaveCount(100);
  const activeLesson = await page.evaluate(() => (window as any).__lab.manager.activeLesson);
  expect(activeLesson).toBeNull();

  expect(errors, errors.join("\n")).toEqual([]);
});

test("lesson selections produce distinct stage study text and prereq navigation", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#investigations");
  await expect(page.locator(".inv-nav-item")).toHaveCount(100);

  // Ensure stage containing item 7 is reachable (open Foundations).
  await page.locator('.inv-nav-item[data-inv-id="7"]').click();
  await expect(page.locator(".inv-nav-item.active")).toHaveAttribute("data-inv-id", "7");
  const surface = page.locator("#investigations-stage .inv-lesson-surface");
  await expect(surface.locator("h1")).toContainText("7.");
  await expect(surface).toContainText("Why this matters for RH");
  await expect(surface).toContainText("Stage 1 / 8");
  const text7 = await surface.evaluate((el) => el.textContent ?? "");

  const coreGroup = page.locator('.inv-nav-group[data-stage-id="inv-core-ant"]');
  if ((await coreGroup.getAttribute("data-open")) !== "true") {
    await page.locator('.inv-nav-section[data-stage-id="inv-core-ant"]').click();
  }
  await page.locator('.inv-nav-item[data-inv-id="45"]').click();
  await expect(page.locator(".inv-nav-item.active")).toHaveAttribute("data-inv-id", "45");
  await expect(surface.locator("h1")).toContainText("45.");
  await expect(surface).toContainText("Why this matters for RH");
  await expect(surface).toContainText("Stage 4 / 8");
  const text45 = await surface.evaluate((el) => el.textContent ?? "");
  expect(text45).not.toEqual(text7);

  // Active stage group is Core ANT.
  await expect(page.locator(".inv-nav-group.is-active-stage")).toHaveAttribute(
    "data-stage-id",
    "inv-core-ant",
  );
  await expect(page.locator('.inv-nav-group[data-stage-id="inv-core-ant"]')).toHaveClass(/is-open/);

  // Prerequisite chip navigates earlier.
  const chip = page.locator(".inv-prereq-chip").first();
  await expect(chip).toBeVisible();
  const chipText = await chip.innerText();
  expect(chipText).toMatch(/^\d+\./);
  await chip.click();
  const activeId = await page.locator(".inv-nav-item.active").getAttribute("data-inv-id");
  expect(Number(activeId)).toBeLessThan(45);
  await expect(page.locator("#investigations-stage")).toContainText("Why this matters for RH");

  // Open Experiments only on Hardy-Z linked lessons (e.g. 53), not generic ones.
  if ((await coreGroup.getAttribute("data-open")) !== "true") {
    await page.locator('.inv-nav-section[data-stage-id="inv-core-ant"]').click();
  }
  await page.locator('.inv-nav-item[data-inv-id="53"]').click();
  await expect(page.locator("#investigations-panel .inv-link-btn")).toHaveText("Open Experiments");
  await page.locator('.inv-nav-item[data-inv-id="40"]').click();
  await expect(page.locator("#investigations-panel .inv-link-btn")).toHaveCount(0);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("investigations resumes lastVisited and does not clobber it on #investigations reload", async ({
  page,
}) => {
  const errors = trackErrors(page);
  const storageKey = "vector-lab:investigations-progress:v1";

  await page.goto("/#investigations");
  await expect(page.locator(".inv-nav-item")).toHaveCount(100);

  // Select a non-first roadmap item.
  await page.locator('.inv-nav-item[data-inv-id="7"]').click();
  await expect(page.locator(".inv-nav-item.active")).toHaveAttribute("data-inv-id", "7");
  await expect(page.locator("#investigations-stage h1")).toContainText("7.");

  const storedAfterSelect = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  expect(storedAfterSelect).toBeTruthy();
  expect(JSON.parse(storedAfterSelect!).last).toBe(7);

  // Cold deep-link back to #investigations must resume 7, not overwrite with 1.
  await page.goto("/#investigations");
  await expect(page.locator(".inv-nav-item.active")).toHaveAttribute("data-inv-id", "7");
  await expect(page.locator("#investigations-stage h1")).toContainText("7.");

  const storedAfterReload = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  expect(JSON.parse(storedAfterReload!).last).toBe(7);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("three.js canvas is display:none on Investigations and restored on Lessons", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/#geometry");
  await expect(page.locator("#info h2")).toHaveText("Geometry");

  const canvas = page.locator("#stage > canvas").first();
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => canvas.evaluate((el) => getComputedStyle(el).display))
    .toBe("block");

  await page.locator('.section-tab[data-section="investigations"]').click();
  await expect(page).toHaveURL(/#investigations$/);
  await expect(canvas).toBeHidden();
  await expect
    .poll(async () =>
      canvas.evaluate((el) => ({
        hidden: (el as HTMLElement).hidden,
        display: getComputedStyle(el).display,
      })),
    )
    .toEqual({ hidden: true, display: "none" });

  await page.locator('.section-tab[data-section="lessons"]').click();
  await expect(page.locator("#lessons-chrome")).toBeVisible();
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () =>
      canvas.evaluate((el) => ({
        hidden: (el as HTMLElement).hidden,
        display: getComputedStyle(el).display,
      })),
    )
    .toEqual({ hidden: false, display: "block" });

  expect(errors, errors.join("\n")).toEqual([]);
});

test("investigations disables lesson step controls, exposes tab semantics, and pauses WebGL", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/#geometry");
  await expect(page.locator("#info h2")).toHaveText("Geometry");

  const prev = page.locator("#prev-lesson");
  const next = page.locator("#next-lesson");
  await expect(prev).toBeEnabled();
  await expect(next).toBeEnabled();

  // Section tabs are real tabs with selected state + panel linkage.
  const lessonsTab = page.locator('.section-tab[data-section="lessons"]');
  const invTab = page.locator('.section-tab[data-section="investigations"]');
  await expect(lessonsTab).toHaveAttribute("role", "tab");
  await expect(invTab).toHaveAttribute("role", "tab");
  await expect(lessonsTab).toHaveAttribute("aria-selected", "true");
  await expect(invTab).toHaveAttribute("aria-selected", "false");
  await expect(page.locator("#section-switcher")).toHaveAttribute("role", "tablist");
  await expect(page.locator("#lessons-chrome")).toHaveAttribute("role", "tabpanel");

  const ticksWhileRunning = await page.evaluate(async () => {
    const v = (window as unknown as { __lab: { viewport: {
      isRunning: boolean;
      onTick: (fn: (dt: number, elapsed: number) => void) => () => void;
    } } }).__lab.viewport;
    let ticks = 0;
    const off = v.onTick(() => {
      ticks += 1;
    });
    await new Promise((r) => setTimeout(r, 120));
    off();
    return { ticks, running: v.isRunning };
  });
  expect(ticksWhileRunning.running).toBe(true);
  expect(ticksWhileRunning.ticks).toBeGreaterThan(0);

  await invTab.click();
  await expect(page).toHaveURL(/#investigations$/);
  await expect(invTab).toHaveAttribute("aria-selected", "true");
  await expect(lessonsTab).toHaveAttribute("aria-selected", "false");
  await expect(prev).toBeDisabled();
  await expect(next).toBeDisabled();
  await expect(prev).toHaveAttribute("aria-disabled", "true");
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("#controls-toggle")).toBeDisabled();

  // Nested Investigations tabs.
  const invLessonsTab = page.locator('.inv-tab[data-route="lessons"]');
  const invExperimentsTab = page.locator('.inv-tab[data-route="experiments"]');
  await expect(invLessonsTab).toHaveAttribute("role", "tab");
  await expect(invExperimentsTab).toHaveAttribute("role", "tab");
  await expect(invLessonsTab).toHaveAttribute("aria-selected", "true");
  await expect(invExperimentsTab).toHaveAttribute("aria-selected", "false");
  await expect(page.locator(".inv-tabs")).toHaveAttribute("role", "tablist");

  await invExperimentsTab.click();
  await expect(invExperimentsTab).toHaveAttribute("aria-selected", "true");
  await expect(invLessonsTab).toHaveAttribute("aria-selected", "false");
  await expect(page.locator("#investigations-stage")).toHaveAttribute("role", "tabpanel");
  // Details panel is a region, not a second tabpanel.
  await expect(page.locator("#investigations-panel")).toHaveAttribute("role", "region");

  const paused = await page.evaluate(async () => {
    const v = (window as unknown as { __lab: { viewport: {
      isRunning: boolean;
      onTick: (fn: (dt: number, elapsed: number) => void) => () => void;
    } } }).__lab.viewport;
    let ticks = 0;
    const off = v.onTick(() => {
      ticks += 1;
    });
    await new Promise((r) => setTimeout(r, 120));
    off();
    return { ticks, running: v.isRunning };
  });
  expect(paused.running).toBe(false);
  expect(paused.ticks).toBe(0);

  // Disabled topbar controls are inert (topbar is desktop-hidden; use DOM click).
  await page.evaluate(() => {
    (document.getElementById("next-lesson") as HTMLButtonElement).click();
    (document.getElementById("prev-lesson") as HTMLButtonElement).click();
  });
  await expect(page).toHaveURL(/#investigations\/experiments$/);
  const activeWhileInv = await page.evaluate(
    () => (window as unknown as { __lab: { manager: { activeLesson: unknown } } }).__lab.manager
      .activeLesson,
  );
  expect(activeWhileInv).toBeNull();

  await lessonsTab.click();
  await expect(page.locator("#lessons-chrome")).toBeVisible();
  await expect(prev).toBeEnabled();
  await expect(next).toBeEnabled();
  await expect(prev).toHaveAttribute("aria-disabled", "false");
  await expect(next).toHaveAttribute("aria-disabled", "false");
  await expect(page.locator("#controls-toggle")).toBeEnabled();
  await expect(lessonsTab).toHaveAttribute("aria-selected", "true");

  const resumed = await page.evaluate(async () => {
    const v = (window as unknown as { __lab: { viewport: {
      isRunning: boolean;
      onTick: (fn: (dt: number, elapsed: number) => void) => () => void;
    } } }).__lab.viewport;
    let ticks = 0;
    const off = v.onTick(() => {
      ticks += 1;
    });
    await new Promise((r) => setTimeout(r, 120));
    off();
    return { ticks, running: v.isRunning };
  });
  expect(resumed.running).toBe(true);
  expect(resumed.ticks).toBeGreaterThan(0);

  // Step controls are live again after leaving Investigations.
  await page.evaluate(() => {
    (document.getElementById("next-lesson") as HTMLButtonElement).click();
  });
  await expect(page.locator("#info h2")).toHaveText("Angles");

  expect(errors, errors.join("\n")).toEqual([]);
});
