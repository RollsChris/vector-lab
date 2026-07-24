import { derivationButton } from "../core/FormulaDerivations";

/**
 * Zero → Hero course for the Differentiation lesson.
 *
 * Each chapter loads a function into the lesson and toggles the right visual aids
 * (secant line, tangent, the derivative curve f'(x), the second derivative f''(x),
 * stationary-point markers). The progression builds the whole idea of a derivative
 * from scratch:
 *
 *   slope of a line → a curve's slope changes → average slope (secant) →
 *   the limit (secant → tangent) → f'(x) as its own function → the power rule →
 *   constants & sums → sin/cos → eˣ → the second derivative → finding peaks (f'=0) →
 *   the hero: position → velocity → acceleration.
 *
 * Colours used throughout (kept consistent with the scene):
 *   blue  = f(x)        green  = tangent line
 *   gold  = secant line orange = f'(x)            purple = f''(x)
 */
export interface DiffChapter {
  /** Short label shown on the numbered chip. */
  title: string;
  /** One-line summary shown in the info strip under the chips. */
  idea: string;
  /** f(x) to load into the lesson. */
  expr: string;
  /** Where the sliding point starts. */
  x: number;
  /** Starting secant gap h (only matters when the secant is shown). */
  h: number;
  /** Which visual aids this chapter switches on. */
  show: {
    tangent: boolean;
    secant: boolean;
    derivative: boolean;
    second: boolean;
    critical: boolean;
  };
  /** The full teaching text for this chapter (HTML). */
  lesson: string;
}

const S = (
  tangent: boolean,
  secant: boolean,
  derivative: boolean,
  second: boolean,
  critical: boolean,
): DiffChapter["show"] => ({ tangent, secant, derivative, second, critical });

