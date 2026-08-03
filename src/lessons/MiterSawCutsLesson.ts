import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { parseCutList, planCutList, type CutListPlan } from "../math/cutList";
import { miterSawCut, regularPolygonFrame, type RegularPolygonFrame } from "../math/miterSaw";
import { textSprite } from "./helpers";

const COLORS = {
  table: 0x30363d,
  turntable: 0x48515d,
  fence: 0x8b949e,
  woodLeft: 0xb97845,
  woodRight: 0xd39b61,
  endGrain: 0xf0c78d,
  blade: 0xc9d1d9,
  bladeHub: 0x30363d,
  housing: 0x58a6ff,
  guard: 0xffa657,
  kerf: 0xff7b72,
};

type InputKey = "width" | "thickness" | "miter" | "bevel";
type CutState = "ready" | "cutting" | "complete";
type AssemblyState = "ready" | "building" | "complete";

const REGULAR_FRAME_EXAMPLES = [
  { sides: 3, label: "Triangle", setting: "60°" },
  { sides: 4, label: "Square", setting: "45°" },
  { sides: 5, label: "Pentagon", setting: "36°" },
  { sides: 6, label: "Hexagon", setting: "30°" },
  { sides: 8, label: "Octagon", setting: "22.5°" },
  { sides: 12, label: "Dodecagon", setting: "15°" },
] as const;

/**
 * A workshop-scale mitre saw. The scene makes the machine movements concrete:
 * turntable = miter, local blade tilt = bevel, then a vertical cutting stroke.
 */
export class MiterSawCutsLesson implements Lesson {
  readonly id = "miter-saw-cuts";
  readonly title = "Mitre Saw Cut Planner";
  readonly blurb = "Animate a real-world cut before you cut";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["geometry", "trig-functions"] as const;

  private readonly params = {
    width: 140,
    thickness: 18,
    miter: 45,
    bevel: 0,
  };
  private readonly cutList = {
    stockLength: 2400,
    endTrim: 20,
    kerf: 3,
    raw: "Long rails, 800, 2\nShort rails, 400, 2",
  };

  private group = new THREE.Group();
  private setInfo!: LessonContext["setInfo"];
  private viewport?: LessonContext["viewport"];
  private previousRotate = true;
  private stopTick?: () => void;
  private cutState: CutState = "ready";
  private cutProgress = 0;
  private assemblyState: AssemblyState = "ready";
  private assemblyProgress = 0;
  private bladeCarrier?: THREE.Group;
  private bladeSpin?: THREE.Group;
  private leftPiece?: THREE.Mesh;
  private rightPiece?: THREE.Mesh;
  private cutFace?: THREE.Mesh;
  private cutNormal = new THREE.Vector3(1, 0, 0);
  private stockBase = 0;
  private stockTopY = 0;
  private bladeRestY = 0;
  private bladeCutY = 0;
  private bevelRadians = 0;
  private stockGroup?: THREE.Group;
  private workshopGuidesGroup?: THREE.Group;
  private assemblyGroup?: THREE.Group;
  private assemblyPieces: THREE.Mesh[] = [];
  private assemblyFrame?: RegularPolygonFrame;
  private assemblyPlaced = -1;

  private readonly infoHandler = (event: Event): void => {
    const target = event.target as HTMLElement;
    const preset = target.closest<HTMLButtonElement>("[data-miter-preset]");
    if (preset) {
      this.applyPreset(preset.dataset.miterPreset);
      return;
    }

    const action = target.closest<HTMLButtonElement>("[data-miter-action]");
    if (action) {
      if (action.dataset.miterAction === "cut") this.toggleCut();
      else if (action.dataset.miterAction === "assemble") this.toggleAssembly();
      return;
    }

    const example = target.closest<HTMLButtonElement>("[data-miter-example]");
    if (example) {
      this.applyRegularFrame(Number(example.dataset.miterExample));
      return;
    }

    if (event.type !== "change") return;
    const cutListInput = target.closest<HTMLInputElement | HTMLTextAreaElement>("[data-cut-list-input]");
    if (cutListInput) {
      this.setCutListInput(cutListInput.dataset.cutListInput, cutListInput);
      this.refreshCutListUi();
      return;
    }
    const input = target.closest<HTMLInputElement>("[data-miter-input]");
    if (!input) return;
    const key = input.dataset.miterInput as InputKey | undefined;
    const value = input.valueAsNumber;
    if (!Number.isFinite(value) || !key) return;
    this.setInput(key, value);
    this.resetAndRender();
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(10, 7.8, 12), new THREE.Vector3(0, 1, 0));
    this.previousRotate = ctx.viewport.controls.enableRotate;
    ctx.viewport.controls.enableRotate = true;
    const info = document.getElementById("info");
    info?.addEventListener("click", this.infoHandler);
    info?.addEventListener("change", this.infoHandler);
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
    this.render();
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    this.cutState = "ready";
    this.cutProgress = 0;
    this.assemblyState = "ready";
    this.assemblyProgress = 0;
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

