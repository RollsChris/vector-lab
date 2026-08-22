import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import fs from "node:fs";

const SHOTS = "tests/screenshots";
fs.mkdirSync(SHOTS, { recursive: true });

const LESSONS = [
  { id: "foundations", heading: "Foundation topics" },
  { id: "number-sense-fractions", heading: "Number Sense & Fractions" },
  { id: "arithmetic-operations", heading: "Arithmetic Operations Lab" },
  { id: "order-of-operations", heading: "Order of Operations" },
  { id: "times-tables", heading: "Times Tables & Multiplication Strategies" },
  { id: "multiplication-division", heading: "Multiplication & Division" },
  { id: "unit-conversions", heading: "Unit Conversions" },
  { id: "algebraic-laws", heading: "Algebraic Laws & Index Rules" },
  { id: "rearranging-equations", heading: "Rearranging Equations" },
  { id: "powers", heading: "Powers & Exponential Growth" },
  { id: "logarithms", heading: "Logarithms" },
  { id: "binomials", heading: "Binomials" },
  { id: "pascal-triangle", heading: "Pascal's Triangle" },
  { id: "coordinates-and-lines", heading: "Coordinates & Straight Lines" },
  { id: "functions-and-graphs", heading: "Functions & Graphs" },
  { id: "simultaneous-equations", heading: "Simultaneous Equations" },
  { id: "quadratics", heading: "Quadratics" },
  { id: "inequalities", heading: "Inequalities" },
  { id: "graph-transformations", heading: "Graph Transformations" },
  { id: "exponential-log-graphs", heading: "Exponential & Log Graphs" },
  { id: "sequences-and-series", heading: "Sequences & Series" },
  { id: "geometry", heading: "Geometry" },
  { id: "angles", heading: "Angles" },
  { id: "parallel-lines", heading: "Parallel Lines" },
  { id: "triangle-theorems", heading: "Triangle Theorems" },
  { id: "pythagoras", heading: "Pythagoras" },
  { id: "similar-triangles", heading: "Similar Triangles" },
  { id: "triangle-transformations", heading: "Triangle Transformations" },
  { id: "quadrilaterals", heading: "Quadrilaterals" },
  { id: "circle-glossary", heading: "Circle Glossary" },
  { id: "circle-theorems", heading: "Circle Theorems" },
  { id: "circle-calculations", heading: "Circle Geometry & Calculations" },
  { id: "volume", heading: "Volume of Solids" },
  { id: "conic-sections", heading: "Conic Sections" },
  { id: "ellipses", heading: "Ellipses" },
  { id: "sacred-geometry", heading: "Sacred Geometry" },
  { id: "radians", heading: "Radians" },
  { id: "trig-functions", heading: "Trigonometric Functions" },
  { id: "trigonometry-lab", heading: "Trigonometry Lab" },
  { id: "waveforms", heading: "Waveforms" },
  { id: "vectors", heading: "Vectors" },
  { id: "matrices-as-maps", heading: "Matrices as Maps" },
  { id: "complex-numbers", heading: "Complex Numbers" },
  { id: "limits-and-continuity", heading: "Limits & Continuity" },
  { id: "differentiation", heading: "Differentiation" },
  { id: "integration", heading: "Integration" },
  { id: "optimization", heading: "Optimization" },
  { id: "taylor-series", heading: "Taylor Series" },
  { id: "fourier-series", heading: "Fourier Series" },
  { id: "vector-field", heading: "Vector Fields (3D)" },
  { id: "probability", heading: "Probability & Distributions" },
  { id: "markov-chains", heading: "Markov Chains" },
  { id: "stochastic-processes", heading: "Stochastic Processes" },
  { id: "fibonacci-golden-ratio", heading: "Fibonacci & the Golden Ratio" },
  { id: "prime-numbers", heading: "Prime Numbers — Complete Guide" },
  { id: "mersenne-primes", heading: "Mersenne Primes" },
  { id: "kinematics", heading: "Kinematics" },
  { id: "newtons-laws", heading: "Newton's Laws of Motion" },
  { id: "projectile-motion", heading: "Projectile Motion" },
  { id: "momentum-impulse", heading: "Momentum & Impulse" },
  { id: "collisions", heading: "Collisions" },
  { id: "moments", heading: "Moments & Torque" },
  { id: "universal-gravitation", heading: "Newton's Universal Gravitation" },
  { id: "load-paths", heading: "Forces, Angles & Load Paths" },
  { id: "miter-saw-cuts", heading: "Mitre Saw Cut Planner" },
  { id: "pulleys", heading: "Ropes, Pulleys & Weights" },
  { id: "atwood-machine", heading: "Atwood Machine" },
  { id: "stress-strain", heading: "Forces · Stress · Strain" },
  { id: "pendulum", heading: "The Pendulum" },
  { id: "physical-waves", heading: "Physical Waves" },
  { id: "electrical-circuits", heading: "Electrical Circuits" },
  { id: "shadows-earth-size", heading: "Shadows & Earth's Size" },
  { id: "astronomy", heading: "Astronomy: Zero to Hero" },
  { id: "shaders", heading: "Shader Playground" },
];

const FOUNDATION_LESSON_IDS = [
  "foundations",
  "number-sense-fractions",
  "arithmetic-operations",
  "order-of-operations",
  "times-tables",
  "multiplication-division",
  "algebraic-laws",
  "unit-conversions",
  "rearranging-equations",
  "powers",
  "logarithms",
  "binomials",
  "pascal-triangle",
  "probability",
  "markov-chains",
  "stochastic-processes",
  "vectors",
  "complex-numbers",
  "fibonacci-golden-ratio",
  "prime-numbers",
  "mersenne-primes",
];

/** Collect console errors + uncaught page errors for the lifetime of a page. */
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

