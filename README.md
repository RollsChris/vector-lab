# Vector Lab

An interactive, browser-based playground that takes you **from no maths at all to elite
level** — built with Three.js. Think of it as an interactive cousin of 3Blue1Brown/manim:
instead of pre-rendered video, you orbit, zoom, drag sliders, and type your own functions to
*explore* the maths live.

## How the learning path works

The 51 lessons are a single ordered path, split into ten stages. Nothing assumes prior
knowledge: Stage 1 starts at counting and fractions, and Stage 10 ends at maths expressed as
GPU code.

| Stage | You will be able to |
|-------|---------------------|
| 1 · Numbers & arithmetic | Work confidently with whole numbers, fractions and the rules that govern them |
| 2 · Algebra | Use letters for unknown numbers, and rearrange and solve equations |
| 3 · Shape & space | Measure and reason about lines, angles, triangles, circles and curves |
| 4 · Trigonometry & waves | Connect angles to lengths, and describe anything that repeats |
| 5 · Vectors & complex numbers | Handle quantities that carry a direction, and numbers that rotate |
| 6 · Calculus | Measure how things change, and add up infinitely many small pieces |
| 7 · Probability & randomness | Reason about uncertainty, and model systems that evolve by chance |
| 8 · Number theory | Study whole numbers for their own sake |
| 9 · Applied maths & physics | Turn the whole toolkit loose on the physical world |
| 10 · Maths as code | Express mathematics as programs the GPU can run |

Every lesson is wrapped in the same structure, so you always know what you are meant to walk
away with:

- **Plain English** — one jargon-free sentence saying what the topic actually is.
- **By the end you can…** — 3–5 specific, checkable outcomes.
- **Key idea** — the single mental picture that makes it click.
- **Try this** — what to drag, toggle or type in the 3D viewport.
- **Worked example** — a full solution with the reasoning on every line.
- **Common mistakes** — the errors people actually make, with the correction.
- **Check yourself** — recall questions whose answers stay hidden until you reveal them.

Mark a lesson complete when you can answer its checks without looking. The sidebar ticks it,
the stage counter and path progress bar update, and the **Next lesson** button takes you to
the right place. Progress is saved in your browser, and reopening the app resumes where you
left off.

## Lessons

Ordered as a single learning path — each part builds on the ones before it. The sidebar groups
lessons into the ten stages above and auto-numbers them, and each lesson shows a **difficulty
badge** and a **"Builds on"** row of clickable prerequisite links so you can always see what a
topic rests on.

### Foundations · arithmetic & algebra

1. **Foundation topics** — the whole "Part I" of an engineering-maths course in one
   chapter-strip lesson (F.1–F.13): arithmetic, introduction to algebra, expressions &
   equations, graphs, linear equations, polynomial equations, binomials, partial fractions,
   trigonometry, functions, trigonometric & exponential functions, differentiation and
   integration. F.1 is interactive — a number classifier maps any value (`7`, `1/3`, `√2`,
   `π`, `e`, `i`) onto the nested set map plus an arithmetic survival kit (order of
   operations, why minus×minus=plus, bracket powers, fractions, negatives, distribution);
   the rest are quick formula references, with F.12/F.13 pointing to the full
   Differentiation and Integration lessons.
2. **Number Sense & Fractions** — puts whole numbers, equal sharing, fractions, decimals, and
   percentages on a number line and into visible equal-part bars. It explains why a fraction is
   division, why denominators must match before addition, and how exact values lead into ratios,
   probability, and algebra.
3. **Order of Operations** — BODMAS / PEMDAS made visible. An expression is reduced **one
   operation at a time**, always taking the highest-rung, left-most move the rules allow.
   The active operation lights up and collapses to its result, while a ladder (Brackets →
   Orders → Divide/Multiply → Add/Subtract) shows which rule is firing and why. A running
   "blindly left → right" answer is shown alongside the BODMAS answer so you see exactly
   where the classic mistake creeps in. Step through it, auto-play it, pick a preset, or
   type your own sum (including brackets and powers).
4. **Times Tables & Multiplication Strategies** — visual equal groups, high-value facts,
   decomposition strategies, and quick feedback build fact fluency before written methods.
