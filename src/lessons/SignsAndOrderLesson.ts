import * as THREE from "three";
import type { Lesson, LessonContext } from "../core/Lesson";
import {
  additionStory,
  formatAddition,
  formatSigned,
  groupedSums,
  operate,
  opposite,
  swapPreserves,
  type StoryBeat,
} from "../math/signedArithmetic";
import { segment, setSpriteText, textSprite } from "./helpers";

type View = "opposites" | "swap" | "group" | "breaks";

const VIEWS: readonly { id: View; label: string }[] = [
  { id: "opposites", label: "Opposites" },
  { id: "swap", label: "Swap" },
  { id: "group", label: "Group" },
  { id: "breaks", label: "When order breaks" },
] as const;

const SWAP_PRESETS = [
  { left: -3, right: 10 },
  { left: 10, right: -3 },
  { left: -5, right: 8 },
  { left: 6, right: 2 },
] as const;

const SWAP_DURATION = 1.05;
const HOLD = 0.4;
const REWRITE_DURATION = 0.85;
const CANCEL_DURATION = 1.2;
const HOP_DURATION = 1.1;

function wholeInteger(value: string, min: number, max: number): number | undefined {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
}

function ease(t: number): number {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export class SignsAndOrderLesson implements Lesson {
  readonly id = "signs-and-order";
  readonly title = "Signs, Opposites & Order";
  readonly blurb = "Why −3 + 10 is the same as 10 − 3, and which swaps keep the total";
  readonly category = "Foundations" as const;
  readonly difficulty = "Foundation" as const;
  readonly prerequisites = ["arithmetic-operations"] as const;

  private group = new THREE.Group();
  private setInfo!: (html: string) => void;
  private canvas!: HTMLCanvasElement;
  private view: View = "swap";
  private left = -3;
  private right = 10;
  private oppositeOf = 3;
  private groupA = 2;
  private groupB = 3;
  private groupC = 4;
  private breakLeft = 10;
  private breakRight = 3;
  private inputError = "";
  private stopTick?: () => void;
  private playElapsed = 0;
  private animating = false;

  private leftChip?: THREE.Group;
  private rightChip?: THREE.Group;
  private plusSprite?: THREE.Sprite;
  private minusSprite?: THREE.Sprite;
  private captionSprite?: THREE.Sprite;
  private expressionSprite?: THREE.Sprite;
  private bracket?: THREE.Group;
  private hopArrows: THREE.Line[] = [];

  private readonly onInfoClick = (event: Event): void => {
    const viewButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-sign-view]");
    if (viewButton) {
      const view = viewButton.dataset.signView as View;
      if (!VIEWS.some((candidate) => candidate.id === view)) return;
      this.view = view;
      this.inputError = "";
      this.refresh();
      this.focusAfterRender(`[data-sign-view="${view}"]`);
      return;
    }

    const presetButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-sign-preset]");
    if (presetButton) {
      const left = Number(presetButton.dataset.signLeft);
      const right = Number(presetButton.dataset.signRight);
      if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right)) return;
      this.left = left;
      this.right = right;
      this.inputError = "";
      this.refresh();
      this.focusAfterRender(`[data-sign-preset="${left}:${right}"]`);
      return;
    }

    const actionButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-sign-action]");
    if (actionButton?.dataset.signAction === "replay") {
      this.restartAnimation();
      this.focusAfterRender('[data-sign-action="replay"]');
    }
  };

  private readonly onInfoChange = (event: Event): void => {
    const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-sign-input]");
    if (!input) return;
    const key = input.dataset.signInput ?? "";
    const bounds: Record<string, { min: number; max: number; assign: (value: number) => void }> = {
      left: { min: -12, max: 12, assign: (value) => { this.left = value; } },
      right: { min: -12, max: 12, assign: (value) => { this.right = value; } },
      opposite: { min: 1, max: 12, assign: (value) => { this.oppositeOf = value; } },
      groupA: { min: -9, max: 9, assign: (value) => { this.groupA = value; } },
      groupB: { min: -9, max: 9, assign: (value) => { this.groupB = value; } },
      groupC: { min: -9, max: 9, assign: (value) => { this.groupC = value; } },
      breakLeft: { min: 0, max: 12, assign: (value) => { this.breakLeft = value; } },
      breakRight: { min: 0, max: 12, assign: (value) => { this.breakRight = value; } },
    };
    const field = bounds[key];
    if (!field) return;
    const value = wholeInteger(input.value, field.min, field.max);
    if (value === undefined) {
      this.inputError = `Enter a whole number from ${field.min} to ${field.max}.`;
      this.renderPanel();
      this.focusAfterRender(`[data-sign-input="${key}"]`);
      return;
    }
    field.assign(value);
    this.inputError = "";
    this.refresh();
    this.focusAfterRender(`[data-sign-input="${key}"]`);
  };

  enter(ctx: LessonContext): void {
    this.setInfo = ctx.setInfo;
    this.canvas = ctx.viewport.renderer.domElement;
    this.canvas.setAttribute("role", "img");
    this.canvas.tabIndex = 0;
    ctx.viewport.world.add(this.group);
    ctx.viewport.setHelpers(false);
    ctx.viewport.frameCamera(new THREE.Vector3(0, 0.2, 12), new THREE.Vector3(0, 0.05, 0));
    document.getElementById("info")?.addEventListener("click", this.onInfoClick);
    document.getElementById("info")?.addEventListener("change", this.onInfoChange);
    this.stopTick = ctx.viewport.onTick((dt) => this.tick(dt));
    this.refresh();
  }

  exit(): void {
    this.stopTick?.();
    this.stopTick = undefined;
    document.getElementById("info")?.removeEventListener("click", this.onInfoClick);
    document.getElementById("info")?.removeEventListener("change", this.onInfoChange);
    this.canvas.removeAttribute("role");
    this.canvas.setAttribute("aria-label", "Interactive WebGL lesson scene");
    this.canvas.removeAttribute("tabindex");
    this.disposeGroup();
    this.group.parent?.remove(this.group);
    this.group = new THREE.Group();
  }

  private refresh(): void {
    this.drawStage();
    this.renderPanel();
    this.canvas.setAttribute("aria-label", this.stageSummary());
  }

  private renderPanel(): void {
    const viewButtons = VIEWS.map((view) => `
      <button class="course-btn${view.id === this.view ? "" : " ghost"}"
        data-sign-view="${view.id}"
        aria-pressed="${view.id === this.view}">${view.label}</button>`).join("");

    this.setInfo(`
      <h2>Signs, Opposites &amp; Order</h2>
      <p>The minus mark does two jobs. Glued to one number, it is the sign.
      Sitting between two numbers, it is take-away. Take-away is the same move
      as adding the opposite, so an addition may swap and then be written as a
      take-away.</p>

      <section class="course">
        <h3>Choose a view</h3>
        <div class="operation-lab-tabs" role="group" aria-label="Signed number view">
          ${viewButtons}
        </div>
        ${this.viewInputs()}
        <div class="operation-lab-readout" aria-live="polite">
          <b>${this.stageSummary()}</b>
          <span>${this.stageExplanation()}</span>
        </div>
        ${this.inputError ? `<p class="operation-lab-feedback error" role="alert">${this.inputError}</p>` : ""}
        <button class="course-btn" data-sign-action="replay">Replay the motion</button>
        ${this.viewBody()}
        <p class="course-hint">The canvas is a visual model; every result also appears here as
        text. All controls work with Tab, Shift+Tab, Enter, and Space.</p>
      </section>

      ${this.viewReference()}`);
  }

  private viewInputs(): string {
    switch (this.view) {
      case "opposites":
        return `
          <div class="operation-lab-inputs">
            <label>Number
              <input type="number" min="1" max="12" inputmode="numeric"
                value="${this.oppositeOf}" data-sign-input="opposite" />
            </label>
          </div>`;
      case "swap": {
        const presets = SWAP_PRESETS.map((pair) => `
          <button class="course-btn${pair.left === this.left && pair.right === this.right ? "" : " ghost"}"
            data-sign-preset="${pair.left}:${pair.right}"
            data-sign-left="${pair.left}" data-sign-right="${pair.right}"
            aria-pressed="${pair.left === this.left && pair.right === this.right}">
            ${formatAddition(pair.left, pair.right)}
          </button>`).join("");
        return `
          <div class="operation-lab-inputs">
            <label>First number
              <input type="number" min="-12" max="12" inputmode="numeric"
                value="${this.left}" data-sign-input="left" />
            </label>
            <label>Second number
              <input type="number" min="-12" max="12" inputmode="numeric"
                value="${this.right}" data-sign-input="right" />
            </label>
          </div>
          <div class="operation-lab-tabs" role="group" aria-label="Example additions">${presets}</div>`;
      }
      case "group":
        return `
          <div class="operation-lab-inputs">
            <label>a
              <input type="number" min="-9" max="9" inputmode="numeric"
                value="${this.groupA}" data-sign-input="groupA" />
            </label>
            <label>b
              <input type="number" min="-9" max="9" inputmode="numeric"
                value="${this.groupB}" data-sign-input="groupB" />
            </label>
            <label>c
              <input type="number" min="-9" max="9" inputmode="numeric"
                value="${this.groupC}" data-sign-input="groupC" />
            </label>
          </div>`;
      case "breaks":
        return `
          <div class="operation-lab-inputs">
            <label>First number
              <input type="number" min="0" max="12" inputmode="numeric"
                value="${this.breakLeft}" data-sign-input="breakLeft" />
            </label>
            <label>Second number
              <input type="number" min="0" max="12" inputmode="numeric"
                value="${this.breakRight}" data-sign-input="breakRight" />
            </label>
          </div>`;
    }
  }

  private viewBody(): string {
    switch (this.view) {
      case "opposites":
        return `
          <p>The opposite of ${this.oppositeOf} is
          <code>${formatSigned(opposite(this.oppositeOf))}</code>.
          They sit the same distance from zero on opposite sides. Add them and
          the walk comes home to 0.</p>`;
      case "swap": {
        const beats = additionStory(this.left, this.right);
        const path = beats.map((beat) => `<code>${beat.expression}</code>`).join(" → ");
        return `
          <p>Addition may change order. After a swap, a trailing negative may
          be written as take-away. The plus did not vanish: it joined the sign
          and became a take-away mark.</p>
          <p>This pair: ${path}. The total stays
          <code>${this.left + this.right}</code>.</p>`;
      }
      case "group": {
        const { left } = groupedSums(this.groupA, this.groupB, this.groupC);
        return `
          <p><b>Associative</b> means the brackets may slide. The pile is the
          same whether you add the first pair first or the last pair first.</p>
          <p><code>(${formatSigned(this.groupA)} + ${formatSigned(this.groupB)}) + ${formatSigned(this.groupC)}</code>
          and
          <code>${formatSigned(this.groupA)} + (${formatSigned(this.groupB)} + ${formatSigned(this.groupC)})</code>
          both equal <code>${left}</code>.</p>`;
      }
      case "breaks": {
        const forward = operate("subtract", this.breakLeft, this.breakRight);
        const backward = operate("subtract", this.breakRight, this.breakLeft);
        return `
          <p>A raw take-away keeps its order.
          <code>${this.breakLeft} − ${this.breakRight} = ${forward}</code>,
          but
          <code>${this.breakRight} − ${this.breakLeft} = ${backward}</code>.</p>
          <p>Sharing does the same:
          <code>12 ÷ 3 = 4</code> is not <code>3 ÷ 12</code>.
          To swap a take-away, rewrite it as an addition first.</p>`;
      }
    }
  }

  private viewReference(): string {
    switch (this.view) {
      case "opposites":
        return `
          <section class="course">
            <h3>How to read a minus</h3>
            <ul>
              <li>At the start, or glued to one number in brackets, it is a sign.</li>
              <li>Between two numbers, it is take-away.</li>
              <li><code>10 − 3</code> is the same action as <code>10 + (−3)</code>.</li>
            </ul>
          </section>`;
      case "swap":
        return `
          <section class="course">
            <h3>Commutative means swap</h3>
            <ul>
              <li>Addition and multiplication keep the same answer when the order changes.</li>
              <li>Take-away and sharing do not, until you rewrite them.</li>
              <li>The check is the total: both writings of this pair equal ${this.left + this.right}.</li>
            </ul>
          </section>`;
      case "group":
        return `
          <section class="course">
            <h3>Associative means regroup</h3>
            <ul>
              <li>Brackets say which pair you add first. They do not change the pile.</li>
              <li>The same rule holds for multiplication.</li>
              <li>It fails for take-away: <code>(12 − 5) − 2</code> is not <code>12 − (5 − 2)</code>.</li>
            </ul>
          </section>`;
      case "breaks":
        return `
          <section class="course">
            <h3>Distribution, briefly</h3>
            <ul>
              <li>A multiply reaches every piece in a bracket:
              <code>3(4 + 5) = 3×4 + 3×5</code>.</li>
              <li>That is the distributive law. It is how you expand, and how you factor in reverse.</li>
              <li>Factoring pulls a shared block back outside, which is why a later lesson uses the greatest common factor.</li>
            </ul>
          </section>`;
    }
  }

  private stageSummary(): string {
    switch (this.view) {
      case "opposites":
        return `${this.oppositeOf} + (${formatSigned(opposite(this.oppositeOf))}) = 0`;
      case "swap": {
        const beats = additionStory(this.left, this.right);
        return `${beats.map((beat) => beat.expression).join("  =  ")}  =  ${this.left + this.right}`;
      }
      case "group": {
        const { left } = groupedSums(this.groupA, this.groupB, this.groupC);
        return `(${formatSigned(this.groupA)} + ${formatSigned(this.groupB)}) + ${formatSigned(this.groupC)} = ${left}`;
      }
      case "breaks":
        return `${this.breakLeft} − ${this.breakRight} = ${operate("subtract", this.breakLeft, this.breakRight)} · ${this.breakRight} − ${this.breakLeft} = ${operate("subtract", this.breakRight, this.breakLeft)}`;
    }
  }

  private stageExplanation(): string {
    switch (this.view) {
      case "opposites":
        return "The two arrows are the same length. They cancel when they meet at zero.";
      case "swap":
        return "Watch the chips change places, then watch a trailing negative become take-away.";
      case "group":
        return "The brackets slide from the first pair to the last pair. The total does not move.";
      case "breaks":
        return "The two hops land on opposite sides of zero when the numbers differ.";
    }
  }

  private story(): StoryBeat[] {
    return additionStory(this.left, this.right);
  }

  private drawStage(): void {
    this.disposeGroup();
    this.leftChip = undefined;
    this.rightChip = undefined;
    this.plusSprite = undefined;
    this.minusSprite = undefined;
    this.captionSprite = undefined;
    this.expressionSprite = undefined;
    this.bracket = undefined;
    this.hopArrows = [];
    switch (this.view) {
      case "opposites":
        this.buildOppositesStage();
        break;
      case "swap":
        this.buildSwapStage();
        break;
      case "group":
        this.buildGroupStage();
        break;
      case "breaks":
        this.buildBreaksStage();
        break;
    }
    this.restartAnimation();
  }

  private restartAnimation(): void {
    this.playElapsed = 0;
    this.animating = true;
    this.setChipValue(this.leftChip, this.view === "opposites" ? this.oppositeOf : this.left);
    this.setChipValue(this.rightChip, this.view === "opposites" ? opposite(this.oppositeOf) : this.right);
    if (this.plusSprite) this.plusSprite.material.opacity = 1;
    if (this.minusSprite) this.minusSprite.material.opacity = 0;
    if (this.bracket) this.bracket.position.x = -1.55;
    this.updateAnimation();
  }

  private tick(dt: number): void {
    if (!this.animating) return;
    this.playElapsed += dt;
    this.updateAnimation();
  }

  private updateAnimation(): void {
    switch (this.view) {
      case "opposites":
        this.updateOppositesAnimation();
        break;
      case "swap":
        this.updateSwapAnimation();
        break;
      case "group":
        this.updateGroupAnimation();
        break;
      case "breaks":
        this.updateBreaksAnimation();
        break;
    }
  }

  private buildOppositesStage(): void {
    this.drawNumberLine(-this.oppositeOf, this.oppositeOf, -1.55);
    this.leftChip = this.addChip(-2.4, 1.15, this.oppositeOf);
    this.rightChip = this.addChip(2.4, 1.15, opposite(this.oppositeOf));
    this.plusSprite = textSprite("+", 0xffd166, 0.55);
    this.plusSprite.position.set(0, 1.15, 0);
    this.group.add(this.plusSprite);
    this.captionSprite = this.addCaption(`${this.oppositeOf} and its opposite cancel`, 2.45);
    this.expressionSprite = this.addCaption(this.stageSummary(), -2.55, 0xd2a8ff, 0.3);
  }

  private updateOppositesAnimation(): void {
    const t = ease(this.playElapsed / CANCEL_DURATION);
    if (this.leftChip) this.leftChip.position.x = THREE.MathUtils.lerp(-2.4, -0.55, t);
    if (this.rightChip) this.rightChip.position.x = THREE.MathUtils.lerp(2.4, 0.55, t);
    if (this.plusSprite) this.plusSprite.material.opacity = 1 - t;
    this.setCaption(t >= 1 ? "they meet and cancel at 0" : "walk toward zero");
    if (t >= 1) this.animating = false;
  }

  private buildSwapStage(): void {
    this.leftChip = this.addChip(-2.35, 0.55, this.left);
    this.rightChip = this.addChip(2.35, 0.55, this.right);
    this.plusSprite = textSprite("+", 0xffd166, 0.58);
    this.plusSprite.position.set(0, 0.55, 0);
    this.group.add(this.plusSprite);
    this.minusSprite = textSprite("−", 0xff7b72, 0.58);
    this.minusSprite.position.set(0, 0.55, 0);
    this.minusSprite.material.opacity = 0;
    this.group.add(this.minusSprite);
    this.captionSprite = this.addCaption("addition may swap", 2.25);
    this.expressionSprite = this.addCaption(formatAddition(this.left, this.right), -1.85, 0xd2a8ff, 0.32);
    const total = textSprite(`total ${this.left + this.right}`, 0x7ee787, 0.28);
    total.position.set(0, -2.45, 0);
    this.group.add(total);
  }

  private updateSwapAnimation(): void {
    const beats = this.story();
    const hasSwap = beats.some((beat) => beat.kind === "swap");
    const hasRewrite = beats.some((beat) => beat.kind === "rewrite");
    let elapsed = this.playElapsed;
    let phase: "start" | "swap" | "hold" | "rewrite" | "done" = "start";
    let swapT = 0;
    let rewriteT = 0;

    if (hasSwap) {
      if (elapsed < SWAP_DURATION) {
        phase = "swap";
        swapT = ease(elapsed / SWAP_DURATION);
      } else {
        swapT = 1;
        elapsed -= SWAP_DURATION;
        if (elapsed < HOLD) phase = "hold";
        else if (hasRewrite) {
          elapsed -= HOLD;
          if (elapsed < REWRITE_DURATION) {
            phase = "rewrite";
            rewriteT = ease(elapsed / REWRITE_DURATION);
          } else {
            phase = "done";
            rewriteT = 1;
          }
        } else {
          phase = "done";
        }
      }
    } else if (hasRewrite) {
      if (elapsed < HOLD) phase = "start";
      else if (elapsed < HOLD + REWRITE_DURATION) {
        phase = "rewrite";
        rewriteT = ease((elapsed - HOLD) / REWRITE_DURATION);
      } else {
        phase = "done";
        rewriteT = 1;
      }
    } else {
      phase = "done";
    }

    const startLeft = -2.35;
    const startRight = 2.35;
    const leftX = hasSwap ? THREE.MathUtils.lerp(startLeft, startRight, swapT) : startLeft;
    const rightX = hasSwap ? THREE.MathUtils.lerp(startRight, startLeft, swapT) : startRight;
    const arc = hasSwap ? Math.sin(swapT * Math.PI) * 0.85 : 0;
    if (this.leftChip) {
      this.leftChip.position.set(leftX, 0.55 + arc, 0);
    }
    if (this.rightChip) {
      this.rightChip.position.set(rightX, 0.55 - arc, 0);
    }

    const showMinus = rewriteT > 0.45;
    if (this.plusSprite) this.plusSprite.material.opacity = showMinus ? 0 : 1;
    if (this.minusSprite) this.minusSprite.material.opacity = showMinus ? 1 : 0;

    if (hasRewrite && rewriteT > 0.45 && this.rightChip) {
      const trailing = this.left < 0 ? this.left : this.right;
      this.setChipValue(this.left < 0 ? this.leftChip : this.rightChip, Math.abs(trailing));
    }

    const expression =
      phase === "done" || phase === "rewrite"
        ? beats[beats.length - 1].expression
        : phase === "hold" || (phase === "swap" && swapT > 0.55)
          ? (beats.find((beat) => beat.kind === "swap") ?? beats[0]).expression
          : beats[0].expression;
    this.setExpression(expression);
    this.setCaption(
      phase === "swap" ? "the chips change places" :
        phase === "hold" ? "still an addition" :
          phase === "rewrite" || (phase === "done" && hasRewrite) ? "add the opposite, write take-away" :
            phase === "done" ? "same total, new order" :
              "start with the addition",
    );
    if (phase === "done") this.animating = false;
  }

  private buildGroupStage(): void {
    const xs = [-3.1, 0, 3.1];
    const values = [this.groupA, this.groupB, this.groupC];
    values.forEach((value, index) => this.addChip(xs[index], 0.45, value));
    const plusLeft = textSprite("+", 0xffd166, 0.42);
    plusLeft.position.set(-1.55, 0.45, 0);
    this.group.add(plusLeft);
    const plusRight = textSprite("+", 0xffd166, 0.42);
    plusRight.position.set(1.55, 0.45, 0);
    this.group.add(plusRight);
    this.bracket = this.makeBracket(2.4);
    this.bracket.position.set(-1.55, 1.15, 0);
    this.captionSprite = this.addCaption("brackets on the first pair", 2.25);
    const { left } = groupedSums(this.groupA, this.groupB, this.groupC);
    this.expressionSprite = this.addCaption(`total ${left}`, -1.85, 0x7ee787, 0.32);
  }

  private updateGroupAnimation(): void {
    const t = ease(this.playElapsed / 1.6);
    if (this.bracket) this.bracket.position.x = THREE.MathUtils.lerp(-1.55, 1.55, t);
    this.setCaption(t < 1 ? "brackets slide to the last pair" : "same pile, new grouping");
    if (t >= 1) this.animating = false;
  }

  private buildBreaksStage(): void {
    const forward = operate("subtract", this.breakLeft, this.breakRight) ?? 0;
    const backward = operate("subtract", this.breakRight, this.breakLeft) ?? 0;
    const min = Math.min(0, forward, backward) - 1;
    const max = Math.max(this.breakLeft, this.breakRight, forward, backward) + 1;
    this.drawNumberLine(min, max, 0.85);
    this.drawNumberLine(min, max, -1.55);
    this.hopArrows.push(this.addHop(min, max, 0.85, this.breakLeft, forward, 0x58a6ff));
    this.hopArrows.push(this.addHop(min, max, -1.55, this.breakRight, backward, 0xff7b72));
    this.captionSprite = this.addCaption("take-away keeps its order", 2.45);
    this.expressionSprite = this.addCaption(
      `${this.breakLeft} − ${this.breakRight} = ${forward}   ·   ${this.breakRight} − ${this.breakLeft} = ${backward}`,
      -2.55,
      0xd2a8ff,
      0.26,
    );
  }

  private updateBreaksAnimation(): void {
    const t = ease(this.playElapsed / HOP_DURATION);
    this.hopArrows.forEach((line) => {
      const material = line.material as THREE.LineBasicMaterial;
      material.opacity = 0.2 + 0.8 * t;
    });
    const swapped = swapPreserves("subtract", this.breakLeft, this.breakRight);
    this.setCaption(
      t < 1
        ? "two take-aways, opposite landings"
        : swapped
          ? "the numbers match, so the landings match"
          : "same marks, different order, different place",
    );
    if (t >= 1) this.animating = false;
  }

  private addChip(x: number, y: number, value: number): THREE.Group {
    const chip = new THREE.Group();
    const color = value < 0 ? 0xff7b72 : 0x58a6ff;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.9, 0.16),
      new THREE.MeshBasicMaterial({ color }),
    );
    chip.add(box);
    const label = textSprite(formatSigned(value), 0xffffff, 0.4);
    label.position.z = 0.12;
    chip.add(label);
    chip.position.set(x, y, 0);
    chip.userData.value = value;
    this.group.add(chip);
    return chip;
  }

  private setChipValue(chip: THREE.Group | undefined, value: number): void {
    if (!chip || chip.userData.value === value) return;
    chip.userData.value = value;
    const box = chip.children[0] as THREE.Mesh;
    const material = box.material as THREE.MeshBasicMaterial;
    material.color.setHex(value < 0 ? 0xff7b72 : 0x58a6ff);
    const label = chip.children[1] as THREE.Sprite;
    setSpriteText(label, formatSigned(value), 0xffffff);
  }

  private makeBracket(width: number): THREE.Group {
    const bracket = new THREE.Group();
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    );
    const left = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.28, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    );
    left.position.set(-width / 2, -0.1, 0);
    const right = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.28, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    );
    right.position.set(width / 2, -0.1, 0);
    bracket.add(bar, left, right);
    this.group.add(bracket);
    return bracket;
  }

  private drawNumberLine(min: number, max: number, y: number): void {
    const width = 9.2;
    const startX = -width / 2;
    const xFor = (value: number): number => startX + ((value - min) / Math.max(max - min, 1)) * width;
    this.group.add(segment(new THREE.Vector3(startX, y, 0), new THREE.Vector3(startX + width, y, 0), 0x8b949e));
    for (let value = min; value <= max; value++) {
      const x = xFor(value);
      this.group.add(segment(new THREE.Vector3(x, y - 0.16, 0), new THREE.Vector3(x, y + 0.16, 0), 0xc9d1d9));
      const label = textSprite(String(value), value === 0 ? 0xffd166 : 0xc9d1d9, 0.2);
      label.position.set(x, y - 0.42, 0);
      this.group.add(label);
    }
  }

  private addHop(
    min: number,
    max: number,
    y: number,
    from: number,
    to: number,
    color: number,
  ): THREE.Line {
    const width = 9.2;
    const startX = -width / 2;
    const xFor = (value: number): number => startX + ((value - min) / Math.max(max - min, 1)) * width;
    const fromX = xFor(from);
    const toX = xFor(to);
    const points: THREE.Vector3[] = [];
    for (let step = 0; step <= 24; step++) {
      const t = step / 24;
      points.push(new THREE.Vector3(
        THREE.MathUtils.lerp(fromX, toX, t),
        y + 0.15 + Math.sin(Math.PI * t) * 0.85,
        0,
      ));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.2 }),
    );
    this.group.add(line);
    return line;
  }

  private addCaption(text: string, y: number, color = 0xffffff, scale = 0.3): THREE.Sprite {
    const sprite = textSprite(text, color, scale);
    sprite.position.set(0, y, 0);
    this.group.add(sprite);
    return sprite;
  }

  private setCaption(text: string): void {
    if (!this.captionSprite) return;
    setSpriteText(this.captionSprite, text, 0xffffff);
  }

  private setExpression(text: string): void {
    if (!this.expressionSprite) return;
    setSpriteText(this.expressionSprite, text, 0xd2a8ff);
  }

  private focusAfterRender(selector: string): void {
    queueMicrotask(() => document.querySelector<HTMLElement>(`#info ${selector}`)?.focus());
  }

  private disposeGroup(): void {
    this.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const disposeOne = (item: THREE.Material): void => {
        (item as THREE.SpriteMaterial).map?.dispose();
        item.dispose();
      };
      if (Array.isArray(material)) material.forEach(disposeOne);
      else if (material) disposeOne(material);
    });
    this.group.clear();
  }
}
