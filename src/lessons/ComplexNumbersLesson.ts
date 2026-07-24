import * as THREE from "three";
import type GUI from "lil-gui";
import type { Controller } from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import type { Complex } from "../math/complex";
import { add, argument, complex, format, modulus, mul, pow, sub, toPolar } from "../math/complex";
import { COMPLEX_DERIVATIONS } from "./formulaDerivations/foundations";
import { arrow2D, createDragControls, heat, marker, textSprite, updateArrow, tip } from "./helpers";

registerFormulaDerivations("complex-numbers", COMPLEX_DERIVATIONS);

type Operation = "intro" | "locate" | "add" | "subtract" | "multiply" | "power" | "roots";
type ScenarioId = "ac-power" | "radio" | "rotation";

const COLORS = {
  a: 0xff7b72,
  b: 0x79c0ff,
  result: 0x7ee787,
  unitCircle: 0x8b949e,
  angleA: 0xff7b72,
  angleB: 0x79c0ff,
};

const DEG = 180 / Math.PI;
const MAX_POINTS = 8;

interface ComplexChapter {
  title: string;
  operation: Operation;
  explanation: string;
  action: string;
  preset: {
    reA: number;
    imA: number;
    reB?: number;
    imB?: number;
    power?: number;
    scenarioId?: ScenarioId;
  };
  check: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

interface RealWorldScenario {
  id: ScenarioId;
  icon: string;
  title: string;
  tag: string;
  reA: number;
  imA: number;
  reB: number;
  imB: number;
  visual: "power" | "radio" | "rotation";
  explanation: string;
  equation: string;
}

const SCENARIOS: RealWorldScenario[] = [
  {
    id: "ac-power",
    icon: "⚡",
    title: "AC power",
    tag: "Power grids & chargers",
    reA: Math.cos(Math.PI / 6),
    imA: Math.sin(Math.PI / 6),
    reB: Math.cos(-Math.PI / 6),
    imB: Math.sin(-Math.PI / 6),
    visual: "power",
    explanation: "Engineers store voltage and current as rotating arrows (phasors). Multiplying voltage by the conjugate of current cancels their opposite phase angles, leaving real power. Capacitors and inductors change that angle, which is why power factor matters.",
    equation: "V ∠ +30° × I* ∠ −30° = P ∠ 0°",
  },
  {
    id: "radio",
    icon: "📡",
    title: "Radio & GPS",
    tag: "Wireless signals",
    reA: Math.cos(Math.PI / 4),
    imA: Math.sin(Math.PI / 4),
    reB: Math.cos(-Math.PI / 4),
    imB: Math.sin(-Math.PI / 4),
    visual: "radio",
    explanation: "A receiver compares a signal against a reference wave. Complex multiplication rotates the received phasor back into alignment, separating phase and strength without losing either piece of information.",
    equation: "received ∠ +45° × reference ∠ −45° = aligned signal",
  },
  {
    id: "rotation",
    icon: "↻",
    title: "2D graphics & robots",
    tag: "Movement and animation",
    reA: 1,
    imA: 0,
    reB: Math.cos(Math.PI / 3),
    imB: Math.sin(Math.PI / 3),
    visual: "rotation",
    explanation: "A screen point or robot heading is one complex number. Multiply by a unit complex number to turn it without stretching it: this is a compact, stable way to rotate 2D positions and directions.",
    equation: "heading × (cos 60° + i sin 60°) = turned heading",
  },
];

const CHAPTERS: ComplexChapter[] = [
  {
    title: "Meet i",
    operation: "intro",
    explanation: "<code>i</code> is a new direction, perpendicular to the real number line. Multiplying by <code>i</code> turns a number 90° anticlockwise, so doing it twice turns 180° and gives <code>i² = −1</code>.",
    action: "Follow the four points around the unit circle: 1 → i → −1 → −i → 1.",
    preset: { reA: 0, imA: 1 },
    check: {
      question: "What is i²?",
      options: ["1", "−1", "2i"],
      correct: 1,
      explanation: "Multiplying by i makes a quarter-turn. Two quarter-turns point from +1 to −1, so i² = −1.",
    },
  },
  {
    title: "Plot a + bi",
    operation: "locate",
    explanation: "A complex number is just an address on a 2D plane. In <code>a + bi</code>, move <code>a</code> horizontally and <code>b</code> vertically. The word “imaginary” does not mean unreal—it names the second axis.",
    action: "Drag z. Read its real part as the horizontal step and its imaginary part as the vertical step.",
    preset: { reA: 3, imA: 2 },
    check: {
      question: "Where does 3 + 2i sit on the Argand plane?",
      options: ["(3, 2)", "(2, 3)", "(3, −2)"],
      correct: 0,
      explanation: "The real part is the x-coordinate and the coefficient of i is the y-coordinate.",
    },
  },
  {
    title: "Add as movement",
    operation: "add",
    explanation: "Addition is familiar vector movement: add horizontal parts together and vertical parts together. Walk along z, then along w, and the green arrow points straight to the same destination.",
    action: "Drag either white handle and watch the tip-to-tail path and green result move together.",
    preset: { reA: 2, imA: 1, reB: 1, imB: 2 },
    check: {
      question: "What is (2 + i) + (1 + 2i)?",
      options: ["3 + 3i", "3 + 2i", "2 + 3i"],
      correct: 0,
      explanation: "Add like parts: (2 + 1) + (1 + 2)i = 3 + 3i.",
    },
  },
  {
    title: "Multiply by i",
    operation: "multiply",
    explanation: "This is the key intuition: multiplying by <code>i</code> does not make a number mysterious—it rotates its arrow 90° anticlockwise without changing its length.",
    action: "Keep w = i and drag z. The green result always stays a quarter-turn ahead of z.",
    preset: { reA: 2, imA: 1, reB: 0, imB: 1 },
    check: {
      question: "What is (2 + i)i?",
      options: ["−1 + 2i", "1 + 2i", "2 − i"],
      correct: 0,
      explanation: "(2 + i)i = 2i + i² = 2i − 1 = −1 + 2i. Geometrically, (2, 1) rotates to (−1, 2).",
    },
  },
  {
    title: "Scale and rotate",
    operation: "multiply",
    explanation: "General complex multiplication combines two simple actions: multiply the arrow lengths and add the arrow angles. Rectangular algebra and polar geometry are two views of the same operation.",
    action: "Change w. Its length controls the scale; its angle controls how far z rotates.",
    preset: { reA: 1, imA: 1, reB: 2, imB: 1 },
    check: {
      question: "When multiplying complex numbers, what happens to their angles?",
      options: ["They add", "They multiply", "They cancel"],
      correct: 0,
      explanation: "In polar form, z·w has angle arg(z) + arg(w), while its length is |z|·|w|.",
    },
  },
  {
    title: "Rectangular ↔ polar",
    operation: "locate",
    explanation: "<code>a + bi</code> gives horizontal and vertical coordinates. Polar form gives the same point as a distance <code>r</code> and angle <code>θ</code>. Use rectangular form for addition; use polar form for multiplication.",
    action: "Drag z and compare a, b with the live |z| and arg(z) readout.",
    preset: { reA: 3, imA: 4 },
    check: {
      question: "What is |3 + 4i|?",
      options: ["5", "7", "25"],
      correct: 0,
      explanation: "The modulus is the hypotenuse: √(3² + 4²) = 5.",
    },
  },
  {
    title: "Powers",
    operation: "power",
    explanation: "A power repeats the same scale-and-rotate action. Each multiplication by z multiplies the length by |z| and adds arg(z) again, producing De Moivre’s rule.",
    action: "With z on the unit circle, change n. The length stays 1 while the angle advances by the same step.",
    preset: { reA: 0.87, imA: 0.5, power: 5 },
    check: {
      question: "If z has angle θ, what angle does zⁿ have?",
      options: ["θ + n", "nθ", "θ/n"],
      correct: 1,
      explanation: "Each multiplication adds another θ, so after n copies the angle is nθ.",
    },
  },
  {
    title: "Roots",
    operation: "roots",
    explanation: "Roots undo powers: divide the angle by n and take the n-th root of the length. There are n answers because angles that differ by a full turn represent the same original number.",
    action: "Change n and watch the roots remain equally spaced around a circle.",
    preset: { reA: 1, imA: 0, power: 4 },
    check: {
      question: "How far apart are the n complex n-th roots?",
      options: ["90°", "180°/n", "360°/n"],
      correct: 2,
      explanation: "The n roots divide a full 360° turn equally, so neighbouring roots are 360°/n apart.",
    },
  },
  {
    title: "Complex numbers at work",
    operation: "multiply",
    explanation: "The same scale-and-rotate rule powers practical tools. A complex number packages a signal's strength and timing, or a 2D object's size and direction, into one arrow that is easy to transform.",
    action: "Choose a scenario below. The red and blue arrows are normalised phasors or directions; the green arrow shows their combined effect.",
    preset: {
      reA: Math.cos(Math.PI / 6),
      imA: Math.sin(Math.PI / 6),
      reB: Math.cos(-Math.PI / 6),
      imB: Math.sin(-Math.PI / 6),
      scenarioId: "ac-power",
    },
    check: {
      question: "Why are complex numbers useful for a 2D rotation?",
      options: ["They rotate and scale in one multiplication", "They remove the need for angles", "They only work for circles"],
      correct: 0,
      explanation: "A complex multiplier has a length (the scale) and an angle (the turn), so one multiplication applies both at once.",
    },
  },
];

/**
 * Lesson: Complex Numbers.
 *
 * Drag two points around the Argand plane and see rectangular/polar form update.
 * Switch between z+w, z−w, z·w, zⁿ (De Moivre) and the n-th roots to watch complex
 * arithmetic play out geometrically: addition is tip-to-tail like vectors, while
 * multiplication multiplies lengths and adds angles.
 */
export class ComplexNumbersLesson implements Lesson {
  readonly id = "complex-numbers";
  readonly title = "Complex Numbers";
  readonly blurb = "The plane where numbers rotate";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["vectors"] as const;

