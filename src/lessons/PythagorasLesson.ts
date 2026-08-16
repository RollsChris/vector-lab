import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import {
  initialInteractionLoopState,
  reduceInteractionLoop,
  renderInteractionLoop,
  type InteractionLoopConfig,
  type InteractionLoopState,
} from "../core/InteractionLoop";
import {
  axisAlignedRightTriangle,
  computePythagoras,
  fourTriangleDissection,
  formatNumber,
  type Point,
  type PythagorasResult,
  type RightTriangle,
} from "../math/pythagoras";
import { createDragControls, marker, textSprite } from "./helpers";

const BOX = { x: 6.6, y: 4.0 };

const COL = {
  triangle: 0x58a6ff,
  right: 0xffd166,
  sqA: 0x56d4dd,
  sqB: 0x7ee787,
  sqC: 0xd2a8ff,
  ok: 0x7ee787,
  bad: 0xff7b72,
  handle: 0xffd166,
  dim: 0x6e7681,
  label: 0xe6edf3,
};

const INSIGHT_LOOP: InteractionLoopConfig = {
  title: "Make the rule happen",
  predictionPrompt: "Before seeing the areas, what do you expect for a right triangle?",
  predictions: [
    { value: "holds", label: "The two small squares match the large square" },
    { value: "fails", label: "The areas will be different" },
  ],
  manipulatePrompt:
    "Set a 3-4-5 right triangle. Its side lengths change, but the right angle stays fixed.",
  manipulateAction: "Use the 3-4-5 triangle",
  revealPrompt:
    "Compare two arrangements of the same four triangles. One leaves a² + b²; the other leaves c².",
  revealAction: "Compare the arrangements",
  breakPrompt:
    "Push the right-angle corner away from 90°. Keep the side squares visible and watch the balance disappear.",
  breakAction: "Break the right angle",
  articulatePrompt: "Which condition makes Pythagoras true?",
  articulations: [
    { value: "right-angle", label: "The triangle has a 90° angle" },
    { value: "all-triangles", label: "The triangle has any three side lengths" },
    { value: "longest-side", label: "The longest side is drawn at the top" },
  ],
  correctArticulation: "right-angle",
  completeMessage:
    "You found the condition: the area balance is not a fact about every triangle; it is a fact about right triangles.",
};

/**
 * Interactive Pythagoras: drag a right triangle's corners, watch outward squares
 * update, and run a simple a²+b² pack animation. Break the right angle to see
 * the equality fail.
 */
