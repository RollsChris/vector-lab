/**
 * Types for the curriculum layer.
 *
 * The curriculum is the "zero to elite" spine of the app. It answers three questions that
 * the individual lessons cannot answer on their own:
 *
 *  1. Where am I? (stage + position within the stage)
 *  2. What am I supposed to walk away knowing? (objectives + self-checks)
 *  3. Where do I go next? (curriculum order, not file order)
 *
 * Lesson modules stay responsible for the interactive scene and their own live readouts.
 * Everything in this module is static teaching scaffolding rendered by `LessonManager`
 * once per lesson, so it never re-renders when a slider moves.
 */

/** A single recall question with a revealable answer. */
export interface CheckQuestion {
  /** The question, phrased so it can be answered from the lesson alone. */
  question: string;
  /** The full answer, including the reasoning — not just the final value. */
  answer: string;
}

/** A concrete worked example the learner can follow line by line. */
export interface WorkedExample {
  /** The problem statement, e.g. "Differentiate f(x) = 3x² − 4x". */
  prompt: string;
  /** Ordered working. Each entry is one line of the solution with its justification. */
  steps: readonly string[];
  /** The final answer, stated plainly. */
  answer: string;
}

/**
 * The teaching frame wrapped around every lesson. Authored centrally so that all 50+
 * lessons present the same clear structure regardless of how their scene code is written.
 */
export interface LessonGuide {
  /** Lesson id this guide belongs to. Must match a registered `Lesson.id`. */
  id: string;
  /**
   * One or two sentences in everyday English, assuming no prior maths.
   * No symbols, no jargon — this is the "explain it to me like I've never done maths" line.
   */
  plainEnglish: string;
  /**
   * 3–5 specific, checkable outcomes, each written to complete the sentence
   * "By the end of this lesson you can …". Verbs must be observable
   * ("calculate", "sketch", "explain why"), never vague ("understand", "know about").
   */
  objectives: readonly string[];
  /** Why a learner should care: where this shows up in the real world or later maths. */
  whyItMatters: string;
  /** The single most useful mental picture for the idea. */
  keyIdea: string;
  /** A fully worked example the learner can reproduce on paper. */
  workedExample: WorkedExample;
  /** Mistakes people actually make here, each phrased as "wrong → right". */
  pitfalls: readonly string[];
  /** 2–4 self-check questions ordered easiest first. */
  checks: readonly CheckQuestion[];
  /** What to physically do in the 3D viewport to make the idea click. */
  tryThis: string;
}

/** A stage groups lessons into one coherent step of the journey. */
export interface CurriculumStage {
  id: string;
  /** Short label used in the sidebar, e.g. "Stage 3 · Trigonometry". */
  title: string;
  /** One line describing the capability this stage unlocks. */
  goal: string;
  /** Lesson ids in teaching order. Every id must resolve to a registered lesson. */
  lessons: readonly string[];
}
