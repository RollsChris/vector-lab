import { expect, test } from "@playwright/test";

test("Pythagoras insight loop makes the right-angle condition discoverable", async ({ page }) => {
  await page.goto("/#pythagoras");

  await expect(page.locator("#py-insight-loop")).toContainText("0 of 5 discoveries");
  await page.locator('[data-py="insight:predict:holds"]').click();
  await expect(page.locator("#py-insight-loop")).toContainText("Use a 3-4-5 right triangle");

  await page.locator('[data-py="insight:manipulate"]').click();
  await expect(page.locator("#py-insight-loop")).toContainText("Show the areas");

  await page.locator('[data-py="insight:reveal"]').click();
  await expect(page.locator("#py-readout")).toContainText("a²");
  await expect(page.locator("#py-insight-loop")).toContainText("Break the right angle");

  await page.locator('[data-py="insight:break"]').click();
  await expect(page.locator("#py-message")).toContainText("not 90");
  await expect(page.locator("#py-insight-loop")).toContainText("Which condition makes the areas match?");

  await page.locator('[data-py="insight:articulate:all-triangles"]').click();
  await expect(page.locator("#py-insight-loop")).toContainText("Not quite");
  await page.locator('[data-py="insight:articulate:right-angle"]').click();
  await expect(page.locator("#py-insight-loop")).toContainText("5 of 5 discoveries");
  await expect(page.locator("#py-insight-loop")).toContainText("right triangles");
});

test("leftover comparison is a separate control from the condition loop", async ({ page }) => {
  await page.goto("/#pythagoras");

  await expect(page.locator("#py-rearrange")).toHaveText("▶ Show why the areas match");
  await page.locator("#py-rearrange").click();
  await expect(page.locator("#py-rearrange")).toHaveText(/Showing leftovers|Show leftovers again/);
  await expect(page.locator("#py-insight-loop")).toContainText("0 of 5 discoveries");
});

test("a preset restores visible values and restarts the insight loop", async ({ page }) => {
  await page.goto("/#pythagoras");

  await page.locator('[data-py="insight:predict:holds"]').click();
  await expect(page.locator("#py-readout")).toContainText("hidden");
  await page.locator('[data-py="right-3-4-5"]').click();
  await expect(page.locator("#py-readout")).toContainText("a²");
  await expect(page.locator("#py-insight-loop")).toContainText("0 of 5 discoveries");
});
