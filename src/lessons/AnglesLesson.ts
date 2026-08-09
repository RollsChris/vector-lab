import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import {
  angleFromPoint,
  arcPoints,
  computeAnglesLab,
  formatDegrees,
  sectorMidDegrees,
  unitFromDegrees,
  type AngleMode,
  type AnglesLabResult,
} from "../math/anglesLab";
import { createDragControls, marker, textSprite } from "./helpers";

const BOX = { x: 6.4, y: 4.0 };
const RAY_LEN = 5.4;

const COL = {
  base: 0x58a6ff,
  free: 0xffd166,
  free2: 0x7ee787,
  arc: 0x56d4dd,
  arc2: 0xd2a8ff,
  arc3: 0xffa657,
  ok: 0x7ee787,
  bad: 0xff7b72,
  dim: 0x6e7681,
  label: 0xe6edf3,
  handle: 0xffd166,
};

interface ModeCfg {
  label: string;
  hint: string;
  claim: string;
}

const MODES: Record<AngleMode, ModeCfg> = {
  complementary: {
    label: "Complementary",
    hint: "Two angles that fit a right angle. Drag the yellow arm; the partner fills to 90°.",
    claim: "Complementary angles sum to 90°.",
  },
  supplementary: {
    label: "Supplementary",
    hint: "Two angles that fit a straight angle. Drag the yellow arm; the partner fills to 180°.",
    claim: "Supplementary angles sum to 180°.",
  },
  "adjacent-straight": {
    label: "Adjacent on a line",
    hint: "Neighbouring angles on a straight line always sum to 180° — the line is the proof.",
    claim: "Adjacent angles on a straight line sum to 180°.",
  },
  "around-point": {
    label: "Around a point",
    hint: "Three sectors share a vertex. Drag both free arms; the three angles always total 360°.",
    claim: "Angles around a point sum to 360°.",
  },
  "vertically-opposite": {
    label: "Vertically opposite",
    hint: "Two lines cross. Drag the free line; opposite corners stay equal at every angle.",
    claim: "Vertically opposite angles are equal.",
  },
};

const MODE_ORDER: AngleMode[] = [
  "complementary",
  "supplementary",
  "adjacent-straight",
  "around-point",
  "vertically-opposite",
];

/**
 * Interactive angles lab — complementary, supplementary, around a point,
 * adjacent on a straight line, and vertically opposite pairs.
 */
