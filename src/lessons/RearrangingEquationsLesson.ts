import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import { derivationButton, registerFormulaDerivations } from "../core/FormulaDerivations";
import { REARRANGING_DERIVATIONS } from "./formulaDerivations/foundations";
import { segment, textSprite, tip } from "./helpers";

registerFormulaDerivations("rearranging-equations", REARRANGING_DERIVATIONS);

/** A linear equation  Lx·x + Lc = Rx·x + Rc  as four coefficients. */
interface EqState {
  Lx: number;
  Lc: number;
  Rx: number;
  Rc: number;
}

interface Preset {
  label: string; // how it's written to the learner (may use brackets)
  eq: EqState; // the expanded form the engine works with
}

const PRESETS: Preset[] = [
  { label: "2x + 3 = 11", eq: { Lx: 2, Lc: 3, Rx: 0, Rc: 11 } },
  { label: "5x − 4 = 2x + 8", eq: { Lx: 5, Lc: -4, Rx: 2, Rc: 8 } },
  { label: "7 − 2x = x + 1", eq: { Lx: -2, Lc: 7, Rx: 1, Rc: 1 } },
  { label: "3(x + 2) = 15", eq: { Lx: 3, Lc: 6, Rx: 0, Rc: 15 } },
  { label: "½x + 1 = 4", eq: { Lx: 0.5, Lc: 1, Rx: 0, Rc: 4 } },
  { label: "4x + 1 = 2x + 9", eq: { Lx: 4, Lc: 1, Rx: 2, Rc: 9 } },
  { label: "x/3 + 2 = 5", eq: { Lx: 1 / 3, Lc: 2, Rx: 0, Rc: 5 } },
  { label: "4 − 3x = 19", eq: { Lx: -3, Lc: 4, Rx: 0, Rc: 19 } },
  { label: "2(x − 3) + 4 = 3x − 1", eq: { Lx: 2, Lc: -2, Rx: 3, Rc: -1 } },
];

const COL_XBLOCK_POS = 0x58a6ff;
const COL_XBLOCK_NEG = 0xff7b72;
const COL_UNIT_POS = 0x7ee787;
const COL_UNIT_NEG = 0xffa657;

/** A falling "same thing to both sides" token being animated onto a pan. */
interface Token {
  sprite: THREE.Sprite;
  x: number;
  t: number;
  dur: number;
}

/**
 * Lesson 4 — Rearranging Equations ("solving for x").
 *
 * The one idea behind every equation solve: an equation is a balance. Whatever you do
 * to one side you must do to the other, and it stays level. Here the equation sits on a
 * physical beam; each guided move drops an identical token onto *both* pans (the beam
 * dips equally — never tilts — to show equality is preserved) and simplifies the two
 * sides until x is left standing alone. A recommended next step is always highlighted,
 * so the learner builds the habit of the canonical route: collect the x's, move the
 * numbers, then divide.
 */
export class RearrangingEquationsLesson implements Lesson {
  readonly id = "rearranging-equations";
  readonly title = "4 · Rearranging Equations";
  readonly blurb = "Solve for x on a balance scale";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["order-of-operations"] as const;

  private setInfo!: (html: string) => void;
  private stopTick?: () => void;

  private group = new THREE.Group();
  private beam = new THREE.Group(); // tilts/dips with the "weight"
  private dynamic = new THREE.Group(); // rebuilt on every state change
  private tokens: Token[] = [];
  private settleT = Infinity; // time since last move, drives the beam bob

  private presetIndex = 0;
  private state: EqState = { ...PRESETS[0].eq };
  private history: EqState[] = [];

  private readonly params = {
    showBlocks: true,
    animate: true,
  };

  private readonly panX = 4.2;

