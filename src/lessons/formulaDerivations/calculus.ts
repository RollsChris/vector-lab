import { registerFormulaDerivations } from "../../core/FormulaDerivations";

const slopeSvg = `
  <svg viewBox="0 0 360 190" role="img" aria-label="Curve with two secant points approaching a tangent point">
    <line x1="24" y1="160" x2="340" y2="160" stroke="#8b949e" stroke-width="2"/>
    <line x1="55" y1="178" x2="55" y2="18" stroke="#8b949e" stroke-width="2"/>
    <path d="M55 145 C115 140 132 112 170 78 S255 28 332 48" fill="none" stroke="#58a6ff" stroke-width="4"/>
    <line x1="122" y1="126" x2="275" y2="41" stroke="#ffd166" stroke-width="3"/>
    <line x1="105" y1="139" x2="235" y2="50" stroke="#7ee787" stroke-width="3"/>
    <circle cx="160" cy="87" r="5" fill="#f0f6fc"/><circle cx="232" cy="57" r="5" fill="#ffd166"/>
    <line x1="160" y1="87" x2="232" y2="87" stroke="#d2a8ff" stroke-width="2" stroke-dasharray="5 4"/>
    <line x1="232" y1="87" x2="232" y2="57" stroke="#d2a8ff" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="185" y="103" fill="#d2a8ff" font-size="15">run h</text>
    <text x="238" y="77" fill="#d2a8ff" font-size="15">rise</text>
    <text x="267" y="35" fill="#ffd166" font-size="15">secant</text>
    <text x="83" y="133" fill="#7ee787" font-size="15">tangent</text>
  </svg>`;

const rulePipelineSvg = `
  <svg viewBox="0 0 360 180" role="img" aria-label="Nested function pipeline showing inner then outer operation and their derivative factors">
    <rect x="18" y="54" width="72" height="56" rx="8" fill="#58a6ff22" stroke="#58a6ff" stroke-width="3"/>
    <rect x="144" y="54" width="72" height="56" rx="8" fill="#d2a8ff22" stroke="#d2a8ff" stroke-width="3"/>
    <rect x="270" y="54" width="72" height="56" rx="8" fill="#7ee78722" stroke="#7ee787" stroke-width="3"/>
    <text x="47" y="88" fill="#58a6ff" font-size="18">x</text>
    <text x="164" y="78" fill="#d2a8ff" font-size="15">inner</text><text x="162" y="98" fill="#d2a8ff" font-size="15">g(x)</text>
    <text x="291" y="78" fill="#7ee787" font-size="15">outer</text><text x="285" y="98" fill="#7ee787" font-size="15">f(g)</text>
    <line x1="90" y1="82" x2="144" y2="82" stroke="#ffd166" stroke-width="3"/><path d="M144 82 l-10 -6 v12 z" fill="#ffd166"/>
    <line x1="216" y1="82" x2="270" y2="82" stroke="#ffd166" stroke-width="3"/><path d="M270 82 l-10 -6 v12 z" fill="#ffd166"/>
    <text x="96" y="45" fill="#ffd166" font-size="14">factor g′(x)</text>
    <text x="222" y="45" fill="#ffd166" font-size="14">factor f′(g)</text>
    <text x="103" y="145" fill="#f0f6fc" font-size="16">total rate = outer rate × inner rate</text>
  </svg>`;

const areaSvg = `
  <svg viewBox="0 0 360 190" role="img" aria-label="Area under a curve approximated by thin rectangles">
    <line x1="26" y1="158" x2="340" y2="158" stroke="#8b949e" stroke-width="2"/>
    <path d="M30 137 C75 126 104 48 156 55 S244 130 330 38" fill="none" stroke="#58a6ff" stroke-width="4"/>
    <g fill="#7ee78744" stroke="#7ee787" stroke-width="1">
      <rect x="62" y="112" width="28" height="46"/><rect x="90" y="78" width="28" height="80"/>
      <rect x="118" y="57" width="28" height="101"/><rect x="146" y="58" width="28" height="100"/>
      <rect x="174" y="73" width="28" height="85"/><rect x="202" y="99" width="28" height="59"/>
      <rect x="230" y="111" width="28" height="47"/><rect x="258" y="91" width="28" height="67"/>
    </g>
    <line x1="62" y1="170" x2="90" y2="170" stroke="#ffd166" stroke-width="2"/>
    <text x="61" y="186" fill="#ffd166" font-size="14">Δx</text>
    <text x="112" y="30" fill="#58a6ff" font-size="15">f(x)</text>
    <text x="192" y="146" fill="#7ee787" font-size="15">Σ height × width</text>
  </svg>`;