export const DIFF_CHAPTERS: DiffChapter[] = [
  {
    title: "What is a slope?",
    idea: "Slope = rise ÷ run. On a straight line it's the same everywhere.",
    expr: "0.5*x + 1",
    x: 2,
    h: 2,
    show: S(true, false, false, false, false),
    lesson: `
      <p>First, what does <code>f(x)</code> even mean? It's a <b>recipe that turns an x into a
      y</b>. In fact <b><code>y = f(x)</code></b> — “f of x” and the height <code>y</code> are the
      <i>same number</i>. You feed in an <code>x</code>, do the arithmetic, and the answer that
      pops out is the height of the line at that <code>x</code>.</p>
      <div class="formula" data-derivation="line-equation"><div class="formula-body" style="font-size:15px">
        y = f(x) = 0.5·x + 1</div>
        <div class="formula-note">“take your x, multiply by 0.5, then add 1.”
        x = 0 → y = 1; &nbsp; x = 2 → y = 2; &nbsp; x = 4 → y = 3.</div>
        ${derivationButton("line-equation")}</div>
      <p>The two numbers each have a job: the <b>0.5</b> is the <b>slope</b> (how much y climbs per
      step right), and the <b>+1</b> is the starting height at <code>x = 0</code>.</p>
      <p><b>Slope</b> means “how steep”. Walk one step right (the <b>run</b>) and measure how far
      the line climbs (the <b>rise</b>). Slope is just</p>
      <div class="formula" data-derivation="slope-ratio"><div class="formula-body" style="font-size:15px">slope = rise ÷ run = Δy ÷ Δx</div>
        ${derivationButton("slope-ratio")}</div>
      <p>For this line, every <b>1</b> you move right it climbs <b>0.5</b>, so its slope is
      <b>0.5</b> — <i>everywhere</i>. The green <b>tangent</b> line lies right on top of it,
      because a straight line is its own tangent.</p>
      <p class="example"><b>Try it:</b> drag <b>x (point)</b> and watch the readout: <code>x</code>
      goes in, <code>y = f(x)</code> comes out, but the slope never changes — that's what makes a
      line a line.</p>
      <p class="example"><b>Make your own line.</b> Open the <b>✏️ Build your own line</b> controls
      and drag <b>slope m</b> and <b>intercept c</b> — the formula <code>y = m·x + c</code> and the
      blue line update live. Try a steep line (m = 3), a downhill line (m = −1), or a flat one
      (m = 0). Next chapter: what happens on something curved?</p>`,
  },
  {
    title: "A curve's slope keeps changing",
    idea: "On a curve the steepness is different at every point.",
    expr: "0.25*x*x",
    x: 2,
    h: 2,
    show: S(true, false, false, false, false),
    lesson: `
      <p>Here's a curve, <code>f(x) = 0.25·x²</code>. A curve has <b>no single slope</b> — it's
      gentle near the bottom and steep up the sides. So instead we talk about the slope
      <i>at a particular point</i>.</p>
      <p>The green <b>tangent</b> is the straight line that just kisses the curve at your point
      and matches its direction there. Its steepness <i>is</i> the slope at that point.</p>
      <p class="example"><b>Try it:</b> drag <b>x</b> from left to right (or tick
      <b>Auto-sweep</b>). Watch the tangent tilt: steeply down on the left, <b>flat at the
      bottom</b> (slope 0), then steeply up on the right. The slope readout changes with it.
      But how do we actually <i>measure</i> that slope? That's the next three chapters.</p>`,
  },
  {
    title: "Average slope: the secant",
    idea: "Pick two points, join them. That line's slope is the average rate of change.",
    expr: "0.25*x*x",
    x: 0,
    h: 3,
    show: S(false, true, false, false, false),
    lesson: `
      <p>To measure a curve's slope we start with something we already know how to do: the slope
      of a <b>straight line through two points</b>. Pick your point at <code>x</code>, then a
      second point a gap <code>h</code> further along, at <code>x + h</code>. Join them with the
      gold <b>secant</b> line.</p>
      <div class="formula" data-derivation="average-slope"><div class="formula-body" style="font-size:15px">
        average slope = [ f(x+h) − f(x) ] ÷ h</div>
        ${derivationButton("average-slope")}</div>
      <p>That's the <b>average</b> steepness between the two points — the total rise divided by
      the total run <code>h</code>. The readout shows the live numbers.</p>
      <p class="example"><b>Try it:</b> drag <b>secant gap h</b>. A big <code>h</code> gives a
      rough average over a wide stretch; it doesn't really match the slope <i>at</i> your point
      yet. Watch what happens as you shrink it…</p>`,
  },
  {
    title: "Shrink the gap → the tangent",
    idea: "As h → 0 the secant becomes the tangent. THIS is the derivative.",
    expr: "0.25*x*x",
    x: 1,
    h: 2.5,
    show: S(true, true, false, false, false),
    lesson: `
      <p>Here's the magic step. Keep shrinking the gap <code>h</code> toward <b>0</b>. The second
      point slides back toward your point, and the gold <b>secant</b> swings around until it lies
      exactly on the green <b>tangent</b>. The average slope becomes the slope <i>at the point</i>.</p>
      <div class="formula" data-derivation="derivative-limit"><div class="formula-body" style="font-size:14px">
        f′(x) = limit as h→0 of&nbsp; [ f(x+h) − f(x) ] ÷ h</div>
        <div class="formula-note">This is <b>the definition of the derivative</b>. Everything
        else in calculus is built on it.</div>
        ${derivationButton("derivative-limit")}</div>
      <p>“Limit as h→0” means: not <code>h = 0</code> (that would be 0÷0!), but <i>as close to 0
      as you like</i>. The answer it sneaks up on is the true slope.</p>
      <p class="example"><b>Try it:</b> drag <b>secant gap h</b> down toward 0 and watch the
      <i>average slope</i> in the readout close in on the <i>true slope f′(x)</i>, while the gold
      line melts onto the green one.</p>`,
  },
  {
    title: "f′(x): the slope at every point",
    idea: "Do that limit at every x and you get a brand-new function — the slope graph.",
    expr: "0.25*x*x",
    x: 2,
    h: 2,
    show: S(true, false, true, false, false),
    lesson: `
      <p>If we work out that slope at <i>every</i> <code>x</code> and plot the answers, we get a
      whole new curve: the <b>derivative function</b> <code>f′(x)</code>, drawn here in
      <span style="color:#ffa657">orange</span>.</p>
      <p>For <code>f(x) = 0.25·x²</code> the slope happens to be <code>f′(x) = 0.5·x</code> — a
      straight line. ${derivationButton("power-rule")} Check it: where the blue curve is flat (its bottom, <code>x = 0</code>) the
      orange line is at <b>0</b>. Where blue heads up steeply on the right, orange is high.</p>
      <p class="example"><b>Try it:</b> sweep <b>x</b> and watch two things move together — the
      green tangent's tilt on the blue curve, and the height of the orange curve. They're the
      <b>same number</b> shown two ways. The orange curve is the answer to “what's the slope
      here?” asked at every point at once.</p>`,
  },
  {
    title: "The power rule: xⁿ",
    idea: "d/dx xⁿ = n·xⁿ⁻¹. Bring the power down, drop it by one.",
    expr: "x*x",
    x: 1.5,
    h: 2,
    show: S(true, false, true, false, false),
    lesson: `
      <p>Doing the limit by hand every time would be painful, so we learn <b>shortcut rules</b>.
      The most important is the <b>power rule</b>:</p>
      <div class="formula" data-derivation="power-rule"><div class="formula-body" style="font-size:15px">
        d/dx&nbsp; xⁿ = n · xⁿ⁻¹</div>
        <div class="formula-note">Bring the exponent down to the front as a multiplier, then
        subtract one from the exponent.</div>
        ${derivationButton("power-rule")}</div>
      <p>Here <code>f(x) = x²</code>, so <code>n = 2</code> → <code>f′(x) = 2·x¹ = 2x</code>. The
      orange line is exactly <code>2x</code>: at <code>x = 3</code> it reads <b>6</b>.</p>
      <ul>
        <li><code>x³</code> → <code>3x²</code></li>
        <li><code>x</code> (= x¹) → <code>1</code> (a flat slope of 1)</li>
        <li><code>x⁵</code> → <code>5x⁴</code></li>
      </ul>
      <p class="example"><b>Try it:</b> type <code>x*x*x</code> into <b>f(x)</b> and press Enter.
      The orange slope-curve becomes a <code>3x²</code> parabola — exactly what the rule predicts.</p>`,
  },
  {
    title: "Constants & sums",
    idea: "A constant has slope 0; lines have a constant slope; derivatives add.",
    expr: "2*x + 3",
    x: 0,
    h: 2,
    show: S(true, false, true, false, false),
    lesson: `
      <p>Two quick rules fall straight out of the definition:</p>
      <ul>
        <li>The slope of a <b>constant</b> (a flat line like <code>f = 3</code>) is <b>0</b> — it
        never rises. So <code>d/dx (3) = 0</code>. ${derivationButton("constant-derivative")}</li>
        <li>Derivatives <b>add up</b>: the slope of a sum is the sum of the slopes.
        <code>d/dx (2x + 3) = 2 + 0 = 2</code>. ${derivationButton("sum-rule")}</li>
      </ul>
      <p>That's why the orange <code>f′(x)</code> here is a flat line stuck at <b>2</b>: the
      <code>2x</code> part contributes a slope of 2 everywhere, and the <code>+3</code>
      contributes nothing.</p>
      <p class="example"><b>Try it:</b> change the <code>+3</code> to <code>+9</code> — the blue
      line lifts up, but the orange slope-line doesn't budge. Adding a constant <b>slides</b> a
      graph up/down without changing its steepness anywhere.</p>`,
  },
  {
    title: "sin and cos",
    idea: "The slope of sin is cos — the wave's steepness is itself a wave.",
    expr: "sin(x)",
    x: 1,
    h: 2,
    show: S(true, false, true, false, false),
    lesson: `
      <p>Now a famous pair. Take the wave <code>f(x) = sin(x)</code> (blue). Its derivative — its
      slope at every point — turns out to be another wave: <code>f′(x) = cos(x)</code> (orange).
      ${derivationButton("sin-derivative")}</p>
      <p>It makes sense if you look: <code>sin</code> rises fastest as it crosses zero (so
      <code>cos</code> is at its peak there), and <code>sin</code> is momentarily <b>flat at its
      crests and troughs</b> (so <code>cos</code> crosses zero there).</p>
      <p class="example"><b>Try it:</b> sweep <b>x</b> across a peak of the blue wave. The green
      tangent goes flat (slope 0) exactly as the orange <code>cos</code> curve passes through
      zero. The two graphs are locked together — that's what “derivative” means.</p>`,
  },
  {
    title: "eˣ is its own slope",
    idea: "The exponential eˣ equals its own derivative — unique in all of maths.",
    expr: "exp(x)",
    x: 0.7,
    h: 1.5,
    show: S(true, false, true, false, false),
    lesson: `
      <p>The exponential <code>f(x) = eˣ</code> is special: its slope at any point equals its own
      <b>height</b> at that point. So <code>f′(x) = eˣ</code> — the orange derivative curve lands
      <b>exactly on top of</b> the blue curve. ${derivationButton("exp-derivative")}</p>
      <p>That's why <code>eˣ</code> shows up everywhere things grow in proportion to how much is
      already there — money earning interest, populations, radioactive decay (with a minus sign).
      The rate of change <i>is</i> the amount present.</p>
      <p class="example"><b>Try it:</b> read the values at <code>x = 1</code>: both <code>f</code>
      and <code>f′</code> are about <b>2.72</b> (that's <code>e</code>). At <code>x = 2</code>
      both are about <b>7.39</b>. Height = slope, always.</p>`,
  },
  {
    title: "Second derivative",
    idea: "Differentiate twice: f″ measures bending — concave up or down.",
    expr: "sin(x)",
    x: 1,
    h: 2,
    show: S(true, false, true, true, false),
    lesson: `
      <p>Nothing stops you differentiating the derivative <i>again</i>. The
      <b>second derivative</b> <code>f″(x)</code> (purple) is “the slope of the slope” — it tells
      you how the steepness itself is changing, i.e. how the curve <b>bends</b>.</p>
      <ul>
        <li><code>f″ &gt; 0</code> → curve bends <b>upward</b> like a cup ∪ (slope increasing)</li>
        <li><code>f″ &lt; 0</code> → curve bends <b>downward</b> like a cap ∩ (slope decreasing)</li>
        <li><code>f″ = 0</code> → an <b>inflection</b>, where the bend flips</li>
      </ul>
      <p>For <code>sin(x)</code>: f′ = cos(x), and differentiating again gives
      <code>f″ = −sin(x)</code> — the purple curve is the blue one flipped upside-down.
      ${derivationButton("cos-derivative")}</p>
      <p class="example"><b>Try it:</b> sweep across a crest of blue (a cap ∩). The purple
      <code>f″</code> is at its most negative there. In physics, if blue is position, orange is
      <b>velocity</b> and purple is <b>acceleration</b> — the cliff-hanger for the final chapter.</p>`,
  },
  {
    title: "Peaks & valleys (f′ = 0)",
    idea: "Maxima and minima sit where the tangent is flat — solve f′(x)=0.",
    expr: "x*x*x - 3*x",
    x: -1,
    h: 1.5,
    show: S(true, false, true, false, true),
    lesson: `
      <p>This is what derivatives are <i>for</i> in the real world: finding the <b>biggest</b> or
      <b>smallest</b> value of something (most profit, least fuel, shortest time). At a peak or a
      valley the curve is momentarily <b>flat</b>, so the tangent is horizontal and</p>
      <div class="formula" data-derivation="stationary-condition"><div class="formula-body" style="font-size:15px">f′(x) = 0</div>
        ${derivationButton("stationary-condition")}</div>
      <p>Solve that and you've found the candidates. The red/green dots mark them here:
      <span style="color:#ff7b72">red = a peak (maximum)</span>,
      <span style="color:#7ee787">green = a valley (minimum)</span>. The
      <b>second derivative</b> decides which: <code>f″ &lt; 0</code> ⇒ peak, <code>f″ &gt; 0</code>
      ⇒ valley.</p>
      <p>For <code>f(x) = x³ − 3x</code>: <code>f′(x) = 3x² − 3 = 0</code> gives
      <code>x = −1</code> (peak) and <code>x = +1</code> (valley).</p>
      <p class="example"><b>Try it:</b> drag <b>x</b> onto a marker and watch the slope readout hit
      <b>0</b> while the tangent goes perfectly flat.</p>`,
  },
  {
    title: "Hero: motion",
    idea: "Position → (differentiate) → velocity → (differentiate) → acceleration.",
    expr: "sin(x)",
    x: 0,
    h: 1.5,
    show: S(true, false, true, true, true),
    lesson: `
      <p>Here's the whole idea in one picture. Read the horizontal axis as <b>time</b> and the blue
      curve as an object's <b>position</b> (it bobs up and down like a mass on a spring).</p>
      <ul>
        <li>Differentiate position once → <span style="color:#ffa657">orange = <b>velocity</b></span>
        (how fast it's moving, and which way).</li>
        <li>Differentiate again → purple = <b>acceleration</b> (how fast the velocity is changing —
        which, by <code>F = m·a</code>, is the force).</li>
      </ul>
      <p>Watch the story line up: when position is at the <b>top</b> of its swing it's momentarily
      <b>stopped</b> (velocity = 0, marked), and it's being yanked back hardest (acceleration most
      negative). That's a vibration, sound, AC current, an orbit — all the same maths.</p>
      <p class="example"><b>You made it to hero.</b> A derivative is just “rate of change”, and you
      can stack it: position → velocity → acceleration. Pop over to the <b>Newton's Laws</b> lesson
      to see <code>F = m·a</code> push a real block, or type your own <code>f(x)</code> above and
      explore. Try <code>x*sin(x)</code> or <code>exp(-x*x)</code>.</p>`,
  },
];

