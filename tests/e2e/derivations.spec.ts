import { expect, test, type Page } from "@playwright/test";

const LESSONS = [
  { id: "foundations", heading: "Foundation topics" },
  { id: "order-of-operations", heading: "Order of Operations" },
  { id: "multiplication-division", heading: "Multiplication & Division" },
  { id: "times-tables", heading: "Times Tables & Multiplication Strategies" },
  { id: "algebraic-laws", heading: "Algebraic Laws & Index Rules" },
  { id: "unit-conversions", heading: "Unit Conversions" },
  { id: "rearranging-equations", heading: "Rearranging Equations" },
  { id: "powers", heading: "Powers & Exponential Growth" },
  { id: "logarithms", heading: "Logarithms" },
  { id: "binomials", heading: "Binomials" },
  { id: "pascal-triangle", heading: "Pascal's Triangle" },
  { id: "probability", heading: "Probability & Distributions" },
  { id: "markov-chains", heading: "Markov Chains" },
  { id: "stochastic-processes", heading: "Stochastic Processes" },
  { id: "vectors", heading: "Vectors" },
  { id: "complex-numbers", heading: "Complex Numbers" },
  { id: "prime-numbers", heading: "Prime Numbers — Complete Guide" },
  { id: "mersenne-primes", heading: "Mersenne Primes" },
  { id: "geometry", heading: "Geometry" },
  { id: "triangle-theorems", heading: "Triangle Theorems" },
  { id: "quadrilaterals", heading: "Quadrilaterals" },
  { id: "circle-theorems", heading: "Circle Theorems" },
  { id: "circle-calculations", heading: "Circle Geometry & Calculations" },
  { id: "volume", heading: "Volume of Solids" },
  { id: "conic-sections", heading: "Conic Sections" },
  { id: "radians", heading: "Radians" },
  { id: "trig-functions", heading: "Trigonometric Functions" },
  { id: "waveforms", heading: "Waveforms" },
  { id: "fourier-series", heading: "Fourier Series" },
  { id: "differentiation", heading: "Differentiation" },
  { id: "integration", heading: "Integration" },
  { id: "optimization", heading: "Optimization" },
  { id: "taylor-series", heading: "Taylor Series" },
  { id: "vector-field", heading: "Vector Fields (3D)" },
  { id: "kinematics", heading: "Kinematics" },
  { id: "projectile-motion", heading: "Projectile Motion" },
  { id: "newtons-laws", heading: "Newton's Laws of Motion" },
  { id: "momentum-impulse", heading: "Momentum & Impulse" },
  { id: "universal-gravitation", heading: "Newton's Universal Gravitation" },
  { id: "moments", heading: "Moments & Torque" },
  { id: "load-paths", heading: "Forces, Angles & Load Paths" },
  { id: "pulleys", heading: "Ropes, Pulleys & Weights" },
  { id: "atwood-machine", heading: "Atwood Machine" },
  { id: "collisions", heading: "Collisions" },
  { id: "stress-strain", heading: "Forces · Stress · Strain" },
  { id: "pendulum", heading: "The Pendulum" },
  { id: "physical-waves", heading: "Physical Waves" },
  { id: "electrical-circuits", heading: "Electrical Circuits" },
  { id: "shadows-earth-size", heading: "Shadows & Earth's Size" },
  { id: "shaders", heading: "Shader Playground" },
] as const;

const DYNAMIC_STATES: readonly {
  lessonId: string;
  heading: string;
  control: string;
  nestedControl?: string;
}[] = [
  {
    lessonId: "algebraic-laws",
    heading: "Algebraic Laws & Index Rules",
    control: "[data-algebra-chapter]",
  },
  {
    lessonId: "circle-calculations",
    heading: "Circle Geometry & Calculations",
    control: "[data-circle-chapter]",
  },
  {
    lessonId: "volume",
    heading: "Volume of Solids",
    control: "[data-volume-chapter]",
    nestedControl: "[data-volume-shape]",
  },
  {
    lessonId: "fourier-series",
    heading: "Fourier Series",
    control: "[data-fourier-chapter]",
  },
];

async function selectLesson(page: Page, id: string, heading: string): Promise<void> {
  await page.evaluate((lessonId) => {
    (window as Window & {
      __lab: { manager: { selectById(id: string): void } };
    }).__lab.manager.selectById(lessonId);
  }, id);
  await expect(page.locator("#info h2")).toHaveText(heading);
}

