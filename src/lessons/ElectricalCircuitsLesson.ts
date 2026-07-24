import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { curveXY, updateCurveXY, tip } from "./helpers";
import "./formulaDerivations/physics";

const COLORS = {
  wire: 0x8b949e,
  battery: 0x3fb950,
  resistor: 0xffa657,
  capacitor: 0x79c0ff,
  graph: 0xff7b72,
};

/**
 * Lesson: Electrical Circuits.
 *
 * A simple series RC circuit. Flip the switch to charge or discharge the capacitor
 * and watch the exponential voltage curve. The time constant τ = RC is shown
 * alongside the circuit diagram.
 */
export class ElectricalCircuitsLesson implements Lesson {
  readonly id = "electrical-circuits";
  readonly title = "Electrical Circuits";
  readonly blurb = "Ohm’s law, resistors and RC charging";
  readonly category = "Physics" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["differentiation", "logarithms"] as const;

  private group = new THREE.Group();
  private circuit!: THREE.Group;
  private markers = new THREE.Group();
  private curve!: THREE.Line;
  private capacitorLevel!: THREE.Mesh;
  private setInfo!: (html: string) => void;
  private gui!: GUI;

  private params = {
    voltage: 10,
    resistance: 1000,
    capacitance: 0.001,
    state: "charge" as "charge" | "discharge",
    t: 0,
    tauMarkers: true,
  };

