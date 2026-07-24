import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const svg = (label: string, body: string): string => `
  <svg viewBox="0 0 360 190" role="img" aria-label="${label}">
    <defs>
      <marker id="physics-derivation-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="context-stroke"/>
      </marker>
    </defs>
    ${body}
  </svg>`;

const motionSvg = svg(
  "Object moving along a line with initial velocity and constant acceleration",
  `
    <line x1="35" y1="130" x2="325" y2="130" stroke="#8b949e" stroke-width="3"/>
    <circle cx="95" cy="130" r="14" fill="#79c0ff"/>
    <line x1="95" y1="95" x2="190" y2="95" stroke="#ffa657" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="95" y1="65" x2="250" y2="65" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <text x="126" y="88" fill="#ffa657" font-size="16">initial velocity v₀</text>
    <text x="154" y="57" fill="#ff7b72" font-size="16">constant acceleration a</text>
    <text x="74" y="158" fill="#79c0ff" font-size="16">x₀</text>
    <text x="274" y="158" fill="#7ee787" font-size="16">x(t)</text>
  `,
);

const projectileSvg = svg(
  "Projectile launch velocity split into horizontal and vertical components with gravity downward",
  `
    <line x1="35" y1="155" x2="330" y2="155" stroke="#7ee787" stroke-width="3"/>
    <path d="M55 150 Q165 18 300 150" fill="none" stroke="#79c0ff" stroke-width="3"/>
    <line x1="55" y1="150" x2="155" y2="80" stroke="#ffa657" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="55" y1="150" x2="155" y2="150" stroke="#79c0ff" stroke-width="3" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="155" y1="150" x2="155" y2="80" stroke="#ff7b72" stroke-width="3" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="230" y1="55" x2="230" y2="115" stroke="#d2a8ff" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <text x="96" y="68" fill="#ffa657" font-size="16">v₀</text>
    <text x="92" y="145" fill="#79c0ff" font-size="15">v₀ cosθ</text>
    <text x="162" y="110" fill="#ff7b72" font-size="15">v₀ sinθ</text>
    <text x="240" y="88" fill="#d2a8ff" font-size="16">g</text>
  `,
);

const forceSvg = svg(
  "Free body diagram of a block with applied force, friction, normal force and weight",
  `
    <rect x="135" y="85" width="90" height="55" rx="6" fill="#539bf5"/>
    <line x1="25" y1="140" x2="335" y2="140" stroke="#8b949e" stroke-width="3"/>
    <line x1="180" y1="85" x2="180" y2="25" stroke="#58a6ff" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="180" y1="140" x2="180" y2="180" stroke="#f0883e" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="225" y1="105" x2="310" y2="55" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="135" y1="120" x2="65" y2="120" stroke="#ffa657" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <text x="187" y="38" fill="#58a6ff" font-size="16">N</text>
    <text x="188" y="177" fill="#f0883e" font-size="16">mg</text>
    <text x="277" y="48" fill="#ff7b72" font-size="16">F</text>
    <text x="75" y="112" fill="#ffa657" font-size="16">f</text>
  `,
);

const impulseSvg = svg(
  "Force time graph whose rectangular area is impulse",
  `
    <line x1="45" y1="155" x2="325" y2="155" stroke="#8b949e" stroke-width="3" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="45" y1="155" x2="45" y2="25" stroke="#8b949e" stroke-width="3" marker-end="url(#physics-derivation-arrow)"/>
    <rect x="90" y="55" width="165" height="100" fill="#ffa65755" stroke="#ffa657" stroke-width="3"/>
    <text x="154" y="107" fill="#ffa657" font-size="18">area = F Δt</text>
    <text x="265" y="177" fill="#c9d1d9" font-size="15">time t</text>
    <text x="18" y="35" fill="#c9d1d9" font-size="15">force F</text>
  `,
);

const gravitySvg = svg(
  "Two masses separated by centre to centre distance r and attracting each other",
  `
    <circle cx="85" cy="95" r="34" fill="#2f81f7"/>
    <circle cx="280" cy="95" r="20" fill="#d2a8ff"/>
    <line x1="120" y1="95" x2="258" y2="95" stroke="#ffd166" stroke-width="3"/>
    <line x1="85" y1="45" x2="145" y2="45" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="280" y1="45" x2="220" y2="45" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <text x="67" y="101" fill="#fff" font-size="16">m₁</text>
    <text x="270" y="101" fill="#fff" font-size="16">m₂</text>
    <text x="182" y="88" fill="#ffd166" font-size="16">r</text>
    <text x="105" y="36" fill="#ff7b72" font-size="16">F</text>
    <text x="238" y="36" fill="#ff7b72" font-size="16">F</text>
  `,
);

const momentSvg = svg(
  "Lever about a pivot with downward force and perpendicular moment arm",
  `
    <line x1="45" y1="105" x2="320" y2="105" stroke="#8b949e" stroke-width="6"/>
    <path d="M155 145 L180 105 L205 145 Z" fill="#ffa657"/>
    <line x1="275" y1="55" x2="275" y2="135" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="180" y1="155" x2="275" y2="155" stroke="#7ee787" stroke-width="3"/>
    <text x="285" y="80" fill="#ff7b72" font-size="16">F</text>
    <text x="214" y="177" fill="#7ee787" font-size="16">d⊥</text>
    <text x="164" y="95" fill="#ffa657" font-size="15">pivot</text>
  `,
);

