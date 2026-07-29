import type { Lesson } from "./Lesson";
import type { Progress } from "./Progress";
import type { LessonGuide } from "../curriculum/types";
import { guideFor } from "../curriculum/guides";
import { nextLessonId, positionOf, stageOf } from "../curriculum/stages";
import { CURRICULUM_ORDER } from "../curriculum/stages";

interface FrameHooks {
  /** Navigate to another lesson (used by the "next lesson" button). */
  select: (lessonId: string) => void;
  /** Resolve a lesson id to its display title. */
  titleOf: (lessonId: string) => string | undefined;
}

/**
 * Renders the static teaching frame around a lesson: the brief above the live lesson
 * output, and the practice block below it.
 *
 * This is built once per lesson selection with real DOM nodes rather than being folded
 * into `setInfo`, because lessons re-render `#info` on every slider tick — anything with
 * user state (open self-check answers, scroll position) has to live outside that.
 */
export class LessonFrame {
  constructor(
    private readonly brief: HTMLElement,
    private readonly practice: HTMLElement,
    private readonly progress: Progress,
    private readonly hooks: FrameHooks,
  ) {}

  render(lesson: Lesson): void {
    const guide = guideFor(lesson.id);
    this.renderBrief(lesson, guide);
    this.renderPractice(lesson, guide);
  }

  clear(): void {
    this.brief.replaceChildren();
    this.practice.replaceChildren();
  }

  private renderBrief(lesson: Lesson, guide: LessonGuide | undefined): void {
    this.brief.replaceChildren();
    const stage = stageOf(lesson.id);
    const position = positionOf(lesson.id);

    const section = el("section", "lesson-brief-card");
    section.setAttribute("aria-label", "Lesson brief");

    if (stage && position) {
      const trail = el("p", "brief-stage");
      trail.append(
        text(stage.title),
        el("span", "brief-sep", " · "),
        text(`Lesson ${position} of ${CURRICULUM_ORDER.length}`),
      );
      section.append(trail);
    }

    if (!guide) {
      // A lesson with no authored guide still renders, but says so plainly instead of
      // showing an empty frame that looks broken.
      section.append(el("p", "brief-missing", "Guide notes for this lesson are still being written."));
      this.brief.append(section);
      return;
    }

    section.append(el("p", "brief-plain", guide.plainEnglish));

    const objectives = el("div", "brief-block");
    objectives.append(el("h3", undefined, "By the end you can"));
    const list = el("ul", "brief-objectives");
    for (const objective of guide.objectives) list.append(el("li", undefined, objective));
    objectives.append(list);
    section.append(objectives);

    const idea = el("p", "brief-key-idea");
    idea.append(el("b", undefined, "Key idea: "), text(guide.keyIdea));
    section.append(idea);

    const why = el("p", "brief-why");
    why.append(el("b", undefined, "Why it matters: "), text(guide.whyItMatters));
    section.append(why);

    const tryThis = el("p", "brief-try");
    tryThis.append(el("b", undefined, "Try this: "), text(guide.tryThis));
    section.append(tryThis);

    this.brief.append(section);
  }

  private renderPractice(lesson: Lesson, guide: LessonGuide | undefined): void {
    this.practice.replaceChildren();
    if (guide) {
      this.practice.append(this.workedExample(guide));
      this.practice.append(this.pitfalls(guide));
      this.practice.append(this.checks(guide));
    }
    this.practice.append(this.completion(lesson));
  }

  private workedExample(guide: LessonGuide): HTMLElement {
    const section = el("section", "practice-card worked-example");
    section.append(el("h3", undefined, "Worked example"));
    section.append(el("p", "worked-prompt", guide.workedExample.prompt));
    const steps = el("ol", "worked-steps");
    for (const step of guide.workedExample.steps) steps.append(el("li", undefined, step));
    section.append(steps);
    const answer = el("p", "worked-answer");
    answer.append(el("b", undefined, "Answer: "), text(guide.workedExample.answer));
    section.append(answer);
    return section;
  }

  private pitfalls(guide: LessonGuide): HTMLElement {
    const section = el("section", "practice-card pitfalls");
    section.append(el("h3", undefined, "Common mistakes"));
    const list = el("ul", "pitfall-list");
    for (const pitfall of guide.pitfalls) list.append(el("li", undefined, pitfall));
    section.append(list);
    return section;
  }

  private checks(guide: LessonGuide): HTMLElement {
    const section = el("section", "practice-card checks");
    section.append(el("h3", undefined, "Check yourself"));
    section.append(
      el("p", "checks-hint", "Answer these from memory before revealing. If one is hard, re-read the lesson above."),
    );
    guide.checks.forEach((check, index) => {
      const details = document.createElement("details");
      details.className = "check-item";
      const summary = document.createElement("summary");
      summary.append(el("span", "check-num", `Q${index + 1}`), text(check.question));
      details.append(summary, el("p", "check-answer", check.answer));
      section.append(details);
    });
    return section;
  }

  private completion(lesson: Lesson): HTMLElement {
    const section = el("section", "practice-card completion");
    const done = this.progress.isComplete(lesson.id);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = done ? "complete-btn is-done" : "complete-btn";
    toggle.dataset.testid = "mark-complete";
    toggle.textContent = done ? "✓ Completed — mark as unfinished" : "Mark this lesson complete";
    toggle.setAttribute("aria-pressed", String(done));
    toggle.addEventListener("click", () => {
      this.progress.toggleComplete(lesson.id);
      this.renderPractice(lesson, guideFor(lesson.id));
    });
    section.append(toggle);

    const nextId = nextLessonId(lesson.id);
    const nextTitle = nextId ? this.hooks.titleOf(nextId) : undefined;
    if (nextId && nextTitle) {
      const next = document.createElement("button");
      next.type = "button";
      next.className = "next-lesson-btn";
      next.dataset.testid = "next-lesson";
      next.textContent = `Next: ${nextTitle} →`;
      next.addEventListener("click", () => this.hooks.select(nextId));
      section.append(next);
    } else {
      section.append(
        el("p", "completion-end", "That is the end of the path. Revisit any stage to deepen it."),
      );
    }

    if (!this.progress.isPersistent) {
      section.append(
        el("p", "completion-warning", "Browser storage is unavailable, so progress will reset when you reload."),
      );
    }
    return section;
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  textContent?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined) node.textContent = textContent;
  return node;
}

function text(value: string): Text {
  return document.createTextNode(value);
}
