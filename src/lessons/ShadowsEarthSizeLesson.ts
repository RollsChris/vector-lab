import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { tip } from "./helpers";
import "./formulaDerivations/physics";

type SceneMode = "shadow" | "earth" | "transfer";

interface ShadowChapter {
  title: string;
  stickHeight: number;
  shadowLength: number;
  cityDistanceKm: number;
  scene: SceneMode;
  lesson: string;
}

interface DiagramRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CHAPTERS: ShadowChapter[] = [
  {
    title: "How shadows form",
    stickHeight: 1,
    shadowLength: 0.7,
    cityDistanceKm: 800,
    scene: "shadow",
    lesson: `
      <p><b>Light travels in straight lines.</b> A shadow forms where the stick blocks the yellow
      Sun rays. The dark strip starts at the stick's base and ends where the ray from the stick top
      reaches the ground.</p>
      <p><b>Example:</b> a lower Sun makes a flatter ray, so the same stick makes a longer shadow.</p>`,
  },
  {
    title: "Measure the Sun angle",
    stickHeight: 1,
    shadowLength: 0.126,
    cityDistanceKm: 800,
    scene: "shadow",
    lesson: `
      <p><b>Use a gnomon:</b> a straight vertical stick. Measure its height <code>h</code> and the
      shadow length <code>s</code>. Those two sides make the coloured right triangle.</p>
      <p><b>The angle from vertical</b> is <code>θ = atan(s / h)</code>. For a 1 m stick with a
      0.126 m shadow, <code>θ ≈ 7.2°</code>. A protractor measures the same purple arc.</p>`,
  },
  {
    title: "Two cities, same Sun",
    stickHeight: 1,
    shadowLength: 0.126,
    cityDistanceKm: 800,
    scene: "earth",
    lesson: `
      <p><b>Eratosthenes' trick:</b> at noon in Syene, the Sun was overhead, so a vertical stick had
      almost no shadow. At the same time in Alexandria, a stick had a shadow angle near
      <code>7.2°</code>.</p>
      <p><b>One Sun, one ray direction:</b> the yellow rays in both diagrams are parallel and use the
      same direction. At Syene the yellow ray lines up with local vertical; at Alexandria it misses
      local vertical by the purple angle.</p>`,
  },
  {
    title: "Why the angle transfers",
    stickHeight: 1,
    shadowLength: 0.126,
    cityDistanceKm: 800,
    scene: "transfer",
    lesson: `
      <p><b>It is the transversal rule for parallel lines.</b> It is not mainly the
      vertical-opposite-angle rule. When a transversal crosses two parallel lines, the matching
      corresponding angles are equal. You can also see the same equality as alternate interior angles.</p>
      <p><b>Apply that here:</b> the Alexandria Sun ray is parallel to the Syene Sun ray. But at Syene
      there is no shadow, so the Syene Sun ray is the same line as Syene's vertical/radius. That means
      <code>Alexandria Sun ray ∥ Syene radius</code>.</p>
      <p><b>The transversal</b> is Alexandria's vertical/radius. It crosses the Alexandria Sun ray at
      the stick, and it crosses Syene's radius at Earth's centre. By corresponding angles, the shadow
      angle at the stick equals the centre angle between the two radii.</p>
      <p><b>The little triangle</b> at Alexandria is the original stick-and-shadow measurement. It marks
      the first <code>θ</code>; the purple centre angle is the matching <code>θ</code>.</p>
      <p><b>Visual note:</b> the real <code>7.2°</code> angle is tiny, so this diagram spreads the two
      city positions apart while keeping the labels and calculation at the real angle.</p>`,
  },
  {
    title: "Scale up to Earth",
    stickHeight: 1,
    shadowLength: 0.126,
    cityDistanceKm: 800,
    scene: "earth",
    lesson: `
      <p><b>Now scale up:</b> the centre angle tells us what fraction of the whole circular Earth
      the city-to-city arc covers. If <code>7.2°</code> is the angle between the cities, it is
      <code>7.2 / 360 = 1/50</code> of a full circle.</p>
      <p><b>So:</b> Earth's circumference is about <code>city distance × 50</code>. With about
      <code>800 km</code> between the cities, that gives roughly <code>40,000 km</code>.</p>`,
  },
  {
    title: "Try your own data",
    stickHeight: 1.5,
    shadowLength: 0.5,
    cityDistanceKm: 800,
    scene: "earth",
    lesson: `
      <p><b>Your turn:</b> change the stick height, shadow length, and city distance. The app computes
      the angle, draws it on the stick triangle and Earth's centre, then scales the city distance
      around a full <code>360°</code> circle.</p>
      <p><b>Rule:</b> longer shadow means a bigger measured angle. Bigger measured angle means the
      known city distance is a larger slice of Earth, so the estimated circumference gets smaller.</p>`,
  },
];