  private setCutListInput(key: string | undefined, input: HTMLInputElement | HTMLTextAreaElement): void {
    if (key === "parts" && input instanceof HTMLTextAreaElement) {
      this.cutList.raw = input.value;
      return;
    }
    if (!(input instanceof HTMLInputElement) || !Number.isFinite(input.valueAsNumber)) return;
    if (key === "stockLength") this.cutList.stockLength = THREE.MathUtils.clamp(input.valueAsNumber, 1, 100_000);
    if (key === "endTrim") this.cutList.endTrim = THREE.MathUtils.clamp(input.valueAsNumber, 0, 10_000);
    if (key === "kerf") this.cutList.kerf = THREE.MathUtils.clamp(input.valueAsNumber, 0, 100);
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
    this.resetAndRender();
  }

  private applyRegularFrame(sides: number): void {
    if (!REGULAR_FRAME_EXAMPLES.some((example) => example.sides === sides)) return;
    this.params.miter = 180 / sides;
    this.params.bevel = 0;
    this.resetAndRender();
  }

  private toggleCut(): void {
    if (this.assemblyState === "building") return;
    if (this.assemblyState !== "ready") this.resetAndRender();
    if (this.cutState === "ready") {
      this.cutState = "cutting";
      this.refreshAnimationUi();
      return;
    }
    if (this.cutState === "complete") this.resetAndRender();
  }

  private toggleAssembly(): void {
    if (!this.assemblyFrame || this.cutState === "cutting") return;
    if (this.assemblyState === "complete") {
      this.resetAndRender();
      return;
    }
    this.cutState = "ready";
    this.cutProgress = 0;
    this.updateCutAnimation();
    if (this.stockGroup) this.stockGroup.visible = false;
    if (this.bladeCarrier) this.bladeCarrier.visible = false;
    if (this.workshopGuidesGroup) this.workshopGuidesGroup.visible = false;
    this.assemblyState = "building";
    this.assemblyProgress = 0;
    this.assemblyPlaced = -1;
    this.refreshAnimationUi();
    this.refreshAssemblyUi();
  }

  private resetAndRender(): void {
    this.cutState = "ready";
    this.cutProgress = 0;
    this.assemblyState = "ready";
    this.assemblyProgress = 0;
    this.render();
  }

  private tick(dt: number): void {
    const limitedDt = Math.min(dt, 0.05);
    if (this.cutState === "cutting" && this.bladeCarrier && this.bladeSpin) {
      this.cutProgress = Math.min(1, this.cutProgress + limitedDt * 0.52);
      this.bladeSpin.rotation.y -= limitedDt * 70;
      this.updateCutAnimation();
      if (this.cutProgress >= 1) this.cutState = "complete";
      this.refreshAnimationUi();
    }
    if (this.assemblyState === "building" && this.assemblyGroup) {
      this.assemblyProgress = Math.min(1, this.assemblyProgress + limitedDt * 0.72);
      this.updateAssemblyAnimation();
      if (this.assemblyProgress >= 1) this.assemblyState = "complete";
      this.refreshAssemblyUi();
    }
  }

  private render(): void {
    this.clearScene();
    const cut = miterSawCut({
      width: this.params.width,
      thickness: this.params.thickness,
      miterDegrees: this.params.miter,
      bevelDegrees: this.params.bevel,
    });
    this.buildWorkshop(cut);
    this.renderInfo(cut);
    this.updateCutAnimation();
  }

