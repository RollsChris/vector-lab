import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const centreSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Circle with centre O, chord AB, and point P on the circumference">
    <circle cx="160" cy="90" r="68" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <path d="M105 130 A68 68 0 0 1 217 126" fill="none" stroke="#388bfd" stroke-width="6" opacity="0.55"/>
    <line x1="105" y1="130" x2="217" y2="126" stroke="#d2a8ff" stroke-width="3"/>
    <line x1="105" y1="130" x2="160" y2="90" stroke="#8b949e" stroke-width="2"/>
    <line x1="217" y1="126" x2="160" y2="90" stroke="#8b949e" stroke-width="2"/>
    <line x1="105" y1="130" x2="164" y2="22" stroke="#7ee787" stroke-width="2"/>
    <line x1="217" y1="126" x2="164" y2="22" stroke="#7ee787" stroke-width="2"/>
    <text x="91" y="145" fill="#fff" font-size="16">A</text><text x="220" y="142" fill="#fff" font-size="16">B</text>
    <text x="168" y="19" fill="#fff" font-size="16">P</text><text x="145" y="86" fill="#ffd166" font-size="16">O</text>
  </svg>`;

const sameSegSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Chord AB with points P and Q in the same segment">
    <circle cx="160" cy="90" r="68" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <path d="M100 130 A68 68 0 0 1 220 130" fill="none" stroke="#388bfd" stroke-width="6" opacity="0.45"/>
    <line x1="100" y1="130" x2="220" y2="130" stroke="#d2a8ff" stroke-width="3"/>
    <line x1="100" y1="130" x2="130" y2="30" stroke="#58a6ff" stroke-width="2"/>
    <line x1="220" y1="130" x2="130" y2="30" stroke="#58a6ff" stroke-width="2"/>
    <line x1="100" y1="130" x2="200" y2="28" stroke="#7ee787" stroke-width="2"/>
    <line x1="220" y1="130" x2="200" y2="28" stroke="#7ee787" stroke-width="2"/>
    <text x="86" y="145" fill="#fff" font-size="15">A</text><text x="224" y="145" fill="#fff" font-size="15">B</text>
    <text x="122" y="22" fill="#58a6ff" font-size="15">P</text><text x="204" y="20" fill="#7ee787" font-size="15">Q</text>
  </svg>`;

const thalesSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Diameter AB with right angle at P on the circumference">
    <circle cx="160" cy="90" r="68" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <path d="M92 90 A68 68 0 0 1 228 90" fill="none" stroke="#388bfd" stroke-width="6" opacity="0.45"/>
    <line x1="92" y1="90" x2="228" y2="90" stroke="#d2a8ff" stroke-width="3"/>
    <line x1="92" y1="90" x2="176" y2="28" stroke="#58a6ff" stroke-width="2"/>
    <line x1="228" y1="90" x2="176" y2="28" stroke="#58a6ff" stroke-width="2"/>
    <polyline points="168,36 168,44 176,44" fill="none" stroke="#ff7b72" stroke-width="2"/>
    <text x="78" y="95" fill="#fff" font-size="15">A</text><text x="232" y="95" fill="#fff" font-size="15">B</text>
    <text x="178" y="22" fill="#fff" font-size="15">P</text><text x="150" y="86" fill="#ffd166" font-size="14">O</text>
  </svg>`;

const cyclicSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Cyclic quadrilateral ABCD">
    <circle cx="160" cy="90" r="68" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <polygon points="110,40 230,55 225,140 95,130" fill="none" stroke="#58a6ff" stroke-width="2.5"/>
    <text x="100" y="34" fill="#fff" font-size="15">A</text><text x="234" y="52" fill="#fff" font-size="15">B</text>
    <text x="228" y="156" fill="#fff" font-size="15">C</text><text x="82" y="140" fill="#fff" font-size="15">D</text>
  </svg>`;

const cyclicExtSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Cyclic quadrilateral with exterior angle at B">
    <circle cx="150" cy="90" r="64" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <polygon points="105,40 210,50 205,135 90,125" fill="none" stroke="#58a6ff" stroke-width="2.5"/>
    <line x1="210" y1="50" x2="280" y2="56" stroke="#ffa657" stroke-width="2.5"/>
    <text x="94" y="34" fill="#fff" font-size="14">A</text><text x="214" y="46" fill="#fff" font-size="14">B</text>
    <text x="208" y="150" fill="#fff" font-size="14">C</text><text x="78" y="136" fill="#fff" font-size="14">D</text>
    <text x="284" y="60" fill="#ffa657" font-size="14">E</text>
  </svg>`;

const altSegSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Tangent at A, chord AB, point C in the alternate segment">
    <circle cx="160" cy="100" r="60" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <path d="M115 145 A60 60 0 0 1 220 80" fill="none" stroke="#388bfd" stroke-width="6" opacity="0.45"/>
    <line x1="40" y1="55" x2="200" y2="175" stroke="#ffa657" stroke-width="3"/>
    <line x1="115" y1="145" x2="220" y2="80" stroke="#58a6ff" stroke-width="2.5"/>
    <line x1="115" y1="145" x2="175" y2="45" stroke="#7ee787" stroke-width="2"/>
    <line x1="220" y1="80" x2="175" y2="45" stroke="#7ee787" stroke-width="2"/>
    <text x="100" y="160" fill="#fff" font-size="15">A</text><text x="226" y="78" fill="#fff" font-size="15">B</text>
    <text x="172" y="38" fill="#7ee787" font-size="15">C</text>
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

const tanSecSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Tangent PT, secant PAB, and chords TA and TB for the similar-triangle proof">
    <circle cx="150" cy="95" r="58" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <!-- secant PAB -->
    <line x1="275.0" y1="42.0" x2="103.1" y2="153.3" stroke="#58a6ff" stroke-width="2.5"/>
    <!-- chords TA and TB (needed for △PTA ~ △PBT) -->
    <line x1="152.3" y1="37.0" x2="207.3" y2="85.9" stroke="#7ee787" stroke-width="2"/>
    <line x1="152.3" y1="37.0" x2="118.2" y2="143.5" stroke="#7ee787" stroke-width="2"/>
    <!-- tangent PT -->
    <line x1="275.0" y1="42.0" x2="152.3" y2="37.0" stroke="#ffa657" stroke-width="3"/>
    <circle cx="152.3" cy="37.0" r="3" fill="#ffa657"/>
    <circle cx="207.3" cy="85.9" r="3" fill="#58a6ff"/>
    <circle cx="118.2" cy="143.5" r="3" fill="#58a6ff"/>
    <text x="280" y="40" fill="#fff" font-size="15">P</text>
    <text x="156" y="30" fill="#ffa657" font-size="14">T</text>
    <text x="214" y="82" fill="#fff" font-size="14">A</text>
    <text x="100" y="158" fill="#fff" font-size="14">B</text>
  </svg>`;

const bitangentSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Two circles with their two external and two internal common tangents">
    <circle cx="95" cy="90" r="52" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <circle cx="240" cy="95" r="26" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="95" y1="90" x2="240" y2="95" stroke="#8b949e" stroke-width="2"/>
    <line x1="85" y1="35" x2="267" y2="74" stroke="#ffa657" stroke-width="3"/>
    <line x1="81" y1="145" x2="266" y2="118" stroke="#ffa657" stroke-width="3"/>
    <line x1="106" y1="35" x2="243" y2="129" stroke="#7ee787" stroke-width="2"/>
    <line x1="102" y1="146" x2="246" y2="61" stroke="#7ee787" stroke-width="2"/>
    <line x1="95" y1="90" x2="106" y2="39" stroke="#d2a8ff" stroke-width="2"/>
    <line x1="240" y1="95" x2="246" y2="70" stroke="#d2a8ff" stroke-width="2"/>
    <text x="78" y="96" fill="#ffd166" font-size="15">O₁</text>
    <text x="232" y="101" fill="#ffd166" font-size="15">O₂</text>
    <text x="100" y="30" fill="#ffa657" font-size="13">T₁</text>
    <text x="248" y="64" fill="#ffa657" font-size="13">T₂</text>
  </svg>`;

const chordSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Perpendicular from centre O bisecting chord AB at M">
    <circle cx="160" cy="90" r="68" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="100" y1="140" x2="230" y2="125" stroke="#58a6ff" stroke-width="3"/>
    <line x1="160" y1="90" x2="165" y2="132" stroke="#d2a8ff" stroke-width="2.5"/>
    <polyline points="158,124 166,123 167,131" fill="none" stroke="#ff7b72" stroke-width="2"/>
    <circle cx="165" cy="132" r="3.5" fill="#7ee787"/>
    <text x="88" y="152" fill="#fff" font-size="15">A</text><text x="234" y="138" fill="#fff" font-size="15">B</text>
    <text x="170" y="148" fill="#7ee787" font-size="14">M</text><text x="145" y="86" fill="#ffd166" font-size="14">O</text>
  </svg>`;

const chordsSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Chords AB and CD intersecting at X inside the circle">
    <circle cx="160" cy="90" r="68" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="95" y1="50" x2="230" y2="140" stroke="#58a6ff" stroke-width="2.5"/>
    <line x1="100" y1="140" x2="235" y2="45" stroke="#7ee787" stroke-width="2.5"/>
    <circle cx="162" cy="92" r="3.5" fill="#ffd166"/>
    <text x="82" y="48" fill="#fff" font-size="14">A</text><text x="236" y="152" fill="#fff" font-size="14">B</text>
    <text x="86" y="152" fill="#fff" font-size="14">C</text><text x="240" y="42" fill="#fff" font-size="14">D</text>
    <text x="168" y="86" fill="#ffd166" font-size="14">X</text>
    <text x="120" y="70" fill="#58a6ff" font-size="12">a</text>
    <text x="190" y="120" fill="#58a6ff" font-size="12">b</text>
    <text x="125" y="125" fill="#7ee787" font-size="12">c</text>
    <text x="200" y="70" fill="#7ee787" font-size="12">d</text>
  </svg>`;

const twoSecSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Two secants from external point P meeting the circle at A,B and C,D">
    <circle cx="140" cy="95" r="58" fill="none" stroke="#58a6ff" stroke-width="3"/>
    <line x1="275" y1="90" x2="85" y2="55" stroke="#58a6ff" stroke-width="2.5"/>
    <line x1="275" y1="90" x2="95" y2="140" stroke="#7ee787" stroke-width="2.5"/>
    <line x1="190" y1="70" x2="120" y2="140" stroke="#d2a8ff" stroke-width="1.8"/>
    <line x1="100" y1="70" x2="175" y2="130" stroke="#d2a8ff" stroke-width="1.8"/>
    <circle cx="190" cy="70" r="3" fill="#58a6ff"/>
    <circle cx="100" cy="70" r="3" fill="#58a6ff"/>
    <circle cx="175" cy="130" r="3" fill="#7ee787"/>
    <circle cx="120" cy="140" r="3" fill="#7ee787"/>
    <circle cx="275" cy="90" r="3.5" fill="#ffd166"/>
    <text x="282" y="88" fill="#ffd166" font-size="15">P</text>
    <text x="196" y="66" fill="#fff" font-size="14">A</text>
    <text x="86" y="66" fill="#fff" font-size="14">B</text>
    <text x="180" y="148" fill="#fff" font-size="14">C</text>
    <text x="104" y="156" fill="#fff" font-size="14">D</text>
    <text x="230" y="72" fill="#58a6ff" font-size="12">a</text>
    <text x="145" y="58" fill="#58a6ff" font-size="12">b</text>
    <text x="230" y="118" fill="#7ee787" font-size="12">c</text>
    <text x="150" y="145" fill="#7ee787" font-size="12">d</text>
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
    diagram: { description: "The radii split the picture into isosceles triangles, creating paired equal base angles.", svg: centreSvg },
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
    diagram: { description: "Every circumference angle standing on the same chord is half the same centre angle.", svg: sameSegSvg },
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
    diagram: { description: "The diameter creates a 180° centre angle, so the matching circumference angle is half of it.", svg: thalesSvg },
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
    diagram: { description: "Opposite angles intercept arcs that together make one full turn.", svg: cyclicSvg },
  },
  {
    id: "cyclic-exterior",
    title: "Why an exterior angle of a cyclic quad equals the opposite interior",
    equation: "exterior at B = interior at D",
    startingPoint: "Extend one side of cyclic ABCD and use the opposite-angles theorem.",
    steps: [
      { expression: "interior ∠ABC + interior ∠ADC = 180°", reason: "Opposite angles of a cyclic quadrilateral are supplementary." },
      { expression: "interior ∠ABC + exterior ∠CBE = 180°", reason: "Adjacent interior and exterior angles on a straight line." },
      { expression: "exterior ∠CBE = interior ∠ADC", reason: "Both equal 180° − ∠ABC." },
    ],
    result: "The exterior angle equals the interior angle at the opposite vertex.",
    assumptions: "ABCD is cyclic and the side is extended beyond B.",
    diagram: { description: "Straight-line pair and opposite cyclic pair force the exterior to match the far interior.", svg: cyclicExtSvg },
  },
  {
    id: "alternate-segment",
    title: "Why the tangent–chord angle equals the angle in the alternate segment",
    equation: "∠(tangent, AB) = ∠ACB",
    startingPoint: "Draw the radius to the touch point and use isosceles triangles / centre-angle.",
    steps: [
      { expression: "radius OA ⟂ tangent at A", reason: "A tangent meets the radius at 90°." },
      { expression: "∠OAB = 90° − ∠(tangent, AB)", reason: "Complementary angles in the right angle at A." },
      { expression: "△OAB is isosceles with OA = OB", reason: "Both are radii, so base angles are equal." },
      { expression: "centre ∠AOB = 2∠ACB", reason: "Angle at the centre is twice the angle at the circumference in the alternate segment." },
      { expression: "∠(tangent, AB) = ∠ACB", reason: "Chase the complementary and half-centre relations around to equality." },
    ],
    result: "The angle between a tangent and a chord equals any angle in the alternate segment standing on that chord.",
    assumptions: "C lies on the circle in the segment on the other side of chord AB from the tangent angle.",
    diagram: { description: "Tangent at A, chord AB, and point C on the far arc.", svg: altSegSvg },
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
    id: "tangent-secant",
    title: "Why a tangent and a secant from one point obey PT² = PA·PB",
    equation: "t² = a · b   (PT² = PA · PB)",
    startingPoint: "From external P, tangent touches at T (t = PT) and a secant cuts at near A then far B (a = PA, b = PB). Draw green chords TA and TB so △PTA and △PBT appear.",
    steps: [
      { expression: "∠PTA = ∠PBT", reason: "Alternate segment: the angle between tangent PT and chord TA equals the angle standing on TA in the other segment (at B)." },
      { expression: "∠TPA = ∠BPT", reason: "Both triangles share the angle at P between the tangent and the secant." },
      { expression: "△PTA ∼ △PBT", reason: "AA similarity. Matched corners: P↔P, T↔B, A↔T." },
      { expression: "t/b = a/t   (PT/PB = PA/PT)", reason: "Corresponding sides of similar triangles are proportional." },
      { expression: "t² = a · b   (PT² = PA · PB)", reason: "Cross-multiply. The repeated t is a square because the tangent meets the circle only once." },
    ],
    result: "The square of the tangent equals the product of the whole secant and its external part — power of P, with t used twice because there is only one touch point.",
    assumptions: "P is outside the circle; the secant meets the circle at A (near) and B (far).",
    diagram: { description: "Tangent PT, secant PAB, and chords TA and TB — the sides of △PTA and △PBT.", svg: tanSecSvg },
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
    diagram: { description: "Equal radii and the shared perpendicular create congruent right triangles.", svg: chordSvg },
  },
  {
    id: "intersecting-chords",
    title: "Why intersecting chords give equal products of segments",
    equation: "a · b = c · d  (AX · XB = CX · XD)",
    startingPoint: "Chords AB and CD meet at X inside the circle. Write a = AX, b = XB, c = CX, d = XD, then draw the purple chords AC and BD so △AXC and △DXB appear.",
    steps: [
      { expression: "∠AXC = ∠DXB", reason: "Vertically opposite angles at the X-shaped crossing." },
      { expression: "∠ACX = ∠DBX", reason: "Both are angles in the same segment standing on arc AD." },
      { expression: "△AXC ∼ △DXB", reason: "AA similarity (two pairs of equal angles). Matching corners: A↔D, X↔X, C↔B." },
      { expression: "a/d = c/b   (AX/DX = CX/BX)", reason: "Corresponding sides of similar triangles are proportional." },
      { expression: "a · b = c · d   (AX · XB = CX · XD)", reason: "Cross-multiply a/d = c/b." },
    ],
    result: "Each chord is cut into two segments whose products match: a·b = c·d.",
    assumptions: "The intersection X lies inside the circle on both chords.",
    diagram: { description: "Two chords cross at X; similar triangles △AXC ∼ △DXB give the product rule a·b = c·d.", svg: chordsSvg },
  },
  {
    id: "two-secants",
    title: "Why two secants from one external point obey PA·PB = PC·PD",
    equation: "a · b = c · d  (PA · PB = PC · PD)",
    startingPoint: "From external P, one secant meets the circle at near A then far B and another at near C then far D. Write a = PA, b = PB, c = PC, d = PD and draw chords AD and CB.",
    steps: [
      { expression: "∠PAD = ∠PCB", reason: "Angles in the same segment standing on arc AD." },
      { expression: "∠APD = ∠CPB", reason: "Common angle at P (the angle between the two secants)." },
      { expression: "△PAD ∼ △PCB", reason: "AA similarity." },
      { expression: "a/c = d/b   (PA/PC = PD/PB)", reason: "Corresponding sides of similar triangles are proportional." },
      { expression: "a · b = c · d   (PA · PB = PC · PD)", reason: "Cross-multiply the proportion." },
    ],
    result: "The product of whole secant × external part is the same for both secants — the power of P.",
    assumptions: "P lies outside the circle; each line through P meets the circle twice.",
    diagram: { description: "Two secants from P cut the circle at A,B and C,D; △PAD ∼ △PCB gives a·b = c·d.", svg: twoSecSvg },
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
    result: "Radius alone determines both distance around and area within the circle.",
    assumptions: "Euclidean circle with r ≥ 0; the area argument is a limiting sector rearrangement.",
    diagram: { description: "The same radius controls both distance around and area within the circle.", svg: centreSvg },
  },
  {
    id: "common-tangents",
    title: "Why two circles have four common tangents (and how to find them)",
    equation: "n = h·û ± √(1 − h²)·û⊥",
    startingPoint: "Write a tangent line in normal form n·X = c with |n| = 1, so the distance from any centre to it is |n·O − c|.",
    steps: [
      { expression: "n·O₁ − c = s₁r₁ and n·O₂ − c = s₂r₂", reason: "Tangency means each centre is exactly its own radius from the line; s = ±1 records which side the centre lies on." },
      { expression: "n·(O₂ − O₁) = s₂r₂ − s₁r₁", reason: "Subtract the two equations to eliminate the unknown offset c." },
      { expression: "h = n·û = (s₂r₂ − s₁r₁)/d", reason: "Divide by d = |O₁O₂|, fixing the component of the unit normal along the centre line." },
      { expression: "n = h·û ± √(1 − h²)·û⊥", reason: "The normal is a unit vector, so the remaining component is perpendicular; the ± gives the mirrored pair of tangents." },
      { expression: "c = n·O₁ − s₁r₁,  T = O − s·r·n", reason: "Back-substitute for the offset, then step one radius along the normal to reach each touch point." },
      { expression: "s₂ = s₁ ⇒ external, s₂ = −s₁ ⇒ internal", reason: "Same-side signs give the direct tangents; opposite signs give the transverse ones that cross between the circles." },
      { expression: "L_ext = √(d² − (r₁ − r₂)²),  L_int = √(d² − (r₁ + r₂)²)", reason: "Shrink both circles by r₂ (or grow the big one by r₂): the tangent segment, the centre line and the radius difference (or sum) form a right-angled triangle." },
    ],
    symbols: [
      { symbol: "O₁, O₂", meaning: "The two circle centres." },
      { symbol: "r₁, r₂", meaning: "The radii of those circles." },
      { symbol: "d", meaning: "Distance between the centres, |O₁O₂|." },
      { symbol: "û, û⊥", meaning: "Unit vector from O₁ to O₂, and the same vector turned through 90°." },
      { symbol: "n", meaning: "Unit normal of the tangent line — the direction the line faces." },
      { symbol: "c", meaning: "Offset of the line from the origin along n, so the line is every X with n·X = c." },
      { symbol: "s₁, s₂", meaning: "Each is +1 or −1, recording which side of the line that centre lies on." },
      { symbol: "h", meaning: "n·û, the component of the normal along the centre line." },
      { symbol: "T", meaning: "A touch point, where a tangent meets a circle." },
      { symbol: "L_ext, L_int", meaning: "Length of an external or internal tangent segment, touch point to touch point." },
    ],
    result: "Two separate circles share four common tangents; the count drops to 3, 2, 1 then 0 as they touch, overlap, sit inside touching, and become nested.",
    assumptions: "Distinct centres (d > 0). Real solutions need |h| ≤ 1: d ≥ |r₁ − r₂| for the external pair and d ≥ r₁ + r₂ for the internal pair.",
    diagram: { description: "Each tangent touches both circles, and every radius drawn to a touch point meets the line at a right angle.", svg: bitangentSvg },
  },
]);
