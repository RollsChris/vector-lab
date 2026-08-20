import { ExperimentsView } from "./experiments/ExperimentsView";
import { InvestigationProgress } from "./progress";
import {
  INVESTIGATION_LESSONS,
  INVESTIGATION_STAGES,
  investigationLessonById,
  lessonOpensExperiments,
  stageForInvestigationId,
} from "./roadmap";
import {
  CLAIM_STATUS_BLURB,
  CLAIM_STATUS_LABEL,
  CLAIM_STATUSES,
  RH_EVIDENCE_CAVEAT,
} from "./status";
import type {
  InvestigationLesson,
  InvestigationReading,
  InvestigationRoute,
  InvestigationStage,
} from "./types";

export interface InvestigationDom {
  chrome: HTMLElement;
  stage: HTMLElement;
  panel: HTMLElement;
}

export interface InvestigationAppHooks {
  /** Push or replace the location hash for investigations routes. */
  setHash: (hash: string, replace?: boolean) => void;
  /** Notify shell chrome of the visible title. */
  onTitle: (title: string) => void;
}

/**
 * Investigations section: 100-lesson RH mastery roadmap + bounded Experiments workbench.
 * Uses .inv-* classes only — never .nav-item — so existing lesson e2e stays scoped.
 */
export class InvestigationApp {
  private readonly progress = new InvestigationProgress();
  private readonly buttons = new Map<number, HTMLButtonElement>();
  private readonly stageGroups = new Map<string, HTMLElement>();
  private readonly stageToggles = new Map<string, HTMLButtonElement>();
  private readonly experiments: ExperimentsView;
  private route: InvestigationRoute = "lessons";
  /** Unset until the user picks a lesson or we resume from progress. */
  private activeLessonId: number | null = null;
  private visible = false;

  private readonly progressHost = document.createElement("div");
  private readonly tabLessons: HTMLButtonElement;
  private readonly tabExperiments: HTMLButtonElement;
  private readonly nav = document.createElement("nav");
  private readonly count = document.createElement("div");
  private readonly live = document.createElement("div");

  constructor(
    private readonly dom: InvestigationDom,
    private readonly hooks: InvestigationAppHooks,
  ) {
    this.experiments = new ExperimentsView({ stage: dom.stage, panel: dom.panel });
    this.tabLessons = this.makeTab("Lessons", "lessons");
    this.tabExperiments = this.makeTab("Experiments", "experiments");
    this.buildChrome();
    this.progress.onChange(() => this.refreshProgressUi());
  }

  /** Show the section for a hash like `investigations` or `investigations/experiments`. */
  show(hash: string, replaceHash = false): void {
    this.visible = true;
    this.dom.chrome.hidden = false;
    this.dom.stage.hidden = false;
    this.dom.panel.hidden = false;

    // Panel inherits aria-live=polite from #panel — override for investigations.
    this.dom.panel.setAttribute("aria-live", "off");

    const route = parseInvestigationHash(hash);
    this.setRoute(route, replaceHash, /* fromHash */ true);
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.experiments.unmount();
    this.dom.chrome.hidden = true;
    this.dom.stage.hidden = true;
    this.dom.panel.hidden = true;
    this.dom.stage.replaceChildren();
    this.dom.panel.replaceChildren();
  }

  get isVisible(): boolean {
    return this.visible;
  }

  get currentRoute(): InvestigationRoute {
    return this.route;
  }

  /** Test helper. */
  get progressStore(): InvestigationProgress {
    return this.progress;
  }