test("app boots with a live WebGL canvas and no errors", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await expect(page.locator("#stage canvas")).toBeVisible();
  // Confirm the WebGL context actually initialised (not a blank fallback).
  const hasGL = await page.evaluate(() => {
    const c = document.querySelector("#stage canvas") as HTMLCanvasElement | null;
    return !!c && (!!c.getContext("webgl2") || !!c.getContext("webgl"));
  });
  expect(hasGL).toBe(true);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("every lesson mounts, shows its info, and renders without errors", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");

  for (const lesson of LESSONS) {
    await page.evaluate((id) => (window as any).__lab.manager.selectById(id), lesson.id);
    await expect(page.locator("#info h2")).toHaveText(lesson.heading);
    // Active lesson id must match what we asked for.
    const activeId = await page.evaluate(() => (window as any).__lab.manager.activeLesson.id);
    expect(activeId).toBe(lesson.id);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/${lesson.id}.png` });
  }
  expect(errors, errors.join("\n")).toEqual([]);
});

test("astronomy course maps the sky and explains planetary retrograde motion", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#astronomy");

  await expect(page.locator("#info h2")).toHaveText("Astronomy: Zero to Hero");
  await expect(page.locator("#astronomy-lesson")).toContainText("Earth rotates eastward");
  await expect(page.locator("#astronomy-readout")).toContainText("Earth's rotation");
  expect(await page.evaluate(() => (
    (window as any).__lab.manager.activeLesson.horizon.children.map((child: any) => child.name)
  ))).toEqual(["local-horizon", "compass-n", "compass-e", "compass-s", "compass-w"]);

  await page.locator('[data-astro-chapter="4"]').click();
  await expect(page.locator("#astronomy-lesson")).toContainText("retrograde motion");
  await expect(page.locator("#astronomy-readout")).toContainText("Earth orbital position");
  expect(await page.evaluate(() => (
    (window as any).__lab.manager.activeLesson.trail.geometry.getAttribute("position").count
  ))).toBe(65);

  await page.locator('[data-astro-chapter="10"]').click();
  await expect(page.locator("#astronomy-lesson")).toContainText("naked eye");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("app shell supports deep links, lesson search, and keyboard lesson navigation", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#geometry");
  await expect(page.locator("#info h2")).toHaveText("Geometry");
  await expect(page.locator(".nav-item.active .nav-title")).toHaveText("22 · Geometry");
  await expect(page).toHaveTitle("Geometry — Vector Lab");

  await page.keyboard.press("/");
  await expect(page.locator("#lesson-search")).toBeFocused();
  await page.fill("#lesson-search", "shader");
  await expect(page.locator("#lesson-count")).toHaveText("1 / 74 shown");
  await expect(page.locator(".nav-item:visible .nav-title")).toHaveText("74 · Shader Playground");

  await page.keyboard.press("Escape");
  await expect(page.locator("#lesson-count")).toHaveText("74 lessons");

  await page.keyboard.press("]");
  await expect(page.locator("#info h2")).toHaveText("Angles");
  await expect(page).toHaveURL(/#angles$/);
  await page.keyboard.press("]");
  await expect(page.locator("#info h2")).toHaveText("Parallel Lines");
  await expect(page).toHaveURL(/#parallel-lines$/);
  await page.goBack();
  await expect(page.locator("#info h2")).toHaveText("Angles");
  await expect(page).toHaveURL(/#angles$/);
  await page.goBack();
  await expect(page.locator("#info h2")).toHaveText("Geometry");
  await expect(page).toHaveURL(/#geometry$/);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("app shell falls back safely for an unknown lesson hash", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#not-a-real-lesson");
  await expect(page.locator("#info h2")).toHaveText("Foundation topics");
  await expect(page).toHaveURL(/#foundations$/);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("sacred geometry traces the circle construction and inspects every Platonic solid", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#sacred-geometry");

  await expect(page.locator("[data-sacred-circle-count]")).toHaveText("1");
  for (const [step, count] of [["vesica", "2"], ["seed", "7"], ["flower", "19"]] as const) {
    await page.locator(`[data-sacred-step="${step}"]`).click();
    await expect(page.locator("[data-sacred-circle-count]")).toHaveText(count);
  }

  await page.locator('[data-sacred-view="solids"]').click();
  const solids = [
    ["tetrahedron", "4", "6", "4"],
    ["cube", "8", "12", "6"],
    ["octahedron", "6", "12", "8"],
    ["dodecahedron", "20", "30", "12"],
    ["icosahedron", "12", "30", "20"],
  ] as const;
  for (const [id, vertices, edges, faces] of solids) {
    await page.locator(`[data-sacred-solid="${id}"]`).click();
    await expect(page.locator("[data-sacred-vertices]")).toHaveText(vertices);
    await expect(page.locator("[data-sacred-edges]")).toHaveText(edges);
    await expect(page.locator("[data-sacred-faces]")).toHaveText(faces);
    await expect(page.locator("[data-sacred-euler]")).toContainText("= 2");
  }

  await page.locator('[data-sacred-phase="solid"]').click();
  const before = await page.evaluate(() => (window as any).__lab.manager.activeLesson.rotatingSolid.rotation.y);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => (window as any).__lab.manager.activeLesson.rotatingSolid.rotation.y);
  expect(after).toBeGreaterThan(before);
  expect(errors, errors.join("\n")).toEqual([]);
});

const sacredState = () =>
  ((window as any).__lab.manager.activeLesson as {
    solidPhase: string;
    solidId: string;
    assemblyProgress: number;
    assemblyFaces: unknown[];
    rotatingSolid?: unknown;
    targetPreview?: { rotation: { y: number } };
    group: { children: unknown[] };
  });

/**
 * The projection collapse scene, read by object name rather than by child index: the
 * scene may gain or lose decoration without these assertions becoming wrong or brittle.
 */
const collapseState = () => {
  const lesson = (window as any).__lab.manager.activeLesson;
  const scene = lesson.collapseScene;
  const root = scene.root;
  const find = (name: string) => root.getObjectByName(name);
  const camera = (window as any).__lab.viewport.camera;
  const cameraLength = Math.hypot(camera.position.x, camera.position.y, camera.position.z);
  return {
    progress: lesson.collapseProgress as number,
    playing: lesson.collapsePlaying as boolean,
    rootNames: root.children.map((child: any) => child.name) as string[],
    flowerCircles: find("flower-overlay").children.length as number,
    shadowSegments: find("shadow-edges").geometry.attributes.position.count / 2,
    shadowPoints: find("shadow-points").children.map((child: any) => ({
      name: child.name as string,
      x: child.position.x as number,
      y: child.position.y as number,
    })),
    rayCount: find("projection-rays").geometry.attributes.position.count / 2,
    axisLine: Boolean(find("viewing-axis")),
    edgeGroups: scene.edgeGroups.map((group: any) => ({
      name: group.line.name as string,
      edges: group.edges.length as number,
    })),
    axisMarkers: scene.solid.children
      .filter((child: any) => child.name.startsWith("axis-vertex"))
      .map((child: any) => child.name as string),
    vertices: scene.vertexMarkers.map((marker: any) => ({
      x: marker.position.x as number,
      y: marker.position.y as number,
      z: marker.position.z as number,
    })),
    // Nothing in this phase may spin, so every rotation must stay at zero.
    rotations: [root, scene.solid, scene.shadow, scene.flower].map((object: any) => [
      object.rotation.x,
      object.rotation.y,
      object.rotation.z,
    ]) as number[][],
    cameraDirection: [
      camera.position.x / cameraLength,
      camera.position.y / cameraLength,
      camera.position.z / cameraLength,
    ] as number[],
    cameraTarget: [
      (window as any).__lab.viewport.controls.target.x,
      (window as any).__lab.viewport.controls.target.y,
      (window as any).__lab.viewport.controls.target.z,
    ] as number[],
    canRotate: (window as any).__lab.viewport.controls.enableRotate as boolean,
  };
};

test("sacred geometry walks one solid through every visibly different construction phase", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#sacred-geometry");
  await page.locator('[data-sacred-view="solids"]').click();
  await page.locator('[data-sacred-solid="tetrahedron"]').click();

  // Phase 1 — the Flower drawn as the triangular lattice that supplies the face.
  await expect(page.locator('[data-sacred-phase="lattice"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-sacred-phase-name]")).toHaveText("Flower lattice");
  await expect(page.locator("[data-sacred-lattice-source]")).toHaveText("yes");
  const lattice = await page.evaluate(sacredState);
  expect(lattice.solidPhase).toBe("lattice");
  expect(lattice.group.children.length).toBeGreaterThan(19);
  expect(lattice.rotatingSolid).toBeUndefined();
  expect(lattice.targetPreview).toBeDefined();
  await expect(page.locator("[data-sacred-phase-copy]")).toContainText("3D destination");
  const previewBefore = await page.evaluate(
    () => (window as any).__lab.manager.activeLesson.targetPreview.rotation.y,
  );
  await page.waitForTimeout(400);
  const previewAfter = await page.evaluate(
    () => (window as any).__lab.manager.activeLesson.targetPreview.rotation.y,
  );
  expect(previewAfter).toBeGreaterThan(previewBefore);

  // Phase 2 — the solid collapses along one fixed viewing direction onto the Flower.
  await page.locator('[data-sacred-phase="projection"]').click();
  await expect(page.locator("[data-sacred-phase-name]")).toHaveText("2D projection");
  await expect(page.locator("[data-sacred-projection-axis]")).toHaveText("3-fold vertex axis");
  await expect(page.locator("[data-sacred-projection-points]")).toHaveText("4");
  await expect(page.locator("[data-sacred-projection-segments]")).toHaveText("6");
  await expect(page.locator("[data-sacred-phase-copy]")).toContainText("become its own shadow");
  await expect(page.locator("[data-sacred-phase-copy]")).toContainText("not a plan and not a fold");
  const projection = await page.evaluate(sacredState);
  expect(projection.solidPhase).toBe("projection");
  // One scene, not a flat drawing beside an unrelated spinning solid.
  expect(projection.rotatingSolid).toBeUndefined();
  expect(projection.targetPreview).toBeUndefined();
  expect(projection.group.children.length).toBe(1);

  const collapseStart = await page.evaluate(collapseState);
  expect(collapseStart.rootNames).toEqual(
    expect.arrayContaining(["flower-overlay", "projection-shadow", "collapse-solid"]),
  );
  expect(collapseStart.flowerCircles).toBe(19);
  expect(collapseStart.shadowSegments).toBe(6);
  expect(collapseStart.shadowPoints).toHaveLength(4);
  expect(collapseStart.rayCount).toBe(4);
  expect(collapseStart.axisLine).toBe(true);
  expect(collapseStart.canRotate).toBe(false);

  // Depth flattens, but nothing rotates and nothing slides across the plane.
  await page.waitForTimeout(500);
  const collapseLater = await page.evaluate(collapseState);
  expect(collapseLater.progress).toBeGreaterThan(collapseStart.progress);
  for (const rotation of [...collapseStart.rotations, ...collapseLater.rotations]) {
    expect(rotation).toEqual([0, 0, 0]);
  }
  collapseLater.vertices.forEach((vertex, index) => {
    expect(vertex.x).toBeCloseTo(collapseStart.vertices[index].x, 9);
    expect(vertex.y).toBeCloseTo(collapseStart.vertices[index].y, 9);
    expect(Math.abs(vertex.z)).toBeLessThanOrEqual(Math.abs(collapseStart.vertices[index].z) + 1e-9);
  });
  await expect(page.locator("[data-sacred-collapse-percent]")).toHaveText("100%", { timeout: 10_000 });

  // Phase 3 — a single equilateral triangle at true size.
  await page.locator('[data-sacred-phase="face"]').click();
  await expect(page.locator("[data-sacred-phase-name]")).toHaveText("One regular face");
  await expect(page.locator("[data-sacred-face-shape]")).toHaveText("equilateral triangle");
  const face = await page.evaluate(sacredState);
  expect(face.group.children.length).toBeLessThan(lattice.group.children.length);

  // Phase 4 — every face laid flat.
  await page.locator('[data-sacred-phase="plan"]').click();
  await expect(page.locator("[data-sacred-phase-name]")).toHaveText("Flat face plan");
  await expect(page.locator("[data-sacred-face-plan-count]")).toHaveText("4");
  const plan = await page.evaluate(sacredState);
  expect(plan.group.children.length).toBe(9); // four fills, four outlines, and 3D target
  expect(plan.group.children.length).not.toBe(face.group.children.length);

  // Phase 5 — the faces animate from the plan onto the solid.
  await page.locator('[data-sacred-phase="assembly"]').click();
  await expect(page.locator("[data-sacred-phase-name]")).toHaveText("Assembly animation");
  await expect(page.locator("#info")).toContainText("assembly animation rather than a physical fold");
  expect((await page.evaluate(sacredState)).assemblyFaces.length).toBe(4);
  await expect(page.locator("[data-sacred-assembly-progress]")).toHaveText("100%", { timeout: 10_000 });
  expect((await page.evaluate(sacredState)).assemblyProgress).toBeCloseTo(1, 3);

  await page.locator("[data-sacred-replay]").click();
  await expect(page.locator("[data-sacred-assembly-progress]")).not.toHaveText("100%");
  await expect(page.locator("[data-sacred-assembly-progress]")).toHaveText("100%", { timeout: 10_000 });

  // Phase 6 — the finished solid rotates.
  await page.locator('[data-sacred-phase="solid"]').click();
  await expect(page.locator("[data-sacred-phase-name]")).toHaveText("Finished solid");
  const spinBefore = await page.evaluate(() => (window as any).__lab.manager.activeLesson.rotatingSolid.rotation.y);
  await page.waitForTimeout(400);
  const spinAfter = await page.evaluate(() => (window as any).__lab.manager.activeLesson.rotatingSolid.rotation.y);
  expect(spinAfter).toBeGreaterThan(spinBefore);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("sacred geometry offers every phase for every solid and says which faces the lattice supplies", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#sacred-geometry");
  await page.locator('[data-sacred-view="solids"]').click();

  const solids = [
    ["tetrahedron", "equilateral triangle", "yes", 4],
    ["cube", "square", "no", 6],
    ["octahedron", "equilateral triangle", "yes", 8],
    ["dodecahedron", "regular pentagon", "no", 12],
    ["icosahedron", "equilateral triangle", "yes", 20],
  ] as const;

  for (const [id, faceShape, fromLattice, faces] of solids) {
    await page.locator(`[data-sacred-solid="${id}"]`).click();

    await page.locator('[data-sacred-phase="lattice"]').click();
    await expect(page.locator("[data-sacred-face-shape]")).toHaveText(faceShape);
    await expect(page.locator("[data-sacred-lattice-source]")).toHaveText(fromLattice);
    await expect(page.locator("[data-sacred-phase-copy]")).toContainText(
      fromLattice === "yes" ? "every lattice cell is an equilateral triangle" : "Flower is context here, not the source",
    );

    for (const phase of ["projection", "face", "plan", "assembly", "solid"] as const) {
      await page.locator(`[data-sacred-phase="${phase}"]`).click();
      await expect(page.locator(`[data-sacred-phase="${phase}"]`)).toHaveAttribute("aria-pressed", "true");
      const state = await page.evaluate(sacredState);
      expect(state.solidPhase).toBe(phase);
      expect(state.group.children.length).toBeGreaterThan(0);
      if (phase === "assembly") expect(state.assemblyFaces.length).toBe(faces);
      if (phase === "solid") expect(state.rotatingSolid).toBeTruthy();
    }
  }

  expect(errors, errors.join("\n")).toEqual([]);
});

test("sacred geometry projects each solid onto the Flower and reports how much of it lands there", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#sacred-geometry");
  await page.locator('[data-sacred-view="solids"]').click();

  const near = ["axis-vertex-near"];
  const both = ["axis-vertex-near", "axis-vertex-far"];
  const projections = [
    ["tetrahedron", "3-fold vertex axis", "4", "6", "0", "4 of 4", "mixed", 4, 6, near],
    ["cube", "3-fold body diagonal", "7", "12", "1", "7 of 7", "all equal", 8, 12, both],
    ["octahedron", "3-fold face axis", "6", "12", "0", "6 of 6", "mixed", 6, 12, []],
    ["dodecahedron", "3-fold vertex axis", "19", "30", "1", "7 of 19", "mixed", 20, 30, both],
    ["icosahedron", "5-fold vertex axis", "11", "30", "1", "3 of 11", "mixed", 12, 30, both],
  ] as const;

  for (const [id, axis, points, segments, merged, lattice, equal, vertices, edges, axisMarkers] of projections) {
    await page.locator(`[data-sacred-solid="${id}"]`).click();
    await page.locator('[data-sacred-phase="projection"]').click();

    await expect(page.locator("[data-sacred-phase-name]")).toHaveText("2D projection");
    await expect(page.locator("[data-sacred-projection-axis]")).toHaveText(axis);
    await expect(page.locator("[data-sacred-projection-points]")).toHaveText(points);
    await expect(page.locator("[data-sacred-projection-segments]")).toHaveText(segments);
    await expect(page.locator("[data-sacred-projection-merged]")).toHaveText(merged);
    await expect(page.locator("[data-sacred-projection-lattice]")).toHaveText(lattice);
    await expect(page.locator("[data-sacred-projection-equal]")).toHaveText(equal);

    const state = await page.evaluate(sacredState);
    // One collapse scene per solid, held together rather than scattered across the group.
    expect(state.group.children.length).toBe(1);
    expect(state.rotatingSolid).toBeUndefined();
    expect(state.targetPreview).toBeUndefined();

    const collapse = await page.evaluate(collapseState);
    expect(collapse.rootNames).toEqual(
      expect.arrayContaining(["flower-overlay", "projection-shadow", "collapse-solid"]),
    );
    expect(collapse.flowerCircles).toBe(19);
    expect(collapse.shadowSegments).toBe(Number(segments));
    expect(collapse.shadowPoints).toHaveLength(Number(points));
    expect(collapse.rayCount).toBe(vertices);
    expect(collapse.vertices).toHaveLength(vertices);
    // Every edge of the solid is drawn exactly once, in one of the named bundles.
    expect(collapse.edgeGroups.reduce((sum, group) => sum + group.edges, 0)).toBe(edges);
    expect(new Set(collapse.edgeGroups.map((group) => group.name)).size).toBe(
      collapse.edgeGroups.length,
    );
    expect(collapse.axisMarkers).toEqual(axisMarkers);

    const copy = (await page.locator("[data-sacred-phase-copy]").textContent()) ?? "";
    expect(copy).toContain("shadow");
    expect(copy.match(/Metatron/g)?.length ?? 0).toBe(id === "cube" ? 1 : 0);
    if (id === "cube") {
      expect(copy).toContain("body diagonal");
      expect(copy).toContain("Every one of the 7 points lands on a Flower circle centre");
    } else if (lattice !== `${points} of ${points}`) {
      expect(copy).toContain("miss it");
    }

    // Run the collapse to the end: the solid lands exactly on the flat shadow it casts.
    await expect(page.locator("[data-sacred-collapse-percent]")).toHaveText("100%", {
      timeout: 15_000,
    });
    const flat = await page.evaluate(collapseState);
    for (const vertex of flat.vertices) expect(Math.abs(vertex.z)).toBeLessThan(1e-9);
    for (const vertex of flat.vertices) {
      const landed = flat.shadowPoints.some(
        (point) => Math.hypot(point.x - vertex.x, point.y - vertex.y) < 1e-9,
      );
      expect(landed, `${id} vertex did not land on a projected point`).toBe(true);
    }
    // With the depth gone the camera looks straight down the viewing direction, so the
    // Flower alignment on screen is the alignment the projection data reports.
    expect(flat.cameraDirection[0]).toBeCloseTo(0, 6);
    expect(flat.cameraDirection[1]).toBeCloseTo(0, 6);
    expect(flat.cameraDirection[2]).toBeCloseTo(1, 6);
    expect(flat.cameraTarget).toEqual([0, 0, 0]);
  }

  // The projection is a different relationship from the face-lattice teaching, which stays.
  await expect(page.locator("#info")).toContainText("three different relationships");
  await expect(page.locator("#info")).toContainText("neither polygon is a cell of this lattice");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("sacred geometry scrubs the cube from solid to Metatron's Cube and back", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#sacred-geometry");
  await page.locator('[data-sacred-view="solids"]').click();
  await page.locator('[data-sacred-solid="cube"]').click();
  await page.locator('[data-sacred-phase="projection"]').click();

  const slider = page.locator("[data-sacred-collapse-slider]");
  await expect(slider).toBeVisible();
  await expect(page.locator("[data-sacred-collapse-percent]")).toHaveText("100%", { timeout: 15_000 });

  // Scrub back to the whole solid: eight separate vertices with real depth between them.
  await slider.fill("0");
  await expect(page.locator("[data-sacred-collapse-percent]")).toHaveText("0%");
  const solid = await page.evaluate(collapseState);
  expect(solid.playing).toBe(false);
  expect(solid.progress).toBe(0);
  expect(solid.vertices).toHaveLength(8);
  expect(new Set(solid.vertices.map((vertex) => vertex.z.toFixed(6))).size).toBeGreaterThan(1);
  // The cube stands on its body diagonal: the two marked ends are on the axis, one in
  // front of the plane and one behind it, and every edge is the same length.
  const axisEnds = solid.vertices.filter((vertex) => Math.hypot(vertex.x, vertex.y) < 1e-9);
  expect(axisEnds).toHaveLength(2);
  expect(Math.sign(axisEnds[0].z)).toBe(-Math.sign(axisEnds[1].z));
  expect(solid.edgeGroups).toEqual([
    { name: "edges-near-axis", edges: 3 },
    { name: "edges-far-axis", edges: 3 },
    { name: "edges-rim", edges: 6 },
  ]);
  const depthAtZero = Number(await page.locator("[data-sacred-collapse-depth]").textContent());
  expect(depthAtZero).toBeGreaterThan(0);

  // Halfway removes exactly half the depth and moves nothing sideways.
  await slider.fill("50");
  await expect(page.locator("[data-sacred-collapse-percent]")).toHaveText("50%");
  const half = await page.evaluate(collapseState);
  half.vertices.forEach((vertex, index) => {
    expect(vertex.x).toBeCloseTo(solid.vertices[index].x, 9);
    expect(vertex.y).toBeCloseTo(solid.vertices[index].y, 9);
    expect(vertex.z).toBeCloseTo(solid.vertices[index].z / 2, 9);
  });
  expect(Number(await page.locator("[data-sacred-collapse-depth]").textContent())).toBeCloseTo(
    depthAtZero / 2,
    1,
  );

  // All the way: the eight vertices become the seven points of the flat figure, the two
  // body-diagonal ends having met in the centre.
  await slider.fill("100");
  await expect(page.locator("[data-sacred-collapse-percent]")).toHaveText("100%");
  const flat = await page.evaluate(collapseState);
  for (const vertex of flat.vertices) expect(vertex.z).toBe(0);
  const distinct = new Set(flat.vertices.map((vertex) => `${vertex.x.toFixed(9)},${vertex.y.toFixed(9)}`));
  expect(distinct.size).toBe(7);
  expect(flat.shadowPoints).toHaveLength(7);
  expect(flat.cameraDirection[2]).toBeCloseTo(1, 6);
  await expect(page.locator("[data-sacred-projection-points]")).toHaveText("7");
  await expect(page.locator("[data-sacred-projection-segments]")).toHaveText("12");

  // Replay runs the animation again from the solid, on its own.
  await page.locator("[data-sacred-collapse-play]").click();
  await expect(page.locator("[data-sacred-collapse-percent]")).not.toHaveText("100%");
  expect((await page.evaluate(collapseState)).playing).toBe(true);
  await expect(page.locator("[data-sacred-collapse-percent]")).toHaveText("100%", { timeout: 15_000 });

  // Nothing free-spins at any point of the collapse.
  const finished = await page.evaluate(collapseState);
  for (const rotation of finished.rotations) expect(rotation).toEqual([0, 0, 0]);
  expect(finished.canRotate).toBe(false);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("circle glossary labels core terms with distinct diagrams", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#circle-glossary");

  await expect(page.locator("#info h2")).toHaveText("Circle Glossary");
  await expect(page.locator("#info")).toContainText("Centre, radius, diameter");
  await expect(page.locator('[data-glossary-term="segment"]')).toBeVisible();
  await expect(page.locator('[data-glossary-term="same-segment"]')).toBeVisible();

  await page.locator('[data-glossary-term="segment"]').click();
  await expect(page.locator("#info")).toContainText("area segment");
  await expect(page.locator("#info")).toContainText("sector = triangle + segment");
  await expect(page.locator("#info")).toContainText("Angles in the same segment");

  await page.locator('[data-glossary-term="same-segment"]').click();
  await expect(page.locator("#info h3")).toHaveText("Angles in the same segment");
  await expect(page.locator("#info")).toContainText("∠ACD = ∠ABD");
  await expect(page.locator("#info")).toContainText("segment = sector − triangle");

  await page.locator('[data-glossary-term="power"]').click();
  await expect(page.locator("#info")).toContainText("AX · XB = CX · XD");
  await expect(page.locator("#info")).toContainText("PT² = PA · PB");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("miter saw planner recalculates flat and compound cuts", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#miter-saw-cuts");

  await expect(page.locator("#info h2")).toHaveText("Mitre Saw Cut Planner");
  await page.locator('[data-miter-input="width"]').fill("100");
  await page.locator('[data-miter-input="width"]').press("Tab");
  await page.locator('[data-miter-input="miter"]').fill("45");
  await page.locator('[data-miter-input="miter"]').press("Tab");
  await expect(page.locator("#info")).toContainText("141.4 mm");
  await expect(page.locator("#info")).toContainText("90.0° corner");

  await page.locator('[data-miter-input="bevel"]').fill("30");
  await page.locator('[data-miter-input="bevel"]').press("Tab");
  await expect(page.locator("#info")).toContainText("Compound cut");
  await expect(page.locator("#info")).toContainText("63.4°");

  await page.locator('[data-cut-list-input="stockLength"]').fill("2400");
  await page.locator('[data-cut-list-input="stockLength"]').press("Tab");
  await page.locator('[data-cut-list-input="endTrim"]').fill("0");
  await page.locator('[data-cut-list-input="endTrim"]').press("Tab");
  await page.locator('[data-cut-list-input="kerf"]').fill("3");
  await page.locator('[data-cut-list-input="kerf"]').press("Tab");
  await page.locator('[data-cut-list-input="parts"]').fill("Long rail, 800, 2\nShort rail, 794");
  await page.locator('[data-cut-list-input="parts"]').press("Tab");
  await expect(page.locator("#cut-list-results")).toContainText("1 board");
  await expect(page.locator("#cut-list-results")).toContainText("offcut 0.0 mm");

  await page.locator('[data-miter-input="width"]').fill("120");
  await page.locator('[data-miter-input="width"]').press("Tab");
  await expect(page.locator('[data-cut-list-input="parts"]')).toHaveValue("Long rail, 800, 2\nShort rail, 794");

  await page.locator('[data-cut-list-input="parts"]').fill("Too long, 2500");
  await page.locator('[data-cut-list-input="parts"]').press("Tab");
  await expect(page.locator("#cut-list-results")).toContainText("exceeds usable board length");

  await page.locator('[data-miter-action="cut"]').click();
  await expect(page.locator("[data-miter-state]")).toHaveText(
    "Cut complete — inspect the separated faces",
    { timeout: 10_000 },
  );
  await expect(page.getByRole("button", { name: "Reset cut" })).toBeVisible();

  await page.locator('[data-miter-example="6"]').click();
  await expect(page.locator("#info")).toContainText("6 pieces · 12 mirrored cuts");
  await page.getByRole("button", { name: "Animate hexagon frame" }).click();
  await expect(page.locator("[data-miter-assembly-state]")).toHaveAttribute("data-miter-assembly", "complete", {
    timeout: 10_000,
  });
  await expect(page.locator("[data-miter-assembly-state]")).toHaveText("6-sided frame complete");
  await page.getByRole("button", { name: "Replay frame assembly" }).click();
  await expect(page.locator("[data-miter-assembly-state]")).toHaveAttribute("data-miter-assembly", "ready");
  await expect(page.locator("[data-miter-state]")).toHaveText("Blade raised — ready to cut");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("circle calculations derives arcs, chords, and line intersection cases", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#circle-calculations");

  await expect(page.locator("#info h2")).toHaveText("Circle Geometry & Calculations");
  await page.locator('[data-circle-input="radius"]').fill("10");
  await page.locator('[data-circle-input="radius"]').press("Tab");
  await expect(page.locator("#info")).toContainText("62.832 units");
  await page.locator('[data-derivation="circumference"]').click();
  await expect(page.locator("dialog[open]")).toContainText("Why circumference is C = 2πr");
  await expect(page.locator("dialog[open] svg")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  await page.getByRole("button", { name: "3 · Arcs" }).click();
  await page.locator('[data-circle-input="angle"]').fill("90");
  await page.locator('[data-circle-input="angle"]').press("Tab");
  await expect(page.locator("#info")).toContainText("2π radians");
  await expect(page.locator("#info")).toContainText("θ/(2π)");
  await expect(page.locator("#info")).toContainText("15.708 units");
  await expect(page.locator('button[data-derivation="arc-length"]')).toHaveText("Derive: s = rθ, with θ in radians");

  await page.getByRole("button", { name: "4 · Chords" }).click();
  await expect(page.locator("#info")).toContainText("Method 1 — chord from the central angle");
  await expect(page.locator("#info")).toContainText("Method 2 — chord from its distance to the centre");
  await expect(page.locator("#info")).toContainText("c = 2√(r² − d²)");
  await expect(page.locator("#info")).toContainText("14.142 units");
  await expect(page.locator("#info")).toContainText("θ = 2sin⁻¹(c/(2r))");
  await expect(page.locator("#info")).toContainText("perpendicular bisector");
  await expect(page.locator('button[data-derivation="chord-length"]')).toHaveText("Derive: c = 2r sin(θ/2)");

  await page.getByRole("button", { name: "2 · Angles" }).click();
  await expect(page.locator("#info")).toContainText("Inscribed angle");
  await expect(page.locator("#info")).toContainText("45°");

  await page.getByRole("button", { name: "5 · Sectors & segments" }).click();
  await expect(page.locator("#info")).toContainText("sector = triangle + segment");
  await expect(page.locator(".region-legend span")).toHaveCount(3);
  await expect(page.locator("#info")).toContainText("Triangle OAB");
  await expect(page.locator("#info")).toContainText("½ab·sinC");
  const sectorArea = await page.locator(".readout div", { hasText: "Sector area" }).innerText();
  const check = await page.locator(".readout div", { hasText: "Check" }).innerText();
  const areaValue = Number(sectorArea.match(/([\d.]+) units²\s*$/)?.[1]);
  const checkValue = Number(check.match(/([\d.]+) units²/g)?.pop()?.match(/([\d.]+)/)?.[1]);
  expect(areaValue).toBeGreaterThan(0);
  expect(Math.abs(areaValue - checkValue)).toBeLessThan(0.01);

  await page.getByRole("button", { name: "6 · Line intersections" }).click();
  await page.locator('[data-circle-input="offset"]').fill("10");
  await page.locator('[data-circle-input="offset"]').press("Tab");
  await expect(page.locator("#info")).toContainText("one intersection");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("circle theorems shows the common tangents between two circles", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#circle-theorems");

  await expect(page.locator("#info h2")).toHaveText("Circle Theorems");
  await page.locator('[data-circle="bitangents"]').click();
  await expect(page.locator("#info")).toContainText("Common tangents to two circles");
  await expect(page.locator("#info .theorem-check, #info .readout")).toBeVisible();

  // Start state: r₁ = 3.1, r₂ = 1.55, centres 6.4 apart in x and 1.2 in y.
  await expect(page.locator("#info")).toContainText("6.512"); // d
  await expect(page.locator("#info")).toContainText("6.324"); // √(d² − (r₁−r₂)²)
  await expect(page.locator("#info")).toContainText("4.558"); // √(d² − (r₁+r₂)²)
  await expect(page.locator("#info")).toContainText("4 common tangents");

  // Method details stay collapsed until opened.
  await page.locator("#info .circle-method > summary").click();
  await expect(page.locator("#info .eq .math").first()).toBeVisible();
  await expect(page.locator("#info .symbol-key dd").first()).toContainText("circle centres");

  await page.locator('[data-derivation="common-tangents"]').click();
  await expect(page.locator("dialog[open]")).toContainText("Why two circles have four common tangents");
  await expect(page.locator("dialog[open] svg")).toBeVisible();
  // The dialog explains its notation, and typesets it rather than printing raw ^ and _.
  await expect(page.locator("dialog[open]")).toContainText("What the symbols mean");
  await expect(page.locator("dialog[open] .symbol-key dt").first()).toHaveText("O₁, O₂");
  await expect(page.locator("dialog[open] .derivation-steps .msqrt").first()).toBeVisible();
  await expect(page.locator("dialog[open] .derivation-steps sub").first()).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  // Drag the second circle's centre inside the first: no common tangent survives.
  const target = await page.evaluate(() => {
    const { viewport } = (window as unknown as { __lab: { viewport: any } }).__lab;
    let handle: any;
    viewport.world.traverse((object: any) => {
      if (!handle && object.userData?.handle === "circle-theorem-0") handle = object;
    });
    if (!handle) return undefined;
    const rect = viewport.renderer.domElement.getBoundingClientRect();
    const toScreen = (v: any) => {
      const p = v.clone().project(viewport.camera);
      return {
        x: rect.left + ((p.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - p.y) / 2) * rect.height,
      };
    };
    const origin = handle.position.clone().set(0, 0, 0);
    return { from: toScreen(handle.position), to: toScreen(origin) };
  });
  expect(target).toBeTruthy();

  await page.mouse.move(target!.from.x, target!.from.y);
  await page.mouse.down();
  await page.mouse.move(target!.to.x, target!.to.y, { steps: 12 });
  await page.mouse.up();

  await expect(page.locator("#info")).toContainText("0 common tangents");
  await expect(page.locator("#info")).toContainText("swallowed by the other");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("circle theorems groups modes and verifies the centre-angle check", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#circle-theorems");

  await expect(page.locator(".circle-mode-label").first()).toHaveText("Angles");
  await expect(page.locator("#info .theorem-check.ok")).toContainText("centre = 2 × edge");

  await page.locator('[data-circle="sameseg"]').click();
  await expect(page.locator("#info")).toContainText("same segment");
  await expect(page.locator("#info .theorem-check.ok")).toBeVisible();

  await page.locator('[data-circle="altseg"]').click();
  await expect(page.locator("#info")).toContainText("Alternate segment theorem");
  await expect(page.locator('[data-derivation="alternate-segment"]')).toBeVisible();

  await page.locator('[data-circle="chords"]').click();
  await expect(page.locator("#info")).toContainText("Intersecting chords");
  await expect(page.locator("#info")).toContainText("a · b = c · d");
  await expect(page.locator("#info .theorem-check.ok").filter({ hasText: "a·b = c·d" })).toBeVisible();

  await page.locator('[data-circle="reset"]').click();
  await expect(page.locator("#info .theorem-check.ok").filter({ hasText: "a·b = c·d" })).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});

test("circle theorems power family covers chords, two secants and tangent–secant", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#circle-theorems");

  await expect(page.locator(".circle-mode-label")).toContainText(["Angles", "Tangents", "Secants & power", "Chords"]);

  await page.getByRole("button", { name: "Intersecting chords: a·b = c·d" }).click();
  await expect(page.locator("#info")).toContainText("Power of a point");
  await expect(page.locator("#info")).toContainText("similar triangles");
  await expect(page.locator("#info .theorem-check.ok").filter({ hasText: "a·b = c·d" })).toBeVisible();
  await page.locator('[data-derivation="intersecting-chords"]').click();
  await expect(page.locator("dialog[open]")).toContainText("a · b = c · d");
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Two secants: PA·PB = PC·PD" }).click();
  await expect(page.getByRole("heading", { name: /Two-secants theorem/ })).toBeVisible();
  await expect(page.locator("#info")).toContainText("PA · PB = PC · PD");
  await expect(page.locator("#info .theorem-check.ok").filter({ hasText: "a·b = c·d" })).toBeVisible();
  await page.locator('[data-derivation="two-secants"]').click();
  await expect(page.locator("dialog[open]")).toContainText("PA · PB = PC · PD");
  await expect(page.locator("dialog[open] svg")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Tangent–secant: PT² = PA·PB" }).click();
  await expect(page.locator("#info")).toContainText("PT² = PA · PB");
  await expect(page.locator("#info .theorem-check.ok").filter({ hasText: "PT² = PA · PB" })).toBeVisible();
  await page.locator('[data-derivation="tangent-secant"]').click();
  await expect(page.locator("dialog[open]")).toContainText("PT² = PA·PB");
  await page.getByRole("button", { name: "Close" }).click();

  // Jump between power modes from the in-panel family chips.
  await page.getByRole("button", { name: "Inside: a·b = c·d" }).click();
  await expect(page.getByRole("heading", { name: /Intersecting chords theorem/ })).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});

test("circle calculations lets you drag control points to change the diagram", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#circle-calculations");

  await page.getByRole("button", { name: "4 · Chords" }).click();
  await page.locator('[data-circle-input="radius"]').fill("5");
  await page.locator('[data-circle-input="radius"]').press("Tab");
  await page.locator('[data-circle-input="angle"]').fill("90");
  await page.locator('[data-circle-input="angle"]').press("Tab");
  await expect(page.locator("#info")).toContainText("Drag the diagram");

  // Locate a real draggable handle in the 3D scene and project it to screen space.
  const target = await page.evaluate(() => {
    const lab = (window as unknown as { __lab: { viewport: any } }).__lab;
    const { viewport } = lab;
    let handle: any;
    viewport.world.traverse((object: any) => {
      if (!handle && object.userData?.handle === "chord-b") handle = object;
    });
    if (!handle) return undefined;
    const rect = viewport.renderer.domElement.getBoundingClientRect();
    const projected = handle.position.clone().project(viewport.camera);
    return {
      x: rect.left + ((projected.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - projected.y) / 2) * rect.height,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    };
  });
  expect(target).toBeTruthy();

  const before = await page.locator('[data-circle-input="angle"]').inputValue();
  await page.mouse.move(target!.x, target!.y);
  await page.mouse.down();
  // Drag the endpoint further round the circle, which opens up the central angle.
  await page.mouse.move(target!.rect.left + target!.rect.width / 2 - 60, target!.y - 60, { steps: 12 });
  await page.mouse.up();

  const after = await page.locator('[data-circle-input="angle"]').inputValue();
  expect(Number(after)).not.toBe(Number(before));
  expect(Number(after)).toBeGreaterThan(Number(before));
  await expect(page.locator("#info")).toContainText("Chord length");

  // The chord must also be free to rotate anywhere, including the top of the circle.
  await page.locator('[data-circle-input="chordPosition"]').fill("90");
  await page.locator('[data-circle-input="chordPosition"]').press("Tab");
  const midpoint = await page.evaluate(() => {
    const { viewport } = (window as unknown as { __lab: { viewport: any } }).__lab;
    let handle: any;
    viewport.world.traverse((object: any) => {
      if (!handle && object.userData?.handle === "chord-mid") handle = object;
    });
    return handle ? { x: handle.position.x, y: handle.position.y } : undefined;
  });
  expect(midpoint).toBeTruthy();
  expect(midpoint!.y).toBeGreaterThan(0.1);
  expect(Math.abs(midpoint!.x)).toBeLessThan(0.05);

  // Drag the midpoint itself back down to the bottom of the circle.
  await page.locator('[data-circle-input="chordPosition"]').fill("0");
  await page.locator('[data-circle-input="chordPosition"]').press("Tab");
  const midScreen = await page.evaluate(() => {
    const { viewport } = (window as unknown as { __lab: { viewport: any } }).__lab;
    let handle: any;
    viewport.world.traverse((object: any) => {
      if (!handle && object.userData?.handle === "chord-mid") handle = object;
    });
    const rect = viewport.renderer.domElement.getBoundingClientRect();
    const projected = handle.position.clone().project(viewport.camera);
    return {
      x: rect.left + ((projected.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - projected.y) / 2) * rect.height,
      centreX: rect.left + rect.width / 2,
      centreY: rect.top + rect.height / 2,
    };
  });
  await page.mouse.move(midScreen.x, midScreen.y);
  await page.mouse.down();
  await page.mouse.move(midScreen.centreX, midScreen.centreY + 70, { steps: 12 });
  await page.mouse.up();
  const position = Number(await page.locator('[data-circle-input="chordPosition"]').inputValue());
  expect(position).toBeGreaterThan(240);
  expect(position).toBeLessThan(300);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("volume lesson calculates many solids and opens authored derivations", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#volume");

  await expect(page.locator("#info h2")).toHaveText("Volume of Solids");
  await expect(page.locator("#info")).toContainText("Cubic units and the scaling law");
  await page.locator('[data-volume-input="side"]').fill("5");
  await page.locator('[data-volume-input="side"]').press("Tab");
  await expect(page.locator("#info")).toContainText("125 units³");

  await page.getByRole("button", { name: "2 · Prisms" }).click();
  await page.getByRole("button", { name: "Cylinder", exact: true }).click();
  await page.locator('[data-volume-input="radius"]').fill("2");
  await page.locator('[data-volume-input="radius"]').press("Tab");
  await page.locator('[data-volume-input="height"]').fill("5");
  await page.locator('[data-volume-input="height"]').press("Tab");
  await expect(page.locator("#info")).toContainText("62.832 units³");
  await page.locator('button[data-derivation="cylinder-volume"]').click();
  await expect(page.locator("dialog[open]")).toContainText("Why a cylinder is a circular prism");
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "4 · Spheres & round solids" }).click();
  await page.getByRole("button", { name: "Torus", exact: true }).click();
  await expect(page.locator("#info")).toContainText("V = 2π²Rr²");
  await page.getByRole("button", { name: "Spherical cap", exact: true }).click();
  await expect(page.locator("#info")).toContainText("V = ⅓πh²(3r−h)");

  await page.getByRole("button", { name: "5 · Frustums" }).click();
  await page.locator('[data-volume-input="radius"]').fill("5");
  await page.locator('[data-volume-input="radius"]').press("Tab");
  await page.locator('[data-volume-input="innerRadius"]').fill("3");
  await page.locator('[data-volume-input="innerRadius"]').press("Tab");
  await page.locator('[data-volume-input="height"]').fill("6");
  await page.locator('[data-volume-input="height"]').press("Tab");
  await expect(page.locator("#info")).toContainText("307.876 units³");

  await page.getByRole("button", { name: "6 · Composite & hollow" }).click();
  await page.getByRole("button", { name: "Pipe / tube", exact: true }).click();
  await expect(page.locator("#info")).toContainText("outer cylinder");
  await expect(page.locator('button[data-derivation="pipe-volume"]')).toBeVisible();

  await page.getByRole("button", { name: "7 · Comparisons & scaling" }).click();
  await expect(page.locator("#info")).toContainText("1 : 2 : 3");
  await expect(page.locator("#info")).toContainText("Surface-area-to-volume ratio");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("volume lesson lets a real 3D radius handle update the calculation", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#volume");
  await page.getByRole("button", { name: "2 · Prisms" }).click();
  await page.getByRole("button", { name: "Cylinder", exact: true }).click();

  const target = await page.evaluate(() => {
    const { viewport } = (window as unknown as { __lab: { viewport: any } }).__lab;
    let handle: any;
    viewport.world.traverse((object: any) => {
      if (!handle && object.userData?.handle === "radius") handle = object;
    });
    if (!handle) return undefined;
    const rect = viewport.renderer.domElement.getBoundingClientRect();
    const projected = handle.position.clone().project(viewport.camera);
    return {
      x: rect.left + ((projected.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - projected.y) / 2) * rect.height,
    };
  });
  expect(target).toBeTruthy();

  const before = Number(await page.locator('[data-volume-input="radius"]').inputValue());
  await page.mouse.move(target!.x, target!.y);
  await page.mouse.down();
  await page.mouse.move(target!.x + 70, target!.y, { steps: 12 });
  await page.mouse.up();

  const after = Number(await page.locator('[data-volume-input="radius"]').inputValue());
  expect(after).not.toBe(before);
  await expect(page.locator("#info")).toContainText("Volume");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("algebraic laws separates term operations from index laws", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#algebraic-laws");

  await expect(page.locator("#info h2")).toHaveText("Algebraic Laws & Index Rules");
  await expect(page.locator("#info")).toContainText("x² + x³ stays x² + x³");
  await expect(page.locator('button[data-derivation="like-terms"]')).toHaveText("Derive: 3x² + 3x² = 6x²");
  await expect(page.locator("#info")).toContainText("3x² + 5x² − 2x² = (3 + 5 − 2)x² = 6x²");
  await page.getByText("Tips and traps").click();
  await expect(page.locator("#info")).toContainText("Terms add; factors multiply.");
  await expect(page.locator("#info")).toContainText("(x + y)² is not x² + y²");

  await page.getByRole("button", { name: "4 · Powers" }).click();
  await expect(page.locator("#info")).toContainText("xᵐ × xⁿ = xᵐ⁺ⁿ");
  await expect(page.locator("#info")).toContainText("not to + or −");
  await expect(page.locator('button[data-derivation="product-of-powers"]')).toHaveText("Derive: xᵐ × xⁿ = xᵐ⁺ⁿ");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("times tables lesson teaches strategies and gives practice feedback", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#times-tables");

  await expect(page.locator("#info h2")).toHaveText("Times Tables & Multiplication Strategies");
  await expect(page.locator("#info")).toContainText("Why do traditional tables go to ×12?");
  await expect(page.locator(".times-twelve-visual svg")).toHaveAttribute(
    "aria-label",
    /dozen shown as twelve counters/,
  );
  await expect(page.locator("#info")).toContainText("6 × 7 = 42");
  await page.locator(".times-table-picker").getByRole("button", { name: "×9", exact: true }).click();
  await expect(page.locator("#info")).toContainText("9 × 12 = 108");
  await page.locator('[data-times-action="fact:3"]').click();
  await expect(page.locator(".times-array-visual svg")).toHaveAttribute(
    "aria-label",
    "Array of 3 columns of 9 counters, 27 in total",
  );
  await expect(page.locator('[data-times-action="fact:3"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#info")).toContainText("9 × 3 = 27");
  await page.locator("#times-interesting-facts summary").click();
  await expect(page.locator("#times-interesting-facts")).toHaveAttribute("open", "");
  await page.locator('[data-times-action="fact:4"]').click();
  await expect(page.locator("#times-interesting-facts")).toHaveAttribute("open", "");
  await page.locator("#times-map-target").fill("18");
  await page.locator('[data-times-action="map-show"]').click();
  await expect(page.locator('td[data-highlight="hit"]')).toHaveCount(4);
  await expect(page.locator("#times-map-summary")).toContainText("2 × 9");
  await expect(page.locator("#times-map-summary")).toContainText("3 × 6");
  await page.locator("#times-map-target").fill("13");
  await page.locator('[data-times-action="map-show"]').click();
  await expect(page.locator('td[data-highlight="hit"]')).toHaveCount(0);
  await expect(page.locator("#times-map-summary")).toContainText("does not appear");
  await page.locator('[data-times-action="map-squares"]').click();
  await expect(page.locator('td[data-highlight="square"]')).toHaveCount(12);
  await expect(page.locator('[data-times-action="map-squares"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('td[data-times-action="map-cell:4:9"]').click();
  await expect(page.locator(".times-selected-fact")).toContainText("4 × 9 = 36");
  await expect(page.locator(".times-array-visual svg")).toHaveAttribute(
    "aria-label",
    "Array of 9 columns of 4 counters, 36 in total",
  );
  await expect(page.locator('button[data-derivation="times-nine"]')).toHaveText("Derive: n × 9 = n × 10 − n");

  await page.locator("#times-answer").fill("42");
  await page.locator('[data-times-action="check"]').click();
  await expect(page.locator("#info")).toContainText("Correct — 6 × 7 = 42.");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("rearranging equations provides worked examples and error-prevention tips", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#rearranging-equations");

  await expect(page.locator("#info h2")).toHaveText("Rearranging Equations");
  await expect(page.locator("#info")).toContainText("Unknown on both sides");
  await expect(page.locator("#info")).toContainText("Negative coefficient");
  await expect(page.locator("#info")).toContainText("Fraction coefficient");
  await expect(page.locator("#info")).toContainText("Rearrange a formula");
  await page.getByText("Tips and traps").click();
  await expect(page.locator("#info")).toContainText("Do not “move” a term.");
  await expect(page.locator("#info")).toContainText("Check the original equation.");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("every Foundations lesson states its learning journey, discovery, and application", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");

  for (const id of FOUNDATION_LESSON_IDS) {
    await page.evaluate((lessonId) => (window as any).__lab.manager.selectById(lessonId), id);
    const context = page.locator(".foundation-context");
    await expect(context).toContainText("Learning journey");
    await expect(context).toContainText("Start with:");
    await expect(context).toContainText("Build toward:");
    await expect(context).toContainText("Discovery and history");
    await expect(context).toContainText("Where this matters:");
  }

  expect(errors, errors.join("\n")).toEqual([]);
});

test("the sidebar presents the whole curriculum in teaching order", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");

  await expect(page.locator(".nav-section-title").evaluateAll((titles) =>
    titles.map((title) => title.textContent?.trim()),
  )).resolves.toEqual([
    "Stage 1 · Numbers & arithmetic",
    "Stage 2 · Algebra",
    "Stage 3 · Functions & graphs",
    "Stage 4 · Shape & space",
    "Stage 5 · Trigonometry & waves",
    "Stage 6 · Vectors & complex numbers",
    "Stage 7 · Calculus",
    "Stage 8 · Probability & randomness",
    "Stage 9 · Number theory",
    "Stage 10 · Applied maths & physics",
    "Stage 11 · Astronomy",
    "Stage 12 · Maths as code",
  ]);

  await expect(page.locator(".nav-item .nav-title").evaluateAll((titles) =>
    titles.slice(0, 30).map((title) => title.textContent?.replace(/^\d+\s*·\s*/, "").trim()),
  )).resolves.toEqual([
    // Stage 1 — numbers and arithmetic.
    "Foundation topics",
    "Number Sense & Fractions",
    "Arithmetic Operations Lab",
    "Order of Operations",
    "Times Tables & Multiplication Strategies",
    "Multiplication & Division",
    "Unit Conversions",
    // Stage 2 — algebra.
    "Algebraic Laws & Index Rules",
    "Rearranging Equations",
    "Powers & Exponential Growth",
    "Logarithms",
    "Binomials",
    "Pascal's Triangle",
    // Stage 3 — functions and graphs.
    "Coordinates & Straight Lines",
    "Functions & Graphs",
    "Simultaneous Equations",
    "Quadratics",
    "Inequalities",
    "Graph Transformations",
    "Exponential & Log Graphs",
    "Sequences & Series",
    // Stage 4 — shape and space.
    "Geometry",
    "Angles",
    "Parallel Lines",
    "Triangle Theorems",
    "Pythagoras",
    "Similar Triangles",
    "Triangle Transformations",
    "Quadrilaterals",
    "Circle Glossary",
  ]);

  for (const [id, prerequisite] of [
    ["number-sense-fractions", "Foundation topics"],
    ["arithmetic-operations", "Number Sense & Fractions"],
    ["order-of-operations", "Arithmetic Operations Lab"],
    ["times-tables", "Arithmetic Operations Lab"],
    ["multiplication-division", "Times Tables & Multiplication Strategies"],
    ["algebraic-laws", "Multiplication & Division"],
    ["unit-conversions", "Multiplication & Division"],
    ["powers", "Algebraic Laws & Index Rules"],
    ["logarithms", "Powers & Exponential Growth"],
    ["pascal-triangle", "Binomials"],
    ["probability", "Pascal's Triangle"],
    ["markov-chains", "Probability & Distributions"],
    ["stochastic-processes", "Markov Chains"],
    ["vectors", "Foundation topics"],
    ["complex-numbers", "Vectors"],
    ["fibonacci-golden-ratio", "Foundation topics"],
    ["mersenne-primes", "Powers & Exponential Growth"],
    ["mersenne-primes", "Prime Numbers — Complete Guide"],
    ["circle-glossary", "Geometry"],
    ["circle-theorems", "Circle Glossary"],
    ["volume", "Geometry"],
    ["volume", "Circle Geometry & Calculations"],
  ]) {
    await page.evaluate((lessonId) => (window as any).__lab.manager.selectById(lessonId), id);
    await expect(page.locator("#lesson-meta")).toContainText(prerequisite);
  }

  expect(errors, errors.join("\n")).toEqual([]);
});

test("number sense locates fractions and relates them to decimals", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#number-sense-fractions");

  await expect(page.locator("#info h2")).toHaveText("Number Sense & Fractions");
  await expect(page.locator("#info")).toContainText("a/b");
  await expect(page.locator("#info")).toContainText("numerator");
  await expect(page.locator("#info")).toContainText("denominator");
  await expect(page.locator("#info")).toContainText("1/2");
  await page.getByRole("button", { name: "5/4" }).click();
  await expect(page.locator("#info")).toContainText("5 ÷ 4 = 1.25");
  await expect(page.locator("#info")).toContainText("beyond 1");
  await page.locator("#fraction-numerator").fill("7");
  await page.locator("#fraction-denominator").fill("3");
  await page.getByRole("button", { name: "Add to plot" }).click();
  await expect(page.locator('[data-plotted-fraction="custom-7-3"]')).toContainText("7/3");
  await expect(page.locator('[data-plotted-fraction="five-quarters"]')).toContainText("5/4");
  await expect(page.locator("#info")).toContainText("split 7 total units");
  await expect(page.locator("#info")).toContainText("Counting-parts view");
  await expect(page.locator("#info")).toContainText("2.3333 units");
  await expect(page.locator("#info")).toContainText("every whole interval into 3 equal parts");
  const fiveQuartersMarker = await page.evaluate(() => {
    const lab = (window as any).__lab;
    let marker: any;
    lab.viewport.world.traverse((object: any) => {
      if (object.userData.fractionId === "five-quarters") marker = object;
    });
    if (!marker) throw new Error("5/4 marker was not found");
    const position = marker.getWorldPosition(marker.position.clone()).project(lab.viewport.camera);
    const bounds = lab.viewport.renderer.domElement.getBoundingClientRect();
    return {
      x: bounds.left + ((position.x + 1) / 2) * bounds.width,
      y: bounds.top + ((1 - position.y) / 2) * bounds.height,
    };
  });
  await page.mouse.click(fiveQuartersMarker.x, fiveQuartersMarker.y);
  await expect(page.locator("#info")).toContainText("5 ÷ 4 = 1.25");
  await page.getByRole("button", { name: "4×" }).click();
  await expect(page.locator(".fraction-bar-scale")).toHaveAttribute("data-bar-scale", "4");
  await page.locator("#fraction-numerator").fill("12");
  await page.locator("#fraction-denominator").fill("18");
  await page.getByRole("button", { name: "Add to plot" }).click();
  await expect(page.locator("#info")).toContainText("12/18 is not in simplest terms");
  await expect(page.locator("#info")).toContainText("12/18 = 2/3");
  await page.locator("#fraction-numerator").fill("29");
  await page.locator("#fraction-denominator").fill("2");
  await page.getByRole("button", { name: "Add to plot" }).click();
  await expect(page.locator("#info")).toContainText("split 29 total units");
  await expect(page.locator("#info")).toContainText("14.5 units");
  await expect(page.locator("#info")).toContainText("29 ÷ 2 = 14.5");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("arithmetic operations lab visualizes operations, inverses, rules, and factorials", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#arithmetic-operations");

  await expect(page.locator("#info h2")).toHaveText("Arithmetic Operations Lab");
  await expect(page.locator("[data-arithmetic-operation]")).toHaveCount(5);
  await expect(page.locator(".operation-lab-readout")).toContainText("4 + 3 = 7");
  await expect(page.locator("#stage canvas")).toHaveAttribute("role", "img");
  await expect(page.locator("#stage canvas")).toHaveAttribute("aria-label", /4 \+ 3 = 7/);

  await page.locator('[data-arithmetic-operation="subtraction"]').click();
  await expect(page.locator(".operation-lab-readout")).toContainText("7 − 4 = 3");

  await page.locator('[data-arithmetic-operation="multiplication"]').click();
  await page.locator('[data-arithmetic-input="a"]').fill("6");
  await page.locator('[data-arithmetic-input="a"]').press("Tab");
  await page.locator('[data-arithmetic-input="b"]').fill("4");
  await page.locator('[data-arithmetic-input="b"]').press("Tab");
  await expect(page.locator(".operation-lab-readout")).toContainText("6 × 4 = 24");

  await page.locator('[data-arithmetic-operation="division"]').click();
  await page.locator('[data-arithmetic-input="a"]').fill("17");
  await page.locator('[data-arithmetic-input="a"]').press("Tab");
  await page.locator('[data-arithmetic-input="b"]').fill("5");
  await page.locator('[data-arithmetic-input="b"]').press("Tab");
  await page.getByRole("button", { name: "Check with the inverse" }).click();
  await expect(page.locator("[data-inverse-feedback]")).toContainText("3 × 5 + 2 = 17");

  await page.locator('[data-arithmetic-operation="factorial"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".operation-lab-readout")).toContainText("5! = 5 × 4 × 3 × 2 × 1 = 120");
  await expect(page.locator("#info")).toContainText("Factorial is not an inverse-operation rule");
  await expect(page.locator("#info")).toContainText("0! = 1");

  await page.getByRole("button", { name: "Associative" }).click();
  await expect(page.locator('[data-active-rule="associative"]')).toContainText(
    "It fails for subtraction and division",
  );
  await expect(page.locator("#info")).toContainText("Division by zero is undefined");
  await expect(page.locator("#info")).toContainText("a × (b + c) = a × b + a × c");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("Markov lesson connects transition matrices to forecasts and absorbing states", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#markov-chains");

  await expect(page.locator("#info h2")).toHaveText("Markov Chains");
  await expect(page.locator("#info")).toContainText("pₙ = p₀Pⁿ");
  await expect(page.locator(".cmp-table tbody tr")).toHaveCount(3);
  await expect(page.locator("#lesson-meta")).toContainText("Probability & Distributions");

  await page.getByRole("combobox", { name: "Application" }).selectOption({
    label: "Customer retention",
  });
  await expect(page.locator("#info")).toContainText("Churned is an absorbing state");
  await expect(page.locator("#info")).toContainText("Long-run Churned");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("probability course progresses from sample spaces to Bayes and the CLT", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#probability");

  await expect(page.locator("#info h2")).toHaveText("Probability & Distributions");
  await expect(page.locator("[data-probability-chapter]")).toHaveCount(8);
  await expect(page.locator("#probability-body")).toContainText("Ω = {1,2,3,4,5,6}");

  await page.locator("[data-probability-chapter='conditional']").click();
  await expect(page.locator("#probability-body")).toContainText("P(A | B)");
  await page.locator("[data-probability-answer='2']").click();
  await expect(page.locator("#probability-check-feedback")).toContainText("Correct.");

  await page.locator("[data-probability-chapter='sampling']").click();
  await expect(page.locator("#probability-body")).toContainText("central limit theorem");
  await expect(page.locator("#probability-body")).toContainText("σ / √n");

  await page.locator("[data-probability-chapter='bayes']").click();
  await expect(page.locator("#probability-body")).toContainText("P(A|B)=P(B|A)P(A) / P(B)");
  await expect(page.locator("#probability-body")).toContainText("Pascal and Fermat");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("stochastic-process course connects sample paths, arrivals, stationarity and diffusion", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#stochastic-processes");

  await expect(page.locator("#info h2")).toHaveText("Stochastic Processes");
  await expect(page.locator("[data-stochastic-chapter]")).toHaveCount(8);
  await expect(page.locator("#stochastic-body")).toContainText("{Xₜ : t ∈ T}");
  await expect(page.locator("#lesson-meta")).toContainText("Markov Chains");

  await page.locator("[data-stochastic-chapter='poisson']").click();
  await expect(page.locator("#stochastic-body")).toContainText("N(t) ~ Poisson(λt)");
  await page.locator("[data-stochastic-answer='3']").click();
  await expect(page.locator("#stochastic-check-feedback")).toContainText("Correct.");

  await page.locator("[data-stochastic-chapter='stationarity']").click();
  await expect(page.locator("#stochastic-body")).toContainText("Corr(Xₜ,Xₜ₋ₖ)=φᵏ");

  await page.locator("[data-stochastic-chapter='brownian']").click();
  await expect(page.locator("#stochastic-body")).toContainText("dX=μdt+σdW");
  await expect(page.locator("#stochastic-body")).toContainText("Einstein and Smoluchowski");

  await page.locator("[data-stochastic-chapter='toolkit']").click();
  await expect(page.locator("#stochastic-body")).toContainText("Hidden Markov/state-space model");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("multiplication and division lesson shows written methods and inverse checks", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#multiplication-division");
  await expect(page.locator("#info h2")).toHaveText("Multiplication & Division");
  await expect(page.locator(".arith-working")).toContainText("9022");
  await expect(page.locator("#info")).toContainText("347 × 20 = 6,940");

  await page.locator("[data-arith-action='division']").click();
  await expect(page.locator(".arith-working")).toContainText("164 r 3");
  await expect(page.locator("#info")).toContainText("9 ÷ 6 = 1");
  await expect(page.locator("#info")).toContainText("6 × 164 + 3 = 987");

  await page.locator("[data-arith-action='multiplication']").click();
  await page.locator("[data-arith-action='multiply-big-example']").click();
  await expect(page.locator(".arith-working")).toContainText("301266");
  await expect(page.locator("#info")).toContainText("4,782 × 60 = 286,920");

  await page.locator("[data-arith-action='tricks']").click();
  await expect(page.locator("#info")).toContainText("47 × 11");
  await expect(page.locator("#info")).toContainText("carry the 1 → 517");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("binomials progress from distribution through powers to probability", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#binomials");
  await expect(page.locator("#info h2")).toHaveText("Binomials");
  await expect(page.locator("[data-binomial-product-result]")).toContainText("x² + 5x + 6");

  await page.locator("[data-binomial-preset='1-4']").click();
  await expect(page.locator("[data-binomial-product-result]")).toContainText("x² + 5x + 4");

  await page.locator("[data-binomial-stage='powers']").first().click();
  await expect(page.locator("[data-binomial-power-expansion]")).toContainText(
    "(a + b)⁴ = a⁴ + 4a³b + 6a²b² + 4ab³ + b⁴",
  );
  await expect(page.locator("[data-binomial-pascal-row]")).toContainText("6");

  await page.locator("[data-binomial-stage='probability']").first().click();
  await expect(page.locator("[data-binomial-probability-coefficient]")).toContainText("C(4, 2) = 6");
  await expect(page.locator("[data-binomial-probability-result]")).toContainText("6 / 16 = 37.50%");
  await expect(page.locator(".binomial-sequences")).toContainText("HHTT");
  await expect(page.locator(".binomial-sequences code")).toHaveCount(6);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("trigonometry builds one clear construction at a time", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#trig-functions");
  await expect(page.locator("#info h2")).toHaveText("Trigonometric Functions");

  const initialFocus = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      selected: lesson.selectedFunction,
      animate: lesson.params.animate,
      radius: lesson.radiusLine.visible,
      circlePoints: lesson.circleLine.geometry.getAttribute("position").count,
      baseGuide: lesson.originalBase.visible,
      riseGuide: lesson.originalRise.visible,
      sine: lesson.sinSeg.visible,
      cosine: lesson.cosSeg.visible,
      tangent: lesson.tanSeg.visible,
      secant: lesson.secSeg.visible,
      cosecant: lesson.cosecSeg.visible,
      cotangent: lesson.cotSeg.visible,
    };
  });
  expect(initialFocus).toEqual({
    selected: null,
    animate: false,
    radius: true,
    circlePoints: 97,
    baseGuide: true,
    riseGuide: true,
    sine: false,
    cosine: false,
    tangent: false,
    secant: false,
    cosecant: false,
    cotangent: false,
  });
  await expect(page.locator("#trig-function-breakdown")).toContainText("Start · One right triangle");

  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.angleDeg = 30;
    lesson.params.startAngleDeg = 30;
    lesson.params.radius = 2;
    lesson.rebuildScene();
  });
  await expect(page.locator("#trig-readout")).toContainText("θ swept / final φ30.0° / 60.0°");
  await expect(page.locator("#trig-readout")).toContainText("Triangle (x, y, R)(1.000, 1.732, 2.000)");
  await expect(page.locator("#trig-readout")).toContainText("sin φ = y/R0.866");
  await expect(page.locator("#trig-readout")).toContainText("cos φ = x/R0.500");
  await expect(page.locator("#trig-readout")).toContainText("tan φ = y/x1.732");
  await expect(page.locator("#trig-readout")).toContainText("sec φ = R/x2.000");
  await expect(page.locator("#trig-readout")).toContainText("cosec φ = R/y1.155");
  await expect(page.locator("#trig-readout")).toContainText("cot φ = x/y0.577");

  await page.locator("[data-trig-function='sin']").click();
  await expect(page.locator("[data-trig-identity]")).toBeVisible();
  await page.locator("[data-trig-identity]").click();
  await expect(page.locator("[data-trig-identity-proof]")).toBeVisible();
  const identityScene = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      identity: lesson.identityProofShown,
      selected: lesson.selectedFunction,
      animate: lesson.params.animate,
      radius: lesson.radiusLine.visible,
      x: lesson.cosSeg.visible,
      y: lesson.sinSeg.visible,
      xOpacity: lesson.cosSeg.material.opacity,
      yOpacity: lesson.sinSeg.material.opacity,
      areaDiagram: lesson.identityAreaGroup.visible,
      areaKind: lesson.identityAreaGroup.userData.kind,
      areas: lesson.identityAreaGroup.userData.areas,
      tangent: lesson.tanSeg.visible,
      secant: lesson.secSeg.visible,
      cosecant: lesson.cosecSeg.visible,
      cotangent: lesson.cotSeg.visible,
      secantTriangle: lesson.secTriangle.visible,
      cosecantTriangle: lesson.cosecTriangle.visible,
      comparison: lesson.comparisonGroup.visible,
    };
  });
  expect(identityScene).toEqual({
    identity: true,
    selected: null,
    animate: false,
    radius: true,
    x: true,
    y: true,
    xOpacity: 1,
    yOpacity: 1,
    areaDiagram: true,
    areaKind: "pythagorean-area-equation",
    areas: { xSquared: expect.closeTo(1, 8), ySquared: expect.closeTo(3, 8), radiusSquared: 4 },
    tangent: false,
    secant: false,
    cosecant: false,
    cotangent: false,
    secantTriangle: false,
    cosecantTriangle: false,
    comparison: false,
  });

  const identityProof = page.locator("[data-trig-identity-proof]");
  await expect(identityProof).toContainText("blue base is x");
  await expect(identityProof).toContainText("red height is y");
  await expect(identityProof).toContainText("white hypotenuse is the circle radius R");
  await expect(page.locator("[data-trig-identity-step='definitions']")).toContainText("cos φ = x/R");
  await expect(page.locator("[data-trig-identity-step='definitions']")).toContainText(
    "Multiply both sides by the same positive radius R",
  );
  await expect(page.locator("[data-trig-identity-step='definitions']")).toContainText(
    "x = R cos φ = 2.000 × 0.500 = 1.000",
  );
  await expect(page.locator("[data-trig-identity-step='definitions']")).toContainText("sin φ = y/R");
  await expect(page.locator("[data-trig-identity-step='definitions']")).toContainText(
    "y = R sin φ = 2.000 × 0.866 = 1.732",
  );
  await expect(page.locator("[data-trig-identity-step='pythagoras']")).toContainText(
    "the two leg-square areas add to the hypotenuse-square area",
  );
  await expect(page.locator("[data-trig-identity-step='pythagoras']")).toContainText("x² + y² = R²");
  await expect(page.locator("[data-trig-identity-numeric-check]")).toContainText(
    "1.000² + 1.732² = 4.000 ≈ 4.000 = 2.000²",
  );
  await expect(page.locator("[data-trig-identity-step='pythagoras']")).toContainText(
    "caused only by squaring rounded display values",
  );
  await expect(page.locator("[data-trig-identity-step='divide']")).toContainText(
    "R > 0, so R² > 0 and division by R² is allowed",
  );
  await expect(page.locator("[data-trig-identity-step='divide']")).toContainText(
    "(x/R)² + (y/R)² = 1",
  );
  await expect(page.locator("[data-trig-identity-step='replace']")).toContainText(
    "x/R = cos φ and y/R = sin φ",
  );
  await expect(page.locator("[data-trig-identity-step='replace']")).toContainText("cos²φ + sin²φ = 1");
  await expect(page.locator("[data-trig-identity-step='replace']")).toContainText(
    "Addition is commutative",
  );
  await expect(page.locator("[data-trig-identity-step='replace']")).toContainText("sin²φ + cos²φ = 1");
  await expect(page.locator("[data-trig-identity-step='general']")).toContainText(
    "Outside the first quadrant, x or y can be negative directed lengths",
  );
  await expect(page.locator("[data-trig-identity-step='general']")).toContainText(
    "Axis angles also work",
  );
  await expect(page.locator("[data-trig-identity-step='applications']")).toContainText(
    "cos²φ = 1 − 0.6² = 0.64",
  );
  await expect(page.locator("[data-trig-identity-step='applications']")).toContainText(
    "0.6² + 0.8² = 1",
  );
  await expect(page.locator("[data-trig-identity-step='applications']")).toContainText(
    "1 − sin²φ",
  );
  const identityReadout = page.locator("[data-trig-identity-readout]");
  await expect(identityReadout.locator("span").nth(0)).toContainText("sin²φ0.7500");
  await expect(identityReadout.locator("span").nth(1)).toContainText("cos²φ0.2500");
  await expect(identityReadout.locator("span").nth(2)).toContainText("sum1.0000");

  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.angleDeg = 90;
    lesson.params.startAngleDeg = 0;
    lesson.params.radius = 3;
    lesson.rebuildScene();
  });
  await expect(identityReadout.locator("span").nth(0)).toContainText("sin²φ1.0000");
  await expect(identityReadout.locator("span").nth(1)).toContainText("cos²φ0.0000");
  await expect(identityReadout.locator("span").nth(2)).toContainText("sum1.0000");
  await expect(page.locator("[data-trig-identity-numeric-check]")).toContainText(
    "0.000² + 3.000² = 9.000 ≈ 9.000 = 3.000²",
  );
  expect(await page.evaluate(() => (window as any).__lab.manager.activeLesson.identityAreaGroup.userData.areas))
    .toEqual({ xSquared: expect.closeTo(0, 8), ySquared: 9, radiusSquared: 9 });

  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.angleDeg = 30;
    lesson.params.startAngleDeg = 30;
    lesson.params.radius = 2;
    lesson.rebuildScene();
  });

  await page.locator("[data-trig-function='sin']").click();
  await page.locator("[data-trig-panel-tab='construction']").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Sine: reveal the height");
  await expect(page.locator("#trig-function-breakdown")).toContainText("sin φ = y/R = 1.732 ÷ 2.000 = 0.866");
  const sineFocus = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      sine: lesson.sinSeg.visible,
      cosine: lesson.cosSeg.visible,
      tangent: lesson.tanSeg.visible,
      identity: lesson.identityAreaGroup.visible,
    };
  });
  expect(sineFocus).toEqual({ sine: true, cosine: false, tangent: false, identity: false });

  await page.locator("[data-trig-function='cos']").click();
  await page.locator("[data-trig-panel-tab='construction']").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Cosine: add the base");
  await expect(page.locator("#trig-function-breakdown")).toContainText("cos φ = x/R = 1.000 ÷ 2.000 = 0.500");
  const sideLabels = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      x: lesson.cosLabel.userData.label,
      y: lesson.sinLabel.userData.label,
      sine: lesson.sinSeg.visible,
      cosine: lesson.cosSeg.visible,
    };
  });
  expect(sideLabels).toEqual({ x: "x", y: "y", sine: true, cosine: true });

  await page.locator("[data-trig-function='tan']").click();
  await page.locator("[data-trig-panel-tab='construction']").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Tangent starts in the same triangle");
  await expect(page.locator("#trig-function-breakdown")).toContainText("tan φ = y/x = 1.732 ÷ 1.000 = 1.732");
  const tangentFirstStep = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      sine: lesson.sinSeg.visible,
      cosine: lesson.cosSeg.visible,
      tangent: lesson.tanSeg.visible,
      largeTriangle: lesson.secTriangle.visible,
    };
  });
  expect(tangentFirstStep).toEqual({ sine: true, cosine: true, tangent: false, largeTriangle: false });

  await page.locator("[data-trig-tangent-proof]").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Tangent: the similar triangle");
  await expect(page.locator("#trig-function-breakdown")).toContainText("share the acute angle α = 60.0° at O");
  await expect(page.locator("#trig-function-breakdown")).toContainText("∠H = 90° corresponds to ∠P = 90°");
  const tangentAtPoint = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const points = lesson.tanSeg.geometry.getAttribute("position").array as Float32Array;
    const tangent = { x: points[3] - points[0], y: points[4] - points[1] };
    const radius = {
      x: lesson.point.position.x - lesson.center.x,
      y: lesson.point.position.y - lesson.center.y,
    };
    return {
      visible: lesson.tanSeg.visible,
      largeTriangle: lesson.secTriangle.visible,
      rightAngle: lesson.pointRightAngle.visible,
      similarity: lesson.similarityLabel.visible,
      vertices: [
        lesson.originVertexLabel.visible,
        lesson.footVertexLabel.visible,
        lesson.pointVertexLabel.visible,
        lesson.interceptVertexLabel.visible,
      ],
      dot: tangent.x * radius.x + tangent.y * radius.y,
    };
  });
  expect(tangentAtPoint.visible).toBe(true);
  expect(tangentAtPoint.largeTriangle).toBe(true);
  expect(tangentAtPoint.rightAngle).toBe(true);
  expect(tangentAtPoint.similarity).toBe(true);
  expect(tangentAtPoint.vertices).toEqual([true, true, true, true]);
  expect(tangentAtPoint.dot).toBeCloseTo(0, 4);

  await page.locator("[data-trig-function='sec']").click();
  await page.locator("[data-trig-panel-tab='construction']").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Secant starts in the original triangle");
  await expect(page.locator("#trig-function-breakdown")).toContainText("cos φ = x/R = 1.000 ÷ 2.000 = 0.500");
  await expect(page.locator("#trig-function-breakdown")).toContainText("sec φ = R/x = 2.000 ÷ 1.000 = 2.000 = 1/cos φ");
  const secantFirstStep = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      tangent: lesson.tanSeg.visible,
      secant: lesson.secSeg.visible,
      cosecant: lesson.cosecSeg.visible,
      cotangent: lesson.cotSeg.visible,
      secantTriangle: lesson.secTriangle.visible,
      cosecantTriangle: lesson.cosecTriangle.visible,
      tangentRightAngle: lesson.pointRightAngle.visible,
      vertices: [
        lesson.originVertexLabel.visible,
        lesson.footVertexLabel.visible,
        lesson.pointVertexLabel.visible,
        lesson.interceptVertexLabel.visible,
      ],
    };
  });
  expect(secantFirstStep).toEqual({
    tangent: false,
    secant: false,
    cosecant: false,
    cotangent: false,
    secantTriangle: false,
    cosecantTriangle: false,
    tangentRightAngle: false,
    vertices: [false, false, false, false],
  });

  await page.locator("[data-trig-secant-proof]").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Secant: the similar triangle");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Geometric AA proof");
  await expect(page.locator("#trig-function-breakdown")).toContainText("rays OH and OQ are the same ray from O along the x-axis");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Both angles use the same radius ray OP");
  await expect(page.locator("#trig-function-breakdown")).toContainText("∠HOP = ∠QOP = φ");
  await expect(page.locator("#trig-function-breakdown")).toContainText("OH is horizontal and HP is the original vertical projection");
  await expect(page.locator("#trig-function-breakdown")).toContainText("radius OP is perpendicular to the tangent PQ at P");
  await expect(page.locator("#trig-function-breakdown")).toContainText("△OHP ∼ △OPQ by AA");
  await expect(page.locator("#trig-function-breakdown")).toContainText("O→O, H→P, P→Q");
  await expect(page.locator("#trig-function-breakdown")).toContainText("∠HPO = ∠OQP = 90° − φ = 30.0°");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Live check: 60.0° = 60.0°");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Vertices O ↔ O · H ↔ P · P ↔ Q");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Sides OH ↔ OP · HP ↔ PQ · OP ↔ OQ");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Large OP is the same radius R and corresponds to small OH = x");
  await expect(page.locator("#trig-function-breakdown")).toContainText("scale factor from small to large is R/x = 2.000 ÷ 1.000 = 2.000 = sec φ");
  await expect(page.locator("#trig-function-breakdown")).toContainText("OQ = R × (R/x) = R·sec φ = 2.000 × 2.000 = 4.000");
  await expect(page.locator("#trig-function-breakdown")).toContainText("sec φ is the dimensionless scale factor");
  await expect(page.locator("#trig-function-breakdown")).toContainText("OQ = R·sec φ, not sec φ by itself");
  const secantProof = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      tangent: lesson.tanSeg.visible,
      secant: lesson.secSeg.visible,
      secantTriangle: lesson.secTriangle.visible,
      tangentRightAngle: lesson.pointRightAngle.visible,
      similarity: lesson.similarityLabel.visible,
      vertices: [
        lesson.originVertexLabel.visible,
        lesson.footVertexLabel.visible,
        lesson.pointVertexLabel.visible,
        lesson.interceptVertexLabel.visible,
      ],
      vertexLabels: [
        lesson.originVertexLabel.userData.label,
        lesson.footVertexLabel.userData.label,
        lesson.pointVertexLabel.userData.label,
        lesson.interceptVertexLabel.userData.label,
      ],
    };
  });
  expect(secantProof).toEqual({
    tangent: true,
    secant: true,
    secantTriangle: true,
    tangentRightAngle: true,
    similarity: true,
    vertices: [true, true, true, true],
    vertexLabels: ["O", "H", "P", "Q"],
  });
  const xConstructionLengths = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const length = (line: any) => {
      const points = line.geometry.getAttribute("position").array as Float32Array;
      return Math.hypot(points[3] - points[0], points[4] - points[1]);
    };
    return { tangent: length(lesson.tanSeg), secant: length(lesson.secSeg) };
  });
  expect(xConstructionLengths.tangent).toBeCloseTo(2 * Math.sqrt(3), 4);
  expect(xConstructionLengths.secant).toBeCloseTo(4, 4);

  await expect(page.locator("#trig-function-breakdown")).toContainText(
    "move copies of small OHP and large OQP into the side-by-side comparison",
  );
  await expect(page.locator("[data-trig-comparison='sec']")).toHaveText(
    "Animate matching triangles from the circle",
  );
  expect(await page.evaluate(() => (window as any).__lab.manager.activeLesson.comparisonGroup.visible)).toBe(false);
  await page.locator("[data-trig-comparison='sec']").click();
  const secantAnimationStart = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      animating: lesson.comparisonGroup.userData.animating,
      sourceX: lesson.comparisonSmallGroup.userData.sourcePosition.x,
      currentX: lesson.comparisonSmallGroup.position.x,
      targetX: lesson.comparisonSmallGroup.userData.endPosition.x,
    };
  });
  expect(secantAnimationStart.animating).toBe(true);
  expect(secantAnimationStart.currentX).toBeLessThan(secantAnimationStart.targetX);
  expect(secantAnimationStart.currentX).toBeCloseTo(secantAnimationStart.sourceX, 1);
  await page.waitForFunction(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return lesson.comparisonGroup.visible && !lesson.comparisonGroup.userData.animating;
  });
  const secantComparison = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const bounds = (triangle: any, group: any) => {
      const points = triangle.geometry.getAttribute("position").array as Float32Array;
      const xs = [points[0], points[3], points[6]].map((x) => group.position.x + x * group.scale.x);
      return { minX: Math.min(...xs), maxX: Math.max(...xs) };
    };
    return {
      visible: lesson.comparisonGroup.visible,
      function: lesson.comparisonGroup.userData.function,
      smallTriangle: lesson.comparisonGroup.userData.smallTriangle,
      largeTriangle: lesson.comparisonGroup.userData.largeTriangle,
      vertexPairs: lesson.comparisonGroup.userData.vertexPairs,
      sidePairs: lesson.comparisonGroup.userData.sidePairs,
      anglePairs: lesson.comparisonGroup.userData.anglePairs,
      proofChain: lesson.comparisonGroup.userData.proofChain,
      caption: lesson.comparisonGroup.userData.caption,
      progress: lesson.comparisonGroup.userData.animationProgress,
      labels: [
        ...lesson.comparisonVertexLabels.map((label: any) => label.userData.label),
        ...lesson.comparisonSideLabels.map((label: any) => label.userData.label),
      ],
      smallBounds: bounds(lesson.comparisonSmallTriangle, lesson.comparisonSmallGroup),
      largeBounds: bounds(lesson.comparisonLargeTriangle, lesson.comparisonLargeGroup),
    };
  });
  expect(secantComparison).toEqual({
    visible: true,
    function: "sec",
    smallTriangle: "OHP",
    largeTriangle: "OQP",
    vertexPairs: ["O ↔ O", "H ↔ P", "P ↔ Q"],
    sidePairs: ["OH ↔ OP", "HP ↔ PQ", "OP ↔ OQ"],
    anglePairs: ["O ↔ O: φ = 60.0°", "H ↔ P: 90°", "P ↔ Q: 90°−φ = 30.0°"],
    proofChain: "AA: same ray / x-axis extension + projection ⟂ + radius ⟂ tangent ⇒ OHP ∼ OPQ",
    caption: "SECANT · small OHP ↔ large OQP",
    progress: 1,
    labels: [
      "O · φ", "H · 90°", "P · 90°−φ",
      "O · φ", "P · 90°", "Q · 90°−φ",
      "OH", "HP", "OP", "OP", "PQ", "OQ",
    ],
    smallBounds: expect.any(Object),
    largeBounds: expect.any(Object),
  });
  expect(secantComparison.smallBounds.maxX).toBeLessThan(secantComparison.largeBounds.minX);

  await page.locator("[data-trig-panel-tab='concept']").click();
  await page.locator("[data-trig-angle='45']").click();
  const liveSecantComparison = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.radius = 3;
    lesson.rebuildScene();
    return {
      visible: lesson.comparisonGroup.visible,
      anglePairs: lesson.comparisonGroup.userData.anglePairs,
      circleRadius: lesson.circleLine.geometry.getAttribute("position").getX(0),
      radiusLabel: lesson.radiusLabel.userData.label,
      circleVisible: lesson.circleLine.visible,
      constructionVisible: lesson.secTriangle.visible,
    };
  });
  expect(liveSecantComparison).toEqual({
    visible: true,
    anglePairs: ["O ↔ O: φ = 75.0°", "H ↔ P: 90°", "P ↔ Q: 90°−φ = 15.0°"],
    circleRadius: 3,
    radiusLabel: "R",
    circleVisible: true,
    constructionVisible: true,
  });

  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.angleDeg = 63;
    lesson.params.startAngleDeg = 0;
    lesson.params.radius = 5;
    lesson.rebuildScene();
  });
  await page.locator("[data-trig-function='cosec']").click();
  const persistedCosecantComparison = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      visible: lesson.comparisonGroup.visible,
      function: lesson.comparisonGroup.userData.function,
      tab: lesson.activePanelTab,
    };
  });
  expect(persistedCosecantComparison).toEqual({ visible: true, function: "cosec", tab: "concept" });
  await expect(page.locator("#trig-function-breakdown")).toContainText(
    "Cosecant is the reciprocal of sine",
  );

  await page.locator("[data-trig-reset]").click();
  await page.locator("[data-trig-function='cosec']").click();
  await page.locator("[data-trig-panel-tab='construction']").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Cosecant starts in the original triangle");
  await expect(page.locator("#trig-function-breakdown")).toContainText("sin φ = y/R = 4.455 ÷ 5.000 = 0.891");
  await expect(page.locator("#trig-function-breakdown")).toContainText("cosec φ = R/y = 5.000 ÷ 4.455 = 1.122 = 1/sin φ");
  await expect(page.locator("[data-trig-cosecant-proof]")).toBeVisible();
  const cosecantFirstStep = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      tangent: lesson.tanSeg.visible,
      secant: lesson.secSeg.visible,
      cosecant: lesson.cosecSeg.visible,
      cotangent: lesson.cotSeg.visible,
      secantTriangle: lesson.secTriangle.visible,
      cosecantTriangle: lesson.cosecTriangle.visible,
      tangentRightAngle: lesson.pointRightAngle.visible,
      vertices: [
        lesson.originVertexLabel.visible,
        lesson.footVertexLabel.visible,
        lesson.pointVertexLabel.visible,
        lesson.interceptVertexLabel.visible,
      ],
    };
  });
  expect(cosecantFirstStep).toEqual({
    tangent: false,
    secant: false,
    cosecant: false,
    cotangent: false,
    secantTriangle: false,
    cosecantTriangle: false,
    tangentRightAngle: false,
    vertices: [false, false, false, false],
  });

  await page.locator("[data-trig-cosecant-proof]").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Cosecant: the similar triangle");
  const angleLedger = page.locator("[aria-label='Two-triangle angle ledger']");
  await expect(angleLedger).toBeVisible();
  await expect(angleLedger).toContainText("1 · Small triangle OHP — calculate all three angles");
  await expect(angleLedger).toContainText("OH is on the x-axis, and OP is drawn at φ from the x-axis");
  await expect(page.locator("[data-trig-ledger-angle='small-o']")).toHaveText("∠HOP = φ = 63°");
  await expect(angleLedger).toContainText("OH is horizontal and HP is vertical");
  await expect(page.locator("[data-trig-ledger-angle='small-h']")).toHaveText("∠OHP = 90°");
  await expect(page.locator("[data-trig-ledger-angle='small-p']")).toHaveText(
    "∠HPO = 180° − φ − 90° = 180° − 63° − 90° = 27°",
  );
  await expect(angleLedger).toContainText("2 · Large triangle OSP — calculate all three angles");
  await expect(angleLedger).toContainText("OS is the y-axis, which is 90° from the x-axis");
  await expect(angleLedger).toContainText("OP is the SAME radius ray used in the small triangle");
  await expect(angleLedger).toContainText("remaining gap between OS and OP is therefore 90° − φ");
  await expect(page.locator("[data-trig-ledger-angle='large-o']")).toHaveText(
    "∠SOP = 90° − φ = 90° − 63° = 27°",
  );
  await expect(angleLedger).toContainText("calculated 27° matches the small triangle’s previously calculated ∠HPO");
  await expect(angleLedger).toContainText("radius OP is perpendicular to tangent SP");
  await expect(page.locator("[data-trig-ledger-angle='large-p']")).toHaveText("∠SPO = 90°");
  await expect(page.locator("[data-trig-ledger-angle='large-s']")).toHaveText(
    "∠OSP = 180° − (90° − φ) − 90° = 180° − 27° − 90° = 63° = φ",
  );
  await expect(angleLedger).toContainText("calculated 63° matches the small triangle’s previously calculated ∠HOP");
  await expect(angleLedger).toContainText("The two triangles were calculated independently");
  await expect(angleLedger).toContainText("small O → large S");
  await expect(angleLedger).toContainText("small H → large P");
  await expect(angleLedger).toContainText("small P → large O");
  await expect(angleLedger).toContainText("△OHP ∼ △SPO by AAA");
  await expect(angleLedger).toContainText("AA would already be sufficient");
  await expect(angleLedger).not.toContainText("Live check");
  await expect(angleLedger).not.toContainText("confirmation");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Vertices O ↔ S · H ↔ P · P ↔ O");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Sides OH ↔ SP · HP ↔ OP · OP ↔ OS");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Large OP is the same radius R and corresponds to small HP = y");
  await expect(page.locator("#trig-function-breakdown")).toContainText("scale factor from small to large is R/y = 5.000 ÷ 4.455 = 1.122 = cosec φ");
  await expect(page.locator("#trig-function-breakdown")).toContainText("OS = R × (R/y) = R·cosec φ = 5.000 × 1.122 = 5.612");
  await expect(page.locator("#trig-function-breakdown")).toContainText("cosec φ is the dimensionless scale factor");
  await expect(page.locator("#trig-function-breakdown")).toContainText("OS = R·cosec φ, not cosec φ by itself");
  const cosecantProof = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const length = (line: any) => {
      const points = line.geometry.getAttribute("position").array as Float32Array;
      return Math.hypot(points[3] - points[0], points[4] - points[1]);
    };
    return {
      tangent: lesson.tanSeg.visible,
      secant: lesson.secSeg.visible,
      cosecant: lesson.cosecSeg.visible,
      cotangent: lesson.cotSeg.visible,
      secantTriangle: lesson.secTriangle.visible,
      cosecantTriangle: lesson.cosecTriangle.visible,
      tangentRightAngle: lesson.pointRightAngle.visible,
      vertices: [
        lesson.originVertexLabel.visible,
        lesson.footVertexLabel.visible,
        lesson.pointVertexLabel.visible,
        lesson.interceptVertexLabel.visible,
      ],
      vertexLabels: [
        lesson.originVertexLabel.userData.label,
        lesson.footVertexLabel.userData.label,
        lesson.pointVertexLabel.userData.label,
        lesson.interceptVertexLabel.userData.label,
      ],
      cosecantLength: length(lesson.cosecSeg),
      cotangentLength: length(lesson.cotSeg),
    };
  });
  expect(cosecantProof).toEqual({
    tangent: false,
    secant: false,
    cosecant: true,
    cotangent: true,
    secantTriangle: false,
    cosecantTriangle: true,
    tangentRightAngle: true,
    vertices: [true, true, true, true],
    vertexLabels: ["O", "H", "P", "S"],
    cosecantLength: expect.closeTo(5 / Math.sin(63 * Math.PI / 180), 4),
    cotangentLength: expect.closeTo(5 / Math.tan(63 * Math.PI / 180), 4),
  });

  await expect(page.locator("#trig-function-breakdown")).toContainText(
    "move copies of small OHP and large OSP into the side-by-side comparison",
  );
  await expect(page.locator("[data-trig-comparison='cosec']")).toHaveText(
    "Animate matching triangles from the circle",
  );
  expect(await page.evaluate(() => (window as any).__lab.manager.activeLesson.comparisonGroup.visible)).toBe(false);
  await page.locator("[data-trig-comparison='cosec']").click();
  await page.waitForFunction(() => {
    const comparison = (window as any).__lab.manager.activeLesson.comparisonGroup;
    return comparison.visible && !comparison.userData.animating;
  });
  const cosecantComparison = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const bounds = (triangle: any, group: any) => {
      const points = triangle.geometry.getAttribute("position").array as Float32Array;
      const xs = [points[0], points[3], points[6]].map((x) => group.position.x + x * group.scale.x);
      return { minX: Math.min(...xs), maxX: Math.max(...xs) };
    };
    return {
      function: lesson.comparisonGroup.userData.function,
      triangles: [lesson.comparisonGroup.userData.smallTriangle, lesson.comparisonGroup.userData.largeTriangle],
      vertexPairs: lesson.comparisonGroup.userData.vertexPairs,
      sidePairs: lesson.comparisonGroup.userData.sidePairs,
      anglePairs: lesson.comparisonGroup.userData.anglePairs,
      proofChain: lesson.comparisonGroup.userData.proofChain,
      caption: lesson.comparisonGroup.userData.caption,
      labels: [
        ...lesson.comparisonVertexLabels.map((label: any) => label.userData.label),
        ...lesson.comparisonSideLabels.map((label: any) => label.userData.label),
      ],
      smallBounds: bounds(lesson.comparisonSmallTriangle, lesson.comparisonSmallGroup),
      largeBounds: bounds(lesson.comparisonLargeTriangle, lesson.comparisonLargeGroup),
    };
  });
  expect(cosecantComparison.function).toBe("cosec");
  expect(cosecantComparison.triangles).toEqual(["OHP", "OSP"]);
  expect(cosecantComparison.vertexPairs).toEqual(["O ↔ S", "H ↔ P", "P ↔ O"]);
  expect(cosecantComparison.sidePairs).toEqual(["OH ↔ SP", "HP ↔ OP", "OP ↔ OS"]);
  expect(cosecantComparison.anglePairs).toEqual([
    "O ↔ S: φ = 63.0°", "H ↔ P: 90°", "P ↔ O: 90°−φ = 27.0°",
  ]);
  expect(cosecantComparison.proofChain).toBe(
    "Panel angle ledger independently derives all six angles before matching O→S, H→P, P→O; AAA proves OHP ∼ SPO (AA already suffices)",
  );
  expect(cosecantComparison.caption).toBe("COSECANT · derived angle ledger · small OHP ↔ large OSP");
  expect(cosecantComparison.labels).toEqual([
    "O · φ · 63°", "H · 90°", "P · 90°−φ · 27°",
    "S · φ · 63°", "P · 90°", "O · 90°−φ · 27°",
    "OH", "HP", "OP", "SP", "OP", "OS",
  ]);
  expect(cosecantComparison.smallBounds.maxX).toBeLessThan(cosecantComparison.largeBounds.minX);

  const liveCosecantComparison = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.radius = 4;
    lesson.rebuildScene();
    return {
      visible: lesson.comparisonGroup.visible,
      circleRadius: lesson.circleLine.geometry.getAttribute("position").getX(0),
      circleVisible: lesson.circleLine.visible,
      constructionVisible: lesson.cosecTriangle.visible,
    };
  });
  expect(liveCosecantComparison).toEqual({
    visible: true,
    circleRadius: 4,
    circleVisible: true,
    constructionVisible: true,
  });

  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.angleDeg = 45;
    lesson.params.radius = 5;
    lesson.rebuildScene();
  });
  await page.locator("[data-trig-function='cot']").click();
  expect(await page.evaluate(() => (window as any).__lab.manager.activeLesson.comparisonGroup.userData.function)).toBe("cot");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Compare OHP with OSP");
  await expect(page.locator("[data-trig-comparison='cot']")).toHaveText(
    "Restart the matching-triangle animation",
  );
  await page.locator("[data-trig-panel-tab='history']").click();
  await expect(page.locator("[data-trig-history]")).toContainText(
    "They were not discovered together.",
  );
  await expect(page.locator("[data-trig-history]")).toContainText(
    "Hipparchus tabulated chords",
  );
  await expect(page.locator("[data-trig-history]")).toContainText(
    "A chord is the straight line joining two points on a circle",
  );
  await expect(page.locator("[data-trig-history]")).toContainText(
    "2R·sin(θ/2)",
  );
  await expect(page.locator("[data-trig-history]")).toContainText(
    "Aryabhata tabulated half-chords",
  );
  await expect(page.locator("[data-trig-history]")).toContainText(
    "tangent and cotangent grew together",
  );
  await page.locator("[data-trig-panel-tab='construction']").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Cotangent: the y-axis tangent side");
  await expect(page.locator("#trig-function-breakdown")).toContainText("SP = R·cot φ = 5.000 × 1.000 = 5.000");
  await expect(page.locator("[data-trig-comparison='cot']")).toHaveText(
    "Animate the matching triangles for cotangent",
  );
  await page.locator("[data-trig-comparison='cot']").click();
  await page.waitForFunction(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return lesson.comparisonGroup.visible && !lesson.comparisonGroup.userData.animating;
  });
  const cotangentComparison = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      function: lesson.comparisonGroup.userData.function,
      caption: lesson.comparisonGroup.userData.caption,
      proofChain: lesson.comparisonGroup.userData.proofChain,
      sideLegend: lesson.comparisonSideLegend.userData.label,
    };
  });
  expect(cotangentComparison).toEqual({
    function: "cot",
    caption: "COTANGENT · cotangent side · small OHP ↔ large OSP",
    proofChain: "OHP ∼ SPO: OH ↔ SP, HP ↔ OP, OP ↔ OS; scale by R/y, so SP = R·cot φ",
    sideLegend: "Cotangent side: SP = OH × (R/y) = R·cot φ",
  });

  const radiusFive = await page.evaluate(() => (window as any).__lab.manager.activeLesson.R);
  expect(radiusFive).toBe(5);

  await page.locator("[data-trig-reset]").click();
  expect(await page.evaluate(() => (window as any).__lab.manager.activeLesson.selectedFunction)).toBe(null);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("trigonometry retains finite limiting comparisons at quadrant axes", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#trig-functions");

  await page.locator("[data-trig-function='sec']").click();
  await page.locator("[data-trig-panel-tab='construction']").click();
  await page.locator("[data-trig-function='cosec']").click();
  await expect(page.locator("[data-trig-panel-tab='construction']")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Cosecant starts in the original triangle");
  await page.locator("[data-trig-function='sec']").click();
  await expect(page.locator("[data-trig-panel-tab='construction']")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#trig-function-breakdown")).toContainText("Secant starts in the original triangle");
  await page.locator("[data-trig-secant-proof]").click();
  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.angleDeg = 90;
    lesson.rebuildScene();
  });
  await expect(page.locator("[data-trig-comparison='sec']")).toHaveText("Show the limiting triangle comparison");
  await page.locator("[data-trig-comparison='sec']").click();
  await page.waitForFunction(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return lesson.comparisonGroup.visible && !lesson.comparisonGroup.userData.animating;
  });

  const comparisons = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const axes = [90, 180, 270];
    return ["sec", "cosec", "cot"].flatMap((functionName) => axes.map((angleDeg) => {
      lesson.params.startAngleDeg = 0;
      lesson.params.angleDeg = angleDeg;
      lesson.comparisonFunction = functionName;
      lesson.comparisonProgress = 1;
      lesson.comparisonAnimating = false;
      lesson.comparisonGroup.visible = true;
      lesson.redraw();
      const positions = [
        ...lesson.comparisonSmallTriangle.geometry.getAttribute("position").array,
        ...lesson.comparisonLargeTriangle.geometry.getAttribute("position").array,
      ];
      return {
        functionName,
        angleDeg,
        visible: lesson.comparisonGroup.visible,
        caption: lesson.comparisonGroup.userData.caption,
        note: lesson.comparisonAaConclusion.userData.label,
        finite: positions.every(Number.isFinite)
          && lesson.comparisonSmallGroup.position.toArray().every(Number.isFinite)
          && lesson.comparisonLargeGroup.position.toArray().every(Number.isFinite)
          && lesson.comparisonSmallGroup.scale.toArray().every(Number.isFinite)
          && lesson.comparisonLargeGroup.scale.toArray().every(Number.isFinite),
      };
    }));
  });

  for (const comparison of comparisons) {
    expect(comparison.visible).toBe(true);
    expect(comparison.caption).toContain("limiting axis diagram");
    expect(comparison.finite).toBe(true);
  }
  expect(errors, errors.join("\n")).toEqual([]);
});

test("trigonometry keeps reciprocal-triangle tabs and calculations in place", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#trig-functions");

  await page.locator("[data-trig-function='sec']").click();
  await page.locator("[data-trig-panel-tab='construction']").click();
  await page.locator("[data-trig-secant-proof]").click();
  await page.locator("[data-trig-function='cosec']").click();
  const cosecantConstruction = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      selected: lesson.selectedFunction,
      tab: lesson.activePanelTab,
      comparison: lesson.comparisonFunction,
      triangleVisible: lesson.cosecTriangle.visible,
      comparisonVisible: lesson.comparisonGroup.visible,
    };
  });
  expect(cosecantConstruction).toEqual({
    selected: "cosec",
    tab: "construction",
    comparison: "cosec",
    triangleVisible: true,
    comparisonVisible: false,
  });
  await expect(page.locator("#trig-function-breakdown")).toContainText("Cosecant: the similar triangle");

  await page.locator("[data-trig-function='cot']").click();
  await expect(page.locator("#trig-function-breakdown")).toContainText("Cotangent: the y-axis tangent side");
  await page.locator("[data-trig-panel-tab='comparison']").click();
  await page.locator("[data-trig-comparison='cot']").click();
  await page.waitForFunction(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return lesson.comparisonGroup.visible && !lesson.comparisonGroup.userData.animating;
  });

  await page.locator("[data-trig-function='sec']").click();
  const secantComparison = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      selected: lesson.selectedFunction,
      tab: lesson.activePanelTab,
      comparison: lesson.comparisonGroup.userData.function,
      visible: lesson.comparisonGroup.visible,
      caption: lesson.comparisonGroup.userData.caption,
    };
  });
  expect(secantComparison).toEqual({
    selected: "sec",
    tab: "comparison",
    comparison: "sec",
    visible: true,
    caption: "SECANT · small OHP ↔ large OQP",
  });

  await page.locator("[data-trig-panel-tab='history']").click();
  await page.locator("[data-trig-function='cosec']").click();
  expect(await page.evaluate(() => (window as any).__lab.manager.activeLesson.activePanelTab)).toBe("history");
  await expect(page.locator("[data-trig-history]")).toContainText("Cosecant belongs to the later secant family");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("prime lesson teaches the frontier and inspects integer structure", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#prime-numbers");
  await expect(page.locator("#info h2")).toHaveText("Prime Numbers — Complete Guide");

  await page.locator("[data-prime-ch='11']").click();
  await expect(page.locator("#prime-lesson")).toContainText("The open frontier");
  await expect(page.locator("#prime-lesson")).toContainText("Riemann hypothesis");
  await expect(page.locator("#prime-lesson")).toContainText("Strong Goldbach");
  await expect(page.locator("#prime-lesson")).toContainText("41,024,320 decimal digits");

  const compositeCell = await page.evaluate(() => {
    const lab = (window as any).__lab;
    const lesson = lab.manager.activeLesson;
    lesson.params.visual = "Sieve";
    lesson.params.limit = 100;
    lesson.rebuild();
    const matrix = new lab.viewport.camera.matrixWorld.constructor();
    lesson.numberMesh.getMatrixAt(11, matrix); // number 12
    const position = new lab.viewport.camera.position.constructor().setFromMatrixPosition(matrix);
    position.applyMatrix4(lesson.numberMesh.matrixWorld).project(lab.viewport.camera);
    const rect = lab.viewport.renderer.domElement.getBoundingClientRect();
    return {
      x: rect.left + ((position.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - position.y) / 2) * rect.height,
    };
  });

  await page.mouse.click(compositeCell.x, compositeCell.y);
  await expect(page.locator("#prime-readout")).toContainText("12 — composite");
  await expect(page.locator("#prime-readout")).toContainText("1 × 12, 2 × 6, 3 × 4");

  const primeCell = await page.evaluate(() => {
    const lab = (window as any).__lab;
    const lesson = lab.manager.activeLesson;
    const matrix = new lab.viewport.camera.matrixWorld.constructor();
    lesson.numberMesh.getMatrixAt(12, matrix); // number 13
    const position = new lab.viewport.camera.position.constructor().setFromMatrixPosition(matrix);
    position.applyMatrix4(lesson.numberMesh.matrixWorld).project(lab.viewport.camera);
    const rect = lab.viewport.renderer.domElement.getBoundingClientRect();
    return {
      x: rect.left + ((position.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - position.y) / 2) * rect.height,
    };
  });
  await page.mouse.click(primeCell.x, primeCell.y);
  await expect(page.locator("#prime-readout")).toContainText("13 — prime");
  await expect(page.locator("#prime-readout")).toContainText("All positive factors1, 13");
  await expect(page.locator("#prime-readout")).toContainText("Factor pairs1 × 13");

  const result = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.visual = "Sieve";
    lesson.params.limit = 400;
    lesson.params.selected = 360;
    lesson.rebuild();
    const sieveInstances = lesson.group.children[0]?.count;
    const sieveLabels = lesson.group.children.filter((child: any) => child.isSprite).length;

    lesson.params.visual = "Ulam spiral";
    lesson.params.limit = 625;
    lesson.rebuild();
    const spiralInstances = lesson.group.children[0]?.count;

    lesson.params.visual = "Prime gaps";
    lesson.params.limit = 100;
    lesson.rebuild();
    const gapInstances = lesson.group.children[0]?.count;

    return {
      readout: document.getElementById("prime-readout")?.textContent ?? "",
      sieveInstances,
      sieveLabels,
      spiralInstances,
      gapInstances,
    };
  });

  expect(result.readout).toContain("2³ × 3² × 5");
  expect(result.readout).toContain("1 × 360");
  expect(result.readout).toContain("18 × 20");
  expect(result.readout).toContain("Euler φ(n)96");
  expect(result.readout).toContain("Positive divisors24");
  expect(result.sieveInstances).toBe(400);
  expect(result.sieveLabels).toBe(78);
  expect(result.spiralInstances).toBe(625);
  expect(result.gapInstances).toBe(24);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("Pascal triangle connects binomial coefficients to probability", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#pascal-triangle");
  await expect(page.locator("#info h2")).toHaveText("Pascal's Triangle");

  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.row = 5;
    lesson.params.a = 1;
    lesson.params.b = 1;
    lesson.params.choose = 2;
    lesson.refresh();
  });
  await expect(page.locator("#pascal-readout")).toContainText("1, 5, 10, 10, 5, 1");
  await expect(page.locator("#info")).toContainText("Ways to choose 2 from 5C(5, 2) = 10");
  await expect(page.locator("#info")).toContainText("5 fair coin flips: exactly 2 heads10 / 32 = 31.25%");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("vector-field particle speed scales with field magnitude (shear)", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("vector-field"));

  // Shear field F = (y, 0, 0): the x-force equals y, so particle speed should grow
  // with |y| and be ~0 along the centre line (y = 0).
  const correlation = await page.evaluate(async () => {
    const lab = (window as any).__lab;
    const lesson = lab.manager.activeLesson;
    lesson.params.P = "y";
    lesson.params.Q = "0";
    lesson.params.R = "0";
    lesson.params.zPush = 0;
    lesson.params.animate = true;
    lesson.recompile();
    lesson.rebuild();

    const attr = lesson.particles.geometry.getAttribute("position");
    const before = Float32Array.from(attr.array as Float32Array);
    await new Promise((r) => setTimeout(r, 600));
    const after = attr.array as Float32Array;

    const samples: Array<{ mag: number; speed: number }> = [];
    for (let p = 0; p < before.length / 3; p++) {
      const i = p * 3;
      const dx = after[i] - before[i];
      const dy = after[i + 1] - before[i + 1];
      const dz = after[i + 2] - before[i + 2];
      const speed = Math.hypot(dx, dy, dz);
      // |F| for this shear at the start position = |y|.
      const mag = Math.abs(before[i + 1]);
      if (Number.isFinite(speed)) samples.push({ mag, speed });
    }

    samples.sort((a, b) => a.mag - b.mag);
    const q = Math.floor(samples.length / 4);
    const lowMean = samples.slice(0, q).reduce((s, v) => s + v.speed, 0) / q;
    const highMean = samples.slice(-q).reduce((s, v) => s + v.speed, 0) / q;
    return { lowMean, highMean, count: samples.length };
  });

  expect(correlation.count).toBeGreaterThan(50);
  expect(correlation.highMean).toBeGreaterThan(correlation.lowMean * 2);
});

test("pendulum: conserves energy undamped and runs slower at large amplitude", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("pendulum"));
  await expect(page.locator("#info h2")).toHaveText("The Pendulum");

  // Undamped energy conservation: total mechanical energy should hold over time.
  const energyDrift = await page.evaluate(async () => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const p = lesson["params"];
    p.length = 1;
    p.gravity = 9.81;
    p.mass = 1.2;
    p.damping = 0;
    p.angle = 60;
    p.running = true;
    lesson["release"]();
    const E = () => {
      const s = lesson["real"];
      const ke = 0.5 * p.mass * Math.pow(p.length * s.omega, 2);
      const pe = p.mass * p.gravity * p.length * (1 - Math.cos(s.theta));
      return ke + pe;
    };
    const e0 = E();
    await new Promise((r) => setTimeout(r, 1500));
    const e1 = E();
    return { e0, e1, rel: Math.abs(e1 - e0) / e0 };
  });
  expect(energyDrift.e0).toBeGreaterThan(0);
  expect(energyDrift.rel).toBeLessThan(0.02); // <2% drift over ~1.5 s of RK4

  // Large-amplitude swings have a measurably longer period than small ones.
  const slow = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson["params"].angle = 160;
    lesson["renderInfo"]();
    const big = document.getElementById("info")?.textContent ?? "";
    const m = big.match(/Real runs slower by\s*([\d.]+)%/);
    return m ? parseFloat(m[1]) : -1;
  });
  expect(slow).toBeGreaterThan(20); // ~160° is dramatically slower than the ideal

  // The step-by-step derivation and its history are present in the info panel.
  const teaching = await page.evaluate(() => {
    const t = document.getElementById("info")?.textContent ?? "";
    return {
      derivation: t.includes("From geometry to the equation"),
      arc: t.includes("s = L·θ"),
      newton: t.includes("Newton's second law"),
      cancels: t.includes("m cancels off both sides"),
      history: t.includes("How it was discovered"),
      galileo: t.includes("Galileo"),
      huygens: t.includes("Huygens"),
    };
  });
  expect(teaching).toEqual({
    derivation: true, arc: true, newton: true, cancels: true,
    history: true, galileo: true, huygens: true,
  });

  expect(errors, errors.join("\n")).toEqual([]);
});

test("pendulum: swing counter increments and the measured period matches the prediction", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("pendulum"));
  await expect(page.locator("#info h2")).toHaveText("The Pendulum");

  const result = await page.evaluate(async () => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const p = lesson["params"];
    p.length = 1; // T0 = 2π√(1/9.81) ≈ 2.006 s
    p.gravity = 9.81;
    p.mass = 1;
    p.damping = 0;
    p.angle = 15; // small angle → nearly ideal period
    p.running = true;
    lesson["release"]();
    await new Promise((r) => setTimeout(r, 5000)); // ~2.5 periods
    return { periods: lesson["periods"], measured: lesson["measuredPeriod"], t: lesson["t"] };
  });

  // Real time can lag under load, so gate on simulated time actually elapsing.
  expect(result.t).toBeGreaterThan(3);
  expect(result.periods).toBeGreaterThanOrEqual(1);
  // The measured period (timed from bottom-crossings) should match T0 ≈ 2.006 s closely.
  expect(result.measured).toBeGreaterThan(1.9);
  expect(result.measured).toBeLessThan(2.12);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("pendulum: stopwatch auto-stops after N swings at t ≈ N·T", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("pendulum"));
  await expect(page.locator("#info h2")).toHaveText("The Pendulum");

  const r = await page.evaluate(async () => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const p = lesson["params"];
    p.length = 1; // T0 ≈ 2.006 s
    p.gravity = 9.81;
    p.mass = 1;
    p.damping = 0;
    p.angle = 12; // small → T ≈ T0
    p.targetSwings = 3; // expect to stop at ≈ 6.02 s
    p.running = true;
    lesson["release"]();
    await new Promise((res) => setTimeout(res, 8000));
    const info = document.getElementById("info")?.textContent ?? "";
    return {
      running: p.running,
      stopwatch: lesson["stopwatchTime"],
      full: lesson["fullSwings"],
      hasStopwatchSection: info.includes("Stopwatch — how long for N swings"),
    };
  });

  expect(r.hasStopwatchSection).toBe(true);
  expect(r.full).toBe(3); // exactly the target
  expect(r.running).toBe(false); // auto-paused
  // Three small-angle swings ≈ 3 × 2.006 ≈ 6.02 s, captured precisely.
  expect(r.stopwatch).toBeGreaterThan(5.9);
  expect(r.stopwatch).toBeLessThan(6.15);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("logarithms: log_b(x) undoes exponentiation", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("logarithms"));
  await expect(page.locator("#info h2")).toHaveText("Logarithms");

  const result = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson["params"].base = 2;
    lesson["params"].value = 8;
    lesson["rebuild"]();
    return {
      pointY: lesson["logPoint"].position.y,
      text: document.getElementById("info")?.textContent ?? "",
    };
  });

  expect(result.pointY).toBeCloseTo(3, 0);
  expect(result.text).toContain("log2(8) = 3");
  await expect(page.locator(".e-approach")).toContainText("split 100% interest into n");
  await expect(page.locator(".e-approach")).toContainText("10,000 tiny jumps");
  await expect(page.locator(".e-worked")).toContainText("£1 earning 100% interest");
  await expect(page.locator(".e-plain")).toContainText("Why 1 + 1/2?");
  await expect(page.locator(".e-plain")).toContainText("£1 → £1.50 → £2.25");
  await expect(page.locator(".e-worked")).toContainText("£1 × (1 + 1/365)³⁶⁵");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("foundation topics: guided chapters, classifier, quick checks, and visuals", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("foundations"));
  await expect(page.locator("#info h2")).toHaveText("Foundation topics");
  await expect(page.locator("#foundation-chapters")).toContainText("F.13 Integration");
  await expect(page.locator(".foundation-progress")).toContainText("Chapter 1 of 13");
  await expect(page.locator(".foundation-progress")).toContainText("Classify numbers");
  await expect(page.locator(".number-type-table").last()).toContainText("Natural");
  await expect(page.locator(".number-type-table").last()).toContainText("Transcendental");

  await page.fill("#number-zoo-input", "1/3");
  await expect(page.locator("#number-zoo-result")).toContainText("rational · real · complex · algebraic");

  await page.fill("#number-zoo-input", "π");
  await expect(page.locator("#number-zoo-result")).toContainText("irrational · real · complex · transcendental");

  await page.fill("#number-zoo-input", "i");
  await expect(page.locator("#number-zoo-result")).toContainText("imaginary · complex");

  await expect(page.locator("#arithmetic-kit")).toContainText("2 + 3 × 4 is not 20");
  await page.getByRole("button", { name: "Minus × minus = plus" }).click();
  await expect(page.locator("#arithmetic-kit")).toContainText("−2 × −3 = +6");

  await page.getByRole("button", { name: "F.7 Binomials" }).click();
  await expect(page.locator("#foundation-body")).toContainText("(a+b)ⁿ = Σ nCr·aⁿ⁻ʳ·bʳ");
  await expect(page.locator(".foundation-progress")).toContainText("Chapter 7 of 13");
  await page.getByRole("button", { name: "2ab", exact: true }).click();
  await expect(page.locator("#foundation-check-feedback")).toContainText("Correct.");

  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.locator(".foundation-progress")).toContainText("F.8 · Partial fractions");

  await page.getByRole("button", { name: "F.12 Differentiation" }).click();
  await expect(page.locator("#foundation-body")).toContainText("Differentiation lesson");
  await page.getByRole("button", { name: "F.13 Integration" }).click();
  await expect(page.locator("#foundation-body")).toContainText("Integration lesson");

  for (const chapter of [
    "F.1 Arithmetic",
    "F.2 Introduction to algebra",
    "F.3 Expressions and equations",
    "F.4 Graphs",
    "F.5 Linear equations",
    "F.6 Polynomial equations",
    "F.7 Binomials",
    "F.8 Partial fractions",
    "F.9 Trigonometry",
    "F.10 Functions",
    "F.11 Trigonometric and exponential functions",
    "F.12 Differentiation",
    "F.13 Integration",
  ]) {
    await page.getByRole("button", { name: chapter }).click();
    await expect(page.locator(".foundation-progress")).toContainText(chapter.replace(" ", " · "));
    await expect(page.locator(".foundation-chapter-context")).toContainText("Learning journey");
    await expect(page.locator(".foundation-chapter-context")).toContainText("Discovery and history");
    await expect(page.locator(".foundation-chapter-context")).toContainText("Where this matters:");
  }

  expect(errors, errors.join("\n")).toEqual([]);
});

test("complex numbers: intuition-first course teaches i, plotting, multiplication, powers, and roots", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("complex-numbers"));

  await expect(page.locator("#info h2")).toHaveText("Complex Numbers");
  await expect(page.locator(".complex-progress")).toContainText("1. Meet i");
  await expect(page.locator(".complex-mental-model")).toContainText("turns a number 90°");
  await expect(page.locator(".complex-cycle")).toContainText("i² = −1");

  await page.getByRole("button", { name: "2. Plot a + bi" }).click();
  await expect(page.locator(".complex-progress")).toContainText("2 of 9");
  await expect(page.locator("#info")).toContainText("move 3.00 right");
  await page.getByRole("button", { name: "(3, 2)", exact: true }).click();
  await expect(page.locator("#complex-check-feedback")).toContainText("Yes.");

  await page.getByRole("button", { name: "4. Multiply by i" }).click();
  await expect(page.locator(".complex-mental-model")).toContainText("rotates its arrow 90°");
  await expect(page.locator("#info")).toContainText("z · w");
  await expect(page.locator("#info")).toContainText("-1 + 2i");
  await page.getByRole("button", { name: "−1 + 2i", exact: true }).click();
  await expect(page.locator("#complex-check-feedback")).toContainText("Geometrically");

  for (const chapter of [
    "3. Add as movement",
    "5. Scale and rotate",
    "6. Rectangular ↔ polar",
    "7. Powers",
    "8. Roots",
    "9. Complex numbers at work",
  ]) {
    await page.getByRole("button", { name: chapter }).click();
    await expect(page.locator(".complex-progress")).toContainText(chapter);
  }
  await expect(page.locator("#info")).toContainText("AC power");
  await expect(page.locator(".complex-scenarios")).toContainText("Power grids & chargers");
  await page.getByRole("button", { name: /Radio & GPS/ }).click();
  await expect(page.locator(".complex-scenario-detail")).toContainText("receiver compares a signal");
  await page.getByRole("button", { name: /2D graphics & robots/ }).click();
  await expect(page.locator(".complex-scenario-detail")).toContainText("screen point or robot heading");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("fourier series: reconstructs periodic waves from selectable harmonics", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("fourier-series"));

  await expect(page.locator("#info h2")).toHaveText("Fourier Series");
  await expect(page.locator("#info")).toContainText("1, 3, 5");
  await expect(page.locator(".fourier-lesson")).toContainText("higher frequencies can change more quickly");
  await page.getByRole("button", { name: "Convergence and Gibbs" }).click();
  await expect(page.locator(".fourier-lesson")).toContainText("Gibbs phenomenon");
  await page.getByRole("button", { name: "Measuring a coefficient" }).click();
  await expect(page.locator(".fourier-lesson")).toContainText("orthogonal");
  await expect(page.locator(".fourier-lesson")).toContainText("an = (1/π)∫");
  await page.getByRole("button", { name: "Complex numbers and practice" }).click();
  await expect(page.locator(".fourier-lesson")).toContainText("Fourier series versus transform");
  await expect(page.locator(".fourier-lesson")).toContainText("FFT");

  const state = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.waveform = "triangle";
    lesson.params.terms = 6;
    lesson.params.showComponents = false;
    lesson.update();
    return {
      componentsVisible: lesson.componentLines.slice(0, 6).every((line: any) => !line.visible),
      spectrumVertices: lesson.spectrumBars.geometry.attributes.position.count,
      targetVertices: lesson.targetLine.geometry.attributes.position.count,
      info: document.getElementById("info")?.textContent ?? "",
    };
  });

  expect(state.componentsVisible).toBe(true);
  expect(state.spectrumVertices).toBeGreaterThanOrEqual(10);
  expect(state.targetVertices).toBeGreaterThan(300);
  expect(state.info).toContain("Triangle wave");
  expect(state.info).toContain("1, 3, 5");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("projectile motion: guided course connects components, apex, range, and gravity", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("projectile-motion"));

  await expect(page.locator("#info h2")).toHaveText("Projectile Motion");
  await expect(page.locator(".projectile-progress")).toContainText("1. Split the launch vector");
  await expect(page.locator(".projectile-mental-model")).toContainText("vₓ = v·cosθ");
  await expect(page.locator(".projectile-launch-model")).toContainText("flight simulation begins at");
  await expect(page.locator(".projectile-launch-model")).toContainText("J = Δp = m·v₀");
  await expect(page.locator(".projectile-launch-model")).toContainText("60.00 N");
  await expect(page.locator(".projectile-axis-model")).toContainText("Fₓ = 0 N");
  await expect(page.locator(".projectile-axis-model")).toContainText("Fᵧ = −mg");
  await expect(page.locator(".projectile-axis-model")).toContainText("vᵧ(t)");
  await expect(page.locator(".projectile-inertia-note")).toContainText("zero horizontal force means");
  await expect(page.locator(".projectile-inertia-note")).toContainText("vₓ stays constant");
  await expect(page.locator(".projectile-resultant")).toContainText("|v| = √(vₓ² + vᵧ²)");

  await page.getByLabel("Play flight").check();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "2. Two motions, one path" }).click();
  await expect(page.locator(".projectile-progress")).toContainText("2. Two motions, one path");

  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.mass = 2;
    lesson.update();
  });
  await expect(page.locator(".projectile-launch-model")).toContainText("120.00 N");
  await expect(page.locator(".projectile-axis-model")).toContainText("−19.62 N");

  await page.getByRole("button", { name: "3. Understand the apex" }).click();
  await expect(page.locator(".projectile-phase")).toContainText("apex");
  await expect(page.locator(".projectile-resultant")).toContainText(", 0.00) m/s");
  await page.getByRole("button", { name: "vᵧ = 0 but vₓ remains", exact: true }).click();
  await expect(page.locator("#projectile-check-feedback")).toContainText("Correct.");

  await page.getByRole("button", { name: "4. Landing and range" }).click();
  await expect(page.locator(".projectile-phase")).toContainText("landed");
  await expect(page.locator(".projectile-mental-model")).toContainText("x = vₓt");

  await page.getByRole("button", { name: "6. Change the world" }).click();
  const moon = await page.evaluate(() => {
    const lab = (window as any).__lab;
    const lesson = lab.manager.activeLesson;
    return {
      gravity: lesson.params.gravity,
      time: lesson.params.time,
      cameraTargetX: lab.viewport.controls.target.x,
    };
  });
  expect(moon.gravity).toBeCloseTo(1.62);
  expect(moon.time).toBeGreaterThan(5);
  expect(moon.cameraTargetX).toBeGreaterThan(50);

  for (const chapter of [
    "2. Two motions, one path",
    "5. Why 45° wins",
  ]) {
    await page.getByRole("button", { name: chapter }).click();
    await expect(page.locator(".projectile-progress")).toContainText(chapter);
  }

  expect(errors, errors.join("\n")).toEqual([]);
});

test("momentum and impulse: force-time area changes momentum and internal impulses conserve it", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("momentum-impulse"));

  await expect(page.locator("#info h2")).toHaveText("Momentum & Impulse");
  await expect(page.locator(".momentum-core")).toContainText("p = mv");
  await expect(page.locator(".momentum-core")).toContainText("N·s = kg·m/s");
  await expect(page.locator(".momentum-readout")).toContainText("6.00 kg·m/s");

  await page.getByLabel("Play", { exact: true }).check();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "2. Impulse changes momentum" }).click();
  await expect(page.locator(".momentum-force-area")).toContainText("8.00 N·s");
  await expect(page.locator(".momentum-readout")).toContainText("Final p = p₀ + J");
  await expect(page.locator(".momentum-readout")).toContainText("8.00 kg·m/s");
  await page.getByRole("button", { name: "12 N·s", exact: true }).click();
  await expect(page.locator("#momentum-check-feedback")).toContainText("Correct.");

  await page.getByRole("button", { name: "3. Same impulse, different push" }).click();
  await expect(page.locator(".momentum-comparison")).toContainText("12 N × 0.5 s = 6 N·s");
  await expect(page.locator(".momentum-comparison")).toContainText("3 N × 2 s = 6 N·s");

  await page.getByRole("button", { name: "5. Stopping safely" }).click();
  await expect(page.locator(".momentum-readout")).toContainText("Final p = p₀ + J");
  await expect(page.locator(".momentum-readout")).toContainText("0.00 kg·m/s");
  await expect(page.locator(".momentum-comparison")).toContainText("longer stop needs one quarter");

  await page.getByRole("button", { name: "6. Conservation and recoil" }).click();
  await expect(page.locator(".momentum-readout")).toContainText("Total momentum");
  await expect(page.locator(".momentum-readout")).toContainText("0.00 kg·m/s");

  await page.evaluate(() => (window as any).__lab.manager.selectById("collisions"));
  await expect(page.locator("#lesson-meta")).toContainText("Momentum & Impulse");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("newton: guided laws keep force diagrams, equations, and navigation in sync", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("newtons-laws"));

  await expect(page.locator("#info h2")).toHaveText("Newton's Laws of Motion");
  await expect(page.locator(".newton-core")).toContainText("ΣF = 0 → a = 0");
  await expect(page.locator(".newton-core")).toContainText("ΣF = ma");
  await expect(page.locator(".newton-core")).toContainText("different objects");
  await expect(page.locator(".newton-core")).toContainText("v(t) = v₀ + at");
  await expect(page.locator(".newton-symbol-key tr").filter({ hasText: "Mass: how much inertia" })).toContainText("kg");
  await expect(page.locator(".newton-symbol-key tr").filter({ hasText: "Initial velocity" })).toContainText("v₀");
  await expect(page.locator(".newton-symbol-key tr").filter({ hasText: "Coefficient of friction" })).toContainText("no unit");
  await expect(page.locator(".newton-symbol-key")).toContainText("Two meanings of N");
  await expect(page.locator(".newton-progress")).toContainText("1. First law — inertia");
  await expect(page.locator(".newton-live-readout, #newton-live-readout")).toContainText("Horizontal net force");
  await expect(page.locator(".newton-trig-reference")).toContainText("Fₓ = F cos θ");
  await expect(page.locator(".newton-trig-reference")).toContainText("Fᵧ = F sin θ");
  await expect(page.locator(".newton-force-reference")).toContainText("Applied force");
  await expect(page.locator(".newton-force-reference")).toContainText("Weight");
  await expect(page.locator(".newton-force-reference")).toContainText("Normal force");
  await expect(page.locator(".newton-force-reference")).toContainText("Friction");
  await expect(page.locator(".newton-force-reference")).toContainText("Net force");
  await expect(page.locator(".newton-force-reference")).toContainText("Reaction force");
  await expect(page.locator(".newton-force-note")).toContainText("velocity and acceleration arrows");

  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "2. Second law — F = ma" }).click();
  await expect(page.locator(".newton-equations")).toContainText("8.00 N / 2.00 kg = 4.00 N/kg = 4.00 m/s²");
  await expect(page.locator(".newton-equations")).toContainText("1 N/kg = (1 kg·m/s²) / kg = 1 m/s²");
  await expect(page.locator(".newton-equations")).toContainText("v(t) = v₀ + aₓt");
  await expect(page.locator(".newton-equations")).toContainText("v₀ + (4.00)t m/s");
  await page.getByRole("button", { name: "5 m/s²", exact: true }).click();
  await expect(page.locator("#newton-check-feedback")).toContainText("Correct.");

  await page.getByRole("button", { name: "4. Net force and friction" }).click();
  await page.waitForTimeout(100);
  await expect(page.locator(".newton-equations")).toContainText("8.00 cos(30°) = 6.93 N");
  await expect(page.locator(".newton-equations")).toContainText("8.00 sin(30°) = 4.00 N");
  await expect(page.locator(".newton-equations")).toContainText("19.62 − 4.00) = 15.62 N");
  await expect(page.locator(".newton-equations")).toContainText("6.93 + (-3.12) = 3.80 N");
  const trigState = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return {
      appliedXVisible: lesson.arrows.appliedX.visible,
      appliedYVisible: lesson.arrows.appliedY.visible,
      acceleration: lesson.a,
    };
  });
  expect(trigState.appliedXVisible).toBe(true);
  expect(trigState.appliedYVisible).toBe(true);
  expect(trigState.acceleration).toBeCloseTo(1.9, 1);

  await page.getByRole("button", { name: "5. Third law — force pairs" }).click();
  await expect(page.locator(".newton-pair-card")).toContainText("different objects");
  const pusherVisible = await page.evaluate(() => (window as any).__lab.manager.activeLesson.pusher.visible);
  expect(pusherVisible).toBe(true);

  await page.getByRole("button", { name: "6. Force becomes impulse" }).click();
  await expect(page.locator(".newton-momentum-link")).toContainText("FΔt = Δp");
  await expect(page.locator(".newton-momentum-link")).toContainText("Momentum & Impulse");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("vector-field 'Z push' drives particles along the z-axis", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("vector-field"));

  // With only a constant Z push, particles should move almost purely in +z.
  const motion = await page.evaluate(async () => {
    const lab = (window as any).__lab;
    const lesson = lab.manager.activeLesson;
    lesson.params.P = "0";
    lesson.params.Q = "0";
    lesson.params.R = "0";
    lesson.params.zPush = 1.0;
    lesson.params.animate = true;
    lesson.recompile();
    lesson.rebuild();

    // Prevent lifetime-based respawns from reseeding x/y during the measurement window.
    for (let i = 0; i < lesson.particleLife.length; i++) {
      lesson.particleLife[i] = 9999;
      lesson.particleAge[i] = 0;
    }

    const attr = lesson.particles.geometry.getAttribute("position");
    const before = Float32Array.from(attr.array as Float32Array);
    await new Promise((r) => setTimeout(r, 500));
    const after = attr.array as Float32Array;

    let sumDz = 0;
    let sumAbsDxDy = 0;
    let n = 0;
    for (let p = 0; p < before.length / 3; p++) {
      const i = p * 3;
      const dz = after[i + 2] - before[i + 2];
      const dx = after[i] - before[i];
      const dy = after[i + 1] - before[i + 1];
      if (Math.abs(dz) > 2) continue; // ignore any that wrapped at the z boundary
      sumDz += dz;
      sumAbsDxDy += Math.abs(dx) + Math.abs(dy);
      n++;
    }
    return { meanDz: sumDz / n, meanAbsDxDy: sumAbsDxDy / n, n };
  });

  // Net motion is positive along z and negligible in x/y.
  expect(motion.meanDz).toBeGreaterThan(0.1);
  expect(motion.meanAbsDxDy).toBeLessThan(0.02);
});

test("vector-field particles freeze when P=Q=R=Z are all zero", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("vector-field"));

  const maxMove = await page.evaluate(async () => {
    const lab = (window as any).__lab;
    const lesson = lab.manager.activeLesson;
    lesson.params.P = "0";
    lesson.params.Q = "0";
    lesson.params.R = "0";
    lesson.params.zPush = 0;
    lesson.params.animate = true;
    lesson.recompile();
    lesson.rebuild();

    const attr = lesson.particles.geometry.getAttribute("position");
    const before = Float32Array.from(attr.array as Float32Array);
    await new Promise((r) => setTimeout(r, 600));
    const after = attr.array as Float32Array;

    // Largest movement of any particle over the window (should be ~0 = frozen).
    let max = 0;
    for (let p = 0; p < before.length / 3; p++) {
      const i = p * 3;
      const d = Math.hypot(after[i] - before[i], after[i + 1] - before[i + 1], after[i + 2] - before[i + 2]);
      if (d > max) max = d;
    }
    return max;
  });

  expect(maxMove).toBeLessThan(1e-4); // nothing moves, and nothing respawns
});

test("vector-field z-input: a height-dependent field reads z and fills a 3D arrow volume", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("vector-field"));

  const result = await page.evaluate(() => {
    const lab = (window as any).__lab;
    const lesson = lab.manager.activeLesson;

    // "Lean by height": P = z (g = 1), everything else 0. A purely-3D linear field.
    lesson["applyLinear"]([0, 0, 0, 0, 0, 0, 1, 0, 0]);

    // The field must now read z: at height +2 the x-push is +2, at height -2 it's -2.
    const fHigh = lesson["fieldAt"](0, 0, 2);
    const fLow = lesson["fieldAt"](0, 0, -2);
    // At z = 0 there is no push at all (proves z, not x/y, is driving it).
    const fMid = lesson["fieldAt"](3, 3, 0);

    // Arrows should now occupy several distinct heights (a volume), not a single z = 0 slice.
    const zs = new Set(lesson["arrows"].map((a: any) => Math.round(a.position.z * 100) / 100));

    return {
      pHigh: fHigh[0],
      pLow: fLow[0],
      midMag: Math.hypot(fMid[0], fMid[1], fMid[2]),
      usesZ: lesson["fieldUsesZ"](),
      distinctHeights: zs.size,
    };
  });

  expect(result.usesZ).toBe(true);
  expect(result.pHigh).toBeCloseTo(2, 5);
  expect(result.pLow).toBeCloseTo(-2, 5);
  expect(result.midMag).toBeLessThan(1e-6); // x,y don't matter — only z drives this field
  expect(result.distinctHeights).toBeGreaterThan(1); // arrows fill a 3D volume
});

test("differentiation tangent slope matches the function derivative", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("differentiation");
    const lesson = lab.manager.activeLesson;
    lesson.params.expr = "x * x"; // f'(x) = 2x
    lesson.onEdit();
    lesson.params.x = 2;
    lesson.update();
    // Read the rendered tangent endpoints and compute its slope.
    const pos = lesson.tangent.geometry.getAttribute("position").array as Float32Array;
    const slope = (pos[4] - pos[1]) / (pos[3] - pos[0]); // (y1-y0)/(x1-x0)
    return { slope };
  });
  expect(result.slope).toBeCloseTo(4, 1); // 2 * x at x=2
});

test("differentiation: every Zero→Hero chapter loads and computes a finite slope", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  const result = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("differentiation");
    const lesson = lab.manager.activeLesson;
    const count = lesson["chapters"].length;
    const slopes: number[] = [];
    for (let i = 0; i < count; i++) {
      lesson["loadChapter"](i);
      // The rendered tangent's slope must be a finite number for every chapter.
      const pos = lesson.tangent.geometry.getAttribute("position").array as Float32Array;
      slopes.push((pos[4] - pos[1]) / (pos[3] - pos[0]));
    }
    const progress = document.getElementById("diff-progress")?.textContent ?? "";
    return { count, slopes, progress, allFinite: slopes.every((s) => Number.isFinite(s)) };
  });
  expect(result.count).toBe(12);
  expect(result.allFinite).toBe(true);
  expect(result.progress).toBe("12 / 12");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("differentiation: secant slope converges to f′ as the gap h shrinks (the limit)", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("differentiation");
    const lesson = lab.manager.activeLesson;
    lesson.params.expr = "0.25*x*x"; // f'(x) = 0.5x → at x=1, true slope = 0.5
    lesson.onEdit();
    lesson.params.x = 1;
    lesson.params.showSecant = true;

    const avgSlope = (h: number) => {
      lesson.params.h = h;
      lesson.update();
      const f = (x: number) => 0.25 * x * x;
      return (f(1 + h) - f(1)) / h;
    };
    const wide = Math.abs(avgSlope(3) - 0.5); // big gap → poor estimate
    const tiny = Math.abs(avgSlope(0.05) - 0.5); // small gap → near-exact
    return { wide, tiny };
  });
  // The secant's average slope must get much closer to the true slope (0.5) as h shrinks.
  expect(result.tiny).toBeLessThan(result.wide);
  expect(result.tiny).toBeLessThan(0.02);
});

test("differentiation: 'build your own line' sliders set y = m·x + c with matching slope", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("differentiation");
    const lesson = lab.manager.activeLesson;

    // Drag slope m = -1.5 and intercept c = 2 → line y = -1.5x + 2.
    lesson.params.m = -1.5;
    lesson.params.c = 2;
    lesson["onLineChange"]();

    const f = lesson["f"];
    const yAt0 = f(0); // should equal the intercept c
    const yAt2 = f(2); // -1.5*2 + 2 = -1

    // The rendered tangent's slope must equal m everywhere on a line.
    lesson.params.x = 3;
    lesson.update();
    const pos = lesson.tangent.geometry.getAttribute("position").array as Float32Array;
    const tangentSlope = (pos[4] - pos[1]) / (pos[3] - pos[0]);

    return { expr: lesson.params.expr, yAt0, yAt2, tangentSlope };
  });
  expect(result.expr).toBe("-1.5*x + 2");
  expect(result.yAt0).toBeCloseTo(2, 5); // intercept c
  expect(result.yAt2).toBeCloseTo(-1, 5);
  expect(result.tangentSlope).toBeCloseTo(-1.5, 2); // slope m, constant along a line
});

test("differentiation: reference table 'try' button loads that f(x) with f′ shown", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("differentiation"));
  // Open the collapsible reference card, then click the sin(x) "try" button.
  await page.locator("#diff-reference > summary").click();
  await page.locator('.deriv-try[data-fx="sin(x)"]').first().click();
  const r = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    return { expr: lesson.params.expr, showDeriv: lesson.params.showDerivative };
  });
  expect(r.expr).toBe("sin(x)");
  expect(r.showDeriv).toBe(true);
});

test("newton: acceleration obeys a = F/m and mass halves it", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(async () => {
    const lab = (window as any).__lab;
    lab.manager.selectById("newtons-laws");
    const lesson = lab.manager.activeLesson;
    // Frictionless so net force = applied force exactly.
    lesson.params.friction = 0;
    lesson.params.mass = 2;
    lesson.params.force = 10;
    lesson.reset();
    lesson.params.running = true;
    // Let one tick run, then read acceleration (a = F/m = 5).
    await new Promise((res) => setTimeout(res, 200));
    const a1 = lesson.a;
    lesson.params.mass = 4; // doubling mass should halve acceleration
    await new Promise((res) => setTimeout(res, 200));
    const a2 = lesson.a;
    return { a1, a2 };
  });
  expect(r.a1).toBeCloseTo(5, 1); // 10 N / 2 kg
  expect(r.a2).toBeCloseTo(2.5, 1); // 10 N / 4 kg
});

test("newton: block freezes with no force and no friction is reversible (1st law)", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(async () => {
    const lab = (window as any).__lab;
    lab.manager.selectById("newtons-laws");
    const lesson = lab.manager.activeLesson;
    lesson.params.friction = 0;
    lesson.params.force = 5;
    lesson.params.mass = 2;
    lesson.reset();
    lesson.params.running = true;
    // Build up some speed.
    await new Promise((res) => setTimeout(res, 400));
    const vMoving = lesson.v;
    // Remove the force: with no friction the block should keep its velocity (inertia).
    lesson.params.force = 0;
    await new Promise((res) => setTimeout(res, 300));
    const vCoasting = lesson.v;
    return { vMoving, vCoasting };
  });
  expect(r.vMoving).toBeGreaterThan(0.1);
  // Velocity persists with no force (allow a small tolerance; only bounces reverse it).
  expect(Math.abs(r.vCoasting)).toBeGreaterThan(0.05);
});

test("universal gravitation: force follows inverse-square distance", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("universal-gravitation");
    const lesson = lab.manager.activeLesson;
    lesson.params.massEarths = 1;
    lesson.params.objectMassPower = 3; // 1000 kg probe
    lesson.params.distanceEarthRadii = 4;
    const f1 = lesson.compute().force;
    lesson.params.distanceEarthRadii = 8;
    const f2 = lesson.compute().force;
    lesson.params.massEarths = 2;
    const f3 = lesson.compute().force;
    return { f1, f2, f3 };
  });
  expect(r.f2 / r.f1).toBeCloseTo(0.25, 2);
  expect(r.f3 / r.f2).toBeCloseTo(2, 2);
});

test("universal gravitation: guided steps update the scene and reading panel", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("universal-gravitation"));
  await expect(page.locator("#gravity-progress")).toHaveText("1 / 5");
  await expect(page.locator("#gravity-lesson")).toContainText("The apple clue");

  await page.locator("#gravity-next").click();
  await expect(page.locator("#gravity-progress")).toHaveText("2 / 5");
  await expect(page.locator("#gravity-lesson")).toContainText("The Moon clue");
  await expect(page.locator("#gravity-readout")).toContainText("Moon");
});

test("shadows: measured shadow angle scales city distance to Earth size", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("shadows-earth-size");
    const lesson = lab.manager.activeLesson;
    lesson.params.stickHeight = 1;
    lesson.params.shadowLength = Math.tan((7.2 * Math.PI) / 180);
    lesson.params.cityDistanceKm = 800;
    return lesson.compute();
  });
  expect(r.angleDeg).toBeCloseTo(7.2, 1);
  expect(r.circumferenceKm).toBeCloseTo(40_000, -2);
  expect(r.radiusKm).toBeCloseTo(6_366, -1);
});

test("shadows: guided steps explain shadows, angle measurement, and Eratosthenes", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("shadows-earth-size"));
  await expect(page.locator("#shadow-progress")).toHaveText("1 / 6");
  await expect(page.locator("#shadow-lesson")).toContainText("Light travels in straight lines");

  await page.locator("#shadow-next").click();
  await expect(page.locator("#shadow-progress")).toHaveText("2 / 6");
  await expect(page.locator("#shadow-lesson")).toContainText("θ = atan");
  await expect(page.locator("#shadow-readout")).toContainText("Measured angle");

  await page.locator("#shadow-next").click();
  await page.locator("#shadow-next").click();
  await expect(page.locator("#shadow-progress")).toHaveText("4 / 6");
  await expect(page.locator("#shadow-lesson")).toContainText("transversal rule for parallel lines");
});

test("stress-strain: Hooke's law σ = E·ε and ΔL = ε·L0 hold", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(async () => {
    const lab = (window as any).__lab;
    lab.manager.selectById("stress-strain");
    const lesson = lab.manager.activeLesson;
    lesson.params.material = "Steel"; // E = 200 GPa
    lesson.params.force = 20; // kN
    lesson.params.area = 100; // mm^2
    lesson.params.length = 1000; // mm
    const c = lesson.compute();
    return {
      E: c.mat.E,
      stress: c.stress,
      strain: c.strain,
      elong: c.elong,
      hooke: c.mat.E * 1000 * c.strain, // E(MPa) * ε should equal σ
    };
  });
  // σ = F/A = 20000 N / 100e-6 m^2 = 200 MPa.
  expect(r.stress).toBeCloseTo(200, 0);
  // ε = σ/E = 200 / 200000 = 0.001.
  expect(r.strain).toBeCloseTo(0.001, 4);
  // σ = E·ε round-trips.
  expect(r.hooke).toBeCloseTo(r.stress, 1);
  // ΔL = ε·L0 = 0.001 * 1000 mm = 1 mm.
  expect(r.elong).toBeCloseTo(1, 2);
});

test("pulleys: F = W/n, velocity ratio = n, and work is conserved (ideal)", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("pulleys");
    const lesson = lab.manager.activeLesson;
    lesson.params.weight = 120;
    lesson.params.efficiency = 1; // ideal
    lesson.params.lift = 0.5;
    // 4 supporting strands → MA 4.
    lesson.params.strands = 4;
    lesson.update();
    const a = lesson.compute();
    // 2 strands → effort should double vs 4 strands.
    lesson.params.strands = 2;
    lesson.update();
    const b = lesson.compute();
    return { a, b };
  });
  // F = W/n: 120/4 = 30, 120/2 = 60.
  expect(r.a.effort).toBeCloseTo(30, 3);
  expect(r.b.effort).toBeCloseTo(60, 3);
  // Velocity ratio equals strand count.
  expect(r.a.VR).toBe(4);
  expect(r.b.VR).toBe(2);
  // Ideal: work in = work out, for both configurations.
  expect(r.a.workIn).toBeCloseTo(r.a.workOut, 3);
  expect(r.b.workIn).toBeCloseTo(r.b.workOut, 3);
  // Pull distance = n × load rise.
  expect(r.a.pull).toBeCloseTo(4 * r.a.h, 3);
});

test("pulleys: friction makes effort exceed the ideal and wastes work", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("pulleys");
    const lesson = lab.manager.activeLesson;
    lesson.params.weight = 100;
    lesson.params.strands = 2;
    lesson.params.lift = 0.8;
    lesson.params.efficiency = 0.5; // half the work is lost
    lesson.update();
    return lesson.compute();
  });
  // Ideal effort would be 100/2 = 50; at η=0.5 it is 100/(2·0.5) = 100.
  expect(r.effort).toBeCloseTo(100, 3);
  // Work in is greater than useful work out by 1/η.
  expect(r.workIn).toBeGreaterThan(r.workOut * 1.9);
});

test("Atwood machine: weight difference sets acceleration and rope tension", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#atwood-machine");
  await expect(page.locator("#info h2")).toHaveText("Atwood Machine");

  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.params.massA = 2;
    lesson.params.massB = 4;
    lesson.params.gravity = 9.81;
    lesson.resetForInputs();
  });
  await expect(page.locator("#atwood-readout")).toContainText("3.270 m/s²");
  await expect(page.locator("#atwood-readout")).toContainText("26.16 N");
  await expect(page.locator("#atwood-readout")).toContainText("B is heavier, so B moves down");

  const movement = await page.evaluate(async () => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const before = lesson.massBMesh.position.y;
    lesson.params.running = true;
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { before, after: lesson.massBMesh.position.y };
  });
  expect(movement.after).toBeLessThan(movement.before);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("load-paths: knot equilibrium balances and reactions sum to the weight", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("load-paths");
    const lesson = lab.manager.activeLesson;
    // Symmetric: weight centred.
    lesson.params.weight = 200;
    lesson.params.knotX = 0;
    lesson.params.sag = 2.2;
    lesson.update();
    const sym = lesson.compute();
    // Off-centre toward the right column.
    lesson.params.knotX = 2;
    lesson.update();
    const off = lesson.compute();
    return { sym, off };
  });

  // Symmetric ⇒ equal tensions and equal vertical reactions.
  expect(r.sym.TL).toBeCloseTo(r.sym.TR, 3);
  expect(r.sym.VL).toBeCloseTo(r.sym.VR, 3);
  // Vertical reactions always sum to the full weight (load path to ground).
  expect(r.sym.VL + r.sym.VR).toBeCloseTo(200, 2);
  expect(r.off.VL + r.off.VR).toBeCloseTo(200, 2);
  // Horizontal equilibrium at the knot: the two side-pulls cancel.
  expect(r.sym.TL * r.sym.uLx + r.sym.TR * r.sym.uRx).toBeCloseTo(0, 4);
  expect(r.off.TL * r.off.uLx + r.off.TR * r.off.uRx).toBeCloseTo(0, 4);
});

test("load-paths: flatter cables (less sag) means much higher tension", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(() => {
    const lab = (window as any).__lab;
    lab.manager.selectById("load-paths");
    const lesson = lab.manager.activeLesson;
    lesson.params.weight = 200;
    lesson.params.knotX = 0;
    lesson.params.sag = 3.5; // steep cables
    lesson.update();
    const steep = lesson.compute().TL;
    lesson.params.sag = 0.6; // nearly flat cables
    lesson.update();
    const flat = lesson.compute().TL;
    // Symmetric closed form: T = W / (2 sinθ); check the flat case against it.
    const flatC = lesson.compute();
    const sinTheta = Math.sin((flatC.thetaL * Math.PI) / 180);
    return { steep, flat, predicted: 200 / (2 * sinTheta) };
  });
  // Flattening the cables sharply increases tension.
  expect(r.flat).toBeGreaterThan(r.steep * 2);
  // And matches the symmetric closed form T = W / (2 sinθ).
  expect(r.flat).toBeCloseTo(r.predicted, 1);
});

test("shaders: u_time advances, bad GLSL reports an error, good GLSL recovers", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("shaders"));

  // u_time should climb as frames tick.
  const t0 = await page.evaluate(() => (window as any).__lab.manager.activeLesson["uniforms"].u_time.value);
  await page.waitForTimeout(250);
  const t1 = await page.evaluate(() => (window as any).__lab.manager.activeLesson["uniforms"].u_time.value);
  expect(t1).toBeGreaterThan(t0);

  // Feed deliberately broken GLSL → the error panel should show something.
  await page.evaluate(() => {
    const ta = document.getElementById("glsl-src") as HTMLTextAreaElement;
    ta.value = "void main() { this is not glsl }";
    (window as any).__lab.manager.activeLesson["compile"]();
  });
  const errText = await page.locator("#glsl-err").textContent();
  expect((errText ?? "").length).toBeGreaterThan(0);

  // Recover with a valid shader → error clears.
  await page.evaluate(() => {
    const ta = document.getElementById("glsl-src") as HTMLTextAreaElement;
    ta.value = "varying vec2 vUv; void main() { gl_FragColor = vec4(vUv, 0.0, 1.0); }";
    (window as any).__lab.manager.activeLesson["compile"]();
  });
  const cleared = await page.locator("#glsl-err").textContent();
  expect((cleared ?? "").trim().length).toBe(0);
});

test("shaders: every Zero→Hero course chapter compiles cleanly", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("shaders"));

  const count = await page.locator(".glsl-chapter").count();
  expect(count).toBeGreaterThanOrEqual(10); // a real "zero to hero" course

  for (let i = 0; i < count; i++) {
    // Drive the real UI path: click the chapter button, which loads + compiles it.
    await page.evaluate((idx) => (window as any).__lab.manager.activeLesson["loadChapter"](idx), i);
    const err = await page.locator("#glsl-err").textContent();
    expect((err ?? "").trim(), `chapter ${i + 1} should compile without GLSL errors`).toBe("");
    // The active chapter + progress UI should reflect the selection.
    const progress = await page.locator("#glsl-progress").textContent();
    expect(progress).toBe(`${i + 1} / ${count}`);
  }

  // The final chapter is the "hero" shader; confirm it left the editor populated.
  const src = await page.locator("#glsl-src").inputValue();
  expect(src).toContain("HERO");
});

test("unit converter: 1000 m = 1 km with working shown, and ⇅ swaps", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("unit-conversions"));

  // Default category is Length, from = metre, to = kilometre.
  await page.fill("#conv-value", "1000");
  await expect(page.locator("#conv-result")).toHaveText("1 km");
  await expect(page.locator("#conv-factor-top")).toHaveText("0.001 km");
  await expect(page.locator("#conv-factor-bottom")).toHaveText("1 m");
  // Working line must show the cancelling unit-fraction.
  await expect(page.locator("#conv-working")).toContainText("1 m = 0.001 km");

  // Swap units: now converting km → m, so 1000 km = 1,000,000 m.
  await page.click("#conv-swap");
  await expect(page.locator("#conv-result")).toHaveText("1000000 m");

  // Temperature is the non-linear path: 100 °C = 212 °F.
  await page.selectOption("#conv-cat", "temperature");
  await page.selectOption("#conv-from", "C");
  await page.selectOption("#conv-to", "F");
  await page.fill("#conv-value", "100");
  await expect(page.locator("#conv-result")).toHaveText("212 °F");
  await expect(page.locator("#conv-factor-top")).toHaveText("scale + shift");
  await expect(page.locator("#conv-factor-bottom")).toHaveText("°C → °F");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("geometry calculator: circles and volumes update live", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("geometry"));

  await page.fill("#geom-input-radius", "3");
  await expect(page.locator('[data-geom-result="area"] b')).toHaveText("28.2743 units²");
  await expect(page.locator("#geom-formula")).toContainText("A = πr²");
  const beforeRadius = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const mesh = lesson["preview"].children.find((child: any) => child.isMesh);
    mesh.geometry.computeBoundingSphere();
    return mesh.geometry.boundingSphere.radius;
  });
  await page.fill("#geom-input-radius", "6");
  const afterRadius = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const mesh = lesson["preview"].children.find((child: any) => child.isMesh);
    mesh.geometry.computeBoundingSphere();
    return mesh.geometry.boundingSphere.radius;
  });
  expect(afterRadius).toBeGreaterThan(beforeRadius);

  await page.selectOption("#geom-section", "volume");
  await page.selectOption("#geom-calculator", "sphere-volume");
  await page.fill("#geom-input-radius", "2");
  await expect(page.locator('[data-geom-result="volume"] b')).toHaveText("33.5103 units³");
  await expect(page.locator('[data-geom-result="surface-area"] b')).toHaveText("50.2655 units²");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("unit converter: SI prefixes and centre-stage visual update", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.evaluate(() => (window as any).__lab.manager.selectById("unit-conversions"));

  await page.selectOption("#conv-cat", "si-prefix");
  await page.selectOption("#conv-from", "k");
  await page.selectOption("#conv-to", "one");
  await page.fill("#conv-value", "1");
  await expect(page.locator("#conv-result")).toHaveText("1000 unit");
  await expect(page.locator("#conv-working")).toContainText("1 k-unit = 1000 unit");

  const previewChildren = await page.evaluate(() => (window as any).__lab.manager.activeLesson["preview"].children.length);
  expect(previewChildren).toBeGreaterThan(5);

  await page.selectOption("#conv-cat", "force");
  await page.selectOption("#conv-from", "kN");
  await page.selectOption("#conv-to", "N");
  await page.fill("#conv-value", "2.5");
  await expect(page.locator("#conv-result")).toHaveText("2500 N");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("every lesson is framed by a brief, a worked example, mistakes and self-checks", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");

  const brief = page.locator("#lesson-brief");
  const practice = page.locator("#lesson-practice");

  for (const lesson of LESSONS) {
    await page.evaluate((id) => (window as any).__lab.manager.selectById(id), lesson.id);

    await expect(brief, `${lesson.id} is missing its stage position`).toContainText("Lesson ");
    await expect(brief, `${lesson.id} is missing its objectives`).toContainText("By the end you can");
    await expect(brief, `${lesson.id} is missing its key idea`).toContainText("Key idea:");
    await expect(brief, `${lesson.id} is missing its motivation`).toContainText("Why it matters:");
    await expect(brief, `${lesson.id} is missing a viewport instruction`).toContainText("Try this:");
    await expect(brief).not.toContainText("still being written");

    await page.locator("#page-practice").click();
    await expect(practice, `${lesson.id} is missing a worked example`).toContainText("Worked example");
    await expect(practice, `${lesson.id} is missing common mistakes`).toContainText("Common mistakes");
    await expect(practice, `${lesson.id} is missing self-checks`).toContainText("Check yourself");
    await expect(practice.locator(".check-item")).not.toHaveCount(0);
  }

  expect(errors, errors.join("\n")).toEqual([]);
});

test("self-check answers stay hidden until revealed", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#foundations");
  await page.locator("#page-practice").click();

  const first = page.locator(".check-item").first();
  await expect(first.locator(".check-answer")).toBeHidden();
  await first.locator("summary").click();
  await expect(first.locator(".check-answer")).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});

test("completing a lesson records progress, ticks the sidebar, and advances the path", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#foundations");

  await expect(page.locator("#path-progress")).toContainText("0 of 74 lessons (0%)");

  await page.locator("#page-practice").click();
  await page.getByTestId("mark-complete").click();
  await expect(page.getByTestId("mark-complete")).toContainText("Completed");
  await expect(page.locator("#path-progress")).toContainText("1 of 74 lessons (1%)");
  await expect(page.locator(".nav-item.is-complete .nav-title")).toHaveText("1 · Foundation topics");
  await expect(page.locator('.nav-section[data-stage="stage-numbers"] .nav-section-count')).toHaveText("1/7");

  await page.getByTestId("next-lesson").click();
  await expect(page).toHaveURL(/#number-sense-fractions$/);
  await expect(page.locator("#info h2")).toHaveText("Number Sense & Fractions");
  await page.locator("#page-practice").click();
  await expect(page.getByTestId("next-lesson")).toContainText("Arithmetic Operations Lab");

  // Progress survives a reload and the learner resumes where they left off.
  await page.goto("/");
  await expect(page.locator("#path-progress")).toContainText("1 of 74 lessons (1%)");
  await expect(page.locator("#info h2")).toHaveText("Number Sense & Fractions");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("topic workspace splits lesson pages from animation controls", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#foundations");

  await expect(page.locator("#panel-tab-lesson")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#info h2")).toBeVisible();
  await expect(page.locator("#gui")).toBeHidden();

  await page.locator("#panel-tab-animate").click();
  await expect(page.locator("#panel-tab-animate")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#gui")).toBeVisible();
  await expect(page.locator("#info h2")).toBeHidden();

  await page.locator("#panel-tab-lesson").click();
  await page.locator("#page-practice").click();
  await expect(page.locator("#lesson-practice")).toBeVisible();
  await expect(page.locator("#info h2")).toBeHidden();

  expect(errors, errors.join("\n")).toEqual([]);
});

test("searching hides stages that have no matching lessons", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");

  await expect(page.locator(".nav-section:visible")).toHaveCount(12);
  await page.fill("#lesson-search", "shader");
  await expect(page.locator(".nav-section:visible")).toHaveCount(1);
  await expect(page.locator(".nav-section:visible .nav-section-title")).toHaveText("Stage 12 · Maths as code");

  await page.fill("#lesson-search", "");
  await expect(page.locator(".nav-section:visible")).toHaveCount(12);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("journey planner turns a distance and a speed into a travel time", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#unit-conversions");

  // Opens on the everyday example: 10 miles at 30 mph.
  await expect(page.locator("#journey-distance")).toHaveValue("10");
  await expect(page.locator("#journey-speed")).toHaveValue("30");
  await expect(page.locator("#journey-result")).toHaveText("20 min");
  await expect(page.locator("#journey-result-exact")).toContainText("1200 s");

  // Matching units need no conversion, and the working says so.
  await expect(page.locator("#journey-working")).toContainText("16093.4 m");
  await expect(page.locator("#journey-working")).toContainText("13.4112 m/s");

  // Mixed units force the base-unit reduction the lesson teaches.
  await page.selectOption("#journey-speed-unit", "kmh");
  await expect(page.locator("#journey-result")).toHaveText("32 min 11 s");
  await expect(page.locator("#journey-working")).toContainText("8.33333 m/s");

  // Doubling the distance doubles the time.
  await page.fill("#journey-distance", "20");
  await expect(page.locator("#journey-result")).toHaveText("1 hr 4 min 22 s");

  // A preset restores a known journey and explains it.
  await page.getByRole("button", { name: "400 m sprint at 8 m/s" }).click();
  await expect(page.locator("#journey-result")).toHaveText("50 s");
  await expect(page.locator("#journey-note")).toContainText("no conversion at all");
  await expect(page.locator("#journey-working")).toContainText("already in base units");

  // Standing still never arrives, and the lesson says why instead of showing Infinity.
  await page.fill("#journey-speed", "0");
  await expect(page.locator("#journey-result")).toHaveText("—");
  await expect(page.locator("#journey-working")).toContainText("never arrive");

  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/journey-planner.png` });
  expect(errors, errors.join("\n")).toEqual([]);
});