const stationarySvg = `
  <svg viewBox="0 0 360 190" role="img" aria-label="Curve with a local maximum and minimum where tangent lines are horizontal">
    <line x1="22" y1="102" x2="340" y2="102" stroke="#8b949e" stroke-width="2"/>
    <path d="M25 137 C73 165 96 36 150 48 S211 159 267 139 S315 56 340 73"
      fill="none" stroke="#58a6ff" stroke-width="4"/>
    <line x1="102" y1="45" x2="190" y2="45" stroke="#ff7b72" stroke-width="3"/>
    <line x1="222" y1="144" x2="306" y2="144" stroke="#7ee787" stroke-width="3"/>
    <circle cx="146" cy="48" r="6" fill="#ff7b72"/><circle cx="264" cy="139" r="6" fill="#7ee787"/>
    <text x="111" y="28" fill="#ff7b72" font-size="15">f′ = 0, f″ &lt; 0</text>
    <text x="222" y="174" fill="#7ee787" font-size="15">f′ = 0, f″ &gt; 0</text>
  </svg>`;

const taylorSvg = `
  <svg viewBox="0 0 360 190" role="img" aria-label="Function and Taylor polynomial touching at a centre point and matching locally">
    <line x1="22" y1="150" x2="340" y2="150" stroke="#8b949e" stroke-width="2"/>
    <path d="M25 126 C70 45 108 40 151 89 S242 172 335 52" fill="none" stroke="#58a6ff" stroke-width="4"/>
    <path d="M45 119 C91 58 119 55 154 91 S225 146 312 75" fill="none" stroke="#ffa657" stroke-width="3" stroke-dasharray="7 5"/>
    <circle cx="154" cy="91" r="6" fill="#7ee787"/>
    <line x1="154" y1="91" x2="154" y2="150" stroke="#7ee787" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="148" y="170" fill="#7ee787" font-size="16">a</text>
    <text x="28" y="34" fill="#58a6ff" font-size="15">f(x)</text>
    <text x="258" y="105" fill="#ffa657" font-size="15">Tₙ(x)</text>
  </svg>`;

const vectorSvg = `
  <svg viewBox="0 0 360 190" role="img" aria-label="A point fed into two component formulas to produce one vector arrow">
    <circle cx="50" cy="96" r="7" fill="#ffd166"/>
    <text x="22" y="125" fill="#ffd166" font-size="15">(x,y)</text>
    <rect x="105" y="30" width="100" height="48" rx="7" fill="#ff7b7222" stroke="#ff7b72" stroke-width="3"/>
    <rect x="105" y="112" width="100" height="48" rx="7" fill="#7ee78722" stroke="#7ee787" stroke-width="3"/>
    <text x="126" y="60" fill="#ff7b72" font-size="16">P(x,y)</text>
    <text x="126" y="142" fill="#7ee787" font-size="16">Q(x,y)</text>
    <line x1="57" y1="91" x2="105" y2="54" stroke="#8b949e" stroke-width="2"/>
    <line x1="57" y1="101" x2="105" y2="136" stroke="#8b949e" stroke-width="2"/>
    <line x1="245" y1="145" x2="245" y2="53" stroke="#7ee787" stroke-width="4"/>
    <line x1="245" y1="145" x2="325" y2="145" stroke="#ff7b72" stroke-width="4"/>
    <line x1="245" y1="145" x2="325" y2="53" stroke="#ffd166" stroke-width="5"/>
    <path d="M325 53 l-12 2 9 8 z" fill="#ffd166"/>
    <text x="275" y="166" fill="#ff7b72" font-size="14">P</text><text x="228" y="88" fill="#7ee787" font-size="14">Q</text>
  </svg>`;