  private makeTab(label: string, route: InvestigationRoute): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.role = "tab";
    btn.id = route === "lessons" ? "inv-tab-lessons" : "inv-tab-experiments";
    btn.className = "inv-tab";
    btn.dataset.route = route;
    btn.textContent = label;
    btn.setAttribute("aria-selected", "false");
    btn.addEventListener("click", () => this.setRoute(route, false, false));
    return btn;
  }

  private buildChrome(): void {
    this.dom.chrome.replaceChildren();
    this.dom.chrome.classList.add("inv-chrome");

    const intro = document.createElement("p");
    intro.className = "inv-chrome-intro";
    intro.textContent =
      "Personal RH mastery path — serious study tools, not a claim that this app proves the Riemann Hypothesis.";

    this.progressHost.className = "inv-path-progress";

    const tabs = document.createElement("div");
    tabs.className = "inv-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Investigations sections");
    tabs.append(this.tabLessons, this.tabExperiments);

    this.count.className = "inv-count";
    this.count.id = "inv-lessons-count";
    this.count.textContent = `${INVESTIGATION_LESSONS.length} lessons · 8 stages`;

    this.live.className = "inv-live-status";
    this.live.id = "inv-selection-status";
    this.live.setAttribute("role", "status");
    this.live.setAttribute("aria-live", "polite");
    this.live.setAttribute("aria-atomic", "true");

    this.nav.className = "inv-nav";
    this.nav.id = "inv-lessons-nav";
    this.nav.setAttribute("aria-label", "Investigation lessons by stage");
    this.buildNav();

    this.dom.stage.id = this.dom.stage.id || "investigations-stage";
    this.dom.panel.id = this.dom.panel.id || "investigations-panel";
    this.tabLessons.setAttribute("aria-controls", "investigations-stage");
    this.tabExperiments.setAttribute("aria-controls", "investigations-stage");

    this.dom.chrome.append(intro, this.progressHost, tabs, this.count, this.live, this.nav);
    this.refreshProgressUi();
  }

  private buildNav(): void {
    this.nav.replaceChildren();
    this.buttons.clear();
    this.stageGroups.clear();
    this.stageToggles.clear();

    for (const stage of INVESTIGATION_STAGES) {
      const group = document.createElement("div");
      group.className = "inv-nav-group";
      group.dataset.stageId = stage.id;
      group.dataset.open = "false";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "inv-nav-section";
      toggle.dataset.stageId = stage.id;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", `inv-stage-items-${stage.id}`);

      const title = document.createElement("span");
      title.className = "inv-nav-section-title";
      title.textContent = stage.title;

      const range = document.createElement("span");
      range.className = "inv-nav-section-range";
      range.textContent = `${stage.fromId}–${stage.toId}`;

      const goal = document.createElement("span");
      goal.className = "inv-nav-section-goal";
      goal.textContent = stage.goal;

      toggle.append(title, range, goal);
      toggle.addEventListener("click", () => {
        const open = group.dataset.open === "true";
        this.setStageOpen(stage.id, !open);
      });

      const items = document.createElement("div");
      items.className = "inv-nav-items";
      items.id = `inv-stage-items-${stage.id}`;
      items.hidden = true;

      for (const lesson of stage.lessons) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "inv-nav-item";
        btn.dataset.invId = String(lesson.id);

        const titleEl = document.createElement("span");
        titleEl.className = "inv-nav-title";
        const num = document.createElement("span");
        num.className = "inv-nav-num";
        num.textContent = `${lesson.id} · `;
        titleEl.append(num, document.createTextNode(lesson.title));

        const blurb = document.createElement("span");
        blurb.className = "inv-nav-blurb";
        blurb.textContent = lesson.concept;

        const check = document.createElement("span");
        check.className = "inv-nav-check";
        check.setAttribute("aria-hidden", "true");

        btn.append(titleEl, blurb, check);
        btn.addEventListener("click", () => this.selectLesson(lesson.id));
        items.append(btn);
        this.buttons.set(lesson.id, btn);
      }

      group.append(toggle, items);
      this.nav.append(group);
      this.stageGroups.set(stage.id, group);
      this.stageToggles.set(stage.id, toggle);
    }
  }

  private setStageOpen(stageId: string, open: boolean): void {
    const group = this.stageGroups.get(stageId);
    const toggle = this.stageToggles.get(stageId);
    if (!group || !toggle) return;
    group.dataset.open = open ? "true" : "false";
    group.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    const items = group.querySelector<HTMLElement>(".inv-nav-items");
    if (items) items.hidden = !open;
  }

  private openStageForLesson(lessonId: number): void {
    const stage = stageForInvestigationId(lessonId);
    if (!stage) return;
    for (const s of INVESTIGATION_STAGES) {
      this.setStageOpen(s.id, s.id === stage.id);
    }
    const group = this.stageGroups.get(stage.id);
    group?.classList.add("is-active-stage");
    for (const [id, g] of this.stageGroups) {
      if (id !== stage.id) g.classList.remove("is-active-stage");
    }
  }

  private selectLesson(id: number): void {
    const lesson = investigationLessonById(id);
    if (!lesson) return;
    this.activeLessonId = lesson.id;
    if (this.route !== "lessons") {
      this.setRoute("lessons", false, false);
      return;
    }
    this.renderLesson(lesson);
  }

  private setRoute(route: InvestigationRoute, replaceHash: boolean, fromHash: boolean): void {
    this.route = route;
    this.syncTabs(route);
    this.nav.hidden = route !== "lessons";
    this.count.hidden = route !== "lessons";
    this.live.hidden = route !== "lessons";

    // Only the main stage is the tabpanel; details panel is a labelled region.
    this.dom.stage.setAttribute("role", "tabpanel");
    const labelledBy = route === "lessons" ? "inv-tab-lessons" : "inv-tab-experiments";
    this.dom.stage.setAttribute("aria-labelledby", labelledBy);
    this.dom.panel.setAttribute("role", "region");
    this.dom.panel.setAttribute(
      "aria-label",
      route === "lessons" ? "Lesson study controls" : "Experiment controls",
    );
    this.dom.panel.removeAttribute("aria-labelledby");
    this.dom.panel.setAttribute("aria-live", "off");

    if (route === "experiments") {
      this.renderExperiments();
      if (!fromHash || location.hash.slice(1) !== "investigations/experiments") {
        this.hooks.setHash("investigations/experiments", replaceHash);
      }
      this.hooks.onTitle("Investigations · Experiments");
      return;
    }

    this.experiments.unmount();
    const lesson = this.resolveLesson();
    this.activeLessonId = lesson.id;
    this.renderLesson(lesson);
    if (!fromHash || !location.hash.slice(1).startsWith("investigations")) {
      this.hooks.setHash("investigations", replaceHash);
    } else if (location.hash.slice(1) === "investigations/experiments") {
      this.hooks.setHash("investigations", replaceHash);
    }
  }

  private syncTabs(route: InvestigationRoute): void {
    const lessonsActive = route === "lessons";
    this.tabLessons.classList.toggle("active", lessonsActive);
    this.tabExperiments.classList.toggle("active", !lessonsActive);
    this.tabLessons.setAttribute("aria-selected", lessonsActive ? "true" : "false");
    this.tabExperiments.setAttribute("aria-selected", lessonsActive ? "false" : "true");
  }

  /** Prefer in-session selection, else persisted lastVisited, else item 1. */
  private resolveLesson(): InvestigationLesson {
    if (this.activeLessonId != null) {
      const selected = investigationLessonById(this.activeLessonId);
      if (selected) return selected;
    }
    const resumed = investigationLessonById(this.progress.lastVisited ?? 1);
    return resumed ?? INVESTIGATION_LESSONS[0]!;
  }

  private renderLesson(lesson: InvestigationLesson): void {
    this.experiments.unmount();
    this.progress.recordVisit(lesson.id);
    this.activeLessonId = lesson.id;

    const stage = stageForInvestigationId(lesson.id);
    if (!stage) return;

    this.openStageForLesson(lesson.id);

    for (const [id, btn] of this.buttons) {
      const active = id === lesson.id;
      btn.classList.toggle("active", active);
      if (active) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    }

    this.dom.stage.replaceChildren(this.buildLessonStage(lesson, stage));
    this.dom.panel.replaceChildren(this.buildLessonPanel(lesson));

    // Focus stage for keyboard/SR without disruptive scroll jumping.
    this.dom.stage.tabIndex = -1;
    try {
      this.dom.stage.focus({ preventScroll: true });
    } catch {
      this.dom.stage.focus();
    }

    const stageIndex = INVESTIGATION_STAGES.findIndex((s) => s.id === stage.id) + 1;
    const indexInStage = lesson.id - stage.fromId + 1;
    const stageLen = stage.toId - stage.fromId + 1;
    this.live.textContent = `Lesson ${lesson.id} of 100. Stage ${stageIndex} of 8, item ${indexInStage} of ${stageLen}: ${lesson.title}.`;

    this.hooks.onTitle(`Investigations · ${lesson.id}. ${lesson.title}`);
    this.refreshProgressUi();
  }

  private buildLessonStage(lesson: InvestigationLesson, stage: InvestigationStage): HTMLElement {
    const root = document.createElement("article");
    root.className = "inv-lesson-stage";
    root.setAttribute("aria-labelledby", "inv-lesson-title");

    const surface = document.createElement("div");
    surface.className = "inv-lesson-surface";

    const stageIndex = INVESTIGATION_STAGES.findIndex((s) => s.id === stage.id) + 1;
    const indexInStage = lesson.id - stage.fromId + 1;
    const stageLen = stage.toId - stage.fromId + 1;

    const orient = document.createElement("header");
    orient.className = "inv-lesson-orientation";

    const kicker = document.createElement("p");
    kicker.className = "inv-kicker";
    kicker.textContent = `Stage ${stageIndex} / 8 · ${stage.title}`;

    const position = document.createElement("p");
    position.className = "inv-lesson-position";
    position.textContent = `Item ${lesson.id} / 100 · ${indexInStage} of ${stageLen} in this stage`;

    const stageOrient = document.createElement("p");
    stageOrient.className = "inv-stage-orientation";
    stageOrient.textContent = stage.orientation;

    orient.append(kicker, position, stageOrient);

    const prereqRow = document.createElement("div");
    prereqRow.className = "inv-prereq-row";
    const prereqLabel = document.createElement("span");
    prereqLabel.className = "inv-prereq-label";
    prereqLabel.textContent = lesson.prerequisites.length ? "Requires" : "Starting point";
    prereqRow.append(prereqLabel);
    if (lesson.prerequisites.length === 0) {
      const none = document.createElement("span");
      none.className = "inv-prereq-none";
      none.textContent = "No prerequisites";
      prereqRow.append(none);
    } else {
      for (const pid of lesson.prerequisites) {
        const pre = investigationLessonById(pid);
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "inv-prereq-chip";
        chip.textContent = pre ? `${pid}. ${pre.title}` : String(pid);
        chip.addEventListener("click", () => this.selectLesson(pid));
        prereqRow.append(chip);
      }
    }

    const h1 = document.createElement("h1");
    h1.id = "inv-lesson-title";
    h1.textContent = `${lesson.id}. ${lesson.title}`;

    const concept = document.createElement("p");
    concept.className = "inv-concept";
    const conceptL = document.createElement("b");
    conceptL.textContent = "Concept. ";
    concept.append(conceptL, document.createTextNode(lesson.concept));

    const explanation = document.createElement("section");
    explanation.className = "inv-section";
    explanation.append(
      heading("h2", "Key idea"),
      paragraph(lesson.explanation),
      paragraph(lesson.outcome, "inv-outcome"),
    );

    const why = document.createElement("section");
    why.className = "inv-section inv-why";
    why.append(heading("h2", "Why this matters for RH"), paragraph(lesson.whyItMatters));

    const taskSec = document.createElement("section");
    taskSec.className = "inv-section inv-task";
    taskSec.append(heading("h2", "Study task"), paragraph(lesson.task.prompt, "inv-task-prompt"));
    if (lesson.task.hint) {
      taskSec.append(detailsBlock("Hint", lesson.task.hint));
    }
    if (lesson.task.answer) {
      taskSec.append(detailsBlock("Worked outline", lesson.task.answer));
    }

    const readingsSec = document.createElement("section");
    readingsSec.className = "inv-section inv-readings";
    readingsSec.append(heading("h2", "Readings"));
    readingsSec.append(readingList("For this item", lesson.readings));
    readingsSec.append(readingList("Stage references", stage.readings));

    const caveat = document.createElement("p");
    caveat.className = "inv-caveat inv-caveat-inline";
    caveat.textContent = RH_EVIDENCE_CAVEAT;

    const nav = this.buildLessonNav(lesson);

    surface.append(
      orient,
      prereqRow,
      h1,
      concept,
      explanation,
      why,
      taskSec,
      readingsSec,
      caveat,
      nav,
    );
    root.append(surface);
    return root;
  }

  private buildLessonNav(lesson: InvestigationLesson): HTMLElement {
    const nav = document.createElement("nav");
    nav.className = "inv-lesson-nav";
    nav.setAttribute("aria-label", "Lesson sequence");

    const prev = investigationLessonById(lesson.id - 1);
    const next = investigationLessonById(lesson.id + 1);
    const nextOpen = INVESTIGATION_LESSONS.find(
      (l) => l.id > lesson.id && !this.progress.isComplete(l.id),
    );

    nav.append(
      navButton("Previous", prev ? `${prev.id}. ${prev.title}` : "None", !!prev, () => {
        if (prev) this.selectLesson(prev.id);
      }),
      navButton("Next", next ? `${next.id}. ${next.title}` : "None", !!next, () => {
        if (next) this.selectLesson(next.id);
      }),
      navButton(
        "Next uncompleted",
        nextOpen ? `${nextOpen.id}. ${nextOpen.title}` : "All later items studied",
        !!nextOpen,
        () => {
          if (nextOpen) this.selectLesson(nextOpen.id);
        },
      ),
    );
    return nav;
  }

  private buildLessonPanel(lesson: InvestigationLesson): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "inv-lesson-panel";

    const h2 = document.createElement("h2");
    h2.textContent = `${lesson.id}. ${lesson.title}`;
    panel.append(h2);

    const claimsTitle = document.createElement("h3");
    claimsTitle.textContent = "Claims";
    panel.append(claimsTitle);

    const claims = document.createElement("ul");
    claims.className = "inv-claims";
    for (const claim of lesson.claims) {
      const li = document.createElement("li");
      li.className = "inv-claim";
      li.append(statusBadge(claim.status), document.createTextNode(" " + claim.text));
      claims.append(li);
    }
    panel.append(claims);

    panel.append(statusLegend());

    const actions = document.createElement("div");
    actions.className = "inv-lesson-actions";
    const done = document.createElement("button");
    done.type = "button";
    done.className = "inv-complete-btn";
    const syncDone = (): void => {
      const complete = this.progress.isComplete(lesson.id);
      done.textContent = complete ? "Marked studied ✓" : "Mark as studied";
      done.classList.toggle("is-complete", complete);
    };
    syncDone();
    done.addEventListener("click", () => {
      this.progress.toggleComplete(lesson.id);
      syncDone();
    });
    actions.append(done);

    if (lessonOpensExperiments(lesson)) {
      const toExp = document.createElement("button");
      toExp.type = "button";
      toExp.className = "inv-link-btn";
      toExp.textContent = "Open Experiments";
      toExp.addEventListener("click", () => this.setRoute("experiments", false, false));
      actions.append(toExp);
    }
    panel.append(actions);

    const note = document.createElement("p");
    note.className = "inv-panel-note";
    note.textContent = "Study material is in the main stage. This panel tracks claims and progress.";
    panel.append(note);

    return panel;
  }

  private renderExperiments(): void {
    // Re-clicking the already-active Experiments tab must not detach mounted roots.
    if (this.experiments.isMounted) return;
    this.dom.stage.replaceChildren();
    this.dom.panel.replaceChildren();
    this.experiments.mount();
  }

  private refreshProgressUi(): void {
    const { done, total, percent } = this.progress.overall();
    this.progressHost.replaceChildren();
    const label = document.createElement("div");
    label.className = "path-progress-label";
    label.textContent = `Investigations · ${done} of ${total} (${percent}%)`;
    const track = document.createElement("div");
    track.className = "path-progress-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(total));
    track.setAttribute("aria-valuenow", String(done));
    track.setAttribute("aria-label", "Investigations progress");
    const fill = document.createElement("div");
    fill.className = "path-progress-fill";
    fill.style.width = `${percent}%`;
    track.append(fill);
    this.progressHost.append(label, track);

    for (const [id, btn] of this.buttons) {
      const complete = this.progress.isComplete(id);
      btn.classList.toggle("is-complete", complete);
      const check = btn.querySelector<HTMLElement>(".inv-nav-check");
      if (check) check.textContent = complete ? "✓" : "";
    }
  }
}