  private readonly tMax = 6; // in units of tau

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(3, 1, 12),
      new THREE.Vector3(3, 0, 0),
    );

    this.buildCircuit();
    this.buildGraph();
    this.buildControls();
    this.update();
  }

  exit(): void {
    this.group.clear();
  }

  private buildCircuit(): void {
    this.circuit = new THREE.Group();

    const wireMat = new THREE.LineBasicMaterial({ color: COLORS.wire });
    const pts = [
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(6, 2, 0),
      new THREE.Vector3(6, -2, 0),
      new THREE.Vector3(0, -2, 0),
      new THREE.Vector3(0, 2, 0),
    ];
    const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat);
    this.circuit.add(wire);

    // Battery on left.
    const battery = new THREE.Group();
    const b1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.3, 1.5, 0), new THREE.Vector3(-0.3, -1.5, 0)]),
      new THREE.LineBasicMaterial({ color: COLORS.battery, linewidth: 2 }),
    );
    const b2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.3, 0.8, 0), new THREE.Vector3(0.3, -0.8, 0)]),
      new THREE.LineBasicMaterial({ color: COLORS.battery, linewidth: 2 }),
    );
    battery.add(b1, b2);
    battery.position.set(0, 0, 0);
    this.circuit.add(battery);

    // Resistor on top.
    const resistor = new THREE.Group();
    const zigzag: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const x = 1.5 + i * 0.3;
      const y = i % 2 === 0 ? 2 : 2.4;
      zigzag.push(new THREE.Vector3(x, y, 0));
    }
    resistor.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(zigzag), new THREE.LineBasicMaterial({ color: COLORS.resistor })));
    resistor.position.set(0, 0, 0);
    this.circuit.add(resistor);

    // Capacitor on right.
    const capacitor = new THREE.Group();
    const c1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(6, 0.8, 0), new THREE.Vector3(6, -0.8, 0)]),
      new THREE.LineBasicMaterial({ color: COLORS.capacitor, linewidth: 2 }),
    );
    const c2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(6.3, 0.8, 0), new THREE.Vector3(6.3, -0.8, 0)]),
      new THREE.LineBasicMaterial({ color: COLORS.capacitor, linewidth: 2 }),
    );
    capacitor.add(c1, c2);
    this.circuit.add(capacitor);

    // Charge level bar inside capacitor.
    this.capacitorLevel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x7ee787 }),
    );
    this.capacitorLevel.position.set(6.15, -0.7, 0.05);
    this.circuit.add(this.capacitorLevel);

    this.group.add(this.circuit);
    this.group.add(this.markers);
  }

  private buildGraph(): void {
    const axes = new THREE.Group();
    const xAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -4, 0), new THREE.Vector3(8, -4, 0)]),
      new THREE.LineBasicMaterial({ color: 0x8b949e }),
    );
    const yAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -4, 0), new THREE.Vector3(0, -1.5, 0)]),
      new THREE.LineBasicMaterial({ color: 0x8b949e }),
    );
    axes.add(xAxis, yAxis);
    this.group.add(axes);

    this.curve = curveXY(() => 0, 0, this.tMax, 200, COLORS.graph);
    this.curve.position.y = -4;
    this.group.add(this.curve);
  }

  private buildControls(): void {
    const g = this.gui;
    tip(g.add(this.params, "voltage", 1, 20, 0.5).name("Battery V"), "Voltage supplied by the battery").onChange(() => this.update());
    tip(g.add(this.params, "resistance", 100, 5000, 100).name("Resistance R"), "Resistance in ohms").onChange(() => this.update());
    tip(g.add(this.params, "capacitance", 0.0001, 0.01, 0.0001).name("Capacitance C"), "Capacitance in farads").onChange(() => this.update());
    tip(g.add(this.params, "state", ["charge", "discharge"]).name("Switch"), "Charge from the battery or discharge through the resistor").onChange(() => this.update());
    tip(g.add(this.params, "t", 0, this.tMax, 0.01).name("Time (τ)"), "Scrub through time in units of the time constant τ = RC").onChange(() => this.update());
    tip(g.add(this.params, "tauMarkers").name("Show τ markers"), "Mark one, two and three time constants on the graph").onChange(() => this.update());
  }

  private update(): void {
    const { voltage, resistance, capacitance, state, t, tauMarkers } = this.params;
    const tau = resistance * capacitance;
    const vc = state === "charge" ? voltage * (1 - Math.exp(-t)) : voltage * Math.exp(-t);
    const current = state === "charge"
      ? (voltage / resistance) * Math.exp(-t)
      : -(voltage / resistance) * Math.exp(-t);

    // Update capacitor charge bar.
    const level = Math.max(0, Math.min(1, vc / voltage));
    this.capacitorLevel.scale.y = level;

    // Update graph.
    const f = (tt: number) => {
      const val = state === "charge" ? voltage * (1 - Math.exp(-tt)) : voltage * Math.exp(-tt);
      return val * (2 / voltage); // scale to fit graph height
    };
    updateCurveXY(this.curve, f, 0, this.tMax, 200);

    // Tau markers.
    this.markers.clear();
    if (tauMarkers) {
      for (let k = 1; k <= 3; k++) {
        const mk = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff }),
        );
        mk.position.set((this.tMax * k) / 6, f(k) - 4, 0.1);
        this.markers.add(mk);
      }
    }

    this.setInfo(`
      <h2>Electrical Circuits</h2>
      <p>A resistor and capacitor in series obey <b>Ohm's law</b> and the capacitor equation Q = CV. The result is an exponential curve governed by the <b>time constant τ = RC</b>.</p>
      <div class="formula" data-derivation="rc-response">
        <div class="formula-label">RC response</div>
        <div class="formula-body">τ = RC&nbsp;&nbsp;·&nbsp;&nbsp;V<sub>C,charge</sub> = V(1 − e<sup>−t/RC</sup>)&nbsp;&nbsp;·&nbsp;&nbsp;V<sub>C,discharge</sub> = V₀e<sup>−t/RC</sup></div>
      </div>
      <div class="readout">
        <div>V<sub>battery</sub> = ${voltage.toFixed(1)} V</div>
        <div>R = ${resistance.toFixed(0)} Ω, C = ${(capacitance * 1000).toFixed(2)} mF</div>
        <div>τ = RC = ${tau.toFixed(3)} s</div>
        <div>V<sub>capacitor</sub> = ${vc.toFixed(2)} V</div>
        <div>I = ${current.toFixed(4)} A</div>
      </div>
      <p>After one τ the capacitor is about 63% charged (or 37% discharged). After 5τ it is effectively fully charged/discharged.</p>
      <p class="example"><b>Try it:</b> increase R or C and watch the curve stretch — bigger τ means a slower circuit.</p>
    `);
  }
}
