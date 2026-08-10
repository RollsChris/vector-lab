import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const stringSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Ellipse with foci F1 and F2, a pen point P, and the two focal radii r1 and r2">
    <ellipse cx="160" cy="90" rx="120" ry="70" fill="none" stroke="#79c0ff" stroke-width="3"/>
    <line x1="63" y1="90" x2="160" y2="90" stroke="#484f58" stroke-width="1.5" stroke-dasharray="5 5"/>
    <circle cx="63" cy="90" r="5" fill="#ff7b72"/><circle cx="257" cy="90" r="5" fill="#ff7b72"/>
    <circle cx="220" cy="41" r="5" fill="#ffd166"/>
    <line x1="63" y1="90" x2="220" y2="41" stroke="#ffa657" stroke-width="2"/>
    <line x1="257" y1="90" x2="220" y2="41" stroke="#3fb950" stroke-width="2"/>
    <text x="46" y="107" fill="#ff7b72" font-size="15">F₁</text>
    <text x="252" y="107" fill="#ff7b72" font-size="15">F₂</text>
    <text x="226" y="34" fill="#ffd166" font-size="15">P</text>
    <text x="120" y="55" fill="#ffa657" font-size="15">r₁</text>
    <text x="240" y="68" fill="#3fb950" font-size="15">r₂</text>
  </svg>`;

const stretchSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="A circle of radius a squashed vertically by the factor b over a into an ellipse">
    <circle cx="90" cy="90" r="66" fill="none" stroke="#8b949e" stroke-width="2" stroke-dasharray="6 5"/>
    <ellipse cx="90" cy="90" rx="66" ry="38" fill="none" stroke="#79c0ff" stroke-width="3"/>
    <line x1="90" y1="24" x2="90" y2="52" stroke="#d2a8ff" stroke-width="2"/>
    <line x1="90" y1="156" x2="90" y2="128" stroke="#d2a8ff" stroke-width="2"/>
    <text x="150" y="60" fill="#8b949e" font-size="14">circle: area πa²</text>
    <text x="150" y="86" fill="#d2a8ff" font-size="14">scale y by b/a</text>
    <text x="150" y="112" fill="#79c0ff" font-size="14">ellipse: area πab</text>
  </svg>`;

