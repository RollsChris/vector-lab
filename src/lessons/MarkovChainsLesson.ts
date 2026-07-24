import * as THREE from "three";
import type GUI from "lil-gui";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import {
  forecastDistribution,
  isAbsorbingState,
  stationaryDistribution,
  type TransitionMatrix,
} from "../math/markov";
import { textSprite, tip } from "./helpers";
import { MARKOV_DERIVATIONS } from "./formulaDerivations/foundations";

registerFormulaDerivations("markov-chains", MARKOV_DERIVATIONS);

type ScenarioId = "weather" | "factory" | "customers";

interface Scenario {
  label: string;
  states: readonly [string, string, string];
  shortStates: readonly [string, string, string];
  matrix: TransitionMatrix;
  application: string;
}

const SCENARIOS: Record<ScenarioId, Scenario> = {
  weather: {
    label: "Weather",
    states: ["Sunny", "Cloudy", "Rainy"],
    shortStates: ["Sun", "Cloud", "Rain"],
    matrix: [
      [0.70, 0.20, 0.10],
      [0.30, 0.40, 0.30],
      [0.20, 0.30, 0.50],
    ],
    application: "A simple forecast uses today's weather state to estimate tomorrow and the days after it.",
  },
  factory: {
    label: "Factory condition",
    states: ["Running", "Degraded", "Stopped"],
    shortStates: ["Run", "Degraded", "Stop"],
    matrix: [
      [0.82, 0.14, 0.04],
      [0.35, 0.50, 0.15],
      [0.45, 0.10, 0.45],
    ],
    application: "Reliability teams estimate future machine condition, downtime risk, and maintenance demand.",
  },
  customers: {
    label: "Customer retention",
    states: ["Active", "At risk", "Churned"],
    shortStates: ["Active", "Risk", "Churn"],
    matrix: [
      [0.82, 0.13, 0.05],
      [0.25, 0.45, 0.30],
      [0, 0, 1],
    ],
    application: "Retention models estimate how customers move between healthy, risky, and churned states.",
  },
};

const COLORS = [0xffd166, 0x79c0ff, 0xff7b72] as const;
const POSITIONS = [
  new THREE.Vector3(-3.4, 1.5, 0),
  new THREE.Vector3(3.4, 1.5, 0),
  new THREE.Vector3(0, -1.5, 0),
] as const;