5. **Multiplication & Division** — a switchable long-multiplication and long-division
    workspace. Enter your own integers, see each partial product or
    divide–multiply–subtract–bring-down step, and use estimates and inverse-operation checks
    to catch errors.
6. **Binomials** — a staged, first-principles path from distributing two binomials to general
   powers and binomial probability. A four-region area model explains every product in
   `(x + p)(x + q)`; aligned Pascal coefficients build `(a + b)ⁿ`; then the same coefficient
   counts exact-head coin-flip arrangements and is multiplied by `(1/2)ⁿ`.
7. **Unit Conversions** — an interactive lesson that teaches the single rule behind every
   conversion: multiply by a unit-fraction equal to 1 so the unwanted unit cancels
   (**dimensional analysis** / the factor-label method), with worked examples. A live
   **converter** spans common SI prefixes plus length, mass, time, temperature, area,
   volume, speed, pressure, force, power, frequency, energy, angle and digital storage.
   The centre stage shows a reactive scale/amount visual while the panel shows the
   cancelling unit-fraction (or the scale-and-shift for temperature). Units map affinely
   to a base unit (`base = value·factor + offset`), so temperature's shifted zero is
   handled by the same path as everything else.
8. **Rearranging Equations** — solve for `x` on a **balance scale**. A linear equation sits
   on a level beam (left side on one pan, right side on the other); the `=` sign means the
   two pans weigh the same. Every guided move applies the *same* operation to both sides —
   an identical token drops onto each pan and the beam dips **equally** (never tilts) to
   show equality is preserved. Amounts are drawn as stacks of x-blocks and unit-blocks, and
   a ★ marks the recommended next step so you build the canonical habit: collect the x's,
   move the numbers, then divide. Includes several preset equations (with brackets,
   negatives and fractions), undo/reset, and detection of "no solution" / "true for all x".

### Number & algebra

7. **Vectors** — draw two vectors on a grid and explore addition, subtraction, dot product
   and 2D cross product live. Drag the vector tips, switch on component and polar readouts,
   and watch the parallelogram law build `A + B` and `A − B`.
8. **Complex Numbers** — plot complex numbers on the Argand diagram, add and multiply them,
   and see De Moivre's theorem raise `z = r·e^(iθ)` to integer powers. A polar/rectangular
   toggle and a roots-of-unity demo connect algebra to geometry.
9. **Logarithms** — an interactive "what power do I need?" lesson. Sliders for base
   `b` and value `x` show `log_b(x) = y` alongside the undo check `bʸ = x`, common
   `log₁₀`, natural `ln`, log rules, and examples like pH/decibels/Richter scales.
10. **Probability & Distributions** — roll dice to watch the central limit theorem turn a
   uniform distribution into a bell curve, then sample from normal and exponential
   distributions and fit a live histogram.
- **Pascal's Triangle** — explore binomial coefficients, powers-of-two row sums, the
  Fibonacci diagonals and the Sierpinski-triangle pattern; use a selected entry to count
  combinations, routes and the probability of a given number of coin-flip heads.
- **Powers & Exponential Growth** — watch repeated multiplication grow on a logarithmic
  stage and connect powers to binary states, data storage, compounding and scientific notation.
- **Mersenne Primes** — build `2ᵖ − 1` from its all-ones binary pattern, distinguish prime
  exponents from prime candidates, then use Lucas-Lehmer, perfect numbers, and GIMPS to see why
  this rare family matters.

### Geometry

9. **Geometry** — a panel-only formula reference and live calculator tab for common
   geometry: circles (diameter/circumference/area), parallelograms, regular polygons,
   area tools (triangle/rectangle/trapezium), and volume tools (cuboid/cylinder/cone/sphere).
10. **Triangle Theorems** — drag the three corners (or hit Randomise) and every classic result
    recomputes live on the shape you drew. Toggle overlays to *see* each theorem: the medians
    meeting at the centroid (2:1), the circumcircle through all three vertices, the incircle,
    the altitudes meeting at the orthocentre, and the Euler line that threads O, G and H. The
    panel checks angle-sum = 180°, the sine and cosine rules, and that three area formulas agree,
    with "real world" notes on where each theorem is used.