registerFormulaDerivations("differentiation", [
  {
    id: "line-equation",
    title: "How slope and intercept make y = mx + c",
    equation: "y = mx + c",
    startingPoint: "A straight line changes by the same amount m for every one-unit increase in x.",
    steps: [
      { expression: "Δy = mΔx", reason: "Use the definition m = Δy/Δx and multiply by Δx." },
      { expression: "y − c = mx", reason: "Measure the change from the point where x = 0 and y = c." },
      { expression: "y = mx + c", reason: "Add the starting height c back to the accumulated rise mx." },
    ],
    result: "m controls the line's tilt and c translates the entire line vertically.",
    assumptions: "This form describes non-vertical lines. A vertical line has undefined slope and is written x = constant.",
    diagram: { description: "Rise divided by run gives the constant slope of the line.", svg: slopeSvg },
  },
  {
    id: "slope-ratio",
    title: "Why slope is rise divided by run",
    equation: "m = Δy/Δx",
    startingPoint: "Choose two distinct points (x₁,y₁) and (x₂,y₂) on a straight line.",
    steps: [
      { expression: "Δx = x₂ − x₁", reason: "The horizontal run is the change in input." },
      { expression: "Δy = y₂ − y₁", reason: "The vertical rise is the corresponding change in output." },
      { expression: "m = (y₂ − y₁)/(x₂ − x₁)", reason: "Divide output change by input change to measure change per unit x." },
    ],
    result: "Positive m rises left-to-right, negative m falls, and m = 0 is horizontal.",
    assumptions: "The two x-values must differ. For a curve this ratio is an average slope over the chosen interval.",
    diagram: { description: "The secant's vertical rise and horizontal run form the slope ratio.", svg: slopeSvg },
  },
  {
    id: "average-slope",
    title: "How the secant formula measures average change",
    equation: "[f(x+h) − f(x)]/h",
    startingPoint: "Use the two curve points (x,f(x)) and (x+h,f(x+h)).",
    steps: [
      { expression: "Δx = (x+h) − x = h", reason: "The horizontal separation is exactly the selected gap h." },
      { expression: "Δy = f(x+h) − f(x)", reason: "Subtract the first height from the second height." },
      { expression: "average slope = Δy/Δx = [f(x+h) − f(x)]/h", reason: "Apply rise divided by run to the secant line." },
    ],
    result: "The quotient is the function's average rate of change across the interval from x to x+h.",
    assumptions: "h must be nonzero and both function values must exist.",
    diagram: { description: "The gold secant joins the two sampled curve points.", svg: slopeSvg },
  },
  {
    id: "derivative-limit",
    title: "Why the derivative is a limit of secant slopes",
    equation: "f′(x) = limₕ→0 [f(x+h) − f(x)]/h",
    startingPoint: "The difference quotient is the slope through a point and a second point h units away.",
    steps: [
      { expression: "[f(x+h) − f(x)]/h", reason: "Start with the secant's average slope." },
      { expression: "h → 0", reason: "Move the second point arbitrarily close to the first, so the secant approaches the local tangent." },
      { expression: "f′(x) = limₕ→0 …", reason: "If the secant slopes approach one finite value, define that value as the instantaneous slope." },
    ],
    result: "The derivative converts local change in f into a new function giving slope at every x.",
    assumptions: "The limit must exist. Corners, cusps, jumps and vertical tangents can make a function nondifferentiable.",
    diagram: { description: "As h shrinks, the secant rotates toward the tangent at the chosen point.", svg: slopeSvg },
  },
  {
    id: "power-rule",
    title: "Deriving the power rule from the limit definition",
    equation: "d(xⁿ)/dx = nxⁿ⁻¹",
    startingPoint: "Apply the derivative definition to f(x) = xⁿ for a positive integer n.",
    steps: [
      { expression: "[(x+h)ⁿ − xⁿ]/h", reason: "Substitute xⁿ into the difference quotient." },
      { expression: "(x+h)ⁿ = xⁿ + nxⁿ⁻¹h + terms containing h² or higher", reason: "Expand using the binomial theorem." },
      { expression: "nxⁿ⁻¹ + terms containing h", reason: "Cancel xⁿ, then divide every remaining term by h." },
      { expression: "limₕ→0 = nxⁿ⁻¹", reason: "Every remaining term containing h vanishes in the limit." },
    ],
    result: "Bring the exponent down as a multiplier and reduce the exponent by one.",
    assumptions: "The displayed binomial derivation starts with positive integers; the rule extends to real powers wherever xⁿ is differentiable.",
    diagram: { description: "The derivative is obtained by shrinking the same secant gap used in the limit definition.", svg: slopeSvg },
  },
  {
    id: "stationary-condition",
    title: "Why interior smooth extrema satisfy f′(x) = 0",
    equation: "f′(x) = 0",
    startingPoint: "At a smooth local maximum or minimum inside the domain, nearby points lie on both sides of the candidate.",
    steps: [
      { expression: "left secant slopes and right secant slopes", reason: "Compare the candidate with points approaching from each direction." },
      { expression: "slopes approach the same derivative", reason: "Differentiability requires both one-sided limits to agree." },
      { expression: "f′(x) = 0", reason: "At an extremum the one-sided changes switch sign, so their only common finite limit is zero." },
    ],
    result: "Solving f′ = 0 finds stationary candidates; endpoints and nondifferentiable points must also be checked.",
    assumptions: "This is a necessary condition for differentiable interior extrema, not a guarantee that every solution is a maximum or minimum.",
    diagram: { description: "The tangent is horizontal at the marked smooth maximum and minimum.", svg: stationarySvg },
  },
  {
    id: "constant-derivative",
    title: "Why a constant has derivative zero",
    equation: "d(c)/dx = 0",
    startingPoint: "For f(x) = c, the output is unchanged at x and x+h.",
    steps: [
      { expression: "[f(x+h) − f(x)]/h = (c − c)/h", reason: "Insert the constant function into the difference quotient." },
      { expression: "0/h = 0", reason: "The rise is zero for every nonzero gap." },
      { expression: "limₕ→0 0 = 0", reason: "The constant secant slope remains zero as the gap shrinks." },
    ],
    result: "Vertical translations do not change a graph's slope.",
    assumptions: "c is independent of x.",
  },
  {
    id: "linear-derivative",
    title: "Why d(x)/dx = 1",
    equation: "d(x)/dx = 1",
    startingPoint: "The identity function f(x) = x is a line with one unit of rise per unit of run.",
    steps: [
      { expression: "[(x+h) − x]/h", reason: "Apply the derivative definition." },
      { expression: "h/h = 1", reason: "Cancel the equal input and output changes." },
      { expression: "limₕ→0 1 = 1", reason: "Every secant and tangent slope is one." },
    ],
    result: "The identity function changes at exactly the same rate as its input.",
    assumptions: "h is nonzero before taking the limit.",
  },
  {
    id: "sqrt-derivative",
    title: "Deriving the derivative of √x",
    equation: "d(√x)/dx = 1/(2√x)",
    startingPoint: "Apply the limit definition and rationalize the numerator.",
    steps: [
      { expression: "[√(x+h) − √x]/h", reason: "Write the difference quotient." },
      { expression: "1/[√(x+h) + √x]", reason: "Multiply numerator and denominator by the conjugate; the numerator becomes h and cancels." },
      { expression: "1/(2√x)", reason: "Let h approach zero." },
    ],
    result: "The square-root curve's slope is positive but decreases as x grows.",
    assumptions: "For real-valued √x, this derivative applies for x > 0; at x = 0 the tangent is vertical.",
  },
  {
    id: "reciprocal-derivative",
    title: "Deriving the derivative of 1/x",
    equation: "d(1/x)/dx = −1/x²",
    startingPoint: "Apply the difference quotient to f(x) = 1/x.",
    steps: [
      { expression: "[1/(x+h) − 1/x]/h", reason: "Substitute the reciprocal function." },
      { expression: "[x − (x+h)]/[hx(x+h)]", reason: "Combine the fractions over a common denominator." },
      { expression: "−1/[x(x+h)]", reason: "The numerator is −h, which cancels the outside h." },
      { expression: "−1/x²", reason: "Let h approach zero." },
    ],
    result: "The reciprocal decreases on both sides of its vertical asymptote.",
    assumptions: "x ≠ 0 and the interval used must not cross the singularity.",
  },
  {
    id: "exp-derivative",
    title: "Why eˣ is its own derivative",
    equation: "d(eˣ)/dx = eˣ",
    startingPoint: "Use the exponential law eˣ⁺ʰ = eˣeʰ in the difference quotient.",
    steps: [
      { expression: "[eˣeʰ − eˣ]/h = eˣ[(eʰ − 1)/h]", reason: "Factor out the value eˣ at the point." },
      { expression: "limₕ→0 (eʰ − 1)/h = 1", reason: "The number e is defined equivalently as the exponential base with unit slope at zero." },
      { expression: "d(eˣ)/dx = eˣ", reason: "Multiply eˣ by the unit limiting factor." },
    ],
    result: "At every point, the exponential's instantaneous growth rate equals its current value.",
    assumptions: "This uses the natural exponential base e; d(aˣ)/dx = aˣ ln a for other positive bases.",
  },
  {
    id: "log-derivative",
    title: "Deriving the derivative of ln x by inverse functions",
    equation: "d(ln x)/dx = 1/x",
    startingPoint: "Let y = ln x, so the inverse relation is x = eʸ.",
    steps: [
      { expression: "dx/dy = eʸ", reason: "Differentiate x = eʸ with respect to y." },
      { expression: "dy/dx = 1/(dx/dy)", reason: "Derivatives of differentiable inverse functions are reciprocal." },
      { expression: "dy/dx = 1/eʸ = 1/x", reason: "Replace eʸ using the inverse relation x = eʸ." },
    ],
    result: "The natural logarithm grows slowly, with slope inversely proportional to x.",
    assumptions: "For real logarithms x > 0.",
    diagram: { description: "The inverse-function pipeline reverses input and output, so the local rate is reciprocated.", svg: rulePipelineSvg },
  },
  {
    id: "sin-derivative",
    title: "Why the derivative of sin x is cos x",
    equation: "d(sin x)/dx = cos x",
    startingPoint: "Apply the angle-addition identity to sin(x+h) inside the difference quotient.",
    steps: [
      { expression: "[sin x(cos h − 1) + cos x sin h]/h", reason: "Expand sin(x+h) and subtract sin x." },
      { expression: "sin x[(cos h − 1)/h] + cos x[sin h/h]", reason: "Separate the two limiting factors." },
      { expression: "sin x·0 + cos x·1 = cos x", reason: "Use the standard small-angle limits as h approaches zero." },
    ],
    result: "Cosine records the sine wave's slope: largest at zero crossings and zero at crests and troughs.",
    assumptions: "Angles are measured in radians; degree measure introduces an additional π/180 factor.",
    diagram: { description: "The tangent is flat at sine-wave extrema and steepest at zero crossings.", svg: slopeSvg },
  },
  {
    id: "cos-derivative",
    title: "Why the derivative of cos x is −sin x",
    equation: "d(cos x)/dx = −sin x",
    startingPoint: "Use cos(x+h) = cos x cos h − sin x sin h in the difference quotient.",
    steps: [
      { expression: "cos x[(cos h − 1)/h] − sin x[sin h/h]", reason: "Expand, subtract cos x and separate the terms." },
      { expression: "cos x·0 − sin x·1", reason: "Apply the standard small-angle limits." },
      { expression: "−sin x", reason: "Simplify the remaining term." },
    ],
    result: "The negative sign reflects that cosine initially falls as x increases from zero.",
    assumptions: "Angles are in radians.",
  },
  {
    id: "tan-derivative",
    title: "Deriving the tangent derivative with the quotient rule",
    equation: "d(tan x)/dx = 1/cos²x",
    startingPoint: "Write tan x = sin x / cos x.",
    steps: [
      { expression: "(cos x·cos x − sin x·(−sin x))/cos²x", reason: "Apply the quotient rule using (sin x)′ = cos x and (cos x)′ = −sin x." },
      { expression: "(cos²x + sin²x)/cos²x", reason: "Collect the numerator." },
      { expression: "1/cos²x", reason: "Use sin²x + cos²x = 1." },
    ],
    result: "Tangent's slope is sec²x and grows without bound near its vertical asymptotes.",
    assumptions: "cos x must be nonzero.",
  },
  {
    id: "constant-multiple-rule",
    title: "Why constant factors pass through a derivative",
    equation: "(kf)′ = kf′",
    startingPoint: "Put kf into the derivative limit.",
    steps: [
      { expression: "[kf(x+h) − kf(x)]/h", reason: "Apply the difference quotient." },
      { expression: "k[f(x+h) − f(x)]/h", reason: "Factor out the constant k." },
      { expression: "k f′(x)", reason: "Constants can be pulled through the limit." },
    ],
    result: "Scaling a graph vertically scales every slope by the same factor.",
    assumptions: "k is constant with respect to x.",
  },
  {
    id: "sum-rule",
    title: "Why derivatives distribute over sums",
    equation: "(f ± g)′ = f′ ± g′",
    startingPoint: "Apply the difference quotient to f(x) ± g(x).",
    steps: [
      { expression: "{[f(x+h)−f(x)] ± [g(x+h)−g(x)]}/h", reason: "Regroup the numerator by function." },
      { expression: "[f(x+h)−f(x)]/h ± [g(x+h)−g(x)]/h", reason: "Split the quotient." },
      { expression: "f′(x) ± g′(x)", reason: "Take the limits term by term." },
    ],
    result: "Differentiate a sum or difference one term at a time.",
    assumptions: "Both component derivatives must exist at the point.",
  },
  {
    id: "product-rule",
    title: "Why differentiating a product creates two terms",
    equation: "(fg)′ = f′g + fg′",
    startingPoint: "A product changes because either factor can change.",
    steps: [
      { expression: "[f(x+h)g(x+h) − f(x)g(x)]/h", reason: "Start with the product difference quotient." },
      { expression: "add and subtract f(x+h)g(x)", reason: "Create two differences without changing the numerator." },
      { expression: "f(x+h)[g(x+h)−g(x)]/h + g(x)[f(x+h)−f(x)]/h", reason: "Factor each group." },
      { expression: "f(x)g′(x) + g(x)f′(x)", reason: "Take h to zero and use continuity of differentiable f." },
    ],
    result: "Hold each factor in turn while differentiating the other, then add the two contributions.",
    assumptions: "f and g are differentiable at x.",
    diagram: { description: "Both parts of a two-stage calculation can contribute to the total change.", svg: rulePipelineSvg },
  },
  {
    id: "quotient-rule",
    title: "How the quotient rule follows from product and reciprocal rules",
    equation: "(f/g)′ = (f′g − fg′)/g²",
    startingPoint: "Rewrite f/g as f·g⁻¹.",
    steps: [
      { expression: "f′g⁻¹ + f(g⁻¹)′", reason: "Apply the product rule." },
      { expression: "(g⁻¹)′ = −g⁻²g′", reason: "Apply the chain rule to the reciprocal power." },
      { expression: "f′/g − fg′/g²", reason: "Substitute the reciprocal derivative." },
      { expression: "(f′g − fg′)/g²", reason: "Combine over the common denominator." },
    ],
    result: "Differentiate numerator times denominator minus numerator times differentiated denominator, all over denominator squared.",
    assumptions: "f and g are differentiable and g(x) ≠ 0.",
  },
  {
    id: "chain-rule",
    title: "Why nested rates multiply",
    equation: "d f(g(x))/dx = f′(g(x))g′(x)",
    startingPoint: "A change in x first changes the inner value g, which then changes the outer value f.",
    steps: [
      { expression: "Δf/Δx = (Δf/Δg)(Δg/Δx)", reason: "Insert the nonzero inner change Δg and cancel it algebraically." },
      { expression: "Δx → 0", reason: "As the input gap shrinks, the two ratios approach the outer and inner derivatives." },
      { expression: "f′(g(x))g′(x)", reason: "Multiply the local rate of the outer stage by the local rate of the inner stage." },
    ],
    result: "Differentiate the outer function at the current inner value, then multiply by the inner derivative.",
    assumptions: "The inner function is differentiable at x and the outer function is differentiable at g(x).",
    diagram: { description: "The input passes through an inner and outer stage, so their local rate factors multiply.", svg: rulePipelineSvg },
  },
]);

