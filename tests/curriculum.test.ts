import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { CURRICULUM_ORDER, STAGES, nextLessonId, previousLessonId, positionOf, stageOf, inCurriculumOrder } from "../src/curriculum/stages";
import { ALL_GUIDES, guideFor } from "../src/curriculum/guides";

/**
 * Curriculum integrity tests.
 *
 * Lesson classes are read from source rather than imported, because importing them pulls
 * in three.js and a WebGL context that does not exist under Node. The regex only has to
 * cope with the repository's own, consistently formatted lesson headers.
 */
const LESSON_DIR = path.resolve(__dirname, "../src/lessons");

interface LessonMeta {
  file: string;
  id: string;
  prerequisites: string[];
}

function readLessons(): LessonMeta[] {
  return fs
    .readdirSync(LESSON_DIR)
    .filter((name) => name.endsWith("Lesson.ts"))
    .map((name) => {
      const source = fs.readFileSync(path.join(LESSON_DIR, name), "utf8");
      const id = /readonly id = "([^"]+)"/.exec(source)?.[1];
      const prereqRaw = /readonly prerequisites = \[([^\]]*)\]/.exec(source)?.[1] ?? "";
      const prerequisites = [...prereqRaw.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
      if (!id) throw new Error(`${name} does not declare a lesson id`);
      return { file: name, id, prerequisites };
    });
}

const lessons = readLessons();
const registered = fs.readFileSync(path.resolve(__dirname, "../src/main.ts"), "utf8");
const registeredLessons = lessons.filter((lesson) =>
  new RegExp(`new ${lesson.file.replace(/\.ts$/, "")}\\(`).test(registered),
);
const lessonIds = new Set(registeredLessons.map((lesson) => lesson.id));

const BANNED_OBJECTIVE_VERBS = ["understand", "know about", "learn about", "be familiar", "appreciate"];

