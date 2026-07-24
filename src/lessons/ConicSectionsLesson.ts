import * as THREE from "three";
import type GUI from "lil-gui";
import { derivationButton } from "../core/FormulaDerivations";
import type { Lesson, LessonContext } from "../core/Lesson";
import { marker, segment, tip } from "./helpers";
import "./formulaDerivations/conicSections";

const COLORS = {
  curve: 0x79c0ff,
  focus: 0xff7b72,
  directrix: 0xffa657,
  cone: 0x8b949e,
  plane: 0x3fb950,
};

/**
 * Lesson: Conic Sections.
 *
 * Explore the four conic curves from the focus-directrix definition:
 * distance to focus = e × distance to directrix. Drag eccentricity to morph
 * from circle through ellipse, parabola and hyperbola.
 */
export class ConicSectionsLesson implements Lesson {
  readonly id = "conic-sections";
  readonly title = "Conic Sections";
  readonly blurb = "Slices of a cone";
  readonly category = "Shape" as const;
  readonly difficulty = "Advanced" as const;
  readonly prerequisites = ["geometry", "circle-theorems"] as const;

  private group = new THREE.Group();
  private curve!: THREE.Line;
  private directrix!: THREE.Line;
  private focus!: THREE.Mesh;
  private setInfo!: (html: string) => void;
  private gui!: GUI;

  private params = {
    eccentricity: 0.5,
    type: "ellipse" as "circle" | "ellipse" | "parabola" | "hyperbola",
    showDirectrix: true,
    showFocus: true,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(0, 0, 0),
    );

    this.buildAxes();
    this.curve = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: COLORS.curve, linewidth: 2 }),
    );
    this.group.add(this.curve);

    this.directrix = segment(new THREE.Vector3(0, -5, 0), new THREE.Vector3(0, 5, 0), COLORS.directrix);
    this.group.add(this.directrix);

    this.focus = marker(COLORS.focus, 0.14);
    this.focus.position.set(-1, 0, 0.1);
    this.group.add(this.focus);

    this.buildControls();
    this.update();
  }

  exit(): void {
    this.group.clear();
  }

  private buildAxes(): void {
    const axis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, 0, 0), new THREE.Vector3(6, 0, 0)]),
      new THREE.LineBasicMaterial({ color: 0x8b949e }),
    );
    this.group.add(axis);
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "type", ["circle", "ellipse", "parabola", "hyperbola"]).name("Conic type"), "Select a conic section").onChange((t: string) => {
      this.params.eccentricity =
        t === "circle" ? 0 : t === "ellipse" ? 0.5 : t === "parabola" ? 1 : 1.5;
      this.update();
    });
    tip(g.add(this.params, "eccentricity", 0, 2.5, 0.01).name("Eccentricity e"), "Ratio of distances to focus and directrix").onChange((e: number) => {
      this.params.type = e === 0 ? "circle" : e < 1 ? "ellipse" : e === 1 ? "parabola" : "hyperbola";
      this.update();
    });
    tip(g.add(this.params, "showDirectrix").name("Show directrix"), "Toggle the directrix line").onChange(() => this.update());
    tip(g.add(this.params, "showFocus").name("Show focus"), "Toggle the focus point").onChange(() => this.update());
  }

  private update(): void {
    const e = this.params.eccentricity;
    const d = 2; // distance from focus to directrix
    const focusX = 0;
    const directrixX = -d;

    this.focus.position.set(focusX, 0, 0.1);
    this.focus.visible = this.params.showFocus;
    this.directrix.visible = this.params.showDirectrix;
    this.directrix.geometry.setFromPoints([
      new THREE.Vector3(directrixX, -5, 0),
      new THREE.Vector3(directrixX, 5, 0),
    ]);

    const pts: THREE.Vector3[] = [];
    if (e < 1e-3) {
      // A circle is the limit e → 0. Its directrix sits infinitely far away, so the
      // focus-directrix construction degenerates; draw the circle about the focus and
      // hide the (infinitely distant) directrix.
      const radius = 2.2;
      this.directrix.visible = false;
      for (let i = 0; i <= 200; i++) {
        const t = (i / 200) * Math.PI * 2;
        pts.push(new THREE.Vector3(focusX + radius * Math.cos(t), radius * Math.sin(t), 0));
      }
    } else if (e < 1) {
      // Ellipse.
      const a = d * e / (1 - e * e);
      const b = a * Math.sqrt(Math.max(0, 1 - e * e));
      const c = e * a;
      const centreX = focusX - c;
      for (let i = 0; i <= 200; i++) {
        const t = (i / 200) * Math.PI * 2;
        pts.push(new THREE.Vector3(centreX + a * Math.cos(t), b * Math.sin(t), 0));
      }
    } else if (Math.abs(e - 1) < 1e-3) {
      // Parabola y² = 4p(x + p) with focus at (0,0) and directrix x = -2p, so p = d/2.
      const p = d / 2;
      for (let i = -100; i <= 100; i++) {
        const y = i * 0.06;
        const x = (y * y) / (4 * p) - p;
        pts.push(new THREE.Vector3(x, y, 0));
      }
    } else {
      // Hyperbola branch that wraps the focus.
      const a = d * e / (e * e - 1);
      const b = a * Math.sqrt(e * e - 1);
      const c = e * a;
      const centreX = focusX - c;
      for (let i = -100; i <= 100; i++) {
        const t = (i / 100) * 1.5;
        pts.push(new THREE.Vector3(centreX + a * Math.cosh(t), b * Math.sinh(t), 0));
      }
      for (let i = -100; i <= 100; i++) {
        const t = (i / 100) * 1.5;
        pts.push(new THREE.Vector3(centreX - a * Math.cosh(t), b * Math.sinh(t), 0));
      }
    }

    this.curve.geometry.setFromPoints(pts);

    let explanation = "";
    if (this.params.type === "circle") {
      explanation = "A circle is the special ellipse with eccentricity zero: every point is the same distance from the centre.";
    } else if (this.params.type === "ellipse") {
      explanation = "An ellipse has 0 < e < 1. The sum of distances from any point to the two foci is constant. Planets move in ellipses around the Sun.";
    } else if (this.params.type === "parabola") {
      explanation = "A parabola has e = 1. Projectile motion near Earth follows a parabola (ignoring air resistance).";
    } else {
      explanation = "A hyperbola has e > 1. It has two separate branches; comets on escape trajectories follow hyperbolas.";
    }

    this.setInfo(`
      <h2>Conic Sections</h2>
      <p>All four curves come from one rule: <b>distance to focus = e × distance to directrix</b> ${derivationButton("focus-directrix")}. The constant <b>e</b> is the eccentricity.</p>
      <div class="readout">
        <div>Eccentricity e = ${e.toFixed(2)}</div>
        <div>Type: <b>${this.params.type}</b></div>
      </div>
      <p>${explanation}</p>
      <p class="example"><b>Try it:</b> drag eccentricity smoothly from 0 to 1.5 and watch the ellipse become a parabola, then split into a hyperbola.</p>
    `);
  }
}