  private group = new THREE.Group();
  private labels = new THREE.Group();
  private headA!: THREE.Mesh;
  private headB!: THREE.Mesh;
  private arrowA!: THREE.Group;
  private arrowB!: THREE.Group;
  private arrowResult!: THREE.Group;
  private unitCircle!: THREE.Line;
  private parallelogram!: THREE.Mesh;
  private arcA!: THREE.Line;
  private arcB!: THREE.Line;
  private helperCircle!: THREE.Line;
  private chain!: THREE.Line;
  private spokes!: THREE.LineSegments;
  private components!: THREE.LineSegments;
  private dots: THREE.Mesh[] = [];
  private introLabels: THREE.Sprite[] = [];
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private viewport!: LessonContext["viewport"];
  private stopDrag?: () => void;
  private folderA!: GUI;
  private folderB!: GUI;
  private powerCtrl!: Controller;
  private chapterIndex = 0;

  private params = {
    reA: 0,
    imA: 1,
    reB: 2,
    imB: 1,
    operation: "intro" as Operation,
    power: 3,
    showUnitCircle: true,
    scenarioId: "" as ScenarioId | "",
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    this.viewport = ctx.viewport;
    ctx.viewport.world.add(this.group);
    ctx.viewport.world.add(this.labels);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 0, 9),
      new THREE.Vector3(0, 0, 0),
    );

