import GUI from "lil-gui";
import * as THREE from "three";
import type { Lesson } from "./Lesson";
import type { Viewport } from "./Viewport";
import { withFoundationContext } from "../lessons/foundationContext";
import {
  derivationById,
  type FormulaDerivation,
} from "./FormulaDerivations";

/** Drives the sidebar, info panel and per-lesson lil-gui; owns enter/exit. */
export class LessonManager {
  private active: Lesson | null = null;
  private gui: GUI | null = null;
  private readonly buttons = new Map<string, HTMLButtonElement>();
  private readonly byId = new Map<string, Lesson>();
  private readonly order = new Map<string, number>();
  private readonly derivationDialog = document.createElement("dialog");
  private readonly derivationObserver: MutationObserver;

  constructor(
    private readonly viewport: Viewport,
    private readonly lessons: Lesson[],
    private readonly dom: {
      nav: HTMLElement;
      info: HTMLElement;
      guiHost: HTMLElement;
      search: HTMLInputElement;
      count: HTMLElement;
      meta: HTMLElement;
    },
  ) {
    this.derivationDialog.className = "derivation-dialog";
    this.derivationDialog.setAttribute("aria-modal", "true");
    document.body.appendChild(this.derivationDialog);
    this.derivationObserver = new MutationObserver(() => {
      if (this.active) this.labelDerivationControls(this.active.id);
    });
    this.derivationObserver.observe(this.dom.info, { childList: true, subtree: true });
    for (const lesson of lessons) this.byId.set(lesson.id, lesson);
    this.buildNav();
    this.bindGlobalControls();
    this.filterNav();
  }

  start(id = this.lessons[0]?.id): void {
    const target = this.lessons.some((lesson) => lesson.id === id)
      ? id
      : this.lessons[0]?.id;
    if (target) this.select(target, true, true);
  }

  /** The currently mounted lesson (used by automated tests to introspect state). */
  get activeLesson(): Lesson | null {
    return this.active;
  }

  /** Programmatically switch lessons (used by tests). */
  selectById(id: string): void {
    this.select(id);
  }

  next(): void {
    this.selectRelative(1);
  }

  previous(): void {
    this.selectRelative(-1);
  }

  private buildNav(): void {
    const groups = new Map<string, Lesson[]>();
    for (const lesson of this.lessons) {
      const list = groups.get(lesson.category) ?? [];
      list.push(lesson);
      groups.set(lesson.category, list);
    }

    let n = 0;
    for (const [category, lessons] of groups) {
      const header = document.createElement("div");
      header.className = "nav-section";
      header.textContent = category;
      this.dom.nav.appendChild(header);

      for (const lesson of lessons) {
        n += 1;
        this.order.set(lesson.id, n);
        const btn = document.createElement("button");
        btn.className = "nav-item";
        btn.type = "button";
        btn.innerHTML = `<span class="nav-title"><span class="nav-num">${n} · </span>${this.cleanTitle(lesson)}</span><span class="nav-blurb">${lesson.blurb}</span>`;
        btn.addEventListener("click", () => this.select(lesson.id));
        this.dom.nav.appendChild(btn);
        this.buttons.set(lesson.id, btn);
      }
    }
  }

  /** Strip any legacy "N · " numeric prefix so numbering has a single source of truth (the nav order). */
  private cleanTitle(lesson: Lesson): string {
    return lesson.title.replace(/^\d+\s*·\s*/, "");
  }

  /** Populate the learning-path bar: difficulty badge + clickable "Builds on" prerequisites. */
  private updateMeta(lesson: Lesson): void {
    const meta = this.dom.meta;
    meta.replaceChildren();

    const badge = document.createElement("span");
    badge.className = `meta-badge diff-${lesson.difficulty}`;
    badge.textContent = lesson.difficulty;
    meta.appendChild(badge);

    const prereq = document.createElement("span");
    prereq.className = "meta-prereq";
    const label = document.createElement("span");
    label.className = "meta-label";
    const known = lesson.prerequisites.filter((id) => this.byId.has(id));
    if (known.length === 0) {
      label.textContent = "Starting point — no prerequisites";
      prereq.appendChild(label);
    } else {
      label.textContent = "Builds on";
      prereq.appendChild(label);
      for (const id of known) {
        const target = this.byId.get(id)!;
        const link = document.createElement("button");
        link.type = "button";
        link.className = "meta-link";
        link.textContent = this.cleanTitle(target);
        link.addEventListener("click", () => this.select(id));
        prereq.appendChild(link);
      }
    }
    meta.appendChild(prereq);
  }