export class PythagorasLesson implements Lesson {
  readonly id = "pythagoras";
  readonly title = "Pythagoras";
  readonly blurb = "a² + b² = c² with live squares on the sides";
  readonly category = "Shape" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["triangle-theorems"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private dynamic = new THREE.Group();
  private labels = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private stopDrag?: () => void;
  private stopTick?: () => void;
  private previousRotate = true;

  private triangle: RightTriangle = axisAlignedRightTriangle(3.2, 2.4, { x: -0.6, y: -1.1 });
  private showSquares = true;
  private rearrangeProgress = 0;
  private rearranging = false;
  private proof?: PythagorasResult;
  private valuesHidden = false;
  private insight: InteractionLoopState = initialInteractionLoopState();
  private insightMarkup = "";
  private insightStatusText = "";

  private readonly infoClickHandler = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-py]");
    if (!button) return;
    const action = button.dataset.py ?? "";
    if (action.startsWith("insight:")) {
      this.handleInsightAction(action.slice("insight:".length));
      return;
    }
    if (action === "reset") {
      this.triangle = axisAlignedRightTriangle(3.2, 2.4, { x: -0.6, y: -1.1 });
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.proof = undefined;
      this.resetInsightLoop();
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "right-3-4-5") {
      this.triangle = axisAlignedRightTriangle(3, 4, { x: -1.2, y: -1.6 });
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.proof = undefined;
      this.resetInsightLoop();
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "isosceles") {
      this.triangle = axisAlignedRightTriangle(2.8, 2.8, { x: -0.8, y: -1.2 });
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.proof = undefined;
      this.resetInsightLoop();
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "break") {
      // Nudge C off the right angle so a²+b² ≠ c².
      this.triangle = {
        ...this.triangle,
        C: { x: this.triangle.C.x + 1.1, y: this.triangle.C.y + 0.7 },
      };
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.proof = undefined;
      this.resetInsightLoop();
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "toggle-squares") {
      this.showSquares = !this.showSquares;
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.proof = undefined;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "rearrange") {
      if (!this.figure().holds) {
        this.updatePanel();
        return;
      }
      this.showSquares = true;
      this.rearrangeProgress = 0;
      this.rearranging = true;
      this.proof = this.figure();
      this.renderScene();
      this.updatePanel();
      return;
    }
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    this.group.add(this.dynamic, this.labels);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 17), new THREE.Vector3(0, 0, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;

    this.buildGrid();
    // Handles: 0=C (right angle), 1=A, 2=B
    for (let i = 0; i < 3; i++) {
      const h = marker(COL.handle, 0.2);
      this.handles.push(h);
      this.group.add(h);
    }
    this.stopDrag = createDragControls(ctx.viewport, this.handles, (index, point) => {
      const p = {
        x: THREE.MathUtils.clamp(point.x, -BOX.x, BOX.x),
        y: THREE.MathUtils.clamp(point.y, -BOX.y, BOX.y),
      };
      if (index === 0) this.triangle = { ...this.triangle, C: p };
      else if (index === 1) this.triangle = { ...this.triangle, A: p };
      else this.triangle = { ...this.triangle, B: p };
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.proof = undefined;
      if (this.insight.phase === "manipulate") {
        this.insight = reduceInteractionLoop(this.insight, { type: "manipulated" });
      }
      this.renderScene();
      this.updatePanel();
    });
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);
    this.renderPanel();
    this.renderScene();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopTick?.();
    this.stopDrag = undefined;
    this.stopTick = undefined;
    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
    this.dynamic = new THREE.Group();
    this.labels = new THREE.Group();
    this.handles = [];
    this.viewport = undefined;
  }

  private tick(dt: number): void {
    if (!this.rearranging) return;
    this.rearrangeProgress = Math.min(1, this.rearrangeProgress + dt / 2.4);
    if (this.rearrangeProgress >= 1) {
      this.rearranging = false;
      if (this.insight.phase === "reveal") {
        this.insight = reduceInteractionLoop(this.insight, { type: "revealed" });
      }
    }
    this.renderScene();
    this.updatePanel();
  }

  private figure(): PythagorasResult {
    return computePythagoras(this.triangle);
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
    const { A, B, C } = this.triangle;

    // Triangle fill + outline
    const shape = new THREE.Shape([
      new THREE.Vector2(A.x, A.y),
      new THREE.Vector2(B.x, B.y),
      new THREE.Vector2(C.x, C.y),
    ]);
    this.dynamic.add(
      new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({
          color: COL.triangle,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        }),
      ),
    );
    this.dynamic.add(
      new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(A.x, A.y, 0.08),
          new THREE.Vector3(B.x, B.y, 0.08),
          new THREE.Vector3(C.x, C.y, 0.08),
        ]),
        new THREE.LineBasicMaterial({ color: COL.triangle }),
      ),
    );

    // Right-angle marker when near 90°
    if (result.valid && Math.abs(result.angleC - 90) < 2) {
      this.drawRightAngle(C, A, B);
    }

    if (this.showSquares && result.valid) {
      if (this.proof && this.rearrangeProgress > 0.001) {
        const sourceOpacity = 1 - Math.min(1, this.rearrangeProgress / 0.16);
        if (sourceOpacity > 0) {
          for (const square of result.squares) {
            const color = square.side === "a" ? COL.sqA : square.side === "b" ? COL.sqB : COL.sqC;
            this.drawPoly([...square.corners], color, (square.side === "c" ? 0.22 : 0.32) * sourceOpacity);
          }
        }
        this.drawDissectionProof(this.proof, this.rearrangeProgress);
      } else {
        for (const sq of result.squares) {
          const color = sq.side === "a" ? COL.sqA : sq.side === "b" ? COL.sqB : COL.sqC;
          this.drawPoly([...sq.corners], color, sq.side === "c" ? 0.22 : 0.32);
          if (!this.valuesHidden) {
            const mid = {
              x: sq.corners.reduce((s, p) => s + p.x, 0) / 4,
              y: sq.corners.reduce((s, p) => s + p.y, 0) / 4,
            };
            const label = textSprite(
              `${sq.side}² = ${formatNumber(sq.area)}`,
              color,
              0.28,
            );
            label.position.set(mid.x, mid.y, 0.3);
            this.labels.add(label);
          }
        }
      }
    }

    // Vertex labels
    if (!this.valuesHidden) {
      this.labelAt(A, "A", COL.label);
      this.labelAt(B, "B", COL.label);
      this.labelAt(C, "C", COL.right);
    }

    const proofActive = Boolean(this.proof && this.rearrangeProgress > 0.001);
    this.handles.forEach((handle) => {
      handle.visible = !proofActive;
    });
    this.handles[0].position.set(C.x, C.y, 0.3);
    this.handles[1].position.set(A.x, A.y, 0.3);
    this.handles[2].position.set(B.x, B.y, 0.3);
  }

  /**
   * Shows two complete, valid dissections rather than pretending intact a² and b²
   * squares can slide into c². The four blue triangles have the same area throughout.
   */
  private drawDissectionProof(result: PythagorasResult, progress: number): void {
    const p = Math.min(1, Math.max(0, progress));
    const { A, B, C } = result.triangle;
    const size = result.a + result.b;
    const centre = {
      x: (A.x + B.x + C.x) / 3,
      y: (A.y + B.y + C.y) / 3,
    };
    const dissection = fourTriangleDissection(result.a, result.b, {
      x: centre.x - size / 2,
      y: centre.y - size / 2,
    });
    const legsOpacity = Math.min(1, p / 0.16) * Math.max(0, Math.min(1, (0.48 - p) / 0.16));
    const hypotenuseOpacity = Math.max(0, Math.min(1, (p - 0.52) / 0.16));
    const outerOpacity = Math.max(legsOpacity, hypotenuseOpacity, p > 0.12 && p < 0.88 ? 0.45 : 0);

    if (outerOpacity > 0) this.drawPoly([...dissection.outer], COL.label, 0.025 * outerOpacity);
    if (legsOpacity > 0) {
      for (const triangle of dissection.legs.triangles) {
        this.drawPoly([...triangle], COL.triangle, 0.2 * legsOpacity);
      }
      this.drawPoly([...dissection.legs.aSquare], COL.sqA, 0.35 * legsOpacity);
      this.drawPoly([...dissection.legs.bSquare], COL.sqB, 0.35 * legsOpacity);
      if (legsOpacity > 0.65) {
        this.labelPolygon(dissection.legs.aSquare, "a²", COL.sqA);
        this.labelPolygon(dissection.legs.bSquare, "b²", COL.sqB);
      }
    }
    if (hypotenuseOpacity > 0) {
      for (const triangle of dissection.hypotenuse.triangles) {
        this.drawPoly([...triangle], COL.triangle, 0.2 * hypotenuseOpacity);
      }
      this.drawPoly([...dissection.hypotenuse.cSquare], COL.sqC, 0.3 * hypotenuseOpacity);
      if (hypotenuseOpacity > 0.65) {
        this.labelPolygon(dissection.hypotenuse.cSquare, "c²", COL.sqC);
      }
    }
  }

  private drawRightAngle(C: Point, A: Point, B: Point): void {
    const u = norm({ x: A.x - C.x, y: A.y - C.y });
    const v = norm({ x: B.x - C.x, y: B.y - C.y });
    const s = 0.32;
    const p1 = { x: C.x + u.x * s, y: C.y + u.y * s };
    const p2 = { x: C.x + u.x * s + v.x * s, y: C.y + u.y * s + v.y * s };
    const p3 = { x: C.x + v.x * s, y: C.y + v.y * s };
    this.dynamic.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p1.x, p1.y, 0.1),
          new THREE.Vector3(p2.x, p2.y, 0.1),
          new THREE.Vector3(p3.x, p3.y, 0.1),
        ]),
        new THREE.LineBasicMaterial({ color: COL.right }),
      ),
    );
  }

  private drawPoly(points: Point[], color: number, opacity: number, dashed = false): void {
    if (points.length < 3) return;
    const shape = new THREE.Shape(points.map((p) => new THREE.Vector2(p.x, p.y)));
    this.dynamic.add(
      new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
        }),
      ),
    );
    const loop = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x, p.y, 0.06))),
      dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity })
        : new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
    if (dashed) loop.computeLineDistances();
    this.dynamic.add(loop);
  }

  private labelAt(p: Point, text: string, color: number): void {
    const sprite = textSprite(text, color, 0.3);
    sprite.position.set(p.x + 0.28, p.y + 0.28, 0.35);
    this.labels.add(sprite);
  }

  private labelPolygon(points: readonly Point[], text: string, color: number): void {
    const centre = points.reduce(
      (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
      { x: 0, y: 0 },
    );
    const sprite = textSprite(text, color, 0.34);
    sprite.position.set(centre.x, centre.y, 0.35);
    this.labels.add(sprite);
  }

  private renderPanel(): void {
    this.setInfo(`
      <h2>Pythagoras</h2>
      <p>On a right triangle the squares on the two legs fill the square on the hypotenuse:
      <b>a² + b² = c²</b>. Drag C (right angle), A or B. Outward squares update live. Break the
      right angle and the areas stop matching.</p>

      <div class="course">
        <h3>Presets</h3>
        <div class="course-chapters">
          <button type="button" class="course-btn ghost" data-py="reset">Reset</button>
          <button type="button" class="course-btn ghost" data-py="right-3-4-5">3-4-5</button>
          <button type="button" class="course-btn ghost" data-py="isosceles">Isosceles right</button>
          <button type="button" class="course-btn ghost" data-py="break">Break right angle</button>
        </div>
        <div class="course-chapters" style="margin-top:8px">
          <button type="button" class="course-btn ghost" data-py="toggle-squares" id="py-squares">Toggle squares</button>
          <button type="button" class="course-btn" data-py="rearrange" id="py-rearrange">▶ Compare arrangements</button>
        </div>
        <p class="course-hint">Four matching triangles leave a² + b² in one arrangement and c² in the other.</p>
      </div>

      <div class="course">
        <h3>Live reading</h3>
        <div class="pl-implication" id="py-claim"></div>
        <div class="readout" id="py-readout"></div>
        <p class="course-hint" id="py-message"></p>
      </div>

      <div class="course">
        <div id="py-insight-loop"></div>
        <p id="py-insight-status" class="course-hint" role="status" aria-live="polite"></p>
      </div>`);
    this.insightMarkup = "";
    this.insightStatusText = "";
    this.updatePanel();
  }

  private updatePanel(): void {
    const result = this.figure();
    const claim = document.getElementById("py-claim");
    const readout = document.getElementById("py-readout");
    const message = document.getElementById("py-message");
    const squaresBtn = document.getElementById("py-squares");
    const rearrangeBtn = document.getElementById("py-rearrange");
    this.updateInsightLoop();

    if (claim) {
      const state = !result.valid ? "pending" : result.holds ? "follows" : "unmet";
      claim.innerHTML = `<span class="pl-implication-step" data-state="met"><small>Claim</small><b>a² + b² = c² at a right angle</b></span>
        <span class="pl-implication-arrow">⇒</span>
        <span class="pl-implication-step" data-state="${state}"><small>Live</small><b>${
          !result.valid ? "invalid" : result.holds ? "holds" : "fails"
        }</b></span>`;
    }

    if (readout) {
      if (!result.valid) {
        readout.innerHTML = `<div><span>Figure</span><b>invalid — ${result.reason ?? "degenerate"}</b></div>`;
      } else if (this.valuesHidden) {
        readout.innerHTML = `
          <div><span>∠C</span><b>${formatNumber(result.angleC, 1)}°</b></div>
          <div><span>Areas</span><b>hidden — make a prediction</b></div>`;
      } else {
        readout.innerHTML = [
          ["a = |BC|", formatNumber(result.a)],
          ["b = |AC|", formatNumber(result.b)],
          ["c = |AB|", formatNumber(result.c)],
          ["a²", formatNumber(result.a2)],
          ["b²", formatNumber(result.b2)],
          ["a² + b²", formatNumber(result.a2 + result.b2)],
          ["c²", formatNumber(result.c2)],
          ["|a²+b²−c²|", formatNumber(result.residual, 3)],
          ["∠C", `${formatNumber(result.angleC, 1)}°`],
        ]
          .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`)
          .join("");
      }
    }

    if (message) {
      message.textContent = !result.valid
        ? "Drag the corners farther apart to make a proper triangle."
        : result.holds
          ? "Right angle at C — the two leg squares match the hypotenuse square."
          : `Angle at C is ${formatNumber(result.angleC, 1)}°, not 90°, so the areas disagree.`;
    }

    if (squaresBtn) squaresBtn.textContent = this.showSquares ? "Hide squares" : "Show squares";
    if (rearrangeBtn) {
      rearrangeBtn.textContent = this.rearranging
        ? "Comparing…"
        : this.rearrangeProgress >= 1
          ? "▶ Compare again"
          : "▶ Compare arrangements";
    }
  }

  private handleInsightAction(action: string): void {
    if (action.startsWith("predict:")) {
      this.insight = reduceInteractionLoop(this.insight, {
        type: "predict",
        value: action.slice("predict:".length),
      });
      this.valuesHidden = true;
    } else if (action === "manipulate") {
      this.triangle = axisAlignedRightTriangle(3, 4, { x: -1.2, y: -1.6 });
      this.valuesHidden = true;
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.proof = undefined;
      this.insight = reduceInteractionLoop(this.insight, { type: "manipulated" });
    } else if (action === "reveal") {
      // The animation is evidence for a right-triangle rule, never a visual "proof" for
      // an arbitrary figure. Return to the known right triangle if the learner moved it.
      if (!this.figure().holds) {
        this.triangle = axisAlignedRightTriangle(3, 4, { x: -1.2, y: -1.6 });
      }
      this.showSquares = true;
      this.valuesHidden = false;
      this.rearrangeProgress = 0;
      this.rearranging = true;
      this.proof = this.figure();
    } else if (action === "break") {
      this.triangle = axisAlignedRightTriangle(3, 4, { x: -1.2, y: -1.6 });
      this.triangle = {
        ...this.triangle,
        C: { x: this.triangle.C.x + 1.1, y: this.triangle.C.y + 0.7 },
      };
      this.valuesHidden = false;
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.proof = undefined;
      this.insight = reduceInteractionLoop(this.insight, { type: "condition-broken" });
    } else if (action.startsWith("articulate:")) {
      const value = action.slice("articulate:".length);
      this.insight = reduceInteractionLoop(this.insight, {
        type: "articulate",
        value,
        correct: value === INSIGHT_LOOP.correctArticulation,
      });
    }
    this.renderScene();
    this.updatePanel();
  }

  private resetInsightLoop(): void {
    this.insight = initialInteractionLoopState();
    this.valuesHidden = false;
  }

  private updateInsightLoop(): void {
    const host = document.getElementById("py-insight-loop");
    const markup = renderInteractionLoop(this.insight, INSIGHT_LOOP, "data-py");
    if (host && markup !== this.insightMarkup) {
      host.innerHTML = markup;
      this.insightMarkup = markup;
    }

    const status = this.insightStatus();
    const statusHost = document.getElementById("py-insight-status");
    if (statusHost && status !== this.insightStatusText) {
      statusHost.textContent = status;
      this.insightStatusText = status;
    }
  }

  private insightStatus(): string {
    switch (this.insight.phase) {
      case "predict":
        return "Start by predicting what the square areas will do.";
      case "manipulate":
        return "Set a right triangle with the 3-4-5 control or drag a corner.";
      case "reveal":
        return this.rearranging
          ? "Comparing two arrangements of the same four triangles."
          : "Compare the arrangements to reveal the equal leftover areas.";
      case "break":
        return "Now test whether the balance survives without a right angle.";
      case "articulate":
        return "State the condition that made the rule work.";
      case "complete":
        return "Discovery complete: the rule needs a right angle.";
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

function norm(p: Point): Point {
  const len = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / len, y: p.y / len };
}
