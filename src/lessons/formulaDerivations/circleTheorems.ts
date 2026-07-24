import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const circleTheoremSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Circle with centre O, chord AB, and point P on the circumference">
    <circle cx="160" cy="90" r="68" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="105" y1="130" x2="217" y2="126" stroke="#d2a8ff" stroke-width="3"/>
    <line x1="105" y1="130" x2="160" y2="90" stroke="#8b949e" stroke-width="2"/>
    <line x1="217" y1="126" x2="160" y2="90" stroke="#8b949e" stroke-width="2"/>
    <line x1="105" y1="130" x2="164" y2="22" stroke="#7ee787" stroke-width="2"/>
    <line x1="217" y1="126" x2="164" y2="22" stroke="#7ee787" stroke-width="2"/>
    <text x="91" y="145" fill="#fff" font-size="16">A</text><text x="220" y="142" fill="#fff" font-size="16">B</text>
    <text x="168" y="19" fill="#fff" font-size="16">P</text><text x="145" y="86" fill="#ffd166" font-size="16">O</text>
  </svg>`;

const tangentSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="External point P with two tangents PT1 and PT2 to a circle centred at O">
    <circle cx="120" cy="90" r="58" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="270" y1="90" x2="142" y2="36" stroke="#ffa657" stroke-width="3"/>
    <line x1="270" y1="90" x2="142" y2="144" stroke="#ffa657" stroke-width="3"/>
    <line x1="120" y1="90" x2="142" y2="36" stroke="#d2a8ff" stroke-width="2"/>
    <line x1="120" y1="90" x2="142" y2="144" stroke="#d2a8ff" stroke-width="2"/>
    <line x1="120" y1="90" x2="270" y2="90" stroke="#8b949e" stroke-width="2"/>
    <text x="276" y="95" fill="#fff" font-size="16">P</text><text x="102" y="87" fill="#fff" font-size="16">O</text>
  </svg>`;