11. **Quadrilaterals** — drag the four corners (or pick a preset) and the shape classifies itself
    live: square, rectangle, parallelogram, rhombus, trapezium, kite or a plain quadrilateral.
    The angle sum is always 360° — proven even when the shape goes concave. Turn on the diagonals
    to watch which quadrilaterals have diagonals that are equal, that bisect each other, or that
    cross at right angles, and mark the parallel sides with ticks.
12. **Circle Theorems** — a switcher through the seven classic circle rules: angle at the centre
    is twice the angle at the edge, angles in the same segment, the angle in a semicircle is 90°,
    opposite angles of a cyclic quadrilateral sum to 180°, tangent ⟂ radius, two tangents from a
    point are equal, and the perpendicular from the centre bisects a chord. Drag the coloured
    points and the measured numbers update so you watch each rule hold for every position.
13. **Conic Sections** — morph a conic through the focus–directrix definition: drag the focus
    and directrix, tune the eccentricity `e`, and watch the curve become a circle, ellipse,
    parabola or hyperbola while the equation updates.

### Trigonometry

14. **Radians** — the natural way to measure angles. Drag (or auto-sweep) the angle on a unit
    circle and watch the green arc grow at exactly `s = R·θ`. A radian is the angle whose arc
    equals the radius, so the angle in radians is simply *how many radius-lengths of arc you have
    swept* — count the dots. A full turn is `2π ≈ 6.28` radii, which is why `2π rad = 360°` and
    `1 rad ≈ 57.3°`. Explains why radians keep the maths clean (`s = R·θ`, `v = R·ω`, and
    `d/dx sin x = cos x` only in radians), setting up every wave and rotation that follows.
15. **Trigonometric Functions** — an animated unit circle: drag (or auto-sweep) the angle
    `θ` and watch the classic trig lines draw themselves live — the red **sine** line
    (height), blue **cosine** line (base), and green **tangent** line (measured up the
    line that just touches the circle at 0°, which is where "tangent" gets its name).
    A quarter-turn to the right, the same height carried sideways by the arc length `R·θ`
    unrolls into the sine wave, so you can watch the circle *become* the wave in real
    time — the geometric bridge into the Waveforms lesson (16). Includes quick-pick
    buttons for the special angles, a live calculator for all six functions (sin, cos, tan,
    cosec, sec and cot), a configurable circle radius, and a rotatable start ray. The readout
    distinguishes the swept angle from its final standard angle from the x-axis, and includes the
    a staged, live Pythagorean area proof of `sin²θ + cos²θ = 1`, including its rounded
    numeric check and signed-coordinate explanation, plus reference notes on the sign/quadrant rules.

### Waves & signals

16. **Waveforms** — superpose up to three sine components (amplitude / frequency / phase),
    animate them travelling, and see Fourier-style addition in action. A **Custom Wave**
    panel lets you type your own function `f(x, t)` (e.g. `sin(x - 4*t) * exp(-x*x/16)`)
    and overlay it on the built-in harmonics.

### Calculus & analysis

17. **Differentiation (Zero → Hero)** — a 12-chapter guided course that builds the derivative
    from scratch: slope of a line → average slope (the gold **secant**) → the **limit**
    (secant → green **tangent**) → `f'(x)` as its own curve → power rule / constants & sums →
    sin·cos / `eˣ` → the **second derivative** `f''(x)` → peaks & valleys (`f'=0`) →
    position → velocity → acceleration. A numbered chapter strip drives the scene; every aid
    (secant, tangent, `f'`, `f''`, stationary-point markers) is also toggle-able for free play.
    A collapsible **derivatives reference** card lists the standard derivatives (table),
    the rules (constant-multiple, sum, product, quotient, chain) with one-line worked
    examples, and **try / plot-it** buttons that load each `f(x)` straight into the scene.
18. **Integration** — approximate the area under `f(x)` with Riemann rectangles or
    trapezoids; crank `n` and watch the sum converge to the exact (Simpson) value. Toggle the
    **accumulation function** `F(x)` to see the signed area grow from the lower bound and
    verify that `F'(x) = f(x)`.
19. **Optimization** — find and classify stationary points of any function. Type `f(x)`, hit
    solve, and the lesson marks maxima, minima and points of inflection while drawing a
    sign chart for `f'(x)` and `f''(x)`.
20. **Taylor Series** — approximate a function near a point `x = a` with a Taylor polynomial.
    Type `f(x)`, choose `a` and degree `n`, and overlay the polynomial against the original
    while the remainder is plotted as a shaded band.