  private bindGlobalControls(): void {
    this.dom.info.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-derivation]");
      if (!button || !this.active) return;
      const derivation = derivationById(this.active.id, button.dataset.derivation ?? "");
      if (derivation) this.showDerivation(derivation);
    });

    this.dom.search.addEventListener("input", () => this.filterNav());
    this.dom.search.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.dom.search.value = "";
        this.filterNav();
        this.dom.search.blur();
      }
    });

    window.addEventListener("hashchange", () => {
      const id = location.hash.slice(1);
      if (id) this.select(id, false);
    });

    window.addEventListener("keydown", (event) => {
      if (this.isEditing(event.target)) return;
      if (event.key === "/") {
        event.preventDefault();
        this.dom.search.focus();
        this.dom.search.select();
      } else if (event.key === "]") {
        this.next();
      } else if (event.key === "[") {
        this.previous();
      }
    });
  }

  private filterNav(): void {
    const q = this.dom.search.value.trim().toLowerCase();
    let shown = 0;
    for (const lesson of this.lessons) {
      const text = `${lesson.title} ${lesson.blurb} ${lesson.id}`.toLowerCase();
      const visible = !q || text.includes(q);
      this.buttons.get(lesson.id)?.classList.toggle("hidden", !visible);
      if (visible) shown++;
    }
    this.dom.count.textContent = q ? `${shown} / ${this.lessons.length} shown` : `${this.lessons.length} lessons`;
  }

  private select(id: string, syncHash = true, replaceHash = false): void {
    const next = this.lessons.find((l) => l.id === id);
    if (!next || next === this.active) return;
    if (this.derivationDialog.open) this.derivationDialog.close();

    // Tear down previous lesson.
    if (this.active) this.active.exit();
    this.disposeWorld();
    this.gui?.destroy();

    // Reset stage to sensible defaults; lessons may override.
    this.viewport.setHelpers(true);
    this.viewport.frameCamera(
      new THREE.Vector3(6, 5, 9),
      new THREE.Vector3(0, 0, 0),
    );

    // Fresh GUI panel for the incoming lesson.
    this.gui = new GUI({ container: this.dom.guiHost, title: "Controls" });

    this.active = next;
    this.updateMeta(next);
    next.enter({
      viewport: this.viewport,
      gui: this.gui,
      setInfo: (html) => {
        this.dom.info.innerHTML = withFoundationContext(next, html);
        this.addFormulaDerivationControls(next.id);
        this.dom.info.querySelector("h2")?.setAttribute("tabindex", "-1");
      },
    });

    for (const [key, btn] of this.buttons) {
      btn.classList.toggle("active", key === id);
      btn.setAttribute("aria-current", key === id ? "page" : "false");
    }

    if (syncHash && location.hash.slice(1) !== id) {
      const url = `#${id}`;
      if (replaceHash) history.replaceState(null, "", url);
      else history.pushState(null, "", url);
    }
    this.resetReadingContext(next);
  }

  private showDerivation(derivation: FormulaDerivation): void {
    this.derivationDialog.replaceChildren();

    const heading = document.createElement("h2");
    heading.id = "derivation-dialog-title";
    heading.textContent = derivation.title;
    this.derivationDialog.setAttribute("aria-labelledby", heading.id);
    this.derivationDialog.appendChild(heading);

    const equation = document.createElement("p");
    equation.className = "derivation-equation";
    equation.textContent = derivation.equation;
    this.derivationDialog.appendChild(equation);

    if (derivation.diagram) {
      const figure = document.createElement("figure");
      figure.className = "derivation-diagram";
      figure.innerHTML = derivation.diagram.svg;
      const caption = document.createElement("figcaption");
      caption.textContent = derivation.diagram.description;
      figure.appendChild(caption);
      this.derivationDialog.appendChild(figure);
    }

    this.appendDerivationSection("Start with", derivation.startingPoint);

    const stepsHeading = document.createElement("h3");
    stepsHeading.textContent = "Derive it step by step";
    this.derivationDialog.appendChild(stepsHeading);
    const steps = document.createElement("ol");
    steps.className = "derivation-steps";
    for (const step of derivation.steps) {
      const item = document.createElement("li");
      const expression = document.createElement("code");
      expression.textContent = step.expression;
      const reason = document.createElement("span");
      reason.textContent = step.reason;
      item.append(expression, reason);
      steps.appendChild(item);
    }
    this.derivationDialog.appendChild(steps);

    this.appendDerivationSection("Result", derivation.result);
    if (derivation.assumptions) this.appendDerivationSection("Use this when", derivation.assumptions);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "course-btn";
    close.textContent = "Close";
    close.addEventListener("click", () => this.derivationDialog.close());
    this.derivationDialog.appendChild(close);
    this.derivationDialog.showModal();
  }

  private addFormulaDerivationControls(lessonId: string): void {
    const cards = this.dom.info.querySelectorAll<HTMLElement>(".formula[data-derivation]");
    cards.forEach((card) => {
      const id = card.dataset.derivation ?? "";
      const derivation = derivationById(lessonId, id);
      if (!derivation) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "formula-derive";
      button.dataset.derivation = id;
      button.setAttribute("aria-haspopup", "dialog");
      card.appendChild(button);
    });

    this.labelDerivationControls(lessonId);
  }

  private labelDerivationControls(lessonId: string): void {
    this.dom.info.querySelectorAll<HTMLButtonElement>(".formula-derive[data-derivation]").forEach((button) => {
      const id = button.dataset.derivation ?? "";
      if (button.dataset.derivationLabelled === id) return;
      const derivation = derivationById(lessonId, button.dataset.derivation ?? "");
      if (!derivation) return;
      button.textContent = `Derive: ${derivation.equation}`;
      button.setAttribute("aria-label", `Show derivation: ${derivation.title}`);
      button.dataset.derivationLabelled = id;
    });
  }

  private appendDerivationSection(title: string, content: string): void {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    heading.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    section.append(heading, paragraph);
    this.derivationDialog.appendChild(section);
  }

  private selectRelative(delta: number): void {
    if (!this.active || this.lessons.length === 0) return;
    const current = this.lessons.findIndex((lesson) => lesson === this.active);
    const next = (current + delta + this.lessons.length) % this.lessons.length;
    this.select(this.lessons[next].id);
  }

  private resetReadingContext(lesson: Lesson): void {
    document.title = `${lesson.title.replace(/^\d+\s*·\s*/, "")} — Vector Lab`;
    this.dom.info.parentElement?.scrollTo({ top: 0 });
    queueMicrotask(() => {
      this.dom.info.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    });
  }

  private isEditing(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el && (
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable
    );
  }

  /** Remove and dispose everything lessons mounted under viewport.world. */
  private disposeWorld(): void {
    const world = this.viewport.world;
    world.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) (mat as THREE.Material).dispose();
    });
    world.clear();
  }
}
