import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tryCompile1, type Fn1 } from "../math/expr";
import { derivative, secondDerivative, stationaryPoints } from "../math/calculus";
import { curveXY, updateCurveXY, marker, segment, tip } from "./helpers";
import { DIFF_CHAPTERS, DERIVATIVE_REFERENCE, type DiffChapter } from "./differentiationCourse";
import "./formulaDerivations/calculus";

/**
 * Lesson 12 — Differentiation (Zero → Hero).
 *
 * A guided course that builds the derivative from scratch: slope of a line →
 * average slope (the gold secant) → the limit (secant → green tangent) → the
 * derivative curve f'(x) (orange) → rules → the second derivative f''(x) (purple)
 * → stationary points (f'=0) → motion. A numbered chapter strip drives the scene;
 * every aid (secant, tangent, f', f'', critical-point markers) can also be toggled
 * by hand for free exploration.
 */
export class DifferentiationLesson implements Lesson {
  readonly id = "differentiation";
  readonly title = "12 · Differentiation";
  readonly blurb = "From slope to f′ — zero to hero";
  readonly category = "Calculus" as const;
  readonly difficulty = "Core" as const;
  readonly prerequisites = ["trig-functions"] as const;

  private group = new THREE.Group();
  private axes = new THREE.Group();
  private curve!: THREE.Line; // f(x) — blue
  private deriv!: THREE.Line; // f'(x) — orange
  private second!: THREE.Line; // f''(x) — purple
  private tangent!: THREE.Line; // green
  private secant!: THREE.Line; // gold
  private dot!: THREE.Mesh; // the point on the curve
  private secantDot!: THREE.Mesh; // the second point (x+h)
  private critMarkers: THREE.Mesh[] = [];
  private stopTick?: () => void;
  private setInfo!: (html: string) => void;
  private gui!: GUI;

  private f: Fn1 = Math.sin;
  private readonly chapters = DIFF_CHAPTERS;
  private chapter = 0;