export class ShadowsEarthSizeLesson implements Lesson {
  readonly id = "shadows-earth-size";
  readonly title = "21 · Shadows & Earth's Size";
  readonly blurb = "2D shadow geometry → Earth's radius";
  readonly category = "Physics" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["geometry", "circle-theorems"] as const;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private gui!: GUI;
  private setInfo!: (html: string) => void;
  private chapter = 0;
  private resizeObserver?: ResizeObserver;

  readonly params = {
    chapter: CHAPTERS[0].title,
    stickHeight: 1,
    shadowLength: 0.7,
    cityDistanceKm: 800,
    reset: () => this.loadChapter(0),
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera({ x: 0, y: 0, z: 12 }, { x: 0, y: 0, z: 0 });

    const host = ctx.viewport.renderer.domElement.parentElement;
    if (!host) throw new Error("Stage host was not found for the 2D shadow lesson.");
    this.canvas = document.createElement("canvas");
    this.canvas.className = "lesson-2d-canvas";
    this.canvas.setAttribute("aria-label", "2D diagram of shadow angle and Earth circumference");
    host.appendChild(this.canvas);

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Could not create 2D canvas context.");
    this.ctx = context;

    this.resizeObserver = new ResizeObserver(() => this.resizeAndDraw());
    this.resizeObserver.observe(host);

    this.buildControls();
    this.renderPanel();
    this.loadChapter(0);
  }

  private buildControls(): void {
    tip(
      this.gui.add(this.params, "chapter", CHAPTERS.map((chapter) => chapter.title)).name("Step"),
      "Load one of the shadow-to-Earth-size steps.",
    ).onChange((title: string) => {
      this.loadChapter(CHAPTERS.findIndex((chapter) => chapter.title === title));
    });
    tip(
      this.gui.add(this.params, "stickHeight", 0.3, 3, 0.05).name("Stick height h (m)").listen(),
      "The vertical stick height.",
    ).onChange(() => this.draw());
    tip(
      this.gui.add(this.params, "shadowLength", 0.02, 3, 0.01).name("Shadow length s (m)").listen(),
      "The measured shadow length on the ground.",
    ).onChange(() => this.draw());
    tip(
      this.gui.add(this.params, "cityDistanceKm", 100, 1500, 10).name("City distance (km)").listen(),
      "Distance along Earth's surface between the no-shadow city and the shadow city.",
    ).onChange(() => this.draw());
    tip(this.gui.add(this.params, "reset").name("Back to step 1"), "Return to the first shadow step.");
  }