  private buildWorkshop(cut: ReturnType<typeof miterSawCut>): void {
    const bladeRadius = 2.15;
    const faceReach = Math.hypot(cut.topFaceCutLength / 2, cut.cutFaceSideLength);
    const scale = Math.min(1 / 50, 4 / cut.topFaceCutLength, (bladeRadius - 0.18) / faceReach);
    const width = this.params.width * scale;
    const height = this.params.thickness * scale;
    const miter = THREE.MathUtils.degToRad(this.params.miter);
    const bevel = THREE.MathUtils.degToRad(this.params.bevel);
    const bevelRun = height * Math.abs(Math.tan(bevel)) / Math.max(Math.cos(miter), 0.01);
    const run = width * Math.tan(miter);
    const halfLength = Math.max(4.8, Math.abs(run) / 2 + bevelRun + 1.5);
    const tableTop = 0.22;
    this.stockBase = tableTop + 0.07;
    this.stockTopY = this.stockBase + height;
    this.bevelRadians = bevel;

    const table = new THREE.Mesh(
      new THREE.BoxGeometry(12.5, 0.35, 7.8),
      new THREE.MeshStandardMaterial({ color: COLORS.table, roughness: 0.72, metalness: 0.35 }),
    );
    table.position.set(0, 0, 0);
    this.group.add(table);

    const turntable = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.4, 0.14, 64),
      new THREE.MeshStandardMaterial({ color: COLORS.turntable, roughness: 0.48, metalness: 0.55 }),
    );
    turntable.position.y = tableTop;
    this.group.add(turntable);

    const fenceZ = width / 2 + 0.11;
    const fence = new THREE.Mesh(
      new THREE.BoxGeometry(11.8, 0.84, 0.18),
      new THREE.MeshStandardMaterial({ color: COLORS.fence, roughness: 0.42, metalness: 0.65 }),
    );
    fence.position.set(0, tableTop + 0.43, fenceZ);
    this.group.add(fence);

    const fenceLabel = textSprite("FENCE", 0xffffff, 0.36);
    fenceLabel.position.set(-4.7, tableTop + 1.03, fenceZ + 0.02);
    this.group.add(fenceLabel);

    const cutBottom = new THREE.Vector2(-run / 2, -width / 2);
    const cutTop = new THREE.Vector2(run / 2, width / 2);
    this.cutNormal.set(Math.cos(miter), 0, -Math.sin(miter));
    this.stockGroup = new THREE.Group();
    this.group.add(this.stockGroup);
    // A compound bevel carries the lower cut edge along the board's long axis.
    const bevelShift = height * Math.tan(bevel) / Math.cos(miter);
    this.leftPiece = this.makeStockPiece(
      [
        new THREE.Vector2(-halfLength, -width / 2),
        cutBottom,
        cutTop,
        new THREE.Vector2(-halfLength, width / 2),
      ],
      [1, 2],
      height,
      bevelShift,
      COLORS.woodLeft,
    );
    this.rightPiece = this.makeStockPiece(
      [
        cutBottom,
        new THREE.Vector2(halfLength, -width / 2),
        new THREE.Vector2(halfLength, width / 2),
        cutTop,
      ],
      [0, 3],
      height,
      bevelShift,
      COLORS.woodRight,
    );
    this.leftPiece.position.y = this.stockBase;
    this.rightPiece.position.y = this.stockBase;
    this.stockGroup.add(this.leftPiece, this.rightPiece);

    this.cutFace = this.makeCutFace(cutBottom, cutTop, height, bevelShift);
    this.cutFace.position.y = this.stockBase;
    this.stockGroup.add(this.cutFace);

    this.workshopGuidesGroup = new THREE.Group();
    this.group.add(this.workshopGuidesGroup);
    this.buildSawHead(miter, bevel, tableTop, width, bladeRadius);

    const stockLabel = textSprite("wood stock", 0xffffff, 0.35);
    stockLabel.position.set(-halfLength * 0.56, this.stockBase + height + 0.32, -width / 2 - 0.18);
    const bladeLabel = textSprite("blade plane", COLORS.guard, 0.34);
    bladeLabel.position.set(0.5, tableTop + 2.8, -0.9);
    this.stockGroup.add(stockLabel);
    this.workshopGuidesGroup.add(bladeLabel);

    const frame = this.regularFrameCandidate();
    if (frame) this.buildAssembly(frame, tableTop);
  }

  private makeStockPiece(
    points: THREE.Vector2[],
    cutIndices: readonly number[],
    height: number,
    bevelShift: number,
    color: number,
  ): THREE.Mesh {
    const bottom = points.map((point, index) => {
      const shifted = cutIndices.includes(index);
      return new THREE.Vector3(
        point.x + (shifted ? bevelShift : 0),
        0,
        point.y,
      );
    });
    const top = points.map((point) => new THREE.Vector3(point.x, height, point.y));
    const vertices = [...top, ...bottom].flatMap((point) => point.toArray());
    const indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.72,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    );
  }

  private makeCutFace(
    cutBottom: THREE.Vector2,
    cutTop: THREE.Vector2,
    height: number,
    bevelShift: number,
  ): THREE.Mesh {
    const points = [
      new THREE.Vector3(cutBottom.x, height, cutBottom.y),
      new THREE.Vector3(cutTop.x, height, cutTop.y),
      new THREE.Vector3(cutTop.x + bevelShift, 0, cutTop.y),
      new THREE.Vector3(cutBottom.x + bevelShift, 0, cutBottom.y),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    return new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: COLORS.endGrain,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
  }

  private regularFrameCandidate(): RegularPolygonFrame | undefined {
    if (Math.abs(this.params.bevel) > 1e-6 || Math.abs(this.params.miter) < 1e-6) return undefined;
    const sides = 180 / Math.abs(this.params.miter);
    const roundedSides = Math.round(sides);
    if (Math.abs(sides - roundedSides) > 1e-6 || roundedSides < 3 || roundedSides > 12) return undefined;
    const outerRadius = 2.05;
    const outerLength = 2 * outerRadius * Math.sin(Math.PI / roundedSides);
    const radialWidth = 0.34 * outerRadius * Math.cos(Math.PI / roundedSides);
    return regularPolygonFrame(roundedSides, outerLength, radialWidth);
  }

  private buildAssembly(frame: RegularPolygonFrame, tableTop: number): void {
    this.assemblyFrame = frame;
    this.assemblyGroup = new THREE.Group();
    this.assemblyGroup.visible = false;
    this.group.add(this.assemblyGroup);

    const outerRadius = 2.05;
    const radialWidth = (frame.outerLength - frame.innerLength) /
      (2 * Math.tan(Math.PI / frame.sides));
    const outerApothem = outerRadius * Math.cos(Math.PI / frame.sides);
    const centre = new THREE.Vector3(0, tableTop + 0.18, -1.65);

    const targetLoop: THREE.Vector3[] = [];
    for (let index = 0; index < frame.sides; index++) {
      const theta = (index * Math.PI * 2) / frame.sides;
      const outward = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
      const piece = this.makeAssemblyPiece(
        frame.outerLength,
        frame.innerLength,
        radialWidth,
        index % 2 === 0 ? COLORS.woodLeft : COLORS.woodRight,
      );
      piece.position.copy(centre).addScaledVector(outward, outerApothem - radialWidth / 2);
      piece.rotation.y = Math.PI / 2 - theta;
      piece.userData.target = piece.position.clone();
      piece.userData.start = piece.position.clone().addScaledVector(outward, 1.5);
      piece.visible = false;
      this.assemblyGroup.add(piece);
      this.assemblyPieces.push(piece);
      targetLoop.push(piece.position.clone());
    }

    const ghost = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(targetLoop),
      new THREE.LineBasicMaterial({ color: COLORS.endGrain, transparent: true, opacity: 0.45 }),
    );
    ghost.position.y += radialWidth / 2;
    this.assemblyGroup.add(ghost);

    for (let index = 0; index < frame.sides; index++) {
      const theta = ((index + 0.5) * Math.PI * 2) / frame.sides;
      const joint = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 16, 16),
        new THREE.MeshStandardMaterial({
          color: COLORS.guard,
          emissive: COLORS.guard,
          emissiveIntensity: 0.3,
        }),
      );
      joint.position.copy(centre).add(new THREE.Vector3(
        outerRadius * Math.cos(theta),
        0.22,
        outerRadius * Math.sin(theta),
      ));
      this.assemblyGroup.add(joint);
    }

    const label = textSprite(
      `${frame.sides} pieces · ${frame.cuts} mirrored cuts · orange = joined cut faces`,
      COLORS.endGrain,
      0.34,
    );
    label.position.copy(centre).add(new THREE.Vector3(0, 0.8, 0));
    this.assemblyGroup.add(label);
    const jointLabel = textSprite(
      `two ${fmt(frame.miterDegrees)}° settings meet at every ${fmt(frame.interiorAngleDegrees)}° corner`,
      COLORS.guard,
      0.3,
    );
    jointLabel.position.copy(centre).add(new THREE.Vector3(0, 0.48, -2.5));
    this.assemblyGroup.add(jointLabel);
    this.updateAssemblyAnimation();
  }

  private makeAssemblyPiece(
    outerLength: number,
    innerLength: number,
    radialWidth: number,
    color: number,
  ): THREE.Mesh {
    const points = [
      new THREE.Vector2(-outerLength / 2, -radialWidth / 2),
      new THREE.Vector2(outerLength / 2, -radialWidth / 2),
      new THREE.Vector2(innerLength / 2, radialWidth / 2),
      new THREE.Vector2(-innerLength / 2, radialWidth / 2),
    ];
    const shape = new THREE.Shape(points);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);
    const piece = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.02 }),
    );
    const topY = 0.145;
    const outerRight = new THREE.Vector3(outerLength / 2, topY, radialWidth / 2);
    const innerRight = new THREE.Vector3(innerLength / 2, topY, -radialWidth / 2);
    const innerLeft = new THREE.Vector3(-innerLength / 2, topY, -radialWidth / 2);
    const outerLeft = new THREE.Vector3(-outerLength / 2, topY, radialWidth / 2);
    for (const [from, to] of [[outerRight, innerRight], [innerLeft, outerLeft]]) {
      piece.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([from, to]),
        new THREE.LineBasicMaterial({ color: COLORS.guard }),
      ));
    }
    return piece;
  }

  private buildSawHead(
    miter: number,
    bevel: number,
    tableTop: number,
    width: number,
    bladeRadius: number,
  ): void {
    const carrier = new THREE.Group();
    carrier.position.set(0, this.stockTopY + bladeRadius * Math.cos(bevel) + 0.5, 0);
    this.bladeRestY = carrier.position.y;
    this.bladeCutY = this.stockTopY + 0.08;
    this.bladeCarrier = carrier;
    this.group.add(carrier);

    const turntable = new THREE.Group();
    turntable.rotation.y = miter;
    carrier.add(turntable);

    const bevelPivot = new THREE.Group();
    bevelPivot.rotation.z = bevel;
    turntable.add(bevelPivot);

    const bladeAssembly = new THREE.Group();
    bladeAssembly.rotation.z = Math.PI / 2;
    bevelPivot.add(bladeAssembly);

    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.54, 1.5, 24),
      new THREE.MeshStandardMaterial({ color: COLORS.housing, roughness: 0.35, metalness: 0.55 }),
    );
    motor.rotation.z = Math.PI / 2;
    motor.position.set(1.05, 0.35, 0);
    bladeAssembly.add(motor);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.26, 1.9),
      new THREE.MeshStandardMaterial({ color: COLORS.housing, roughness: 0.38, metalness: 0.4 }),
    );
    handle.position.set(1.65, 1.05, 0);
    handle.rotation.x = Math.PI / 5;
    bladeAssembly.add(handle);

    const spin = new THREE.Group();
    this.bladeSpin = spin;
    bladeAssembly.add(spin);
    const blade = new THREE.Mesh(
      new THREE.CylinderGeometry(bladeRadius, bladeRadius, 0.09, 64),
      new THREE.MeshStandardMaterial({ color: COLORS.blade, roughness: 0.22, metalness: 0.88 }),
    );
    spin.add(blade);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.13, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.bladeHub, roughness: 0.3, metalness: 0.75 }),
    );
    spin.add(hub);
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.11, bladeRadius * 1.6),
        new THREE.MeshStandardMaterial({ color: COLORS.bladeHub, roughness: 0.3, metalness: 0.7 }),
      );
      spoke.rotation.y = (Math.PI / 4) * i;
      spin.add(spoke);
    }

    const guard = new THREE.Mesh(
      new THREE.TorusGeometry(bladeRadius + 0.08, 0.13, 12, 48, Math.PI * 1.18),
      new THREE.MeshStandardMaterial({ color: COLORS.guard, roughness: 0.35, metalness: 0.35 }),
    );
    guard.rotation.x = Math.PI / 2;
    guard.rotation.z = Math.PI * 0.42;
    bladeAssembly.add(guard);

    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.02, Math.max(5.6, width + 1.1)),
      new THREE.MeshBasicMaterial({ color: COLORS.kerf }),
    );
    slot.position.y = tableTop + 0.08;
    slot.rotation.y = miter;
    this.workshopGuidesGroup?.add(slot);
  }

  private updateCutAnimation(): void {
    if (!this.bladeCarrier || !this.leftPiece || !this.rightPiece || !this.cutFace) return;
    const t = this.cutProgress;
    const stroke = smoothstep(0, 0.8, t);
    const carrierY = THREE.MathUtils.lerp(this.bladeRestY, this.bladeCutY, stroke);
    // Keep the tilted blade plane passing through the marked cut line at the stock top.
    const planeOffset = Math.tan(this.bevelRadians) * (this.stockTopY - carrierY);
    this.bladeCarrier.position.set(
      this.cutNormal.x * planeOffset,
      carrierY,
      this.cutNormal.z * planeOffset,
    );

    const open = smoothstep(0.62, 1, t);
    const kerf = 0.045;
    const separation = kerf + open * 0.68;
    if (this.cutNormal.z <= 0) {
      this.leftPiece.position.set(0, this.stockBase, 0);
      this.rightPiece.position.copy(this.cutNormal).multiplyScalar(separation).setY(this.stockBase);
    } else {
      this.leftPiece.position.copy(this.cutNormal).multiplyScalar(-separation).setY(this.stockBase);
      this.rightPiece.position.set(0, this.stockBase, 0);
    }
    (this.cutFace.material as THREE.MeshBasicMaterial).opacity = 0.08 + open * 0.72;
  }

  private updateAssemblyAnimation(): void {
    if (!this.assemblyGroup) return;
    this.assemblyGroup.visible = this.assemblyState !== "ready";
    for (let index = 0; index < this.assemblyPieces.length; index++) {
      const piece = this.assemblyPieces[index];
      const localProgress = THREE.MathUtils.clamp(
        (this.assemblyProgress - index / this.assemblyPieces.length) * this.assemblyPieces.length,
        0,
        1,
      );
      piece.visible = localProgress > 0;
      const eased = smoothstep(0, 1, localProgress);
      piece.position.lerpVectors(
        piece.userData.start as THREE.Vector3,
        piece.userData.target as THREE.Vector3,
        eased,
      );
      if (eased > 0) this.assemblyPlaced = Math.max(this.assemblyPlaced, index);
    }
  }

  private refreshAnimationUi(): void {
    const root = document.getElementById("info");
    const state = root?.querySelector<HTMLElement>("[data-miter-state]");
    const button = root?.querySelector<HTMLButtonElement>('[data-miter-action="cut"]');
    if (state) {
      state.textContent =
        this.cutState === "ready"
          ? "Blade raised — ready to cut"
          : this.cutState === "cutting"
            ? `Cutting… ${Math.round(this.cutProgress * 100)}%`
            : "Cut complete — inspect the separated faces";
    }
    if (button) {
      button.disabled = this.cutState === "cutting";
      button.textContent = this.cutState === "complete" ? "Reset cut" : "Animate cut";
    }
  }

  private refreshAssemblyUi(): void {
    const root = document.getElementById("info");
    const state = root?.querySelector<HTMLElement>("[data-miter-assembly-state]");
    const button = root?.querySelector<HTMLButtonElement>('[data-miter-action="assemble"]');
    if (!this.assemblyFrame) return;
    if (state) {
      state.dataset.miterAssembly = this.assemblyState;
      const placed = Math.min(this.assemblyFrame.sides, this.assemblyPlaced + 1);
      state.textContent =
        this.assemblyState === "ready"
          ? `${this.assemblyFrame.sides} pieces · ${this.assemblyFrame.cuts} mirrored cuts`
          : this.assemblyState === "building"
            ? `Joining piece ${placed} of ${this.assemblyFrame.sides}`
            : `${this.assemblyFrame.sides}-sided frame complete`;
    }
    if (button) {
      button.disabled = this.assemblyState === "building";
      button.textContent = this.assemblyState === "complete"
        ? "Replay frame assembly"
        : `Animate ${polygonName(this.assemblyFrame.sides).toLowerCase()} frame`;
    }
  }

  private currentCutListPlan(): CutListPlan {
    const parsed = parseCutList(this.cutList.raw);
    const plan = planCutList(
      this.cutList.stockLength,
      this.cutList.endTrim,
      this.cutList.kerf,
      parsed.parts,
    );
    return { ...plan, errors: [...parsed.errors, ...plan.errors] };
  }

  private refreshCutListUi(): void {
    const output = document.getElementById("cut-list-results");
    if (output) output.innerHTML = this.cutListResults(this.currentCutListPlan());
  }

  private cutListResults(plan: CutListPlan): string {
    if (plan.errors.length > 0) {
      return `<div class="cut-list-errors">${plan.errors.map((error) =>
        `<p class="err">${error.line ? `Line ${error.line}: ` : ""}${escapeHtml(error.message)}</p>`,
      ).join("")}</div>`;
    }
    if (plan.boards.length === 0) return `<p class="cut-list-empty">Add one or more parts to make a plan.</p>`;

    return `
      <div class="cut-list-summary">
        <b>${plan.boards.length} ${plan.boards.length === 1 ? "board" : "boards"}</b>
        <span>${plan.totalPieces} finished pieces · ${fmt(plan.yield)}% yield</span>
        <span>trim ${fmt(plan.totalTrimLoss)} mm · kerf ${fmt(plan.totalKerfLoss)} mm · offcut ${fmt(plan.totalOffcut)} mm</span>
      </div>
      ${plan.boards.map((board, index) => `
        <section class="cut-list-board">
          <div class="cut-list-board-head">
            <b>Board ${index + 1}</b>
            <span>offcut ${fmt(board.offcut)} mm</span>
          </div>
          <div class="cut-list-strip" aria-label="Board ${index + 1} cutting layout; kerf gaps are exaggerated">
            <i class="cut-list-trim" style="flex-grow:${this.cutList.endTrim}">trim</i>
            ${board.pieces.map((piece, pieceIndex) => `
              ${pieceIndex > 0 ? `<i class="cut-list-kerf" title="${fmt(this.cutList.kerf)} mm kerf"></i>` : ""}
              <span class="cut-list-piece" style="flex-grow:${piece.length}" title="${escapeHtml(piece.name)}: ${fmt(piece.length)} mm">
                ${escapeHtml(piece.name)}<small>${fmt(piece.length)} mm</small>
              </span>`).join("")}
            <i class="cut-list-offcut" style="flex-grow:${board.offcut}">offcut</i>
            <i class="cut-list-trim" style="flex-grow:${this.cutList.endTrim}">trim</i>
          </div>
          <p class="cut-list-marks">Keep-side marks from the trimmed reference end:
            ${board.pieces.map((piece) => `${escapeHtml(piece.name)} ends at ${fmt(piece.end)} mm`).join(" · ")}</p>
        </section>`).join("")}
      <p class="cut-list-note">Fast first-fit plan only: it does not account for grain matching, defects, blade-side choice, or reserving offcuts for another job. Kerf gaps are drawn wider than scale.</p>`;
  }

  private renderInfo(cut: ReturnType<typeof miterSawCut>): void {
    const bevelFlat = cut.bevelMagnitudeDegrees < 0.001;
    const direction = this.params.miter < 0 ? "left" : this.params.miter > 0 ? "right" : "square";
    const frame = this.regularFrameCandidate();
    this.setInfo(`
      <h2>Mitre Saw Cut Planner</h2>
      <p>Orbit the workshop view: the board stays against the fence while the saw head turns for
      <b>miter</b>, tilts for <b>bevel</b>, then drops through the stock. The highlighted face is
      the plane the blade makes.</p>

      <div class="course miter-calculator">
        <h3>Stock and saw settings</h3>
        <div class="geom-fields miter-inputs">
          ${this.input("width", "Board width", this.params.width, 10, 500, "mm")}
          ${this.input("thickness", "Board thickness", this.params.thickness, 3, 100, "mm")}
          ${this.input("miter", "Miter setting", this.params.miter, -60, 60, "°")}
          ${this.input("bevel", "Bevel setting", this.params.bevel, -45, 45, "°")}
        </div>
        <div class="miter-examples" aria-label="Common flat-frame cuts">
          ${REGULAR_FRAME_EXAMPLES.map((example) => `
            <button type="button" data-miter-example="${example.sides}">
              <b>${example.label}</b><span>${example.setting} · ${example.sides} pieces</span>
            </button>`).join("")}
          <button type="button" data-miter-preset="compound">
            <b>Compound</b><span>45° miter · 30° bevel</span>
          </button>
        </div>
        <div class="miter-actions">
          <button type="button" data-miter-action="cut">Animate cut</button>
          <span data-miter-state>Blade raised — ready to cut</span>
        </div>
        ${
          frame
            ? `<div class="miter-actions miter-assembly">
                <button type="button" data-miter-action="assemble">
                  Animate ${polygonName(frame.sides).toLowerCase()} frame
                </button>
                <span data-miter-assembly-state data-miter-assembly="ready">
                  ${frame.sides} pieces · ${frame.cuts} mirrored cuts
                </span>
              </div>
              <p class="miter-frame-note">${frame.sides} pieces with two mirror-image ${fmt(frame.miterDegrees)}° cuts each
              make ${fmt(frame.interiorAngleDegrees)}° corners. In the assembly, alternating wood colours separate the pieces
              and orange edges are the two mitred cut faces that touch at each joint. Cut one end left, then the other right
              (or flip the stock).</p>`
            : `<p class="miter-frame-note">Set bevel to 0° and miter to 180° ÷ a whole number from 3 to 12 to animate a regular flat frame.</p>`
        }
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

      <details class="course cut-list-planner" open>
        <summary>Cut-list &amp; kerf planner</summary>
        <p class="course-hint">One row per part: <code>name, length mm, quantity</code>. Quantity defaults to 1; blank rows and <code># comments</code> are ignored.</p>
        <div class="geom-fields cut-list-inputs">
          ${this.cutListInput("stockLength", "Stock length", this.cutList.stockLength)}
          ${this.cutListInput("endTrim", "End trim, each end", this.cutList.endTrim)}
          ${this.cutListInput("kerf", "Kerf between parts", this.cutList.kerf)}
        </div>
        <label class="cut-list-parts">
          <span>Finished parts</span>
          <textarea data-cut-list-input="parts" rows="4">${escapeHtml(this.cutList.raw)}</textarea>
        </label>
        <div id="cut-list-results">${this.cutListResults(this.currentCutListPlan())}</div>
      </details>

      ${
        bevelFlat
          ? `<p class="example"><b>Flat-frame joint:</b> two matching ${fmt(cut.miterMagnitudeDegrees)}° mitres close a
            <b>${fmt(cut.flatFrameCornerDegrees)}°</b> corner. For a regular polygon with <i>n</i> sides,
            set the saw to 180° ÷ <i>n</i>: 45° for a square, 30° for a hexagon.</p>`
          : `<p class="example"><b>Compound cut:</b> miter keeps the top trace fixed while bevel tilts the
            highlighted cut plane through the stock, leaving the shown parallelogram face.</p>`
      }

      <p><b>What the animation simplifies:</b> the visible kerf and piece separation make the cut readable.
      The calculator remains the zero-kerf ideal measurement, so allow for your blade's real kerf when marking stock.</p>
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
        <input data-miter-input="${id}" type="number" min="${min}" max="${max}" step="${id === "miter" || id === "bevel" ? "0.5" : "1"}" value="${value}" />
        <em>${unit}</em>
      </label>`;
  }

  private cutListInput(id: "stockLength" | "endTrim" | "kerf", label: string, value: number): string {
    return `
      <label class="geom-field">
        <span>${label}</span>
        <input data-cut-list-input="${id}" type="number" min="0" step="0.1" value="${value}" />
        <em>mm</em>
      </label>`;
  }

  private clearScene(): void {
    this.bladeCarrier = undefined;
    this.bladeSpin = undefined;
    this.leftPiece = undefined;
    this.rightPiece = undefined;
    this.cutFace = undefined;
    this.stockGroup = undefined;
    this.workshopGuidesGroup = undefined;
    this.assemblyGroup = undefined;
    this.assemblyPieces = [];
    this.assemblyFrame = undefined;
    this.assemblyPlaced = -1;
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
      const sprite = object as THREE.Sprite;
      sprite.material?.map?.dispose();
    });
    this.group.clear();
  }
}

function smoothstep(min: number, max: number, value: number): number {
  const t = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
}

function fmt(value: number): string {
  return value.toFixed(1);
}

function polygonName(sides: number): string {
  return REGULAR_FRAME_EXAMPLES.find((example) => example.sides === sides)?.label ?? `${sides}-sided`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}
