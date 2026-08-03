import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { miterSawCut } from "../math/miterSaw";
import { segment, textSprite } from "./helpers";

const COLORS = {
  leftPiece: 0x58a6ff,
  rightPiece: 0x7ee787,
  blade: 0xffa657,
  face: 0xd2a8ff,
  outline: 0xc9d1d9,
  fence: 0x8b949e,
};

type InputKey = "width" | "thickness" | "miter" | "bevel";

/**
 * A cut-plan calculator for rectangular stock. The upper drawing is the board seen
 * from above; the lower drawing is the actual cut face unfolded into the screen.
 */
export class MiterSawCutsLesson implements Lesson {
  readonly id = "miter-saw-cuts";
  readonly title = "Mitre Saw Cut Planner";
  readonly blurb = "See the cut shape before you cut";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["geometry", "trig-functions"] as const;

  private readonly params = {
    width: 140,
    thickness: 18,
    miter: 45,
    bevel: 0,
  };

  private group = new THREE.Group();
  private setInfo!: LessonContext["setInfo"];
  private viewport?: LessonContext["viewport"];
  private previousRotate = true;

  private readonly infoHandler = (event: Event): void => {
    const target = event.target as HTMLElement;
    const preset = target.closest<HTMLButtonElement>("[data-miter-preset]");
    if (preset) {
      this.applyPreset(preset.dataset.miterPreset);
      return;
    }

    if (event.type !== "change") return;
    const input = target.closest<HTMLInputElement>("[data-miter-input]");
    if (!input) return;
    const key = input.dataset.miterInput as InputKey | undefined;
    const value = input.valueAsNumber;
    if (!Number.isFinite(value) || !key) return;
    this.setInput(key, value);
    this.render();
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, -0.7, 16), new THREE.Vector3(0, -0.7, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = false;
    const info = document.getElementById("info");
    info?.addEventListener("click", this.infoHandler);
    info?.addEventListener("change", this.infoHandler);
    this.render();
  }

  exit(): void {
    const info = document.getElementById("info");
    info?.removeEventListener("click", this.infoHandler);
    info?.removeEventListener("change", this.infoHandler);
    this.clearScene();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
    if (this.viewport) this.viewport.controls.enableRotate = this.previousRotate;
    this.viewport = undefined;
  }

  private setInput(key: InputKey, value: number): void {
    switch (key) {
      case "width":
        this.params.width = THREE.MathUtils.clamp(value, 10, 500);
        break;
      case "thickness":
        this.params.thickness = THREE.MathUtils.clamp(value, 3, 100);
        break;
      case "miter":
        this.params.miter = THREE.MathUtils.clamp(value, -60, 60);
        break;
      case "bevel":
        this.params.bevel = THREE.MathUtils.clamp(value, -45, 45);
        break;
    }
  }

  private applyPreset(name: string | undefined): void {
    if (name === "square") {
      this.params.miter = 0;
      this.params.bevel = 0;
    } else if (name === "frame") {
      this.params.miter = 45;
      this.params.bevel = 0;
    } else if (name === "hexagon") {
      this.params.miter = 30;
      this.params.bevel = 0;
    } else if (name === "compound") {
      this.params.miter = 45;
      this.params.bevel = 30;
    } else {
      return;
    }
    this.render();
  }

  private render(): void {
    this.clearScene();
    const cut = miterSawCut({
      width: this.params.width,
      thickness: this.params.thickness,
      miterDegrees: this.params.miter,
      bevelDegrees: this.params.bevel,
    });
    this.drawPlan(cut);
    this.drawCutFace(cut);
    this.renderInfo(cut);
  }