async function formulaCardProblems(page: Page, context: string): Promise<string[]> {
  return page.locator("#info .formula").evaluateAll((cards, state) => {
    const problems: string[] = [];
    for (const card of cards as HTMLElement[]) {
      const id = card.dataset.derivation?.trim() ?? "";
      const exemption = card.dataset.derivationExempt?.trim() ?? "";
      const summary = (card.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 100);

      if (!id && !exemption) {
        problems.push(`${state}: formula card has neither data-derivation nor data-derivation-exempt: "${summary}"`);
        continue;
      }
      if (id && exemption) {
        problems.push(`${state}: formula card declares both derivation "${id}" and exemption "${exemption}"`);
        continue;
      }
      if (!id) continue;

      const matching = Array.from(card.querySelectorAll<HTMLButtonElement>(":scope > .formula-derive"))
        .filter((button) => button.dataset.derivation === id);
      if (matching.length !== 1) {
        problems.push(`${state}: formula card "${id}" has ${matching.length} matching direct controls; expected 1`);
      }
    }
    return problems;
  }, context);
}

interface DialogAudit {
  title: string;
  accessibleName: boolean;
  equation: boolean;
  start: boolean;
  stepsHeading: boolean;
  result: boolean;
  close: boolean;
  ordered: boolean;
  stepCount: number;
  invalidSteps: number;
  diagramPresent: boolean;
  diagramAccessible: boolean;
}

async function inspectDialog(page: Page): Promise<DialogAudit> {
  return page.locator("dialog.derivation-dialog[open]").evaluate((dialog) => {
    const direct = Array.from(dialog.children) as HTMLElement[];
    const section = (name: string) => direct.find((element) =>
      element.tagName === "SECTION" &&
      element.querySelector(":scope > h3")?.textContent?.trim() === name
    );
    const title = dialog.getAttribute("aria-labelledby");
    const titleElement = title ? document.getElementById(title) : null;
    const equation = direct.find((element) => element.classList.contains("derivation-equation"));
    const start = section("Start with");
    const stepsHeading = direct.find((element) =>
      element.tagName === "H3" && element.textContent?.trim() === "Derive it step by step"
    );
    const steps = direct.find((element) => element.matches("ol.derivation-steps"));
    const result = section("Result");
    const close = direct.find((element) =>
      element.tagName === "BUTTON" && element.textContent?.trim() === "Close"
    );
    const required = [equation, start, stepsHeading, steps, result, close];
    const indexes = required.map((element) => element ? direct.indexOf(element) : -1);
    const ordered = indexes.every((index, position) =>
      index >= 0 && (position === 0 || index > indexes[position - 1])
    );
    const items = steps ? Array.from(steps.querySelectorAll(":scope > li")) : [];
    const invalidSteps = items.filter((item) => {
      const children = Array.from(item.children);
      return children[0]?.tagName !== "CODE" ||
        children[1]?.tagName !== "SPAN" ||
        !children[0].textContent?.trim() ||
        !children[1].textContent?.trim();
    }).length;
    const figure = direct.find((element) => element.matches("figure.derivation-diagram"));
    const svg = figure?.querySelector("svg");
    const caption = figure?.querySelector("figcaption");

    return {
      title: titleElement?.textContent?.trim() ?? "",
      accessibleName: !!title && !!titleElement?.textContent?.trim(),
      equation: !!equation?.textContent?.trim(),
      start: !!start?.querySelector(":scope > p")?.textContent?.trim(),
      stepsHeading: !!stepsHeading,
      result: !!result?.querySelector(":scope > p")?.textContent?.trim(),
      close: !!close,
      ordered,
      stepCount: items.length,
      invalidSteps,
      diagramPresent: !!figure,
      diagramAccessible: !figure || (
        svg?.getAttribute("role") === "img" &&
        !!svg.getAttribute("aria-label")?.trim() &&
        !!caption?.textContent?.trim()
      ),
    };
  });
}