### Vectors & fields

21. **Vector Fields** — an arrow at every point: hand the equation a point `(x, y)` and it
    hands back that point's push `F = (P, Q)` (length/colour = strength). It starts **2D with
    just four sliders** `a, b, c, d` (`P = a·x + b·y`, `Q = c·x + d·y`); a live "watch one
    point" panel shows that single position flowing into each push. A one-click **example**
    loads famous fields (rotation, shear, saddle, source/sink, spiral, swirl + lift…) and an
    optional **"Add 3D depth"** folder extends it to the third component `R` and a `z` input
    (a true 3D field / Jacobian). Fields can also vary with **time `t`** (pulsing waves,
    travelling ripples) — the same idea as the `u_time` uniform in the Shader Playground.

### Mechanics

22. **Kinematics** — stacked, synchronised graphs of position, velocity and acceleration.
    Preset motion profiles (constant velocity, constant acceleration, jerk) plus a custom
    acceleration input make the links between `s`, `v` and `a` tangible.
23. **Projectile Motion** — a guided launch-to-landing course: resolve `v₀` into horizontal
    and vertical components, connect forces/accelerations to `x(t)`, `y(t)`, `vₓ(t)` and
    `vᵧ(t)`, follow the rising/apex/falling phases, and explore range, impulse, launch force,
    complementary angles, launch height, and Earth/Moon/Mars/Jupiter gravity.
24. **Newton's Laws** — a six-step guided course on inertia, `F = ma`, angled-force trigonometry, normal force/friction, action–reaction pairs and the link from force to impulse
    drive `F = m·a`. Live force/friction/velocity/acceleration arrows and a readout illustrate
    all three laws (inertia, `a = F/m`, action–reaction).
25. **Momentum & Impulse** — build from `p = mv` to `J = FΔt = Δp`. A moving cart and live
    force–time graph show momentum change as signed area; guided experiments compare hard taps
    with gentle pushes, explain airbags/crumple zones, and finish with equal-and-opposite
    internal impulses conserving total momentum before the Collisions lesson.
26. **Universal Gravitation** — Newton's inverse-square law of gravity, `F = G·m₁·m₂/r²`. Drag
    the masses and their separation and watch the attractive force follow `1/r²`; guided steps
    walk from the falling apple to the force that holds the Moon in orbit.
27. **Moments & Torque** — balance a see-saw by placing masses at chosen distances from the
    pivot. The lesson computes clockwise and anticlockwise moments, shows the resultant torque,
    and tips the beam in real time.
28. **Forces & Load Paths** — a weight hung from two angled cables on columns. Resolves each
    tension into horizontal/vertical components, solves the knot's static equilibrium
    (`ΣFx = 0`, `ΣFy = 0`), and traces the load all the way to the ground: vertical reactions
    sum back to `W`, with the leftover horizontal thrust the foundation must resist. Shows why
    shallow cables (`T = W / 2·sinθ`) create enormous tension.
29. **Mitre Saw Cut Planner** — enter board width and thickness with miter and bevel settings,
    then see the top cut plan, the resulting compound-cut face, the exact cut length, and the
    flat-frame corner formed by matching bevel-zero cuts.
30. **Ropes & Pulleys** — lift a weight through a block-and-tackle. A strand-count slider sets
    the mechanical advantage; the load rises while the effort end travels `n×` further. Live
    readout of tension `T = W/n`, effort `F = W/n`, velocity ratio, and a work/energy account
    (with an efficiency slider to model friction). Builds up: one tension → supporting strands
    → `MA = n` → energy conservation.
30. **Atwood Machine** — release two adjustable masses connected by one ideal rope over a
    frictionless pulley. The stage shows both weights and the shared tension, while live
    equations derive acceleration from the weight difference. Explains its use in measuring
    motion and the counterweight principle behind lifts and rigging.
31. **Collisions** — one-dimensional elastic and inelastic collisions on a frictionless track.
    Two sliders set incoming velocities and masses; the lesson applies momentum conservation
    plus a restitution coefficient so you can explore `e = 1` (perfectly elastic) down to
    `e = 0` (perfectly inelastic / stick together).