  private drawPlan(cut: ReturnType<typeof miterSawCut>): void {
    const scale = 5.4 / this.params.width;
    const width = this.params.width * scale;
    const halfWidth = width / 2;
    const run = this.params.width * Math.tan(this.params.miter * Math.PI / 180) * scale;
    const halfLength = Math.max(width * 1.25, Math.abs(run) / 2 + width * 0.55);
    const cutBottom = new THREE.Vector3(-run / 2, -halfWidth, 0.08);
    const cutTop = new THREE.Vector3(run / 2, halfWidth, 0.08);

    this.group.add(
      this.piece(
        [
          new THREE.Vector2(-halfLength, -halfWidth),
          new THREE.Vector2(cutBottom.x, cutBottom.y),
          new THREE.Vector2(cutTop.x, cutTop.y),
          new THREE.Vector2(-halfLength, halfWidth),
        ],
        COLORS.leftPiece,
      ),
      this.piece(
        [
          new THREE.Vector2(cutBottom.x, cutBottom.y),
          new THREE.Vector2(halfLength, -halfWidth),
          new THREE.Vector2(halfLength, halfWidth),
          new THREE.Vector2(cutTop.x, cutTop.y),
        ],
        COLORS.rightPiece,
      ),
      this.outline(
        [
          new THREE.Vector3(-halfLength, -halfWidth, 0.1),
          new THREE.Vector3(halfLength, -halfWidth, 0.1),
          new THREE.Vector3(halfLength, halfWidth, 0.1),
          new THREE.Vector3(-halfLength, halfWidth, 0.1),
        ],
      ),
      segment(cutBottom, cutTop, COLORS.blade),
    );

    const fence = segment(
      new THREE.Vector3(-halfLength - 0.4, halfWidth + 0.35, 0.05),
      new THREE.Vector3(halfLength + 0.4, halfWidth + 0.35, 0.05),
      COLORS.fence,
    );
    this.group.add(fence);

    const planLabel = textSprite("Top plan — board against fence", 0xffffff, 0.45);
    planLabel.position.set(0, halfWidth + 1.05, 0.2);
    const bladeLabel = textSprite("blade / cut line", COLORS.blade, 0.36);
    bladeLabel.position.copy(cutTop.clone().lerp(cutBottom, 0.15).add(new THREE.Vector3(0.8, 0.2, 0.2)));
    const leftLabel = textSprite("keeper / offcut", COLORS.leftPiece, 0.34);
    leftLabel.position.set(-halfLength * 0.6, 0, 0.2);
    const rightLabel = textSprite("mate piece", COLORS.rightPiece, 0.34);
    rightLabel.position.set(halfLength * 0.6, 0, 0.2);
    this.group.add(planLabel, bladeLabel, leftLabel, rightLabel);

    const dimension = textSprite(
      `${fmt(cut.cutLineAcuteAngleDegrees)}° to long edge`,
      COLORS.blade,
      0.34,
    );
    dimension.position.set(0, -halfWidth + 0.45, 0.2);
    this.group.add(dimension);
  }

  private drawCutFace(cut: ReturnType<typeof miterSawCut>): void {
    const scale = 5.4 / this.params.width;
    const topLength = cut.topFaceCutLength * scale;
    const sideLength = cut.cutFaceSideLength * scale;
    const angle = cut.cutFaceIncludedAngleDegrees * Math.PI / 180;
    const faceTop = -4.3;
    const side = new THREE.Vector2(
      sideLength * Math.cos(angle),
      -sideLength * Math.sin(angle),
    );
    const points = [
      new THREE.Vector2(-topLength / 2, faceTop),
      new THREE.Vector2(topLength / 2, faceTop),
      new THREE.Vector2(topLength / 2 + side.x, faceTop + side.y),
      new THREE.Vector2(-topLength / 2 + side.x, faceTop + side.y),
    ];
    this.group.add(this.piece(points, COLORS.face), this.outline(points.map((point) =>
      new THREE.Vector3(point.x, point.y, 0.1),
    )));

    const faceLabel = textSprite(
      cut.miterMagnitudeDegrees === 0 || cut.bevelMagnitudeDegrees === 0
        ? "Cut face — rectangle"
        : "Cut face — parallelogram",
      COLORS.face,
      0.42,
    );
    faceLabel.position.set(0, faceTop + 0.8, 0.2);
    const faceAngle = textSprite(
      `inside angle ${fmt(cut.cutFaceIncludedAngleDegrees)}°`,
      COLORS.face,
      0.32,
    );
    faceAngle.position.set(-topLength / 2 + 0.5, faceTop - 0.28, 0.2);
    this.group.add(faceLabel, faceAngle);
  }