registerFormulaDerivations("integration", [
  {
    id: "riemann-sum",
    title: "How rectangles approximate signed area",
    equation: "Sₙ = Σᵢ f(xᵢ*)Δx",
    startingPoint: "Split [a,b] into n subintervals, each with width Δx = (b−a)/n.",
    steps: [
      { expression: "areaᵢ ≈ f(xᵢ*)Δx", reason: "Use a sampled function height times the subinterval width." },
      { expression: "Sₙ = Σᵢ f(xᵢ*)Δx", reason: "Add the signed rectangle areas across the interval." },
      { expression: "n increases, Δx decreases", reason: "Thinner rectangles follow the curve more closely." },
    ],
    result: "The Riemann sum is a finite numerical approximation to the definite integral.",
    assumptions: "The function must be integrable; the selected left, right or midpoint sample changes finite-n error but not the limit for Riemann-integrable functions.",
    diagram: { description: "Each green rectangle contributes sampled height times width.", svg: areaSvg },
  },
  {
    id: "definite-integral",
    title: "Why the definite integral is a limit of sums",
    equation: "∫ₐᵇ f(x)dx = limₙ→∞ Σᵢ f(xᵢ*)Δx",
    startingPoint: "A finite Riemann sum leaves gaps or excess where rectangle tops do not match a curved boundary.",
    steps: [
      { expression: "Δx = (b−a)/n", reason: "Equal subdivision makes each slice thinner as n grows." },
      { expression: "Σᵢ f(xᵢ*)Δx", reason: "Compute the signed area approximation for that partition." },
      { expression: "limₙ→∞", reason: "Let the maximum slice width approach zero so the approximation converges independently of sample choice." },
    ],
    result: "The limiting signed sum defines the exact accumulated area from a to b.",
    assumptions: "Continuous functions on [a,b] are integrable. Areas below the x-axis contribute negative values.",
    diagram: { description: "Increasing the rectangle count makes their combined boundary approach the curve.", svg: areaSvg },
  },
  {
    id: "fundamental-theorem",
    title: "Why accumulated area has derivative f(x)",
    equation: "F(x) = ∫ₐˣ f(t)dt ⇒ F′(x) = f(x)",
    startingPoint: "Increase the upper limit from x to x+h; the added area is a thin strip under f.",
    steps: [
      { expression: "F(x+h) − F(x) = ∫ₓˣ⁺ʰ f(t)dt", reason: "The common area from a to x cancels." },
      { expression: "[F(x+h)−F(x)]/h = average value of f on [x,x+h]", reason: "Divide the thin strip's area by its width." },
      { expression: "limₕ→0 = f(x)", reason: "For continuous f, the interval's average height approaches the point height." },
    ],
    result: "Differentiation and integration undo each other: the slope of accumulated area is the original function.",
    assumptions: "The displayed form assumes f is continuous at x; broader versions hold under weaker integrability conditions.",
    diagram: { description: "A small movement of the upper limit adds a strip whose height approaches f(x).", svg: areaSvg },
  },
]);