  private infoClickHandler = (event: Event): void => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-move]");
    if (!btn) return;
    this.applyMove(btn.dataset.move as MoveKey);
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    ctx.viewport.world.add(this.group);
    this.group.add(this.beam);
    this.beam.add(this.dynamic);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(
      new THREE.Vector3(0, 3.2, 18),
      new THREE.Vector3(0, 0.6, 0),
    );

    this.buildStatic();

    tip(
      ctx.gui.add(this.params, "showBlocks").name("Show blocks"),
      "Draw x-blocks and unit-blocks on the pans (integer amounts only).",
    ).onChange(() => this.rebuild());
    tip(
      ctx.gui.add(this.params, "animate").name("Animate moves"),
      "Drop tokens onto both pans and bob the beam when a move is applied.",
    );

    document.getElementById("info")?.addEventListener("click", this.infoClickHandler);

    this.reset();
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    document.getElementById("info")?.removeEventListener("click", this.infoClickHandler);
    this.disposeGroup(this.group);
    this.group = new THREE.Group();
    this.beam = new THREE.Group();
    this.dynamic = new THREE.Group();
    this.tokens = [];
  }

  // ---- static scene (fulcrum, beam bar, pans, strings) -------------------

  private buildStatic(): void {
    // Fulcrum: a triangle prism apex under the beam centre.
    const fulcrum = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 1.6, 4),
      new THREE.MeshStandardMaterial({ color: 0x8b949e, metalness: 0.2, roughness: 0.7 }),
    );
    fulcrum.rotation.y = Math.PI / 4;
    fulcrum.position.set(0, -0.8, 0);
    this.group.add(fulcrum);

    // Beam bar.
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(2 * this.panX + 1.2, 0.22, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xc9d1d9, metalness: 0.3, roughness: 0.5 }),
    );
    this.beam.add(bar);

    // Pivot cap.
    const pivot = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.3 }),
    );
    this.beam.add(pivot);

    for (const sx of [-this.panX, this.panX]) {
      // Two hanger strings.
      this.beam.add(segment(new THREE.Vector3(sx - 0.7, 0, 0), new THREE.Vector3(sx - 0.7, -0.9, 0), 0x6e7681));
      this.beam.add(segment(new THREE.Vector3(sx + 0.7, 0, 0), new THREE.Vector3(sx + 0.7, -0.9, 0), 0x6e7681));
      // Pan.
      const pan = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 0.12, 32),
        new THREE.MeshStandardMaterial({ color: 0x30363d, metalness: 0.3, roughness: 0.6 }),
      );
      pan.position.set(sx, -0.95, 0);
      this.beam.add(pan);
    }
  }

  // ---- state transitions -------------------------------------------------

  private reset(): void {
    this.state = { ...PRESETS[this.presetIndex].eq };
    this.history = [];
    this.tokens.forEach((t) => this.disposeObject(t.sprite));
    this.tokens = [];
    this.settleT = Infinity;
    this.rebuild();
  }

  private applyMove(key: MoveKey): void {
    if (key === "reset") return this.reset();
    if (key === "undo") {
      const prev = this.history.pop();
      if (prev) {
        this.state = prev;
        this.rebuild();
      }
      return;
    }
    const preset = key.startsWith("preset:");
    if (preset) {
      this.presetIndex = Number(key.slice(7));
      return this.reset();
    }

    const move = this.moveFor(key);
    if (!move) return;
    this.history.push({ ...this.state });
    move.apply(this.state);
    this.roundState();
    if (this.params.animate) this.spawnTokens(move.token, move.color);
    this.settleT = 0;
    this.rebuild();
  }

  /** Snap values that are within a whisker of an integer (kills float drift like 3.9999). */
  private roundState(): void {
    const snap = (n: number) => (Math.abs(n - Math.round(n)) < 1e-9 ? Math.round(n) : n);
    this.state.Lx = snap(this.state.Lx);
    this.state.Lc = snap(this.state.Lc);
    this.state.Rx = snap(this.state.Rx);
    this.state.Rc = snap(this.state.Rc);
  }

  // ---- move definitions --------------------------------------------------

  private moveFor(key: MoveKey): { apply: (s: EqState) => void; token: string; color: number } | undefined {
    const s = this.state;
    // Snapshot the operands now: the closures mutate the same state object, so we must not
    // read s.* again from inside them (later reads would see already-updated values).
    const lc = s.Lc, rc = s.Rc, lx = s.Lx, rx = s.Rx;
    switch (key) {
      case "zeroLc":
        return { apply: (e) => { e.Lc -= lc; e.Rc -= lc; }, token: `${lc < 0 ? "+" : "−"} ${fmt(Math.abs(lc))}`, color: COL_UNIT_POS };
      case "zeroRc":
        return { apply: (e) => { e.Lc -= rc; e.Rc -= rc; }, token: `${rc < 0 ? "+" : "−"} ${fmt(Math.abs(rc))}`, color: COL_UNIT_POS };
      case "zeroLx":
        return { apply: (e) => { e.Lx -= lx; e.Rx -= lx; }, token: `${lx < 0 ? "+" : "−"} ${fmt(Math.abs(lx))}x`, color: COL_XBLOCK_POS };
      case "zeroRx":
        return { apply: (e) => { e.Lx -= rx; e.Rx -= rx; }, token: `${rx < 0 ? "+" : "−"} ${fmt(Math.abs(rx))}x`, color: COL_XBLOCK_POS };
      case "divLx":
        return { apply: (e) => { e.Lx /= lx; e.Lc /= lx; e.Rx /= lx; e.Rc /= lx; }, token: `÷ ${fmt(lx)}`, color: 0xd2a8ff };
      case "divRx":
        return { apply: (e) => { e.Lx /= rx; e.Lc /= rx; e.Rx /= rx; e.Rc /= rx; }, token: `÷ ${fmt(rx)}`, color: 0xd2a8ff };
      default:
        return undefined;
    }
  }

  /** Which moves are worth offering right now, in a sensible order. */
  private availableMoves(): { key: MoveKey; label: string }[] {
    const s = this.state;
    const out: { key: MoveKey; label: string }[] = [];
    if (s.Rx !== 0) out.push({ key: "zeroRx", label: `${verb(-s.Rx)} ${fmt(Math.abs(s.Rx))}x on both sides` });
    if (s.Lx !== 0 && s.Rx !== 0) out.push({ key: "zeroLx", label: `${verb(-s.Lx)} ${fmt(Math.abs(s.Lx))}x on both sides` });
    if (s.Lc !== 0) out.push({ key: "zeroLc", label: `${verb(-s.Lc)} ${fmt(Math.abs(s.Lc))} on both sides` });
    if (s.Rc !== 0) out.push({ key: "zeroRc", label: `${verb(-s.Rc)} ${fmt(Math.abs(s.Rc))} on both sides` });
    if (s.Rx === 0 && s.Lc === 0 && s.Lx !== 0 && s.Lx !== 1)
      out.push({ key: "divLx", label: `Divide both sides by ${fmt(s.Lx)}` });
    if (s.Lx === 0 && s.Rc === 0 && s.Rx !== 0 && s.Rx !== 1)
      out.push({ key: "divRx", label: `Divide both sides by ${fmt(s.Rx)}` });
    return out;
  }

  /** The canonical next step: collect x on the left, clear its constant, then divide. */
  private hint(): MoveKey | null {
    const s = this.state;
    if (this.isSolved()) return null;
    if (s.Rx !== 0) return "zeroRx";
    if (s.Lc !== 0) return "zeroLc";
    if (s.Lx !== 1 && s.Lx !== 0) return "divLx";
    return null;
  }

  private isSolved(): boolean {
    const s = this.state;
    return (s.Rx === 0 && s.Lc === 0 && s.Lx === 1) || (s.Lx === 0 && s.Rc === 0 && s.Rx === 1);
  }

  private solutionValue(): number {
    const s = this.state;
    return s.Lx === 1 ? s.Rc : s.Lc;
  }

  private noSolutionState(): "none" | "infinite" | null {
    const s = this.state;
    if (s.Lx === s.Rx) {
      if (s.Lx === s.Rx && s.Lc === s.Rc) return "infinite";
      if (s.Lx === s.Rx && s.Lc !== s.Rc) return "none";
    }
    return null;
  }

  // ---- 3D rebuild --------------------------------------------------------

  private rebuild(): void {
    this.disposeChildren(this.dynamic);

    const s = this.state;
    const solved = this.isSolved();

    // Centre equation banner.
    const eqSprite = textSprite(`${sideStr(s.Lx, s.Lc)}   =   ${sideStr(s.Rx, s.Rc)}`, 0xffffff, 0.7);
    eqSprite.position.set(0, 4.2, 0);
    this.dynamic.add(eqSprite);

    const eqSign = textSprite("=", 0x8b949e, 0.6);
    eqSign.position.set(0, 1.7, 0);
    this.dynamic.add(eqSign);

    // Each side: expression on the pan + optional blocks.
    this.buildSide(-this.panX, s.Lx, s.Lc);
    this.buildSide(this.panX, s.Rx, s.Rc);

    if (solved) {
      const banner = textSprite(`x = ${fmt(this.solutionValue())}`, 0x7ee787, 0.85);
      banner.position.set(0, 3.0, 0);
      this.dynamic.add(banner);
    }

    this.renderPanel();
  }

  private buildSide(x: number, coeff: number, constant: number): void {
    const g = new THREE.Group();
    g.position.set(x, -0.9, 0);

    const expr = textSprite(sideStr(coeff, constant), 0xffd166, 0.6);
    expr.position.set(0, 3.0, 0);
    g.add(expr);

    if (this.params.showBlocks) {
      this.stackBlocks(g, -0.55, coeff, 0.5, COL_XBLOCK_POS, COL_XBLOCK_NEG, true);
      this.stackBlocks(g, 0.55, constant, 0.34, COL_UNIT_POS, COL_UNIT_NEG, false);
    }

    this.dynamic.add(g);
  }

  /** Stack |value| cubes upward at local xOff (skips non-integer / oversized amounts). */
  private stackBlocks(
    parent: THREE.Group,
    xOff: number,
    value: number,
    size: number,
    posColor: number,
    negColor: number,
    isX: boolean,
  ): void {
    if (value === 0 || !Number.isInteger(value)) return;
    const n = Math.abs(value);
    if (n > (isX ? 12 : 24)) return;
    const color = value > 0 ? posColor : negColor;
    const perCol = 6;
    const gap = size + 0.06;
    const height = isX ? size * 1.9 : size;
    const geo = new THREE.BoxGeometry(size, height, size);
    for (let i = 0; i < n; i++) {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const cube = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.9, emissive: color, emissiveIntensity: 0.12 }),
      );
      cube.position.set(xOff + col * gap, 0.2 + row * (height + 0.08), 0);
      parent.add(cube);
    }
    if (isX) {
      const label = textSprite("x", 0xffffff, 0.28);
      label.position.set(xOff, 0.2 - 0.35, 0);
      parent.add(label);
    }
  }

  // ---- info panel --------------------------------------------------------

  private renderPanel(): void {
    const moves = this.availableMoves();
    const hint = this.hint();
    const solved = this.isSolved();
    const degenerate = this.noSolutionState();

    const presetBtns = PRESETS.map(
      (p, i) =>
        `<button class="course-btn ghost" data-move="preset:${i}"${i === this.presetIndex ? ' style="border:1px solid #58a6ff"' : ""}>${p.label}</button>`,
    ).join(" ");

    let status: string;
    if (degenerate === "infinite") {
      status = `<div class="readout"><b>Every number works.</b> Both sides became identical — this equation is an identity, true for all x.</div>`;
    } else if (degenerate === "none") {
      status = `<div class="readout"><b>No solution.</b> The x's cancelled but the numbers don't match, so no x can satisfy it.</div>`;
    } else if (solved) {
      status = `<div class="readout"><b>Solved: x = ${fmt(this.solutionValue())}.</b> x is alone on one side — that's the answer. Every move kept the beam balanced, so this value fits the original equation.</div>`;
    } else {
      status = `<div class="readout">Goal: get <b>x</b> by itself on one side. Recommended next step is highlighted.</div>`;
    }

    const moveBtns = moves.length
      ? moves
          .map((m) => {
            const rec = m.key === hint;
            return `<button class="course-btn${rec ? "" : " ghost"}" data-move="${m.key}">${rec ? "★ " : ""}${m.label}</button>`;
          })
          .join(" ")
      : `<span class="course-hint">No moves left.</span>`;

    this.setInfo(`
      <h2>Rearranging Equations</h2>
      <p>An equation is a <b>balance</b>. The <code>=</code> sign promises both sides weigh
      the same. So the golden rule is simple: <b>whatever you do to one side, do to the
      other</b> — then it stays level and stays true. Do that until <b>x</b> is alone.</p>

      <div class="course">
        <h3>The one rule</h3>
        <p class="course-hint">You may <b>add</b>, <b>subtract</b>, <b>multiply</b> or
        <b>divide</b> — as long as you do the <i>same thing to both sides</i>. Watch the
        beam: it dips equally and never tilts, because equality is never broken.</p>
      </div>

      <div class="course">
        <h3>Your move</h3>
        ${status}
        <div class="course-chapters" style="margin-top:8px">${moveBtns}</div>
        <div class="course-chapters" style="margin-top:10px">
          <button class="course-btn ghost" data-move="undo">↶ Undo</button>
          <button class="course-btn ghost" data-move="reset">⟲ Reset</button>
        </div>
      </div>

      <div class="course">
        <h3>Pick an equation</h3>
        <div class="course-chapters">${presetBtns}</div>
      </div>

      <div class="course">
        <h3>The habit to build</h3>
        <ol style="margin:4px 0 0; padding-left:20px">
          <li>Collect the <b>x</b>'s on one side (subtract the smaller x-term from both).</li>
          <li>Move the plain <b>numbers</b> to the other side (add/subtract).</li>
          <li><b>Divide</b> both sides by the number in front of x.</li>
        </ol>
        ${derivationButton("linear-equation-general")}
      </div>

      <details class="course" open>
        <summary>Worked examples — write every balanced step</summary>
        <div class="deriv-work">
          <p><b>Unknown on both sides:</b><br>
          <code>5x − 4 = 2x + 8</code><br>
          <code>3x − 4 = 8</code> &nbsp;(subtract 2x from both sides)<br>
          <code>3x = 12</code> &nbsp;(add 4 to both sides)<br>
          <code>x = 4</code> &nbsp;(divide both sides by 3)</p>

          <p><b>Negative coefficient:</b><br>
          <code>4 − 3x = 19</code><br>
          <code>−3x = 15</code> &nbsp;(subtract 4 from both sides)<br>
          <code>x = −5</code> &nbsp;(divide both sides by −3; keep the negative sign)</p>

          <p><b>Fraction coefficient:</b><br>
          <code>x/3 + 2 = 5</code><br>
          <code>x/3 = 3</code> &nbsp;(subtract 2 from both sides)<br>
          <code>x = 9</code> &nbsp;(multiply both sides by 3)</p>

          <p><b>Brackets first:</b><br>
          <code>3(x + 2) = 15</code><br>
          <code>3x + 6 = 15</code> &nbsp;(distribute 3 to both terms)<br>
          <code>3x = 9</code>, then <code>x = 3</code></p>

          <p><b>Rearrange a formula:</b><br>
          <code>C = 2πr</code><br>
          <code>C/(2π) = r</code> &nbsp;(divide both sides by 2π)<br>
          <code>r = C/(2π)</code> &nbsp;(write the subject first)</p>
        </div>
      </details>

      <details class="course">
        <summary>Tips and traps</summary>
        <ul>
          <li><b>Do not “move” a term.</b> Say the actual balanced operation: “subtract 2x from both sides.”</li>
          <li><b>Undo in reverse order.</b> Remove +/− first, then ×/÷. Work from the outside of the x-term inward.</li>
          <li><b>Expand brackets before collecting terms.</b> <code>2(x − 3)</code> is <code>2x − 6</code>, not <code>2x − 3</code>.</li>
          <li><b>Clear awkward fractions.</b> Multiply <em>every</em> term on both sides by the lowest common denominator.</li>
          <li><b>Keep signs attached.</b> Treat <code>−3x</code> as one term; dividing by −3 makes the answer's sign change.</li>
          <li><b>Check the original equation.</b> Substitute your answer into the equation you started with, not just the final simplified line.</li>
          <li><b>Stop at a true statement.</b> If x cancels and leaves <code>0 = 0</code>, every x works; if it leaves <code>0 = 5</code>, no x works.</li>
        </ul>
      </details>`);
  }

  // ---- animation ---------------------------------------------------------

  private spawnTokens(text: string, color: number): void {
    for (const sx of [-this.panX, this.panX]) {
      const sprite = textSprite(text, color, 0.55);
      sprite.position.set(sx, 6, 0.6);
      (sprite.material as THREE.SpriteMaterial).opacity = 1;
      this.group.add(sprite);
      this.tokens.push({ sprite, x: sx, t: 0, dur: 1.0 });
    }
  }

  private tick(dt: number): void {
    // Beam bobs down and settles (both pans equally — it never tilts).
    if (this.settleT < 1.4) {
      this.settleT += dt;
      this.beam.position.y = -0.12 * Math.sin(this.settleT * 13) * Math.exp(-this.settleT * 4);
    } else {
      this.beam.position.y = 0;
    }

    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const tok = this.tokens[i];
      tok.t += dt;
      const p = Math.min(tok.t / tok.dur, 1);
      tok.sprite.position.y = 6 - p * 4.4; // fall from y=6 to y≈1.6
      (tok.sprite.material as THREE.SpriteMaterial).opacity = 1 - p;
      if (p >= 1) {
        this.disposeObject(tok.sprite);
        this.tokens.splice(i, 1);
      }
    }
  }

  // ---- disposal ----------------------------------------------------------

  private disposeChildren(g: THREE.Group): void {
    [...g.children].forEach((c) => this.disposeObject(c));
    g.clear();
  }

  private disposeGroup(g: THREE.Group): void {
    this.disposeChildren(g);
    g.parent?.remove(g);
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => this.disposeMaterial(m));
      else if (mat) this.disposeMaterial(mat);
    });
    obj.parent?.remove(obj);
  }

  private disposeMaterial(m: THREE.Material): void {
    (m as THREE.Material & { map?: THREE.Texture }).map?.dispose();
    m.dispose();
  }
}

