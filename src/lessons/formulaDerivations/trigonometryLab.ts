import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const chordSvg = `
  <svg viewBox="0 0 320 200" role="img" aria-label="Circle with chord PQ, centre O, midpoint M and half-angle">
    <circle cx="150" cy="110" r="78" fill="none" stroke="#8b949e" stroke-width="2"/>
    <line x1="150" y1="110" x2="228" y2="110" stroke="#f0f6fc" stroke-width="2"/>
    <line x1="150" y1="110" x2="189" y2="42" stroke="#f0f6fc" stroke-width="2"/>
    <line x1="228" y1="110" x2="189" y2="42" stroke="#ffa657" stroke-width="3"/>
    <line x1="150" y1="110" x2="208" y2="76" stroke="#d2a8ff" stroke-width="2"/>
    <line x1="208" y1="76" x2="228" y2="110" stroke="#ff7b72" stroke-width="3"/>
    <path d="M198 76 l8 5 5-8" fill="none" stroke="#7ee787" stroke-width="2"/>
    <path d="M172 110 A24 24 0 0 0 166 90" fill="none" stroke="#ffd166" stroke-width="2"/>
    <text x="168" y="96" fill="#ffd166" font-size="14">θ/2</text>
    <text x="236" y="118" fill="#f0f6fc" font-size="14">P</text>
    <text x="192" y="36" fill="#f0f6fc" font-size="14">Q</text>
    <text x="136" y="128" fill="#f0f6fc" font-size="14">O</text>
    <text x="212" y="70" fill="#d2a8ff" font-size="13">M</text>
    <text x="210" y="100" fill="#ff7b72" font-size="13">½ ch</text>
    <text x="155" y="55" fill="#f0f6fc" font-size="13">R</text>
  </svg>`;

const unitSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Unit circle point with coordinates cos and sin">
    <circle cx="120" cy="95" r="70" fill="none" stroke="#8b949e" stroke-width="2"/>
    <line x1="40" y1="95" x2="210" y2="95" stroke="#484f58" stroke-width="1"/>
    <line x1="120" y1="20" x2="120" y2="170" stroke="#484f58" stroke-width="1"/>
    <line x1="120" y1="95" x2="170" y2="45" stroke="#f0f6fc" stroke-width="3"/>
    <line x1="120" y1="95" x2="170" y2="95" stroke="#79c0ff" stroke-width="3"/>
    <line x1="170" y1="95" x2="170" y2="45" stroke="#ff7b72" stroke-width="3"/>
    <circle cx="170" cy="45" r="4" fill="#ffd166"/>
    <text x="140" y="112" fill="#79c0ff" font-size="14">cos φ</text>
    <text x="176" y="74" fill="#ff7b72" font-size="14">sin φ</text>
    <text x="148" y="58" fill="#f0f6fc" font-size="14">R=1</text>
    <text x="176" y="40" fill="#ffd166" font-size="14">P</text>
  </svg>`;

registerFormulaDerivations("trigonometry-lab", [
  {
    id: "sine-from-chord",
    title: "Deriving sine from the half-chord",
    equation: "sin(θ/2) = chord(θ) / (2R)",
    startingPoint:
      "A chord subtends central angle θ in a circle of radius R. Ancient tables listed the chord length; modern sine is the half-chord divided by R.",
    steps: [
      {
        expression: "Draw radii OP and OQ to the chord endpoints",
        reason: "OP = OQ = R, so triangle OPQ is isosceles with vertex angle θ at the centre.",
      },
      {
        expression: "Drop a perpendicular from O to PQ, meeting at M",
        reason: "In an isosceles triangle the altitude to the base is also a median and an angle bisector, so PM = MQ = chord(θ)/2 and ∠POM = θ/2.",
      },
      {
        expression: "△OMQ is right-angled at M",
        reason: "The altitude meets the chord at right angles.",
      },
      {
        expression: "sin(θ/2) = opposite / hypotenuse = MQ / OQ",
        reason: "Apply the right-triangle definition of sine at the centre angle θ/2.",
      },
      {
        expression: "MQ = chord(θ)/2 and OQ = R",
        reason: "M is the midpoint of the chord; OQ is a radius.",
      },
      {
        expression: "sin(θ/2) = chord(θ) / (2R)",
        reason: "Substitute the two lengths. Equivalently chord(θ) = 2R sin(θ/2).",
      },
    ],
    result:
      "Sine is not an arbitrary button: it is the half-chord of the double angle, scaled by the radius. Setting φ = θ/2 recovers sin φ = (chord 2φ)/(2R).",
    assumptions: "R > 0 and 0 < θ ≤ 360°. For θ > 180° the geometric chord is still the lesser arc's chord in the usual table convention.",
    diagram: {
      description: "Bisecting the centre-to-chord figure exposes a right triangle whose opposite side is half the chord.",
      svg: chordSvg,
    },
  },
  {
    id: "sine-unit-circle",
    title: "Why sin φ is the y-coordinate on the unit circle",
    equation: "sin φ = y  (when R = 1)",
    startingPoint:
      "Place a circle of radius R at the origin and let P be the point at angle φ from the positive x-axis. Drop a perpendicular from P to the x-axis at H.",
    steps: [
      {
        expression: "△OHP is right-angled at H",
        reason: "PH is drawn perpendicular to the x-axis.",
      },
      {
        expression: "OP = R, OH = |x|, PH = |y|",
        reason: "OP is a radius; H is the projection of P, so the legs are the absolute coordinates.",
      },
      {
        expression: "sin φ = PH / OP = |y| / R  (first quadrant)",
        reason: "In Q1 the angle at O is φ and the opposite leg is PH.",
      },
      {
        expression: "Choose directed y so the sign tracks the quadrant",
        reason: "Extending sine beyond acute angles keeps the same ratio with a signed opposite side, matching the y-coordinate.",
      },
      {
        expression: "Set R = 1",
        reason: "On the unit circle the ratio collapses to the coordinate itself: sin φ = y and cos φ = x.",
      },
    ],
    result:
      "The unit-circle definition agrees with the half-chord definition and extends sine to every real angle via wrapping and signs.",
    assumptions: "Standard position: φ measured from +x, counterclockwise positive.",
    diagram: {
      description: "The vertical leg of the radius triangle is exactly sin φ when R = 1.",
      svg: unitSvg,
    },
  },
  {
    id: "sine-angle-only",
    title: "Why sin(30°) needs only the angle",
    equation: "sin θ = opp / hyp  (independent of size)",
    startingPoint:
      "You type sin(30) and get 0.5 with no side lengths. Sine is a ratio, similar right triangles share ratios, and normalizing the hypotenuse turns that ratio into a single number.",
    steps: [
      {
        expression: "Take any right triangle with acute angle θ",
        reason: "Label opposite = a, hypotenuse = c. By definition sin θ = a/c.",
      },
      {
        expression: "Scale every side by k > 0",
        reason: "The new triangle has opposite ka and hypotenuse kc. Angles are unchanged (similar triangles).",
      },
      {
        expression: "sin θ = (ka)/(kc) = a/c",
        reason: "The scale factor cancels. Size drops out of the ratio.",
      },
      {
        expression: "Normalize: choose k so the hypotenuse becomes 1",
        reason: "Similar triangles let you pick the size. Setting c = 1 does not change the angle.",
      },
      {
        expression: "sin θ = opposite / 1 = opposite",
        reason: "With hypotenuse 1 the opposite side length is the number sin θ itself — this is the unit-circle height.",
      },
      {
        expression: "Lengths return only when you multiply back",
        reason: "opp = hyp · sin θ. Now you supply a length because you left ratio-land.",
      },
    ],
    result:
      "sin(30°) = 1/2 for every right triangle with a 30° angle. Normalizing the hypotenuse to 1 makes the opposite side equal that shared ratio — the number the calculator returns.",
    assumptions: "Euclidean geometry; θ an acute angle in a right triangle (extension to all real angles uses the unit circle with signs).",
    diagram: {
      description: "Two nested similar right triangles share θ; scaling the hypotenuse to 1 leaves the opposite side equal to sin θ.",
      svg: unitSvg,
    },
  },
  {
    id: "law-of-cosines",
    title: "Law of cosines from coordinates",
    equation: "c² = a² + b² − 2ab cos C",
    startingPoint: "Place angle C at the origin with side b along the x-axis and side a at angle C.",
    steps: [
      {
        expression: "B = (a cos C, a sin C), A = (b, 0)",
        reason: "Put vertex C at the origin and vertex A on the positive x-axis.",
      },
      {
        expression: "c² = |B − A|² = (a cos C − b)² + (a sin C)²",
        reason: "Side c is the distance between A and B.",
      },
      {
        expression: "c² = a² cos²C − 2ab cos C + b² + a² sin²C",
        reason: "Expand the square.",
      },
      {
        expression: "c² = a²(cos²C + sin²C) + b² − 2ab cos C",
        reason: "Collect a² terms.",
      },
      {
        expression: "c² = a² + b² − 2ab cos C",
        reason: "Use cos² + sin² = 1.",
      },
    ],
    result: "When C = 90°, cos C = 0 and the formula collapses to Pythagoras.",
    assumptions: "Euclidean plane; sides a,b enclose angle C.",
    diagram: {
      description: "Coordinate placement of SAS data yields the cosine law by expanding a distance.",
      svg: unitSvg,
    },
  },
]);
