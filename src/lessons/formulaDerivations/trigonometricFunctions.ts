import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const unitCircleSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Radius R at angle phi with horizontal component x and vertical component y">
    <circle cx="145" cy="95" r="72" fill="none" stroke="#8b949e" stroke-width="2"/>
    <line x1="145" y1="95" x2="204" y2="54" stroke="#fff" stroke-width="3"/>
    <line x1="145" y1="95" x2="204" y2="95" stroke="#58a6ff" stroke-width="3"/>
    <line x1="204" y1="95" x2="204" y2="54" stroke="#ff5d5d" stroke-width="3"/>
    <path d="M194 95 v-10 h10" fill="none" stroke="#ffd166" stroke-width="2"/>
    <path d="M171 95 A26 26 0 0 0 166 80" fill="none" stroke="#ffd166" stroke-width="2"/>
    <text x="171" y="87" fill="#ffd166" font-size="16">φ</text><text x="172" y="113" fill="#58a6ff" font-size="16">x</text>
    <text x="211" y="78" fill="#ff5d5d" font-size="16">y</text><text x="169" y="67" fill="#fff" font-size="16">R</text>
  </svg>`;

const tangentTriangleSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Original right triangle and a larger similar tangent triangle">
    <line x1="55" y1="140" x2="255" y2="140" stroke="#8b949e" stroke-width="2"/>
    <line x1="55" y1="140" x2="170" y2="55" stroke="#fff" stroke-width="3"/>
    <line x1="170" y1="55" x2="255" y2="170" stroke="#ffa657" stroke-width="3"/>
    <line x1="170" y1="55" x2="170" y2="140" stroke="#ff5d5d" stroke-width="3"/>
    <path d="M160 140 v-10 h10" fill="none" stroke="#ffd166" stroke-width="2"/>
    <path d="M164 63 l8 6 6-8" fill="none" stroke="#7ee787" stroke-width="2"/>
    <text x="45" y="157" fill="#fff" font-size="16">O</text><text x="173" y="48" fill="#fff" font-size="16">P</text>
    <text x="174" y="158" fill="#fff" font-size="16">H</text>
  </svg>`;