const cableSvg = svg(
  "Knot supported by two angled cable tensions whose vertical components balance a weight",
  `
    <line x1="180" y1="105" x2="65" y2="35" stroke="#ffa657" stroke-width="4"/>
    <line x1="180" y1="105" x2="295" y2="35" stroke="#ffa657" stroke-width="4"/>
    <circle cx="180" cy="105" r="8" fill="#fff"/>
    <line x1="180" y1="105" x2="180" y2="170" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="180" y1="105" x2="118" y2="67" stroke="#79c0ff" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="180" y1="105" x2="242" y2="67" stroke="#79c0ff" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <text x="97" y="58" fill="#79c0ff" font-size="15">Tᴸ</text>
    <text x="246" y="58" fill="#79c0ff" font-size="15">Tᴿ</text>
    <text x="190" y="160" fill="#ff7b72" font-size="16">W</text>
  `,
);

const pulleySvg = svg(
  "Moving pulley block supported by four equal tension rope strands",
  `
    <rect x="115" y="120" width="130" height="45" rx="6" fill="#539bf5"/>
    <line x1="125" y1="120" x2="125" y2="35" stroke="#ffd166" stroke-width="4"/>
    <line x1="160" y1="120" x2="160" y2="35" stroke="#ffd166" stroke-width="4"/>
    <line x1="200" y1="120" x2="200" y2="35" stroke="#ffd166" stroke-width="4"/>
    <line x1="235" y1="120" x2="235" y2="35" stroke="#ffd166" stroke-width="4"/>
    <line x1="180" y1="120" x2="180" y2="180" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <text x="112" y="28" fill="#ffd166" font-size="15">T</text>
    <text x="147" y="28" fill="#ffd166" font-size="15">T</text>
    <text x="187" y="28" fill="#ffd166" font-size="15">T</text>
    <text x="222" y="28" fill="#ffd166" font-size="15">T</text>
    <text x="190" y="177" fill="#ff7b72" font-size="16">W</text>
  `,
);

const atwoodSvg = svg(
  "Atwood machine with two hanging masses, equal rope tension and opposite acceleration directions",
  `
    <circle cx="180" cy="55" r="34" fill="none" stroke="#8b949e" stroke-width="5"/>
    <path d="M146 55 V145 M214 55 V145" fill="none" stroke="#ffd166" stroke-width="4"/>
    <rect x="120" y="145" width="52" height="35" fill="#79c0ff"/>
    <rect x="188" y="145" width="52" height="35" fill="#ff7b72"/>
    <line x1="110" y1="140" x2="110" y2="85" stroke="#7ee787" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="250" y1="90" x2="250" y2="145" stroke="#7ee787" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <text x="128" y="168" fill="#fff" font-size="16">mA</text>
    <text x="196" y="168" fill="#fff" font-size="16">mB</text>
    <text x="94" y="112" fill="#7ee787" font-size="15">a</text>
    <text x="258" y="120" fill="#7ee787" font-size="15">a</text>
  `,
);

const collisionSvg = svg(
  "Two carts moving along one line before and after a collision",
  `
    <line x1="25" y1="145" x2="335" y2="145" stroke="#8b949e" stroke-width="3"/>
    <rect x="65" y="105" width="60" height="40" fill="#ff7b72"/>
    <rect x="235" y="105" width="60" height="40" fill="#79c0ff"/>
    <line x1="125" y1="90" x2="185" y2="90" stroke="#ffa657" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="235" y1="65" x2="205" y2="65" stroke="#ffa657" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <text x="78" y="130" fill="#fff" font-size="16">m₁</text>
    <text x="248" y="130" fill="#fff" font-size="16">m₂</text>
    <text x="140" y="82" fill="#ffa657" font-size="15">u₁</text>
    <text x="209" y="55" fill="#ffa657" font-size="15">u₂</text>
  `,
);

const stressSvg = svg(
  "Tensile bar pulled at both ends with original length and elongation labelled",
  `
    <rect x="85" y="80" width="190" height="42" fill="#539bf5"/>
    <line x1="85" y1="101" x2="25" y2="101" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="275" y1="101" x2="335" y2="101" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="85" y1="145" x2="275" y2="145" stroke="#ffd166" stroke-width="3"/>
    <text x="42" y="91" fill="#ff7b72" font-size="16">F</text>
    <text x="305" y="91" fill="#ff7b72" font-size="16">F</text>
    <text x="164" y="167" fill="#ffd166" font-size="16">L₀ + ΔL</text>
    <text x="166" y="106" fill="#fff" font-size="15">area A</text>
  `,
);

const pendulumSvg = svg(
  "Pendulum bob with tension, weight, tangential gravity component and angle theta",
  `
    <circle cx="180" cy="30" r="7" fill="#ffa657"/>
    <line x1="180" y1="30" x2="260" y2="135" stroke="#8b949e" stroke-width="4"/>
    <circle cx="260" cy="135" r="18" fill="#79c0ff"/>
    <line x1="260" y1="135" x2="260" y2="180" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="260" y1="135" x2="215" y2="76" stroke="#58a6ff" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="260" y1="135" x2="215" y2="169" stroke="#7ee787" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <path d="M180 70 A40 40 0 0 1 204 62" fill="none" stroke="#d2a8ff" stroke-width="3"/>
    <text x="196" y="82" fill="#d2a8ff" font-size="16">θ</text>
    <text x="267" y="174" fill="#ff7b72" font-size="15">mg</text>
    <text x="218" y="88" fill="#58a6ff" font-size="15">T</text>
    <text x="205" y="184" fill="#7ee787" font-size="14">−mg sinθ</text>
  `,
);