describe("curriculum spine", () => {
  it("places every registered lesson on exactly one stage", () => {
    const placed = STAGES.flatMap((stage) => stage.lessons);
    const missing = [...lessonIds].filter((id) => !placed.includes(id));
    expect(missing, `lessons missing from the curriculum: ${missing.join(", ")}`).toEqual([]);
  });

  it("references only real lessons and never duplicates one", () => {
    const placed = STAGES.flatMap((stage) => stage.lessons);
    const unknown = placed.filter((id) => !lessonIds.has(id));
    expect(unknown, `curriculum references unknown lessons: ${unknown.join(", ")}`).toEqual([]);
    expect(new Set(placed).size).toBe(placed.length);
  });

  it("teaches every prerequisite before the lesson that needs it", () => {
    const violations: string[] = [];
    for (const lesson of registeredLessons) {
      const here = positionOf(lesson.id);
      if (here === undefined) continue;
      for (const prerequisite of lesson.prerequisites) {
        if (!lessonIds.has(prerequisite)) continue;
        const there = positionOf(prerequisite);
        if (there === undefined || there >= here) {
          violations.push(`${lesson.id} is taught before its prerequisite ${prerequisite}`);
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("gives every stage a title and a goal", () => {
    for (const stage of STAGES) {
      expect(stage.title.length).toBeGreaterThan(4);
      expect(stage.goal.endsWith(".")).toBe(true);
      expect(stage.lessons.length).toBeGreaterThan(0);
    }
  });

  it("navigates forwards and backwards consistently", () => {
    for (let i = 0; i < CURRICULUM_ORDER.length; i++) {
      const id = CURRICULUM_ORDER[i];
      expect(positionOf(id)).toBe(i + 1);
      expect(stageOf(id)).toBeDefined();
      expect(nextLessonId(id)).toBe(CURRICULUM_ORDER[i + 1]);
      if (i > 0) expect(previousLessonId(id)).toBe(CURRICULUM_ORDER[i - 1]);
    }
    expect(previousLessonId(CURRICULUM_ORDER[0])).toBeUndefined();
    expect(nextLessonId(CURRICULUM_ORDER[CURRICULUM_ORDER.length - 1])).toBeUndefined();
    expect(nextLessonId("not-a-lesson")).toBeUndefined();
  });

  it("sorts lessons into teaching order regardless of registration order", () => {
    const shuffled = [...CURRICULUM_ORDER].reverse().map((id) => ({ id }));
    expect(inCurriculumOrder(shuffled).map((item) => item.id)).toEqual([...CURRICULUM_ORDER]);
  });

  it("keeps unplaced lessons at the end instead of dropping them", () => {
    const sorted = inCurriculumOrder([{ id: "mystery-lesson" }, { id: CURRICULUM_ORDER[0] }]);
    expect(sorted.map((item) => item.id)).toEqual([CURRICULUM_ORDER[0], "mystery-lesson"]);
  });
});

describe("lesson guides", () => {
  it("covers every lesson on the path exactly once", () => {
    const missing = CURRICULUM_ORDER.filter((id) => !guideFor(id));
    expect(missing, `lessons without a guide: ${missing.join(", ")}`).toEqual([]);
    expect(new Set(ALL_GUIDES.map((guide) => guide.id)).size).toBe(ALL_GUIDES.length);
  });

  it("only describes lessons that exist", () => {
    const unknown = ALL_GUIDES.map((guide) => guide.id).filter((id) => !lessonIds.has(id));
    expect(unknown, `guides for unknown lessons: ${unknown.join(", ")}`).toEqual([]);
  });

  for (const guide of ALL_GUIDES) {
    describe(guide.id, () => {
      it("explains itself in plain English without symbols or jargon", () => {
        expect(guide.plainEnglish.length).toBeGreaterThan(40);
        // The plain-English line is the entry point for someone with no maths at all.
        expect(guide.plainEnglish).not.toMatch(/[=∫Σ√π∑<>]/);
      });

      it("states 3–5 observable objectives", () => {
        expect(guide.objectives.length).toBeGreaterThanOrEqual(3);
        expect(guide.objectives.length).toBeLessThanOrEqual(5);
        for (const objective of guide.objectives) {
          expect(objective.length).toBeGreaterThan(12);
          const lower = objective.toLowerCase();
          for (const banned of BANNED_OBJECTIVE_VERBS) {
            expect(lower.startsWith(banned), `"${objective}" starts with the unmeasurable verb "${banned}"`).toBe(false);
          }
        }
      });

      it("supplies a key idea, a motivation and a viewport instruction", () => {
        expect(guide.keyIdea.length).toBeGreaterThan(20);
        expect(guide.whyItMatters.length).toBeGreaterThan(30);
        expect(guide.tryThis.length).toBeGreaterThan(30);
      });

      it("shows working in the worked example", () => {
        expect(guide.workedExample.prompt.length).toBeGreaterThan(10);
        expect(guide.workedExample.steps.length).toBeGreaterThanOrEqual(3);
        expect(guide.workedExample.steps.length).toBeLessThanOrEqual(6);
        for (const step of guide.workedExample.steps) expect(step.length).toBeGreaterThan(10);
        expect(guide.workedExample.answer.length).toBeGreaterThan(3);
      });

      it("warns about 2–4 real mistakes", () => {
        expect(guide.pitfalls.length).toBeGreaterThanOrEqual(2);
        expect(guide.pitfalls.length).toBeLessThanOrEqual(4);
        for (const pitfall of guide.pitfalls) expect(pitfall.length).toBeGreaterThan(20);
      });

      it("asks 2–4 self-check questions that explain their answers", () => {
        expect(guide.checks.length).toBeGreaterThanOrEqual(2);
        expect(guide.checks.length).toBeLessThanOrEqual(4);
        for (const check of guide.checks) {
          expect(check.question.length).toBeGreaterThan(10);
          // An answer that only states a value teaches nothing; require reasoning.
          expect(check.answer.length).toBeGreaterThan(25);
        }
      });

      it("contains no raw HTML, which the frame renders as literal text", () => {
        const fields = [
          guide.plainEnglish,
          guide.keyIdea,
          guide.whyItMatters,
          guide.tryThis,
          ...guide.objectives,
          ...guide.pitfalls,
          guide.workedExample.prompt,
          guide.workedExample.answer,
          ...guide.workedExample.steps,
          ...guide.checks.flatMap((check) => [check.question, check.answer]),
        ];
        for (const field of fields) expect(field).not.toMatch(/<\/?[a-z][\s\S]*>/i);
      });
    });
  }
});
