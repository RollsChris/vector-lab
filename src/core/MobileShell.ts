/**
 * Phone/tablet chrome: lesson drawer, learn sheet, prev/next, and touch-aware hints.
 * Desktop layout ignores these controls via CSS; this class still keeps state consistent.
 */
export class MobileShell {
  private navOpen = false;
  private panelOpen = false;
  private readonly mq = window.matchMedia("(max-width: 900px)");

  constructor(
    private readonly els: {
      navToggle: HTMLButtonElement;
      panelToggle: HTMLButtonElement;
      prevLesson: HTMLButtonElement;
      nextLesson: HTMLButtonElement;
      backdrop: HTMLElement;
      topbarLesson: HTMLElement;
      hint: HTMLElement;
      sidebar: HTMLElement;
      panel: HTMLElement;
    },
    private readonly actions: {
      previous: () => void;
      next: () => void;
    },
  ) {
    this.bind();
    this.syncHint();
    this.syncChrome();
  }

  /** Call after a lesson mounts so the top bar title stays current and drawers close. */
  onLessonSelected(title: string): void {
    this.els.topbarLesson.textContent = title;
    if (this.mq.matches) this.closeAll();
  }

  private bind(): void {
    this.els.navToggle.addEventListener("click", () => {
      if (this.navOpen) this.closeNav();
      else this.openNav();
    });
    this.els.panelToggle.addEventListener("click", () => {
      if (this.panelOpen) this.closePanel();
      else this.openPanel();
    });
    this.els.prevLesson.addEventListener("click", () => this.actions.previous());
    this.els.nextLesson.addEventListener("click", () => this.actions.next());
    this.els.backdrop.addEventListener("click", () => this.closeAll());

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (this.navOpen || this.panelOpen) {
        event.preventDefault();
        this.closeAll();
      }
    });

    const onMq = (): void => {
      if (!this.mq.matches) this.closeAll();
      this.syncHint();
      this.syncChrome();
    };
    this.mq.addEventListener("change", onMq);

    // Coarse pointer (most phones) gets the touch hint even on wide landscape tablets.
    window.matchMedia("(pointer: coarse)").addEventListener("change", () => this.syncHint());
  }

  private openNav(): void {
    this.panelOpen = false;
    this.navOpen = true;
    this.syncChrome();
    // Focus search once the drawer is open so the keyboard path matches desktop "/".
    // Skip autofocus on coarse pointers — popping the software keyboard over the list is noisy.
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

  private openPanel(): void {
    this.navOpen = false;
    this.panelOpen = true;
    this.syncChrome();
  }

  private closePanel(): void {
    this.panelOpen = false;
    this.syncChrome();
  }

  private closeAll(): void {
    this.navOpen = false;
    this.panelOpen = false;
    this.syncChrome();
  }

  private syncChrome(): void {
    const mobile = this.mq.matches;
    document.body.classList.toggle("nav-open", mobile && this.navOpen);
    document.body.classList.toggle("panel-open", mobile && this.panelOpen);

    this.els.navToggle.setAttribute("aria-expanded", String(mobile && this.navOpen));
    this.els.panelToggle.setAttribute("aria-expanded", String(mobile && this.panelOpen));
    this.els.navToggle.textContent = mobile && this.navOpen ? "Close" : "Lessons";
    this.els.panelToggle.textContent = mobile && this.panelOpen ? "Close" : "Learn";

    const anyOpen = mobile && (this.navOpen || this.panelOpen);
    this.els.backdrop.hidden = !anyOpen;
    document.body.classList.toggle("sheet-open", anyOpen);

    this.els.sidebar.toggleAttribute("aria-hidden", mobile && !this.navOpen);
    // Panel stays in a11y tree on desktop; on mobile only when open.
    if (mobile) this.els.panel.toggleAttribute("aria-hidden", !this.panelOpen);
    else this.els.panel.removeAttribute("aria-hidden");
  }

  private syncHint(): void {
    const touch =
      window.matchMedia("(pointer: coarse)").matches ||
      (this.mq.matches && window.matchMedia("(hover: none)").matches);
    const key = touch ? "hintTouch" : "hintDesktop";
    const fromDataset =
      key === "hintTouch" ? this.els.hint.dataset.hintTouch : this.els.hint.dataset.hintDesktop;
    if (fromDataset) this.els.hint.textContent = fromDataset;
  }
}