registerFormulaDerivations("circle-theorems", [
  {
    id: "centre-angle",
    title: "Why the centre angle is twice the circumference angle",
    equation: "∠AOB = 2∠APB",
    startingPoint: "Join P to the centre O; the radii create isosceles triangles.",
    steps: [
      { expression: "base angles in each radius triangle are equal", reason: "OA = OP = OB because all are radii." },
      { expression: "each angle at O = 180° − 2(base angle)", reason: "Use the triangle angle sum in the two isosceles triangles." },
      { expression: "reflex/inner ∠AOB = 2(∠APO + ∠OPB) = 2∠APB", reason: "Combine the centre angles on the arc opposite P and the two parts of the angle at P." },
    ],
    result: "A fixed chord subtends twice as much angle at the centre as at the circumference.",
    assumptions: "A, B and P are distinct points on the same circle; use the central angle standing on the arc opposite P.",
    diagram: { description: "The radii split the picture into isosceles triangles, creating paired equal base angles.", svg: circleTheoremSvg },
  },
  {
    id: "same-segment",
    title: "Why angles in the same segment are equal",
    equation: "∠APB = ∠AQB",
    startingPoint: "Both circumference angles stand on the same chord AB and the same opposite arc.",
    steps: [
      { expression: "∠AOB = 2∠APB", reason: "Apply the angle-at-the-centre theorem to point P." },
      { expression: "∠AOB = 2∠AQB", reason: "Apply the same theorem to point Q on the same segment." },
      { expression: "∠APB = ∠AQB", reason: "Both angles equal half of the same central angle." },
    ],
    result: "Moving the observation point along one segment does not change the angle subtended by chord AB.",
    assumptions: "P and Q lie on the same side of chord AB on the same circle.",
    diagram: { description: "Every circumference angle standing on the same chord is half the same centre angle.", svg: circleTheoremSvg },
  },
  {
    id: "thales",
    title: "Why an angle in a semicircle is 90°",
    equation: "AB is a diameter ⇒ ∠APB = 90°",
    startingPoint: "A diameter subtends a straight angle of 180° at the centre.",
    steps: [
      { expression: "∠AOB = 180°", reason: "OA and OB are opposite rays along the diameter." },
      { expression: "∠AOB = 2∠APB", reason: "Use the angle-at-the-centre theorem." },
      { expression: "∠APB = 180°/2 = 90°", reason: "Divide the central angle by two." },
    ],
    result: "Any triangle whose hypotenuse is a circle diameter is right-angled at the third point.",
    assumptions: "P is on the circle and distinct from diameter endpoints A and B.",
    diagram: { description: "The diameter creates a 180° centre angle, so the matching circumference angle is half of it.", svg: circleTheoremSvg },
  },
  {
    id: "cyclic-opposites",
    title: "Why opposite cyclic angles sum to 180°",
    equation: "A + C = 180°, B + D = 180°",
    startingPoint: "Opposite angles of a cyclic quadrilateral stand on the two complementary arcs between the other pair of vertices.",
    steps: [
      { expression: "2A = central angle of arc BCD", reason: "A circumference angle is half the centre angle standing on its opposite arc." },
      { expression: "2C = central angle of arc DAB", reason: "Apply the same theorem to the opposite angle C." },
      { expression: "2A + 2C = 360°", reason: "The two arcs together make the full circle." },
      { expression: "A + C = 180°", reason: "Divide by two; the same argument gives B + D = 180°." },
    ],
    result: "Each pair of opposite interior angles in a cyclic quadrilateral is supplementary.",
    assumptions: "All four vertices lie on one circle in cyclic order.",
    diagram: { description: "Opposite angles intercept arcs that together make one full turn.", svg: circleTheoremSvg },
  },
  {
    id: "tangent-radius",
    title: "Why a tangent is perpendicular to the radius",
    equation: "OT ⟂ tangent at T",
    startingPoint: "T is the closest point on the tangent line to the circle's centre O.",
    steps: [
      { expression: "OX ≥ OT for every other point X on the tangent", reason: "If OX were shorter than the radius OT, X would lie inside the circle and the line would cut the circle." },
      { expression: "OT is the shortest segment from O to the tangent line", reason: "Equality occurs only at the touch point T." },
      { expression: "OT ⟂ tangent", reason: "The shortest segment from a point to a line is perpendicular to that line." },
    ],
    result: "The radius and tangent form a right angle at the point of contact.",
    assumptions: "The line touches the Euclidean circle at exactly one point T.",
    diagram: { description: "Each tangent point is joined to the centre by a perpendicular radius.", svg: tangentSvg },
  },
  {
    id: "equal-tangents",
    title: "Why two tangents from one point have equal length",
    equation: "PT₁ = PT₂",
    startingPoint: "Join the external point P and centre O to both tangent points.",
    steps: [
      { expression: "OT₁ = OT₂ = r", reason: "Both segments are radii of the same circle." },
      { expression: "∠OT₁P = ∠OT₂P = 90°", reason: "A radius is perpendicular to a tangent at the contact point." },
      { expression: "△OPT₁ ≅ △OPT₂", reason: "The right triangles share hypotenuse OP and have one equal leg (RHS congruence)." },
      { expression: "PT₁ = PT₂", reason: "Corresponding sides of congruent triangles are equal." },
    ],
    result: "Both tangent paths from the same external point have identical length.",
    assumptions: "P lies outside the circle.",
    diagram: { description: "The two right triangles share OP and have equal radius legs.", svg: tangentSvg },
  },
  {
    id: "chord-bisector",
    title: "Why a perpendicular from the centre bisects a chord",
    equation: "OM ⟂ AB ⇒ AM = MB",
    startingPoint: "Join the chord endpoints A and B to the centre O.",
    steps: [
      { expression: "OA = OB", reason: "Both are radii." },
      { expression: "∠OMA = ∠OMB = 90° and OM is shared", reason: "OM is perpendicular to the chord and belongs to both right triangles." },
      { expression: "△OMA ≅ △OMB", reason: "The right triangles have equal hypotenuses and a shared leg (RHS)." },
      { expression: "AM = MB", reason: "Corresponding chord halves are equal." },
    ],
    result: "The perpendicular radius lands at the chord's midpoint.",
    assumptions: "AB is a chord and M is the foot of the perpendicular from O.",
    diagram: { description: "Equal radii and the shared perpendicular create congruent right triangles.", svg: circleTheoremSvg },
  },
  {
    id: "circle-basics",
    title: "Why circumference and area use 2πr and πr²",
    equation: "C = 2πr, A = πr²",
    startingPoint: "π is the constant ratio C/d and a diameter consists of two radii.",
    steps: [
      { expression: "C = πd", reason: "Multiply C/d = π by d." },
      { expression: "C = π(2r) = 2πr", reason: "Substitute d = 2r." },
      { expression: "A = ½Cr", reason: "Rearranged thin sectors approach a triangle/rectangle with base C and effective height r, with the factor one half." },
      { expression: "A = ½(2πr)r = πr²", reason: "Substitute the circumference and simplify." },
    ],
    result: "The lesson's fixed radius determines both displayed circle measurements.",
    assumptions: "Euclidean circle with r ≥ 0; the area argument is a limiting sector rearrangement.",
    diagram: { description: "The same radius controls both distance around and area within the circle.", svg: circleTheoremSvg },
  },
]);
