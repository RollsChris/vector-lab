import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import {
  allAngleIds,
  computeParallelAngles,
  evaluateTheorem,
  formatDegrees,
  minCrossingSeparation,
  normal,
  separateFromLine,
  theoremPairs,
  type AngleId,
  type Corner,
  type ParallelAnglesResult,
  type TheoremKind,
} from "../math/parallelAngles";
import { createDragControls, marker, setSpriteText, textSprite } from "./helpers";

type Mode = TheoremKind;

type ModeGroup = "Parallel theorems" | "Always true" | "Converses";

interface ModeCfg {
  label: string;
  group: ModeGroup;
  hint: string;
  /** Short claim shown above the live verdict. */
  claim: string;
}

const MODES: Record<Mode, ModeCfg> = {
  corresponding: {
    label: "Corresponding",
    group: "Parallel theorems",
    hint: "Same corner at each crossing. Equal ⇔ lines parallel.",
    claim: "Corresponding angles are equal if and only if the lines are parallel.",
  },
  "alternate-interior": {
    label: "Alternate interior",
    group: "Parallel theorems",
    hint: "Opposite sides of the transversal, both between the lines. Equal ⇔ parallel.",
    claim: "Alternate interior angles are equal if and only if the lines are parallel.",
  },
  "alternate-exterior": {
    label: "Alternate exterior",
    group: "Parallel theorems",
    hint: "Opposite sides of the transversal, both outside the strip. Equal ⇔ parallel.",
    claim: "Alternate exterior angles are equal if and only if the lines are parallel.",
  },
  "co-interior": {
    label: "Co-interior",
    group: "Parallel theorems",
    hint: "Same side of the transversal, both interior. Sum to 180° ⇔ parallel.",
    claim: "Co-interior (same-side interior) angles sum to 180° if and only if the lines are parallel.",
  },
  "vertically-opposite": {
    label: "Vertically opposite",
    group: "Always true",
    hint: "Opposite corners at one crossing. Always equal — not evidence of parallelism.",
    claim: "Vertically opposite angles are equal at any crossing, parallel or not.",
  },
  adjacent: {
    label: "Adjacent / straight line",
    group: "Always true",
    hint: "Neighbouring corners on a straight line. Always sum to 180° — not evidence of parallelism.",
    claim: "Adjacent angles on a straight line sum to 180° at any crossing, parallel or not.",
  },
  "converse-corresponding": {
    label: "Converse · corresponding",
    group: "Converses",
    hint: "If corresponding angles match, the converse claims parallelism. Differing angles only mean the hypothesis is not met.",
    claim: "Converse: if corresponding angles are equal, then the lines are parallel.",
  },
  "converse-alternate-interior": {
    label: "Converse · alt. interior",
    group: "Converses",
    hint: "If alternate interior angles match, the converse claims parallelism. Differing angles only mean the hypothesis is not met.",
    claim: "Converse: if alternate interior angles are equal, then the lines are parallel.",
  },
};

const MODE_ORDER: Mode[] = [
  "corresponding",
  "alternate-interior",
  "alternate-exterior",
  "co-interior",
  "vertically-opposite",
  "adjacent",
  "converse-corresponding",
  "converse-alternate-interior",
];

const COL = {
  line1: 0x58a6ff,
  line2: 0x7ee787,
  transversal: 0xffa657,
  handle: 0xffd166,
  source: 0xffd166,
  pair: 0xd2a8ff,
  dim: 0x6e7681,
  interior: 0x388bfd,
  ok: 0x7ee787,
  bad: 0xff7b72,
  label: 0xe6edf3,
};

const LINE_HALF = 7.2;
const ARC_R = 0.72;
const BOX = { x: 6.4, y: 4.0 };

/**
 * Interactive parallel-lines lesson.
 *
 * Two lines and a transversal with draggable angle handles. Eight named corner
 * angles update live; each theorem mode highlights a source/pair and reports
 * whether the relation holds for the current figure. Converses only claim
 * parallelism when their hypothesis (matching angles) is met.
 */
