import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const conicSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Point P on a conic, focus F, directrix, and perpendicular distances">
    <line x1="55" y1="20" x2="55" y2="160" stroke="#ffa657" stroke-width="3"/>
    <path d="M95 145 Q150 20 270 95" fill="none" stroke="#79c0ff" stroke-width="3"/>
    <circle cx="185" cy="90" r="5" fill="#ff7b72"/><circle cx="135" cy="67" r="5" fill="#ffd166"/>
    <line x1="135" y1="67" x2="185" y2="90" stroke="#ff7b72" stroke-width="2"/>
    <line x1="135" y1="67" x2="55" y2="67" stroke="#ffa657" stroke-width="2" stroke-dasharray="6 5"/>
    <path d="M55 67 h10 v10" fill="none" stroke="#7ee787" stroke-width="2"/>
    <text x="191" y="95" fill="#fff" font-size="16">F</text><text x="122" y="58" fill="#fff" font-size="16">P</text>
    <text x="60" y="37" fill="#ffa657" font-size="15">directrix</text>
  </svg>`;

registerFormulaDerivations("conic-sections", [
  {
    id: "focus-directrix",
    title: "How the focus-directrix rule creates every conic",
    equation: "distance(P,F) = e · distance(P,directrix)",
    startingPoint: "Place the focus at (0,0), the vertical directrix at x = −d, and a curve point at P = (x,y).",
    steps: [
      { expression: "PF = √(x²+y²)", reason: "Use the distance formula from P to the focus." },
      { expression: "distance to directrix = |x+d|", reason: "The perpendicular distance to the vertical line x = −d is the horizontal separation." },
      { expression: "√(x²+y²) = e|x+d|", reason: "Apply the defining focus-directrix ratio." },
      { expression: "x²+y² = e²(x+d)²", reason: "Square both non-negative distances." },
      { expression: "(1−e²)x² − 2e²dx + y² − e²d² = 0", reason: "Expand and collect terms to obtain the Cartesian conic equation." },
    ],
    result: "The x² coefficient is positive for 0<e<1 (ellipse), zero for e=1 (parabola), and negative for e>1 (hyperbola).",
    assumptions: "d > 0, e ≥ 0, and the shown coordinate placement is used. At e = 0 the finite-directrix equation degenerates; a circle is the limiting ellipse as the directrix recedes.",
    diagram: { description: "The conic consists of points whose focus distance is e times their perpendicular directrix distance.", svg: conicSvg },
  },
]);
