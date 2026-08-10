import type { CurriculumStage } from "./types";

/**
 * The zero-to-elite path.
 *
 * Stages are ordered so that every lesson's prerequisites appear earlier in the sequence
 * (enforced by `tests/curriculum.test.ts`). The sidebar, the `[` / `]` keyboard shortcuts,
 * the "next lesson" button and the progress tracker all read from this single list, so
 * changing the order here changes the whole app consistently.
 */
export const STAGES: readonly CurriculumStage[] = [
  {
    id: "stage-numbers",
    title: "Stage 1 · Numbers & arithmetic",
    goal: "Work confidently with whole numbers, fractions and the rules that govern them.",
    lessons: [
      "foundations",
      "number-sense-fractions",
      "arithmetic-operations",
      "order-of-operations",
      "times-tables",
      "multiplication-division",
      "unit-conversions",
    ],
  },
  {
    id: "stage-algebra",
    title: "Stage 2 · Algebra",
    goal: "Use letters for unknown numbers, and rearrange and solve equations.",
    lessons: [
      "algebraic-laws",
      "rearranging-equations",
      "powers",
      "logarithms",
      "binomials",
      "pascal-triangle",
    ],
  },
  {
    id: "stage-functions",
    title: "Stage 3 · Functions & graphs",
    goal: "See algebra as pictures: lines, curves, systems and how graphs move.",
    lessons: [
      "coordinates-and-lines",
      "functions-and-graphs",
      "simultaneous-equations",
      "quadratics",
      "inequalities",
      "graph-transformations",
      "exponential-log-graphs",
      "sequences-and-series",
    ],
  },
  {
    id: "stage-shape",
    title: "Stage 4 · Shape & space",
    goal: "Measure and reason about lines, angles, triangles, circles and curves.",
    lessons: [
      "geometry",
      "angles",
      "parallel-lines",
      "triangle-theorems",
      "pythagoras",
      "similar-triangles",
      "triangle-transformations",
      "quadrilaterals",
      "circle-glossary",
      "circle-theorems",
      "circle-calculations",
      "volume",
      "conic-sections",
      "ellipses",
      "sacred-geometry",
    ],
  },
  {
    id: "stage-trigonometry",
    title: "Stage 5 · Trigonometry & waves",
    goal: "Connect angles to lengths, and describe anything that repeats.",
    lessons: ["radians", "trig-functions", "trigonometry-lab", "waveforms"],
  },
  {
    id: "stage-vectors",
    title: "Stage 6 · Vectors & complex numbers",
    goal: "Handle quantities that carry a direction, and numbers that rotate.",
    lessons: ["vectors", "matrices-as-maps", "complex-numbers"],
  },
  {
    id: "stage-calculus",
    title: "Stage 7 · Calculus",
    goal: "Measure how things change, and add up infinitely many small pieces.",
    lessons: [
      "limits-and-continuity",
      "differentiation",
      "integration",
      "optimization",
      "taylor-series",
      "fourier-series",
      "vector-field",
    ],
  },
  {
    id: "stage-chance",
    title: "Stage 8 · Probability & randomness",
    goal: "Reason about uncertainty, and model systems that evolve by chance.",
    lessons: ["probability", "markov-chains", "stochastic-processes"],
  },
  {
    id: "stage-number-theory",
    title: "Stage 9 · Number theory",
    goal: "Study whole numbers for their own sake — the building blocks of arithmetic.",
    lessons: ["fibonacci-golden-ratio", "prime-numbers", "mersenne-primes"],
  },
  {
    id: "stage-applied",
    title: "Stage 10 · Applied maths & physics",
    goal: "Turn the whole toolkit loose on the physical world.",
    lessons: [
      "kinematics",
      "newtons-laws",
      "projectile-motion",
      "momentum-impulse",
      "collisions",
      "moments",
      "universal-gravitation",
      "load-paths",
      "miter-saw-cuts",
      "pulleys",
      "atwood-machine",
      "stress-strain",
      "pendulum",
      "physical-waves",
      "electrical-circuits",
      "shadows-earth-size",
    ],
  },
  {
    id: "stage-computation",
    title: "Stage 11 · Maths as code",
    goal: "Express mathematics as programs the GPU can run.",
    lessons: ["shaders"],
  },
];

/** Flat lesson-id sequence in teaching order. */
export const CURRICULUM_ORDER: readonly string[] = STAGES.flatMap((stage) => stage.lessons);

const STAGE_BY_LESSON = new Map<string, CurriculumStage>();
const POSITION_BY_LESSON = new Map<string, number>();
for (const stage of STAGES) {
  for (const id of stage.lessons) STAGE_BY_LESSON.set(id, stage);
}
CURRICULUM_ORDER.forEach((id, index) => POSITION_BY_LESSON.set(id, index));

export function stageOf(lessonId: string): CurriculumStage | undefined {
  return STAGE_BY_LESSON.get(lessonId);
}

/** 1-based position in the whole curriculum, or `undefined` for an unplaced lesson. */
export function positionOf(lessonId: string): number | undefined {
  const index = POSITION_BY_LESSON.get(lessonId);
  return index === undefined ? undefined : index + 1;
}

/** The lesson that follows `lessonId` in teaching order. */
export function nextLessonId(lessonId: string): string | undefined {
  const index = POSITION_BY_LESSON.get(lessonId);
  if (index === undefined) return undefined;
  return CURRICULUM_ORDER[index + 1];
}

/** The lesson that precedes `lessonId` in teaching order. */
export function previousLessonId(lessonId: string): string | undefined {
  const index = POSITION_BY_LESSON.get(lessonId);
  if (index === undefined || index === 0) return undefined;
  return CURRICULUM_ORDER[index - 1];
}

/** Sort a lesson collection into curriculum order; unplaced lessons keep their relative order at the end. */
export function inCurriculumOrder<T extends { readonly id: string }>(items: readonly T[]): T[] {
  const fallback = CURRICULUM_ORDER.length;
  return [...items].sort((a, b) => {
    const ai = POSITION_BY_LESSON.get(a.id) ?? fallback;
    const bi = POSITION_BY_LESSON.get(b.id) ?? fallback;
    return ai - bi;
  });
}