  private piece(points: THREE.Vector2[], color: number): THREE.Mesh {
    const shape = new THREE.Shape(points);
    return new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.48,
        side: THREE.DoubleSide,
      }),
    );
  }

  private outline(points: THREE.Vector3[]): THREE.LineLoop {
    return new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: COLORS.outline }),
    );
  }

  private renderInfo(cut: ReturnType<typeof miterSawCut>): void {
    const bevelFlat = cut.bevelMagnitudeDegrees < 0.001;
    const direction = this.params.miter < 0 ? "left" : this.params.miter > 0 ? "right" : "square";
    this.setInfo(`
      <h2>Mitre Saw Cut Planner</h2>
      <p>Set your stock and saw angles, then read the top plan and the actual cut-face shape.
      The <b>miter setting</b> is measured from square; it is not the same angle as the cut line on the board.</p>

      <div class="course miter-calculator">
        <h3>Stock and saw settings</h3>
        <div class="geom-fields miter-inputs">
          ${this.input("width", "Board width", this.params.width, 10, 500, "mm")}
          ${this.input("thickness", "Board thickness", this.params.thickness, 3, 100, "mm")}
          ${this.input("miter", "Miter setting", this.params.miter, -60, 60, "°")}
          ${this.input("bevel", "Bevel setting", this.params.bevel, -45, 45, "°")}
        </div>
        <div class="miter-presets" aria-label="Cut presets">
          <button type="button" data-miter-preset="square">Square 0°</button>
          <button type="button" data-miter-preset="frame">Frame 45°</button>
          <button type="button" data-miter-preset="hexagon">Hexagon 30°</button>
          <button type="button" data-miter-preset="compound">Compound 45° / 30°</button>
        </div>
      </div>

      <div class="readout miter-results">
        <div><span>Saw miter</span><b>${fmt(cut.miterMagnitudeDegrees)}° ${direction}</b></div>
        <div><span>Cut line to long edge</span><b>${fmt(cut.cutLineAcuteAngleDegrees)}°</b></div>
        <div><span>Top-face cut length</span><b>${fmt(cut.topFaceCutLength)} mm</b></div>
        <div><span>End offset across board</span><b>${fmt(cut.endOffset)} mm</b></div>
        <div><span>Cut-face side through thickness</span><b>${fmt(cut.cutFaceSideLength)} mm</b></div>
        <div><span>Cut-face area</span><b>${fmt(cut.cutFaceArea)} mm²</b></div>
        <div><span>Cut-face inside angle</span><b>${fmt(cut.cutFaceIncludedAngleDegrees)}°</b></div>
      </div>

      <div class="miter-working">
        <code>cut line = 90° − |miter|</code>
        <code>top cut = width ÷ cos(miter)</code>
        <code>face area = width × thickness ÷ (cos(miter) × cos(bevel))</code>
      </div>

      ${
        bevelFlat
          ? `<p class="example"><b>Flat-frame joint:</b> two matching ${fmt(cut.miterMagnitudeDegrees)}° mitres close a
            <b>${fmt(cut.flatFrameCornerDegrees)}°</b> corner. For a regular polygon with <i>n</i> sides,
            set the saw to 180° ÷ <i>n</i>: 45° for a square, 30° for a hexagon.</p>`
          : `<p class="example"><b>Compound cut:</b> bevel changes the cut face into the shown parallelogram.
            The flat-frame corner calculation is hidden because a bevelled pair does not close as a flat frame.</p>`
      }

      <p><b>Remember:</b> 0° on the saw is a square crosscut, not a cut running along the board.
      The miter sign flips the slant; a positive value is shown as right and a negative value as left.</p>
      <p class="example"><b>Practical check:</b> allow for blade kerf before cutting both final-length pieces.
      If the board is stood on edge against the fence, the same blade tilts swap the practical roles of miter and bevel.</p>
    `);
  }

  private input(
    id: InputKey,
    label: string,
    value: number,
    min: number,
    max: number,
    unit: string,
  ): string {
    return `
      <label class="geom-field">
        <span>${label}</span>
        <input data-miter-input="${id}" type="number" min="${min}" max="${max}" step="1" value="${value}" />
        <em>${unit}</em>
      </label>`;
  }

  private clearScene(): void {
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
      const sprite = object as THREE.Sprite;
      const map = sprite.material?.map;
      map?.dispose();
    });
    this.group.clear();
  }
}

function fmt(value: number): string {
  return value.toFixed(1);
}