type MoveKey =
  | "zeroLc"
  | "zeroRc"
  | "zeroLx"
  | "zeroRx"
  | "divLx"
  | "divRx"
  | "undo"
  | "reset"
  | `preset:${number}`;

/** "Add" when moving a positive amount onto both sides, "Subtract" when removing one. */
function verb(delta: number): string {
  return delta >= 0 ? "Add" : "Subtract";
}

/** Format a number: integers plainly, otherwise up to 3 dp trimmed, with a real minus sign. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (Number.isInteger(n)) return String(n).replace("-", "−");
  const r = Math.round(n * 1000) / 1000;
  return String(r).replace("-", "−");
}

/** Render one side "a·x + b" with tidy signs, hiding zero terms. */
function sideStr(coeff: number, constant: number): string {
  const parts: string[] = [];
  if (coeff !== 0) {
    if (coeff === 1) parts.push("x");
    else if (coeff === -1) parts.push("−x");
    else parts.push(`${fmt(coeff)}x`);
  }
  if (constant !== 0) {
    if (parts.length === 0) parts.push(fmt(constant));
    else parts.push(`${constant < 0 ? "−" : "+"} ${fmt(Math.abs(constant))}`);
  }
  if (parts.length === 0) return "0";
  return parts.join(" ");
}