const circuitSvg = svg(
  "Series battery resistor and capacitor circuit with current direction labelled",
  `
    <path d="M55 55 H145 M205 55 H300 V145 H55 V55" fill="none" stroke="#8b949e" stroke-width="4"/>
    <path d="M145 55 l10 -14 l10 28 l10 -28 l10 28 l10 -14 h10" fill="none" stroke="#ffa657" stroke-width="4"/>
    <line x1="45" y1="82" x2="65" y2="82" stroke="#7ee787" stroke-width="5"/>
    <line x1="38" y1="112" x2="72" y2="112" stroke="#7ee787" stroke-width="5"/>
    <line x1="292" y1="90" x2="308" y2="90" stroke="#79c0ff" stroke-width="5"/>
    <line x1="292" y1="112" x2="308" y2="112" stroke="#79c0ff" stroke-width="5"/>
    <line x1="95" y1="35" x2="130" y2="35" stroke="#ff7b72" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <text x="164" y="31" fill="#ffa657" font-size="16">R</text>
    <text x="315" y="106" fill="#79c0ff" font-size="16">C</text>
    <text x="82" y="27" fill="#ff7b72" font-size="16">I</text>
    <text x="18" y="103" fill="#7ee787" font-size="16">V</text>
  `,
);

const shadowSvg = svg(
  "Vertical stick, horizontal shadow and parallel Sun ray forming angle theta",
  `
    <line x1="35" y1="150" x2="330" y2="150" stroke="#8b949e" stroke-width="3"/>
    <line x1="120" y1="150" x2="120" y2="45" stroke="#fff" stroke-width="5"/>
    <line x1="120" y1="45" x2="285" y2="150" stroke="#ffd166" stroke-width="4" marker-end="url(#physics-derivation-arrow)"/>
    <line x1="120" y1="150" x2="285" y2="150" stroke="#d2a8ff" stroke-width="5"/>
    <path d="M120 105 A45 45 0 0 1 158 126" fill="none" stroke="#ff7b72" stroke-width="3"/>
    <text x="91" y="96" fill="#fff" font-size="16">h</text>
    <text x="198" y="173" fill="#d2a8ff" font-size="16">s</text>
    <text x="146" y="112" fill="#ff7b72" font-size="16">θ</text>
  `,
);

registerFormulaDerivations("kinematics", [
  {
    id: "constant-acceleration",
    title: "Deriving the constant-acceleration equations",
    equation: "v = v₀ + at; x = x₀ + v₀t + ½at²",
    startingPoint: "Acceleration is the rate of change of velocity: a = dv/dt, and velocity is the rate of change of position: v = dx/dt.",
    steps: [
      { expression: "∫v₀→v dv = ∫0→t a dt", reason: "Integrate acceleration: a is constant over the interval." },
      { expression: "v = v₀ + at", reason: "Apply the initial condition: velocity is v₀ at t = 0." },
      { expression: "x − x₀ = ∫0→t (v₀ + aτ)dτ", reason: "Integrate velocity: accumulated velocity gives displacement." },
      { expression: "x = x₀ + v₀t + ½at²", reason: "Evaluate the integral and apply x = x₀ at t = 0." },
    ],
    result: "Constant acceleration makes velocity linear in time and position quadratic in time.",
    assumptions: "Use in one dimension or component-by-component only while acceleration is constant and all signs use one consistent positive direction.",
    diagram: { description: "The same constant acceleration changes velocity while the object moves from x₀ to x(t).", svg: motionSvg },
  },
]);

registerFormulaDerivations("projectile-motion", [
  {
    id: "launch-impulse",
    title: "From launch impulse to average launcher force",
    equation: "J = Δp = mv₀; F̄net = J/Δt",
    startingPoint: "Impulse is the time integral of net force and equals the change in momentum: J = ∫Fnet dt = Δp.",
    steps: [
      { expression: "Δp = mv₀ − m(0) = mv₀", reason: "Momentum change: the projectile begins from rest and leaves with velocity v₀." },
      { expression: "J = mv₀", reason: "Impulse–momentum theorem: identify impulse with that momentum change." },
      { expression: "F̄net Δt = J", reason: "Average-force definition: replace the varying force by an equal-area constant force." },
      { expression: "F̄net = mv₀/Δt", reason: "Isolate average net force by dividing by the contact duration." },
    ],
    result: "A shorter launch time requires a larger average net force to create the same launch momentum.",
    assumptions: "The displayed mv₀ form assumes the projectile starts from rest; F̄ is an average over the contact interval, not the peak force.",
    diagram: { description: "Impulse is the area under the force–time graph during launch.", svg: impulseSvg },
  },
  {
    id: "projectile-motion-equations",
    title: "Deriving the projectile component equations",
    equation: "x = v₀cosθ·t; y = h₀ + v₀sinθ·t − ½gt²",
    startingPoint: "After release and without air resistance, Newton's second law gives ax = 0 and ay = −g.",
    steps: [
      { expression: "v₀x = v₀cosθ; v₀y = v₀sinθ", reason: "Resolve the launch velocity: cosine is adjacent and sine is opposite to θ." },
      { expression: "vx = v₀cosθ; vy = v₀sinθ − gt", reason: "Integrate acceleration: horizontal speed stays constant while vertical speed falls linearly." },
      { expression: "x = v₀cosθ·t", reason: "Integrate horizontal velocity from x = 0." },
      { expression: "y = h₀ + v₀sinθ·t − ½gt²", reason: "Integrate vertical velocity and apply the launch height h₀." },
    ],
    result: "A parabolic path is the combination of uniform horizontal motion and uniformly accelerated vertical motion.",
    assumptions: "Valid for uniform gravity, negligible air resistance, a stationary reference frame, and axes with upward positive.",
    diagram: { description: "The launch velocity splits into independent horizontal and vertical components while gravity acts downward.", svg: projectileSvg },
  },
  {
    id: "resultant-speed",
    title: "Combining velocity components into speed",
    equation: "|v| = √(vx² + vy²)",
    startingPoint: "Perpendicular velocity components form the legs of a right triangle whose hypotenuse is the velocity vector.",
    steps: [
      { expression: "|v|² = vx² + vy²", reason: "Apply Pythagoras to the horizontal and vertical component triangle." },
      { expression: "|v| = √(vx² + vy²)", reason: "Take the non-negative square root because speed is a magnitude." },
    ],
    result: "The component signs set direction, while their squared sum sets the speed.",
    assumptions: "The components must be perpendicular and expressed in the same velocity units.",
    diagram: { description: "The orange launch vector is the hypotenuse of its blue and red component triangle.", svg: projectileSvg },
  },
  {
    id: "level-ground-range",
    title: "Why level-ground range is R = v₀²sin(2θ)/g",
    equation: "R = v₀² sin(2θ) / g",
    startingPoint: "Use the projectile equations with equal launch and landing heights: y = v₀sinθ·t − ½gt² and x = v₀cosθ·t.",
    steps: [
      { expression: "0 = t(v₀sinθ − ½gt)", reason: "Landing condition: set vertical displacement to zero and factor out t." },
      { expression: "tflight = 2v₀sinθ/g", reason: "Choose the non-zero root corresponding to landing after launch." },
      { expression: "R = v₀cosθ · 2v₀sinθ/g", reason: "Substitute flight time into the horizontal position." },
      { expression: "R = v₀²sin(2θ)/g", reason: "Use the double-angle identity 2sinθcosθ = sin(2θ)." },
    ],
    result: "Range is greatest at 45° because sin(2θ) cannot exceed 1.",
    assumptions: "Launch and landing heights must match; gravity is uniform; air resistance, wind and terrain are neglected.",
    diagram: { description: "The range is the horizontal distance from launch to the level-ground landing point.", svg: projectileSvg },
  },
]);

