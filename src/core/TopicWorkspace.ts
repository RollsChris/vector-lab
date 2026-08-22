export type TopicTab = "lesson" | "animate";
export type LessonPage = "learn" | "practice";

export interface TopicChange {
  source: "user" | "system";
  tab: TopicTab;
  page: LessonPage;
  tabChanged: boolean;
  pageChanged: boolean;
}

/**
 * Shared Lesson / Animate workspace. Desktop and phone use the same tabs and
 * Learn | Practice pages. Mobile chrome (peek sheet, control dock) listens
 * for changes; this class does not own overlay height.
 */
export class TopicWorkspace {
  private tab: TopicTab = "lesson";
  private page: LessonPage = "learn";
  private enabled = true;
  private readonly mq = window.matchMedia("(max-width: 900px)");
  private readonly listeners = new Set<(change: TopicChange) => void>();

  constructor(
    private readonly els: {
      panelLesson: HTMLButtonElement;
      panelAnimate: HTMLButtonElement;
      tabbarLesson: HTMLButtonElement;
      tabbarAnimate: HTMLButtonElement;
      pageLearn: HTMLButtonElement;
      pagePractice: HTMLButtonElement;
      lessonPanel: HTMLElement;
      animatePanel: HTMLElement;
      learnPage: HTMLElement;
      practicePage: HTMLElement;
      tabbar: HTMLElement;
      desktopTabs: HTMLElement;
    },
  ) {
    this.bind();
    this.sync();
  }

  get currentTab(): TopicTab {
    return this.tab;
  }

  get currentPage(): LessonPage {
    return this.page;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  onChange(listener: (change: TopicChange) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setTab(tab: TopicTab, source: "user" | "system" = "system"): void {
    if (!this.enabled) return;
    const tabChanged = tab !== this.tab;
    this.tab = tab;
    this.sync();
    this.emit({ source, tab: this.tab, page: this.page, tabChanged, pageChanged: false });
  }

  setPage(page: LessonPage, source: "user" | "system" = "system"): void {
    if (!this.enabled) return;
    const tabChanged = this.tab !== "lesson";
    const pageChanged = page !== this.page;
    this.tab = "lesson";
    this.page = page;
    this.sync();
    this.emit({ source, tab: this.tab, page: this.page, tabChanged, pageChanged });
  }

  /** New topic: stay on the current tab, always land on Learn. */
  landOnLesson(): void {
    if (!this.enabled) return;
    const pageChanged = this.page !== "learn";
    this.page = "learn";
    this.sync();
    this.emit({ source: "system", tab: this.tab, page: this.page, tabChanged: false, pageChanged });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.tab = "lesson";
      this.page = "learn";
    }
    this.sync();
    this.emit({ source: "system", tab: this.tab, page: this.page, tabChanged: false, pageChanged: false });
  }

  private bind(): void {
    this.els.panelLesson.addEventListener("click", () => this.setTab("lesson", "user"));
    this.els.tabbarLesson.addEventListener("click", () => this.setTab("lesson", "user"));
    this.els.panelAnimate.addEventListener("click", () => this.setTab("animate", "user"));
    this.els.tabbarAnimate.addEventListener("click", () => this.setTab("animate", "user"));
    this.els.pageLearn.addEventListener("click", () => this.setPage("learn", "user"));
    this.els.pagePractice.addEventListener("click", () => this.setPage("practice", "user"));
    this.mq.addEventListener("change", () => this.sync());
  }

  private sync(): void {
    const lesson = this.tab === "lesson";
    const learn = this.page === "learn";
    const mobile = this.mq.matches;

    this.select(this.els.panelLesson, lesson);
    this.select(this.els.tabbarLesson, lesson);
    this.select(this.els.panelAnimate, !lesson);
    this.select(this.els.tabbarAnimate, !lesson);
    this.select(this.els.pageLearn, learn);
    this.select(this.els.pagePractice, !learn);

    const showLesson = lesson || mobile;
    const showAnimate = !lesson && !mobile;
    this.els.lessonPanel.classList.toggle("is-active", showLesson);
    this.els.animatePanel.classList.toggle("is-active", showAnimate);
    this.els.lessonPanel.hidden = !showLesson;
    this.els.animatePanel.hidden = !showAnimate;
    this.els.learnPage.hidden = !learn;
    this.els.practicePage.hidden = learn;
    this.els.learnPage.toggleAttribute("inert", !learn);
    this.els.practicePage.toggleAttribute("inert", learn);

    this.els.desktopTabs.hidden = !this.enabled;
    this.els.tabbarAnimate.hidden = !this.enabled;
    this.els.tabbarLesson.textContent = this.enabled ? "Lesson" : "Notes";
    this.els.tabbarLesson.disabled = false;
    this.els.tabbarLesson.setAttribute("aria-disabled", "false");
    for (const button of [this.els.panelLesson, this.els.panelAnimate, this.els.tabbarAnimate]) {
      button.disabled = !this.enabled;
      button.setAttribute("aria-disabled", this.enabled ? "false" : "true");
    }
  }

  private select(button: HTMLButtonElement, active: boolean): void {
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  }

  private emit(change: TopicChange): void {
    for (const listener of this.listeners) listener(change);
  }
}