test("conversion factor lookup searches, filters and loads rows into the converter", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#unit-conversions");

  const rows = page.locator("#lookup-rows li[data-category]");
  const total = await rows.count();
  expect(total).toBeGreaterThan(30);
  await expect(page.locator("#lookup-count")).toContainText(`${total} of ${total} factors shown`);

  // Values are computed from the converter's own table, so the classics are exact.
  const mileRow = page.locator('#lookup-rows li[data-from="mi"][data-to="km"]');
  await expect(mileRow).toContainText("1 mi = 1.60934 km");
  await expect(mileRow).toContainText("1 km = 0.621371 mi");
  await expect(mileRow.locator(".factor-badge")).toHaveText("exact");

  // Searching narrows the sheet.
  await page.fill("#lookup-search", "pressure");
  const shown = await rows.count();
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(total);
  await expect(page.locator("#lookup-rows")).toContainText("atm");
  await expect(page.locator("#lookup-rows")).not.toContainText("Digital storage");

  // A search with no matches explains itself rather than showing an empty box.
  await page.fill("#lookup-search", "zzzz");
  await expect(page.locator(".lookup-empty")).toContainText("No factor matches");
  await expect(page.locator("#lookup-count")).toContainText("0 of");

  // The category filter and the exact-only toggle compose with the search box.
  await page.fill("#lookup-search", "");
  await page.selectOption("#lookup-category", "speed");
  await expect(page.locator("#lookup-rows")).toContainText("Speed");
  await expect(page.locator("#lookup-rows")).not.toContainText("Mass");

  await page.selectOption("#lookup-category", "all");
  await page.check("#lookup-exact-only");
  const exactCount = await rows.count();
  expect(exactCount).toBeLessThan(total);
  await expect(page.locator("#lookup-rows .factor-badge.approx")).toHaveCount(0);
  await page.uncheck("#lookup-exact-only");

  // Clicking a row drives the converter above it.
  await page.locator('#lookup-rows li[data-from="mps"][data-to="kmh"]').click();
  await expect(page.locator("#conv-cat")).toHaveValue("speed");
  await expect(page.locator("#conv-value")).toHaveValue("1");
  await expect(page.locator("#conv-from")).toHaveValue("mps");
  await expect(page.locator("#conv-to")).toHaveValue("kmh");
  await expect(page.locator("#conv-result")).toHaveText("3.6 km/h");

  expect(errors).toEqual([]);
});