registerFormulaDerivations("newtons-laws", [
  {
    id: "newton-acceleration",
    title: "Rearranging Newton's second law for acceleration",
    equation: "ΣF = ma → a = ΣF/m",
    startingPoint: "Newton's second law states that the vector sum of external forces on an object equals its mass times acceleration.",
    steps: [
      { expression: "ΣF = ma", reason: "Choose the object: include only external forces acting on that object." },
      { expression: "ΣFx = max; ΣFy = may", reason: "Resolve the vector law: apply it independently along perpendicular axes." },
      { expression: "a = ΣF/m", reason: "Isolate acceleration: divide the net-force equation by non-zero mass." },
    ],
    result: "Acceleration points with the net force, grows with force, and shrinks as mass increases.",
    assumptions: "Use in an inertial reference frame with constant mass and the vector sum of all external forces.",
    diagram: { description: "The free-body diagram supplies the external forces that must be summed before using ΣF = ma.", svg: forceSvg },
  },
  {
    id: "newton-velocity",
    title: "Deriving velocity under constant acceleration",
    equation: "v(t) = v₀ + at",
    startingPoint: "Acceleration is the time rate of change of velocity: a = dv/dt.",
    steps: [
      { expression: "dv = a dt", reason: "Separate increments: multiply the definition by dt." },
      { expression: "∫v₀→v dv = ∫0→t a dt", reason: "Accumulate change: integrate over the time interval." },
      { expression: "v − v₀ = at", reason: "Constant-acceleration step: take a outside the integral." },
      { expression: "v(t) = v₀ + at", reason: "Apply the initial condition and isolate the current velocity." },
    ],
    result: "A constant net force on constant mass produces a velocity that changes linearly with time.",
    assumptions: "Acceleration must remain constant over the interval; otherwise use v = v₀ + ∫a(t)dt.",
    diagram: { description: "A constant net force produces constant acceleration along the line of motion.", svg: motionSvg },
  },
  {
    id: "newton-force-components",
    title: "Resolving an angled force",
    equation: "Fx = F cosθ; Fy = F sinθ",
    startingPoint: "The force vector and its perpendicular components form a right triangle, with θ measured from the horizontal.",
    steps: [
      { expression: "cosθ = Fx/F", reason: "Adjacent-component step: cosine compares the horizontal side with the hypotenuse." },
      { expression: "Fx = Fcosθ", reason: "Horizontal result: multiply by the force magnitude F." },
      { expression: "sinθ = Fy/F", reason: "Opposite-component step: sine compares the vertical side with the hypotenuse." },
      { expression: "Fy = Fsinθ", reason: "Vertical result: multiply by F and apply the sign from the chosen direction." },
    ],
    result: "The two signed components can be summed with other forces along their own axes.",
    assumptions: "θ is measured from the horizontal; if measured from the vertical, sine and cosine exchange roles.",
    diagram: { description: "The applied force is resolved before it is combined with friction, weight and the normal force.", svg: forceSvg },
  },
  {
    id: "newton-impulse",
    title: "From Newton's second law to impulse",
    equation: "J = ∫Fnet dt = Δp",
    startingPoint: "Newton's second law in momentum form is Fnet = dp/dt.",
    steps: [
      { expression: "Fnet dt = dp", reason: "Differential step: multiply both sides by a small time interval." },
      { expression: "∫t₁→t₂ Fnet dt = ∫p₁→p₂ dp", reason: "Accumulation step: integrate force over the whole interaction." },
      { expression: "J = p₂ − p₁ = Δp", reason: "Definition step: name the force–time integral impulse and evaluate the momentum integral." },
    ],
    result: "The signed area under a net-force graph is exactly the object's momentum change.",
    assumptions: "Use net external force for the chosen object; for constant mass p = mv, but J = Δp also covers changing direction.",
    diagram: { description: "The shaded force–time area is the accumulated impulse.", svg: impulseSvg },
  },
]);