registerFormulaDerivations("optimization", [
  {
    id: "optimization-stationary",
    title: "Why optimization starts by solving f′(x) = 0",
    equation: "f′(x) = 0",
    startingPoint: "At a differentiable interior optimum, the graph changes from rising to falling or from falling to rising.",
    steps: [
      { expression: "nearby secant slopes approach the tangent slope", reason: "The derivative is the limiting local rate of change." },
      { expression: "sign changes across the candidate", reason: "A maximum changes + to −; a minimum changes − to +." },
      { expression: "f′(x) = 0", reason: "A finite derivative shared by both sides must pass through zero." },
    ],
    result: "Stationary solutions are candidates; compare their objective values with endpoints and nondifferentiable candidates.",
    assumptions: "The condition applies to smooth interior optima and is necessary, not sufficient.",
    diagram: { description: "Horizontal tangents identify the smooth stationary candidates.", svg: stationarySvg },
  },
  {
    id: "second-derivative-test",
    title: "How the second derivative classifies a stationary point",
    equation: "f′(x*) = 0; f″(x*) > 0 ⇒ minimum, f″(x*) < 0 ⇒ maximum",
    startingPoint: "The second derivative measures how the first derivative changes near the stationary point.",
    steps: [
      { expression: "f″(x*) > 0", reason: "The slope is increasing through zero: negative before and positive after." },
      { expression: "curve bends upward", reason: "That slope pattern produces a local valley." },
      { expression: "f″(x*) < 0", reason: "The slope is decreasing through zero: positive before and negative after, producing a peak." },
    ],
    result: "Positive curvature classifies a minimum and negative curvature classifies a maximum.",
    assumptions: "If f″(x*) = 0 or does not exist, the test is inconclusive; inspect higher derivatives or sign changes.",
    diagram: { description: "The peak has negative curvature and the valley has positive curvature.", svg: stationarySvg },
  },
]);