    this.buildGrid();
    this.buildCircle();
    this.buildArrows();
    this.buildExtras();
    this.buildLabels();
    this.buildControls();
    this.syncControlState();
    this.update();
  }

  exit(): void {
    this.stopDrag?.();
    this.stopDrag = undefined;
    this.disposeGroup(this.group);
    this.disposeGroup(this.labels);
    this.dots = [];
    this.introLabels = [];
    this.group.parent?.remove(this.group);
    this.labels.parent?.remove(this.labels);
    this.group = new THREE.Group();
    this.labels = new THREE.Group();
  }

  private buildGrid(): void {
    const grid = new THREE.GridHelper(10, 20, 0x30363d, 0x21262d);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.05;
    this.group.add(grid);

    const axes = new THREE.Group();
    const reAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5, 0, 0), new THREE.Vector3(5, 0, 0)]),
      new THREE.LineBasicMaterial({ color: 0x8b949e }),
    );
    const imAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -5, 0), new THREE.Vector3(0, 5, 0)]),
      new THREE.LineBasicMaterial({ color: 0x8b949e }),
    );
    axes.add(reAxis, imAxis);
    this.group.add(axes);

    const reLabel = textSprite("Re", 0x8b949e, 0.5);
    reLabel.position.set(4.7, -0.4, 0.1);
    const imLabel = textSprite("Im", 0x8b949e, 0.5);
    imLabel.position.set(-0.5, 4.7, 0.1);
    this.labels.add(reLabel, imLabel);
  }

  private buildCircle(): void {
    this.unitCircle = new THREE.Line(
      this.circleGeometry(1),
      new THREE.LineBasicMaterial({ color: COLORS.unitCircle, transparent: true, opacity: 0.5 }),
    );
    this.group.add(this.unitCircle);
  }

  private circleGeometry(r: number): THREE.BufferGeometry {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * r, Math.sin(t) * r, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  private buildArrows(): void {
    this.headA = marker(0xffffff, 0.13);
    this.headB = marker(0xffffff, 0.13);
    this.group.add(this.headA, this.headB);

    this.arrowA = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(this.params.reA, this.params.imA), COLORS.a);
    this.arrowB = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(this.params.reB, this.params.imB), COLORS.b);
    this.arrowResult = arrow2D(new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), COLORS.result);

    this.group.add(this.arrowA, this.arrowB, this.arrowResult);

    this.stopDrag = createDragControls(this.viewport, [this.headA, this.headB], (index, point) => {
      const x = THREE.MathUtils.clamp(point.x, -4.5, 4.5);
      const y = THREE.MathUtils.clamp(point.y, -4.5, 4.5);
      if (index === 0) {
        this.params.reA = x;
        this.params.imA = y;
      } else {
        // The w handle only exists in add/subtract/multiply. In the tip-to-tail modes
        // it sits at the chain tip (the result), so recover w from the dragged point.
        const op = this.params.operation;
        if (op === "add") {
          this.params.reB = THREE.MathUtils.clamp(x - this.params.reA, -4.5, 4.5);
          this.params.imB = THREE.MathUtils.clamp(y - this.params.imA, -4.5, 4.5);
        } else if (op === "subtract") {
          this.params.reB = THREE.MathUtils.clamp(this.params.reA - x, -4.5, 4.5);
          this.params.imB = THREE.MathUtils.clamp(this.params.imA - y, -4.5, 4.5);
        } else if (op === "multiply") {
          this.params.reB = x;
          this.params.imB = y;
        } else {
          return; // power / roots ignore w
        }
      }
      this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
      this.update();
    });
  }

  private buildExtras(): void {
    // Faint parallelogram fill spanned by z and w (addition).
    const paraGeo = new THREE.BufferGeometry();
    paraGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(18), 3));
    this.parallelogram = new THREE.Mesh(
      paraGeo,
      new THREE.MeshBasicMaterial({
        color: COLORS.result,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.parallelogram.position.z = -0.02;
    this.parallelogram.visible = false;
    this.group.add(this.parallelogram);

    // Angle arcs for multiplication: arg(z) then arg(w) stacked on top, so the eye
    // reads the two sweeps adding up to arg(z·w).
    this.arcA = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: COLORS.angleA }));
    this.arcB = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: COLORS.angleB }));
    this.arcA.visible = false;
    this.arcB.visible = false;
    this.group.add(this.arcA, this.arcB);

    // Reusable circle for the roots' radius |z|^(1/n).
    this.helperCircle = new THREE.Line(
      this.circleGeometry(1),
      new THREE.LineBasicMaterial({ color: COLORS.result, transparent: true, opacity: 0.4 }),
    );
    this.helperCircle.visible = false;
    this.group.add(this.helperCircle);

    // Polyline joining the powers/roots, plus a pool of point markers.
    this.chain = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xd2a8ff }));
    this.chain.visible = false;
    this.group.add(this.chain);

    // Faint radial spokes from the origin to each root, so equal spacing is obvious.
    this.spokes = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x8b949e, transparent: true, opacity: 0.5 }),
    );
    this.spokes.visible = false;
    this.group.add(this.spokes);

    // Horizontal then vertical component walk for reading z = a + bi.
    this.components = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 }),
    );
    this.components.visible = false;
    this.group.add(this.components);

    for (let i = 0; i < MAX_POINTS; i++) {
      const m = marker(0xd2a8ff, 0.11);
      m.visible = false;
      this.dots.push(m);
      this.group.add(m);
    }
  }

  private buildLabels(): void {
    const aLabel = textSprite("z", COLORS.a, 0.6);
    const bLabel = textSprite("w", COLORS.b, 0.6);
    const rLabel = textSprite("R", COLORS.result, 0.6);
    aLabel.name = "a";
    bLabel.name = "b";
    rLabel.name = "r";
    this.labels.add(aLabel, bLabel, rLabel);

    const introPoints: Array<[string, number, number]> = [
      ["1", 1.35, -0.15],
      ["i", 0.15, 1.35],
      ["−1", -1.45, -0.15],
      ["−i", 0.2, -1.4],
    ];
    for (const [text, x, y] of introPoints) {
      const label = textSprite(text, 0xd2a8ff, 0.42);
      label.position.set(x, y, 0.12);
      label.visible = false;
      this.introLabels.push(label);
      this.labels.add(label);
    }
  }

  private buildControls(): void {
    const g = this.gui;
    this.folderA = g.addFolder("Complex number z");
    tip(this.folderA.add(this.params, "reA", -4, 4, 0.1).name("real (a)"), "Real part of z = a + bi").onChange(() => this.update());
    tip(this.folderA.add(this.params, "imA", -4, 4, 0.1).name("imaginary (b)"), "Imaginary part of z = a + bi").onChange(() => this.update());
    this.folderA.close();

    this.folderB = g.addFolder("Complex number w");
    tip(this.folderB.add(this.params, "reB", -4, 4, 0.1).name("real"), "Real part of w").onChange(() => this.update());
    tip(this.folderB.add(this.params, "imB", -4, 4, 0.1).name("imaginary"), "Imaginary part of w").onChange(() => this.update());
    this.folderB.close();

    tip(g.add(this.params, "operation", {
      "i powers  (start here)": "intro",
      "plot z = a + bi": "locate",
      "z + w  (add)": "add",
      "z − w  (subtract)": "subtract",
      "z · w  (multiply)": "multiply",
      "zⁿ  (De Moivre)": "power",
      "n-th roots": "roots",
    }).name("Operation"), "Choose the complex operation to visualise").onChange(() => {
      const chapter = CHAPTERS.findIndex((entry) => entry.operation === this.params.operation);
      if (chapter >= 0) this.chapterIndex = chapter;
      this.syncControlState();
      this.update();
    });

    this.powerCtrl = tip(g.add(this.params, "power", 2, 8, 1).name("n"), "Exponent for zⁿ / how many roots").onChange(() => this.update());
    tip(g.add(this.params, "showUnitCircle").name("Show unit circle"), "Highlight the circle |z| = 1").onChange(() => this.update());
  }

  /** Grey out controls that don't apply to the current operation. */
  private syncControlState(): void {
    const op = this.params.operation;
    const usesW = op === "add" || op === "subtract" || op === "multiply";
    const usesN = op === "power" || op === "roots";
    this.folderB.controllers.forEach((c) => c.enable(usesW));
    this.powerCtrl.enable(usesN);
    if (op === "intro") {
      this.folderA.close();
      this.folderB.close();
    } else if (usesW) {
      this.folderA.open();
      this.folderB.open();
    } else {
      this.folderA.open();
      this.folderB.close();
    }
  }

  private setArc(line: THREE.Line, radius: number, a0: number, a1: number): void {
    const seg = 48;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= seg; i++) {
      const t = a0 + ((a1 - a0) * i) / seg;
      pts.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0.02));
    }
    line.geometry.setFromPoints(pts);
    line.visible = Math.abs(a1 - a0) > 1e-3;
  }

  private updateParallelogram(z: THREE.Vector2, w: THREE.Vector2): void {
    const pos = this.parallelogram.geometry.getAttribute("position") as THREE.BufferAttribute;
    const cx = z.x + w.x;
    const cy = z.y + w.y;
    pos.setXYZ(0, 0, 0, 0);
    pos.setXYZ(1, z.x, z.y, 0);
    pos.setXYZ(2, cx, cy, 0);
    pos.setXYZ(3, 0, 0, 0);
    pos.setXYZ(4, cx, cy, 0);
    pos.setXYZ(5, w.x, w.y, 0);
    pos.needsUpdate = true;
    this.parallelogram.geometry.computeBoundingSphere();
  }

  private update(): void {
    const z = complex(this.params.reA, this.params.imA);
    const w = complex(this.params.reB, this.params.imB);
    const origin = new THREE.Vector3(0, 0, 0);
    const op = this.params.operation;

    // z is always drawn from the origin.
    updateArrow(this.arrowA, origin, new THREE.Vector3(z.re, z.im, 0));
    this.headA.position.set(z.re, z.im, 0.05);
    this.unitCircle.visible = this.params.showUnitCircle || op === "intro";

    const aLabel = this.labels.getObjectByName("a") as THREE.Sprite;
    const bLabel = this.labels.getObjectByName("b") as THREE.Sprite;
    const rLabel = this.labels.getObjectByName("r") as THREE.Sprite;
    aLabel.visible = true;
    aLabel.position.set(z.re + 0.25, z.im + 0.25, 0.1);

    // Reset the optional visuals; each branch turns on what it needs.
    this.arrowB.visible = false;
    this.headB.visible = false;
    this.arrowResult.visible = false;
    bLabel.visible = false;
    rLabel.visible = false;
    this.parallelogram.visible = false;
    this.arcA.visible = false;
    this.arcB.visible = false;
    this.helperCircle.visible = false;
    this.chain.visible = false;
    this.spokes.visible = false;
    this.components.visible = false;
    for (const label of this.introLabels) label.visible = false;
    for (const d of this.dots) {
      d.visible = false;
      d.scale.setScalar(1);
    }

    let info = "";

    if (op === "intro") {
      info = this.updateIntro();
    } else if (op === "locate") {
      info = this.updateLocate(z);
    } else if (op === "add" || op === "subtract") {
      info = this.updateAddSub(z, w, origin, bLabel, rLabel);
    } else if (op === "multiply") {
      info = this.updateMultiply(z, w, origin, bLabel, rLabel);
    } else if (op === "power") {
      info = this.updatePower(z, rLabel);
    } else {
      info = this.updateRoots(z);
    }

    this.setInfo(info);
    this.bindCourseControls();
  }

  private updateIntro(): string {
    (this.labels.getObjectByName("a") as THREE.Sprite).visible = false;
    const points = [
      new THREE.Vector3(1, 0, 0.02),
      new THREE.Vector3(0, 1, 0.02),
      new THREE.Vector3(-1, 0, 0.02),
      new THREE.Vector3(0, -1, 0.02),
      new THREE.Vector3(1, 0, 0.02),
    ];
    this.chain.geometry.setFromPoints(points);
    this.chain.visible = true;
    for (let i = 0; i < 4; i++) {
      const dot = this.dots[i];
      dot.visible = true;
      dot.position.copy(points[i]);
      (dot.material as THREE.MeshStandardMaterial).color.copy(heat(i / 3));
      this.introLabels[i].visible = true;
    }

    return this.lessonHtml(`
      <div class="readout complex-cycle">
        <div><span>Start</span><b>1</b></div>
        <div><span>× i</span><b>i</b></div>
        <div><span>× i again</span><b>i² = −1</b></div>
        <div><span>four turns</span><b>i⁴ = 1</b></div>
      </div>
      <p>The old real number line could only move left and right. Complex numbers add a
      perpendicular direction, so equations such as <code>x² + 1 = 0</code> finally have
      solutions: <code>x = i</code> or <code>x = −i</code>.</p>
      <p class="example"><b>Remember:</b> do not begin by treating i as a strange algebra
      symbol. Picture “multiply by i” as “turn left by 90°”. The algebra follows the picture.</p>
    `);
  }

  private updateLocate(z: Complex): string {
    this.components.geometry.setFromPoints([
      new THREE.Vector3(0, 0, 0.02),
      new THREE.Vector3(z.re, 0, 0.02),
      new THREE.Vector3(z.re, 0, 0.02),
      new THREE.Vector3(z.re, z.im, 0.02),
    ]);
    this.components.visible = true;

    const zp = toPolar(z);
    return this.lessonHtml(`
      <p>Read <code>${format(z)}</code> as a journey: move <b>${Math.abs(z.re).toFixed(2)}
      ${z.re < 0 ? "left" : "right"}</b>, then <b>${Math.abs(z.im).toFixed(2)}
      ${z.im < 0 ? "down" : "up"}</b>. The yellow right-angle path shows those two components.</p>
      <div class="readout">
        <div><span style="color:#ff7b72">z</span> = ${format(z)}</div>
        <div><span>rectangular</span> a = ${z.re.toFixed(2)} &nbsp;b = ${z.im.toFixed(2)}</div>
        <div><span>polar</span> |z| = ${modulus(z).toFixed(2)} &nbsp;arg(z) = ${(zp.theta * DEG).toFixed(1)}°</div>
      </div>
      ${derivationButton("complex-modulus")}
      <p><b>Same number, two descriptions:</b> rectangular form tells you the sideways/upwards
      components; polar form tells you the arrow's length and direction.</p>
    `);
  }

  private updateAddSub(
    z: Complex,
    w: Complex,
    origin: THREE.Vector3,
    bLabel: THREE.Sprite,
    rLabel: THREE.Sprite,
  ): string {
    const add2 = this.params.operation === "add";
    const zv = new THREE.Vector2(z.re, z.im);
    const wv = new THREE.Vector2(w.re, w.im);
    const rv = add2 ? zv.clone().add(wv) : zv.clone().sub(wv);
    const zTip = new THREE.Vector3(zv.x, zv.y, 0);
    const rVec = new THREE.Vector3(rv.x, rv.y, 0);

    // Tip-to-tail: w drawn from z's tip, green result from the origin.
    updateArrow(this.arrowB, zTip, rVec);
    updateArrow(this.arrowResult, origin, rVec);
    this.arrowB.visible = true;
    this.arrowResult.visible = true;
    this.headB.visible = true;
    this.headB.position.set(rv.x, rv.y, 0.05);

    bLabel.visible = true;
    bLabel.position.set((zv.x + rv.x) / 2 + 0.25, (zv.y + rv.y) / 2 + 0.25, 0.1);
    rLabel.visible = true;
    rLabel.position.set(rv.x + 0.3, rv.y + 0.3, 0.1);

    if (add2) {
      this.updateParallelogram(zv, wv);
      this.parallelogram.visible = true;
    }

    const result = add2 ? add(z, w) : sub(z, w);
    const sign = add2 ? "+" : "−";
    const detail = add2
      ? "Addition just adds the real parts and the imaginary parts separately, exactly like adding vectors. Follow z, then w drawn from z's tip, and you land on the green sum."
      : "z − w is z + (−w): flip w and lay it tip-to-tail from z. Geometrically the result is also the arrow from the tip of w to the tip of z.";
    return this.infoHtml(z, w, result, `z ${sign} w`, detail,
      "Set z = 2 + i and w = 1 + i. Notice how sliding either point drags the green result the same way it would if these were plain vectors.");
  }

  private updateMultiply(
    z: Complex,
    w: Complex,
    origin: THREE.Vector3,
    bLabel: THREE.Sprite,
    rLabel: THREE.Sprite,
  ): string {
    updateArrow(this.arrowB, origin, new THREE.Vector3(w.re, w.im, 0));
    this.arrowB.visible = true;
    this.headB.visible = true;
    this.headB.position.set(w.re, w.im, 0.05);
    bLabel.visible = true;
    bLabel.position.set(w.re + 0.25, w.im + 0.25, 0.1);

    const result = mul(z, w);
    updateArrow(this.arrowResult, origin, new THREE.Vector3(result.re, result.im, 0));
    this.arrowResult.visible = true;
    rLabel.visible = true;
    rLabel.position.set(result.re + 0.3, result.im + 0.3, 0.1);

    // Show arg(z), then arg(w) continuing on top of it: the two sweeps add to arg(R).
    const argZ = argument(z);
    const argW = argument(w);
    this.setArc(this.arcA, 0.85, 0, argZ);
    this.setArc(this.arcB, 1.05, argZ, argZ + argW);

    const scenario = this.getActiveScenario();
    const detail =
      "Multiplication is easiest in polar form: <b>multiply the lengths and add the angles</b>. " +
      "|R| = |z|·|w| and arg(R) = arg(z) + arg(w). The red arc is arg(z); the blue arc stacked on it is arg(w), " +
      "and together they reach the green result. This is why multiplying by i (length 1, angle 90°) rotates a number a quarter-turn.";
    return this.infoHtml(z, w, result, "z · w", detail,
      "Set w = i (real 0, imaginary 1). Every z you drag keeps its length but rotates 90° anticlockwise.")
      + derivationButton("complex-polar-product")
      + (scenario ? this.scenarioHtml(scenario) : "");
  }

  private updatePower(z: Complex, rLabel: THREE.Sprite): string {
    const n = this.params.power;
    const origin = new THREE.Vector3(0, 0, 0);

    // Plot 1, z, z², … , zⁿ and join them into a spiral.
    const pts: THREE.Vector3[] = [new THREE.Vector3(1, 0, 0.02)];
    for (let k = 1; k <= n; k++) {
      const p = pow(z, k);
      pts.push(new THREE.Vector3(p.re, p.im, 0.02));
      const dot = this.dots[k - 1];
      if (dot) {
        dot.visible = true;
        dot.position.set(p.re, p.im, 0.06);
        (dot.material as THREE.MeshStandardMaterial).color.copy(heat((k - 1) / Math.max(1, n - 1)));
      }
    }
    this.chain.geometry.setFromPoints(pts);
    this.chain.visible = true;

    const result = pow(z, n);
    updateArrow(this.arrowResult, origin, new THREE.Vector3(result.re, result.im, 0));
    this.arrowResult.visible = true;
    rLabel.visible = true;
    rLabel.position.set(result.re + 0.3, result.im + 0.3, 0.1);

    const zp = toPolar(z);
    const detail =
      `<b>De Moivre's theorem:</b> if z = r(cosθ + i·sinθ) then zⁿ = rⁿ(cos&nbsp;nθ + i·sin&nbsp;nθ). ` +
      `Each power multiplies the length by |z| = ${zp.r.toFixed(2)} and adds the angle ${(zp.theta * DEG).toFixed(1)}°, ` +
      `so the dots spiral ${zp.r > 1 ? "outward" : zp.r < 1 ? "inward" : "around the unit circle"}. ` +
      `The green arrow is z<sup>${n}</sup>.`;
    return this.infoHtml(z, complex(0, 0), result, `z<sup>${n}</sup>`, detail,
      "Drag z onto the unit circle (|z| = 1). Now every power stays on the circle and only the angle marches round — pure rotation.",
      /*hideW*/ true) + derivationButton("complex-de-moivre");
  }

  private updateRoots(z: Complex): string {
    const n = this.params.power;
    const mag = modulus(z);
    const argZ = argument(z);
    const rootR = Math.pow(mag, 1 / n);
    const baseAngle = argZ / n; // angle of the principal (k = 0) root
    const step = (2 * Math.PI) / n; // 360°/n between neighbours

    // Circle the roots sit on.
    this.helperCircle.geometry.dispose();
    this.helperCircle.geometry = this.circleGeometry(rootR);
    this.helperCircle.visible = true;

    // Roots, their markers, and spokes from the origin.
    const poly: THREE.Vector3[] = [];
    const spokePts: THREE.Vector3[] = [];
    for (let k = 0; k < n; k++) {
      const theta = baseAngle + step * k;
      const x = rootR * Math.cos(theta);
      const y = rootR * Math.sin(theta);
      poly.push(new THREE.Vector3(x, y, 0.02));
      spokePts.push(new THREE.Vector3(0, 0, 0.01), new THREE.Vector3(x, y, 0.01));
      const dot = this.dots[k];
      if (dot) {
        dot.visible = true;
        dot.position.set(x, y, 0.06);
        // The principal root is highlighted green and enlarged: it is the "obvious"
        // root; every other root is just this one rotated by a multiple of 360°/n.
        const mat = dot.material as THREE.MeshStandardMaterial;
        if (k === 0) {
          mat.color.set(COLORS.result);
          dot.scale.setScalar(1.5);
        } else {
          mat.color.copy(heat(k / Math.max(1, n - 1)));
        }
      }
    }
    if (poly.length > 0) poly.push(poly[0].clone()); // close the n-gon
    this.chain.geometry.setFromPoints(poly);
    this.chain.visible = true;
    this.spokes.geometry.setFromPoints(spokePts);
    this.spokes.visible = true;

    // Angle arcs (same visual language as multiply/De Moivre): red = the principal
    // root's angle arg(z)/n; blue = the constant 360°/n step to the next root.
    const rArc = Math.min(0.9, rootR * 0.8);
    this.setArc(this.arcA, rArc, 0, baseAngle);
    this.setArc(this.arcB, rArc, baseAngle, baseAngle + step);

    const detail =
      `<b>A root undoes a power.</b> Squaring doubles the angle and squares the length, so an ` +
      `n-th root must <b>divide the angle by n</b> and take the n-th root of the length: ` +
      `each root has length |z|<sup>1/${n}</sup> = ${rootR.toFixed(2)} and the green "principal" root ` +
      `sits at arg(z)/${n} = ${(baseAngle * DEG).toFixed(1)}° (red arc).` +
      `<br><br><b>Why ${n} of them?</b> An angle wraps every 360°: arg(z) and arg(z)+360° are the same point. ` +
      `Adding a full turn <i>before</i> dividing by ${n} lands you somewhere new, and after ${n} turns you repeat. ` +
      `So the roots are the principal one rotated by ${(360 / n).toFixed(1)}° again and again (blue arc) — the ` +
      `vertices of a regular ${n}-gon, all the same distance from the origin.`;
    const zp = toPolar(z);
    return this.lessonHtml(`
      <p>The n-th roots of z are the ${n} numbers w with w<sup>${n}</sup> = z. Drag the white handle to move z and watch the polygon turn and resize.</p>
      <div class="readout">
        <div><span style="color:#ff7b72">z</span> = ${format(z)} &nbsp;|z| = ${mag.toFixed(2)} &nbsp;arg(z) = ${(zp.theta * DEG).toFixed(1)}°</div>
        <div><span style="color:#7ee787">${n} roots</span> &nbsp;length ${rootR.toFixed(2)} each &nbsp;spaced ${(360 / n).toFixed(1)}° apart</div>
      </div>
      ${derivationButton("complex-roots")}
      <p>${detail}</p>
      <p class="example"><b>Try it:</b> set z = 1 + 0i and n = 6 — the six <i>roots of unity</i> form a perfect hexagon on the unit circle, always including 1 itself. This periodic-angle idea is the seed of Fourier analysis and AC circuits.</p>
    `);
  }

  private infoHtml(
    z: Complex,
    w: Complex,
    result: Complex,
    opName: string,
    detail: string,
    tryIt: string,
    hideW = false,
  ): string {
    const zp = toPolar(z);
    const wp = toPolar(w);
    const rp = toPolar(result);
    const wRow = hideW
      ? ""
      : `<div><span style="color:#79c0ff">w</span> = ${format(w)} &nbsp;|w| = ${modulus(w).toFixed(2)} &nbsp;arg(w) = ${(wp.theta * DEG).toFixed(1)}°</div>`;
    return this.lessonHtml(`
      <div class="readout">
        <div><span style="color:#ff7b72">z</span> = ${format(z)} &nbsp;|z| = ${modulus(z).toFixed(2)} &nbsp;arg(z) = ${(zp.theta * DEG).toFixed(1)}°</div>
        ${wRow}
        <div><span style="color:#7ee787">${opName}</span> = ${format(result)} &nbsp;|R| = ${modulus(result).toFixed(2)} &nbsp;arg(R) = ${(rp.theta * DEG).toFixed(1)}°</div>
      </div>
      <p>${detail}</p>
      <p class="example"><b>Try it:</b> ${tryIt}</p>
    `);
  }

  private lessonHtml(body: string): string {
    const chapter = CHAPTERS[this.chapterIndex];
    const progress = ((this.chapterIndex + 1) / CHAPTERS.length) * 100;
    return `
      <h2>Complex Numbers</h2>
      <p class="complex-lead">You do not need to accept complex numbers as abstract symbol
      manipulation. Build one picture at a time; every rule below is movement on the plane.</p>
      <div class="course complex-path">
        <h3>Learn it step by step</h3>
        <div class="glsl-chips">
          ${CHAPTERS.map((entry, index) => `<button class="glsl-chip ${index === this.chapterIndex ? "active" : ""}" data-complex-chapter="${index}" aria-pressed="${index === this.chapterIndex}">${index + 1}. ${entry.title}</button>`).join("")}
        </div>
      </div>
      <div class="complex-progress">
        <div><b>${this.chapterIndex + 1}. ${chapter.title}</b><span>${this.chapterIndex + 1} of ${CHAPTERS.length}</span></div>
        <div class="complex-progress-track"><i style="width:${progress}%"></i></div>
      </div>
      <div class="complex-mental-model">
        <p><b>Big idea:</b> ${chapter.explanation}</p>
        <p><b>Do this:</b> ${chapter.action}</p>
      </div>
      ${body}
      ${this.quickCheckHtml(chapter)}
      <div class="course-nav complex-nav">
        <button class="course-btn ghost" data-complex-nav="previous" ${this.chapterIndex === 0 ? "disabled" : ""}>← Previous</button>
        <span class="course-progress">${this.chapterIndex + 1} / ${CHAPTERS.length}</span>
        <button class="course-btn" data-complex-nav="next" ${this.chapterIndex === CHAPTERS.length - 1 ? "disabled" : ""}>Next →</button>
      </div>
    `;
  }

  private getActiveScenario(): RealWorldScenario | undefined {
    return SCENARIOS.find((scenario) => scenario.id === this.params.scenarioId);
  }

  private scenarioHtml(active: RealWorldScenario): string {
    return `
      <section class="complex-scenarios" aria-labelledby="complex-scenarios-heading">
        <h3 id="complex-scenarios-heading">See it in the real world</h3>
        <p class="complex-scenario-intro">These arrows are scaled to fit the plane. Their angles carry the real-world timing or direction.</p>
        <div class="complex-scenario-options">
          ${SCENARIOS.map((scenario) => `
            <button class="complex-scenario ${scenario.id === active.id ? "active" : ""}" data-complex-scenario="${scenario.id}" aria-pressed="${scenario.id === active.id}">
              <span class="complex-scenario-icon" aria-hidden="true">${scenario.icon}</span>
              <span><b>${scenario.title}</b><small>${scenario.tag}</small></span>
            </button>`).join("")}
        </div>
        <div class="complex-scenario-detail">
          <div class="complex-scenario-visual ${active.visual}" aria-hidden="true">
            <i class="scenario-arrow scenario-a"></i><i class="scenario-arrow scenario-b"></i><i class="scenario-arrow scenario-result"></i>
            <span class="scenario-origin"></span>
          </div>
          <div>
            <b>${active.icon} ${active.title}</b>
            <p>${active.explanation}</p>
            <code>${active.equation}</code>
          </div>
        </div>
      </section>`;
  }

  private quickCheckHtml(chapter: ComplexChapter): string {
    return `
      <div class="course complex-check">
        <h3>Check your picture</h3>
        <p>${chapter.check.question}</p>
        <div class="complex-check-options">
          ${chapter.check.options.map((option, index) => `<button class="glsl-chip" data-complex-answer="${index}" aria-pressed="false">${option}</button>`).join("")}
        </div>
        <div id="complex-check-feedback" class="complex-check-feedback" aria-live="polite">
          Choose an answer. The explanation matters more than getting it right first time.
        </div>
      </div>`;
  }

  private bindCourseControls(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-complex-chapter]").forEach((button) => {
      button.addEventListener("click", () => this.selectChapter(Number(button.dataset.complexChapter)));
    });
    document.querySelectorAll<HTMLButtonElement>("[data-complex-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = button.dataset.complexNav === "previous" ? -1 : 1;
        this.selectChapter(this.chapterIndex + delta);
      });
    });
    document.querySelectorAll<HTMLButtonElement>("[data-complex-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const check = CHAPTERS[this.chapterIndex].check;
        const selected = Number(button.dataset.complexAnswer);
        const correct = selected === check.correct;
        document.querySelectorAll<HTMLButtonElement>("[data-complex-answer]").forEach((option, index) => {
          option.classList.toggle("correct", index === check.correct);
          option.classList.toggle("incorrect", index === selected && !correct);
          option.setAttribute("aria-pressed", String(index === selected));
        });
        const feedback = document.getElementById("complex-check-feedback");
        if (feedback) {
          feedback.className = `complex-check-feedback ${correct ? "success" : "retry"}`;
          feedback.innerHTML = `<b>${correct ? "Yes." : "Not yet."}</b> ${check.explanation}`;
        }
      });
    });
    document.querySelectorAll<HTMLButtonElement>("[data-complex-scenario]").forEach((button) => {
      button.addEventListener("click", () => this.selectScenario(button.dataset.complexScenario as ScenarioId));
    });
  }

  private selectChapter(index: number): void {
    if (index < 0 || index >= CHAPTERS.length) return;
    this.chapterIndex = index;
    const chapter = CHAPTERS[index];
    this.params.operation = chapter.operation;
    this.params.reA = chapter.preset.reA;
    this.params.imA = chapter.preset.imA;
    if (chapter.preset.reB !== undefined) this.params.reB = chapter.preset.reB;
    if (chapter.preset.imB !== undefined) this.params.imB = chapter.preset.imB;
    if (chapter.preset.power !== undefined) this.params.power = chapter.preset.power;
    this.params.scenarioId = chapter.preset.scenarioId ?? "";
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.syncControlState();
    this.update();
    document.querySelector(".complex-progress")?.scrollIntoView({ block: "nearest" });
  }

  private selectScenario(id: ScenarioId): void {
    const scenario = SCENARIOS.find((entry) => entry.id === id);
    if (!scenario) return;
    this.params.operation = "multiply";
    this.params.scenarioId = scenario.id;
    this.params.reA = scenario.reA;
    this.params.imA = scenario.imA;
    this.params.reB = scenario.reB;
    this.params.imB = scenario.imB;
    this.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    this.syncControlState();
    this.update();
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const disposeMaterial = (entry: THREE.Material): void => {
        const map = (entry as THREE.Material & { map?: THREE.Texture | null }).map;
        map?.dispose();
        entry.dispose();
      };
      if (Array.isArray(material)) material.forEach(disposeMaterial);
      else if (material) disposeMaterial(material);
    });
    group.clear();
  }
}