  private loadChapter(index: number): void {
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, index));
    const chapter = CHAPTERS[next];
    this.chapter = next;
    this.params.chapter = chapter.title;
    this.params.stickHeight = chapter.stickHeight;
    this.params.shadowLength = chapter.shadowLength;
    this.params.cityDistanceKm = chapter.cityDistanceKm;
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.resizeAndDraw();
    this.refreshCourseUi();
  }

  compute() {
    const angleRad = Math.atan(this.params.shadowLength / this.params.stickHeight);
    const angleDeg = (angleRad * 180) / Math.PI;
    const circumferenceKm = this.params.cityDistanceKm * (360 / angleDeg);
    const radiusKm = circumferenceKm / (2 * Math.PI);
    const fractionOfEarth = angleDeg / 360;
    return { angleRad, angleDeg, circumferenceKm, radiusKm, fractionOfEarth };
  }

  private resizeAndDraw(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  private draw(): void {
    if (!this.ctx) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const ctx = this.ctx;
    const chapter = CHAPTERS[this.chapter];
    const c = this.compute();
    const ray = this.rayDirection();

    ctx.clearRect(0, 0, width, height);
    this.drawBackground(ctx, width, height);

    if (chapter.scene === "shadow") {
      this.drawShadowDiagram({ x: 42, y: 42, w: width - 84, h: height - 84 }, c, ray);
    } else if (chapter.scene === "transfer") {
      this.drawTransferProofDiagram({ x: 42, y: 42, w: width - 84, h: height - 84 }, c, ray);
    } else {
      this.drawEarthDiagram({ x: 42, y: 42, w: width - 84, h: height - 84 }, c, ray);
    }

    this.refreshReadout(c);
  }

  private rayDirection(): { x: number; y: number } {
    const length = Math.hypot(this.params.shadowLength, this.params.stickHeight);
    return {
      x: this.params.shadowLength / length,
      y: this.params.stickHeight / length,
    };
  }

  private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#101722");
    gradient.addColorStop(1, "#08111f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawShadowDiagram(
    rect: DiagramRect,
    c: ReturnType<ShadowsEarthSizeLesson["compute"]>,
    ray: { x: number; y: number },
  ): void {
    const ctx = this.ctx;
    const measuring = this.chapter > 0;
    this.panel(ctx, rect, `${this.chapter + 1}. ${CHAPTERS[this.chapter].title}`);
    ctx.save();
    this.clipPanel(ctx, rect);

    const groundY = rect.y + rect.h * 0.7;
    const baseX = rect.x + rect.w * 0.46;
    const scale = Math.min(rect.h * 0.3 / this.params.stickHeight, rect.w * 0.34 / Math.max(this.params.shadowLength, 0.35));
    const stickPx = this.params.stickHeight * scale;
    const shadowPx = this.params.shadowLength * scale;
    const base = { x: baseX, y: groundY };
    const top = { x: baseX, y: groundY - stickPx };
    const tip = { x: baseX + shadowPx, y: groundY };

    ctx.strokeStyle = "#6e7681";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rect.x + 32, groundY);
    ctx.lineTo(rect.x + rect.w - 32, groundY);
    ctx.stroke();

    const sunDist = (top.y - (rect.y + rect.h * 0.12)) / Math.max(ray.y, 0.4);
    this.drawSunBeam(ctx, ray, top, sunDist, [
      { x: baseX - 120, y: groundY },
      { x: top.x, y: top.y, stop: 0 },
      { x: tip.x, y: tip.y },
      { x: tip.x + 85, y: groundY },
    ], rect);

    if (measuring) {
      ctx.fillStyle = "rgba(121, 192, 255, 0.18)";
      ctx.strokeStyle = "#79c0ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = "#f0f6fc";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(top.x, top.y);
    ctx.stroke();

    ctx.strokeStyle = "#ff7b72";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y + 6);
    ctx.lineTo(tip.x, tip.y + 6);
    ctx.stroke();

    if (measuring) {
      this.arcByDirections(ctx, top, { x: 0, y: 1 }, ray, 44, "#d2a8ff");
      this.text(ctx, `θ = ${c.angleDeg.toFixed(1)}°`, top.x + 62, top.y + 44, "#d2a8ff", 18, "bold");
      this.text(ctx, "h", base.x - 24, (base.y + top.y) / 2, "#79c0ff", 18, "bold");
      this.text(ctx, "s", (base.x + tip.x) / 2, base.y + 34, "#ff7b72", 18, "bold");
      this.text(ctx, "θ = atan(s / h)", rect.x + 34, rect.y + rect.h - 34, "#c9d1d9", 17, "bold", "left");
    } else {
      this.text(ctx, "blocked light", top.x + 95, top.y + 24, "#c9d1d9", 17, "bold", "left");
      this.text(ctx, "shadow", (base.x + tip.x) / 2, base.y + 34, "#ff7b72", 18, "bold");
      this.text(ctx, "Shadow = ground the rays cannot reach", rect.x + rect.w / 2, rect.y + rect.h - 34, "#c9d1d9", 17, "bold");
    }
    ctx.restore();
  }

  private drawEarthDiagram(
    rect: DiagramRect,
    c: ReturnType<ShadowsEarthSizeLesson["compute"]>,
    ray: { x: number; y: number },
  ): void {
    const ctx = this.ctx;
    this.panel(ctx, rect, `${this.chapter + 1}. ${CHAPTERS[this.chapter].title}`);
    ctx.save();
    this.clipPanel(ctx, rect);

    const cx = rect.x + rect.w * 0.5;
    const cy = rect.y + rect.h * 0.72;
    const r = Math.min(rect.w, rect.h) * 0.29;
    const visualAngleRad = Math.max(c.angleRad, Math.PI / 4);
    const visualAngleDeg = (visualAngleRad * 180) / Math.PI;
    const showTransfer = this.chapter >= 3;
    const showScale = this.chapter >= 4;
    const syeneDown = ray;
    const syeneUp = { x: -syeneDown.x, y: -syeneDown.y };
    const alexDown = rotate(ray, -visualAngleRad);
    const alexUp = { x: -alexDown.x, y: -alexDown.y };
    const syene = { x: cx + syeneUp.x * r, y: cy + syeneUp.y * r };
    const alexandria = { x: cx + alexUp.x * r, y: cy + alexUp.y * r };

    ctx.fillStyle = "rgba(47, 129, 247, 0.2)";
    ctx.strokeStyle = "#2f81f7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const STICK = 54;
    const stickTopS = { x: syene.x + syeneUp.x * STICK, y: syene.y + syeneUp.y * STICK };
    const stickTopA = { x: alexandria.x + alexUp.x * STICK, y: alexandria.y + alexUp.y * STICK };

    // One Sun placed up-ray from Syene's gnomon, so the Syene ray comes straight out of the Sun and
    // the Alexandria ray is drawn parallel from the same wavefront — matching the shadow diagrams.
    const sunDist = (stickTopS.y - (rect.y + rect.h * 0.1)) / Math.max(ray.y, 0.4);
    this.drawSunBeam(ctx, ray, stickTopS, sunDist, [
      { x: stickTopS.x, y: stickTopS.y, stop: 7 },
      { x: stickTopA.x, y: stickTopA.y, stop: 7 },
    ], rect);

    // Radii from Earth's centre out to each city, then the vertical gnomon standing on the surface.
    this.line(ctx, cx, cy, syene.x, syene.y, "#79c0ff", 3);
    this.line(ctx, cx, cy, alexandria.x, alexandria.y, "#79c0ff", 3);
    this.line(ctx, syene.x, syene.y, stickTopS.x, stickTopS.y, "#f0f6fc", 5);
    this.line(ctx, alexandria.x, alexandria.y, stickTopA.x, stickTopA.y, "#f0f6fc", 5);

    this.surfaceArc(ctx, cx, cy, r + 12, syeneUp, alexUp, "#7ee787", 5);
    if (showTransfer) {
      this.arcByDirections(ctx, { x: cx, y: cy }, syeneUp, alexUp, 58, "#d2a8ff");
      this.arcByDirections(ctx, alexandria, ray, alexDown, 54, "#d2a8ff");
    }

    ctx.fillStyle = "#d2a8ff";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    this.cityDot(ctx, syene.x, syene.y);
    this.cityDot(ctx, alexandria.x, alexandria.y);

    // Label each city just outside its gnomon top, each pushed to its outer side so the
    // two names and the arc label never collide.
    const syeneOuter = syene.x >= alexandria.x;
    this.cityLabel(ctx, "Syene", stickTopS, !syeneOuter, rect);
    this.cityLabel(ctx, "Alexandria", stickTopA, syeneOuter, rect);
    if (showTransfer) {
      this.text(ctx, "Earth centre", cx, cy + 26, "#d2a8ff", 14, "bold");
      this.text(ctx, `${c.angleDeg.toFixed(1)}° real angle`, cx + 92, cy - 40, "#d2a8ff", 18, "bold");
    } else {
      this.text(ctx, "same Sun direction", rect.x + rect.w * 0.74, rect.y + 88, "#ffd166", 16, "bold");
    }
    const midDir = normalize({ x: syeneUp.x + alexUp.x, y: syeneUp.y + alexUp.y });
    this.text(ctx, `${this.params.cityDistanceKm.toFixed(0)} km arc`, cx + midDir.x * (r + 40), cy + midDir.y * (r + 40), "#7ee787", 15, "bold");
    if (showScale) {
      const multiplier = 360 / c.angleDeg;
      this.text(ctx, `${c.angleDeg.toFixed(1)}° / 360° = ${formatRatio(c.fractionOfEarth)} of Earth`, rect.x + rect.w / 2, rect.y + rect.h - 70, "#c9d1d9", 16, "bold");
      this.text(ctx, `${this.params.cityDistanceKm.toFixed(0)} km × ${multiplier.toFixed(1)} ≈ ${c.circumferenceKm.toFixed(0)} km`, rect.x + rect.w / 2, rect.y + rect.h - 42, "#7ee787", 18, "bold");
    } else if (visualAngleRad !== c.angleRad) {
      this.text(ctx, `spread visually to ${visualAngleDeg.toFixed(0)}°; maths uses real θ`, rect.x + rect.w / 2, rect.y + rect.h - 50, "#8b949e", 14, "bold");
    }
    ctx.restore();
  }

  private drawTransferProofDiagram(
    rect: DiagramRect,
    c: ReturnType<ShadowsEarthSizeLesson["compute"]>,
    ray: { x: number; y: number },
  ): void {
    const ctx = this.ctx;
    this.panel(ctx, rect, `${this.chapter + 1}. ${CHAPTERS[this.chapter].title}`);
    ctx.save();
    this.clipPanel(ctx, rect);

    const cx = rect.x + rect.w * 0.5;
    const cy = rect.y + rect.h * 0.73;
    const r = Math.min(rect.w, rect.h) * 0.28;
    const visualAngleRad = Math.max(c.angleRad, Math.PI / 4);
    const syeneDown = ray;
    const syeneUp = { x: -syeneDown.x, y: -syeneDown.y };
    const alexDown = rotate(ray, -visualAngleRad);
    const alexUp = { x: -alexDown.x, y: -alexDown.y };
    const syene = { x: cx + syeneUp.x * r, y: cy + syeneUp.y * r };
    const alexandria = { x: cx + alexUp.x * r, y: cy + alexUp.y * r };

    ctx.fillStyle = "rgba(47, 129, 247, 0.16)";
    ctx.strokeStyle = "#2f81f7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.line(ctx, cx, cy, syene.x, syene.y, "#ffd166", 8);
    this.line(ctx, cx, cy, syene.x, syene.y, "#79c0ff", 3);
    this.line(ctx, cx, cy, alexandria.x, alexandria.y, "#79c0ff", 4);

    this.line(ctx, syene.x - ray.x * 92, syene.y - ray.y * 92, syene.x + ray.x * 54, syene.y + ray.y * 54, "#ffd166", 4);
    this.line(ctx, alexandria.x, alexandria.y, alexandria.x + alexUp.x * 68, alexandria.y + alexUp.y * 68, "#f0f6fc", 5);
    this.drawAlexandriaShadowTriangle(alexandria, alexUp, ray, c);

    this.arcByDirections(ctx, { x: cx, y: cy }, syeneUp, alexUp, 64, "#d2a8ff");

    ctx.fillStyle = "#d2a8ff";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    this.cityDot(ctx, syene.x, syene.y);
    this.cityDot(ctx, alexandria.x, alexandria.y);

    this.drawParallelAngleRuleInset(rect.x + 70, rect.y + 72);
    const ruleX = rect.x + 350;
    this.text(ctx, "Parallel: Sun ray ∥ Syene radius", ruleX, rect.y + 90, "#ffd166", 14, "bold", "left");
    this.text(ctx, "Transversal: Alexandria radius", ruleX, rect.y + 120, "#79c0ff", 14, "bold", "left");
    this.text(ctx, "Corresponding: θ = θ", ruleX, rect.y + 150, "#d2a8ff", 14, "bold", "left");

    this.text(ctx, "Syene radius", syene.x - 58, syene.y - 24, "#ffd166", 15, "bold");
    this.text(ctx, "Alexandria radius", alexandria.x + 12, alexandria.y - 30, "#79c0ff", 15, "bold", "left");
    this.text(ctx, `centre θ = ${c.angleDeg.toFixed(1)}°`, alexandria.x + 86, alexandria.y + 30, "#d2a8ff", 17, "bold", "left");
    this.text(ctx, "same θ between radii", cx + 94, cy - 52, "#d2a8ff", 17, "bold", "left");
    this.text(ctx, "Same transversal + parallel lines => same θ.", rect.x + rect.w / 2, rect.y + rect.h - 42, "#c9d1d9", 18, "bold");

    ctx.restore();
  }

  private drawAlexandriaShadowTriangle(
    base: { x: number; y: number },
    verticalUp: { x: number; y: number },
    sunRay: { x: number; y: number },
    c: ReturnType<ShadowsEarthSizeLesson["compute"]>,
  ): void {
    const ctx = this.ctx;
    const stick = 52;
    const top = { x: base.x + verticalUp.x * stick, y: base.y + verticalUp.y * stick };
    const denom = sunRay.x * verticalUp.x + sunRay.y * verticalUp.y;
    const t = Math.abs(denom) > 0.01 ? -stick / denom : stick * 1.4;
    const tip = { x: top.x + sunRay.x * t, y: top.y + sunRay.y * t };
    const down = { x: -verticalUp.x, y: -verticalUp.y };

    ctx.fillStyle = "rgba(121, 192, 255, 0.16)";
    ctx.strokeStyle = "#79c0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(top.x, top.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this.line(ctx, base.x, base.y, top.x, top.y, "#f0f6fc", 6);
    this.line(ctx, base.x, base.y, tip.x, tip.y, "#ff7b72", 6);
    this.arrow(ctx, top.x - sunRay.x * 20, top.y - sunRay.y * 20, tip.x, tip.y, "#ffd166", 3);
    this.arcByDirections(ctx, top, sunRay, down, 24, "#d2a8ff");
    this.text(ctx, `measured θ`, top.x - 46, top.y + 26, "#d2a8ff", 14, "bold");
    this.text(ctx, `${c.angleDeg.toFixed(1)}°`, top.x - 42, top.y + 44, "#d2a8ff", 14, "bold");
  }

  private drawParallelAngleRuleInset(x: number, y: number): void {
    const ctx = this.ctx;
    const w = 260;
    const h = 112;
    ctx.save();
    ctx.fillStyle = "rgba(13, 17, 23, 0.82)";
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    this.text(ctx, "corresponding angles", x + w / 2, y + 18, "#c9d1d9", 14, "bold");
    this.line(ctx, x + 34, y + 45, x + 222, y + 45, "#ffd166", 4);
    this.line(ctx, x + 34, y + 79, x + 222, y + 79, "#ffd166", 4);
    this.line(ctx, x + 66, y + 96, x + 190, y + 30, "#79c0ff", 3);
    this.arcByDirections(ctx, { x: x + 159, y: y + 45 }, { x: -1, y: 0 }, { x: -0.88, y: 0.47 }, 22, "#d2a8ff");
    this.arcByDirections(ctx, { x: x + 95, y: y + 79 }, { x: 1, y: 0 }, { x: 0.88, y: -0.47 }, 22, "#d2a8ff");
    this.text(ctx, "θ", x + 130, y + 51, "#d2a8ff", 17, "bold");
    this.text(ctx, "θ", x + 123, y + 87, "#d2a8ff", 17, "bold");
    this.text(ctx, "parallel", x + 48, y + 37, "#ffd166", 12, "bold");
    this.text(ctx, "transversal", x + 205, y + 29, "#79c0ff", 12, "bold");
    this.text(ctx, "matching positions => equal θ", x + w / 2, y + h - 14, "#d2a8ff", 13, "bold");
    ctx.restore();
  }

  private panel(ctx: CanvasRenderingContext2D, rect: DiagramRect, title: string): void {
    ctx.fillStyle = "rgba(13, 17, 23, 0.72)";
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
    ctx.fill();
    ctx.stroke();
    this.text(ctx, title, rect.x + rect.w / 2, rect.y + 30, "#c9d1d9", 17, "bold");
  }

  private clipPanel(ctx: CanvasRenderingContext2D, rect: DiagramRect): void {
    this.roundRect(ctx, rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4, 12);
    ctx.clip();
  }

  private drawSun(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const gradient = ctx.createRadialGradient(x, y, 4, x, y, 32);
    gradient.addColorStop(0, "#fff4b3");
    gradient.addColorStop(1, "#ffb347");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    this.text(ctx, "Sun", x, y + 52, "#ffd166", 15, "bold");
  }

  // Places the Sun up-ray from `anchor` (so the anchor's own ray comes straight out of the Sun),
  // then fires a bundle of parallel rays. Every ray starts on the Sun's wavefront — the line through
  // the Sun perpendicular to `ray` — so all diagrams show one light source with consistent parallel
  // rays instead of loose strokes that look like they come from different directions.
  private drawSunBeam(
    ctx: CanvasRenderingContext2D,
    ray: { x: number; y: number },
    anchor: { x: number; y: number },
    sunDist: number,
    bright: Array<{ x: number; y: number; stop?: number }>,
    rect: DiagramRect,
    fillerCount = 1,
  ): { x: number; y: number } {
    const sun = { x: anchor.x - ray.x * sunDist, y: anchor.y - ray.y * sunDist };
    sun.x = Math.min(Math.max(sun.x, rect.x + 42), rect.x + rect.w - 42);
    sun.y = Math.min(Math.max(sun.y, rect.y + 60), rect.y + rect.h - 64);
    const perp = { x: -ray.y, y: ray.x };

    // Bright functional rays: each begins on the Sun's wavefront and lands on its target.
    for (const t of bright) {
      const along = (t.x - sun.x) * ray.x + (t.y - sun.y) * ray.y;
      const start = { x: t.x - ray.x * along, y: t.y - ray.y * along };
      const stop = t.stop ?? 8;
      this.arrow(ctx, start.x, start.y, t.x - ray.x * stop, t.y - ray.y * stop, "#ffd166", 3);
    }

    // Short faint filler rays either side of the Sun so the beam reads as a wide parallel front.
    const fillLen = Math.min(sunDist * 0.5, 74);
    for (let k = 1; k <= fillerCount; k++) {
      for (const s of [-1, 1]) {
        const a = { x: sun.x + perp.x * 22 * k * s, y: sun.y + perp.y * 22 * k * s };
        this.arrow(ctx, a.x, a.y, a.x + ray.x * fillLen, a.y + ray.y * fillLen, "rgba(255, 209, 102, 0.3)", 2);
      }
    }

    this.drawSun(ctx, sun.x, sun.y);
    return sun;
  }

  private cityDot(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = "#7ee787";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Place a city name just outside its gnomon top, flipping to the inner side if the
  // outer placement would run past the panel edge (keeps long names like "Alexandria" in view).
  private cityLabel(
    ctx: CanvasRenderingContext2D,
    name: string,
    topPt: { x: number; y: number },
    outerLeft: boolean,
    rect: DiagramRect,
  ): void {
    ctx.font = "bold 16px system-ui, sans-serif";
    const w = ctx.measureText(name).width;
    const pad = 16;
    const y = topPt.y - 8;
    let align: CanvasTextAlign;
    let x: number;
    if (outerLeft) {
      align = "right";
      x = topPt.x - 10;
      if (x - w < rect.x + pad) {
        align = "left";
        x = topPt.x + 12;
      }
    } else {
      align = "left";
      x = topPt.x + 10;
      if (x + w > rect.x + rect.w - pad) {
        align = "right";
        x = topPt.x - 12;
      }
    }
    this.text(ctx, name, x, y, "#7ee787", 16, "bold", align);
  }

  private surfaceArc(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    a: { x: number; y: number },
    b: { x: number; y: number },
    color: string,
    width: number,
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.atan2(a.y, a.x), Math.atan2(b.y, b.x), true);
    ctx.stroke();
  }

  private arcByDirections(
    ctx: CanvasRenderingContext2D,
    origin: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
    r: number,
    color: string,
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, r, Math.atan2(a.y, a.x), Math.atan2(b.y, b.x), true);
    ctx.stroke();
  }

  private arrow(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number,
  ): void {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(angle - 0.45) * 11, y2 - Math.sin(angle - 0.45) * 11);
    ctx.lineTo(x2 - Math.cos(angle + 0.45) * 11, y2 - Math.sin(angle + 0.45) * 11);
    ctx.closePath();
    ctx.fill();
  }

  private line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  private text(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string,
    size: number,
    weight = "normal",
    align: CanvasTextAlign = "center",
  ): void {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private renderPanel(): void {
    const chips = CHAPTERS.map((chapter, i) => `<button class="course-chapter" data-shadow-ch="${i}">
        <span class="course-num">${i + 1}</span>${chapter.title}</button>`)
      .join("");

    this.setInfo(`
      <h2>Shadows &amp; Earth's Size</h2>
      <p>This lesson uses a 2D canvas diagram: one Sun ray direction, one stick triangle, and one
      Earth circle. The point is to see the same angle move from the stick to Earth's centre.</p>

      <div class="formula" data-derivation="shadow-earth-size">
        <div class="formula-label">Shadow angle</div>
        <div class="formula-body">θ = atan(shadow length / stick height)</div>
        <div class="formula-note">Then Earth circumference ≈ city distance × 360 / θ.</div>
      </div>

      <div class="course">
        <h3>From shadow to Earth size</h3>
        <p class="course-hint">Step through slowly: yellow rays are parallel, white sticks are local
        verticals, blue lines are radii from Earth's centre.</p>
        <div class="course-chapters">${chips}</div>
        <div id="shadow-lesson" class="course-lesson"></div>
        <div class="course-nav">
          <button id="shadow-prev" class="course-btn ghost">‹ Prev</button>
          <span id="shadow-progress" class="course-progress">—</span>
          <button id="shadow-next" class="course-btn">Next ›</button>
        </div>
      </div>

      <div class="readout" id="shadow-readout"></div>
      <p class="example"><b>Try:</b> set <code>h = 1 m</code> and <code>s = 0.126 m</code>.
      The angle becomes about <code>7.2°</code>, which is one fiftieth of a circle.</p>`);

    const root = document.getElementById("info");
    if (!root) return;
    root.querySelectorAll<HTMLButtonElement>("[data-shadow-ch]").forEach((button) => {
      button.addEventListener("click", () => this.loadChapter(Number(button.dataset.shadowCh)));
    });
    root.querySelector<HTMLButtonElement>("#shadow-prev")
      ?.addEventListener("click", () => this.loadChapter(this.chapter - 1));
    root.querySelector<HTMLButtonElement>("#shadow-next")
      ?.addEventListener("click", () => this.loadChapter(this.chapter + 1));
  }

  private refreshCourseUi(): void {
    document.querySelectorAll<HTMLElement>("[data-shadow-ch]").forEach((button, i) => {
      button.classList.toggle("active", i === this.chapter);
    });
    const chapter = CHAPTERS[this.chapter];
    const lesson = document.getElementById("shadow-lesson");
    if (lesson) lesson.innerHTML = `<div class="course-lesson-title">${this.chapter + 1} · ${chapter.title}</div>${chapter.lesson}`;
    const progress = document.getElementById("shadow-progress");
    if (progress) progress.textContent = `${this.chapter + 1} / ${CHAPTERS.length}`;
    const prev = document.getElementById("shadow-prev") as HTMLButtonElement | null;
    const next = document.getElementById("shadow-next") as HTMLButtonElement | null;
    if (prev) prev.disabled = this.chapter === 0;
    if (next) next.disabled = this.chapter === CHAPTERS.length - 1;
    this.refreshReadout(this.compute());
  }

  private refreshReadout(c = this.compute()): void {
    const readout = document.getElementById("shadow-readout");
    if (!readout) return;
    readout.innerHTML = `
      <div><span>Stick height h</span><b>${this.params.stickHeight.toFixed(2)} m</b></div>
      <div><span>Shadow length s</span><b>${this.params.shadowLength.toFixed(3)} m</b></div>
      <div><span>Measured angle θ</span><b>${c.angleDeg.toFixed(2)}°</b></div>
      <div><span>Slice of Earth</span><b>${formatRatio(c.fractionOfEarth)} of a full circle</b></div>
      <div><span>Estimated circumference</span><b>${c.circumferenceKm.toFixed(0)} km</b></div>
      <div><span>Estimated radius</span><b>${c.radiusKm.toFixed(0)} km</b></div>`;
  }

  exit(): void {
    this.resizeObserver?.disconnect();
    this.canvas.remove();
  }
}

function rotate(v: { x: number; y: number }, angle: number): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

function normalize(v: { x: number; y: number }): { x: number; y: number } {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function formatRatio(value: number): string {
  if (value > 0.01) return `1/${(1 / value).toFixed(1)}`;
  return value.toFixed(4);
}