export function isInvestigationHash(hash: string): boolean {
  return hash === "investigations" || hash.startsWith("investigations/");
}

export function parseInvestigationHash(hash: string): InvestigationRoute {
  if (hash === "investigations/experiments" || hash.startsWith("investigations/experiments/")) {
    return "experiments";
  }
  return "lessons";
}

function heading(tag: "h2" | "h3", text: string): HTMLElement {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}

function paragraph(text: string, className?: string): HTMLParagraphElement {
  const p = document.createElement("p");
  if (className) p.className = className;
  p.textContent = text;
  return p;
}

function detailsBlock(summaryText: string, body: string): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "inv-details";
  const summary = document.createElement("summary");
  summary.textContent = summaryText;
  const p = document.createElement("p");
  p.textContent = body;
  details.append(summary, p);
  return details;
}

function readingList(title: string, readings: readonly InvestigationReading[]): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "inv-reading-group";
  const h = document.createElement("h3");
  h.textContent = title;
  wrap.append(h);
  const ul = document.createElement("ul");
  ul.className = "inv-reading-list";
  for (const reading of readings) {
    const li = document.createElement("li");
    if (reading.url) {
      const a = document.createElement("a");
      a.href = reading.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = reading.label;
      li.append(a);
    } else {
      const strong = document.createElement("span");
      strong.className = "inv-reading-label";
      strong.textContent = reading.label;
      li.append(strong);
    }
    if (reading.locator) {
      li.append(document.createTextNode(` — ${reading.locator}`));
    }
    ul.append(li);
  }
  wrap.append(ul);
  return wrap;
}

