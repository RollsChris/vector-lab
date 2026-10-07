import type { TopicChange, TopicWorkspace } from "./TopicWorkspace";

/**
 * Phone/tablet chrome: library drawer, lesson sheet, animate dock, and
 * touch-aware hints. Desktop layout ignores sheet classes; this class still
 * keeps state consistent and relocates the gui host.
 */
export class MobileShell {
  private navOpen = false;
  private sheet: "closed" | "half" | "full" = "closed";
  private controlsOpen = false;
  private readonly mq = window.matchMedia("(max-width: 900px)");
  private readonly landscapeMq = window.matchMedia(
    "(max-width: 900px) and (orientation: landscape) and (max-height: 500px)",
  );
  private readonly stage: HTMLElement;
  private handleDrag: { pointerId: number; x: number; y: number; height: number } | null = null;
  private stageTap: { pointerId: number; x: number; y: number; t: number } | null = null;

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
    this.stage = this.els.hint.closest("#stage") ?? this.els.hint;
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
      this.sheet = "closed";
      if (this.workspace.currentTab === "animate") {
        this.workspace.setTab("lesson", "system");
      }
      this.syncChrome();
    });
    this.els.prevLesson.addEventListener("click", () => this.actions.previous());
    this.els.nextLesson.addEventListener("click", () => this.actions.next());
    this.els.backdrop.addEventListener("click", () => {
      if (this.navOpen) this.closeNav();
    });
    this.bindHandleDrag();
    this.bindStageTap();
    this.els.info.addEventListener("click", (event) => {
      if (!this.mq.matches || this.sheet !== "full" || this.controlsOpen) return;
      const button = (event.target as HTMLElement).closest("button");
      if (!button || !this.els.info.contains(button)) return;
      this.sheet = "half";
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
      if (this.controlsOpen && !change.tabChanged) {
        this.controlsOpen = false;
        this.sheet = "closed";
        this.workspace.setTab("lesson", "system");
      } else {
        this.controlsOpen = true;
      }
    } else {
      this.controlsOpen = false;
      if (change.tabChanged || change.pageChanged || this.sheet === "closed") this.sheet = "full";
      else this.sheet = "closed";
    }
    this.syncChrome();
  }

  /** Portrait: drag the handle to resize; a short press keeps the full → half → closed cycle. */
  private bindHandleDrag(): void {
    const handle = this.els.panelHandle;
    handle.addEventListener("pointerdown", (event) => {
      if (!this.mq.matches || event.button !== 0) return;
      if (this.controlsOpen || this.sheet === "closed") return;
      this.handleDrag = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        height: this.els.panel.getBoundingClientRect().height,
      };
      if (this.landscapeMq.matches) return;
      this.els.panel.style.transition = "none";
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener("pointermove", (event) => {
      const drag = this.handleDrag;
      if (!drag || event.pointerId !== drag.pointerId || this.landscapeMq.matches) return;
      const moved = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
      if (moved < 8) return;
      const next = Math.max(0, Math.min(this.maxSheetHeight(), drag.height - (event.clientY - drag.y)));
      this.els.panel.style.height = `${next}px`;
      this.els.panel.style.maxHeight = `${next}px`;
    });
    handle.addEventListener("pointerup", (event) => this.endHandleDrag(event, false));
    handle.addEventListener("pointercancel", (event) => this.endHandleDrag(event, true));
  }

  private endHandleDrag(event: PointerEvent, cancelled: boolean): void {
    const drag = this.handleDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const moved = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
    const released = this.els.panel.getBoundingClientRect().height;
    this.handleDrag = null;
    this.clearPanelDragStyle();
    if (cancelled) {
      this.syncChrome();
      return;
    }
    if (moved < 8) {
      this.cycleSheet();
      return;
    }
    if (this.landscapeMq.matches) return;
    this.sheet = this.snapSheet(released);
    this.syncChrome();
  }

  private clearPanelDragStyle(): void {
    this.els.panel.style.height = "";
    this.els.panel.style.maxHeight = "";
    this.els.panel.style.transition = "";
  }

  private maxSheetHeight(): number {
    const top = document.getElementById("topbar")?.getBoundingClientRect().bottom ?? 0;
    const bottom = document.getElementById("topic-tabbar")?.getBoundingClientRect().top ?? window.innerHeight;
    return Math.max(0, bottom - top);
  }

  private snapSheet(height: number): "closed" | "half" | "full" {
    const half = window.innerHeight * 0.4;
    const full = window.innerHeight * 0.58;
    if (height < half / 2) return "closed";
    if (height < (half + full) / 2) return "half";
    return "full";
  }

  private cycleSheet(): void {
    if (this.sheet === "full") this.sheet = "half";
    else if (this.sheet === "half") this.sheet = "closed";
    else this.sheet = "full";
    this.syncChrome();
  }

  /** A tap (not an orbit drag) on the visible strip drops a full sheet to half. */
  private bindStageTap(): void {
    this.stage.addEventListener("pointerdown", (event) => {
      if (!this.mq.matches || this.sheet !== "full" || this.controlsOpen) return;
      this.stageTap = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        t: performance.now(),
      };
    });
    this.stage.addEventListener("pointerup", (event) => {
      const tap = this.stageTap;
      if (!tap || event.pointerId !== tap.pointerId) return;
      this.stageTap = null;
      const moved = Math.hypot(event.clientX - tap.x, event.clientY - tap.y);
      if (moved >= 8 || performance.now() - tap.t >= 300) return;
      if (!this.mq.matches || this.sheet !== "full" || this.controlsOpen) return;
      this.sheet = "half";
      this.syncChrome();
    });
    this.stage.addEventListener("pointercancel", (event) => {
      if (this.stageTap?.pointerId === event.pointerId) this.stageTap = null;
    });
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
    const controls = mobile && enabled && this.controlsOpen;
    const showPanel = mobile && !controls;

    document.body.classList.toggle("nav-open", mobile && this.navOpen);
    document.body.classList.toggle("panel-open", showPanel && this.sheet === "full");
    document.body.classList.toggle("panel-half", showPanel && this.sheet === "half");
    document.body.classList.toggle("controls-open", controls);
    document.body.classList.toggle("has-topic-tabbar", mobile);

    this.els.navToggle.setAttribute("aria-expanded", String(mobile && this.navOpen));
    this.els.navToggle.textContent = mobile && this.navOpen ? "Close" : "Lessons";

    const dim = mobile && this.navOpen;
    this.els.backdrop.hidden = !dim;
    document.body.classList.toggle("sheet-open", dim || (mobile && (this.sheet !== "closed" || controls)));

    this.setHidden(this.els.sidebar, mobile && !this.navOpen);
    this.setHidden(this.els.panel, mobile && (controls || this.sheet === "closed"));
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