  private readonly a = -6;
  private readonly b = 6;
  private readonly n = 400;
  private readonly params = {
    expr: "0.5*x + 1",
    x: 2,
    h: 2,
    m: 0.5,
    c: 1,
    sweep: false,
    showTangent: true,
    showSecant: false,
    showDerivative: false,
    showSecond: false,
    showCritical: false,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false); // flat 2D plot: hide the 3D floor grid + x/y/z gnomon
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 1.5, 13),
      new THREE.Vector3(0, 0.5, 0),
    );

    this.buildAxes();
    this.recompile();
    this.curve = curveXY(this.f, this.a, this.b, this.n, 0x5db4ff);
    this.deriv = curveXY((x) => derivative(this.f, x), this.a, this.b, this.n, 0xffa657);
    this.second = curveXY((x) => secondDerivative(this.f, x), this.a, this.b, this.n, 0xb392f0);
    this.tangent = segment(new THREE.Vector3(), new THREE.Vector3(), 0x5dff8f);
    this.secant = segment(new THREE.Vector3(), new THREE.Vector3(), 0xffd23f);
    this.dot = marker(0xffffff);
    this.secantDot = marker(0xffd23f, 0.1);
    this.group.add(
      this.axes, this.curve, this.deriv, this.second,
      this.tangent, this.secant, this.dot, this.secantDot,
    );

    this.buildControls();
    this.renderPanel();
    this.loadChapter(0);

    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  // --- GUI ---------------------------------------------------------------------

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "expr").name("f(x)"),
      "The curve to study. A formula in x, e.g. sin(x), x*x*x, exp(-x*x).")
      .onFinishChange(() => this.onEdit());
    tip(g.add(this.params, "x", this.a, this.b, 0.01).name("x (point)").listen(),
      "Slide the point along the curve. The tangent + slope update live.")
      .onChange(() => this.update());
    tip(g.add(this.params, "h", 0.05, 4, 0.05).name("secant gap h").listen(),
      "Gap to the second point. Shrink it toward 0 and the secant becomes the tangent.")
      .onChange(() => this.update());
    tip(g.add(this.params, "sweep").name("Auto-sweep x"),
      "Animate the point moving left-to-right by itself.");

    const line = g.addFolder("✏️ Build your own line  (y = m·x + c)");
    tip(line.add(this.params, "m", -3, 3, 0.1).name("slope  m").listen(),
      "How steep your line is. m = 0 is flat; bigger m tilts it up; negative m tilts it down.")
      .onChange(() => this.onLineChange());
    tip(line.add(this.params, "c", -5, 5, 0.1).name("intercept  c").listen(),
      "Where the line crosses x = 0 — its starting height. Slides the whole line up/down.")
      .onChange(() => this.onLineChange());
    line.open();

    const show = g.addFolder("Show / hide");
    const v = () => this.applyVisibility();
    tip(show.add(this.params, "showTangent").name("Tangent (green)").listen(), "The slope at the point.").onChange(v);
    tip(show.add(this.params, "showSecant").name("Secant (gold)").listen(), "The average-slope line through two points.").onChange(v);
    tip(show.add(this.params, "showDerivative").name("f′(x) (orange)").listen(), "The slope at every x, as a curve.").onChange(v);
    tip(show.add(this.params, "showSecond").name("f″(x) (purple)").listen(), "The slope of the slope — how the curve bends.").onChange(v);
    tip(show.add(this.params, "showCritical").name("Mark peaks/valleys").listen(), "Dots where f′(x)=0.").onChange(() => { this.rebuildCritical(); this.applyVisibility(); });
    show.open();
  }

  private updateDisplays(): void {
    this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
  }

  // --- Scene scaffolding -------------------------------------------------------

  private buildAxes(): void {
    const axisCol = 0x3b4252;
    const gridCol = 0x222831;
    // Faint unit gridlines.
    for (let gx = this.a; gx <= this.b; gx += 1) {
      this.axes.add(segment(new THREE.Vector3(gx, -5, 0), new THREE.Vector3(gx, 6, 0), gridCol));
    }
    for (let gy = -5; gy <= 6; gy += 1) {
      this.axes.add(segment(new THREE.Vector3(this.a, gy, 0), new THREE.Vector3(this.b, gy, 0), gridCol));
    }
    // Bold x and y axes.
    this.axes.add(segment(new THREE.Vector3(this.a, 0, 0), new THREE.Vector3(this.b, 0, 0), axisCol));
    this.axes.add(segment(new THREE.Vector3(0, -5, 0), new THREE.Vector3(0, 6, 0), axisCol));
  }

  // --- Course ------------------------------------------------------------------

  /** Render the static info panel once (course strip + lesson + live readout). */
  private renderPanel(): void {
    const chips = this.chapters
      .map((c, i) => `<button class="course-chapter" data-ch="${i}">
        <span class="course-num">${i + 1}</span>${c.title}</button>`)
      .join("");

    this.setInfo(`
      <h2>Differentiation</h2>
      <p>The <b>derivative</b> <code>f′(x)</code> is the <b>slope</b> of a graph — how fast it's
      changing at an instant. This course builds it from nothing: the slope of a line, then a
      curve, then the limit that defines it, then the shortcuts and what it's good for.</p>

      <div class="course">
        <h3>Zero → Hero course</h3>
        <p class="course-hint">Work through these in order. Each loads a curve and switches on the
        right pictures. <b>Read the note, drag the sliders, watch the readout.</b></p>
        <div class="course-chapters">${chips}</div>
        <div id="diff-lesson" class="course-lesson"></div>
        <div class="course-nav">
          <button id="diff-prev" class="course-btn ghost">‹ Prev</button>
          <span id="diff-progress" class="course-progress">—</span>
          <button id="diff-next" class="course-btn">Next ›</button>
        </div>
      </div>

      <div class="readout" id="diff-readout"></div>

      <details class="course" id="diff-reference">
        <summary>📚 Reference: table of derivatives, rules &amp; worked examples</summary>
        ${DERIVATIVE_REFERENCE}
      </details>

      <p class="example"><b>Free play:</b> type any <code>f(x)</code> in the controls (e.g.
      <code>x*sin(x)</code>) and use <b>Show / hide</b> to mix the tangent, secant, f′ and f″
      however you like.</p>`);

    const root = document.getElementById("info");
    if (!root) return;
    root.querySelectorAll<HTMLButtonElement>(".course-chapter").forEach((btn) => {
      btn.addEventListener("click", () => this.loadChapter(Number(btn.dataset.ch)));
    });
    root.querySelectorAll<HTMLButtonElement>(".deriv-try").forEach((btn) => {
      btn.addEventListener("click", () => this.loadFunction(btn.dataset.fx ?? "x"));
    });
    root.querySelector<HTMLButtonElement>("#diff-prev")
      ?.addEventListener("click", () => this.loadChapter(this.chapter - 1));
    root.querySelector<HTMLButtonElement>("#diff-next")
      ?.addEventListener("click", () => this.loadChapter(this.chapter + 1));
  }

  /** Load an arbitrary f(x) (from a reference "try" button): plot it with f′ shown. */
  private loadFunction(expr: string): void {
    this.params.expr = expr;
    this.params.showDerivative = true; // so the rule is visible (f vs f′)
    this.updateDisplays();
    this.onEdit();
  }

  private loadChapter(index: number): void {
    const i = Math.max(0, Math.min(this.chapters.length - 1, index));
    const c = this.chapters[i];
    this.chapter = i;
    this.params.expr = c.expr;
    this.params.x = c.x;
    this.params.h = c.h;
    this.params.sweep = false;
    this.params.showTangent = c.show.tangent;
    this.params.showSecant = c.show.secant;
    this.params.showDerivative = c.show.derivative;
    this.params.showSecond = c.show.second;
    this.params.showCritical = c.show.critical;
    this.updateDisplays();
    this.onEdit(); // recompile + redraw curves + critical points + readout
    this.refreshCourseUi();
    document.getElementById("diff-lesson")?.scrollIntoView({ block: "nearest" });
  }

  private refreshCourseUi(): void {
    document.querySelectorAll<HTMLElement>(".course-chapter").forEach((b, i) => {
      b.classList.toggle("active", i === this.chapter);
    });
    const c: DiffChapter = this.chapters[this.chapter];
    const lesson = document.getElementById("diff-lesson");
    if (lesson) lesson.innerHTML = `<div class="course-lesson-title">${this.chapter + 1} · ${c.title}</div>${c.lesson}`;
    const prog = document.getElementById("diff-progress");
    if (prog) prog.textContent = `${this.chapter + 1} / ${this.chapters.length}`;
    const prev = document.getElementById("diff-prev") as HTMLButtonElement | null;
    const next = document.getElementById("diff-next") as HTMLButtonElement | null;
    if (prev) prev.disabled = this.chapter === 0;
    if (next) next.disabled = this.chapter === this.chapters.length - 1;
  }

  // --- Maths plumbing ----------------------------------------------------------

  private recompile(): void {
    const r = tryCompile1(this.params.expr);
    if (r.fn) this.f = r.fn;
  }

  /** Drag slope/intercept → build the line y = m·x + c and treat it as the current f(x). */
  private onLineChange(): void {
    const m = Math.round(this.params.m * 10) / 10;
    const c = Math.round(this.params.c * 10) / 10;
    this.params.expr = `${m}*x + ${c}`;
    this.updateDisplays(); // reflect the new f(x) text in the GUI
    this.onEdit();
  }

  /**
   * If the current f(x) is itself a straight line, read its slope/intercept back into the
   * m/c sliders so "Build your own line" starts from the right place (e.g. on chapter 1).
   * Detected numerically: a line has a constant slope and f(0) = c.
   */
  private syncLineSlidersFromExpr(): void {
    const slopeAt = (x: number) => derivative(this.f, x);
    const m0 = slopeAt(-2);
    const m1 = slopeAt(2);
    const isLine = Number.isFinite(m0) && Number.isFinite(m1) && Math.abs(m0 - m1) < 1e-6;
    if (!isLine) return;
    const m = Math.round(m0 * 10) / 10;
    const c = Math.round(this.f(0) * 10) / 10;
    if (Math.abs(m) <= 3 && Math.abs(c) <= 5) {
      this.params.m = m;
      this.params.c = c;
    }
  }

  /** Called when f(x) changes (typed or via a chapter): redraw curves + markers. */
  private onEdit(): void {
    this.recompile();
    this.syncLineSlidersFromExpr();
    updateCurveXY(this.curve, this.f, this.a, this.b, this.n);
    updateCurveXY(this.deriv, (x) => derivative(this.f, x), this.a, this.b, this.n);
    updateCurveXY(this.second, (x) => secondDerivative(this.f, x), this.a, this.b, this.n);
    this.rebuildCritical();
    this.applyVisibility();
    this.update();
  }

  /** Find f'(x)=0 points and (re)place coloured markers: red = peak, green = valley. */
  private rebuildCritical(): void {
    for (const m of this.critMarkers) {
      this.group.remove(m);
      m.geometry.dispose();
    }
    this.critMarkers = [];
    if (!this.params.showCritical) return;
    const roots = stationaryPoints(this.f, this.a, this.b);
    for (const x of roots) {
      const y = this.f(x);
      if (!Number.isFinite(y) || Math.abs(y) > 50) continue;
      const isPeak = secondDerivative(this.f, x) < 0;
      const m = marker(isPeak ? 0xff7b72 : 0x7ee787, 0.16);
      m.position.set(x, y, 0);
      this.critMarkers.push(m);
      this.group.add(m);
    }
  }

  private applyVisibility(): void {
    this.tangent.visible = this.params.showTangent;
    this.secant.visible = this.params.showSecant;
    this.secantDot.visible = this.params.showSecant;
    this.deriv.visible = this.params.showDerivative;
    this.second.visible = this.params.showSecond;
    for (const m of this.critMarkers) m.visible = this.params.showCritical;
    this.update();
  }

  private tick(dt: number): void {
    if (!this.params.sweep) return;
    this.params.x += dt * 2;
    if (this.params.x > this.b) this.params.x = this.a;
    this.update();
  }

  /** Reposition the point, tangent, secant and refresh the live readout. */
  private update(): void {
    const x = this.params.x;
    const y = this.f(x);
    const m = derivative(this.f, x);
    this.dot.position.set(x, Number.isFinite(y) ? y : 0, 0);

    // Tangent: a short segment through the point with the true slope. Skip when the
    // function or its slope is non-finite (e.g. tan(x) near an asymptote) to avoid NaN verts.
    const half = 2.2;
    if (Number.isFinite(y) && Number.isFinite(m)) {
      this.tangent.visible = true;
      this.tangent.geometry.setFromPoints([
        new THREE.Vector3(x - half, y - m * half, 0),
        new THREE.Vector3(x + half, y + m * half, 0),
      ]);
    } else {
      this.tangent.visible = false;
    }

    // Secant: the chord from (x, f(x)) to (x+h, f(x+h)).
    const h = this.params.h;
    const x2 = x + h;
    const y2 = this.f(x2);
    this.secant.geometry.setFromPoints([
      new THREE.Vector3(x, y, 0),
      new THREE.Vector3(x2, Number.isFinite(y2) ? y2 : 0, 0),
    ]);
    this.secantDot.position.set(x2, Number.isFinite(y2) ? y2 : 0, 0);

    this.updateReadout(x, y, m, y2, h);
  }

  private updateReadout(x: number, y: number, m: number, y2: number, h: number): void {
    const el = document.getElementById("diff-readout");
    if (!el) return;
    const f = (v: number) => (Number.isFinite(v) ? v.toFixed(3) : "—");
    let rows = `
      <div><span>x  (goes in)</span><b>${f(x)}</b></div>
      <div><span>y = f(x)  (comes out)</span><b>${f(y)}</b></div>`;

    if (this.params.showSecant) {
      const avg = (y2 - y) / h;
      const gap = Math.abs(avg - m);
      rows += `
      <div><span>f(x+h), h=${f(h)}</span><b>${f(y2)}</b></div>
      <div><span class="vf-y">avg slope = Δy/h</span><b class="vf-y">${f(avg)}</b></div>
      <div><span class="vf-z">→ gap to true slope</span><b class="vf-z">${f(gap)}</b></div>`;
    }

    rows += `<div><span style="color:#5dff8f">f′(x) = true slope</span><b style="color:#5dff8f">${f(m)}</b></div>`;
    if (this.params.showSecond) {
      const s = secondDerivative(this.f, x);
      rows += `<div><span style="color:#b392f0">f″(x) = bend</span><b style="color:#b392f0">${f(s)}</b></div>`;
    }
    el.innerHTML = rows;
  }

  exit(): void {
    this.stopTick?.();
    for (const m of this.critMarkers) m.geometry.dispose();
    this.critMarkers = [];
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    this.axes = new THREE.Group();
  }
}
