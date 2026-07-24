import type GUI from "lil-gui";
import type { Viewport } from "./Viewport";

/** Everything a lesson needs to draw itself and wire up controls. */
export interface LessonContext {
  viewport: Viewport;
  gui: GUI; // a fresh lil-gui panel, cleared between lessons
  /** Renders the lesson's explanatory text into the info panel (HTML allowed). */
  setInfo: (html: string) => void;
}

export type LessonCategory =
  | "Foundations"
  | "Shape"
  | "Trigonometry"
  | "Calculus"
  | "Physics"
  | "Programming";

export type LessonDifficulty = "Foundation" | "Core" | "Applied" | "Advanced";

export interface Lesson {
  readonly id: string;
  readonly title: string;
  /** Short one-liner for the sidebar. */
  readonly blurb: string;
  /** Sidebar section. */
  readonly category: LessonCategory;
  /** Rough difficulty level. */
  readonly difficulty: LessonDifficulty;
  /** IDs of lessons that are useful to complete first. */
  readonly prerequisites: readonly string[];
  /** Build scene objects + controls. Add 3D content to ctx.viewport.world. */
  enter(ctx: LessonContext): void;
  /** Tear down: remove objects, dispose geometries, unregister ticks. */
  exit(): void;
}