registerFormulaDerivations("momentum-impulse", [
  {
    id: "momentum-definition",
    title: "Why momentum is p = mv",
    equation: "p = mv",
    startingPoint: "Linear momentum is defined as mass multiplied by velocity so that Newton's law can be written Fnet = dp/dt for constant mass.",
    steps: [
      { expression: "p ≡ mv", reason: "Definition step: combine inertia m with directed motion v." },
      { expression: "dp/dt = d(mv)/dt = m·dv/dt", reason: "Constant-mass step: take m outside the derivative." },
      { expression: "dp/dt = ma = Fnet", reason: "Newton-law check: use a = dv/dt and Newton's second law." },
    ],
    result: "Momentum is a vector in the velocity direction with units kg·m/s.",
    assumptions: "This non-relativistic form assumes speeds far below the speed of light and uses a consistent reference frame.",
    diagram: { description: "A cart's directed velocity and mass together determine its directed momentum.", svg: motionSvg },
  },
  {
    id: "impulse-momentum",
    title: "Deriving J = FΔt = Δp",
    equation: "J = ∫Fdt = Δp; for constant F, J = FΔt",
    startingPoint: "Newton's second law in momentum form is Fnet = dp/dt.",
    steps: [
      { expression: "∫Fnet dt = ∫dp", reason: "Integrate the law: accumulate force and momentum change over the same interval." },
      { expression: "J = pfinal − pinitial = Δp", reason: "Name and evaluate: the force integral is impulse and the momentum integral is the endpoint difference." },
      { expression: "J = FΔt", reason: "Constant-force case: the graph area is a rectangle of height F and width Δt." },
    ],
    result: "Equal signed areas on force–time graphs produce equal momentum changes.",
    assumptions: "FΔt is exact only for constant force or when F denotes the interval's average net force.",
    diagram: { description: "For constant force, impulse is the rectangle's signed area FΔt.", svg: impulseSvg },
  },
  {
    id: "average-force",
    title: "Why a longer stopping time reduces average force",
    equation: "F̄ = Δp/Δt",
    startingPoint: "Average net force is defined to deliver the same impulse as the real time-varying force: F̄Δt = ∫Fdt.",
    steps: [
      { expression: "F̄Δt = J", reason: "Equal-area step: replace the force curve by a constant rectangle with the same impulse." },
      { expression: "F̄Δt = Δp", reason: "Impulse–momentum step: substitute J = Δp." },
      { expression: "F̄ = Δp/Δt", reason: "Isolation step: divide by the non-zero interaction time." },
    ],
    result: "For a fixed momentum change, doubling the stopping time halves the average net force.",
    assumptions: "This compares average net forces for the same Δp; it does not by itself determine the peak force.",
    diagram: { description: "The same impulse can be a tall narrow area or a short wide area.", svg: impulseSvg },
  },
]);

registerFormulaDerivations("universal-gravitation", [
  {
    id: "universal-gravitation",
    title: "Building Newton's universal gravitation law",
    equation: "F = Gm₁m₂/r²",
    startingPoint: "Newton combined the empirical inverse-square dependence of gravitational acceleration with Newton's second law F = ma.",
    steps: [
      { expression: "g(r) ∝ M/r²", reason: "Inverse-square observation: orbital and falling-body data show field strength falls with distance squared and grows with source mass." },
      { expression: "g(r) = GM/r²", reason: "Universal constant step: introduce G to turn proportionality into equality." },
      { expression: "F = m g(r)", reason: "Force step: a test mass m in a gravitational field has weight mg." },
      { expression: "F = GMm/r²", reason: "Substitution step: insert the field produced by M; relabel the two masses m₁ and m₂." },
    ],
    result: "Every pair of masses attracts with equal force magnitude along the line joining their centres.",
    assumptions: "Exact for point masses and spherically symmetric bodies outside them; r is centre-to-centre distance and relativistic strong-field effects are neglected.",
    diagram: { description: "The two masses exert equal and opposite attractions separated by centre-to-centre distance r.", svg: gravitySvg },
  },
]);

registerFormulaDerivations("moments", [
  {
    id: "moment-balance",
    title: "Deriving moment and rotational balance",
    equation: "τ = Fd⊥; equilibrium requires Στ = 0",
    startingPoint: "The vector definition of torque about a pivot is τ = r × F.",
    steps: [
      { expression: "|τ| = rFsinφ", reason: "Cross-product magnitude: φ is the angle between the position vector and force." },
      { expression: "d⊥ = r sinφ", reason: "Geometry step: identify the perpendicular distance from pivot to the force's line of action." },
      { expression: "|τ| = Fd⊥", reason: "Substitution step: replace r sinφ by the moment arm d⊥." },
      { expression: "Στ = 0", reason: "Equilibrium step: zero angular acceleration requires clockwise and anticlockwise moments to cancel." },
    ],
    result: "A smaller force can balance a larger one if it acts at a proportionally longer perpendicular distance.",
    assumptions: "Moments are taken about one pivot with a consistent sign convention; static balance also requires ΣF = 0.",
    diagram: { description: "Only the perpendicular lever arm d⊥ contributes to the turning effect.", svg: momentSvg },
  },
]);

registerFormulaDerivations("load-paths", [
  {
    id: "load-path-equilibrium",
    title: "Resolving cable tensions and enforcing equilibrium",
    equation: "Fx = Tcosθ; Fy = Tsinθ; ΣFx = ΣFy = 0",
    startingPoint: "A stationary knot has zero acceleration, so Newton's second law requires the vector sum of forces to be zero.",
    steps: [
      { expression: "TLcosθL = TRcosθR", reason: "Horizontal balance: left and right cable components must be equal and opposite." },
      { expression: "TLsinθL + TRsinθR = W", reason: "Vertical balance: upward cable components must equal the downward weight." },
      { expression: "T = W/(2sinθ)", reason: "Symmetric case: set TL = TR = T and θL = θR = θ, then isolate T." },
    ],
    result: "The two equilibrium equations determine the cable tensions and show why shallow cables create very large tension.",
    assumptions: "The knot is static, cables are massless and carry pure tension, and θ is measured above the horizontal.",
    diagram: { description: "Horizontal tension components cancel; vertical components add to the supported weight.", svg: cableSvg },
  },
]);