/**
 * A standard "table of derivatives" + the rules of differentiation + worked examples,
 * shown as a collapsible reference card under the course. Buttons carry a data-fx
 * attribute so the lesson can load that function into the plot when clicked.
 */
export const DERIVATIVE_REFERENCE = `
  <h3>📖 Table of standard derivatives</h3>
  <p class="course-hint">The slopes worth memorising. Click any <b>try</b> to plot
  <code>f</code> (blue) with its slope-curve <code>f′</code> (orange) — they'll match the rule.</p>
  <table class="deriv-table">
    <thead><tr><th>f(x)</th><th>f′(x)</th><th></th></tr></thead>
    <tbody>
      <tr><td><code>c</code> (a constant)</td><td><code>0</code> ${derivationButton("constant-derivative")}</td><td><button class="deriv-try" data-fx="3">try</button></td></tr>
      <tr><td><code>x</code></td><td><code>1</code> ${derivationButton("linear-derivative")}</td><td><button class="deriv-try" data-fx="x">try</button></td></tr>
      <tr><td><code>xⁿ</code></td><td><code>n·xⁿ⁻¹</code> ${derivationButton("power-rule")}</td><td><button class="deriv-try" data-fx="x*x*x">try</button></td></tr>
      <tr><td><code>√x = x^½</code></td><td><code>1 ⁄ (2√x)</code> ${derivationButton("sqrt-derivative")}</td><td><button class="deriv-try" data-fx="sqrt(x)">try</button></td></tr>
      <tr><td><code>1/x = x⁻¹</code></td><td><code>−1 ⁄ x²</code> ${derivationButton("reciprocal-derivative")}</td><td><button class="deriv-try" data-fx="1/x">try</button></td></tr>
      <tr><td><code>eˣ</code></td><td><code>eˣ</code> ${derivationButton("exp-derivative")}</td><td><button class="deriv-try" data-fx="exp(x)">try</button></td></tr>
      <tr><td><code>ln x</code></td><td><code>1 ⁄ x</code> ${derivationButton("log-derivative")}</td><td><button class="deriv-try" data-fx="log(x)">try</button></td></tr>
      <tr><td><code>sin x</code></td><td><code>cos x</code> ${derivationButton("sin-derivative")}</td><td><button class="deriv-try" data-fx="sin(x)">try</button></td></tr>
      <tr><td><code>cos x</code></td><td><code>−sin x</code> ${derivationButton("cos-derivative")}</td><td><button class="deriv-try" data-fx="cos(x)">try</button></td></tr>
      <tr><td><code>tan x</code></td><td><code>1 ⁄ cos²x</code> ${derivationButton("tan-derivative")}</td><td><button class="deriv-try" data-fx="tan(x)">try</button></td></tr>
    </tbody>
  </table>

  <h3>🧩 The rules (how to combine them)</h3>
  <ul>
    <li><b>Constant multiple:</b> <code>(k·f)′ = k·f′</code> ${derivationButton("constant-multiple-rule")} — a scale factor just rides along.
      <span class="deriv-eg">e.g. <code>(5x²)′ = 5·2x = 10x</code></span></li>
    <li><b>Sum / difference:</b> <code>(f ± g)′ = f′ ± g′</code> ${derivationButton("sum-rule")} — differentiate term by term.
      <span class="deriv-eg">e.g. <code>(x³ − 2x)′ = 3x² − 2</code></span></li>
    <li><b>Product:</b> <code>(f·g)′ = f′·g + f·g′</code> ${derivationButton("product-rule")}.
      <span class="deriv-eg">e.g. <code>(x·sin x)′ = 1·sin x + x·cos x</code>
      <button class="deriv-try" data-fx="x*sin(x)">try</button></span></li>
    <li><b>Quotient:</b> <code>(f/g)′ = (f′·g − f·g′) ⁄ g²</code> ${derivationButton("quotient-rule")}.</li>
    <li><b>Chain:</b> <code>(f(g(x)))′ = f′(g(x))·g′(x)</code> ${derivationButton("chain-rule")} — outer derivative × inner derivative.
      <span class="deriv-eg">e.g. <code>(sin(2x))′ = cos(2x)·2 = 2cos(2x)</code>
      <button class="deriv-try" data-fx="sin(2*x)">try</button></span></li>
  </ul>

  <h3>✏️ Worked examples</h3>
  <div class="deriv-work">
    <p><b>1. <code>f(x) = 3x⁴</code></b><br>
    Power rule on <code>x⁴</code> gives <code>4x³</code>; keep the constant multiple 3:<br>
    → <code>f′(x) = 3·4x³ = <b>12x³</b></code>
    <button class="deriv-try" data-fx="3*x*x*x*x">plot it</button></p>

    <p><b>2. <code>f(x) = x² + sin x</code></b><br>
    Differentiate each term and add:<br>
    → <code>f′(x) = 2x + cos x</code>
    <button class="deriv-try" data-fx="x*x + sin(x)">plot it</button></p>

    <p><b>3. <code>f(x) = e^(−x²)</code></b> (the bell curve) — chain rule.<br>
    Outer <code>eᵘ</code> → <code>eᵘ</code>; inner <code>u = −x²</code> → <code>−2x</code>:<br>
    → <code>f′(x) = e^(−x²)·(−2x) = <b>−2x·e^(−x²)</b></code>
    <button class="deriv-try" data-fx="exp(-x*x)">plot it</button></p>
  </div>
  <p class="course-hint">After clicking <b>plot it</b>, drag <b>x</b> and confirm the green tangent's
  steepness matches the orange <code>f′</code> height — that's the rule working.</p>`;