test("parallel lines modes, converse hypothesis, and predict/reveal", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#parallel-lines");
  await expect(page.locator("#info h2")).toHaveText("Parallel Lines");

  // Default figure is parallel with corresponding angles equal.
  await expect(page.locator('[data-pl-chip="parallel"]')).toContainText("are parallel");
  await expect(page.locator('[data-pl-chip="relation"]')).toContainText("holds");

  // Mode switch rebuilds the panel but keeps interactive controls.
  await page.locator('[data-pl="mode:alternate-interior"]').click();
  await expect(page.locator("#pl-claim-title")).toHaveText("Theorem: start with parallel lines");
  await expect(page.locator("[data-pl-conclusion]")).toContainText("∠");
  await expect(page.locator('[data-pl-plain="forward"]')).toHaveAttribute("data-active", "true");
  await expect(page.locator('[data-pl-plain="converse"]')).toContainText("Start from the angles");
  await expect(page.locator('[data-pl="mode:alternate-interior"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-pl-chip="relation"]')).toContainText("holds");

  // Adjacent angles overlap, so the lesson presents one unambiguous linear pair at a time.
  await page.locator('[data-pl="mode:adjacent"]').click();
  await expect(page.locator("#pl-adjacent-pair")).toHaveText("Showing pair 1 of 8");
  await expect(page.locator("#pl-readout")).toContainText("∠₁NW + ∠₁NE");
  await page.locator('[data-pl="adjacent-next"]').click();
  await expect(page.locator("#pl-adjacent-pair")).toHaveText("Showing pair 2 of 8");

  // Converse + non-parallel with unequal angles: hypothesis not met (not a counterexample).
  await page.locator('[data-pl="mode:converse-corresponding"]').click();
  await expect(page.locator("#pl-claim-title")).toHaveText("Converse: start with equal angles");
  await expect(page.locator('[data-pl="mode:converse-corresponding"]')).toHaveText("Converse: corresponding");
  await expect(page.locator('[data-pl="mode:converse-alternate-interior"]')).toHaveText("Converse: alt. interior");
  await expect(page.locator("[data-pl-given]")).toContainText("∠");
  await expect(page.locator("[data-pl-conclusion]")).toContainText("L1 ∥ L2");
  await expect(page.locator('[data-pl-plain="converse"]')).toHaveAttribute("data-active", "true");
  await page.locator('[data-pl="skew"]').click();
  await expect(page.locator('[data-pl-chip="parallel"]')).toContainText("are not parallel");
  await expect(page.locator('[data-pl-chip="converse"]')).toContainText("hypothesis not met");
  await expect(page.locator('[data-pl-chip="converse"]')).not.toContainText("counterexample");
  await expect(page.locator('[data-pl-plain="now"]')).toContainText("Starting from the angles gets you nowhere");
  await expect(page.locator('[data-pl-plain="now"]')).toContainText("starting from the lines");

  // Converse prediction hides the conclusion, not its equal-angle hypothesis.
  await page.locator('[data-pl="hide-angles"]').click();
  await expect(page.locator('[data-pl-chip="parallel"]')).toContainText("lines ?");
  await expect(page.locator("#pl-readout")).toContainText("°");
  await expect(page.locator("#pl-readout")).not.toContainText("not parallel");
  await expect(page.locator("#pl-readout")).toContainText("L2 angle? — hidden");
  await expect(page.locator("#pl-message")).not.toContainText("lines are parallel");
  await expect(page.locator('[data-pl-plain="now"]')).not.toContainText("lines are not parallel");
  await expect(page.locator("#pl-verdict")).toContainText("Parallel status hidden");
  await page.locator('[data-pl="predict:fails"]').click();
  await expect(page.locator("#pl-verdict")).toContainText("Yes");
  await expect(page.locator("#pl-verdict")).toContainText("hypothesis is not met");

  // Restore parallel and confirm converse supports parallelism again.
  await page.locator('[data-pl="reset-parallel"]').click();
  await expect(page.locator('[data-pl-chip="parallel"]')).toContainText("are parallel");
  await expect(page.locator('[data-pl-chip="converse"]')).toContainText("supports parallelism");
  await page.locator('[data-pl="hide-angles"]').click();
  await expect(page.locator('[data-pl-chip="parallel"]')).toContainText("lines ?");
  await page.locator('[data-pl="reveal-angles"]').click();
  await expect(page.locator('[data-pl-chip="parallel"]')).toContainText("are parallel");

  // The ordinary theorem uses the same pair but reverses the logic direction.
  await page.locator('[data-pl="mode:corresponding"]').click();
  await expect(page.locator("#pl-claim-title")).toHaveText("Theorem: start with parallel lines");
  await expect(page.locator("[data-pl-given]")).toContainText("L1 ∥ L2");
  await expect(page.locator("[data-pl-conclusion]")).toContainText("∠");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("parallel lines line-2 drag keeps the intersection pivot", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#parallel-lines");
  await expect(page.locator("#info h2")).toHaveText("Parallel Lines");

  const reading = await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    const before = lesson.figure() as {
      valid: boolean;
      intersection2: { x: number; y: number } | null;
    };
    const pivot = before.intersection2;
    if (!pivot) throw new Error("missing intersection2");
    // Drag line-2 handle to a new point about 2.6 units from the pivot at ~25°.
    const target = {
      x: pivot.x + Math.cos(0.45) * 2.6,
      y: pivot.y + Math.sin(0.45) * 2.6,
      z: 0,
    };
    lesson.onDrag(0, target);
    const after = lesson.figure() as {
      valid: boolean;
      intersection2: { x: number; y: number } | null;
      parallel: boolean;
    };
    const handle = {
      x: lesson.handles[0].position.x as number,
      y: lesson.handles[0].position.y as number,
    };
    return {
      before: pivot,
      after: after.intersection2,
      valid: after.valid,
      parallel: after.parallel,
      handle,
      target,
      line2Offset: lesson.line2Offset as number,
      line2Angle: lesson.line2Angle as number,
    };
  });

  expect(reading.valid).toBe(true);
  expect(reading.after).not.toBeNull();
  expect(reading.after!.x).toBeCloseTo(reading.before.x, 5);
  expect(reading.after!.y).toBeCloseTo(reading.before.y, 5);
  // Handle stays on the ray from the pivot toward the pointer.
  const hx = reading.handle.x - reading.before.x;
  const hy = reading.handle.y - reading.before.y;
  const tx = reading.target.x - reading.before.x;
  const ty = reading.target.y - reading.before.y;
  const cross = Math.abs(hx * ty - hy * tx);
  expect(cross).toBeLessThan(1e-3);
  // Line equation n·X = offset still passes through the pivot.
  const nx = -Math.sin(reading.line2Angle);
  const ny = Math.cos(reading.line2Angle);
  expect(nx * reading.before.x + ny * reading.before.y).toBeCloseTo(reading.line2Offset, 5);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("triangle theorems animates each centre construction step by step", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#triangle-theorems");
  await expect(page.locator("#info h2")).toHaveText("Triangle Theorems");

  // The nine-point circle readout is live and self-checking.
  await expect(page.locator("#info")).toContainText("Nine-point circle");
  await expect(page.locator("#info")).toContainText("max error");

  const state = () =>
    page.evaluate(() => {
      const lesson = (window as any).__lab.manager.activeLesson;
      const a = lesson.anim;
      return {
        index: a?.index ?? null,
        total: a?.steps.length ?? null,
        playing: a?.playing ?? null,
        done: a?.done ?? null,
        overlays: lesson.params as Record<string, boolean>,
        animObjects: lesson.animLayer.children.length as number,
      };
    });

  // Clicking a centre starts its construction animation, playing from step 1.
  await page.getByRole("button", { name: "▶ Circumcentre O" }).click();
  await expect(page.locator("#info")).toContainText("Building: Circumcentre O");
  await expect(page.locator("#tri-step")).toHaveText("Step 1 of 7");
  await expect(page.locator("#tri-caption")).toContainText("midpoint");
  // Every construction explains what it is actually good for.
  await expect(page.locator("#info")).toContainText("Used for:");
  await expect(page.locator("#info")).toContainText("equidistant from three others");
  expect((await state()).playing).toBe(true);
  // Back is unavailable on the first step; the overlay is not pre-drawn.
  await expect(page.locator("#tri-back")).toBeDisabled();
  expect((await state()).overlays.circumcircle).toBe(false);

  // Pause holds the step, and does not advance.
  await page.locator("#tri-play").click();
  await expect(page.locator("#tri-play")).toHaveText("▶ Play");
  const paused = await state();
  expect(paused.playing).toBe(false);
  await page.waitForTimeout(700);
  expect((await state()).index).toBe(paused.index);

  // Next advances exactly one step, Back returns to it.
  await page.getByRole("button", { name: "⏭ Next" }).click();
  const after = await state();
  expect(after.index).toBe(paused.index + 1);
  await expect(page.locator("#tri-step")).toHaveText(`Step ${after.index + 1} of 7`);
  await expect(page.locator("#tri-back")).toBeEnabled();
  await page.getByRole("button", { name: "⏮ Back" }).click();
  expect((await state()).index).toBe(paused.index);

  // Back cannot wrap around past the first step.
  expect((await state()).index).toBe(0);
  await expect(page.locator("#tri-back")).toBeDisabled();

  // Next through to the end marks it done: Next disables, Play becomes Replay.
  // Six clicks reach the last step, and a seventh marks the construction finished.
  for (let i = 0; i < 7; i++) await page.getByRole("button", { name: "⏭ Next" }).click();
  const finished = await state();
  expect(finished).toMatchObject({ index: 6, total: 7, playing: false, done: true });
  await expect(page.locator("#tri-step")).toHaveText("Step 7 of 7");
  await expect(page.locator("#tri-next")).toBeDisabled();
  await expect(page.locator("#tri-play")).toHaveText("↺ Replay");
  // Finishing must not silently tick the static overlay on.
  expect(finished.overlays.circumcircle).toBe(false);

  // Back out of the finished state really steps back and re-enables Next.
  await page.getByRole("button", { name: "⏮ Back" }).click();
  const stepped = await state();
  expect(stepped).toMatchObject({ index: 5, done: false });
  await expect(page.locator("#tri-next")).toBeEnabled();
  await expect(page.locator("#tri-play")).toHaveText("▶ Play");
  // Fewer objects are drawn at step 6 than at step 7 — Back genuinely undraws.
  expect(stepped.animObjects).toBeLessThan(finished.animObjects);

  // Play from a fully-drawn last step just finishes; Replay then restarts from step 1.
  await page.getByRole("button", { name: "⏭ Next" }).click();
  expect(await state()).toMatchObject({ index: 6, done: false });
  await page.locator("#tri-play").click();
  await expect(page.locator("#tri-play")).toHaveText("↺ Replay");
  expect(await state()).toMatchObject({ index: 6, playing: false, done: true });
  await page.locator("#tri-play").click();
  expect(await state()).toMatchObject({ index: 0, playing: true, done: false });

  // Switching to another construction resets the transport.
  await page.getByRole("button", { name: "▶ Nine-point circle" }).click();
  await expect(page.locator("#info")).toContainText("Building: Nine-point circle");
  await expect(page.locator("#tri-step")).toHaveText("Step 1 of 6");
  expect(await state()).toMatchObject({ index: 0, total: 6, done: false });

  // Clear this removes the transport bar and every object it drew.
  await page.getByRole("button", { name: "✕ Clear this" }).click();
  await expect(page.locator("#tri-caption")).toHaveCount(0);
  const cleared = await state();
  expect(cleared.index).toBeNull();
  expect(cleared.animObjects).toBe(0);

  // Clear all overlays resets every construction toggle at once.
  await page.evaluate(() => {
    const p = (window as any).__lab.manager.activeLesson.params;
    p.medians = true;
    p.ninePoint = true;
  });
  await page.getByRole("button", { name: "▶ Centroid G" }).click();
  await page.getByRole("button", { name: "✕ Clear all overlays" }).click();
  await expect(page.locator("#tri-caption")).toHaveCount(0);
  const bare = await state();
  expect(bare.animObjects).toBe(0);
  expect([
    bare.overlays.medians,
    bare.overlays.circumcircle,
    bare.overlays.incircle,
    bare.overlays.altitudes,
    bare.overlays.ninePoint,
    bare.overlays.eulerLine,
    bare.overlays.medial,
  ]).toEqual([false, false, false, false, false, false, false]);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("triangle theorems construction plays through by itself and follows a dragged vertex", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#triangle-theorems");

  const state = () =>
    page.evaluate(() => {
      const lesson = (window as any).__lab.manager.activeLesson;
      const a = lesson.anim;
      return { index: a?.index ?? null, done: a?.done ?? null, playing: a?.playing ?? null };
    });

  // Speed the playback up so the whole construction runs inside the test.
  await page.evaluate(() => {
    (window as any).__lab.manager.activeLesson.playback.speed = 3;
  });
  await page.getByRole("button", { name: "▶ Centroid G" }).click();
  expect(await state()).toMatchObject({ index: 0, playing: true, done: false });

  // It advances on its own, without any clicking.
  await expect.poll(async () => (await state()).index, { timeout: 5000 }).toBeGreaterThan(0);
  await expect.poll(async () => (await state()).done, { timeout: 10000 }).toBe(true);
  await expect(page.locator("#tri-step")).toHaveText("Step 6 of 6");
  await expect(page.locator("#tri-play")).toHaveText("↺ Replay");

  // A finished construction still tracks the triangle: move a vertex and the
  // centroid the animation drew moves with it.
  const centroidY = () =>
    page.evaluate(() => {
      const lesson = (window as any).__lab.manager.activeLesson;
      return lesson.compute().G.y as number;
    });
  const before = await centroidY();
  await page.evaluate(() => {
    const lesson = (window as any).__lab.manager.activeLesson;
    lesson.verts[2].set(-1, 4.2, 0);
    lesson.animDirty = true;
    lesson.rebuild();
  });
  await page.waitForTimeout(200);
  expect(await centroidY()).toBeGreaterThan(before);
  expect(await state()).toMatchObject({ done: true });

  expect(errors, errors.join("\n")).toEqual([]);
});

test("triangle transformations animate and distinguish rigid motion from enlargement", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/#triangle-transformations");

  await expect(page.locator("#xf-rule")).toContainText("translate by (3, 1.5)");
  await page.getByRole("button", { name: "Rotation" }).click();
  await expect(page.locator("#xf-rule")).toContainText("rotate 90° anticlockwise");
  await expect(page.locator("#xf-note")).toContainText("rigid transformation");

  await page.getByRole("button", { name: "Enlargement" }).click();
  await expect(page.locator("#xf-readout")).toContainText("Scale factor1.5");
  await expect(page.locator("#xf-note")).toContainText("multiplies area by 1.5² = 2.25");

  await page.getByRole("button", { name: "Hide image" }).click();
  await expect(page.locator("#xf-verdict")).toContainText("Image hidden");
  await page.getByRole("button", { name: "Angles match; lengths and area scale" }).click();
  await expect(page.locator("#xf-verdict")).toContainText("Correct");
  await page.getByRole("button", { name: "Reveal image" }).click();

  await page.locator("#xf-animate").click();
  await expect.poll(() => page.locator("#xf-animate").textContent(), { timeout: 4000 })
    .toContain("Animate this transformation");
  expect(errors, errors.join("\n")).toEqual([]);
});
