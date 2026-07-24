import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const quadSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Quadrilateral ABCD split by diagonal AC into two triangles">
    <polygon points="45,135 250,145 275,45 105,25" fill="#58a6ff22" stroke="#58a6ff" stroke-width="3"/>
    <line x1="45" y1="135" x2="275" y2="45" stroke="#d2a8ff" stroke-width="3"/>
    <text x="28" y="148" fill="#fff" font-size="16">A</text><text x="254" y="162" fill="#fff" font-size="16">B</text>
    <text x="282" y="45" fill="#fff" font-size="16">C</text><text x="92" y="22" fill="#fff" font-size="16">D</text>
  </svg>`;

registerFormulaDerivations("quadrilaterals", [
  {
    id: "angle-sum",
    title: "Why quadrilateral angles total 360°",
    equation: "A + B + C + D = 360°",
    startingPoint: "Draw one diagonal across a simple quadrilateral.",
    steps: [
      { expression: "first triangle angle sum = 180°", reason: "Every Euclidean triangle has interior angle sum 180°." },
      { expression: "second triangle angle sum = 180°", reason: "The diagonal creates a second triangle covering the rest of the quadrilateral." },
      { expression: "A+B+C+D = 180°+180° = 360°", reason: "The diagonal splits two corner angles, and recombining their parts restores the four original angles." },
    ],
    result: "The four interior angles of every simple convex or concave quadrilateral total 360°.",
    assumptions: "The quadrilateral is simple (its sides do not cross).",
    diagram: { description: "One diagonal partitions the quadrilateral into exactly two triangles.", svg: quadSvg },
  },
  {
    id: "shoelace-area",
    title: "Why the shoelace formula measures quadrilateral area",
    equation: "A = ½|Σ(xᵢyᵢ₊₁ − yᵢxᵢ₊₁)|",
    startingPoint: "Each directed edge and the origin form a signed triangle with determinant xᵢyᵢ₊₁ − yᵢxᵢ₊₁.",
    steps: [
      { expression: "2Aᵢ = xᵢyᵢ₊₁ − yᵢxᵢ₊₁", reason: "A 2D determinant is the signed parallelogram area, twice the corresponding triangle area." },
      { expression: "2Asigned = Σ(xᵢyᵢ₊₁ − yᵢxᵢ₊₁)", reason: "Adding the four edge triangles cancels internal overlap and leaves the polygon's signed area." },
      { expression: "A = ½|2Asigned|", reason: "Divide by two and remove the sign caused by clockwise or counter-clockwise vertex order." },
    ],
    result: "The ordered corner coordinates determine the displayed quadrilateral area.",
    assumptions: "Vertices are listed consecutively around a simple quadrilateral.",
    diagram: { description: "The diagonal also shows that polygon area can be accumulated from signed triangle areas.", svg: quadSvg },
  },
]);