registerFormulaDerivations("ellipses", [
  {
    id: "ellipse-standard-equation",
    title: "From the two-pin string rule to x²/a² + y²/b² = 1",
    equation: "x²/a² + y²/b² = 1",
    startingPoint:
      "Take the defining property: the distances from a point P = (x, y) to the two foci always add to the same total, 2a. Put the centre at the origin and the foci at (−c, 0) and (c, 0).",
    symbols: [
      { symbol: "a", meaning: "semi-major axis — half the long width of the ellipse" },
      { symbol: "b", meaning: "semi-minor axis — half the short width" },
      { symbol: "c", meaning: "centre-to-focus distance" },
      { symbol: "r₁, r₂", meaning: "distances from the point P to each focus" },
    ],
    steps: [
      { expression: "r₁ + r₂ = 2a", reason: "State the string definition: the two focal distances sum to a constant." },
      { expression: "√((x+c)² + y²) + √((x−c)² + y²) = 2a", reason: "Write each focal distance with the distance formula." },
      { expression: "√((x+c)² + y²) = 2a − √((x−c)² + y²)", reason: "Isolate one radical so squaring removes it." },
      { expression: "a√((x−c)² + y²) = a² − cx", reason: "Square once, cancel the common x², y² and c² terms, and tidy." },
      { expression: "a²((x−c)² + y²) = (a² − cx)²", reason: "Square the second time to clear the last radical." },
      { expression: "(a² − c²)x² + a²y² = a²(a² − c²)", reason: "Expand and collect the x², y² and constant terms." },
      { expression: "b² = a² − c²", reason: "At P = (0, b) the two focal distances are equal, so each is a and Pythagoras gives a² = b² + c²." },
      { expression: "b²x² + a²y² = a²b²", reason: "Substitute a² − c² = b²." },
      { expression: "x²/a² + y²/b² = 1", reason: "Divide through by a²b²." },
    ],
    result:
      "An ellipse centred at the origin with a horizontal major axis satisfies x²/a² + y²/b² = 1, with foci at (±c, 0) where c = √(a² − b²).",
    assumptions:
      "a > b > 0, the centre is at the origin, and the major axis lies along x. A tall ellipse swaps the roles of a and b and puts the foci on the y-axis.",
    diagram: {
      description: "The pen point P keeps r₁ + r₂ fixed at 2a as it travels around the curve.",
      svg: stringSvg,
    },
  },
  {
    id: "ellipse-area",
    title: "Why the area of an ellipse is πab",
    equation: "A = πab",
    startingPoint:
      "Start from a circle of radius a, whose area πa² is already known, and squash it vertically until it becomes the ellipse with semi-axes a and b.",
    symbols: [
      { symbol: "a", meaning: "semi-major axis (also the radius of the starting circle)" },
      { symbol: "b", meaning: "semi-minor axis after the squash" },
      { symbol: "k", meaning: "the vertical scale factor b/a" },
    ],
    steps: [
      { expression: "x² + y² = a²", reason: "Begin with the circle of radius a, area πa²." },
      { expression: "(x, y) → (x, ky) with k = b/a", reason: "Scale every point's height by the same factor k, leaving x untouched." },
      { expression: "x²/a² + (y/k)²/a² = 1 ⇒ x²/a² + y²/b² = 1", reason: "Substituting ka = b shows the scaled circle is exactly the ellipse." },
      { expression: "Area of a scaled region = k × original area", reason: "Stretching one direction by k multiplies every thin strip's height, and hence the total area, by k." },
      { expression: "A = (b/a) × πa²", reason: "Apply the scale factor to the circle's area." },
      { expression: "A = πab", reason: "Cancel one factor of a." },
    ],
    result: "An ellipse with semi-axes a and b has area πab, which reduces to πr² when a = b = r.",
    assumptions: "a, b > 0. The scaling argument needs only that a one-directional stretch multiplies area by the same factor everywhere.",
    diagram: {
      description: "Squashing the circle of radius a by b/a produces the ellipse and scales the area by the same factor.",
      svg: stretchSvg,
    },
  },
  {
    id: "ramanujan-perimeter",
    title: "Ramanujan's perimeter approximation (an estimate, not an identity)",
    equation: "C ≈ π[3(a+b) − √((3a+b)(a+3b))]",
    startingPoint:
      "This is an approximation, not a derivation. The exact perimeter is the complete elliptic integral of the second kind, C = 4a·E(e), which has no closed form in elementary functions — so Ramanujan (1914) fitted a compact formula that matches its series expansion to high order.",
    symbols: [
      { symbol: "a, b", meaning: "the two semi-axes" },
      { symbol: "h", meaning: "the shape parameter ((a−b)/(a+b))², zero for a circle" },
      { symbol: "C", meaning: "perimeter (circumference) of the ellipse" },
    ],
    steps: [
      { expression: "C = 4a ∫₀^(π/2) √(1 − e²sin²θ) dθ", reason: "The exact arc length integral; the integrand's square root is what blocks an elementary answer." },
      { expression: "C = π(a+b)(1 + h/4 + h²/64 + h³/256 + …), h = ((a−b)/(a+b))²", reason: "Expand the integral as a series in the shape parameter h." },
      { expression: "C ≈ π(a+b)(1 + 3h/(10 + √(4 − 3h)))", reason: "Ramanujan's second approximation: a rational-plus-radical form chosen to reproduce the series to high order." },
      { expression: "C ≈ π[3(a+b) − √((3a+b)(a+3b))]", reason: "Rewrite that expression in terms of a and b directly — the algebraically equivalent working form." },
    ],
    result:
      "C ≈ π[3(a+b) − √((3a+b)(a+3b))]. It is exact for a circle (giving 2πr) and stays within about 0.005% of the true perimeter for moderate eccentricity, drifting only as the ellipse becomes extremely flat.",
    assumptions:
      "a, b > 0. This is an approximation formula, so quoted digits beyond ~4 significant figures should be checked against numerical integration for very eccentric ellipses.",
  },
]);