export class ParallelLinesLesson implements Lesson {
  readonly id = "parallel-lines";
  readonly title = "Parallel Lines";
  readonly blurb = "Transversal theorems, live and draggable";
  readonly category = "Shape" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["geometry"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private dynamic = new THREE.Group();
  private labelRoot = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private stopDrag?: () => void;
  private previousRotate = true;

  private mode: Mode = "corresponding";
  /** Line 1 fixed horizontal; line 2 and transversal start parallel-friendly. */
  private line1Angle = 0;
  private line2Angle = 0;
  private transversalAngle = Math.PI / 3;
  private line1Offset = 2.15;
  private line2Offset = -2.15;
  /** Distance of the line-2 handle from its pivot; tracks the pointer while dragging. */
  private line2HandleRadius = 2.6;
  private transversalHandleRadius = 3.4;

  private anglesHidden = false;
  private prediction = "";
  private revealVerdict = false;

  /** Persistent angle labels — textures updated in place, never per-frame alloc of new sprites. */
  private angleLabels = new Map<AngleId, THREE.Sprite>();
  private lineLabels: THREE.Sprite[] = [];
  private lastLabelText = new Map<AngleId, string>();
  private lastLabelColor = new Map<AngleId, number>();

  private readonly infoClickHandler = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-pl]");
    if (!button) return;
    const action = button.dataset.pl ?? "";
    if (action.startsWith("mode:")) {
      const next = action.slice(5) as Mode;
      if (!MODES[next]) return;
      this.mode = next;
      this.prediction = "";
      this.revealVerdict = false;
      // Keep the learner's figure (including non-parallel) across mode changes.
      this.renderPanel();
      this.renderScene();
      return;
    }
    if (action === "reset-parallel") {
      this.line1Angle = 0;
      this.line2Angle = 0;
      this.transversalAngle = Math.PI / 3;
      this.line1Offset = 2.15;
      this.line2Offset = -2.15;
      this.line2HandleRadius = 2.6;
      this.transversalHandleRadius = 3.4;
      this.prediction = "";
      this.revealVerdict = false;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "skew") {
      // Keep the current L2 ∩ T pivot so the strip does not jump.
      const pivot = this.figure().intersection2 ?? { x: 0, y: this.line2Offset };
      this.line2Angle = 0.38;
      const n = normal(this.line2Angle);
      this.line2Offset = n.x * pivot.x + n.y * pivot.y;
      this.prediction = "";
      this.revealVerdict = false;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "hide-angles") {
      this.anglesHidden = true;
      this.revealVerdict = false;
      this.prediction = "";
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "reveal-angles") {
      this.anglesHidden = false;
      this.revealVerdict = true;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action.startsWith("predict:")) {
      this.prediction = action.slice(8);
      this.revealVerdict = true;
      this.anglesHidden = false;
      this.renderScene();
      this.updatePanel();
    }
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic, this.labelRoot);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 16), new THREE.Vector3(0, 0, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;

    this.buildStatic();
    // Handles: 0 = line2 angle, 1 = transversal angle.
    for (let i = 0; i < 2; i++) {
      const h = marker(COL.handle, 0.2);
      h.userData.handle = i === 0 ? "line2" : "transversal";
      this.handles.push(h);
      this.group.add(h);
    }

    for (const id of allAngleIds()) {
      const sprite = textSprite("—", COL.label, 0.3);
      sprite.visible = false;
      this.angleLabels.set(id, sprite);
      this.labelRoot.add(sprite);
    }
    const l1 = textSprite("L1", COL.line1, 0.36);
    const l2 = textSprite("L2", COL.line2, 0.36);
    const tr = textSprite("T", COL.transversal, 0.36);
    this.lineLabels = [l1, l2, tr];
    this.labelRoot.add(l1, l2, tr);

    this.stopDrag = createDragControls(ctx.viewport, this.handles, (index, point) => {
      this.onDrag(index, point);
    });

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
    this.labelRoot = new THREE.Group();
    this.handles = [];
    this.angleLabels = new Map();
    this.lineLabels = [];
    this.lastLabelText = new Map();
    this.lastLabelColor = new Map();
    this.viewport = undefined;
  }

  private onDrag(index: number, point: THREE.Vector3): void {
    const x = THREE.MathUtils.clamp(point.x, -BOX.x, BOX.x);
    const y = THREE.MathUtils.clamp(point.y, -BOX.y, BOX.y);
    const prev = {
      line2Angle: this.line2Angle,
      line2Offset: this.line2Offset,
      transversalAngle: this.transversalAngle,
      line2HandleRadius: this.line2HandleRadius,
      transversalHandleRadius: this.transversalHandleRadius,
    };

    if (index === 0) {
      // Pivot about the current L2 ∩ T crossing so the handle tracks the pointer.
      const figure = this.figure();
      const pivot = figure.intersection2 ?? { x: 0, y: this.line2Offset };
      const dx = x - pivot.x;
      const dy = y - pivot.y;
      const radius = Math.hypot(dx, dy);
      if (radius < 1e-4) return;
      let angle = Math.atan2(dy, dx);
      // Keep L2 clear of the transversal so the crossing stays on-screen.
      const minSep = minCrossingSeparation(this.line1Offset, LINE_HALF);
      angle = separateFromLine(angle, this.transversalAngle, minSep);
      this.line2Angle = angle;
      const n = normal(angle);
      this.line2Offset = n.x * pivot.x + n.y * pivot.y;
      this.line2HandleRadius = THREE.MathUtils.clamp(radius, 1.2, 4.5);
    } else {
      let angle = Math.atan2(y, x);
      const radius = Math.hypot(x, y);
      const sep1 = minCrossingSeparation(this.line1Offset, LINE_HALF);
      const sep2 = minCrossingSeparation(this.line2Offset, LINE_HALF);
      angle = separateFromLine(angle, this.line1Angle, sep1);
      angle = separateFromLine(angle, this.line2Angle, sep2);
      this.transversalAngle = angle;
      this.transversalHandleRadius = THREE.MathUtils.clamp(radius, 1.6, 5.0);
    }

    // If clamping still left a degenerate/out-of-view figure, revert the drag step.
    if (!this.figure().valid) {
      this.line2Angle = prev.line2Angle;
      this.line2Offset = prev.line2Offset;
      this.transversalAngle = prev.transversalAngle;
      this.line2HandleRadius = prev.line2HandleRadius;
      this.transversalHandleRadius = prev.transversalHandleRadius;
    }

    this.renderScene();
    this.updatePanel();
  }

  private figure(): ParallelAnglesResult {
    return computeParallelAngles({
      line1Angle: this.line1Angle,
      line2Angle: this.line2Angle,
      transversalAngle: this.transversalAngle,
      line1Offset: this.line1Offset,
      line2Offset: this.line2Offset,
      transversalThrough: { x: 0, y: 0 },
      visibleHalfLength: LINE_HALF,
    });
  }

  private buildStatic(): void {
    const grid = new THREE.GridHelper(16, 32, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.1;
    this.group.add(grid);
  }

  private renderScene(): void {
    this.disposeChildren(this.dynamic);
    const result = this.figure();
    const evalResult = evaluateTheorem(result, this.mode);

    this.drawLines(result);
    this.placeHandles(result);
    this.drawIntersections(result);
    this.drawAngleArcs(result, evalResult.pairs.map((p) => [p.pair.a, p.pair.b]).flat());
    this.updateAngleLabels(result, evalResult);
    this.placeLineLabels(result);
  }

  private drawLines(result: ParallelAnglesResult): void {
    const d1 = result.line1Dir;
    const d2 = result.line2Dir;
    const t = result.transversalDir;

    // Line points from offset * normal ± half * dir.
    const n1 = { x: -Math.sin(this.line1Angle), y: Math.cos(this.line1Angle) };
    const n2 = { x: -Math.sin(this.line2Angle), y: Math.cos(this.line2Angle) };
    const c1 = { x: n1.x * this.line1Offset, y: n1.y * this.line1Offset };
    const c2 = { x: n2.x * this.line2Offset, y: n2.y * this.line2Offset };

    this.segment(
      { x: c1.x - d1.x * LINE_HALF, y: c1.y - d1.y * LINE_HALF },
      { x: c1.x + d1.x * LINE_HALF, y: c1.y + d1.y * LINE_HALF },
      COL.line1,
      0.02,
    );
    this.segment(
      { x: c2.x - d2.x * LINE_HALF, y: c2.y - d2.y * LINE_HALF },
      { x: c2.x + d2.x * LINE_HALF, y: c2.y + d2.y * LINE_HALF },
      COL.line2,
      0.02,
    );
    this.segment(
      { x: -t.x * LINE_HALF, y: -t.y * LINE_HALF },
      { x: t.x * LINE_HALF, y: t.y * LINE_HALF },
      COL.transversal,
      0.025,
    );

    // Parallel tick marks when parallel.
    if (result.parallel && result.valid) {
      this.parallelTicks(c1, d1, COL.line1);
      this.parallelTicks(c2, d2, COL.line2);
    }
  }

  private parallelTicks(centre: { x: number; y: number }, dir: { x: number; y: number }, color: number): void {
    const n = { x: -dir.y, y: dir.x };
    const base = { x: centre.x + dir.x * 1.6, y: centre.y + dir.y * 1.6 };
    for (const s of [-0.12, 0.12]) {
      const a = { x: base.x + n.x * 0.22 + dir.x * s, y: base.y + n.y * 0.22 + dir.y * s };
      const b = { x: base.x - n.x * 0.22 + dir.x * s, y: base.y - n.y * 0.22 + dir.y * s };
      this.segment(a, b, color, 0.01);
    }
  }

  private placeHandles(result: ParallelAnglesResult): void {
    const i2 = result.intersection2 ?? { x: 0, y: this.line2Offset };
    const d2 = result.line2Dir;
    // Line-2 handle stays on the line at the radius last set by the pointer.
    this.handles[0].position.set(
      i2.x + d2.x * this.line2HandleRadius,
      i2.y + d2.y * this.line2HandleRadius,
      0.3,
    );
    const t = result.transversalDir;
    this.handles[1].position.set(
      t.x * this.transversalHandleRadius,
      t.y * this.transversalHandleRadius,
      0.3,
    );
  }

  private drawIntersections(result: ParallelAnglesResult): void {
    if (!result.valid || !result.intersection1 || !result.intersection2) return;
    for (const p of [result.intersection1, result.intersection2]) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xe6edf3 }),
      );
      m.position.set(p.x, p.y, 0.05);
      this.dynamic.add(m);
    }
  }

  private drawAngleArcs(result: ParallelAnglesResult, highlight: AngleId[]): void {
    if (!result.valid || !result.intersection1 || !result.intersection2) return;
    const highlighted = new Set(highlight);
    const pairs = theoremPairs(this.mode, result);
    const sourceIds = new Set(pairs.map((p) => p.a));
    const pairIds = new Set(pairs.map((p) => p.b));

    for (const id of allAngleIds()) {
      const corner = id.slice(3) as Corner;
      const isL1 = id.startsWith("L1");
      const centre = isL1 ? result.intersection1 : result.intersection2;
      const lineDir = isL1 ? result.line1Dir : result.line2Dir;
      const active = highlighted.has(id);
      if (this.anglesHidden && !active) continue;

      let color = COL.dim;
      if (active && sourceIds.has(id)) color = COL.source;
      else if (active && pairIds.has(id)) color = COL.pair;
      else if (active) color = COL.source;

      const opacity = active ? 1 : this.anglesHidden ? 0 : 0.35;
      if (opacity === 0) continue;
      this.drawCornerArc(centre, lineDir, result.transversalDir, corner, result.angles[id], color, opacity, active ? 0.02 : 0);
    }
  }

  private drawCornerArc(
    centre: { x: number; y: number },
    lineDir: { x: number; y: number },
    t: { x: number; y: number },
    corner: Corner,
    measure: number,
    color: number,
    opacity: number,
    z: number,
  ): void {
    if (!Number.isFinite(measure) || measure < 1e-4) return;
    const lineWest = t.x * lineDir.y - t.y * lineDir.x >= 0 ? lineDir : { x: -lineDir.x, y: -lineDir.y };
    const lineEast = { x: -lineWest.x, y: -lineWest.y };
    const north = { x: -t.x, y: -t.y };
    const south = t;

    let start: { x: number; y: number };
    let toward: { x: number; y: number };
    switch (corner) {
      case "NW":
        start = north;
        toward = lineWest;
        break;
      case "NE":
        start = north;
        toward = lineEast;
        break;
      case "SW":
        start = south;
        toward = lineWest;
        break;
      case "SE":
        start = south;
        toward = lineEast;
        break;
    }

    const a0 = Math.atan2(start.y, start.x);
    const a1 = Math.atan2(toward.y, toward.x);
    let sweep = a1 - a0;
    while (sweep <= -Math.PI) sweep += Math.PI * 2;
    while (sweep > Math.PI) sweep -= Math.PI * 2;
    // Prefer the wedge that matches `measure`.
    if (Math.abs(Math.abs(sweep) - measure) > Math.abs(Math.abs(sweep) - (Math.PI * 2 - measure)) && Math.abs(sweep) > 1e-6) {
      // If the short way doesn't match, the angle is the other direction — but corner
      // wedges are always the ≤π side between the two half-rays, so abs(sweep) should ≈ measure.
    }

    const pts: THREE.Vector3[] = [];
    const n = Math.max(6, Math.round((Math.abs(sweep) / Math.PI) * 24));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (sweep * i) / n;
      pts.push(
        new THREE.Vector3(centre.x + ARC_R * Math.cos(a), centre.y + ARC_R * Math.sin(a), z),
      );
    }
    this.dynamic.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
      ),
    );
  }

  private updateAngleLabels(result: ParallelAnglesResult, evalResult: ReturnType<typeof evaluateTheorem>): void {
    const pairs = theoremPairs(this.mode, result);
    const sourceIds = new Set(pairs.map((p) => p.a));
    const pairIds = new Set(pairs.map((p) => p.b));
    const highlight = new Set<AngleId>([...sourceIds, ...pairIds]);

    if (!result.valid || !result.intersection1 || !result.intersection2) {
      for (const sprite of this.angleLabels.values()) sprite.visible = false;
      return;
    }

    for (const id of allAngleIds()) {
      const sprite = this.angleLabels.get(id);
      if (!sprite) continue;
      const active = highlight.has(id);
      if (this.anglesHidden && !active) {
        sprite.visible = false;
        continue;
      }
      if (this.anglesHidden && active) {
        // Show position mark but hide the degree reading until reveal.
        const text = active ? "?" : "—";
        this.writeLabel(sprite, id, text, COL.dim);
        this.positionLabel(sprite, id, result);
        sprite.visible = true;
        continue;
      }

      const deg = formatDegrees(result.angles[id], 1);
      let color = COL.label;
      if (active && sourceIds.has(id)) color = COL.source;
      else if (active && pairIds.has(id)) color = COL.pair;
      else if (!active) color = COL.dim;

      // Dim non-focus labels slightly by leaving them visible but muted.
      this.writeLabel(sprite, id, deg, color);
      this.positionLabel(sprite, id, result);
      sprite.visible = true;
      sprite.material.opacity = active ? 1 : 0.55;
      sprite.material.transparent = true;
    }

    // evalResult reserved for future pair-error colouring on labels.
    void evalResult;
  }

  private writeLabel(sprite: THREE.Sprite, id: AngleId, text: string, color: number): void {
    if (this.lastLabelText.get(id) === text && this.lastLabelColor.get(id) === color) return;
    setSpriteText(sprite, text, color);
    this.lastLabelText.set(id, text);
    this.lastLabelColor.set(id, color);
  }

  private positionLabel(sprite: THREE.Sprite, id: AngleId, result: ParallelAnglesResult): void {
    if (!result.intersection1 || !result.intersection2) return;
    const corner = id.slice(3) as Corner;
    const isL1 = id.startsWith("L1");
    const centre = isL1 ? result.intersection1 : result.intersection2;
    const t = result.transversalDir;
    const lineDir = isL1 ? result.line1Dir : result.line2Dir;
    const lineWest = t.x * lineDir.y - t.y * lineDir.x >= 0 ? lineDir : { x: -lineDir.x, y: -lineDir.y };
    const lineEast = { x: -lineWest.x, y: -lineWest.y };
    const north = { x: -t.x, y: -t.y };
    const south = t;

    let a: { x: number; y: number };
    let b: { x: number; y: number };
    switch (corner) {
      case "NW":
        a = north;
        b = lineWest;
        break;
      case "NE":
        a = north;
        b = lineEast;
        break;
      case "SW":
        a = south;
        b = lineWest;
        break;
      case "SE":
        a = south;
        b = lineEast;
        break;
    }
    // Bisector of the two unit half-rays.
    const bx = a.x + b.x;
    const by = a.y + b.y;
    const len = Math.hypot(bx, by) || 1;
    const r = 1.15;
    sprite.position.set(centre.x + (bx / len) * r, centre.y + (by / len) * r, 0.2);
  }

  private placeLineLabels(result: ParallelAnglesResult): void {
    const [l1, l2, tr] = this.lineLabels;
    if (!l1 || !l2 || !tr) return;
    const d1 = result.line1Dir;
    const d2 = result.line2Dir;
    const t = result.transversalDir;
    const n1 = { x: -Math.sin(this.line1Angle), y: Math.cos(this.line1Angle) };
    const n2 = { x: -Math.sin(this.line2Angle), y: Math.cos(this.line2Angle) };
    l1.position.set(n1.x * this.line1Offset - d1.x * 5.2, n1.y * this.line1Offset - d1.y * 5.2 + 0.35, 0.2);
    l2.position.set(n2.x * this.line2Offset + d2.x * 5.2, n2.y * this.line2Offset + d2.y * 5.2 + 0.35, 0.2);
    tr.position.set(t.x * 5.0, t.y * 5.0 + 0.35, 0.2);
  }

  private segment(
    a: { x: number; y: number },
    b: { x: number; y: number },
    color: number,
    _width: number,
  ): void {
    this.dynamic.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(a.x, a.y, 0),
          new THREE.Vector3(b.x, b.y, 0),
        ]),
        new THREE.LineBasicMaterial({ color }),
      ),
    );
  }

  // ---- panel -------------------------------------------------------------

  private renderPanel(): void {
    const groups: ModeGroup[] = ["Parallel theorems", "Always true", "Converses"];
    const chapters = groups
      .map((group) => {
        const buttons = MODE_ORDER.filter((m) => MODES[m].group === group)
          .map((m) => {
            const active = m === this.mode;
            return `<button type="button" class="course-btn${active ? "" : " ghost"}" data-pl="mode:${m}" aria-pressed="${active}">${MODES[m].label}</button>`;
          })
          .join(" ");
        return `<div class="circle-mode-group"><span class="circle-mode-label">${group}</span><div class="course-chapters">${buttons}</div></div>`;
      })
      .join("");

    this.setInfo(`
      <h2>Parallel Lines</h2>
      <p>Two lines cut by a transversal make <b>eight angles</b>. Drag the yellow handles to
      tilt <b>line 2</b> or the <b>transversal</b>. Each theorem mode highlights a source angle
      and its partner, then checks the relation on the figure you drew. Converses only speak
      when their hypothesis (matching angles) is met.</p>

      <div class="course">
        <h3>Choose a theorem</h3>
        <div class="circle-mode-groups">${chapters}</div>
        <p class="course-hint" id="pl-hint"></p>
        <div class="course-chapters" style="margin-top:6px">
          <button type="button" class="course-btn ghost" data-pl="reset-parallel">Reset parallel</button>
          <button type="button" class="course-btn ghost" data-pl="skew">Make non-parallel</button>
        </div>
      </div>

      <div class="course">
        <h3 id="pl-claim-title">Live reading</h3>
        <p class="course-hint" id="pl-claim"></p>
        <div class="readout" id="pl-readout"></div>
        <div id="pl-status"></div>
        <p class="course-hint" id="pl-message"></p>
      </div>

      <div class="course">
        <h3>Predict, then reveal</h3>
        <p>Hide the degree labels, change the figure, predict whether the highlighted relation
        holds, then reveal the live verdict.</p>
        <div class="course-chapters">
          <button type="button" class="course-btn ghost" data-pl="hide-angles" id="pl-hide">Hide angles</button>
          <button type="button" class="course-btn ghost" data-pl="reveal-angles" id="pl-reveal">Reveal angles</button>
        </div>
        <div class="course-chapters" style="margin-top:8px">
          <button type="button" class="course-btn ghost" data-pl="predict:holds">Relation holds</button>
          <button type="button" class="course-btn ghost" data-pl="predict:fails">Relation fails</button>
          <button type="button" class="course-btn ghost" data-pl="predict:always">Always true (not about parallel)</button>
        </div>
        <p class="course-hint" id="pl-verdict"></p>
      </div>`);
    this.updatePanel();
  }

  private updatePanel(): void {
    const result = this.figure();
    const evaluation = evaluateTheorem(result, this.mode);
    const cfg = MODES[this.mode];

    const hint = document.getElementById("pl-hint");
    const claim = document.getElementById("pl-claim");
    const readout = document.getElementById("pl-readout");
    const status = document.getElementById("pl-status");
    const message = document.getElementById("pl-message");
    const verdict = document.getElementById("pl-verdict");
    const hideBtn = document.getElementById("pl-hide");
    const revealBtn = document.getElementById("pl-reveal");

    if (hint) hint.innerHTML = `<b>Drag:</b> ${cfg.hint}`;
    if (claim) claim.textContent = cfg.claim;

    if (readout) {
      if (!result.valid) {
        readout.innerHTML = `<div><span>Figure</span><b>invalid — ${result.reason ?? "degenerate"}</b></div>`;
      } else {
        const pairs = evaluation.pairs.slice(0, 2);
        const pairRows = pairs
          .map((p) => {
            const rel = p.pair.relation === "equal" ? "=" : "+";
            const rhs = p.pair.relation === "equal" ? formatDegrees(p.valueB) : `${formatDegrees(p.valueB)} = ${formatDegrees(p.valueA + p.valueB)}`;
            const left = `${p.pair.a.replace("L1-", "∠₁").replace("L2-", "∠₂")}`;
            const right = `${p.pair.b.replace("L1-", "∠₁").replace("L2-", "∠₂")}`;
            return `<div><span>${left} ${rel} ${right}</span><b>${formatDegrees(p.valueA)} ${p.pair.relation === "equal" ? "vs" : "+"} ${rhs}</b></div>`;
          })
          .join("");
        readout.innerHTML = [
          `<div><span>Lines</span><b>${result.parallel ? "parallel" : "not parallel"} · Δ ${formatDegrees(result.lineAngleDifference)}</b></div>`,
          `<div><span>L2 angle</span><b>${formatDegrees(this.line2Angle)}</b></div>`,
          `<div><span>Transversal</span><b>${formatDegrees(this.transversalAngle)}</b></div>`,
          pairRows,
        ].join("");
      }
    }

    if (status) {
      status.innerHTML = this.statusChips(result, evaluation);
    }
    if (message) message.textContent = evaluation.message;

    if (verdict) {
      verdict.textContent = this.predictionMessage(result, evaluation);
    }
    if (hideBtn) hideBtn.textContent = this.anglesHidden ? "Angles hidden" : "Hide angles";
    if (revealBtn) revealBtn.textContent = this.anglesHidden ? "Reveal angles" : "Reveal angles";
  }

  private statusChips(
    result: ParallelAnglesResult,
    evaluation: ReturnType<typeof evaluateTheorem>,
  ): string {
    const parallelChip = result.valid
      ? `<div class="theorem-check ${result.parallel ? "ok" : "bad"}" role="status" data-pl-chip="parallel">${result.parallel ? "✓" : "✗"} lines ${result.parallel ? "are parallel" : "are not parallel"}</div>`
      : `<div class="theorem-check bad" role="status" data-pl-chip="parallel">✗ ${result.reason ?? "invalid figure"} — drag a handle or reset</div>`;

    let relationChip: string;
    if (!result.valid) {
      relationChip = `<div class="theorem-check bad" role="status" data-pl-chip="relation">✗ no angle reading — recover by resetting or dragging back</div>`;
    } else if (this.mode.startsWith("converse")) {
      const st = evaluation.converseStatus;
      let tone = "bad";
      let mark = "✗";
      let label = "invalid";
      if (st === "supports-parallel") {
        tone = "ok";
        mark = "✓";
        label = "converse supports parallelism";
      } else if (st === "hypothesis-not-met") {
        tone = "neutral";
        mark = "·";
        label = "hypothesis not met — the converse makes no claim";
      } else if (st === "counterexample") {
        tone = "bad";
        mark = "✗";
        label = "counterexample — angles match but lines not parallel";
      } else if (st === "parallel-relation-fails") {
        tone = "bad";
        mark = "✗";
        label = "parallel but angles disagree";
      }
      relationChip = `<div class="theorem-check ${tone}" role="status" data-pl-chip="converse">${mark} ${label}</div>`;
    } else if (this.mode === "vertically-opposite" || this.mode === "adjacent") {
      relationChip = `<div class="theorem-check ${evaluation.relationHolds ? "ok" : "bad"}" role="status" data-pl-chip="relation">${evaluation.relationHolds ? "✓" : "✗"} ${
        this.mode === "vertically-opposite" ? "vertical angles equal" : "adjacent angles sum to 180°"
      } · not a parallel test</div>`;
    } else {
      relationChip = `<div class="theorem-check ${evaluation.relationHolds ? "ok" : "bad"}" role="status" data-pl-chip="relation">${evaluation.relationHolds ? "✓" : "✗"} angle relation ${evaluation.relationHolds ? "holds" : "fails"}</div>`;
    }

    return `${parallelChip}${relationChip}`;
  }

  private predictionMessage(
    result: ParallelAnglesResult,
    evaluation: ReturnType<typeof evaluateTheorem>,
  ): string {
    if (this.anglesHidden && !this.prediction) {
      return "Angles hidden — predict whether the highlighted relation holds, then reveal.";
    }
    if (!this.prediction && !this.revealVerdict) return "";
    if (!result.valid) {
      return "Figure is invalid (crossing left the visible segments) — drag back or press Reset parallel.";
    }

    const holds = evaluation.relationHolds;
    const always = this.mode === "vertically-opposite" || this.mode === "adjacent";
    const converse = this.mode.startsWith("converse");

    if (!this.prediction) {
      if (converse) {
        return `Live verdict: ${evaluation.message}`;
      }
      return `Live verdict: relation ${holds ? "holds" : "fails"} on this figure${always ? " (and would on any non-degenerate crossing)" : ""}.`;
    }

    let ok = false;
    let detail: string;
    if (always) {
      ok = this.prediction === "always" || (this.prediction === "holds" && holds);
      detail = holds
        ? "Correct theme: this relation is true at every crossing and does not prove parallelism."
        : "Unexpected failure on a vertical/straight pair — check for a degenerate figure.";
    } else if (this.prediction === "always") {
      ok = false;
      detail = "This mode is about parallelism (or its converse), not an always-true crossing identity.";
    } else if (this.prediction === "holds") {
      ok = holds;
      detail = holds
        ? converse
          ? "Yes — the hypothesis holds, so the converse claims the lines are parallel."
          : "Yes — the highlighted relation holds on the current figure."
        : converse
          ? "Not on this figure — the compared angles differ, so the converse makes no claim."
          : "Not on this figure — the highlighted angles do not match the theorem's claim.";
    } else {
      ok = !holds;
      detail = !holds
        ? converse
          ? "Yes — the relation fails, so the converse hypothesis is not met (not a counterexample)."
          : "Yes — the relation fails here while the lines are not parallel."
        : "The relation actually holds on this figure.";
    }

    return `${ok ? "✓" : "✗"} ${detail} Live: ${evaluation.message}`;
  }

  // ---- disposal ----------------------------------------------------------

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
