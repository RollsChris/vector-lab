import type { TopicChange, TopicWorkspace } from "./TopicWorkspace";

/**
 * Phone/tablet chrome: library drawer, paged lesson sheet, animate dock, and
 * touch-aware hints. Desktop layout ignores overlays via CSS; this class still
 * keeps state consistent and relocates the gui host.
 */
export class MobileShell {
  private navOpen = false;
  private sheet: "closed" | "peek" | "full" = "closed";
  private controlsOpen = false;
  private readonly mq = window.matchMedia("(max-width: 900px)");

  constructor(
    private readonly els: {
      navToggle: HTMLButtonElement;
      controlsClose: HTMLButtonElement;
      prevLesson: HTMLButtonElement;
      nextLesson: HTMLButtonElement;
      backdrop: HTMLElement;
      topbarLesson: HTMLElement;
      hint: HTMLElement;
      sidebar: HTMLElement;
      panel: HTMLElement;
      panelHandle: HTMLElement;
      controlDock: HTMLElement;
      controlDockContent: HTMLElement;
      guiHost: HTMLElement;
      animatePanel: HTMLElement;
      info: HTMLElement;
      tabbarLesson: HTMLButtonElement;
    },
    private readonly actions: {
      previous: () => void;
      next: () => void;
    },
    private readonly workspace: TopicWorkspace,
  ) {
    this.relocateControls();
    this.bind();
    this.syncHint();
    this.syncChrome();
  }

  /** Call after a lesson mounts so the top bar title stays current. */
  onLessonSelected(title: string): void {
    this.els.topbarLesson.textContent = title;
    if (!this.mq.matches) return;
    const fromNav = this.navOpen;
    this.closeNav();
    if (fromNav) {
      this.workspace.setTab("lesson", "system");
      this.workspace.setPage("learn", "system");
      this.sheet = "full";
      this.controlsOpen = false;
      this.syncChrome();
    }
  }

  /** Disable the topic workspace while another app section owns the stage. */
  setControlsEnabled(enabled: boolean): void {
    this.workspace.setEnabled(enabled);
    if (!enabled) {
      this.controlsOpen = false;
      this.sheet = this.mq.matches ? "full" : "closed";
      this.syncChrome();
    }
  }

  private bind(): void {
    this.workspace.onChange((change) => this.onWorkspaceChange(change));

    this.els.tabbarLesson.addEventListener("click", () => {
      if (this.workspace.isEnabled || !this.mq.matches) return;
      this.navOpen = false;
      this.sheet = this.sheet === "full" ? "closed" : "full";
      this.syncChrome();
    });
    this.els.navToggle.addEventListener("click", () => {
      if (this.navOpen) this.closeNav();
      else this.openNav();
    });
    this.els.controlsClose.addEventListener("click", () => {
      this.controlsOpen = false;
      if (this.workspace.currentTab === "animate") {
        this.workspace.setTab("lesson", "system");
      }
      this.syncChrome();
    });
    this.els.prevLesson.addEventListener("click", () => this.actions.previous());
    this.els.nextLesson.addEventListener("click", () => this.actions.next());
    this.els.backdrop.addEventListener("click", () => {
      if (this.navOpen) {
        this.closeNav();
        return;
      }
      if (this.sheet === "full") {
        this.sheet = "peek";
        this.syncChrome();
      }
    });
    this.els.panelHandle.addEventListener("click", () => {
      if (!this.mq.matches) return;
      if (this.sheet === "full") this.sheet = "peek";
      else if (this.sheet === "peek") this.sheet = "closed";
      else this.sheet = "full";
      this.syncChrome();
    });
    this.els.info.addEventListener("click", (event) => {
      if (!this.mq.matches || this.sheet !== "full") return;
      const button = (event.target as HTMLElement).closest("button");
      if (!button || !this.els.info.contains(button)) return;
      this.sheet = "peek";
      this.syncChrome();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (this.navOpen || this.sheet !== "closed" || this.controlsOpen) {
        event.preventDefault();
        this.closeAll();
      }
    });

    const onMq = (): void => {
      if (!this.mq.matches) this.closeAll();
      this.relocateControls();
      this.syncHint();
      this.syncChrome();
    };
    this.mq.addEventListener("change", onMq);
    window.matchMedia("(pointer: coarse)").addEventListener("change", () => this.syncHint());
  }