registerFormulaDerivations("taylor-series", [
  {
    id: "taylor-polynomial",
    title: "Why Taylor coefficients are derivatives divided by factorials",
    equation: "Tₙ(x) = Σₖ₌₀ⁿ f⁽ᵏ⁾(a)(x−a)ᵏ/k!",
    startingPoint: "Choose a polynomial whose value and first n derivatives match f at the centre a.",
    steps: [
      { expression: "Tₙ(x) = c₀ + c₁(x−a) + c₂(x−a)² + ⋯", reason: "Write the polynomial in powers centred at a." },
      { expression: "Tₙ(a) = c₀ = f(a)", reason: "At x=a every positive power vanishes." },
      { expression: "Tₙ⁽ᵏ⁾(a) = k! cₖ", reason: "After differentiating k times, only the kth centred term contributes a nonzero constant at a." },
      { expression: "cₖ = f⁽ᵏ⁾(a)/k!", reason: "Set the polynomial's kth derivative equal to the function's kth derivative and solve." },
    ],
    result: "The degree-n polynomial has the same local value, slope, curvature and higher derivative data through order n.",
    assumptions: "Accuracy away from a depends on the remainder and the function's convergence properties; not every smooth function equals its Taylor series globally.",
    diagram: { description: "The orange polynomial touches the blue function at a and increasingly matches its local shape.", svg: taylorSvg },
  },
]);

