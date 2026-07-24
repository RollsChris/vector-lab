import * as THREE from "three";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import { marker, segment, setSpriteText, textSprite, tip } from "./helpers";
import "./formulaDerivations/trigonometricFunctions";

const DEG = Math.PI / 180;
const SPECIAL_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
const AXIS_EPSILON = 1e-9;
const LIMITING_SCALE_CAP = 4.5;
const LIMITING_THICKNESS = 0.12;
type TrigFunction = "sin" | "cos" | "tan" | "sec" | "cosec" | "cot";
type ComparisonFunction = "sec" | "cosec" | "cot";
type TrigPanelTab = "concept" | "construction" | "comparison" | "history";

/**
 * Lesson 10 — Trigonometric Functions.
 *
 * The stage deliberately reveals one idea at a time. The original right triangle is
 * always the anchor; external tangent constructions only appear when the learner asks
 * for them.
 */
export class TrigonometricFunctionsLesson implements Lesson {
  readonly id = "trig-functions";
  readonly title = "10 · Trigonometric Functions";
  readonly blurb = "Build sin, cos and tan from one right triangle";
  readonly category = "Trigonometry" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["radians", "triangle-theorems"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private viewport?: LessonContext["viewport"];
  private stopTick?: () => void;
  private angleCtl?: { updateDisplay(): void };
  private animateCtl?: { updateDisplay(): void };
  private selectedFunction: TrigFunction | null = null;
  private identityProofShown = false;
  private tanConstructionShown = false;
  private secConstructionShown = false;
  private cosecConstructionShown = false;
  private comparisonFunction: ComparisonFunction | null = null;
  private comparisonFrameActive = false;
  private comparisonAnimating = false;
  private comparisonProgress = 0;
  private comparisonSourceSignature = "";
  private activePanelTab: TrigPanelTab = "concept";
  private readonly comparisonDuration = 1.1;

  private readonly center = new THREE.Vector3(0, 0, 0);
  private readonly params = {
    angleDeg: 45,
    startAngleDeg: 0,
    radius: 5,
    unit: "deg" as "deg" | "rad",
    animate: false,
    speed: 45,
  };

  private circleLine!: THREE.Line;
  private radiusLine!: THREE.Line;
  private originalBase!: THREE.Line;
  private originalRise!: THREE.Line;
  private originalTriangle!: THREE.Mesh;
  private originalRightAngle!: THREE.Line;
  private thetaArc!: THREE.Line;
  private point = marker(0xffd166, 0.13);

  private sinSeg!: THREE.Line;
  private cosSeg!: THREE.Line;
  private tanSeg!: THREE.Line;
  private secSeg!: THREE.Line;
  private cosecSeg!: THREE.Line;
  private cotSeg!: THREE.Line;
  private secTriangle!: THREE.Mesh;
  private cosecTriangle!: THREE.Mesh;
  private pointRightAngle!: THREE.Line;

  private radiusLabel!: THREE.Sprite;
  private sinLabel!: THREE.Sprite;
  private cosLabel!: THREE.Sprite;
  private tanLabel!: THREE.Sprite;
  private secLabel!: THREE.Sprite;
  private cosecLabel!: THREE.Sprite;
  private cotLabel!: THREE.Sprite;
  private thetaLabel!: THREE.Sprite;
  private pointTangentLabel!: THREE.Sprite;
  private similarityLabel!: THREE.Sprite;
  private originalRightAngleLabel!: THREE.Sprite;
  private pointRightAngleLabel!: THREE.Sprite;
  private originVertexLabel!: THREE.Sprite;
  private footVertexLabel!: THREE.Sprite;
  private pointVertexLabel!: THREE.Sprite;
  private interceptVertexLabel!: THREE.Sprite;
  private comparisonGroup!: THREE.Group;
  private comparisonSmallGroup!: THREE.Group;
  private comparisonLargeGroup!: THREE.Group;
  private comparisonSmallTriangle!: THREE.Mesh;
  private comparisonLargeTriangle!: THREE.Mesh;
  private comparisonSmallSides!: THREE.Line[];
  private comparisonLargeSides!: THREE.Line[];
  private comparisonRightAngles!: THREE.Line[];
  private comparisonSmallTitle!: THREE.Sprite;
  private comparisonLargeTitle!: THREE.Sprite;
  private comparisonVertexLabels!: THREE.Sprite[];
  private comparisonSideLabels!: THREE.Sprite[];
  private comparisonTitle!: THREE.Sprite;
  private comparisonAaLegend!: THREE.Sprite;
  private comparisonAaConclusion!: THREE.Sprite;
  private comparisonSideLegend!: THREE.Sprite;
  private identityAreaGroup!: THREE.Group;
  private identityAreaSquares!: THREE.Mesh[];
  private identityAreaOutlines!: THREE.Line[];
  private identityAreaLabels!: THREE.Sprite[];
  private identityAreaSymbols!: THREE.Sprite[];
  private identityAreaTitle!: THREE.Sprite;
  private labelText: Record<string, string> = {};

  private infoClickHandler = (event: Event): void => {
    const target = event.target as HTMLElement;
    const angleButton = target.closest<HTMLButtonElement>("[data-trig-angle]");
    if (angleButton) {
      this.params.angleDeg = Number(angleButton.dataset.trigAngle);
      this.angleCtl?.updateDisplay();
      this.redraw();
      return;
    }

    if (target.closest("[data-trig-reset]")) {
      this.resetComparison();
      this.selectedFunction = null;
      this.identityProofShown = false;
      this.activePanelTab = "concept";
      this.tanConstructionShown = false;
      this.secConstructionShown = false;
      this.cosecConstructionShown = false;
      this.redraw();
      return;
    }

    if (target.closest("[data-trig-identity]")) {
      this.resetComparison();
      this.selectedFunction = null;
      this.identityProofShown = true;
      this.activePanelTab = "concept";
      this.tanConstructionShown = false;
      this.secConstructionShown = false;
      this.cosecConstructionShown = false;
      this.params.animate = false;
      this.animateCtl?.updateDisplay();
      this.redraw();
      return;
    }

    if (target.closest("[data-trig-tangent-proof]")) {
      this.resetComparison();
      this.identityProofShown = false;
      this.selectedFunction = "tan";
      this.activePanelTab = "construction";
      this.tanConstructionShown = true;
      this.secConstructionShown = false;
      this.cosecConstructionShown = false;
      this.redraw();
      return;
    }

    if (target.closest("[data-trig-secant-proof]")) {
      this.resetComparison();
      this.identityProofShown = false;
      this.selectedFunction = "sec";
      this.activePanelTab = "construction";
      this.tanConstructionShown = false;
      this.secConstructionShown = true;
      this.cosecConstructionShown = false;
      this.prepareComparison("sec");
      this.redraw();
      return;
    }

    if (target.closest("[data-trig-cosecant-proof]")) {
      this.resetComparison();
      this.identityProofShown = false;
      this.selectedFunction = "cosec";
      this.activePanelTab = "construction";
      this.tanConstructionShown = false;
      this.secConstructionShown = false;
      this.cosecConstructionShown = true;
      this.prepareComparison("cosec");
      this.redraw();
      return;
    }

    const comparisonButton = target.closest<HTMLButtonElement>("[data-trig-comparison]");
    if (comparisonButton) {
      const comparison = comparisonButton.dataset.trigComparison;
      if (
        (comparison === "sec" && this.selectedFunction === "sec" && this.secConstructionShown)
        || (comparison === "cosec" && this.selectedFunction === "cosec" && this.cosecConstructionShown)
        || (comparison === "cot" && this.selectedFunction === "cot")
      ) {
        this.startComparison();
        this.activePanelTab = "comparison";
        this.redraw();
      }
      return;
    }

    const tabButton = target.closest<HTMLButtonElement>("[data-trig-panel-tab]");
    if (tabButton) {
      this.activePanelTab = tabButton.dataset.trigPanelTab as TrigPanelTab;
      this.redraw();
      return;
    }

    const functionButton = target.closest<HTMLButtonElement>("[data-trig-function]");
    if (!functionButton) return;
    const nextFunction = functionButton.dataset.trigFunction as TrigFunction;
    const previousFunction = this.selectedFunction;
    const sharedTriangleWorkspace = (previousFunction === "sec"
      || previousFunction === "cosec"
      || previousFunction === "cot")
      && (nextFunction === "sec" || nextFunction === "cosec" || nextFunction === "cot");
    const comparisonWasVisible = this.comparisonGroup.visible;
    const constructionWasShown = this.secConstructionShown
      || this.cosecConstructionShown
      || previousFunction === "cot";
    if (!sharedTriangleWorkspace) this.resetComparison();
    this.identityProofShown = false;
    this.selectedFunction = nextFunction;
    this.tanConstructionShown = false;
    this.secConstructionShown = sharedTriangleWorkspace && constructionWasShown && nextFunction === "sec";
    this.cosecConstructionShown = sharedTriangleWorkspace && constructionWasShown && nextFunction === "cosec";
    if (sharedTriangleWorkspace) {
      this.configureComparison(nextFunction as ComparisonFunction, comparisonWasVisible);
    } else {
      this.activePanelTab = "concept";
      if (this.selectedFunction === "cot") this.prepareComparison("cot");
    }
    this.redraw();
  };

  private get R(): number {
    return this.params.radius;
  }

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0, 20), this.center);

    this.buildScene();

    const g = ctx.gui;
    this.angleCtl = tip(
      g.add(this.params, "angleDeg", 0, 360, 1).name("Angle θ (°)"),
      "Sweep from the chosen start angle. The triangle uses the final angle φ = start + θ.",
    ).onChange(() => {
      this.redraw();
    });
    tip(
      g.add(this.params, "startAngleDeg", -180, 180, 1).name("Start angle (°)"),
      "Rotate the starting direction; the final standard angle is φ = start + θ.",
    ).onChange(() => {
      this.redraw();
    });
    tip(
      g.add(this.params, "radius", 1, 5, 0.1).name("Radius R"),
      "Resize the triangle. Its side lengths change, but all six ratios stay the same.",
    ).onChange(() => {
      this.rebuildScene();
    });
    tip(g.add(this.params, "unit", ["deg", "rad"]).name("Display unit"), "Display angles in degrees or radians.")
      .onChange(() => this.redraw());
    this.animateCtl = tip(
      g.add(this.params, "animate").name("Animate"),
      "Off by default: turn on only when you want to sweep continuously.",
    )
      .onChange(() => {
        if (this.params.animate) {
          this.redraw();
        }
      });
    tip(g.add(this.params, "speed", -180, 180, 5).name("Speed (°/s)"), "Animation speed and direction.");

    this.renderPanel();
    this.redraw();
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    this.viewport = undefined;
    this.comparisonFrameActive = false;
    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    this.resetComparison();
    this.group.parent?.remove(this.group);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
  }

  private buildScene(): void {
    this.labelText = {};
    const c = this.center;
    this.circleLine = this.makeLine(0x58a6ff, 0.9);
    const circleMaterial = this.circleLine.material as THREE.LineBasicMaterial;
    circleMaterial.depthTest = false;
    circleMaterial.depthWrite = false;
    this.circleLine.renderOrder = -1;
    this.radiusLine = this.makeLine(0xf0f6fc, 1);
    this.originalBase = this.makeLine(0x8b949e, 0.3);
    this.originalRise = this.makeLine(0x8b949e, 0.3);
    this.originalRightAngle = this.makeLine(0x8b949e, 0.65);
    this.thetaArc = this.makeLine(0xffd166, 0.9);

    this.sinSeg = this.makeLine(0xff5d5d, 1);
    this.cosSeg = this.makeLine(0x5db4ff, 1);
    this.tanSeg = this.makeLine(0x5dff8f, 1);
    this.secSeg = this.makeLine(0xffa657, 1);
    this.cosecSeg = this.makeLine(0x39c5cf, 1);
    this.cotSeg = this.makeLine(0xffd166, 1);
    this.pointRightAngle = this.makeLine(0x7ee787, 1);

    this.originalTriangle = this.createTriangle(0xffffff, 0.045);
    this.secTriangle = this.createTriangle(0x5dff8f, 0.1);
    this.cosecTriangle = this.createTriangle(0x39c5cf, 0.1);
    this.point = marker(0xffd166, 0.13);

    this.radiusLabel = textSprite("R", 0xf0f6fc, 0.3);
    this.sinLabel = textSprite("y", 0xff5d5d, 0.3);
    this.cosLabel = textSprite("x", 0x5db4ff, 0.3);
    this.tanLabel = textSprite("R tan φ", 0x5dff8f, 0.3);
    this.secLabel = textSprite("R sec φ", 0xffa657, 0.3);
    this.cosecLabel = textSprite("R cosec φ", 0x39c5cf, 0.3);
    this.cotLabel = textSprite("R cot φ", 0xffd166, 0.3);
    this.thetaLabel = textSprite("φ", 0xffd166, 0.28);
    this.pointTangentLabel = textSprite("tangent at P", 0x7ee787, 0.27);
    this.similarityLabel = textSprite("shared α", 0xd2a8ff, 0.27);
    this.originalRightAngleLabel = textSprite("90°", 0x8b949e, 0.22);
    this.pointRightAngleLabel = textSprite("90°", 0x7ee787, 0.22);
    this.originVertexLabel = textSprite("O", 0xf0f6fc, 0.3);
    this.footVertexLabel = textSprite("H", 0xf0f6fc, 0.3);
    this.pointVertexLabel = textSprite("P", 0xffd166, 0.3);
    this.interceptVertexLabel = textSprite("Q", 0x5dff8f, 0.3);
    this.originVertexLabel.userData.label = "O";
    this.footVertexLabel.userData.label = "H";
    this.pointVertexLabel.userData.label = "P";
    this.interceptVertexLabel.userData.label = "Q";
    this.buildComparisonScene();
    this.buildIdentityAreaScene();

    this.group.add(
      this.circleLine,
      this.originalTriangle,
      this.secTriangle,
      this.cosecTriangle,
      this.originalBase,
      this.originalRise,
      this.radiusLine,
      this.sinSeg,
      this.cosSeg,
      this.tanSeg,
      this.secSeg,
      this.cosecSeg,
      this.cotSeg,
      this.originalRightAngle,
      this.pointRightAngle,
      this.thetaArc,
      this.point,
      this.radiusLabel,
      this.sinLabel,
      this.cosLabel,
      this.tanLabel,
      this.secLabel,
      this.cosecLabel,
      this.cotLabel,
      this.thetaLabel,
      this.pointTangentLabel,
      this.similarityLabel,
      this.originalRightAngleLabel,
      this.pointRightAngleLabel,
      this.originVertexLabel,
      this.footVertexLabel,
      this.pointVertexLabel,
      this.interceptVertexLabel,
      this.comparisonGroup,
      this.identityAreaGroup,
    );

    this.setLine(this.radiusLine, c, c);
  }

  private buildIdentityAreaScene(): void {
    this.identityAreaGroup = new THREE.Group();
    this.identityAreaSquares = [
      this.createTriangle(0x5db4ff, 0.34),
      this.createTriangle(0xff5d5d, 0.34),
      this.createTriangle(0x7ee787, 0.24),
    ];
    this.identityAreaOutlines = [
      this.makeLine(0x5db4ff, 1),
      this.makeLine(0xff5d5d, 1),
      this.makeLine(0xf0f6fc, 1),
    ];
    this.identityAreaLabels = [
      textSprite("x²", 0x5db4ff, 0.27),
      textSprite("y²", 0xff5d5d, 0.27),
      textSprite("R²", 0xf0f6fc, 0.27),
    ];
    this.identityAreaSymbols = [
      textSprite("+", 0xf0f6fc, 0.36),
      textSprite("=", 0x7ee787, 0.36),
    ];
    this.identityAreaTitle = textSprite("Pythagoras: x² + y² = R²", 0x7ee787, 0.32);
    this.identityAreaGroup.add(
      ...this.identityAreaSquares,
      ...this.identityAreaOutlines,
      ...this.identityAreaLabels,
      ...this.identityAreaSymbols,
      this.identityAreaTitle,
    );
    this.identityAreaGroup.visible = false;
    this.identityAreaGroup.userData.kind = "pythagorean-area-equation";
  }

  private buildComparisonScene(): void {
    const sideColors = [0x5db4ff, 0x7ee787, 0xd2a8ff];
    this.comparisonGroup = new THREE.Group();
    this.comparisonSmallGroup = new THREE.Group();
    this.comparisonLargeGroup = new THREE.Group();
    this.comparisonSmallTriangle = this.createTriangle(0xf0f6fc, 0.09);
    this.comparisonLargeTriangle = this.createTriangle(0xffa657, 0.12);
    this.comparisonSmallSides = sideColors.map((color) => this.makeLine(color, 1));
    this.comparisonLargeSides = sideColors.map((color) => this.makeLine(color, 1));
    this.comparisonRightAngles = [this.makeLine(0x7ee787, 1), this.makeLine(0x7ee787, 1)];
    this.comparisonSmallTitle = textSprite("SMALL OHP", 0xf0f6fc, 0.36);
    this.comparisonLargeTitle = textSprite("LARGE", 0xffa657, 0.4);
    this.comparisonVertexLabels = Array.from({ length: 6 }, () => textSprite("vertex", 0xffffff, 0.27));
    this.comparisonSideLabels = Array.from({ length: 6 }, (_, index) =>
      textSprite("side", sideColors[index % 3], 0.28));
    this.comparisonTitle = textSprite("Triangle comparison", 0xf0f6fc, 0.4);
    this.comparisonAaLegend = textSprite("AA similarity", 0x7ee787, 0.29);
    this.comparisonAaConclusion = textSprite("", 0x7ee787, 0.29);
    this.comparisonSideLegend = textSprite("Matching sides", 0xd2a8ff, 0.29);

    this.comparisonSmallGroup.add(
      this.comparisonSmallTriangle,
      ...this.comparisonSmallSides,
      this.comparisonRightAngles[0],
      this.comparisonSmallTitle,
      ...this.comparisonVertexLabels.slice(0, 3),
      ...this.comparisonSideLabels.slice(0, 3),
    );
    this.comparisonLargeGroup.add(
      this.comparisonLargeTriangle,
      ...this.comparisonLargeSides,
      this.comparisonRightAngles[1],
      this.comparisonLargeTitle,
      ...this.comparisonVertexLabels.slice(3),
      ...this.comparisonSideLabels.slice(3),
    );
    this.comparisonGroup.add(
      this.comparisonSmallGroup,
      this.comparisonLargeGroup,
      this.comparisonTitle,
      this.comparisonAaLegend,
      this.comparisonAaConclusion,
      this.comparisonSideLegend,
    );
    this.comparisonGroup.visible = false;
    this.comparisonGroup.position.set(10.5, 0, 0);
    this.comparisonGroup.userData = {
      function: null,
      smallTriangle: null,
      largeTriangle: null,
      vertexPairs: [],
      sidePairs: [],
      anglePairs: [],
      animationProgress: 0,
      animating: false,
    };
  }

  private prepareComparison(comparison: ComparisonFunction): void {
    this.configureComparison(comparison, false);
  }

  private configureComparison(comparison: ComparisonFunction, visible: boolean): void {
    this.comparisonFunction = comparison;
    this.comparisonAnimating = false;
    this.comparisonProgress = visible ? 1 : 0;
    this.comparisonSourceSignature = this.currentComparisonSignature();
    this.comparisonGroup.visible = visible;
  }

  private startComparison(): void {
    if (!this.comparisonFunction) return;
    this.params.animate = false;
    this.animateCtl?.updateDisplay();
    this.comparisonAnimating = true;
    this.comparisonProgress = 0;
    this.comparisonSourceSignature = this.currentComparisonSignature();
    this.comparisonGroup.visible = true;
    this.applyComparisonAnimation();
  }

  private resetComparison(): void {
    this.comparisonFunction = null;
    this.comparisonAnimating = false;
    this.comparisonProgress = 0;
    this.comparisonSourceSignature = "";
    if (!this.comparisonGroup) return;
    this.comparisonGroup.visible = false;
    this.comparisonGroup.userData.function = null;
    this.comparisonGroup.userData.animationProgress = 0;
    this.comparisonGroup.userData.animating = false;
  }

  private tickComparison(dt: number): void {
    this.comparisonProgress = Math.min(1, this.comparisonProgress + dt / this.comparisonDuration);
    this.applyComparisonAnimation();
    if (this.comparisonProgress >= 1) this.comparisonAnimating = false;
    this.comparisonGroup.userData.animating = this.comparisonAnimating;
  }

  private updateComparisonScene(standardAngle: number, cosT: number, sinT: number): void {
    if (!this.comparisonFunction) return;
    const referenceAngle = this.referenceAngle(standardAngle / DEG);
    const angle = referenceAngle * DEG;
    const shapeWidth = Math.abs(Math.cos(angle));
    const shapeHeight = Math.abs(Math.sin(angle));
    const isSec = this.comparisonFunction === "sec";
    const isCot = this.comparisonFunction === "cot";
    const comparisonName = isSec ? "SECANT" : isCot ? "COTANGENT" : "COSECANT";
    const comparisonColor = isSec ? 0xffa657 : isCot ? 0xffd166 : 0x39c5cf;
    const denominator = isSec ? cosT : sinT;
    const functionUndefined = Math.abs(denominator) <= AXIS_EPSILON;
    const degenerate = shapeWidth <= AXIS_EPSILON || shapeHeight <= AXIS_EPSILON;
    const factor = functionUndefined ? LIMITING_SCALE_CAP : Math.abs(1 / denominator);
    const smallMax = Math.min(2.55, 4.5 / factor);
    const visualWidth = degenerate ? Math.max(shapeWidth, LIMITING_THICKNESS) : shapeWidth;
    const visualHeight = degenerate ? Math.max(shapeHeight, LIMITING_THICKNESS) : shapeHeight;
    const shapeScale = smallMax / Math.max(visualWidth, visualHeight);
    const smallWidth = visualWidth * shapeScale;
    const smallHeight = visualHeight * shapeScale;
    const largeWidth = smallWidth * factor;
    const largeHeight = smallHeight * factor;
    const complement = 90 - referenceAngle;
    const angleText = `${Number(referenceAngle.toFixed(1))}°`;
    const complementText = `${Number(complement.toFixed(1))}°`;
    const limitNote = functionUndefined
      ? `${isSec ? "cos" : "sin"} φ is zero here, so ${isSec ? "sec" : isCot ? "cot" : "cosec"} φ is undefined. The thin diagram shows the limiting shape; its scale is capped for display.`
      : "At this axis angle both triangles are degenerate. Their thin sides preserve the limiting shape.";
    const smallVertices = isSec
      ? ["O · φ", "H · 90°", "P · 90°−φ"]
      : [`O · φ · ${angleText}`, "H · 90°", `P · 90°−φ · ${complementText}`];

    this.updateComparisonTriangle(
      this.comparisonSmallGroup,
      this.comparisonSmallTriangle,
      this.comparisonSmallSides,
      this.comparisonRightAngles[0],
      this.comparisonSmallTitle,
      this.comparisonVertexLabels.slice(0, 3),
      this.comparisonSideLabels.slice(0, 3),
      smallWidth,
      smallHeight,
      "SMALL · OHP",
      smallVertices,
      ["OH", "HP", "OP"],
    );

    const largeVertices = isSec
      ? ["O · φ", "P · 90°", "Q · 90°−φ"]
      : [`S · φ · ${angleText}`, "P · 90°", `O · 90°−φ · ${complementText}`];
    const largeSides = isSec ? ["OP", "PQ", "OQ"] : ["SP", "OP", "OS"];
    const largeName = isSec ? "LARGE · OQP" : "LARGE · OSP";
    this.setTriangleStyle(this.comparisonLargeTriangle, comparisonColor, 0.12);
    this.updateComparisonTriangle(
      this.comparisonLargeGroup,
      this.comparisonLargeTriangle,
      this.comparisonLargeSides,
      this.comparisonRightAngles[1],
      this.comparisonLargeTitle,
      this.comparisonVertexLabels.slice(3),
      this.comparisonSideLabels.slice(3),
      largeWidth,
      largeHeight,
      largeName,
      largeVertices,
      largeSides,
    );
    this.setComparisonLabel(
      this.comparisonLargeTitle,
      "comparison-large-title",
      largeName,
      comparisonColor,
    );

    const vertexPairs = isSec ? ["O ↔ O", "H ↔ P", "P ↔ Q"] : ["O ↔ S", "H ↔ P", "P ↔ O"];
    const sidePairs = isSec ? ["OH ↔ OP", "HP ↔ PQ", "OP ↔ OQ"] : ["OH ↔ SP", "HP ↔ OP", "OP ↔ OS"];
    const proofChain = isSec
      ? "AA: same ray / x-axis extension + projection ⟂ + radius ⟂ tangent ⇒ OHP ∼ OPQ"
      : isCot
      ? "OHP ∼ SPO: OH ↔ SP, HP ↔ OP, OP ↔ OS; scale by R/y, so SP = R·cot φ"
      : "Panel angle ledger independently derives all six angles before matching O→S, H→P, P→O; AAA proves OHP ∼ SPO (AA already suffices)";
    const proofSteps = degenerate
      ? [proofChain, limitNote]
      : isSec
      ? [proofChain, ""]
      : isCot
      ? [
          "Same angle correspondence as the cosecant comparison: O→S, H→P, P→O.",
          "OH ↔ SP and the scale is R/y, so SP = x·R/y = R·cot φ.",
        ]
      : [
          `Panel ledger: small O ${angleText} · H 90° · P ${complementText}`,
          `large S ${angleText} · P 90° · O ${complementText} · AAA (AA suffices)`,
        ];
    const anglePairs = isSec
      ? [
          `O ↔ O: φ = ${referenceAngle.toFixed(1)}°`,
          "H ↔ P: 90°",
          `P ↔ Q: 90°−φ = ${complement.toFixed(1)}°`,
        ]
      : [
          `O ↔ S: φ = ${referenceAngle.toFixed(1)}°`,
          "H ↔ P: 90°",
          `P ↔ O: 90°−φ = ${complement.toFixed(1)}°`,
        ];
    this.setComparisonLabel(
      this.comparisonTitle,
      "comparison-title",
      `${comparisonName}${degenerate ? " · limiting axis diagram" : isCot ? " · cotangent side" : isSec ? "" : " · derived angle ledger"} · ${largeName.replace("LARGE · ", "small OHP ↔ large ")}`,
      comparisonColor,
    );
    this.setComparisonLabel(
      this.comparisonAaLegend,
      "comparison-aa",
      proofSteps[0],
      0x7ee787,
    );
    this.setComparisonLabel(
      this.comparisonAaConclusion,
      "comparison-aa-conclusion",
      proofSteps[1],
      0x7ee787,
    );
    this.setComparisonLabel(
      this.comparisonSideLegend,
      "comparison-sides",
      isCot
        ? "Cotangent side: SP = OH × (R/y) = R·cot φ"
        : `Matching sides: ${sidePairs.join("  ·  ")}`,
      0xd2a8ff,
    );
    this.comparisonTitle.position.set(0, 5.75, 0.2);
    this.comparisonAaLegend.position.set(0, 5.15, 0.2);
    this.comparisonAaConclusion.position.set(0, 4.75, 0.2);
    this.comparisonSideLegend.position.set(0, -3.45, 0.2);

    this.comparisonSmallGroup.userData.endPosition = new THREE.Vector3(-4.85, -1.65, 0.12);
    this.comparisonLargeGroup.userData.endPosition = new THREE.Vector3(0.75, -1.65, 0.12);
    const circlePoint = new THREE.Vector3(this.R * cosT, this.R * sinT, 0);
    const foot = new THREE.Vector3(circlePoint.x, 0, 0);
    this.setComparisonSourceTransform(
      this.comparisonSmallGroup,
      this.center,
      foot,
      circlePoint,
      smallWidth,
      smallHeight,
    );
    if (isSec) {
      const interceptX = functionUndefined
        ? this.R * LIMITING_SCALE_CAP * Math.sign(cosT || 1)
        : this.R / cosT;
      this.setComparisonSourceTransform(
        this.comparisonLargeGroup,
        this.center,
        circlePoint,
        new THREE.Vector3(interceptX, 0, 0),
        largeWidth,
        largeHeight,
      );
    } else {
      const interceptY = functionUndefined
        ? this.R * LIMITING_SCALE_CAP * Math.sign(sinT || 1)
        : this.R / sinT;
      this.setComparisonSourceTransform(
        this.comparisonLargeGroup,
        new THREE.Vector3(0, interceptY, 0),
        circlePoint,
        this.center,
        largeWidth,
        largeHeight,
      );
    }
    this.comparisonGroup.userData.function = this.comparisonFunction;
    this.comparisonGroup.userData.smallTriangle = "OHP";
    this.comparisonGroup.userData.largeTriangle = isSec ? "OQP" : "OSP";
    this.comparisonGroup.userData.vertexPairs = vertexPairs;
    this.comparisonGroup.userData.sidePairs = sidePairs;
    this.comparisonGroup.userData.anglePairs = anglePairs;
    this.comparisonGroup.userData.proofChain = proofChain;
    this.comparisonGroup.userData.caption = this.comparisonTitle.userData.label;
    this.applyComparisonAnimation();
  }

  private setComparisonSourceTransform(
    group: THREE.Group,
    origin: THREE.Vector3,
    right: THREE.Vector3,
    top: THREE.Vector3,
    width: number,
    height: number,
  ): void {
    const base = right.clone().sub(origin);
    const rise = top.clone().sub(right);
    const orientation = Math.sign(base.x * rise.y - base.y * rise.x) || 1;
    group.userData.sourcePosition = origin.clone().sub(this.comparisonGroup.position);
    group.userData.sourceRotation = Math.atan2(base.y, base.x);
    group.userData.sourceScale = new THREE.Vector3(
      base.length() / width,
      orientation * rise.length() / height,
      1,
    );
  }

  private updateComparisonTriangle(
    group: THREE.Group,
    triangle: THREE.Mesh,
    sides: THREE.Line[],
    rightAngle: THREE.Line,
    title: THREE.Sprite,
    vertexLabels: THREE.Sprite[],
    sideLabels: THREE.Sprite[],
    width: number,
    height: number,
    name: string,
    vertices: string[],
    sideNames: string[],
  ): void {
    const origin = new THREE.Vector3(0, 0, 0);
    const right = new THREE.Vector3(width, 0, 0);
    const top = new THREE.Vector3(width, height, 0);
    this.updateTriangle(triangle, origin, right, top);
    this.setLine(sides[0], origin, right);
    this.setLine(sides[1], right, top);
    this.setLine(sides[2], origin, top);
    this.setRightAngle(
      rightAngle,
      right,
      origin.clone().sub(right),
      top.clone().sub(right),
      Math.min(0.34, width * 0.16, height * 0.16),
    );

    this.setComparisonLabel(title, `comparison-title-${name}`, name, name.startsWith("SMALL") ? 0xf0f6fc : 0xffa657);
    title.position.set(width / 2, Math.max(height + 1.05, 2.5), 0.2);

    const vertexColors = [0xffa657, 0x7ee787, 0xd2a8ff];
    const vertexPositions = [
      new THREE.Vector3(0.25, -0.48, 0.22),
      new THREE.Vector3(width + 0.28, -0.48, 0.22),
      new THREE.Vector3(width + 0.42, height + 0.22, 0.22),
    ];
    vertexLabels.forEach((label, index) => {
      this.setComparisonLabel(label, `comparison-vertex-${name}-${index}`, vertices[index], vertexColors[index]);
      label.position.copy(vertexPositions[index]);
    });

    const hypotenuseOffset = new THREE.Vector3(-height, width, 0).normalize().multiplyScalar(0.42);
    const sidePositions = [
      new THREE.Vector3(width / 2, -0.82, 0.2),
      new THREE.Vector3(width + 0.72, height / 2, 0.2),
      new THREE.Vector3(width / 2, height / 2, 0.2).add(hypotenuseOffset),
    ];
    const sideColors = [0x5db4ff, 0x7ee787, 0xd2a8ff];
    sideLabels.forEach((label, index) => {
      this.setComparisonLabel(label, `comparison-side-${name}-${index}`, sideNames[index], sideColors[index]);
      label.position.copy(sidePositions[index]);
    });
    group.userData.triangle = name.replace(/^(SMALL|LARGE) · /, "");
    group.userData.vertexLabels = vertices;
    group.userData.sideLabels = sideNames;
  }

  private applyComparisonAnimation(): void {
    if (!this.comparisonGroup?.visible) return;
    const eased = THREE.MathUtils.smoothstep(this.comparisonProgress, 0, 1);
    const smallEnd = this.comparisonSmallGroup.userData.endPosition as THREE.Vector3 | undefined;
    const largeEnd = this.comparisonLargeGroup.userData.endPosition as THREE.Vector3 | undefined;
    this.applyComparisonGroupTransform(this.comparisonSmallGroup, smallEnd, eased);
    this.applyComparisonGroupTransform(this.comparisonLargeGroup, largeEnd, eased);
    this.setComparisonOpacity(THREE.MathUtils.lerp(0.78, 1, eased));
    this.comparisonGroup.userData.animationProgress = this.comparisonProgress;
    this.comparisonGroup.userData.animating = this.comparisonAnimating;
  }

  private applyComparisonGroupTransform(
    group: THREE.Group,
    endPosition: THREE.Vector3 | undefined,
    progress: number,
  ): void {
    const sourcePosition = group.userData.sourcePosition as THREE.Vector3 | undefined;
    const sourceScale = group.userData.sourceScale as THREE.Vector3 | undefined;
    const sourceRotation = group.userData.sourceRotation as number | undefined;
    if (!endPosition || !sourcePosition || !sourceScale || sourceRotation === undefined) return;

    group.position.lerpVectors(sourcePosition, endPosition, progress);
    group.scale.lerpVectors(sourceScale, new THREE.Vector3(1, 1, 1), progress);
    group.rotation.z = sourceRotation + Math.atan2(Math.sin(-sourceRotation), Math.cos(-sourceRotation)) * progress;
  }

  private setComparisonOpacity(opacity: number): void {
    this.comparisonGroup.traverse((object) => {
      const renderable = object as THREE.Mesh;
      const material = renderable.material as THREE.Material | THREE.Material[] | undefined;
      const materials = Array.isArray(material) ? material : material ? [material] : [];
      for (const item of materials) {
        if (item.userData.comparisonBaseOpacity === undefined) {
          item.userData.comparisonBaseOpacity = item.opacity;
        }
        item.transparent = true;
        item.opacity = (item.userData.comparisonBaseOpacity as number) * opacity;
      }
    });
  }

  private setComparisonLabel(sprite: THREE.Sprite, key: string, text: string, color: number): void {
    this.setLabel(sprite, key, text, color);
    sprite.userData.label = text;
  }

  private restoreMainSceneVisibility(): void {
    for (const object of [
      this.circleLine,
      this.radiusLine,
      this.originalBase,
      this.originalRise,
      this.originalTriangle,
      this.originalRightAngle,
      this.thetaArc,
      this.point,
      this.radiusLabel,
      this.thetaLabel,
      this.originalRightAngleLabel,
    ]) {
      if (object) object.visible = true;
    }
  }

  private tick(dt: number): void {
    if (this.params.animate) {
      this.params.angleDeg = (this.params.angleDeg + dt * this.params.speed + 360 * 100) % 360;
      this.angleCtl?.updateDisplay();
      this.redraw();
    }
    if (this.comparisonAnimating) this.tickComparison(dt);
  }

  private rebuildScene(): void {
    this.redraw();
  }

  private redraw(): void {
    if (this.comparisonFunction && this.comparisonSourceSignature !== this.currentComparisonSignature()) {
      this.comparisonSourceSignature = this.currentComparisonSignature();
      this.comparisonAnimating = false;
      this.comparisonProgress = 1;
    }
    this.restoreMainSceneVisibility();
    const c = this.center;
    const R = this.R;
    const theta = this.params.angleDeg * DEG;
    const standardAngle = (this.params.startAngleDeg + this.params.angleDeg) * DEG;
    const cosT = Math.cos(standardAngle);
    const sinT = Math.sin(standardAngle);
    const tanT = Math.abs(cosT) > 1e-9 ? sinT / cosT : NaN;
    const x = R * cosT;
    const y = R * sinT;
    const point = new THREE.Vector3(x, y, 0);
    const foot = new THREE.Vector3(x, 0, 0);

    const circlePoints = this.circlePoints(c, R);
    this.circleLine.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(circlePoints.flatMap((point) => [point.x, point.y, point.z]), 3),
    );
    this.circleLine.geometry.computeBoundingSphere();
    this.setLine(this.radiusLine, c, point);
    this.setLine(this.originalBase, c, foot);
    this.setLine(this.originalRise, foot, point);
    this.updateTriangle(this.originalTriangle, c, foot, point);
    this.point.position.copy(point).setZ(0.08);

    const markerSize = THREE.MathUtils.clamp(R * 0.08, 0.24, 0.42);
    this.setRightAngle(this.originalRightAngle, foot, c.clone().sub(foot), point.clone().sub(foot), markerSize);
    this.originalRightAngleLabel.position.copy(
      foot.clone().add(new THREE.Vector3(-Math.sign(x || 1) * 0.42, Math.sign(y || 1) * 0.42, 0)),
    );

    this.updateAngleArc(standardAngle);
    this.positionOriginalLabels(point, foot, cosT, sinT, x, y);
    this.updateIdentityAreaScene(x, y);
    this.applyOriginalTriangleFocus();
    this.updateExternalConstructions(point, foot, cosT, sinT, tanT);
    this.updateReadout(theta, standardAngle, cosT, sinT, tanT);
    const showComparison = this.comparisonFunction !== null;
    this.updateCameraFrame(showComparison);
    if (showComparison) {
      this.updateComparisonScene(standardAngle, cosT, sinT);
    } else if (this.comparisonFunction) {
      this.comparisonGroup.visible = false;
    }
  }

  private updateCameraFrame(showComparison: boolean): void {
    if (this.comparisonFrameActive === showComparison) return;
    this.comparisonFrameActive = showComparison;
    if (showComparison) {
      this.viewport?.frameCamera(new THREE.Vector3(5.5, 0, 40), new THREE.Vector3(5.5, 0, 0));
    } else {
      this.viewport?.frameCamera(new THREE.Vector3(0, 0, 20), this.center);
    }
  }

  private applyOriginalTriangleFocus(): void {
    const focus = this.selectedFunction;
    const showSin = this.identityProofShown
      || focus === "sin" || focus === "cos" || focus === "tan" || focus === "cosec" || focus === "cot";
    const showCos = this.identityProofShown
      || focus === "cos" || focus === "tan" || focus === "sec" || focus === "cot";

    this.sinSeg.visible = showSin;
    this.cosSeg.visible = showCos;
    this.sinLabel.visible = showSin;
    this.cosLabel.visible = showCos;
    this.identityAreaGroup.visible = this.identityProofShown;

    this.setLineStyle(this.sinSeg, 0xff5d5d, this.identityProofShown || focus === "sin" || focus === "tan" ? 1 : 0.48);
    this.setLineStyle(this.cosSeg, 0x5db4ff, this.identityProofShown || focus === "cos" || focus === "tan" ? 1 : 0.48);
  }

  private updateIdentityAreaScene(x: number, y: number): void {
    const values = [x, y, this.R];
    const colors = [0x5db4ff, 0xff5d5d, 0xf0f6fc];
    const centers = [-3, 0, 3];
    const labels = ["x²", "y²", "R²"];

    values.forEach((side, index) => {
      const visualSide = Math.max(0.06, 2 * Math.abs(side) / this.R);
      const left = centers[index] - visualSide / 2;
      const right = centers[index] + visualSide / 2;
      const bottom = 0;
      const top = visualSide;
      const square = this.identityAreaSquares[index];
      square.geometry.setAttribute("position", new THREE.Float32BufferAttribute([
        left, bottom, 0,
        right, bottom, 0,
        right, top, 0,
        left, top, 0,
      ], 3));
      square.geometry.setIndex([0, 1, 2, 0, 2, 3]);
      square.geometry.computeBoundingSphere();
      this.identityAreaOutlines[index].geometry.setFromPoints([
        new THREE.Vector3(left, bottom, 0.02),
        new THREE.Vector3(right, bottom, 0.02),
        new THREE.Vector3(right, top, 0.02),
        new THREE.Vector3(left, top, 0.02),
        new THREE.Vector3(left, bottom, 0.02),
      ]);
      this.identityAreaLabels[index].position.set(centers[index], -0.42, 0.04);
      const area = side * side;
      this.setLabel(
        this.identityAreaLabels[index],
        `identity-area-${index}`,
        `${labels[index]} = ${this.value(area)}`,
        colors[index],
      );
      square.userData.area = area;
      square.userData.side = side;
    });

    this.identityAreaSymbols[0].position.set(-1.5, 0.95, 0.04);
    this.identityAreaSymbols[1].position.set(1.5, 0.95, 0.04);
    this.identityAreaTitle.position.set(0, 2.5, 0.04);
    this.identityAreaGroup.position.set(0, y >= 0 ? -4.55 : 2.05, 0.12);
    this.identityAreaGroup.userData.areas = {
      xSquared: x * x,
      ySquared: y * y,
      radiusSquared: this.R * this.R,
    };
  }

  private updateExternalConstructions(
    point: THREE.Vector3,
    foot: THREE.Vector3,
    cosT: number,
    sinT: number,
    tanT: number,
  ): void {
    const c = this.center;
    const R = this.R;
    const xFocus = (this.selectedFunction === "tan" && this.tanConstructionShown)
      || (this.selectedFunction === "sec" && this.secConstructionShown);
    const yFocus = (this.selectedFunction === "cosec" && this.cosecConstructionShown)
      || this.selectedFunction === "cot";
    const xDefined = Math.abs(cosT) > 0.12;
    const yDefined = Math.abs(sinT) > 0.12;

    this.hideExternalConstruction();

    if (xFocus && xDefined) {
      const intercept = new THREE.Vector3(R / cosT, 0, 0);
      this.setLine(this.tanSeg, point, intercept);
      this.setLine(this.secSeg, c, intercept);
      this.updateTriangle(this.secTriangle, c, point, intercept);
      this.tanSeg.visible = true;
      this.secSeg.visible = true;
      this.secTriangle.visible = true;
      this.pointRightAngle.visible = true;
      this.pointRightAngleLabel.visible = true;
      this.pointTangentLabel.visible = true;

      const isTan = this.selectedFunction === "tan";
      this.setLineStyle(this.tanSeg, 0x5dff8f, isTan ? 1 : 0.32);
      this.setLineStyle(this.secSeg, isTan ? 0x8b949e : 0xffa657, isTan ? 0.48 : 1);
      this.setTriangleStyle(this.secTriangle, isTan ? 0x5dff8f : 0xffa657, 0.1);
      this.tanLabel.visible = isTan;
      this.secLabel.visible = !isTan;
      this.similarityLabel.visible = true;
      this.originVertexLabel.visible = true;
      this.footVertexLabel.visible = true;
      this.pointVertexLabel.visible = true;
      this.interceptVertexLabel.visible = true;
      this.setInterceptVertexLabel("Q", 0x5dff8f);

      const radialIn = c.clone().sub(point);
      const tangentToIntercept = intercept.clone().sub(point);
      this.setRightAngle(this.pointRightAngle, point, radialIn, tangentToIntercept, THREE.MathUtils.clamp(R * 0.09, 0.28, 0.46));
      this.positionXConstructionLabels(point, foot, intercept, cosT, sinT, tanT);
    }

    if (yFocus && yDefined) {
      const intercept = new THREE.Vector3(0, R / sinT, 0);
      this.setLine(this.cosecSeg, c, intercept);
      this.setLine(this.cotSeg, intercept, point);
      this.updateTriangle(this.cosecTriangle, c, intercept, point);
      this.cosecSeg.visible = true;
      this.cotSeg.visible = true;
      this.cosecTriangle.visible = true;
      this.pointRightAngle.visible = true;
      this.pointRightAngleLabel.visible = true;
      this.pointTangentLabel.visible = true;

      const isCosec = this.selectedFunction === "cosec";
      this.setLineStyle(this.cosecSeg, 0x39c5cf, isCosec ? 1 : 0.32);
      this.setLineStyle(this.cotSeg, 0xffd166, isCosec ? 0.32 : 1);
      this.setTriangleStyle(this.cosecTriangle, isCosec ? 0x39c5cf : 0xffd166, 0.1);
      this.cosecLabel.visible = isCosec;
      this.cotLabel.visible = !isCosec;
      this.setInterceptVertexLabel("S", 0x39c5cf);

      if (isCosec) {
        this.originVertexLabel.visible = true;
        this.footVertexLabel.visible = true;
        this.pointVertexLabel.visible = true;
        this.interceptVertexLabel.visible = true;
      }

      const radialIn = c.clone().sub(point);
      const tangentToIntercept = intercept.clone().sub(point);
      this.setRightAngle(this.pointRightAngle, point, radialIn, tangentToIntercept, THREE.MathUtils.clamp(R * 0.09, 0.28, 0.46));
      this.positionYConstructionLabels(point, intercept, cosT, sinT);
    }
  }

  private hideExternalConstruction(): void {
    for (const object of [
      this.tanSeg,
      this.secSeg,
      this.cosecSeg,
      this.cotSeg,
      this.secTriangle,
      this.cosecTriangle,
      this.pointRightAngle,
      this.tanLabel,
      this.secLabel,
      this.cosecLabel,
      this.cotLabel,
      this.pointTangentLabel,
      this.similarityLabel,
      this.pointRightAngleLabel,
      this.originVertexLabel,
      this.footVertexLabel,
      this.pointVertexLabel,
      this.interceptVertexLabel,
    ]) {
      object.visible = false;
    }
  }

  private positionOriginalLabels(
    point: THREE.Vector3,
    foot: THREE.Vector3,
    cosT: number,
    sinT: number,
    x: number,
    y: number,
  ): void {
    const radiusMid = this.center.clone().lerp(point, 0.5);
    const radiusOffset = new THREE.Vector3(-sinT, cosT, 0).multiplyScalar(0.48);
    this.radiusLabel.position.copy(radiusMid.add(radiusOffset));
    this.sinLabel.position.copy(foot.clone().lerp(point, 0.5).add(new THREE.Vector3(Math.sign(cosT || 1) * 0.68, 0, 0)));
    this.cosLabel.position.copy(this.center.clone().lerp(foot, 0.5).add(new THREE.Vector3(0, -Math.sign(sinT || 1) * 0.46, 0)));

    this.setLabel(this.radiusLabel, "radius", `R = ${this.value(this.R)}`, 0xf0f6fc);
    this.setLabel(this.sinLabel, "y", `y = ${this.value(y)}`, 0xff5d5d);
    this.setLabel(this.cosLabel, "x", `x = ${this.value(x)}`, 0x5db4ff);
    this.radiusLabel.userData.label = "R";
    this.sinLabel.userData.label = "y";
    this.cosLabel.userData.label = "x";
  }

  private positionXConstructionLabels(
    point: THREE.Vector3,
    foot: THREE.Vector3,
    intercept: THREE.Vector3,
    cosT: number,
    sinT: number,
    tanT: number,
  ): void {
    const sideMid = point.clone().lerp(intercept, 0.5);
    const baseMid = this.center.clone().lerp(intercept, 0.5);
    this.tanLabel.position.copy(sideMid.add(new THREE.Vector3(cosT, sinT, 0).multiplyScalar(0.55)));
    this.secLabel.position.copy(baseMid.add(new THREE.Vector3(0, -Math.sign(sinT || 1) * 0.95, 0)));
    this.pointTangentLabel.position.copy(point.clone().lerp(intercept, 0.72).add(new THREE.Vector3(cosT, sinT, 0).multiplyScalar(0.42)));
    this.pointRightAngleLabel.position.copy(point.clone().add(new THREE.Vector3(-cosT, -sinT, 0).multiplyScalar(0.55)));
    this.originVertexLabel.position.copy(this.center).add(new THREE.Vector3(-0.35, -0.34, 0));
    this.footVertexLabel.position.copy(foot).add(new THREE.Vector3(Math.sign(cosT || 1) * 0.25, -Math.sign(sinT || 1) * 0.36, 0));
    this.pointVertexLabel.position.copy(point).add(new THREE.Vector3(Math.sign(cosT || 1) * 0.32, Math.sign(sinT || 1) * 0.28, 0));
    this.interceptVertexLabel.position.copy(intercept).add(new THREE.Vector3(Math.sign(cosT || 1) * 0.18, -Math.sign(sinT || 1) * 0.36, 0));

    const toFoot = foot.clone().normalize();
    const toPoint = point.clone().normalize();
    const bisector = toFoot.add(toPoint).normalize();
    this.similarityLabel.position.copy(bisector.multiplyScalar(Math.min(2.8, this.R * 0.65)));

    this.setLabel(this.tanLabel, "tan", `R tan φ = ${this.value(this.R * tanT)}`, 0x5dff8f);
    this.setLabel(this.secLabel, "sec", `R sec φ = ${this.value(this.R / cosT)}`, 0xffa657);
  }

  private positionYConstructionLabels(
    point: THREE.Vector3,
    intercept: THREE.Vector3,
    cosT: number,
    sinT: number,
  ): void {
    const axisMid = this.center.clone().lerp(intercept, 0.5);
    const sideMid = intercept.clone().lerp(point, 0.5);
    this.cosecLabel.position.copy(axisMid.add(new THREE.Vector3(-Math.sign(cosT || 1) * 2.2, 0, 0)));
    this.cotLabel.position.copy(sideMid.add(new THREE.Vector3(cosT, sinT, 0).multiplyScalar(0.55)));
    this.pointTangentLabel.position.copy(point.clone().lerp(intercept, 0.72).add(new THREE.Vector3(cosT, sinT, 0).multiplyScalar(0.42)));
    this.pointRightAngleLabel.position.copy(point.clone().add(new THREE.Vector3(-cosT, -sinT, 0).multiplyScalar(0.55)));
    this.originVertexLabel.position.copy(this.center).add(new THREE.Vector3(-0.35, -0.34, 0));
    this.footVertexLabel.position.copy(new THREE.Vector3(point.x, 0, 0))
      .add(new THREE.Vector3(Math.sign(cosT || 1) * 0.25, -Math.sign(sinT || 1) * 0.36, 0));
    this.pointVertexLabel.position.copy(point)
      .add(new THREE.Vector3(Math.sign(cosT || 1) * 0.34, -Math.sign(sinT || 1) * 0.3, 0));
    this.interceptVertexLabel.position.copy(intercept)
      .add(new THREE.Vector3(Math.sign(cosT || 1) * 0.34, Math.sign(sinT || 1) * 0.28, 0));

    this.setLabel(this.cosecLabel, "cosec", `R cosec φ = ${this.value(this.R / sinT)}`, 0x39c5cf);
    this.setLabel(this.cotLabel, "cot", `R cot φ = ${this.value(this.R * cosT / sinT)}`, 0xffd166);
  }

  private updateAngleArc(standardAngle: number): void {
    const normalized = ((standardAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const arcR = this.R * 0.25;
    const steps = Math.max(8, Math.ceil(normalized / (Math.PI / 24)));
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = normalized * i / steps;
      points.push(new THREE.Vector3(arcR * Math.cos(angle), arcR * Math.sin(angle), 0.04));
    }
    this.thetaArc.geometry.setFromPoints(points);
    const labelAngle = normalized / 2;
    this.thetaLabel.position.set(
      (arcR + 0.38) * Math.cos(labelAngle),
      (arcR + 0.38) * Math.sin(labelAngle),
      0.04,
    );
    this.setLabel(this.thetaLabel, "phi", `φ = ${this.angleValue(standardAngle)}`, 0xffd166);
  }

  private updateReadout(theta: number, standardAngle: number, cosT: number, sinT: number, tanT: number): void {
    const readout = document.getElementById("trig-readout");
    if (!readout) return;

    const x = this.R * cosT;
    const y = this.R * sinT;
    const sec = Math.abs(cosT) > 1e-9 ? 1 / cosT : NaN;
    const cosec = Math.abs(sinT) > 1e-9 ? 1 / sinT : NaN;
    const cot = Math.abs(sinT) > 1e-9 ? cosT / sinT : NaN;
    const thetaText = this.params.unit === "deg"
      ? `${this.params.angleDeg.toFixed(1)}°`
      : `${theta.toFixed(3)} rad`;

    readout.innerHTML = `
      <div><span>θ swept / final φ</span><b>${thetaText} / ${this.angleValue(standardAngle)}</b></div>
      <div><span>Triangle (x, y, R)</span><b>(${this.value(x)}, ${this.value(y)}, ${this.value(this.R)})</b></div>
      <div><span>sin φ = y/R</span><b>${this.value(sinT)}</b>${derivationButton("sine")}</div>
      <div><span>cos φ = x/R</span><b>${this.value(cosT)}</b>${derivationButton("cosine")}</div>
      <div><span>tan φ = y/x</span><b>${this.value(tanT)}</b>${derivationButton("tangent")}</div>
      <div><span>sec φ = R/x</span><b>${this.value(sec)}</b>${derivationButton("secant")}</div>
      <div><span>cosec φ = R/y</span><b>${this.value(cosec)}</b>${derivationButton("cosecant")}</div>
      <div><span>cot φ = x/y</span><b>${this.value(cot)}</b>${derivationButton("cotangent")}</div>`;

    const derivation = document.getElementById("trig-derivation");
    if (derivation) {
      derivation.innerHTML = `
        <ul>
          <li><code>sin φ = y/R = ${this.value(y)} ÷ ${this.value(this.R)} = ${this.value(sinT)}</code>${derivationButton("sine")}</li>
          <li><code>cos φ = x/R = ${this.value(x)} ÷ ${this.value(this.R)} = ${this.value(cosT)}</code>${derivationButton("cosine")}</li>
          <li><code>tan φ = y/x = ${this.value(y)} ÷ ${this.value(x)} = ${this.value(tanT)}</code>${derivationButton("tangent")}</li>
          <li><code>sec φ = R/x = ${this.value(this.R)} ÷ ${this.value(x)} = ${this.value(sec)}</code>${derivationButton("secant")}</li>
          <li><code>cosec φ = R/y = ${this.value(this.R)} ÷ ${this.value(y)} = ${this.value(cosec)}</code>${derivationButton("cosecant")}</li>
          <li><code>cot φ = x/y = ${this.value(x)} ÷ ${this.value(y)} = ${this.value(cot)}</code>${derivationButton("cotangent")}</li>
        </ul>`;
    }

    this.updateFunctionBreakdown(x, y, cosT, sinT, tanT, sec, cosec, cot, standardAngle);
  }

  private updateFunctionBreakdown(
    x: number,
    y: number,
    cosT: number,
    sinT: number,
    tanT: number,
    sec: number,
    cosec: number,
    cot: number,
    standardAngle: number,
  ): void {
    const panel = document.getElementById("trig-function-breakdown");
    if (!panel) return;

    const xConstructionAvailable = Math.abs(cosT) > 0.12;
    const yConstructionAvailable = Math.abs(sinT) > 0.12;
    const comparisonAvailable = true;
    const referenceAngle = this.referenceAngle(standardAngle / DEG);
    const complementaryAngle = 90 - referenceAngle;
    const referenceAngleText = `${Number(referenceAngle.toFixed(1))}°`;
    const complementaryAngleText = `${Number(complementaryAngle.toFixed(1))}°`;
    const xUnavailable = `<p class="course-hint">At this angle the x-axis intercept is at infinity, so the external construction is hidden.</p>${
      this.selectedFunction === "sec" && this.secConstructionShown
        ? `<div class="trig-proof-actions">
            <button type="button" class="course-btn" data-trig-comparison="sec">Show the limiting triangle comparison</button>
          </div>
          <p class="course-hint">The side-by-side view keeps a labelled thin limiting diagram instead of disappearing.</p>`
        : ""
    }`;
    const yAxisComparison = this.selectedFunction === "cosec" && this.cosecConstructionShown
      ? "cosec"
      : this.selectedFunction === "cot"
      ? "cot"
      : null;
    const yUnavailable = `<p class="course-hint">At this angle the y-axis intercept is at infinity, so the external construction is hidden.</p>${
      yAxisComparison
        ? `<div class="trig-proof-actions">
            <button type="button" class="course-btn" data-trig-comparison="${yAxisComparison}">Show the limiting triangle comparison</button>
          </div>
          <p class="course-hint">The side-by-side view keeps a labelled thin limiting diagram instead of disappearing.</p>`
        : ""
    }`;
    const displayedX = Number(x.toFixed(3));
    const displayedY = Number(y.toFixed(3));
    const displayedPythagoreanSum = displayedX ** 2 + displayedY ** 2;
    const sinSquared = sinT ** 2;
    const cosSquared = cosT ** 2;
    const displayedSinSquared = Number(sinSquared.toFixed(4));
    const displayedCosSquared = Number(cosSquared.toFixed(4));
    const displayedIdentitySum = displayedSinSquared + displayedCosSquared;

    const history: Record<TrigFunction, string> = {
      sin: "Sine began as a half-chord: Aryabhata's c. 500 sine table replaced the older Greek chord-table approach.",
      cos: "Cosine developed as the sine of the complementary angle; Gunter proposed the name co-sinus in 1620.",
      tan: "Tangent began with shadow lengths for measuring heights and sundials; Fincke first used the name tangent in 1583.",
      sec: "Secant was a later navigation-table function, rather than a starting point for early astronomical trigonometry.",
      cosec: "Cosecant belongs to the later secant family: Viète knew its reciprocal relations in the late 1500s.",
      cot: "Cotangent developed beside tangent from the two shadow measures; Gunter first used cotangens in 1620.",
    };

    let body: string;
    if (this.identityProofShown) {
      body = `
        <section class="trig-identity-proof" data-trig-identity-proof>
          <h3>Why sin²φ + cos²φ = 1 ${derivationButton("pythagorean-identity")}</h3>
          <p>The viewport now uses only the original right triangle. Its <b class="trig-identity-x">blue base is x</b>, its <b class="trig-identity-y">red height is y</b>, and its white hypotenuse is the circle radius <code>R</code>. The three area squares show the Pythagorean statement <code>x² + y² = R²</code>.</p>

          <div class="trig-identity-readout" data-trig-identity-readout aria-label="Live sine squared plus cosine squared check">
            <span><b>sin²φ</b><strong>${sinSquared.toFixed(4)}</strong></span>
            <i>+</i>
            <span><b>cos²φ</b><strong>${cosSquared.toFixed(4)}</strong></span>
            <i>=</i>
            <span><b>sum</b><strong>${displayedIdentitySum.toFixed(4)}</strong></span>
          </div>
          <p class="trig-identity-rounding">The two terms are shown to four decimal places. Their displayed sum is added from those displayed terms; with the unrounded sine and cosine values, the sum is exactly 1.</p>

          <ol class="trig-identity-steps">
            <li data-trig-identity-step="definitions">
              <h4>1 · Derive the side formulas from the definitions</h4>
              <p>Cosine is defined as adjacent divided by hypotenuse, so for this triangle:</p>
              <div class="trig-identity-equation"><code>cos φ = x/R</code></div>
              <p>Multiply both sides by the same positive radius <code>R</code>. On the right, <code>R × (x/R) = x</code> because <code>R/R = 1</code>. Therefore:</p>
              <div class="trig-identity-equation"><code>R cos φ = x</code>, so <code>x = R cos φ = ${this.value(this.R)} × ${this.value(cosT)} = ${this.value(x)}</code></div>
              <p>Sine is defined as opposite divided by hypotenuse:</p>
              <div class="trig-identity-equation"><code>sin φ = y/R</code></div>
              <p>Again multiply both sides by <code>R</code>. Since <code>R × (y/R) = y</code>, this gives:</p>
              <div class="trig-identity-equation"><code>R sin φ = y</code>, so <code>y = R sin φ = ${this.value(this.R)} × ${this.value(sinT)} = ${this.value(y)}</code></div>
            </li>

            <li data-trig-identity-step="pythagoras">
              <h4>2 · Apply Pythagoras to those three sides</h4>
              <p>The base and height meet at the marked <code>90°</code> corner, so Pythagoras says that the two leg-square areas add to the hypotenuse-square area:</p>
              <div class="trig-identity-equation"><code>x² + y² = R²</code></div>
              <p>With the live unrounded coordinates, the square terms are:</p>
              <div class="trig-identity-equation"><code>${this.value(x * x)} + ${this.value(y * y)} = ${this.value(x * x + y * y)} = ${this.value(this.R * this.R)}</code></div>
              <p>The labels round <code>x</code> and <code>y</code> to three decimals, so checking those displayed labels honestly uses an approximation:</p>
              <div class="trig-identity-equation" data-trig-identity-numeric-check><code>${displayedX.toFixed(3)}² + ${displayedY.toFixed(3)}² = ${displayedPythagoreanSum.toFixed(3)} ≈ ${this.value(this.R * this.R)} = ${this.value(this.R)}²</code></div>
              <p class="trig-identity-rounding">The small difference, if one appears, is caused only by squaring rounded display values. Pythagoras uses the unrounded side values above.</p>
            </li>

            <li data-trig-identity-step="divide">
              <h4>3 · Divide every term by R²</h4>
              <p>A radius satisfies <code>R &gt; 0</code>, so <code>R² &gt; 0</code> and division by <code>R²</code> is allowed. Dividing the left and right sides of the same equation by the same non-zero number preserves equality:</p>
              <div class="trig-identity-equation"><code>x²/R² + y²/R² = R²/R²</code></div>
              <p>Because <code>x²/R² = (x/R)²</code>, <code>y²/R² = (y/R)²</code>, and <code>R²/R² = 1</code>, the equation becomes:</p>
              <div class="trig-identity-equation"><code>(x/R)² + (y/R)² = 1</code></div>
            </li>

            <li data-trig-identity-step="replace">
              <h4>4 · Replace the ratios with their definitions</h4>
              <p>From step 1, <code>x/R = cos φ</code> and <code>y/R = sin φ</code>. Replacing equal quantities with equal quantities gives:</p>
              <div class="trig-identity-equation"><code>cos²φ + sin²φ = 1</code></div>
              <p>Addition is commutative: changing the order of the two addends does not change their sum. Therefore the conventional order is:</p>
              <div class="trig-identity-conclusion"><code>sin²φ + cos²φ = 1</code></div>
            </li>

            <li data-trig-identity-step="general">
              <h4>5 · Why it holds for every angle and radius</h4>
              <p>The proof used only a positive radius, the horizontal and vertical projections of its endpoint, and Pythagoras. Those facts apply at every point on the circle. Outside the first quadrant, <code>x</code> or <code>y</code> can be negative directed lengths, but squaring removes the sign: <code>(−x)² = x²</code> and <code>(−y)² = y²</code>. Axis angles also work: one leg is zero and the other has length <code>R</code>, so <code>0² + R² = R²</code>.</p>
            </li>
            <li data-trig-identity-step="applications">
              <h4>6 · What this lets you do</h4>
              <ul>
                <li><b>Recover a missing component:</b> if <code>sin φ = 0.6</code>, then <code>cos²φ = 1 − 0.6² = 0.64</code>, so <code>cos φ = ±0.8</code>. The quadrant determines whether the component is positive or negative.</li>
                <li><b>Check a resolved force or velocity:</b> a 10 m/s velocity with horizontal component 6 m/s and vertical component 8 m/s has <code>cos φ = 6/10</code> and <code>sin φ = 8/10</code>. The identity checks that <code>0.6² + 0.8² = 1</code>, so those components really recombine to the original 10 m/s magnitude.</li>
                <li><b>Simplify equations:</b> replace <code>1 − sin²φ</code> with <code>cos²φ</code> (or <code>1 − cos²φ</code> with <code>sin²φ</code>) instead of carrying both functions through the calculation.</li>
              </ul>
            </li>
          </ol>
        </section>`;
    } else {
      switch (this.selectedFunction) {
      case "sin":
        body = `
          <h3 style="color:#ff5d5d">1 · Sine: reveal the height</h3>
          <p>The red side is the <b>opposite</b> side. One fact:</p>
          <div class="formula" data-derivation="sine"><div class="formula-body">sin φ = y/R = ${this.value(y)} ÷ ${this.value(this.R)} = ${this.value(sinT)}</div></div>`;
        break;
      case "cos":
        body = `
          <h3 style="color:#5db4ff">2 · Cosine: add the base</h3>
          <p>The blue side is the <b>adjacent</b> side. The red height stays for context.</p>
          <div class="formula" data-derivation="cosine"><div class="formula-body">cos φ = x/R = ${this.value(x)} ÷ ${this.value(this.R)} = ${this.value(cosT)}</div></div>`;
        break;
      case "tan":
        body = this.tanConstructionShown
          ? `
            <h3 style="color:#5dff8f">3 · Tangent: the similar triangle</h3>
            ${xConstructionAvailable ? `
              <p>The new green side lies on the <b>tangent at P</b>. Compare the two triangles:</p>
              <ul>
                <li>Small <code>OHP</code> and large <code>OQP</code> share the acute angle <code>α = ${referenceAngle.toFixed(1)}°</code> at O.</li>
                <li><code>∠H = 90°</code> corresponds to <code>∠P = 90°</code>.</li>
                <li>So the triangles are similar, and <code>PQ = R·tan φ = ${this.value(this.R * tanT)}</code> ${derivationButton("tangent-length")}.</li>
              </ul>` : xUnavailable}
            <button type="button" class="course-btn ghost" data-trig-function="tan">Back to tan = y/x</button>`
          : `
            <h3 style="color:#5dff8f">3 · Tangent starts in the same triangle</h3>
            <p>Before adding any new line, use the original red-and-blue triangle:</p>
            <div class="formula" data-derivation="tangent"><div class="formula-body">tan φ = y/x = ${this.value(y)} ÷ ${this.value(x)} = ${this.value(tanT)}</div></div>
            <p class="course-hint">It is also sin φ ÷ cos φ because the same R cancels.</p>
            <button type="button" class="course-btn" data-trig-tangent-proof>Next: show why it is called tangent →</button>`;
        break;
      case "sec":
        body = this.secConstructionShown
          ? `
            <h3 style="color:#ffa657">4 · Secant: the similar triangle</h3>
            ${xConstructionAvailable ? `
              <p>First derive the matching angles; the live values then confirm the geometry.</p>
              <div class="trig-aa-proof">
                <strong>Geometric AA proof</strong>
                <ul>
                  <li><b>Angle at O:</b> rays <code>OH</code> and <code>OQ</code> are the same ray from O along the x-axis—<code>OQ</code> simply extends <code>OH</code>. Both angles use the same radius ray <code>OP</code> as their other side. Therefore <code>∠HOP = ∠QOP = φ</code>. Live check: <code>${referenceAngle.toFixed(1)}° = ${referenceAngle.toFixed(1)}°</code>.</li>
                  <li><b>Right angles:</b> <code>OH</code> is horizontal and <code>HP</code> is the original vertical projection, so <code>OH ⟂ HP</code> and <code>∠OHP = 90°</code>. The radius <code>OP</code> is perpendicular to the tangent <code>PQ</code> at P, so <code>∠OPQ = 90°</code>. Live check: <code>90° = 90°</code>.</li>
                  <li>Two corresponding angles have now been proved equal, so <code>△OHP ∼ △OPQ</code> by AA. The large triangle is also named <code>OQP</code>; <code>OPQ</code> is the order that shows the correspondence <code>O→O, H→P, P→Q</code>. The remaining angles then agree automatically: <code>∠HPO = ∠OQP = 90° − φ = ${complementaryAngle.toFixed(1)}°</code>.</li>
                </ul>
              </div>
              <div class="trig-correspondence" aria-label="Secant triangle correspondences">
                <span><b>Vertices</b> O ↔ O · H ↔ P · P ↔ Q</span>
                <span><b>Sides</b> OH ↔ OP · HP ↔ PQ · OP ↔ OQ</span>
              </div>
              <ul>
                <li>Large <code>OP</code> is the same radius <code>R</code> and corresponds to small <code>OH = x</code>, so the scale factor from small to large is <code>R/x = ${this.value(this.R)} ÷ ${this.value(x)} = ${this.value(sec)} = sec φ</code>.</li>
                <li>The same scale maps small <code>OP = R</code> to large <code>OQ</code>, so <code>OQ = R × (R/x) = R·sec φ = ${this.value(this.R)} × ${this.value(sec)} = ${this.value(this.R * sec)}</code> ${derivationButton("secant-length")}.</li>
              </ul>
              <p class="course-hint"><code>sec φ</code> is the dimensionless scale factor. The orange displayed length is <code>OQ = R·sec φ</code>, not sec φ by itself.</p>
              ${comparisonAvailable ? `
                <div class="trig-proof-actions">
                  <button type="button" class="course-btn" data-trig-comparison="sec">Animate matching triangles from the circle</button>
                </div>
                <p class="course-hint">The circle construction remains visible. Run the animation to move copies of small <code>OHP</code> and large <code>OQP</code> into the side-by-side comparison; matching colours identify corresponding angles and sides.</p>`
                : `<p class="course-hint">Choose a non-axis angle to animate two non-degenerate triangles.</p>`}` : xUnavailable}
            <button type="button" class="course-btn ghost" data-trig-function="sec">Back to the reciprocal</button>`
          : `
            <h3 style="color:#ffa657">4 · Secant starts in the original triangle</h3>
            <p>Cosine compares the adjacent side <code>x</code> with the radius <code>R</code>:</p>
            <div class="formula" data-derivation="cosine"><div class="formula-body">cos φ = x/R = ${this.value(x)} ÷ ${this.value(this.R)} = ${this.value(cosT)}</div></div>
            <p>Its reciprocal flips that ratio, so:</p>
            <div class="formula" data-derivation="secant"><div class="formula-body">sec φ = R/x = ${this.value(this.R)} ÷ ${this.value(x)} = ${this.value(sec)} = 1/cos φ</div></div>
            <button type="button" class="course-btn" data-trig-secant-proof>Next: show the secant construction →</button>`;
        break;
      case "cosec":
        body = this.cosecConstructionShown
          ? `
            <h3 style="color:#39c5cf">5 · Cosecant: the similar triangle</h3>
            ${yConstructionAvailable ? `
              <p>Calculate every angle in each triangle first. Compare the triangles only after both ledgers are complete.</p>
              <div class="trig-angle-ledger" aria-label="Two-triangle angle ledger">
                <section class="trig-ledger-triangle" aria-labelledby="trig-small-ledger">
                  <h4 id="trig-small-ledger">1 · Small triangle OHP — calculate all three angles</h4>
                  <ol>
                    <li>
                      <p><b>At O:</b> <code>OH</code> is on the x-axis, and <code>OP</code> is drawn at <code>φ</code> from the x-axis.</p>
                      <div class="trig-ledger-formula" data-trig-ledger-angle="small-o"><code>∠HOP = φ = ${referenceAngleText}</code></div>
                    </li>
                    <li>
                      <p><b>At H:</b> <code>OH</code> is horizontal and <code>HP</code> is vertical, so they form a right angle.</p>
                      <div class="trig-ledger-formula" data-trig-ledger-angle="small-h"><code>∠OHP = 90°</code></div>
                    </li>
                    <li>
                      <p><b>At P:</b> triangle <code>OHP</code> totals <code>180°</code>, so subtract the two angles already calculated.</p>
                      <div class="trig-ledger-formula" data-trig-ledger-angle="small-p"><code>∠HPO = 180° − φ − 90° = 180° − ${referenceAngleText} − 90° = ${complementaryAngleText}</code></div>
                    </li>
                  </ol>
                </section>

                <section class="trig-ledger-triangle" aria-labelledby="trig-large-ledger">
                  <h4 id="trig-large-ledger">2 · Large triangle OSP — calculate all three angles</h4>
                  <ol>
                    <li>
                      <p><b>At O:</b> <code>OS</code> is the y-axis, which is <code>90°</code> from the x-axis. <code>OP</code> is the <b>SAME radius ray</b> used in the small triangle, drawn at <code>φ = ${referenceAngleText}</code> from the x-axis. The remaining gap between <code>OS</code> and <code>OP</code> is therefore <code>90° − φ</code>.</p>
                      <div class="trig-ledger-formula" data-trig-ledger-angle="large-o"><code>∠SOP = 90° − φ = 90° − ${referenceAngleText} = ${complementaryAngleText}</code></div>
                      <p class="course-hint">This calculated <code>${complementaryAngleText}</code> matches the small triangle’s previously calculated <code>∠HPO</code>.</p>
                    </li>
                    <li>
                      <p><b>At P:</b> radius <code>OP</code> is perpendicular to tangent <code>SP</code>.</p>
                      <div class="trig-ledger-formula" data-trig-ledger-angle="large-p"><code>∠SPO = 90°</code></div>
                    </li>
                    <li>
                      <p><b>At S:</b> triangle <code>OSP</code> totals <code>180°</code>, so subtract its calculated angles at O and P.</p>
                      <div class="trig-ledger-formula" data-trig-ledger-angle="large-s"><code>∠OSP = 180° − (90° − φ) − 90° = 180° − ${complementaryAngleText} − 90° = ${referenceAngleText} = φ</code></div>
                      <p class="course-hint">This calculated <code>${referenceAngleText}</code> matches the small triangle’s previously calculated <code>∠HOP</code>.</p>
                    </li>
                  </ol>
                </section>

                <section class="trig-ledger-conclusion" aria-labelledby="trig-ledger-conclusion">
                  <h4 id="trig-ledger-conclusion">3 · Compare after both calculations</h4>
                  <p>The two triangles were calculated independently before any matching angle pair was claimed:</p>
                  <ul>
                    <li><b>small O → large S:</b> <code>∠HOP</code> and <code>∠OSP</code> are both <code>φ = ${referenceAngleText}</code>.</li>
                    <li><b>small H → large P:</b> <code>∠OHP</code> and <code>∠SPO</code> are both <code>90°</code>.</li>
                    <li><b>small P → large O:</b> <code>∠HPO</code> and <code>∠SOP</code> are both <code>90° − φ = ${complementaryAngleText}</code>.</li>
                  </ul>
                  <p><b>Conclusion:</b> all three calculated angle pairs match, so <code>△OHP ∼ △SPO</code> by AAA. AA would already be sufficient; calculating all three angles makes the vertex mapping explicit.</p>
                </section>
              </div>
              <div class="trig-correspondence" aria-label="Cosecant triangle correspondences">
                <span><b>Vertices</b> O ↔ S · H ↔ P · P ↔ O</span>
                <span><b>Sides</b> OH ↔ SP · HP ↔ OP · OP ↔ OS</span>
              </div>
              <ul>
                <li>Large <code>OP</code> is the same radius <code>R</code> and corresponds to small <code>HP = y</code>, so the scale factor from small to large is <code>R/y = ${this.value(this.R)} ÷ ${this.value(y)} = ${this.value(cosec)} = cosec φ</code>.</li>
                <li>The same scale maps small <code>OP = R</code> to large <code>OS</code>, so <code>OS = R × (R/y) = R·cosec φ = ${this.value(this.R)} × ${this.value(cosec)} = ${this.value(this.R * cosec)}</code> ${derivationButton("cosecant-length")}.</li>
              </ul>
              <p class="course-hint"><code>cosec φ</code> is the dimensionless scale factor. The cyan displayed length is <code>OS = R·cosec φ</code>, not cosec φ by itself.</p>
              ${comparisonAvailable ? `
                <div class="trig-proof-actions">
                  <button type="button" class="course-btn" data-trig-comparison="cosec">Animate matching triangles from the circle</button>
                </div>
                <p class="course-hint">The circle construction remains visible. Run the animation to move copies of small <code>OHP</code> and large <code>OSP</code> into the side-by-side comparison; matching colours identify the calculated pairs and sides.</p>`
                : `<p class="course-hint">Choose a non-axis angle to animate two non-degenerate triangles.</p>`}` : yUnavailable}
            <button type="button" class="course-btn ghost" data-trig-function="cosec">Back to the reciprocal</button>`
          : `
            <h3 style="color:#39c5cf">5 · Cosecant starts in the original triangle</h3>
            <p>Sine compares the opposite side <code>y</code> with the radius <code>R</code>:</p>
            <div class="formula" data-derivation="sine"><div class="formula-body">sin φ = y/R = ${this.value(y)} ÷ ${this.value(this.R)} = ${this.value(sinT)}</div></div>
            <p>Its reciprocal flips that ratio, so:</p>
            <div class="formula" data-derivation="cosecant"><div class="formula-body">cosec φ = R/y = ${this.value(this.R)} ÷ ${this.value(y)} = ${this.value(cosec)} = 1/sin φ</div></div>
            <button type="button" class="course-btn" data-trig-cosecant-proof>Next: show the cosecant construction →</button>`;
        break;
      case "cot":
        body = `
          <h3 style="color:#ffd166">6 · Cotangent: the y-axis tangent side</h3>
          ${yConstructionAvailable ? `
            <p>The yellow side runs from the y-axis intercept S to P. The cyan axis length is muted.</p>
            <div class="formula" data-derivation="cotangent-length"><div class="formula-body">SP = R·cot φ = ${this.value(this.R)} × ${this.value(cot)} = ${this.value(this.R * cot)}</div></div>
            <p class="course-hint">The ratio itself is cot φ = x/y = ${this.value(x)} ÷ ${this.value(y)} = ${this.value(cot)} ${derivationButton("cotangent")}.</p>
            <div class="trig-proof-actions">
              <button type="button" class="course-btn" data-trig-comparison="cot">Animate the matching triangles for cotangent</button>
            </div>
            <p class="course-hint">The same comparison as cosecant highlights <code>OH ↔ SP</code>: scale <code>OH = x</code> by <code>R/y</code> to get <code>SP = R·cot φ</code>.</p>`
            : yUnavailable}`;
        break;
      default:
        body = `
          <h3>Start · One right triangle</h3>
          <p>The white line is the radius <code>R = ${this.value(this.R)}</code>. Its faint horizontal and vertical projections make the original right triangle.</p>
          <p><b>Choose sin first.</b> The picture will add one idea at a time.</p>`;
      }
    }

    const historyDetails = this.selectedFunction
      ? `<section class="course trig-history" data-trig-history>
          <h3>How the six functions were discovered</h3>
          <p>${history[this.selectedFunction]}</p>
          <p><b>They were not discovered together.</b> Trigonometry developed over roughly two millennia because astronomers, surveyors, and navigators needed different calculations.</p>
          <ol>
            <li><b>Greek astronomy, c. 140 BCE:</b> Hipparchus tabulated <em>chords</em>; Ptolemy later refined them. A chord is the straight line joining two points on a circle. For a central angle <code>θ</code> in a circle of radius <code>R</code>, its length is <code>2R·sin(θ/2)</code> ${derivationButton("chord-length")}. A chord table was therefore a lookup list: choose an angle, read its chord length, then use it to solve an astronomical triangle without calculating a new value from scratch. It is closely related to modern sine, but neither author used sine as a named function.</li>
            <li><b>Indian astronomy, c. 500 CE:</b> Aryabhata tabulated half-chords, effectively modern sines, calling them <em>jya</em>. The word travelled through Arabic <em>jiba/jaib</em> and Latin <em>sinus</em>, giving “sine”.</li>
            <li><b>Islamic scholarship, ninth–tenth centuries:</b> mathematicians worked explicitly with sine and cosine; by about 980, Abu'l-Wafa recorded a double-angle relation using both.</li>
            <li><b>Shadows before tangents:</b> tangent and cotangent grew together from paired shadow tables used to find heights and design sundials. The name <em>tangent</em> arrived much later, in 1583.</li>
            <li><b>Navigation and Renaissance tables:</b> secant and cosecant came later, becoming useful in navigation from about the fifteenth century. Renaissance writers then connected all six through reciprocal and complementary relationships.</li>
          </ol>
          <p class="course-hint">Sources: <a href="https://mathshistory.st-andrews.ac.uk/HistTopics/Trigonometric_functions/" target="_blank" rel="noreferrer">MacTutor, “Trigonometric functions”</a>; Glen Van Brummelen, <cite>The Mathematics of the Heavens and the Earth</cite> (Princeton University Press, 2009).</p>
        </section>`
      : "";
    const concepts: Record<TrigFunction, string> = {
      sin: `<p>The vertical component is a fraction of the radius.</p><div class="formula" data-derivation="sine"><div class="formula-body">sin φ = y/R = ${this.value(y)} ÷ ${this.value(this.R)} = ${this.value(sinT)}</div></div>`,
      cos: `<p>The horizontal component is a fraction of the radius.</p><div class="formula" data-derivation="cosine"><div class="formula-body">cos φ = x/R = ${this.value(x)} ÷ ${this.value(this.R)} = ${this.value(cosT)}</div></div>`,
      tan: `<p>Tangent compares the two directed legs of the original triangle.</p><div class="formula" data-derivation="tangent"><div class="formula-body">tan φ = y/x = ${this.value(y)} ÷ ${this.value(x)} = ${this.value(tanT)}</div></div>`,
      sec: `<p>Secant is the reciprocal of cosine: it compares the radius with the horizontal component.</p><div class="formula" data-derivation="secant"><div class="formula-body">sec φ = R/x = ${this.value(this.R)} ÷ ${this.value(x)} = ${this.value(sec)}</div></div>`,
      cosec: `<p>Cosecant is the reciprocal of sine: it compares the radius with the vertical component.</p><div class="formula" data-derivation="cosecant"><div class="formula-body">cosec φ = R/y = ${this.value(this.R)} ÷ ${this.value(y)} = ${this.value(cosec)}</div></div>`,
      cot: `<p>Cotangent compares the horizontal component with the vertical component.</p><div class="formula" data-derivation="cotangent"><div class="formula-body">cot φ = x/y = ${this.value(x)} ÷ ${this.value(y)} = ${this.value(cot)}</div></div>`,
    };
    const comparisonDescriptions: Record<ComparisonFunction, string> = {
      sec: "Compare OHP with OQP. The scale factor is sec φ = R/x.",
      cosec: "Compare OHP with OSP. The scale factor is cosec φ = R/y.",
      cot: "Compare OHP with OSP and follow OH ↔ SP to derive SP = R·cot φ.",
    };
    const comparisonFunction = this.selectedFunction === "sec"
      || this.selectedFunction === "cosec"
      || this.selectedFunction === "cot"
      ? this.selectedFunction
      : null;
    const comparisonBody = !comparisonFunction
      ? `<section class="course trig-tab-empty"><h3>Compare matching triangles</h3><p>Select secant, cosecant, or cotangent to compare the original triangle with its tangent construction.</p></section>`
      : this.comparisonFunction !== comparisonFunction
      ? `<section class="course trig-tab-empty"><h3>Compare matching triangles</h3><p>Build the ${comparisonFunction === "sec" ? "secant" : "cosecant"} construction first, then return here to separate the matching triangles.</p><button type="button" class="course-btn" ${comparisonFunction === "sec" ? "data-trig-secant-proof" : "data-trig-cosecant-proof"}>Build the construction</button></section>`
      : `<section class="course trig-comparison-tab"><h3>Compare matching triangles</h3><p>${comparisonDescriptions[comparisonFunction]}</p><button type="button" class="course-btn" data-trig-comparison="${comparisonFunction}">${this.comparisonGroup.visible ? "Restart the matching-triangle animation" : "Animate the matching triangles"}</button><p class="course-hint">Switching among secant, cosecant, and cotangent keeps this view open and reconfigures the diagram for the new function.</p></section>`;
    const identityAction = this.selectedFunction === "sin" || this.selectedFunction === "cos"
      ? `<button type="button" class="course-btn ghost trig-identity-action" data-trig-identity aria-pressed="false">Why sin²φ + cos²φ = 1</button>`
      : "";
    const conceptBody = this.selectedFunction
      ? `<section class="course trig-concept" data-trig-concept><h3>${this.selectedFunction}</h3>${concepts[this.selectedFunction]}${identityAction}</section>`
      : body;
    const activeBody = this.identityProofShown
      ? body
      : this.activePanelTab === "concept"
      ? conceptBody
      : this.activePanelTab === "construction"
      ? body
      : this.activePanelTab === "comparison"
      ? comparisonBody
      : historyDetails || `<section class="course trig-tab-empty"><h3>History &amp; uses</h3><p>Select a function to follow its development.</p></section>`;
    panel.innerHTML = activeBody;
    panel.querySelectorAll<HTMLElement>(".formula[data-derivation]").forEach((card) => {
      if (card.querySelector(".formula-derive")) return;
      card.insertAdjacentHTML("beforeend", derivationButton(card.dataset.derivation ?? ""));
    });
    const support = document.getElementById("trig-support");
    if (support) support.hidden = this.identityProofShown || this.activePanelTab !== "concept";

    document.querySelectorAll<HTMLButtonElement>("[data-trig-function]").forEach((button) => {
      const active = button.dataset.trigFunction === this.selectedFunction;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const identityButton = document.querySelector<HTMLButtonElement>("[data-trig-identity]");
    identityButton?.classList.toggle("active", this.identityProofShown);
    identityButton?.setAttribute("aria-pressed", String(this.identityProofShown));
    document.querySelectorAll<HTMLButtonElement>("[data-trig-panel-tab]").forEach((button) => {
      const active = button.dataset.trigPanelTab === this.activePanelTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  private renderPanel(): void {
    this.setInfo(`
      <h2>Trigonometric Functions</h2>
      <p>Build every function from <b>one right triangle</b>. The circle is only a quiet guide.</p>

      <div class="trig-function-labels" aria-label="Build the trigonometric picture step by step">
        ${(["sin", "cos", "tan", "sec", "cosec", "cot"] as TrigFunction[]).map((name, index) =>
          `<button type="button" class="trig-function-label" data-trig-function="${name}" aria-pressed="false">${index + 1} · ${name}</button>`,
        ).join("")}
        <button type="button" class="trig-function-label" data-trig-reset>reset picture</button>
      </div>
      <div class="trig-panel-tabs" role="tablist" aria-label="Trigonometry lesson views">
        <button type="button" role="tab" class="trig-panel-tab active" data-trig-panel-tab="concept" aria-selected="true">Concept</button>
        <button type="button" role="tab" class="trig-panel-tab" data-trig-panel-tab="construction" aria-selected="false">Construction</button>
        <button type="button" role="tab" class="trig-panel-tab" data-trig-panel-tab="comparison" aria-selected="false">Compare</button>
        <button type="button" role="tab" class="trig-panel-tab" data-trig-panel-tab="history" aria-selected="false">History &amp; uses</button>
      </div>
      <div class="course" id="trig-function-breakdown" aria-live="polite"></div>

      <div id="trig-support">
        <h3>Live values</h3>
        <div class="readout" id="trig-readout"></div>

        <details class="course">
          <summary>Check all six from x, y and R</summary>
          <div id="trig-derivation"></div>
        </details>

        <details class="course">
          <summary>Angle controls and signs</summary>
          <p><code>φ = start + θ</code> is the final angle from the positive x-axis. Changing R scales
          all three side lengths but not their ratios. Beyond the first quadrant, x and y are directed
          lengths, so their signs carry into the six function values.</p>
        </details>

        <div class="course">
          <h3>Quick angles</h3>
          <div class="course-chapters">
            ${SPECIAL_ANGLES.map((angle) =>
              `<button type="button" class="course-chapter" data-trig-angle="${angle}"><span class="course-num">${angle}°</span></button>`,
            ).join("")}
          </div>
        </div>
      </div>`);

    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);
  }

  private makeLine(color: number, opacity: number): THREE.Line {
    const line = segment(this.center, this.center, color);
    this.setLineStyle(line, color, opacity);
    return line;
  }

  private setLine(line: THREE.Line, a: THREE.Vector3, b: THREE.Vector3): void {
    line.geometry.setFromPoints([a, b]);
  }

  private setLineStyle(line: THREE.Line, color: number, opacity: number): void {
    const material = line.material as THREE.LineBasicMaterial;
    material.color.setHex(color);
    material.transparent = opacity < 1;
    material.opacity = opacity;
  }

  private createTriangle(color: number, opacity: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
  }

  private setTriangleStyle(triangle: THREE.Mesh, color: number, opacity: number): void {
    const material = triangle.material as THREE.MeshBasicMaterial;
    material.color.setHex(color);
    material.opacity = opacity;
  }

  private updateTriangle(triangle: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void {
    triangle.geometry.setAttribute("position", new THREE.Float32BufferAttribute([
      a.x, a.y, 0,
      b.x, b.y, 0,
      c.x, c.y, 0,
    ], 3));
    triangle.geometry.setIndex([0, 1, 2]);
  }

  private setRightAngle(
    line: THREE.Line,
    vertex: THREE.Vector3,
    directionA: THREE.Vector3,
    directionB: THREE.Vector3,
    size: number,
  ): void {
    const a = directionA.normalize().multiplyScalar(size);
    const b = directionB.normalize().multiplyScalar(size);
    line.geometry.setFromPoints([
      vertex.clone().add(a),
      vertex.clone().add(a).add(b),
      vertex.clone().add(b),
    ]);
  }

  private circlePoints(center: THREE.Vector3, radius: number, count = 96): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= count; i++) {
      const angle = 2 * Math.PI * i / count;
      points.push(new THREE.Vector3(
        center.x + radius * Math.cos(angle),
        center.y + radius * Math.sin(angle),
        0,
      ));
    }
    return points;
  }

  private setLabel(sprite: THREE.Sprite, key: string, text: string, color: number): void {
    if (this.labelText[key] === text) return;
    setSpriteText(sprite, text, color);
    this.labelText[key] = text;
  }

  private setInterceptVertexLabel(label: "Q" | "S", color: number): void {
    if (this.interceptVertexLabel.userData.label === label) return;
    setSpriteText(this.interceptVertexLabel, label, color);
    this.interceptVertexLabel.userData.label = label;
  }

  private angleValue(angle: number): string {
    return this.params.unit === "deg"
      ? `${(angle / DEG).toFixed(1)}°`
      : `${angle.toFixed(3)} rad`;
  }

  private referenceAngle(degrees: number): number {
    const normalized = ((degrees % 360) + 360) % 360;
    if (normalized <= 90) return normalized;
    if (normalized <= 180) return 180 - normalized;
    if (normalized <= 270) return normalized - 180;
    return 360 - normalized;
  }

  private value(number: number): string {
    return Number.isFinite(number) ? number.toFixed(3) : "undefined";
  }

  private currentComparisonSignature(): string {
    return `${this.params.angleDeg}|${this.params.startAngleDeg}|${this.params.radius}`;
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((object) => {
      const renderable = object as THREE.Mesh;
      renderable.geometry?.dispose();
      const material = renderable.material as (THREE.Material & { map?: THREE.Texture }) | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else if (material) {
        material.map?.dispose();
        material.dispose();
      }
    });
    group.clear();
  }
}