export class AnglesLesson implements Lesson {
  readonly id = "angles";
  readonly title = "Angles";
  readonly blurb = "Complementary, opposite and full-turn angle facts";
  readonly category = "Shape" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["geometry"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private dynamic = new THREE.Group();
  private labels = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private stopDrag?: () => void;
  private previousRotate = true;

  private mode: AngleMode = "complementary";
  /** Free-arm angles in degrees from +x. */
  private handleAngles = [35, 200];
  private valuesHidden = false;
  private prediction = "";
  private revealVerdict = false;

  private readonly infoClickHandler = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-ang]");
    if (!button) return;
    const action = button.dataset.ang ?? "";
    if (action.startsWith("mode:")) {
      const next = action.slice(5) as AngleMode;
      if (!MODES[next]) return;
      this.mode = next;
      this.prediction = "";
      this.revealVerdict = false;
      this.valuesHidden = false;
      if (next === "around-point") {
        this.handleAngles = [70, 210];
      } else if (next === "complementary") {
        this.handleAngles = [35, 200];
      } else if (next === "vertically-opposite") {
        this.handleAngles = [50, 200];
      } else {
        this.handleAngles = [55, 200];
      }
      this.syncHandleCount();
      this.renderPanel();
      this.renderScene();
      return;
    }
    if (action === "reset") {
      this.handleAngles = this.mode === "around-point" ? [70, 210] : this.mode === "complementary" ? [35, 200] : [55, 200];
      this.prediction = "";
      this.revealVerdict = false;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "hide") {
      this.valuesHidden = true;
      this.revealVerdict = false;
      this.prediction = "";
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "reveal") {
      this.valuesHidden = false;
      this.revealVerdict = true;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action.startsWith("predict:")) {
      this.prediction = action.slice(8);
      this.revealVerdict = true;
      this.valuesHidden = false;
      this.renderScene();
      this.updatePanel();
    }
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic, this.labels);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 16), new THREE.Vector3(0, 0, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;

    this.buildGrid();
    this.syncHandleCount();
    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);
    this.renderPanel();
    this.renderScene();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopDrag = undefined;
    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
    this.dynamic = new THREE.Group();
    this.labels = new THREE.Group();
    this.handles = [];
    this.viewport = undefined;
  }

  private syncHandleCount(): void {
    const need = this.mode === "around-point" ? 2 : 1;
    while (this.handles.length > need) {
      const h = this.handles.pop()!;
      this.disposeObject(h);
    }
    while (this.handles.length < need) {
      const h = marker(COL.handle, 0.2);
      this.handles.push(h);
      this.group.add(h);
    }
    // Recreate drag controls with the current handle list.
    this.stopDrag?.();
    if (this.viewport) {
      this.stopDrag = createDragControls(this.viewport, this.handles, (index, point) => {
        this.onDrag(index, point);
      });
    }
  }

  private onDrag(index: number, point: THREE.Vector3): void {
    const x = THREE.MathUtils.clamp(point.x, -BOX.x, BOX.x);
    const y = THREE.MathUtils.clamp(point.y, -BOX.y, BOX.y);
    const raw = angleFromPoint({ x: 0, y: 0 }, { x, y });

    if (this.mode === "around-point") {
      this.handleAngles[index] = raw === 0 ? 0.5 : raw;
    } else if (this.mode === "complementary") {
      let a = raw;
      if (a > 90 && a < 270) a = a < 180 ? 89.5 : 0.5;
      if (a >= 270) a = 0.5;
      this.handleAngles[0] = Math.min(89.5, Math.max(0.5, a));
    } else if (this.mode === "vertically-opposite") {
      let a = raw % 180;
      if (a < 0) a += 180;
      this.handleAngles[0] = Math.min(175, Math.max(5, a === 0 ? 5 : a));
    } else {
      let a = raw;
      if (a > 180) a = 179.5;
      if (a < 0.5) a = 0.5;
      this.handleAngles[0] = a;
    }
    this.renderScene();
    this.updatePanel();
  }

  private figure(): AnglesLabResult {
    return computeAnglesLab(this.mode, this.handleAngles);
  }

  private buildGrid(): void {
    const grid = new THREE.GridHelper(16, 32, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.1;
    this.group.add(grid);
  }

  private renderScene(): void {
    this.disposeChildren(this.dynamic);
    this.disposeChildren(this.labels);
    const result = this.figure();
    const o = result.origin;

    if (this.mode === "vertically-opposite") {
      this.drawFullLine(result.rays[0], COL.base);
      this.drawFullLine(result.rays[1], COL.free);
    } else if (this.mode === "adjacent-straight" || this.mode === "supplementary") {
      this.drawFullLine(unitFromDegrees(0), COL.base);
      this.drawRay(o, result.rays[1], COL.free);
    } else if (this.mode === "complementary") {
      this.drawRay(o, unitFromDegrees(0), COL.base);
      this.drawRay(o, unitFromDegrees(90), COL.base);
      this.drawRay(o, result.rays[1], COL.free);
      // right-angle marker
      this.drawRightAngleMarker(o);
    } else {
      // around-point: three rays from origin
      const cols = [COL.base, COL.free, COL.free2];
      result.rays.forEach((dir, i) => this.drawRay(o, dir, cols[i % cols.length]));
    }

    this.drawArcs(result);
    this.placeHandles(result);
    this.drawVertex();
  }

  private drawVertex(): void {
    const v = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 20, 20),
      new THREE.MeshBasicMaterial({ color: COL.label }),
    );
    v.position.set(0, 0, 0.2);
    this.dynamic.add(v);
  }

  private drawRay(origin: { x: number; y: number }, dir: { x: number; y: number }, color: number): void {
    this.dynamic.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(origin.x, origin.y, 0),
          new THREE.Vector3(origin.x + dir.x * RAY_LEN, origin.y + dir.y * RAY_LEN, 0),
        ]),
        new THREE.LineBasicMaterial({ color }),
      ),
    );
  }

  private drawFullLine(dir: { x: number; y: number }, color: number): void {
    this.dynamic.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-dir.x * RAY_LEN, -dir.y * RAY_LEN, 0),
          new THREE.Vector3(dir.x * RAY_LEN, dir.y * RAY_LEN, 0),
        ]),
        new THREE.LineBasicMaterial({ color }),
      ),
    );
  }

  private drawRightAngleMarker(origin: { x: number; y: number }): void {
    const s = 0.35;
    const pts = [
      new THREE.Vector3(origin.x + s, origin.y, 0.05),
      new THREE.Vector3(origin.x + s, origin.y + s, 0.05),
      new THREE.Vector3(origin.x, origin.y + s, 0.05),
    ];
    this.dynamic.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: COL.dim })));
  }

  private drawArcs(result: AnglesLabResult): void {
    const colors = [COL.arc, COL.arc2, COL.arc3, COL.free];
    const radii = [1.15, 1.45, 1.75, 1.15];

    if (this.mode === "vertically-opposite") {
      const a = result.angles[0];
      this.addArc(0, a, radii[0], colors[0], result.angles[0], "α");
      this.addArc(a, 180, radii[1], colors[1], result.angles[1], "β");
      this.addArc(180, 180 + a, radii[0], colors[0], result.angles[2], "α");
      this.addArc(180 + a, 360, radii[1], colors[1], result.angles[3], "β");
      return;
    }

    if (this.mode === "around-point") {
      const sorted = [0, ...[this.handleAngles[0], this.handleAngles[1]].map((v) => ((v % 360) + 360) % 360)].sort(
        (x, y) => x - y,
      );
      // unique
      const unique = sorted.filter((v, i, a) => i === 0 || Math.abs(v - a[i - 1]) > 0.2);
      if (unique[0] !== 0) unique.unshift(0);
      const ends = [...unique, 360];
      for (let i = 0; i < ends.length - 1; i++) {
        const start = ends[i];
        const end = ends[i + 1];
        const sweep = end - start;
        if (sweep < 1) continue;
        this.addArc(start, end, radii[i % radii.length], colors[i % colors.length], sweep, "");
      }
      return;
    }

    // two-part modes
    const a = result.angles[0];
    const target = result.target;
    this.addArc(0, a, radii[0], colors[0], result.angles[0], "α");
    this.addArc(a, target, radii[1], colors[1], result.angles[1], "β");
  }

  private addArc(
    startDeg: number,
    endDeg: number,
    radius: number,
    color: number,
    value: number,
    name: string,
  ): void {
    const pts = arcPoints({ x: 0, y: 0 }, startDeg, endDeg, radius, 28);
    this.dynamic.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0.04))),
        new THREE.LineBasicMaterial({ color }),
      ),
    );
    if (this.valuesHidden) return;
    const mid = sectorMidDegrees(startDeg, endDeg);
    const d = unitFromDegrees(mid);
    const labelR = radius + 0.45;
    const text = name ? `${name} ${formatDegrees(value)}` : formatDegrees(value);
    const sprite = textSprite(text, color, 0.3);
    sprite.position.set(d.x * labelR, d.y * labelR, 0.3);
    this.labels.add(sprite);
  }

  private placeHandles(result: AnglesLabResult): void {
    if (this.mode === "around-point") {
      const a = unitFromDegrees(this.handleAngles[0]);
      const b = unitFromDegrees(this.handleAngles[1]);
      this.handles[0]?.position.set(a.x * 3.2, a.y * 3.2, 0.3);
      this.handles[1]?.position.set(b.x * 3.2, b.y * 3.2, 0.3);
      return;
    }
    if (this.mode === "vertically-opposite") {
      const d = result.rays[1];
      this.handles[0]?.position.set(d.x * 3.2, d.y * 3.2, 0.3);
      return;
    }
    const d = result.rays[1];
    this.handles[0]?.position.set(d.x * 3.2, d.y * 3.2, 0.3);
  }

  private renderPanel(): void {
    const buttons = MODE_ORDER.map((mode) => {
      const active = mode === this.mode;
      return `<button type="button" class="course-btn${active ? "" : " ghost"}" data-ang="mode:${mode}" aria-pressed="${active}">${MODES[mode].label}</button>`;
    }).join(" ");

    this.setInfo(`
      <h2>Angles</h2>
      <p>Every angle fact below is a <b>full-turn split</b> in disguise. Drag the yellow
      handle(s) and watch the highlighted arcs keep their total — 90°, 180° or 360° — while
      vertically opposite corners stay equal at every crossing.</p>

      <div class="course">
        <h3>Choose a relation</h3>
        <div class="course-chapters">${buttons}</div>
        <p class="course-hint" id="ang-hint"></p>
        <div class="course-chapters" style="margin-top:6px">
          <button type="button" class="course-btn ghost" data-ang="reset">Reset</button>
        </div>
      </div>

      <div class="course">
        <h3>Live reading</h3>
        <div class="pl-implication" id="ang-claim"></div>
        <div class="readout" id="ang-readout"></div>
        <p class="course-hint" id="ang-message"></p>
      </div>

      <div class="course">
        <h3>Predict, then reveal</h3>
        <p>Hide the degree labels, change the figure, predict whether the relation still holds, then reveal.</p>
        <div class="course-chapters">
          <button type="button" class="course-btn ghost" data-ang="hide">Hide values</button>
          <button type="button" class="course-btn ghost" data-ang="reveal">Reveal values</button>
        </div>
        <div class="course-chapters" style="margin-top:8px">
          <button type="button" class="course-btn ghost" data-ang="predict:holds">Relation holds</button>
          <button type="button" class="course-btn ghost" data-ang="predict:always">Always true for this setup</button>
        </div>
        <p class="course-hint" id="ang-verdict"></p>
      </div>`);
    this.updatePanel();
  }

  private updatePanel(): void {
    const result = this.figure();
    const cfg = MODES[this.mode];
    const hint = document.getElementById("ang-hint");
    const claim = document.getElementById("ang-claim");
    const readout = document.getElementById("ang-readout");
    const message = document.getElementById("ang-message");
    const verdict = document.getElementById("ang-verdict");

    if (hint) hint.innerHTML = `<b>Drag:</b> ${cfg.hint}`;
    if (claim) {
      const state = result.holds ? "follows" : "unmet";
      claim.innerHTML = `<span class="pl-implication-step" data-state="met"><small>Claim</small><b>${cfg.claim}</b></span>
        <span class="pl-implication-arrow">⇒</span>
        <span class="pl-implication-step" data-state="${state}"><small>Live</small><b>${result.holds ? "holds" : "broken"}</b></span>`;
    }
    if (readout) {
      if (this.valuesHidden && !this.revealVerdict) {
        readout.innerHTML = `<div><span>Values</span><b>hidden — make a prediction</b></div>`;
      } else if (this.mode === "vertically-opposite") {
        readout.innerHTML = [
          ["α (opposite pair)", formatDegrees(result.angles[0])],
          ["β (adjacent pair)", formatDegrees(result.angles[1])],
          ["α + β", formatDegrees(result.angles[0] + result.angles[1])],
        ]
          .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`)
          .join("");
      } else if (this.mode === "around-point") {
        readout.innerHTML = [
          ...result.angles.map((v, i) => [`Sector ${i + 1}`, formatDegrees(v)] as const),
          ["Total", formatDegrees(result.total)],
        ]
          .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`)
          .join("");
      } else {
        readout.innerHTML = [
          ["α", formatDegrees(result.angles[0])],
          ["β", formatDegrees(result.angles[1])],
          ["α + β", formatDegrees(result.total)],
          ["Target", formatDegrees(result.target)],
        ]
          .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`)
          .join("");
      }
    }
    if (message) message.textContent = result.message;
    if (verdict) {
      if (!this.prediction) {
        verdict.textContent = this.valuesHidden ? "Values hidden — predict before revealing." : "";
      } else if (this.prediction === "holds" || this.prediction === "always") {
        verdict.textContent = result.holds
          ? "Correct — for this setup the relation is locked in by the figure itself."
          : "The live figure no longer meets the claim — check the arcs.";
      } else {
        verdict.textContent = "";
      }
    }
  }

  private disposeChildren(group: THREE.Group): void {
    [...group.children].forEach((child) => this.disposeObject(child));
    group.clear();
  }

  private disposeGroup(group: THREE.Group): void {
    this.disposeChildren(group);
    group.parent?.remove(group);
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((item) => {
      const mesh = item as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((entry) => this.disposeMaterial(entry));
      else if (material) this.disposeMaterial(material);
    });
    object.parent?.remove(object);
  }

  private disposeMaterial(material: THREE.Material): void {
    (material as THREE.Material & { map?: THREE.Texture }).map?.dispose();
    material.dispose();
  }
}
