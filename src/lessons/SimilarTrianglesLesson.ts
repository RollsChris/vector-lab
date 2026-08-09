import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import type { Viewport } from "../core/Viewport";
import {
  computeSimilarTriangles,
  formatDegrees,
  formatNumber,
  similarCopy,
  translateTriangle,
  type Point,
  type SimilarTrianglesResult,
  type Triangle,
} from "../math/similarTriangles";
import { createDragControls, marker, textSprite } from "./helpers";

const BOX = { x: 6.8, y: 4.1 };

const COL = {
  source: 0x58a6ff,
  image: 0x7ee787,
  handle: 0xffd166,
  match: 0x56d4dd,
  bad: 0xff7b72,
  dim: 0x6e7681,
  label: 0xe6edf3,
};

type Mode = "explore" | "locked-similar" | "break";

/**
 * Interactive similar triangles: drag either triangle, watch AA/SAS/SSS tests and
 * the live scale factor. A locked-similar mode keeps the green triangle a true
 * copy so corresponding angles stay matched while you change scale/rotation.
 */
export class SimilarTrianglesLesson implements Lesson {
  readonly id = "similar-triangles";
  readonly title = "Similar Triangles";
  readonly blurb = "AA, SAS and SSS with a live scale factor";
  readonly category = "Shape" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["triangle-theorems", "pythagoras"] as const;

  private setInfo!: (html: string) => void;
  private viewport?: Viewport;
  private group = new THREE.Group();
  private dynamic = new THREE.Group();
  private labels = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private stopDrag?: () => void;
  private previousRotate = true;

  private mode: Mode = "locked-similar";
  private source: Point[] = [
    { x: -3.4, y: -1.6 },
    { x: -0.6, y: -1.6 },
    { x: -2.4, y: 1.5 },
  ];
  private image: Point[] = [
    { x: 1.2, y: -1.4 },
    { x: 4.4, y: -1.0 },
    { x: 2.0, y: 2.0 },
  ];
  private scale = 1.35;
  private rotationDeg = 18;
  private reflect = false;
  private valuesHidden = false;
  private prediction = "";

