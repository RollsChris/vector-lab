import type { LessonGuide } from "./types";
import { NUMBER_GUIDES } from "./guides/numbers";
import { ALGEBRA_GUIDES } from "./guides/algebra";
import { SHAPE_AND_TRIG_GUIDES } from "./guides/shapeAndTrig";
import { VECTOR_AND_CALCULUS_GUIDES } from "./guides/vectorsAndCalculus";
import { CHANCE_AND_NUMBER_THEORY_GUIDES } from "./guides/chanceAndNumberTheory";
import { APPLIED_GUIDES } from "./guides/applied";

/**
 * Every authored lesson guide, keyed by lesson id.
 *
 * Guides are authored per stage-group in `./guides/*` to keep each file reviewable.
 * `tests/curriculum.test.ts` asserts that every registered lesson has exactly one guide
 * and that the guide satisfies the quality contract in `./types.ts`.
 */
const ALL: readonly LessonGuide[] = [
  ...NUMBER_GUIDES,
  ...ALGEBRA_GUIDES,
  ...SHAPE_AND_TRIG_GUIDES,
  ...VECTOR_AND_CALCULUS_GUIDES,
  ...CHANCE_AND_NUMBER_THEORY_GUIDES,
  ...APPLIED_GUIDES,
];

export const LESSON_GUIDES: ReadonlyMap<string, LessonGuide> = new Map(
  ALL.map((guide) => [guide.id, guide]),
);

export function guideFor(lessonId: string): LessonGuide | undefined {
  return LESSON_GUIDES.get(lessonId);
}

export const ALL_GUIDES = ALL;