  private onWorkspaceChange(change: TopicChange): void {
    if (!this.mq.matches || !this.workspace.isEnabled) {
      this.syncChrome();
      return;
    }
    if (change.source !== "user") {
      this.syncChrome();
      return;
    }
    this.navOpen = false;
    if (change.tab === "animate") {
      this.controlsOpen = true;
      if (this.sheet !== "peek") this.sheet = "peek";
    } else {
      this.controlsOpen = false;
      if (!change.tabChanged && !change.pageChanged && this.sheet === "full") this.sheet = "peek";
      else this.sheet = "full";
    }
    this.syncChrome();
  }

  private openNav(): void {
    this.navOpen = true;
    this.controlsOpen = false;
    this.sheet = "closed";
    if (this.workspace.currentTab === "animate") this.workspace.setTab("lesson", "system");
    this.syncChrome();
    if (!window.matchMedia("(pointer: coarse)").matches) {
      queueMicrotask(() => {
        const search = this.els.sidebar.querySelector<HTMLInputElement>("#lesson-search");
        search?.focus({ preventScroll: true });
      });
    }
  }

  private closeNav(): void {
    this.navOpen = false;
    this.syncChrome();
  }

  private closeAll(): void {
    this.navOpen = false;
    this.controlsOpen = false;
    this.sheet = "closed";
    if (this.workspace.currentTab === "animate") this.workspace.setTab("lesson", "system");
    this.syncChrome();
  }

  /** Keep lesson controls in the Animate pane on desktop and the dock on phones. */
  private relocateControls(): void {
    if (this.mq.matches) {
      this.els.controlDockContent.append(this.els.guiHost);
      return;
    }
    this.els.animatePanel.append(this.els.guiHost);
  }

  private syncChrome(): void {
    const mobile = this.mq.matches;
    const enabled = this.workspace.isEnabled;
    const full = mobile && this.sheet === "full";
    const peek = mobile && this.sheet === "peek";
    const controls = mobile && enabled && this.controlsOpen;

    document.body.classList.toggle("nav-open", mobile && this.navOpen);
    document.body.classList.toggle("panel-open", full);
    document.body.classList.toggle("panel-peek", peek);
    document.body.classList.toggle("controls-open", controls);
    document.body.classList.toggle("has-topic-tabbar", mobile);

    this.els.navToggle.setAttribute("aria-expanded", String(mobile && this.navOpen));
    this.els.navToggle.textContent = mobile && this.navOpen ? "Close" : "Lessons";

    const dim = mobile && (this.navOpen || full);
    this.els.backdrop.hidden = !dim;
    document.body.classList.toggle("sheet-open", dim);

    this.setHidden(this.els.sidebar, mobile && !this.navOpen);
    this.setHidden(this.els.panel, mobile && this.sheet === "closed");
    this.setHidden(this.els.controlDock, !controls);
  }

  private setHidden(element: HTMLElement, hidden: boolean): void {
    element.setAttribute("aria-hidden", String(hidden));
    element.toggleAttribute("inert", hidden);
  }

  private syncHint(): void {
    const touch =
      window.matchMedia("(pointer: coarse)").matches ||
      (this.mq.matches && window.matchMedia("(hover: none)").matches);
    const fromDataset = touch ? this.els.hint.dataset.hintTouch : this.els.hint.dataset.hintDesktop;
    if (fromDataset) this.els.hint.textContent = fromDataset;
  }
}
