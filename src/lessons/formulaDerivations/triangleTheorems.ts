import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const triangleSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Triangle ABC with altitude h to base c and sides a and b">
    <polygon points="45,145 275,145 125,30" fill="#58a6ff22" stroke="#58a6ff" stroke-width="3"/>
    <line x1="125" y1="30" x2="125" y2="145" stroke="#ffd166" stroke-width="2" stroke-dasharray="6 5"/>
    <path d="M125 135 h10 v10" fill="none" stroke="#ff7b72" stroke-width="2"/>
    <text x="28" y="151" fill="#fff" font-size="16">A</text><text x="280" y="151" fill="#fff" font-size="16">B</text><text x="116" y="23" fill="#fff" font-size="16">C</text>
    <text x="187" y="91" fill="#7ee787" font-size="16">a</text><text x="74" y="91" fill="#d2a8ff" font-size="16">b</text>
    <text x="190" y="165" fill="#58a6ff" font-size="16">c</text><text x="132" y="90" fill="#ffd166" font-size="16">h</text>
  </svg>`;

registerFormulaDerivations("triangle-theorems", [
  {
    id: "angle-sum",
    title: "Why a triangle's angles total 180°",
    equation: "A + B + C = 180°",
    startingPoint: "Draw a line through one vertex parallel to the opposite side.",
    steps: [
      { expression: "angle on the left = A", reason: "Alternate interior angles are equal across parallel lines." },
      { expression: "angle on the right = B", reason: "The second transversal gives the other alternate interior angle." },
      { expression: "A + C + B = 180°", reason: "The three adjacent angles lie on one straight line." },
    ],
    result: "Knowing any two interior angles determines the third.",
    assumptions: "Euclidean plane and a non-degenerate triangle.",
    diagram: { description: "A parallel through C places copies of A and B beside C on a straight line.", svg: triangleSvg },
  },
  {
    id: "sine-rule",
    title: "How one altitude gives the sine rule",
    equation: "a/sin A = b/sin B = c/sin C = 2R",
    startingPoint: "Drop the altitude h from C to side c = AB.",
    steps: [
      { expression: "h = b sin A", reason: "In the left right triangle, sin A = h/b." },
      { expression: "h = a sin B", reason: "In the right right triangle, sin B = h/a." },
      { expression: "b sin A = a sin B ⇒ a/sin A = b/sin B", reason: "Equate the two expressions for the same altitude and rearrange." },
      { expression: "a = 2R sin A", reason: "Chord a subtends central angle 2A, so half the chord is R sin A." },
    ],
    result: "Repeating the argument cyclically gives all three equal ratios, each equal to the circumdiameter 2R.",
    assumptions: "Non-degenerate triangle; R is its circumradius.",
    diagram: { description: "The shared altitude turns two sides and angles into equal expressions for h.", svg: triangleSvg },
  },
  {
    id: "cosine-rule",
    title: "How Pythagoras becomes the cosine rule",
    equation: "c² = a² + b² − 2ab cos C",
    startingPoint: "Resolve side b into components parallel and perpendicular to side a.",
    steps: [
      { expression: "parallel component = b cos C; perpendicular component = b sin C", reason: "These are the adjacent and opposite legs of the right triangle formed by the altitude." },
      { expression: "c² = (a − b cos C)² + (b sin C)²", reason: "Apply Pythagoras to the base difference and altitude." },
      { expression: "c² = a² − 2ab cos C + b²(cos²C + sin²C)", reason: "Expand and collect the b² terms." },
      { expression: "c² = a² + b² − 2ab cos C", reason: "Use sin²C + cos²C = 1." },
    ],
    result: "When C = 90°, cos C = 0 and the formula reduces to Pythagoras.",
    assumptions: "Sides a and b enclose angle C; valid for any non-degenerate Euclidean triangle.",
    diagram: { description: "The altitude exposes the horizontal projection b cos C and vertical projection b sin C.", svg: triangleSvg },
  },
  {
    id: "shoelace-area",
    title: "Why coordinates give the shoelace area",
    equation: "A = ½|x₁y₂ + x₂y₃ + x₃y₁ − y₁x₂ − y₂x₃ − y₃x₁|",
    startingPoint: "The signed area of the parallelogram spanned by two vectors is their 2D determinant.",
    steps: [
      { expression: "2Asigned = det(B−A, C−A)", reason: "A triangle occupies half of its spanning parallelogram." },
      { expression: "2Asigned = (x₂−x₁)(y₃−y₁) − (y₂−y₁)(x₃−x₁)", reason: "Expand the two-dimensional determinant." },
      { expression: "2Asigned = x₁y₂+x₂y₃+x₃y₁−y₁x₂−y₂x₃−y₃x₁", reason: "Expand and cancel equal cross terms." },
      { expression: "A = ½|2Asigned|", reason: "Absolute value removes clockwise/counter-clockwise orientation." },
    ],
    result: "The formula finds triangle area directly from vertex coordinates.",
    assumptions: "Vertices are listed around the triangle; absolute value gives unsigned area.",
    diagram: { description: "Coordinate differences from A form two vectors spanning twice the triangle's area.", svg: triangleSvg },
  },
  {
    id: "heron-area",
    title: "How the cosine rule leads to Heron's formula",
    equation: "A = √[s(s−a)(s−b)(s−c)]",
    startingPoint: "Use A = ½ab sin C and eliminate C using the cosine rule.",
    steps: [
      { expression: "16A² = 4a²b² sin²C = 4a²b²(1−cos²C)", reason: "Square the sine-area formula and use sin²C = 1−cos²C." },
      { expression: "cos C = (a²+b²−c²)/(2ab)", reason: "Rearrange the cosine rule." },
      { expression: "16A² = [2ab+a²+b²−c²][2ab−a²−b²+c²]", reason: "Substitute and factor as a difference of squares." },
      { expression: "16A² = (a+b+c)(a+b−c)(a+c−b)(b+c−a)", reason: "Factor each bracket into sums and differences of side lengths." },
      { expression: "A² = s(s−a)(s−b)(s−c)", reason: "Replace a+b+c by 2s and each remaining factor by twice the matching semiperimeter difference." },
    ],
    result: "Taking the non-negative square root gives Heron's area from three side lengths alone.",
    assumptions: "a,b,c satisfy the strict triangle inequalities; s = (a+b+c)/2.",
    diagram: { description: "Heron's formula removes the altitude and angles, leaving only the three side lengths.", svg: triangleSvg },
  },
  {
    id: "sine-area",
    title: "Why triangle area is ½ab sin C",
    equation: "A = ½ab sin C",
    startingPoint: "Choose side a as the base and drop the perpendicular height from the opposite vertex.",
    steps: [
      { expression: "h = b sin C", reason: "In the right triangle, sin C = h/b." },
      { expression: "A = ½ah", reason: "A triangle is half a parallelogram with the same base and height." },
      { expression: "A = ½a(b sin C) = ½ab sin C", reason: "Substitute the height expressed through side b and included angle C." },
    ],
    result: "Two side lengths and their included angle determine the area.",
    assumptions: "a,b ≥ 0 and C is their included interior angle.",
    diagram: { description: "The altitude is the component b sin C perpendicular to base a.", svg: triangleSvg },
  },
]);
