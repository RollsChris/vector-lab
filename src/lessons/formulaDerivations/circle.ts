import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const circleSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Circle with a radius and diameter">
    <circle cx="150" cy="90" r="65" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="150" y1="90" x2="215" y2="90" stroke="#ffd166" stroke-width="3"/>
    <line x1="85" y1="90" x2="215" y2="90" stroke="#7ee787" stroke-width="2"/>
    <circle cx="150" cy="90" r="4" fill="#ff7b72"/>
    <text x="177" y="82" fill="#ffd166" font-size="16">r</text>
    <text x="137" y="112" fill="#7ee787" font-size="16">d = 2r</text>
  </svg>`;

const sectorSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Sector with radius, central angle and arc">
    <path d="M150 100 L235 100 A85 85 0 0 0 193 26 Z" fill="#d2a8ff33" stroke="#d2a8ff" stroke-width="3"/>
    <line x1="150" y1="100" x2="235" y2="100" stroke="#ffd166" stroke-width="2"/>
    <line x1="150" y1="100" x2="193" y2="26" stroke="#ffd166" stroke-width="2"/>
    <path d="M180 100 A30 30 0 0 0 165 74" fill="none" stroke="#7ee787" stroke-width="2"/>
    <text x="181" y="88" fill="#7ee787" font-size="16">θ</text>
    <text x="213" y="66" fill="#d2a8ff" font-size="16">arc s</text>
    <text x="190" y="116" fill="#ffd166" font-size="16">r</text>
  </svg>`;

const areaSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Circle sectors rearranged into an approximate rectangle">
    <circle cx="82" cy="90" r="58" fill="#58a6ff22" stroke="#58a6ff" stroke-width="3"/>
    <path d="M82 90 L82 32 M82 90 L123 49 M82 90 L140 90 M82 90 L123 131 M82 90 L82 148 M82 90 L41 131 M82 90 L24 90 M82 90 L41 49" stroke="#d2a8ff" stroke-width="2"/>
    <path d="M170 48 h120 v84 h-120z" fill="#58a6ff22" stroke="#7ee787" stroke-width="3"/>
    <text x="208" y="42" fill="#ffd166" font-size="16">πr</text>
    <text x="145" y="95" fill="#ffd166" font-size="16">r</text>
    <text x="188" y="98" fill="#7ee787" font-size="16">area = πr × r</text>
  </svg>`;

const inscribedAngleSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Central angle theta and inscribed angle theta over two on the same arc">
    <circle cx="150" cy="95" r="65" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="150" y1="95" x2="215" y2="95" stroke="#ffd166" stroke-width="2"/>
    <line x1="150" y1="95" x2="183" y2="39" stroke="#ffd166" stroke-width="2"/>
    <line x1="215" y1="95" x2="102" y2="139" stroke="#7ee787" stroke-width="2"/>
    <line x1="183" y1="39" x2="102" y2="139" stroke="#7ee787" stroke-width="2"/>
    <path d="M180 95 A30 30 0 0 0 165 69" fill="none" stroke="#d2a8ff" stroke-width="2"/>
    <text x="177" y="84" fill="#d2a8ff" font-size="16">θ</text>
    <text x="116" y="123" fill="#7ee787" font-size="16">θ/2</text>
    <text x="220" y="90" fill="#ff7b72" font-size="16">A</text>
    <text x="184" y="31" fill="#ff7b72" font-size="16">B</text>
    <text x="92" y="151" fill="#ff7b72" font-size="16">P</text>
  </svg>`;

const chordSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Chord split into two equal halves by a perpendicular radius">
    <circle cx="150" cy="90" r="70" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="102" y1="39" x2="198" y2="39" stroke="#7ee787" stroke-width="3"/>
    <line x1="150" y1="90" x2="150" y2="39" stroke="#ffd166" stroke-width="3"/>
    <line x1="150" y1="90" x2="198" y2="39" stroke="#ffd166" stroke-width="2"/>
    <path d="M150 47 h8 v-8" fill="none" stroke="#ff7b72" stroke-width="2"/>
    <text x="171" y="67" fill="#ffd166" font-size="16">r</text>
    <text x="158" y="31" fill="#7ee787" font-size="16">c / 2</text>
    <text x="159" y="82" fill="#d2a8ff" font-size="16">θ / 2</text>
  </svg>`;

const lineCircleSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Horizontal line crossing a coordinate circle at two points">
    <line x1="35" y1="135" x2="290" y2="135" stroke="#8b949e" stroke-width="2"/>
    <line x1="160" y1="160" x2="160" y2="20" stroke="#8b949e" stroke-width="2"/>
    <circle cx="160" cy="90" r="55" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="55" y1="60" x2="265" y2="60" stroke="#ffa657" stroke-width="3"/>
    <circle cx="114" cy="60" r="4" fill="#ff7b72"/><circle cx="206" cy="60" r="4" fill="#ff7b72"/>
    <text x="230" y="52" fill="#ffa657" font-size="16">y = k</text>
    <text x="166" y="82" fill="#ffd166" font-size="16">r</text>
  </svg>`;

const tangentSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="External point with tangent to a circle and perpendicular radius">
    <circle cx="120" cy="95" r="60" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="270" y1="95" x2="144" y2="40" stroke="#ffa657" stroke-width="3"/>
    <line x1="120" y1="95" x2="144" y2="40" stroke="#ffd166" stroke-width="3"/>
    <line x1="120" y1="95" x2="270" y2="95" stroke="#8b949e" stroke-width="2"/>
    <circle cx="270" cy="95" r="4" fill="#ff7b72"/>
    <path d="M142 48 h8 v8" fill="none" stroke="#7ee787" stroke-width="2"/>
    <text x="276" y="90" fill="#ff7b72" font-size="16">P</text>
    <text x="185" y="60" fill="#ffa657" font-size="16">PT</text>
    <text x="180" y="108" fill="#8b949e" font-size="16">OP</text>
  </svg>`;

const twoCirclesSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Two intersecting circles with centres separated by distance d">
    <circle cx="120" cy="95" r="62" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <circle cx="202" cy="95" r="44" fill="none" stroke="#d2a8ff" stroke-width="3"/>
    <line x1="120" y1="95" x2="202" y2="95" stroke="#8b949e" stroke-width="2"/>
    <line x1="164" y1="51" x2="164" y2="139" stroke="#7ee787" stroke-width="2"/>
    <circle cx="164" cy="51" r="4" fill="#ff7b72"/><circle cx="164" cy="139" r="4" fill="#ff7b72"/>
    <text x="154" y="87" fill="#8b949e" font-size="16">d</text>
    <text x="168" y="76" fill="#7ee787" font-size="16">h</text>
    <text x="112" y="113" fill="#ffd166" font-size="16">O₁</text>
    <text x="194" y="113" fill="#ffd166" font-size="16">O₂</text>
  </svg>`;