registerFormulaDerivations("vector-field", [
  {
    id: "field-components",
    title: "How component functions define a vector field",
    equation: "F(x,y,z) = (P(x,y,z), Q(x,y,z), R(x,y,z))",
    startingPoint: "A vector needs one signed component for each coordinate direction.",
    steps: [
      { expression: "(x,y,z)", reason: "Choose the position where the field is being evaluated." },
      { expression: "P, Q, R", reason: "Run that same position through the rightward, upward and depth component rules." },
      { expression: "F = Pî + Qĵ + Rk̂", reason: "Combine the three perpendicular directional contributions into one vector." },
    ],
    result: "Evaluating F at every position supplies the arrow direction and magnitude drawn by the lesson.",
    assumptions: "A 2D field omits R and z. Component formulas may be nonlinear or time-dependent if those inputs are included.",
    diagram: { description: "One position feeds component rules whose outputs assemble the resulting arrow.", svg: vectorSvg },
  },
  {
    id: "field-evaluation",
    title: "How a point becomes the displayed field arrow",
    equation: "F(p) = (P(p), Q(p), R(p)); |F| = √(P²+Q²+R²)",
    startingPoint: "The probe chooses one concrete position p and substitutes its coordinates into every component formula.",
    steps: [
      { expression: "P(p), Q(p), R(p)", reason: "Evaluate each directional push at the same probe position." },
      { expression: "F(p) = (P,Q,R)", reason: "Use the component values as the arrow's coordinate differences." },
      { expression: "|F| = √(P²+Q²+R²)", reason: "Apply the Pythagorean theorem across perpendicular components to get arrow magnitude." },
    ],
    result: "The component signs set direction; their Euclidean length sets the field strength reported for the probe.",
    assumptions: "The magnitude formula uses ordinary Cartesian coordinates with perpendicular unit axes.",
    diagram: { description: "The red and green component legs combine into the yellow resultant arrow.", svg: vectorSvg },
  },
  {
    id: "linear-field-map",
    title: "How four coefficients make a 2D linear field",
    equation: "P = ax + by; Q = cx + dy",
    startingPoint: "A linear map combines each input coordinate with a fixed contribution to each output direction.",
    steps: [
      { expression: "x(a,c)", reason: "Moving one unit in x contributes a units right and c units up." },
      { expression: "y(b,d)", reason: "Moving one unit in y contributes b units right and d units up." },
      { expression: "F(x,y) = x(a,c) + y(b,d) = (ax+by, cx+dy)", reason: "Add the scaled column effects component by component." },
    ],
    result: "The coefficients determine sources, sinks, rotations, shears and saddles through one matrix-like mapping.",
    assumptions: "This is a homogeneous linear field with no constant offset; the lesson's z controls extend the same construction to three dimensions.",
    diagram: { description: "The two component calculations become the horizontal and vertical parts of one arrow.", svg: vectorSvg },
  },
]);