registerFormulaDerivations("pulleys", [
  {
    id: "pulley-mechanical-advantage",
    title: "Deriving ideal pulley force and distance ratios",
    equation: "nT = W; Fideal = W/n; pull distance = nh; Freal = W/(nη)",
    startingPoint: "An ideal massless rope has one tension T throughout, and the moving block is supported by n rope segments.",
    steps: [
      { expression: "ΣFy = nT − W = 0", reason: "Force-balance step: a steady or stationary load has zero vertical acceleration." },
      { expression: "T = W/n and F = T", reason: "Effort step: solve the balance and use the free rope end's force equals rope tension." },
      { expression: "nΔℓsupport + Δℓpull = 0", reason: "Length-constraint step: total rope length cannot change." },
      { expression: "pull distance = nh", reason: "Distance step: raising the block by h shortens each of n supporting segments by h." },
      { expression: "η = Wh/(F·nh) → F = W/(nη)", reason: "Efficiency step: compare useful output work with actual input work and isolate the real effort." },
    ],
    result: "An ideal pulley trades force for distance by the same factor n, so input work still equals output work.",
    assumptions: "Rope and pulleys are massless, the rope does not stretch or slip, axle friction is negligible, and n counts only strands supporting the moving block.",
    diagram: { description: "Four equal strand tensions add upward to support the load weight.", svg: pulleySvg },
  },
]);

registerFormulaDerivations("atwood-machine", [
  {
    id: "atwood-equations",
    title: "Deriving Atwood-machine acceleration and tension",
    equation: "a = (mB − mA)g/(mA + mB); T = 2mAmBg/(mA + mB)",
    startingPoint: "Apply Newton's second law separately to each mass, using one rope constraint so both accelerations have equal magnitude.",
    steps: [
      { expression: "mBg − T = mBa", reason: "Mass-B equation: choose downward as positive on the heavier side." },
      { expression: "T − mAg = mAa", reason: "Mass-A equation: upward is positive for the linked lighter side." },
      { expression: "(mB − mA)g = (mA + mB)a", reason: "System step: add the equations so the internal tension cancels." },
      { expression: "a = (mB − mA)g/(mA + mB)", reason: "Acceleration step: divide by the total moving mass." },
      { expression: "T = mA(g + a) = 2mAmBg/(mA + mB)", reason: "Tension step: substitute a into either individual mass equation." },
    ],
    result: "The weight difference drives the combined inertia, while one common tension links the two masses.",
    assumptions: "The rope and pulley are massless, the rope is inextensible, the axle is frictionless, and the rope does not slip.",
    diagram: { description: "The rope constraint gives the masses equal and opposite acceleration magnitudes.", svg: atwoodSvg },
  },
]);

registerFormulaDerivations("collisions", [
  {
    id: "collision-outcomes",
    title: "Solving a one-dimensional collision",
    equation: "m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂; v₂ − v₁ = e(u₁ − u₂)",
    startingPoint: "With negligible external impulse, total momentum is conserved; restitution defines the ratio of separation speed to approach speed.",
    steps: [
      { expression: "m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂", reason: "Momentum equation: internal collision impulses cancel for the two-cart system." },
      { expression: "v₂ − v₁ = e(u₁ − u₂)", reason: "Restitution equation: relate relative speed after impact to relative speed before impact." },
      { expression: "v₁ = [m₁u₁ + m₂u₂ − m₂e(u₁ − u₂)]/(m₁ + m₂)", reason: "First solution step: substitute v₂ = v₁ + e(u₁ − u₂) into momentum conservation." },
      { expression: "v₂ = [m₁u₁ + m₂u₂ + m₁e(u₁ − u₂)]/(m₁ + m₂)", reason: "Second solution step: use the restitution relation to recover the other final velocity." },
    ],
    result: "Momentum conservation plus restitution uniquely determines both final velocities in a one-dimensional impact.",
    assumptions: "Motion is along one line, masses are constant, external impulse during impact is negligible, and 0 ≤ e ≤ 1 for the displayed model.",
    diagram: { description: "Signed approach and separation velocities are measured along the same track.", svg: collisionSvg },
  },
]);

registerFormulaDerivations("stress-strain", [
  {
    id: "stress-strain",
    title: "Combining stress, strain and Hooke's law",
    equation: "σ = F/A; ε = ΔL/L₀; σ = Eε → ΔL = FL₀/(AE)",
    startingPoint: "Normal stress is force per cross-sectional area, engineering strain is fractional length change, and linear elasticity defines Young's modulus E = σ/ε.",
    steps: [
      { expression: "σ = F/A", reason: "Stress definition: distribute the axial force over the original cross-section." },
      { expression: "ε = ΔL/L₀", reason: "Strain definition: compare elongation with original length." },
      { expression: "F/A = E(ΔL/L₀)", reason: "Elastic-law step: substitute both definitions into σ = Eε." },
      { expression: "ΔL = FL₀/(AE)", reason: "Elongation step: rearrange for the length change." },
    ],
    result: "Elongation grows with force and original length, and shrinks with area and Young's modulus.",
    assumptions: "Valid only for small, uniform, uniaxial deformation within the material's linear elastic region.",
    diagram: { description: "The tensile force stretches a bar of original length L₀ and area A by ΔL.", svg: stressSvg },
  },
]);