registerFormulaDerivations("trig-functions", [
  {
    id: "sine",
    title: "Why sine is the vertical component divided by radius",
    equation: "sin φ = y/R",
    startingPoint: "Drop a perpendicular from the endpoint of a radius R to the x-axis.",
    steps: [
      { expression: "opposite side = y; hypotenuse = R", reason: "The vertical projection is the signed height and the radius is the right triangle's hypotenuse." },
      { expression: "sin φ = opposite/hypotenuse", reason: "Similar right triangles make this ratio depend only on φ, defining sine." },
      { expression: "sin φ = y/R", reason: "Substitute the named sides." },
    ],
    result: "The endpoint's vertical coordinate is y = R sin φ.",
    assumptions: "R > 0; y is a directed coordinate, so its sign handles quadrants.",
    diagram: { description: "The vertical leg y is opposite φ in the radius triangle.", svg: unitCircleSvg },
  },
  {
    id: "cosine",
    title: "Why cosine is the horizontal component divided by radius",
    equation: "cos φ = x/R",
    startingPoint: "Use the same radius triangle and its horizontal projection.",
    steps: [
      { expression: "adjacent side = x; hypotenuse = R", reason: "The horizontal projection lies beside φ and the radius is opposite the right angle." },
      { expression: "cos φ = adjacent/hypotenuse", reason: "Similar right triangles make this ratio depend only on φ, defining cosine." },
      { expression: "cos φ = x/R", reason: "Substitute the named sides." },
    ],
    result: "The endpoint's horizontal coordinate is x = R cos φ.",
    assumptions: "R > 0; x is a directed coordinate.",
    diagram: { description: "The horizontal leg x is adjacent to φ in the radius triangle.", svg: unitCircleSvg },
  },
  {
    id: "tangent",
    title: "Why tangent is y/x and sin/cos",
    equation: "tan φ = y/x = sin φ/cos φ",
    startingPoint: "In the radius triangle, tan φ is opposite divided by adjacent.",
    steps: [
      { expression: "tan φ = y/x", reason: "The opposite leg is y and the adjacent leg is x." },
      { expression: "sin φ/cos φ = (y/R)/(x/R)", reason: "Replace sine and cosine with their component ratios." },
      { expression: "(y/R)/(x/R) = y/x", reason: "Multiplying by R/x cancels the common non-zero radius." },
    ],
    result: "Tangent is the triangle's signed slope and equals sin φ divided by cos φ.",
    assumptions: "x ≠ 0 (equivalently cos φ ≠ 0).",
    diagram: { description: "Tangent compares the vertical and horizontal legs of the same right triangle.", svg: unitCircleSvg },
  },
  {
    id: "secant",
    title: "Why secant is the reciprocal of cosine",
    equation: "sec φ = R/x = 1/cos φ",
    startingPoint: "Cosine is cos φ = x/R.",
    steps: [
      { expression: "1/cos φ = 1/(x/R)", reason: "Take the reciprocal of the cosine ratio." },
      { expression: "1/(x/R) = R/x", reason: "Dividing by a fraction multiplies by its reciprocal." },
      { expression: "sec φ = R/x", reason: "Secant is defined as the reciprocal of cosine." },
    ],
    result: "Secant compares the radius with its horizontal component.",
    assumptions: "x ≠ 0.",
    diagram: { description: "Secant reverses the adjacent-to-hypotenuse cosine ratio.", svg: unitCircleSvg },
  },
  {
    id: "cosecant",
    title: "Why cosecant is the reciprocal of sine",
    equation: "cosec φ = R/y = 1/sin φ",
    startingPoint: "Sine is sin φ = y/R.",
    steps: [
      { expression: "1/sin φ = 1/(y/R)", reason: "Take the reciprocal of the sine ratio." },
      { expression: "1/(y/R) = R/y", reason: "Invert the fraction." },
      { expression: "cosec φ = R/y", reason: "Cosecant is defined as the reciprocal of sine." },
    ],
    result: "Cosecant compares the radius with its vertical component.",
    assumptions: "y ≠ 0.",
    diagram: { description: "Cosecant reverses the opposite-to-hypotenuse sine ratio.", svg: unitCircleSvg },
  },
  {
    id: "cotangent",
    title: "Why cotangent is x/y",
    equation: "cot φ = x/y = 1/tan φ",
    startingPoint: "Tangent is tan φ = y/x.",
    steps: [
      { expression: "1/tan φ = 1/(y/x)", reason: "Take the reciprocal of tangent." },
      { expression: "1/(y/x) = x/y", reason: "Invert the ratio." },
      { expression: "cot φ = x/y", reason: "Cotangent is defined as the reciprocal of tangent." },
    ],
    result: "Cotangent compares the horizontal component with the vertical component.",
    assumptions: "y ≠ 0.",
    diagram: { description: "Cotangent reverses the vertical-to-horizontal tangent ratio.", svg: unitCircleSvg },
  },
  {
    id: "pythagorean-identity",
    title: "Why sin²φ + cos²φ = 1",
    equation: "sin²φ + cos²φ = 1",
    startingPoint: "The component triangle is right-angled, so x² + y² = R².",
    steps: [
      { expression: "x²/R² + y²/R² = 1", reason: "Divide Pythagoras by R²; this is allowed because R > 0." },
      { expression: "(x/R)² + (y/R)² = 1", reason: "Rewrite each quotient of squares as a squared ratio." },
      { expression: "cos²φ + sin²φ = 1", reason: "Substitute cos φ = x/R and sin φ = y/R." },
      { expression: "sin²φ + cos²φ = 1", reason: "Reorder the sum." },
    ],
    result: "The identity holds for every angle, including quadrants where x or y is negative.",
    assumptions: "R > 0 and x,y are the endpoint coordinates of the radius.",
    diagram: { description: "Pythagoras on the component triangle becomes the fundamental trigonometric identity after division by R².", svg: unitCircleSvg },
  },
  {
    id: "tangent-length",
    title: "Why the tangent construction has length R tan φ",
    equation: "PQ = R tan φ",
    startingPoint: "The radius OP is perpendicular to the tangent at P, creating a right triangle with angle φ corresponding to the original component triangle.",
    steps: [
      { expression: "△OHP ∼ △OPQ", reason: "The triangles share the acute direction φ and each has a right angle, so they are similar by AA." },
      { expression: "PQ/OP = HP/OH = y/x = tan φ", reason: "Corresponding opposite/adjacent side ratios are equal." },
      { expression: "PQ/R = tan φ", reason: "OP is a radius of length R." },
      { expression: "PQ = R tan φ", reason: "Multiply by R." },
    ],
    result: "The external tangent segment scales the dimensionless tangent value by the chosen radius.",
    assumptions: "cos φ ≠ 0 and the finite tangent construction is used.",
    diagram: { description: "The component triangle and tangent triangle are similar right triangles.", svg: tangentTriangleSvg },
  },
  {
    id: "secant-length",
    title: "Why the x-axis secant length is R sec φ",
    equation: "OQ = R sec φ",
    startingPoint: "The original triangle OHP and tangent triangle OPQ are similar.",
    steps: [
      { expression: "scale factor = OP/OH = R/x", reason: "Corresponding sides OP and OH are radius and horizontal component." },
      { expression: "R/x = sec φ", reason: "Secant is the reciprocal cosine ratio." },
      { expression: "OQ = OP × scale factor = R(R/x)", reason: "The original hypotenuse OP corresponds to the large hypotenuse OQ." },
      { expression: "OQ = R sec φ", reason: "Replace R/x by sec φ." },
    ],
    result: "The orange axis intercept length is radius times secant, not the dimensionless secant value alone.",
    assumptions: "x ≠ 0 and the relevant tangent line meets the x-axis at finite Q.",
    diagram: { description: "Similarity scales horizontal component x to radius R and radius R to secant length OQ.", svg: tangentTriangleSvg },
  },
  {
    id: "cosecant-length",
    title: "Why the y-axis cosecant length is R cosec φ",
    equation: "OS = R cosec φ",
    startingPoint: "The original component triangle and the y-axis tangent triangle are similar.",
    steps: [
      { expression: "scale factor = OP/HP = R/y", reason: "The large radius side corresponds to the small vertical component." },
      { expression: "R/y = cosec φ", reason: "Cosecant is the reciprocal sine ratio." },
      { expression: "OS = OP × scale factor = R(R/y)", reason: "The small hypotenuse corresponds to the large y-axis length." },
      { expression: "OS = R cosec φ", reason: "Replace R/y by cosec φ." },
    ],
    result: "The cyan y-axis intercept length is radius times cosecant.",
    assumptions: "y ≠ 0 and the tangent meets the y-axis at finite S.",
    diagram: { description: "A similar tangent triangle scales the vertical component y up to the radius R.", svg: tangentTriangleSvg },
  },
  {
    id: "cotangent-length",
    title: "Why the y-axis tangent segment is R cot φ",
    equation: "SP = R cot φ",
    startingPoint: "Use the same similar triangles as the cosecant construction.",
    steps: [
      { expression: "SP/OH = OP/HP = R/y", reason: "Corresponding sides of similar triangles share one scale factor." },
      { expression: "SP/x = R/y", reason: "OH is the horizontal component x." },
      { expression: "SP = R(x/y)", reason: "Multiply by x and rearrange." },
      { expression: "SP = R cot φ", reason: "Cotangent is x/y." },
    ],
    result: "The tangent-side length is the radius-scaled cotangent value.",
    assumptions: "y ≠ 0 and the finite y-axis tangent construction is used.",
    diagram: { description: "Similarity maps the small horizontal leg x to the tangent segment SP.", svg: tangentTriangleSvg },
  },
  {
    id: "chord-length",
    title: "Why a chord has length 2R sin(θ/2)",
    equation: "chord = 2R sin(θ/2)",
    startingPoint: "Join the chord endpoints to the centre and bisect the resulting isosceles triangle.",
    steps: [
      { expression: "half central angle = θ/2; hypotenuse = R", reason: "The perpendicular median splits the isosceles triangle into congruent right triangles." },
      { expression: "sin(θ/2) = (chord/2)/R", reason: "Use sine in either right triangle." },
      { expression: "chord/2 = R sin(θ/2)", reason: "Multiply by R." },
      { expression: "chord = 2R sin(θ/2)", reason: "Double the half-chord." },
    ],
    result: "Historical chord tables are directly related to modern half-angle sine values.",
    assumptions: "θ is the smaller central angle subtended by the chord.",
    diagram: { description: "Bisecting the centre triangle exposes a half-chord opposite θ/2.", svg: unitCircleSvg },
  },
]);