registerFormulaDerivations("circle-calculations", [
  {
    id: "circle-area",
    title: "Why circle area is A = πr²",
    equation: "A = πr²",
    startingPoint: "Split a circle into many thin equal sectors, then alternate them point-up and point-down.",
    steps: [
      { expression: "combined curved edges = 2πr", reason: "All sector arcs together make one circumference." },
      { expression: "rectangle-like base = πr", reason: "Alternating sectors place half the circumference along each long edge." },
      { expression: "height = r", reason: "Each thin sector runs from the centre to the circumference." },
      { expression: "A = base × height = πr × r = πr²", reason: "As the sectors become thinner, the rearrangement approaches a rectangle exactly." },
    ],
    result: "The circle's area is its radius squared, scaled by π.",
    assumptions: "This is a limiting argument: finitely many sectors make a serrated shape, which tends to a rectangle as their number increases.",
    diagram: { description: "Alternating many narrow sectors makes a rectangle-like shape with base πr and height r.", svg: areaSvg },
  },
  {
    id: "circumference",
    title: "Why circumference is C = 2πr",
    equation: "C = 2πr",
    startingPoint: "The circumference-to-diameter ratio is the same for every circle: C / d = π.",
    steps: [
      { expression: "C = πd", reason: "Multiply both sides of C / d = π by the diameter d." },
      { expression: "d = 2r", reason: "A diameter contains two radii placed end to end." },
      { expression: "C = π(2r) = 2πr", reason: "Substitute the diameter in terms of radius." },
    ],
    result: "Knowing either radius or diameter is enough to find the distance once around a circle.",
    assumptions: "This is a Euclidean circle; use the same length unit for C, d and r.",
    diagram: { description: "The diameter passes through the centre and is exactly two radii.", svg: circleSvg },
  },
  {
    id: "inscribed-angle",
    title: "Why an inscribed angle is half the central angle",
    equation: "∠APB = ½∠AOB",
    startingPoint: "Both angles intercept the same arc AB, but the central angle uses two radii while the inscribed angle uses two chords.",
    steps: [
      { expression: "OA = OP and OB = OP", reason: "All are radii, so triangles OAP and OBP are isosceles." },
      { expression: "base angles in each isosceles triangle are equal", reason: "Equal sides face equal angles." },
      { expression: "∠AOB = 2∠APB", reason: "Adding the two triangle angle sums cancels the angles at O and leaves the central angle twice the angle at P." },
      { expression: "∠APB = ½∠AOB", reason: "Divide both sides by two." },
    ],
    result: "Any point P on the remaining arc sees the same chord AB at half the angle seen from the centre.",
    assumptions: "P must lie on the opposite arc from the intercepted arc AB; a diameter gives the special 90° semicircle case.",
    diagram: { description: "The central and inscribed angles intercept the same endpoints A and B.", svg: inscribedAngleSvg },
  },
  {
    id: "arc-length",
    title: "Why arc length is s = rθ",
    equation: "s = rθ, with θ in radians",
    startingPoint: "An arc is the same fraction of the circumference as its central angle is of a full turn.",
    steps: [
      { expression: "full turn: 2π radians ↔ 2πr units", reason: "One complete revolution measures 2π radians and travels one circumference." },
      { expression: "s = (θ / 2π) × 2πr", reason: "The angle θ is θ/(2π) of the full turn, so take that same fraction of the full circumference." },
      { expression: "s = rθ", reason: "The 2π factors cancel. This is why radians, not degrees, make the formula short." },
      { expression: "θrad = θ° × π / 180", reason: "Use this conversion first if the given angle is in degrees." },
    ],
    result: "Radians are the natural angle unit because they make arc length a direct radius-times-angle calculation.",
    assumptions: "θ must be measured in radians in s = rθ; degrees require the fraction-of-a-turn form.",
    diagram: { description: "The central angle selects the same fraction of the arc as it does of the whole circle.", svg: sectorSvg },
  },
  {
    id: "chord-length",
    title: "Why chord length is c = 2r sin(θ/2)",
    equation: "c = 2r sin(θ/2)",
    startingPoint: "The perpendicular from a circle's centre to a chord bisects that chord and its central angle.",
    steps: [
      { expression: "sin(θ/2) = (c/2) / r", reason: "Use sine in either of the two congruent right triangles." },
      { expression: "c/2 = r sin(θ/2)", reason: "Multiply both sides by r." },
      { expression: "c = 2r sin(θ/2)", reason: "Double the half-chord." },
    ],
    result: "The chord is a straight shortcut between arc endpoints; it is always no longer than the corresponding arc.",
    assumptions: "θ is the smaller central angle between the chord endpoints.",
    diagram: { description: "The radius perpendicular to a chord creates two equal right triangles.", svg: chordSvg },
  },
  {
    id: "sector-segment",
    title: "Why sector and segment areas use these formulas",
    equation: "Asector = ½r²θ; Asegment = Asector − ½r²sinθ",
    startingPoint: "A sector is θ/(2π) of the whole circle, and a segment is the sector with its central triangle removed.",
    steps: [
      { expression: "Asector = (θ / 2π) × πr²", reason: "Take θ/(2π) of the full circle area; θ is in radians." },
      { expression: "Asector = ½r²θ", reason: "Cancel π from numerator and denominator." },
      { expression: "Atriangle = ½r²sinθ", reason: "Use the two-side-and-included-angle triangle-area formula." },
      { expression: "Asegment = Asector − Atriangle", reason: "Remove the triangle from the sector to leave the curved cap." },
    ],
    result: "Sector area includes the centre; segment area is bounded only by a chord and its arc.",
    assumptions: "For a minor segment, use the smaller sector and its included triangle.",
    diagram: { description: "The segment is the shaded sector after the isosceles triangle between the two radii is removed.", svg: sectorSvg },
  },
  {
    id: "line-circle",
    title: "How substitution finds line-circle intersections",
    equation: "x² + y² = r² and y = k",
    startingPoint: "An intersection must satisfy the equation of both the circle and the line.",
    steps: [
      { expression: "x² + k² = r²", reason: "Replace y with k in the circle equation." },
      { expression: "x² = r² − k²", reason: "Subtract k² from both sides." },
      { expression: "x = ±√(r² − k²)", reason: "Take both square roots: left and right points have opposite x-values." },
    ],
    result: "A positive radicand gives two intersections, zero gives a tangent, and a negative value means the line misses the circle.",
    assumptions: "The displayed derivation uses a circle centred at the origin and a horizontal line; translate or substitute y = mx + c for the general case.",
    diagram: { description: "The two red points satisfy both the circle and horizontal-line equations.", svg: lineCircleSvg },
  },
  {
    id: "circle-intersections",
    title: "How two-circle intersections are calculated",
    equation: "x = (d² + r₁² − r₂²)/(2d), then y = ±√(r₁² − x²)",
    startingPoint: "Place the first centre at (0, 0) and the second at (d, 0). Any crossing point lies on both circles.",
    steps: [
      { expression: "x² + y² = r₁²", reason: "This is the equation of the first circle." },
      { expression: "(x − d)² + y² = r₂²", reason: "This is the equation of the second circle." },
      { expression: "x = (d² + r₁² − r₂²)/(2d)", reason: "Subtract the equations to eliminate y², then solve the remaining linear equation." },
      { expression: "y = ±√(r₁² − x²)", reason: "Substitute x back into the first circle; the plus and minus give the upper and lower crossing points." },
    ],
    result: "The circles meet when |r₁ − r₂| ≤ d ≤ r₁ + r₂. Equality gives one tangent point; strict inequalities give two.",
    assumptions: "The coordinate placement is chosen for convenience; translating or rotating the diagram does not change distances or intersection count.",
    diagram: { description: "Subtracting the two circle equations locates the common vertical chord; Pythagoras then gives its height h.", svg: twoCirclesSvg },
  },
  {
    id: "tangent-power",
    title: "Why tangent length is PT² = OP² − r²",
    equation: "PT² = OP² − r²",
    startingPoint: "A radius to a tangent point is perpendicular to the tangent, making triangle OPT right-angled at T.",
    steps: [
      { expression: "OP² = OT² + PT²", reason: "Apply Pythagoras to right triangle OPT." },
      { expression: "OT = r", reason: "T lies on the circle, so OT is a radius." },
      { expression: "PT² = OP² − r²", reason: "Rearrange to isolate the tangent length." },
    ],
    result: "This same value is the power of P and equals external-secant length multiplied by whole-secant length.",
    assumptions: "P must lie outside the circle; otherwise there is no real tangent segment from P.",
    diagram: { description: "The right-angle mark shows why Pythagoras applies to the tangent construction.", svg: tangentSvg },
  },
]);