registerFormulaDerivations("pendulum", [
  {
    id: "pendulum-small-period",
    title: "Deriving the small-angle pendulum period",
    equation: "T₀ = 2π√(L/g)",
    startingPoint: "Newton's second law along the arc gives mLθ″ = −mg sinθ.",
    steps: [
      { expression: "θ″ = −(g/L)sinθ", reason: "Cancel-mass step: divide the tangential force equation by mL." },
      { expression: "θ″ ≈ −(g/L)θ", reason: "Small-angle step: use sinθ ≈ θ when θ is in radians." },
      { expression: "ω² = g/L", reason: "SHM identification: compare with θ″ = −ω²θ." },
      { expression: "T₀ = 2π/ω = 2π√(L/g)", reason: "Period step: one sinusoidal cycle spans 2π radians of phase." },
    ],
    result: "For small swings, period depends on length and gravity but not bob mass or amplitude.",
    assumptions: "Small angular amplitude in radians, point-like bob, massless rigid support, uniform gravity and negligible damping.",
    diagram: { description: "The tangential component of gravity supplies the restoring force; tension is radial.", svg: pendulumSvg },
  },
  {
    id: "pendulum-exact-period",
    title: "Deriving the exact large-angle period integral",
    equation: "T = 4√(L/g) K(sin(θ₀/2))",
    startingPoint: "Conservation of mechanical energy equates the release potential energy with potential plus kinetic energy at angle θ.",
    steps: [
      { expression: "½mL²θ′² = mgL(cosθ − cosθ₀)", reason: "Energy step: subtract the current gravitational potential from its release value." },
      { expression: "dt = √(L/2g) dθ/√(cosθ − cosθ₀)", reason: "Time-element step: solve the energy equation for dt." },
      { expression: "T = 4√(L/2g) ∫₀^θ₀ dθ/√(cosθ − cosθ₀)", reason: "Symmetry step: integrate one quarter swing and multiply by four." },
      { expression: "T = 4√(L/g)K(sin(θ₀/2))", reason: "Elliptic-integral step: substitute sin(θ/2) = sin(θ₀/2)sinφ." },
    ],
    result: "The exact period grows with release amplitude and approaches 2π√(L/g) as θ₀ approaches zero.",
    assumptions: "Ideal undamped pendulum in uniform gravity; θ₀ is below π so the bob swings rather than passing over the pivot.",
    diagram: { description: "Large-angle timing follows from the bob's energy as it moves along the circular arc.", svg: pendulumSvg },
  },
  {
    id: "pendulum-arc-kinematics",
    title: "From angular motion to arc speed and acceleration",
    equation: "s = Lθ; v = Lθ′; at = Lθ″",
    startingPoint: "Radian measure is defined by arc length divided by radius: θ = s/L.",
    steps: [
      { expression: "s = Lθ", reason: "Geometry step: multiply the radian definition by the fixed radius L." },
      { expression: "v = ds/dt = L dθ/dt = Lθ′", reason: "Velocity step: differentiate arc length once; L is constant." },
      { expression: "at = dv/dt = L d²θ/dt² = Lθ″", reason: "Tangential-acceleration step: differentiate the tangential speed again." },
    ],
    result: "Angular rate and angular acceleration become tangential linear quantities by multiplying by pendulum length.",
    assumptions: "L is constant and θ is measured in radians; this gives tangential acceleration, not the separate radial centripetal component.",
    diagram: { description: "The bob is constrained to a circular arc of radius L.", svg: pendulumSvg },
  },
  {
    id: "pendulum-nonlinear-equation",
    title: "Deriving the exact pendulum equation of motion",
    equation: "θ″ = −(g/L)sinθ",
    startingPoint: "The tangential component of weight is −mg sinθ, while tangential acceleration is Lθ″.",
    steps: [
      { expression: "ΣFt = −mg sinθ", reason: "Force-resolution step: tension has no tangential component and gravity restores toward θ = 0." },
      { expression: "m(Lθ″) = −mg sinθ", reason: "Newton-law step: set tangential net force equal to mass times tangential acceleration." },
      { expression: "θ″ = −(g/L)sinθ", reason: "Cancellation step: divide by mL." },
    ],
    result: "Mass cancels, but the sine term makes the exact equation nonlinear.",
    assumptions: "Point bob, fixed length, uniform gravity, no pivot friction or air drag; θ is measured from downward vertical.",
    diagram: { description: "Only the green tangential component of gravity changes the bob's speed along the arc.", svg: pendulumSvg },
  },
  {
    id: "pendulum-small-angle-equation",
    title: "Linearising the pendulum equation",
    equation: "θ″ = −(g/L)θ",
    startingPoint: "The exact equation is θ″ = −(g/L)sinθ and the sine Taylor series begins sinθ = θ − θ³/6 + ….",
    steps: [
      { expression: "sinθ = θ − θ³/6 + O(θ⁵)", reason: "Series step: expand sine about the stable equilibrium θ = 0." },
      { expression: "sinθ ≈ θ", reason: "Small-angle step: neglect cubic and higher powers when |θ| is much less than one radian." },
      { expression: "θ″ ≈ −(g/L)θ", reason: "Linearisation step: substitute the leading term into the exact equation." },
    ],
    result: "The restoring acceleration becomes proportional to displacement, producing simple harmonic motion.",
    assumptions: "θ must be in radians and small enough that the omitted θ³/6 term is acceptable for the required accuracy.",
    diagram: { description: "Near the bottom of the swing, the tangential restoring force is nearly proportional to θ.", svg: pendulumSvg },
  },
  {
    id: "pendulum-shm-period",
    title: "Reading period from the SHM equation",
    equation: "θ″ = −ω²θ → T = 2π/ω",
    startingPoint: "Simple harmonic motion is any motion satisfying q″ = −ω²q.",
    steps: [
      { expression: "θ(t) = θ₀cos(ωt + φ)", reason: "Solution step: a cosine has a second derivative equal to −ω² times itself." },
      { expression: "ωT = 2π", reason: "Cycle step: one period advances the phase by one full turn." },
      { expression: "T = 2π/ω", reason: "Isolation step: divide the phase condition by angular frequency." },
      { expression: "T = 2π√(L/g)", reason: "Pendulum step: substitute ω = √(g/L)." },
    ],
    result: "The coefficient of displacement in the linear equation directly fixes the oscillation period.",
    assumptions: "The equation must be linear SHM with constant ω; damping and large-angle nonlinearity change the timing.",
    diagram: { description: "Small oscillations repeat after the phase advances through 2π.", svg: pendulumSvg },
  },
  {
    id: "pendulum-multiple-swings",
    title: "Timing several identical swings",
    equation: "ttotal = NT",
    startingPoint: "Period T is defined as the time for one complete repeated cycle.",
    steps: [
      { expression: "t₁ = T, t₂ = T, …, tN = T", reason: "Equal-cycle step: each of N identical cycles takes one period." },
      { expression: "ttotal = Σᵢ₌₁ᴺ ti", reason: "Elapsed-time step: total time is the sum of cycle durations." },
      { expression: "ttotal = NT", reason: "Repeated-term step: the sum contains N equal periods." },
    ],
    result: "Counting many cycles and dividing by N is also a practical way to measure one period more accurately.",
    assumptions: "The period must remain constant across the counted swings; damping or changing amplitude can violate this.",
    diagram: { description: "Each complete there-and-back swing contributes one equal period T.", svg: pendulumSvg },
  },
  {
    id: "pendulum-sine-series",
    title: "Deriving the small-angle sine approximation",
    equation: "sinθ = θ − θ³/6 + θ⁵/120 − … ≈ θ",
    startingPoint: "Taylor's theorem expands a smooth function around zero using its derivatives there.",
    steps: [
      { expression: "sinθ = sin0 + cos0·θ − sin0·θ²/2! − cos0·θ³/3! + …", reason: "Taylor step: insert successive sine derivatives evaluated at zero." },
      { expression: "sinθ = θ − θ³/3! + θ⁵/5! − …", reason: "Derivative-value step: use sin0 = 0 and cos0 = 1." },
      { expression: "sinθ ≈ θ", reason: "Leading-term step: for |θ| ≪ 1, cubic and higher powers are much smaller than θ." },
    ],
    result: "The first omitted relative correction is approximately θ²/6, which quantifies when the approximation fails.",
    assumptions: "θ is dimensionless and therefore measured in radians; the approximation is local to θ = 0.",
  },
]);

