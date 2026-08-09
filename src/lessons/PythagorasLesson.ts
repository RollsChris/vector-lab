import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import {
  axisAlignedRightTriangle,
  computePythagoras,
  formatNumber,
  rearrangedTiles,
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
  private valuesHidden = false;
  private prediction = "";

  private readonly infoClickHandler = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-py]");
    if (!button) return;
    const action = button.dataset.py ?? "";
    if (action === "reset") {
      this.triangle = axisAlignedRightTriangle(3.2, 2.4, { x: -0.6, y: -1.1 });
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.prediction = "";
      this.valuesHidden = false;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "right-3-4-5") {
      this.triangle = axisAlignedRightTriangle(3, 4, { x: -1.2, y: -1.6 });
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.prediction = "";
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "isosceles") {
      this.triangle = axisAlignedRightTriangle(2.8, 2.8, { x: -0.8, y: -1.2 });
      this.rearrangeProgress = 0;
      this.rearranging = false;
      this.prediction = "";
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
      this.prediction = "";
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "toggle-squares") {
      this.showSquares = !this.showSquares;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "rearrange") {
      if (!this.figure().holds) {
        this.prediction = "";
        this.updatePanel();
        return;
      }
      this.showSquares = true;
      this.rearrangeProgress = 0;
      this.rearranging = true;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "hide") {
      this.valuesHidden = true;
      this.prediction = "";
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "reveal") {
      this.valuesHidden = false;
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action.startsWith("predict:")) {
      this.prediction = action.slice(8);
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
    if (this.rearrangeProgress >= 1) this.rearranging = false;
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
      if (this.rearrangeProgress > 0.001) {
        const tiles = rearrangedTiles(result, this.rearrangeProgress);
        this.drawPoly([...tiles.aTile], COL.sqA, 0.35);
        this.drawPoly([...tiles.bTile], COL.sqB, 0.35);
        // Keep c² footprint as a dashed target
        const cSq = result.squares.find((s) => s.side === "c");
        if (cSq) this.drawPoly([...cSq.corners], COL.sqC, 0.12, true);
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

    this.handles[0].position.set(C.x, C.y, 0.3);
    this.handles[1].position.set(A.x, A.y, 0.3);
    this.handles[2].position.set(B.x, B.y, 0.3);
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
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.1 })
        : new THREE.LineBasicMaterial({ color }),
    );
    if (dashed) loop.computeLineDistances();
    this.dynamic.add(loop);
  }

  private labelAt(p: Point, text: string, color: number): void {
    const sprite = textSprite(text, color, 0.3);
    sprite.position.set(p.x + 0.28, p.y + 0.28, 0.35);
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
          <button type="button" class="course-btn" data-py="rearrange" id="py-rearrange">▶ Pack a² + b²</button>
        </div>
        <p class="course-hint">The pack animation only runs while the triangle is right-angled.</p>
      </div>

      <div class="course">
        <h3>Live reading</h3>
        <div class="pl-implication" id="py-claim"></div>
        <div class="readout" id="py-readout"></div>
        <p class="course-hint" id="py-message"></p>
      </div>

      <div class="course">
        <h3>Predict, then reveal</h3>
        <p>Hide the areas, change a corner, then decide whether a² + b² still equals c².</p>
        <div class="course-chapters">
          <button type="button" class="course-btn ghost" data-py="hide">Hide values</button>
          <button type="button" class="course-btn ghost" data-py="reveal">Reveal values</button>
        </div>
        <div class="course-chapters" style="margin-top:8px">
          <button type="button" class="course-btn ghost" data-py="predict:holds">a² + b² = c²</button>
          <button type="button" class="course-btn ghost" data-py="predict:fails">Equality fails</button>
        </div>
        <p class="course-hint" id="py-verdict"></p>
      </div>`);
    this.updatePanel();
  }

  private updatePanel(): void {
    const result = this.figure();
    const claim = document.getElementById("py-claim");
    const readout = document.getElementById("py-readout");
    const message = document.getElementById("py-message");
    const verdict = document.getElementById("py-verdict");
    const squaresBtn = document.getElementById("py-squares");
    const rearrangeBtn = document.getElementById("py-rearrange");

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

    if (verdict) {
      if (!this.prediction) {
        verdict.textContent = this.valuesHidden ? "Areas hidden — predict before revealing." : "";
      } else if (this.prediction === "holds") {
        verdict.textContent = result.holds
          ? "Correct — right-angled at C, so a² + b² equals c²."
          : "Not this figure — restore a right angle at C (try Reset or 3-4-5).";
      } else if (this.prediction === "fails") {
        verdict.textContent = !result.holds
          ? "Correct — without a right angle the side squares no longer match."
          : "This figure still has a right angle, so the equality holds.";
      }
    }

    if (squaresBtn) squaresBtn.textContent = this.showSquares ? "Hide squares" : "Show squares";
    if (rearrangeBtn) {
      rearrangeBtn.textContent = this.rearranging
        ? "Packing…"
        : this.rearrangeProgress >= 1
          ? "▶ Pack again"
          : "▶ Pack a² + b²";
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