export class MarkovChainsLesson implements Lesson {
  readonly id = "markov-chains";
  readonly title = "Markov Chains";
  readonly blurb = "State transitions, forecasts and long-run behaviour";
  readonly category = "Foundations" as const;
  readonly difficulty = "Applied" as const;
  readonly prerequisites = ["probability"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private gui!: GUI;
  private params = {
    scenario: "weather" as ScenarioId,
    startState: 1,
    forecastSteps: 3,
    pathLength: 10,
    seed: 7,
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.gui = ctx.gui;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.4, 12), new THREE.Vector3(0, 0, 0));
    this.buildControls();
    this.refresh();
  }

  exit(): void {
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private get scenario(): Scenario {
    return SCENARIOS[this.params.scenario];
  }

  private buildControls(): void {
    tip(
      this.gui.add(this.params, "scenario", {
        Weather: "weather",
        "Factory condition": "factory",
        "Customer retention": "customers",
      }).name("Application"),
      "Switch between three real uses of the same Markov-chain mathematics.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "startState", 1, 3, 1).name("Starting state"),
      "Choose state 1, 2, or 3 as the certain starting point.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "forecastSteps", 1, 20, 1).name("Forecast steps"),
      "Apply the transition matrix repeatedly to look further ahead.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "pathLength", 3, 20, 1).name("Sample path"),
      "Choose how many random transitions to show along the bottom.",
    ).onChange(() => this.refresh());
    tip(
      this.gui.add(this.params, "seed", 1, 100, 1).name("Random seed"),
      "Change the example path while keeping it reproducible.",
    ).onChange(() => this.refresh());
  }

  private refresh(): void {
    this.params.startState = Math.round(this.params.startState);
    this.params.forecastSteps = Math.round(this.params.forecastSteps);
    this.params.pathLength = Math.round(this.params.pathLength);
    this.params.seed = Math.round(this.params.seed);
    this.disposeGroup();

    const initial = [0, 0, 0];
    initial[this.params.startState - 1] = 1;
    const forecast = forecastDistribution(initial, this.scenario.matrix, this.params.forecastSteps);
    const steady = stationaryDistribution(this.scenario.matrix);
    const path = this.samplePath(this.params.startState - 1);

    this.drawChain(forecast);
    this.drawPath(path);
    this.renderPanel(initial, forecast, steady, path);
  }

  private drawChain(forecast: readonly number[]): void {
    const { matrix, states } = this.scenario;
    for (let source = 0; source < states.length; source++) {
      for (let target = 0; target < states.length; target++) {
        if (source === target) {
          this.drawSelfTransition(source, matrix[source][target]);
        } else if (matrix[source][target] > 0) {
          this.drawTransition(source, target, matrix[source][target]);
        }
      }
    }

    for (let state = 0; state < states.length; state++) {
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.73, 0.78 + forecast[state] * 0.35, 48),
        new THREE.MeshBasicMaterial({
          color: COLORS[state],
          transparent: true,
          opacity: 0.35 + forecast[state] * 0.55,
          side: THREE.DoubleSide,
        }),
      );
      halo.position.copy(POSITIONS[state]);
      halo.position.z = -0.02;
      this.group.add(halo);

      const node = new THREE.Mesh(
        new THREE.CircleGeometry(0.68, 48),
        new THREE.MeshStandardMaterial({ color: COLORS[state], roughness: 0.65 }),
      );
      node.position.copy(POSITIONS[state]);
      this.group.add(node);

      const label = textSprite(states[state], 0xffffff, 0.42);
      label.position.copy(POSITIONS[state]).add(new THREE.Vector3(0, 0.08, 0.12));
      this.group.add(label);

      const probability = textSprite(
        `${this.params.forecastSteps}-step: ${this.percent(forecast[state])}`,
        COLORS[state],
        0.30,
      );
      probability.position.copy(POSITIONS[state]).add(new THREE.Vector3(0, -0.88, 0.1));
      this.group.add(probability);
    }
  }

  private drawTransition(source: number, target: number, probability: number): void {
    const direction = POSITIONS[target].clone().sub(POSITIONS[source]).normalize();
    const normal = new THREE.Vector3(-direction.y, direction.x, 0).multiplyScalar(0.18);
    const start = POSITIONS[source].clone().addScaledVector(direction, 0.78).add(normal);
    const end = POSITIONS[target].clone().addScaledVector(direction, -0.88).add(normal);
    const length = end.distanceTo(start);
    const arrow = new THREE.ArrowHelper(
      direction,
      start,
      length,
      COLORS[source],
      0.28,
      0.18,
    );
    this.group.add(arrow);

    const label = textSprite(this.percent(probability), COLORS[source], 0.27);
    label.position.copy(start).lerp(end, 0.5).addScaledVector(normal, 1.4);
    label.position.z = 0.12;
    this.group.add(label);
  }

  private drawSelfTransition(state: number, probability: number): void {
    const points: THREE.Vector3[] = [];
    for (let point = 0; point < 40; point++) {
      const angle = (point / 40) * Math.PI * 2;
      points.push(new THREE.Vector3(
        POSITIONS[state].x + Math.cos(angle) * 0.42,
        POSITIONS[state].y + 0.82 + Math.sin(angle) * 0.30,
        0,
      ));
    }
    const loop = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: COLORS[state] }),
    );
    this.group.add(loop);
    const label = textSprite(this.percent(probability), COLORS[state], 0.27);
    label.position.set(POSITIONS[state].x, POSITIONS[state].y + 1.25, 0.1);
    this.group.add(label);
  }

  private drawPath(path: readonly number[]): void {
    const width = 8.8;
    const spacing = width / Math.max(path.length - 1, 1);
    const startX = -width / 2;
    const y = -3.35;

    for (let index = 0; index < path.length; index++) {
      const x = startX + index * spacing;
      if (index > 0) {
        const previousX = startX + (index - 1) * spacing;
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(previousX, y, -0.05),
            new THREE.Vector3(x, y, -0.05),
          ]),
          new THREE.LineBasicMaterial({ color: 0x6e7681 }),
        );
        this.group.add(line);
      }
      const marker = new THREE.Mesh(
        new THREE.CircleGeometry(Math.min(0.20, spacing * 0.28), 24),
        new THREE.MeshBasicMaterial({ color: COLORS[path[index]] }),
      );
      marker.position.set(x, y, 0);
      this.group.add(marker);
    }

    const pathLabel = textSprite(
      `One possible path: ${path.map((state) => this.scenario.shortStates[state]).join(" → ")}`,
      0xc9d1d9,
      0.30,
    );
    pathLabel.position.set(0, -3.85, 0.1);
    this.group.add(pathLabel);
  }

  private samplePath(start: number): number[] {
    const path = [start];
    let state = start;
    let seed = this.params.seed;
    const random = (): number => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let step = 0; step < this.params.pathLength; step++) {
      const draw = random();
      let cumulative = 0;
      for (let target = 0; target < this.scenario.matrix.length; target++) {
        cumulative += this.scenario.matrix[state][target];
        if (draw <= cumulative) {
          state = target;
          break;
        }
      }
      path.push(state);
    }
    return path;
  }

  private renderPanel(
    initial: readonly number[],
    forecast: readonly number[],
    steady: readonly number[],
    path: readonly number[],
  ): void {
    const { states, matrix, application } = this.scenario;
    const start = this.params.startState - 1;
    const absorbing = states
      .map((state, index) => isAbsorbingState(matrix, index) ? state : "")
      .filter(Boolean);

    this.setInfo(`
      <h2>Markov Chains</h2>
      <p>A <b>Markov chain</b> models a system that jumps between a finite set of states.
      The next state is uncertain, but its probabilities depend only on the current state.
      That simplifying rule is the <b>Markov property</b>: once the present is known, the
      model does not separately remember the full path used to reach it.</p>

      <h3>1. States and transitions</h3>
      <p>This ${SCENARIOS[this.params.scenario].label.toLowerCase()} model has three states:
      <b>${states.join(", ")}</b>. Each arrow is a possible one-step transition. A loop means
      the system can remain in the same state. Every state's outgoing probabilities must add
      to 100% because something must happen next.</p>
      <div class="readout">
        <div><span>Current certain state</span><b>${states[start]}</b></div>
        <div><span>One-step probabilities</span><b>${matrix[start].map((value) => this.percent(value)).join(" · ")}</b></div>
        <div><span>Row total</span><b>${this.percent(matrix[start].reduce((sum, value) => sum + value, 0))}</b></div>
      </div>

      <h3>2. Store the rules in a transition matrix</h3>
      <p>Entry <code>Pᵢⱼ</code> is the probability of moving from row-state <code>i</code>
      to column-state <code>j</code> in one step.</p>
      <table class="cmp-table">
        <thead><tr><th>From \\ To</th>${states.map((state) => `<th>${state}</th>`).join("")}</tr></thead>
        <tbody>${matrix.map((row, index) => `
          <tr><td>${states[index]}</td>${row.map((value) => `<td>${this.percent(value)}</td>`).join("")}</tr>
        `).join("")}</tbody>
      </table>

      <h3>3. Forecast several steps</h3>
      <p>Write today's probabilities as a row vector <code>p₀</code>. One step later,
      <code>p₁ = p₀P</code>; after <code>n</code> steps, <code>pₙ = p₀Pⁿ</code>.
      Matrix powers therefore combine every possible route, not just the single sample path
      drawn across the bottom of the stage.</p>
      ${derivationButton("markov-forecast")}
      <div class="readout">
        <div><span>Initial p₀</span><b>[${initial.map((value) => value.toFixed(0)).join(", ")}]</b></div>
        ${states.map((state, index) => `<div><span>P(${state}) after ${this.params.forecastSteps} steps</span><b>${this.percent(forecast[index])}</b></div>`).join("")}
        <div><span>Displayed sample path</span><b>${path.length - 1} random transitions</b></div>
      </div>

      <h3>4. Long-run behaviour</h3>
      <p>A <b>stationary distribution</b> satisfies <code>πP = π</code>: one more transition
      leaves the overall proportions unchanged. In a well-mixing chain, forecasts from
      different starting states approach the same long-run balance.</p>
      <div class="readout">
        ${states.map((state, index) => `<div><span>Long-run ${state}</span><b>${this.percent(steady[index])}</b></div>`).join("")}
      </div>
      ${absorbing.length > 0
        ? `<p><b>${absorbing.join(", ")}</b> ${absorbing.length === 1 ? "is an absorbing state" : "are absorbing states"}:
        after entering it, the chain cannot leave. The long-run result shows how an absorbing
        outcome can eventually dominate.</p>`
        : `<p>This chain has no absorbing state: every state still has a route back into the
        rest of the system. Its repeated transitions settle toward a shared balance instead.</p>`}

      <h3>5. Discovery and development</h3>
      <p>Russian mathematician <b>Andrey Markov</b> introduced these dependent probability
      chains in 1906. To demonstrate that useful probability theory did not require independent
      events, he counted patterns of vowels and consonants in Pushkin's <i>Eugene Onegin</i>.
      Later work developed continuous-time chains, hidden Markov models, and modern Monte Carlo
      methods.</p>

      <h3>Applications</h3>
      <p><b>In this preset:</b> ${application}</p>
      <ul>
        <li><b>Search:</b> PageRank treats web browsing as transitions between linked pages.</li>
        <li><b>Engineering:</b> reliability models track healthy, degraded, failed, and repaired equipment.</li>
        <li><b>Operations:</b> queues model arrivals, waiting, service, and capacity.</li>
        <li><b>Biology and language:</b> chains model genetic changes, sequences, speech, and text.</li>
      </ul>

      <h3>When the basic model is not enough</h3>
      <p>The memoryless assumption is useful, not automatically true. If failure risk depends on
      how long a machine has been degraded, use a <b>semi-Markov</b> or survival model. If the real
      state cannot be observed directly, use a <b>hidden Markov model</b>. Transition probabilities
      may also need to change over time instead of remaining constant.</p>
      <p class="example"><b>Try it:</b> start with Weather and increase the forecast horizon.
      Then choose Customer retention: Churned has a 100% self-loop, so it is absorbing. Finally,
      compare the deterministic probability forecast with several seeded sample paths.</p>
    `);
  }

  private percent(value: number): string {
    return `${(value * 100).toFixed(value * 100 % 1 === 0 ? 0 : 1)}%`;
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else if (material) {
        (material as THREE.SpriteMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.group.clear();
  }
}