registerFormulaDerivations("electrical-circuits", [
  {
    id: "rc-response",
    title: "Deriving RC charging and discharging",
    equation: "τ = RC; VCcharge = V(1 − e^(−t/RC)); VCdischarge = V₀e^(−t/RC)",
    startingPoint: "Kirchhoff's loop law, Ohm's law VR = IR, capacitor charge Q = CVC, and current I = dQ/dt govern the series circuit.",
    steps: [
      { expression: "V = IR + VC = RC·dVC/dt + VC", reason: "Charging equation: substitute I = C dVC/dt into the loop voltage sum." },
      { expression: "dVC/(V − VC) = dt/(RC)", reason: "Separation step: isolate voltage and time increments." },
      { expression: "VC = V(1 − e^(−t/RC))", reason: "Charging solution: integrate and apply VC(0) = 0." },
      { expression: "0 = RC·dVC/dt + VC → VC = V₀e^(−t/RC)", reason: "Discharging solution: remove the battery and apply VC(0) = V₀." },
      { expression: "τ = RC", reason: "Time-constant step: identify the denominator controlling exponential decay." },
    ],
    result: "After one time constant, charging reaches 1 − e⁻¹ ≈ 63% and discharging retains e⁻¹ ≈ 37%.",
    assumptions: "Ideal linear resistor and capacitor, instantaneous switch, constant source voltage, and negligible wire/internal resistance.",
    diagram: { description: "Kirchhoff's loop law around the series resistor–capacitor circuit produces the differential equation.", svg: circuitSvg },
  },
]);

registerFormulaDerivations("shadows-earth-size", [
  {
    id: "shadow-earth-size",
    title: "From a stick shadow to Earth's circumference",
    equation: "θ = atan(s/h); C = d·360°/θ",
    startingPoint: "The vertical stick and horizontal shadow form a right triangle, and parallel Sun rays transfer the measured angle to Earth's centre.",
    steps: [
      { expression: "tanθ = s/h", reason: "Triangle step: tangent is opposite side s divided by adjacent side h." },
      { expression: "θ = atan(s/h)", reason: "Angle step: apply inverse tangent to recover the measured angle." },
      { expression: "d/C = θ/360°", reason: "Circle-fraction step: the city arc is the same fraction of circumference as its central angle is of a full turn." },
      { expression: "C = d·360°/θ", reason: "Scale-up step: rearrange for the full circumference." },
    ],
    result: "One local shadow measurement and one known surface distance estimate the size of the whole Earth.",
    assumptions: "Sun rays are effectively parallel, sticks are local verticals, measurements are simultaneous, city distance follows the same great-circle arc, and Earth is approximated as a sphere.",
    diagram: { description: "The stick and shadow determine θ; parallel rays transfer that angle to Earth's centre.", svg: shadowSvg },
  },
]);