function navButton(
  label: string,
  detail: string,
  enabled: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "inv-seq-btn";
  btn.disabled = !enabled;
  const lab = document.createElement("span");
  lab.className = "inv-seq-label";
  lab.textContent = label;
  const det = document.createElement("span");
  det.className = "inv-seq-detail";
  det.textContent = detail;
  btn.append(lab, det);
  if (enabled) btn.addEventListener("click", onClick);
  return btn;
}

function statusBadge(status: keyof typeof CLAIM_STATUS_LABEL): HTMLElement {
  const span = document.createElement("span");
  span.className = `inv-status-badge inv-status-${status}`;
  span.dataset.status = status;
  span.textContent = CLAIM_STATUS_LABEL[status];
  span.title = CLAIM_STATUS_BLURB[status];
  return span;
}

function statusLegend(): HTMLElement {
  const details = document.createElement("details");
  details.className = "inv-status-legend";
  details.setAttribute("aria-label", "Claim status legend");
  const summary = document.createElement("summary");
  summary.textContent = "Status legend";
  details.append(summary);
  const list = document.createElement("ul");
  for (const status of CLAIM_STATUSES) {
    const li = document.createElement("li");
    li.append(statusBadge(status), document.createTextNode(" — " + CLAIM_STATUS_BLURB[status]));
    list.append(li);
  }
  details.append(list);
  return details;
}