  private readonly infoClickHandler = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-sim]");
    if (!button) return;
    const action = button.dataset.sim ?? "";
    if (action.startsWith("mode:")) {
      this.mode = action.slice(5) as Mode;
      this.prediction = "";
      this.valuesHidden = false;
      if (this.mode === "locked-similar") this.syncLockedImage();
      if (this.mode === "break") this.breakSimilarity();
      this.renderPanel();
      this.renderScene();
      return;
    }
    if (action === "reset") {
      this.source = [
        { x: -3.4, y: -1.6 },
        { x: -0.6, y: -1.6 },
        { x: -2.4, y: 1.5 },
      ];
      this.scale = 1.35;
      this.rotationDeg = 18;
      this.reflect = false;
      this.mode = "locked-similar";
      this.syncLockedImage();
      this.prediction = "";
      this.valuesHidden = false;
      this.renderPanel();
      this.renderScene();
      return;
    }
    if (action === "scale-up") {
      this.scale = Math.min(2.4, this.scale + 0.15);
      if (this.mode === "locked-similar") this.syncLockedImage();
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "scale-down") {
      this.scale = Math.max(0.45, this.scale - 0.15);
      if (this.mode === "locked-similar") this.syncLockedImage();
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "rotate") {
      this.rotationDeg = (this.rotationDeg + 15) % 360;
      if (this.mode === "locked-similar") this.syncLockedImage();
      this.renderScene();
      this.updatePanel();
      return;
    }
    if (action === "flip") {
      this.reflect = !this.reflect;
      if (this.mode === "locked-similar") this.syncLockedImage();
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
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 16), new THREE.Vector3(0, 0, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;

    this.buildGrid();
    this.syncLockedImage();
    // 6 handles: source A B C, image A' B' C'
    for (let i = 0; i < 6; i++) {
      const h = marker(i < 3 ? COL.handle : COL.image, 0.18);
      this.handles.push(h);
      this.group.add(h);
    }
    this.stopDrag = createDragControls(ctx.viewport, this.handles, (index, point) => {
      const p = {
        x: THREE.MathUtils.clamp(point.x, -BOX.x, BOX.x),
        y: THREE.MathUtils.clamp(point.y, -BOX.y, BOX.y),
      };
      if (index < 3) {
        this.source[index] = p;
        if (this.mode === "locked-similar") this.syncLockedImage();
      } else {
        // Free drag on image forces explore mode.
        if (this.mode === "locked-similar") this.mode = "explore";
        this.image[index - 3] = p;
        this.renderPanel();
      }
      this.renderScene();
      this.updatePanel();
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
    this.labels = new THREE.Group();
    this.handles = [];
    this.viewport = undefined;
  }

  private sourceTri(): Triangle {
    return [this.source[0], this.source[1], this.source[2]];
  }

  private imageTri(): Triangle {
    return [this.image[0], this.image[1], this.image[2]];
  }

  private syncLockedImage(): void {
    const origin = {
      x: (this.source[0].x + this.source[1].x + this.source[2].x) / 3,
      y: (this.source[0].y + this.source[1].y + this.source[2].y) / 3,
    };
    const copy = similarCopy(
      this.sourceTri(),
      this.scale,
      origin,
      (this.rotationDeg * Math.PI) / 180,
      this.reflect,
    );
    // Park the image to the right so the two shapes don't overlap.
    const copyCentroid = {
      x: (copy[0].x + copy[1].x + copy[2].x) / 3,
      y: (copy[0].y + copy[1].y + copy[2].y) / 3,
    };
    const target = { x: 2.6, y: 0.1 };
    this.image = translateTriangle(
      copy,
      target.x - copyCentroid.x,
      target.y - copyCentroid.y,
    ).map((p) => ({ ...p }));
  }

  private breakSimilarity(): void {
    this.syncLockedImage();
    // Stretch one vertex so angles no longer match.
    this.image[2] = {
      x: this.image[2].x + 1.4,
      y: this.image[2].y + 0.2,
    };
  }

  private figure(): SimilarTrianglesResult {
    return computeSimilarTriangles(this.sourceTri(), this.imageTri());
  }

  private buildGrid(): void {
    const grid = new THREE.GridHelper(16, 32, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.08;
    this.group.add(grid);
  }

  private renderScene(): void {
    this.disposeChildren(this.dynamic);
    this.disposeChildren(this.labels);
    const result = this.figure();
    const src = this.sourceTri();
    const img = this.imageTri();

    this.drawTriangle(src, COL.source, 0.16);
    this.drawTriangle(img, result.best.similar ? COL.image : COL.bad, 0.16);

    // Correspondence dashes under the best map
    if (result.best.similar || result.best.angleError < 12) {
      for (let i = 0; i < 3; i++) {
        const j = result.best.order[i];
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(src[i].x, src[i].y, 0.05),
            new THREE.Vector3(img[j].x, img[j].y, 0.05),
          ]),
          new THREE.LineDashedMaterial({
            color: result.best.similar ? COL.match : COL.dim,
            dashSize: 0.12,
            gapSize: 0.1,
            transparent: true,
            opacity: 0.75,
          }),
        );
        line.computeLineDistances();
        this.dynamic.add(line);
      }
    }

    const names = ["A", "B", "C"];
    const names2 = ["A′", "B′", "C′"];
    src.forEach((p, i) => {
      this.handles[i].position.set(p.x, p.y, 0.3);
      if (!this.valuesHidden) {
        const s = textSprite(names[i], COL.source, 0.3);
        s.position.set(p.x - 0.32, p.y + 0.3, 0.35);
        this.labels.add(s);
      }
    });
    img.forEach((p, i) => {
      this.handles[i + 3].position.set(p.x, p.y, 0.3);
      if (!this.valuesHidden) {
        const mappedFrom = result.best.order.indexOf(i);
        const label =
          mappedFrom >= 0 && result.best.similar
            ? `${names2[i]}↔${names[mappedFrom]}`
            : names2[i];
        const s = textSprite(label, result.best.similar ? COL.image : COL.bad, 0.28);
        s.position.set(p.x + 0.34, p.y + 0.3, 0.35);
        this.labels.add(s);
      }
    });

    // Angle arcs when not hidden
    if (!this.valuesHidden) {
      this.drawAngles(src, result.source.angles, COL.source);
      this.drawAngles(img, result.image.angles, result.best.similar ? COL.image : COL.bad);
    }
  }

  private drawTriangle(triangle: Triangle, color: number, opacity: number): void {
    const pts = triangle.map((p) => new THREE.Vector2(p.x, p.y));
    this.dynamic.add(
      new THREE.Mesh(
        new THREE.ShapeGeometry(new THREE.Shape(pts)),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
        }),
      ),
    );
    this.dynamic.add(
      new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          triangle.map((p) => new THREE.Vector3(p.x, p.y, 0.08)),
        ),
        new THREE.LineBasicMaterial({ color }),
      ),
    );
  }

  private drawAngles(triangle: Triangle, angles: readonly number[], color: number): void {
    for (let i = 0; i < 3; i++) {
      const V = triangle[i];
      const P = triangle[(i + 1) % 3];
      const Q = triangle[(i + 2) % 3];
      const a1 = Math.atan2(P.y - V.y, P.x - V.x);
      const a2 = Math.atan2(Q.y - V.y, Q.x - V.x);
      let start = a1;
      let sweep = a2 - a1;
      while (sweep <= 0) sweep += Math.PI * 2;
      if (sweep > Math.PI) {
        start = a2;
        sweep = a1 - a2;
        while (sweep <= 0) sweep += Math.PI * 2;
      }
      const r = 0.42;
      const pts: THREE.Vector3[] = [];
      const n = 14;
      for (let k = 0; k <= n; k++) {
        const t = start + (sweep * k) / n;
        pts.push(new THREE.Vector3(V.x + Math.cos(t) * r, V.y + Math.sin(t) * r, 0.1));
      }
      this.dynamic.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color })));
      const mid = start + sweep / 2;
      const sprite = textSprite(formatDegrees(angles[i]), color, 0.24);
      sprite.position.set(V.x + Math.cos(mid) * 0.78, V.y + Math.sin(mid) * 0.78, 0.3);
      this.labels.add(sprite);
    }
  }

  private renderPanel(): void {
    const modeBtn = (id: Mode, label: string) =>
      `<button type="button" class="course-btn${this.mode === id ? "" : " ghost"}" data-sim="mode:${id}">${label}</button>`;

    this.setInfo(`
      <h2>Similar Triangles</h2>
      <p>Similar triangles have the <b>same angles</b> and <b>proportional sides</b>.
      Blue is the source; green is the image. Dashed links show the best vertex match.
      Locked-similar mode keeps a true copy while you scale, rotate or flip.</p>

      <div class="course">
        <h3>Mode</h3>
        <div class="course-chapters">
          ${modeBtn("locked-similar", "Locked similar")}
          ${modeBtn("explore", "Free explore")}
          ${modeBtn("break", "Break similarity")}
        </div>
        <div class="course-chapters" style="margin-top:8px">
          <button type="button" class="course-btn ghost" data-sim="reset">Reset</button>
          <button type="button" class="course-btn ghost" data-sim="scale-down">Scale −</button>
          <button type="button" class="course-btn ghost" data-sim="scale-up">Scale +</button>
          <button type="button" class="course-btn ghost" data-sim="rotate">Rotate 15°</button>
          <button type="button" class="course-btn ghost" data-sim="flip">Flip</button>
        </div>
        <p class="course-hint" id="sim-hint"></p>
      </div>

      <div class="course">
        <h3>Live reading</h3>
        <div class="pl-implication" id="sim-claim"></div>
        <div class="readout" id="sim-readout"></div>
        <p class="course-hint" id="sim-message"></p>
      </div>

      <div class="course">
        <h3>Predict, then reveal</h3>
        <p>Hide the numbers, drag a corner, then decide whether the triangles are still similar.</p>
        <div class="course-chapters">
          <button type="button" class="course-btn ghost" data-sim="hide">Hide values</button>
          <button type="button" class="course-btn ghost" data-sim="reveal">Reveal values</button>
        </div>
        <div class="course-chapters" style="margin-top:8px">
          <button type="button" class="course-btn ghost" data-sim="predict:similar">Similar</button>
          <button type="button" class="course-btn ghost" data-sim="predict:not">Not similar</button>
        </div>
        <p class="course-hint" id="sim-verdict"></p>
      </div>`);
    this.updatePanel();
  }

  private updatePanel(): void {
    const result = this.figure();
    const claim = document.getElementById("sim-claim");
    const readout = document.getElementById("sim-readout");
    const message = document.getElementById("sim-message");
    const verdict = document.getElementById("sim-verdict");
    const hint = document.getElementById("sim-hint");

    if (hint) {
      hint.textContent =
        this.mode === "locked-similar"
          ? "Image is locked as a similar copy. Scale / rotate / flip, or drag a blue corner."
          : this.mode === "break"
            ? "One green corner was stretched — watch AA fail and the scale ratios split."
            : "Drag any corner freely. The panel reports the best AA/SAS/SSS match it can find.";
    }

    if (claim) {
      const state = result.best.similar ? "follows" : "unmet";
      claim.innerHTML = `<span class="pl-implication-step" data-state="met"><small>Test</small><b>${
        result.best.similar ? result.best.test : "no match"
      }</b></span>
        <span class="pl-implication-arrow">⇒</span>
        <span class="pl-implication-step" data-state="${state}"><small>Verdict</small><b>${
          result.best.similar ? "similar" : "not similar"
        }</b></span>`;
    }

    if (readout) {
      if (!result.source.valid || !result.image.valid) {
        readout.innerHTML = `<div><span>Figure</span><b>degenerate — open the triangle out</b></div>`;
      } else if (this.valuesHidden) {
        readout.innerHTML = `<div><span>Measures</span><b>hidden — make a prediction</b></div>
          <div><span>Mode</span><b>${this.mode}</b></div>`;
      } else {
        const order = result.best.order;
        const map = `A→${"ABC"[order[0]]}′, B→${"ABC"[order[1]]}′, C→${"ABC"[order[2]]}′`;
        readout.innerHTML = [
          ["Similar?", result.best.similar ? "yes" : "no"],
          ["Best test", result.best.similar ? result.best.test : "—"],
          ["Scale k", formatNumber(result.best.scale, 3)],
          ["Ratio spread", formatNumber(result.best.ratioSpread, 3)],
          ["Max ∠ error", formatDegrees(result.best.angleError)],
          ["Map", map],
          ["Source ∠", result.source.angles.map((a) => formatDegrees(a)).join(", ")],
          ["Image ∠", result.image.angles.map((a) => formatDegrees(a)).join(", ")],
          ["Source sides", result.source.sides.map((s) => formatNumber(s)).join(", ")],
          ["Image sides", result.image.sides.map((s) => formatNumber(s)).join(", ")],
        ]
          .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`)
          .join("");
      }
    }

    if (message) {
      message.textContent = result.best.similar
        ? `AA is enough in the plane: matching angles force proportional sides (k ≈ ${formatNumber(result.best.scale, 2)}).`
        : "Angles or side ratios disagree under every vertex matching — the triangles are not similar.";
    }

    if (verdict) {
      if (!this.prediction) {
        verdict.textContent = this.valuesHidden ? "Values hidden — predict before revealing." : "";
      } else if (this.prediction === "similar") {
        verdict.textContent = result.best.similar
          ? `Correct — ${result.best.test} similarity with scale ${formatNumber(result.best.scale, 2)}.`
          : "Not this figure — try Locked similar, or drag corners back until angles match.";
      } else if (this.prediction === "not") {
        verdict.textContent = !result.best.similar
          ? "Correct — no AA/SAS/SSS match survives on this figure."
          : "They still match — check the live test chip.";
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