32. **Stress & Strain** — pull an axial bar (Steel/Aluminium/Titanium/Copper/Rubber). Computes
    stress `σ = F/A`, strain `ε = σ/E` (Hooke's law), elongation `ΔL` and a safety factor; the
    bar stretches and recolours by stress, with a live stress–strain graph and yield warning.
33. **Pendulum** — a real (nonlinear) simple pendulum solved live by RK4:
    `θ'' = −(g/L)·sinθ − (b/m)·θ'`. Type in real values — length `L`, gravity (Earth / Moon /
    Mars / Jupiter / Sun or any custom `g`), release angle `θ₀`, mass and air damping — and
    watch the bob swing with live **velocity / gravity / tension** vectors, a kinetic +
    potential **energy account**, and a rolling **θ(t) graph**. The small-angle period
    `T₀ = 2π·√(L/g)` (independent of mass and amplitude) is shown next to the exact
    large-angle period `T = 4·√(L/g)·K(sin(θ₀/2))` via the elliptic integral, so you can read
    off how much a big swing runs slow. A translucent **ideal ghost** runs the linearised
    `sinθ ≈ θ` model alongside the real one to make the divergence visible.

### Waves, circuits & measuring the world

33. **Physical Waves** — a vibrating string driven by travelling and standing-wave modes.
    Adjust amplitude, frequency, wave speed and damping, then add a second wave and watch
    beats, nodes and antinodes form on the string.
34. **Electrical Circuits** — an RC charging/discharging circuit. Watch capacitor voltage
    asymptotically approach the supply while current decays exponentially, with the time
    constant `τ = R·C` highlighted on the graph.
35. **Shadows & Earth's Size** — reconstruct the size of the Earth from shadows,
    Eratosthenes-style. Two vertical sticks a known distance apart cast shadows at different
    angles; the difference in shadow angle scales up to the Earth's circumference and radius,
    with guided steps from "what a shadow is" to the full measurement.

### Programming

36. **Shader Playground** — a live **GLSL ES** fragment-shader editor (Shadertoy-style). Your
    code is the whole fragment shader painted on a quad; you get `vUv`, `u_time`, `u_mouse` and
    `u_resolution` uniforms, time speed/pause controls, and compile (Ctrl/Cmd+Enter). Ships with
    a built-in **Zero → Hero course**: 17 progressively-richer, fully-commented chapters
    (pixels → coordinates → colour → distance shapes → soft edges → time → waves → tiling →
    polar → palettes → noise → fractal noise → a 2D "hero" shader, then a **bonus 3D
    raymarching track**: rays-per-pixel → SDF sphere → lighting via normals → a morphing lit
    3D hero solid), each loadable into the editor with one click. Extra gallery examples include
    the Mandelbrot set, a Julia set and a raymarched sphere. GLSL errors are caught and
    explained instead of failing silently. (WebGL speaks GLSL ES — not HLSL/DirectX, nor
    WGSL/WebGPU.)


## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle into dist/
npm run preview  # serve the production build
```

## Deploy (Vercel)

Static Vite SPA — no server, no env vars. Progress stays in `localStorage`.

```bash
npm run build          # must pass (tsc + vite)
npx vercel             # preview
npx vercel --prod      # production
```

Or connect the GitHub repo in the Vercel dashboard (framework preset **Vite**, output
`dist/`). Hash routes (`/#lesson-id`) need no SPA rewrite. `vercel.json` sets long-cache
headers for hashed `/assets/*` files.

## Mobile

On viewports ≤900px the app is **stage-first**:

- **Lessons** opens a left drawer (search + curriculum list).
- **Learn** opens a bottom sheet (controls + teaching frame).
- **‹ / ›** step through the path; choosing a lesson closes the drawer.
- Touch orbit/pinch via OrbitControls; scene drags already use Pointer Events.

Desktop keeps the three-column layout. Playwright’s `mobile-chrome` project smoke-tests
the shell.

## Validation

Because the visuals are hard to eyeball, the project validates itself automatically:

```bash
npm run validate   # type-check + unit tests + browser tests
```

- **`npm test`** — Vitest unit tests for the maths (`tests/*.test.ts`): derivatives,
  Riemann-sum convergence, Simpson reference, expression parsing.
- **`npm run test:e2e`** — Playwright launches the real app (WebGL via SwiftShader),
  clicks through every lesson, **fails on any console/page error**, saves a screenshot of
  each lesson to `tests/screenshots/`, and checks behavioural invariants — e.g. that
  vector-field particle speed scales with field magnitude, and that the differentiation
  tangent's slope equals the analytic derivative. Includes a Pixel-sized mobile shell
  smoke test.

`main.ts` exposes a `window.__lab` debug handle (dev/test builds only) so the browser
tests can drive lessons and read runtime state.

## Controls

- **Desktop:** drag to orbit, scroll to zoom, right-drag to pan. **/** search, **Esc**
  clear, **[** / **]** previous/next lesson.
- **Phone/tablet:** drag to orbit, pinch to zoom, two-finger pan. Use the top-bar
  **Lessons** / **Learn** / **‹ ›** chrome.
- Each lesson has a URL hash, e.g. `/#geometry`.
- Use the controls panel (lil-gui) for per-lesson sliders and function inputs.
- Function inputs accept `x`, `y`, and `Math` functions unprefixed:
  `sin`, `cos`, `exp`, `sqrt`, `pi`, `tau`, `e`, etc. e.g. `sin(x) * cos(y)`.

## Architecture

| Path | Role |
|------|------|
| `src/core/Viewport.ts` | renderer, camera, OrbitControls, axes/grid, render loop |
| `src/core/Lesson.ts` | `Lesson` interface + `LessonContext` |
| `src/core/LessonManager.ts` | sidebar nav, enter/exit lifecycle, per-lesson GUI |
| `src/core/LessonFrame.ts` | renders the static teaching frame (brief + practice) around each lesson |
| `src/core/Progress.ts` | learner progress, persisted to `localStorage` |
| `src/curriculum/stages.ts` | the zero-to-elite path: stages, teaching order, next/previous |
| `src/curriculum/types.ts` | `LessonGuide` contract — objectives, worked example, pitfalls, checks |
| `src/curriculum/guides/*` | authored guide content, one file per stage group |
| `src/math/expr.ts` | compiles function strings into fast JS functions |
| `src/math/calculus.ts` | numeric derivative, Riemann sums, Simpson reference |
| `src/math/complex.ts` | complex-number operations (add, mul, polar, powers, formatting) |
| `src/math/physics.ts` | kinematics, projectile motion, RK4, collision helpers |
| `src/math/pendulum.ts` | pendulum periods (elliptic-integral exact form), RK4 integrator, energy |
| `src/lessons/*` | one self-contained lesson each |

### The curriculum layer

Lesson modules own the interactive scene. Everything a learner needs *around* the scene is
authored centrally so all 51 lessons read consistently:

- **`src/curriculum/stages.ts`** is the single source of truth for teaching order. The
  sidebar grouping, the `[` / `]` shortcuts, the "Next lesson" button and the progress
  tracker all derive from it — reorder it there and the whole app follows.
- **`src/curriculum/guides/*.ts`** hold one `LessonGuide` per lesson: a jargon-free plain
  English summary, 3–5 observable objectives, the key idea, why it matters, a fully worked
  example, common mistakes, self-check questions, and a "try this" instruction pointing at
  the lesson's real controls.
- The frame renders **outside `#info`**, because lessons rewrite `#info` on every slider
  tick. Anything with user state (an opened self-check answer) would otherwise be wiped.

`tests/curriculum.test.ts` enforces the contract: every registered lesson is on exactly one
stage, every prerequisite is taught earlier in the path, every lesson has a guide, and each
guide meets the quality bar (objective counts, no unmeasurable verbs like "understand",
worked examples that show their working, answers that explain their reasoning).

### Adding a lesson

1. Implement the `Lesson` interface (`enter`/`exit`), add 3D objects to
   `ctx.viewport.world`, and register controls on `ctx.gui`.
2. List it in `src/main.ts`.
3. Place its id on a stage in `src/curriculum/stages.ts`.
4. Author its `LessonGuide` in the matching `src/curriculum/guides/*.ts` file.

Steps 3 and 4 are not optional — `npm test` fails if a registered lesson has no place on
the path or no guide.

> Note: `src/math/expr.ts` compiles user input via `new Function`. That's fine for a local
> learning tool you run yourself; do **not** expose it to untrusted input without sandboxing.