async function derivationControlProblems(page: Page, context: string): Promise<string[]> {
  const problems: string[] = [];
  const selector = "#info button.formula-derive[data-derivation]:visible";
  const ids = await page.locator(selector).evaluateAll((buttons) =>
    [...new Set(buttons.map((button) =>
      (button as HTMLButtonElement).dataset.derivation?.trim() ?? ""
    ))]
  );

  for (let index = 0; index < ids.length; index++) {
    const id = ids[index];
    if (!id) {
      problems.push(`${context}: derivation control ${index + 1} has an empty ID`);
      continue;
    }

    await page.evaluate(() => {
      document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((dialog) => dialog.close());
    });
    const clicked = await page.evaluate((derivationId) => {
      const button = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          "#info button.formula-derive[data-derivation]",
        ),
      ).find((candidate) =>
        candidate.dataset.derivation === derivationId &&
        candidate.getClientRects().length > 0 &&
        !candidate.disabled
      );
      if (!button) return false;
      button.click();
      return true;
    }, id);
    if (!clicked) {
      problems.push(`${context}: derivation control "${id}" detached during the scan`);
      continue;
    }

    const dialog = page.locator("dialog.derivation-dialog");
    const opened = await dialog.evaluate((element) => (element as HTMLDialogElement).open);
    if (!opened) {
      problems.push(`${context}: derivation control "${id}" did not resolve to an authored dialog`);
      continue;
    }

    const audit = await inspectDialog(page);
    if (!audit.accessibleName) problems.push(`${context}:${id}: dialog has no non-empty aria-labelledby name`);
    if (!audit.equation) problems.push(`${context}:${id}: dialog has no equation`);
    if (!audit.start) problems.push(`${context}:${id}: dialog has no non-empty Start with section`);
    if (!audit.stepsHeading) problems.push(`${context}:${id}: dialog has no derivation-steps heading`);
    if (audit.stepCount === 0) problems.push(`${context}:${id}: dialog has no ordered derivation steps`);
    if (audit.invalidSteps > 0) problems.push(`${context}:${id}: dialog has ${audit.invalidSteps} malformed derivation steps`);
    if (!audit.result) problems.push(`${context}:${id}: dialog has no non-empty Result section`);
    if (!audit.close) problems.push(`${context}:${id}: dialog has no Close control`);
    if (!audit.ordered) problems.push(`${context}:${id}: dialog sections are not in the required order`);
    if (audit.diagramPresent && !audit.diagramAccessible) {
      problems.push(`${context}:${id}: diagram lacks role=img, an aria-label, or a non-empty caption`);
    }

    await dialog.evaluate((element) => (element as HTMLDialogElement).close());
  }

  return problems;
}

test("every initial lesson formula card declares a derivation or exemption", async ({ page }) => {
  await page.goto("/");
  const problems: string[] = [];

  for (const lesson of LESSONS) {
    await selectLesson(page, lesson.id, lesson.heading);
    problems.push(...await formulaCardProblems(page, lesson.id));
  }

  expect(problems).toEqual([]);
});

test("derivation controls resolve across initial and current dynamic lesson states", async ({ page }) => {
  await page.goto("/");
  const problems = new Set<string>();

  for (const lesson of LESSONS) {
    await selectLesson(page, lesson.id, lesson.heading);
    for (const problem of await derivationControlProblems(page, lesson.id)) problems.add(problem);
  }

  for (const state of DYNAMIC_STATES) {
    await selectLesson(page, state.lessonId, state.heading);
    const stateCount = await page.locator(`#info ${state.control}`).count();
    for (let index = 0; index < stateCount; index++) {
      await page.locator(`#info ${state.control}`).nth(index).click();
      await expect(page.locator("#info h2")).toHaveText(state.heading);
      const context = `${state.lessonId}:${index + 1}`;
      for (const problem of await formulaCardProblems(page, context)) problems.add(problem);
      for (const problem of await derivationControlProblems(page, context)) problems.add(problem);
      if (state.nestedControl) {
        const nestedCount = await page.locator(`#info ${state.nestedControl}`).count();
        for (let nestedIndex = 0; nestedIndex < nestedCount; nestedIndex++) {
          await page.locator(`#info ${state.nestedControl}`).nth(nestedIndex).click();
          const nestedContext = `${context}:${nestedIndex + 1}`;
          for (const problem of await formulaCardProblems(page, nestedContext)) problems.add(problem);
          for (const problem of await derivationControlProblems(page, nestedContext)) problems.add(problem);
        }
      }
    }
  }

  expect([...problems]).toEqual([]);
});

test("an open derivation dialog closes and is replaced when the lesson changes", async ({ page }) => {
  await page.goto("/#circle-calculations");
  await expect(page.locator("#info h2")).toHaveText("Circle Geometry & Calculations");

  await page.locator('[data-derivation="circumference"]').click();
  const dialog = page.locator("dialog.derivation-dialog");
  await expect(dialog).toBeVisible();
  const previousTitle = await dialog.locator("#derivation-dialog-title").textContent();

  await selectLesson(page, "fourier-series", "Fourier Series");
  await expect(dialog).not.toHaveAttribute("open", "");
  await expect(page.locator("#info h2")).toBeFocused();

  await page.locator('[data-fourier-chapter="1"]').click();
  await page.locator('button[data-derivation="fourier-coefficients"]').click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#derivation-dialog-title")).not.toHaveText(previousTitle ?? "");
});
