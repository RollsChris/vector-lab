import type { FormulaDerivation } from "../../core/FormulaDerivations";

const rectangleSvg = `
  <svg viewBox="0 0 320 170" role="img" aria-label="A rectangle of height a split into widths b and c">
    <rect x="55" y="42" width="210" height="88" fill="#58a6ff22" stroke="#58a6ff" stroke-width="3"/>
    <line x1="180" y1="42" x2="180" y2="130" stroke="#ffd166" stroke-width="3"/>
    <text x="28" y="92" fill="#7ee787" font-size="18">a</text>
    <text x="112" y="153" fill="#ffd166" font-size="18">b</text>
    <text x="218" y="153" fill="#d2a8ff" font-size="18">c</text>
    <text x="95" y="92" fill="#ffffff" font-size="17">ab</text>
    <text x="215" y="92" fill="#ffffff" font-size="17">ac</text>
  </svg>`;

const balanceSvg = `
  <svg viewBox="0 0 320 170" role="img" aria-label="Balanced scales receiving the same subtraction on both sides">
    <line x1="55" y1="72" x2="265" y2="72" stroke="#58a6ff" stroke-width="5"/>
    <path d="M160 72 L125 140 H195 Z" fill="#8b949e"/>
    <line x1="92" y1="72" x2="92" y2="112" stroke="#ffd166" stroke-width="2"/>
    <line x1="228" y1="72" x2="228" y2="112" stroke="#ffd166" stroke-width="2"/>
    <path d="M57 112 H127 L117 137 H67 Z" fill="#7ee78733" stroke="#7ee787" stroke-width="2"/>
    <path d="M193 112 H263 L253 137 H203 Z" fill="#7ee78733" stroke="#7ee787" stroke-width="2"/>
    <text x="65" y="103" fill="#ffffff" font-size="16">left − b</text>
    <text x="198" y="103" fill="#ffffff" font-size="16">right − b</text>
  </svg>`;

const unitSvg = `
  <svg viewBox="0 0 320 170" role="img" aria-label="A unit fraction cancelling old units and leaving new units">
    <text x="24" y="88" fill="#ffffff" font-size="20">value old</text>
    <text x="124" y="88" fill="#ffd166" font-size="24">×</text>
    <text x="160" y="62" fill="#7ee787" font-size="18">new</text>
    <line x1="150" y1="72" x2="220" y2="72" stroke="#8b949e" stroke-width="2"/>
    <text x="164" y="98" fill="#ff7b72" font-size="18" text-decoration="line-through">old</text>
    <text x="237" y="88" fill="#ffd166" font-size="24">=</text>
    <text x="270" y="88" fill="#7ee787" font-size="20">new</text>
  </svg>`;

const pascalSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Pascal triangle entry formed by adding the two entries above">
    <text x="112" y="42" fill="#58a6ff" font-size="24">C(n−1,k−1)</text>
    <text x="184" y="83" fill="#58a6ff" font-size="24">C(n−1,k)</text>
    <line x1="150" y1="51" x2="160" y2="120" stroke="#ffd166" stroke-width="3"/>
    <line x1="220" y1="91" x2="160" y2="120" stroke="#ffd166" stroke-width="3"/>
    <text x="95" y="151" fill="#7ee787" font-size="24">C(n,k)</text>
  </svg>`;

const probabilitySvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Overlapping events A and B inside a sample space">
    <rect x="20" y="20" width="280" height="140" rx="8" fill="none" stroke="#8b949e" stroke-width="2"/>
    <circle cx="125" cy="90" r="55" fill="#58a6ff33" stroke="#58a6ff" stroke-width="3"/>
    <circle cx="195" cy="90" r="55" fill="#d2a8ff33" stroke="#d2a8ff" stroke-width="3"/>
    <text x="82" y="92" fill="#58a6ff" font-size="22">A</text>
    <text x="225" y="92" fill="#d2a8ff" font-size="22">B</text>
    <text x="151" y="92" fill="#ffffff" font-size="16">A∩B</text>
  </svg>`;

const walkSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Independent plus or minus one steps accumulating into a random walk">
    <polyline points="25,130 70,90 115,130 160,90 205,50 250,90 295,50" fill="none" stroke="#58a6ff" stroke-width="4"/>
    <line x1="25" y1="150" x2="295" y2="150" stroke="#8b949e" stroke-width="2"/>
    <text x="38" y="82" fill="#7ee787" font-size="17">+1</text>
    <text x="80" y="126" fill="#ff7b72" font-size="17">−1</text>
    <text x="206" y="42" fill="#ffd166" font-size="17">sum of steps</text>
  </svg>`;

const vectorSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Vector with horizontal and vertical components forming a right triangle">
    <line x1="55" y1="140" x2="255" y2="140" stroke="#ffd166" stroke-width="3"/>
    <line x1="255" y1="140" x2="255" y2="40" stroke="#d2a8ff" stroke-width="3"/>
    <line x1="55" y1="140" x2="255" y2="40" stroke="#58a6ff" stroke-width="5"/>
    <path d="M243 140 V128 H255" fill="none" stroke="#7ee787" stroke-width="2"/>
    <text x="145" y="163" fill="#ffd166" font-size="18">x</text>
    <text x="266" y="95" fill="#d2a8ff" font-size="18">y</text>
    <text x="145" y="82" fill="#58a6ff" font-size="18">|v|</text>
  </svg>`;

const complexSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Complex number shown as a radius r and angle theta on the complex plane">
    <line x1="35" y1="140" x2="290" y2="140" stroke="#8b949e" stroke-width="2"/>
    <line x1="65" y1="165" x2="65" y2="20" stroke="#8b949e" stroke-width="2"/>
    <line x1="65" y1="140" x2="245" y2="55" stroke="#58a6ff" stroke-width="4"/>
    <line x1="245" y1="140" x2="245" y2="55" stroke="#d2a8ff" stroke-width="2" stroke-dasharray="6 4"/>
    <path d="M105 140 A40 40 0 0 0 101 123" fill="none" stroke="#7ee787" stroke-width="3"/>
    <text x="111" y="129" fill="#7ee787" font-size="18">θ</text>
    <text x="150" y="88" fill="#58a6ff" font-size="18">r</text>
    <text x="250" y="52" fill="#ffd166" font-size="18">a+bi</text>
  </svg>`;

const markovSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Three states connected by transition arrows">
    <circle cx="65" cy="90" r="30" fill="#58a6ff33" stroke="#58a6ff" stroke-width="3"/>
    <circle cx="160" cy="45" r="30" fill="#7ee78733" stroke="#7ee787" stroke-width="3"/>
    <circle cx="255" cy="90" r="30" fill="#d2a8ff33" stroke="#d2a8ff" stroke-width="3"/>
    <path d="M92 76 L128 59 M190 59 L226 76 M225 105 L94 105" fill="none" stroke="#ffd166" stroke-width="3"/>
    <text x="59" y="97" fill="#ffffff" font-size="18">1</text>
    <text x="154" y="52" fill="#ffffff" font-size="18">2</text>
    <text x="249" y="97" fill="#ffffff" font-size="18">3</text>
  </svg>`;

const primeSvg = `
  <svg viewBox="0 0 320 180" role="img" aria-label="Prime powers acting as independent choices in a divisor">
    <text x="30" y="45" fill="#58a6ff" font-size="22">n = p₁ᵃ¹ p₂ᵃ² ···</text>
    <text x="30" y="88" fill="#ffd166" font-size="19">choose exponent 0…a₁</text>
    <text x="30" y="120" fill="#7ee787" font-size="19">choose exponent 0…a₂</text>
    <text x="30" y="154" fill="#d2a8ff" font-size="20">multiply independent choices</text>
  </svg>`;

export const FOUNDATIONS_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "foundation-index-laws",
    title: "Why the index laws work",
    equation: "xᵐxⁿ=xᵐ⁺ⁿ; xᵐ/xⁿ=xᵐ⁻ⁿ; (xᵐ)ⁿ=xᵐⁿ",
    startingPoint: "For positive whole exponents, xⁿ means a product of n copies of x.",
    steps: [
      { expression: "xᵐxⁿ = (m copies of x)(n copies of x)", reason: "Product law: place the two repeated products end to end." },
      { expression: "xᵐxⁿ = xᵐ⁺ⁿ", reason: "There are m+n copies altogether." },
      { expression: "xᵐ/xⁿ = xᵐ⁻ⁿ", reason: "Quotient law: cancel n matching factors when m≥n." },
      { expression: "(xᵐ)ⁿ = xᵐⁿ", reason: "Power law: n groups, each containing m factors, contain mn factors." },
      { expression: "x⁰=1 and x⁻ⁿ=1/xⁿ", reason: "Extend the quotient law consistently to equal or reversed exponents." },
    ],
    result: "All familiar integer index laws are bookkeeping rules for repeated factors.",
    assumptions: "For quotients and negative powers, x must be non-zero.",
  },
  {
    id: "foundation-distributive",
    title: "Why multiplication distributes over addition",
    equation: "a(b+c)=ab+ac",
    startingPoint: "A rectangle of height a and total width b+c can be measured whole or split into two rectangles.",
    steps: [
      { expression: "Awhole = a(b+c)", reason: "Whole-area method: height times total width." },
      { expression: "Aparts = ab+ac", reason: "Split-area method: add the areas with widths b and c." },
      { expression: "a(b+c)=ab+ac", reason: "Both expressions measure the same rectangle." },
    ],
    result: "Every term inside the bracket must be multiplied by the outside factor.",
    diagram: { description: "The whole rectangle and its two pieces have equal total area.", svg: rectangleSvg },
  },
  {
    id: "foundation-rearrange",
    title: "How v = u + at rearranges for t",
    equation: "t=(v-u)/a",
    startingPoint: "Begin with v=u+at and preserve equality by making the same legal move to both sides.",
    steps: [
      { expression: "v-u = at", reason: "Subtract u from both sides." },
      { expression: "(v-u)/a = t", reason: "Divide both sides by a." },
      { expression: "t=(v-u)/a", reason: "Swap the sides for the conventional presentation." },
    ],
    result: "Reversing the operations isolates t: undo the addition, then undo the multiplication.",
    assumptions: "a must be non-zero.",
    diagram: { description: "Applying the same operation to both pans preserves equality.", svg: balanceSvg },
  },
  {
    id: "foundation-quadratic",
    title: "How completing the square gives the quadratic formula",
    equation: "x=(-b±√(b²-4ac))/(2a)",
    startingPoint: "Start from ax²+bx+c=0 with a≠0.",
    steps: [
      { expression: "x²+(b/a)x = -c/a", reason: "Divide by a, then move the constant term." },
      { expression: "(x+b/2a)² = (b²-4ac)/(4a²)", reason: "Add (b/2a)² to both sides and simplify." },
      { expression: "x+b/2a = ±√(b²-4ac)/(2a)", reason: "Take both square roots." },
      { expression: "x=(-b±√(b²-4ac))/(2a)", reason: "Subtract b/(2a) and combine the numerator." },
    ],
    result: "The ± preserves both possible roots; the discriminant controls whether they are real and distinct.",
    assumptions: "a≠0; over the real numbers, b²−4ac must be non-negative for real roots.",
  },
  {
    id: "foundation-binomial",
    title: "Why the binomial theorem has combination coefficients",
    equation: "(a+b)ⁿ=Σ C(n,r)aⁿ⁻ʳbʳ",
    startingPoint: "Expand (a+b)ⁿ as n identical brackets and choose one term from each bracket.",
    steps: [
      { expression: "aⁿ⁻ʳbʳ", reason: "A term with r choices of b must use a from the other n−r brackets." },
      { expression: "C(n,r)=n!/[r!(n-r)!]", reason: "Choose which r of the n brackets supply b." },
      { expression: "(a+b)ⁿ=Σᵣ₌₀ⁿ C(n,r)aⁿ⁻ʳbʳ", reason: "Add the contributions for every possible number r of b choices." },
    ],
    result: "Pascal coefficients count repeated products that combine into the same algebraic term.",
    assumptions: "n is a non-negative integer.",
    diagram: { description: "Pascal entries count the choices that create each binomial term.", svg: pascalSvg },
  },
  {
    id: "foundation-trig-identity",
    title: "Why sin²θ + cos²θ = 1",
    equation: "sin²θ+cos²θ=1",
    startingPoint: "A point at angle θ on the unit circle has coordinates (cosθ,sinθ).",
    steps: [
      { expression: "x²+y²=1", reason: "Every point on a unit circle is distance 1 from the origin." },
      { expression: "x=cosθ and y=sinθ", reason: "Cosine and sine are the horizontal and vertical coordinates." },
      { expression: "cos²θ+sin²θ=1", reason: "Substitute the coordinates into the circle equation." },
    ],
    result: "The identity is Pythagoras applied to the radius-one triangle.",
    assumptions: "Angles may use any unit as long as sine and cosine use the same angle.",
    diagram: { description: "The radius, cosine component and sine component form a right triangle.", svg: vectorSvg },
  },
];

export const MULTIPLICATION_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "multiplication-distributive",
    title: "Why a(b+c)=ab+ac",
    equation: "a(b+c)=ab+ac",
    startingPoint: "Split b+c equal groups into b groups and c groups.",
    steps: [
      { expression: "a(b+c)", reason: "Count a items in each of b+c groups." },
      { expression: "ab+ac", reason: "Count the first b groups and the remaining c groups separately." },
      { expression: "a(b+c)=ab+ac", reason: "Both counts describe the same collection." },
    ],
    result: "Distribution powers place-value multiplication and every shortcut in the lesson.",
    diagram: { description: "Splitting a rectangle shows why both products must be included.", svg: rectangleSvg },
  },
  {
    id: "division-algorithm",
    title: "Why the division check reconstructs the dividend",
    equation: "dividend = divisor × quotient + remainder",
    startingPoint: "Division forms as many complete groups of the divisor as possible, with a smaller amount left over.",
    steps: [
      { expression: "complete amount = divisor × quotient", reason: "Each complete group has divisor items and there are quotient groups." },
      { expression: "dividend = complete amount + remainder", reason: "The original total is the grouped part plus what could not form another group." },
      { expression: "dividend = divisor×quotient+remainder", reason: "Substitute the complete-group amount." },
    ],
    result: "Multiplying back and adding the remainder must recover the original dividend.",
    assumptions: "For ordinary whole-number division, 0≤remainder<divisor and divisor>0.",
  },
];

export const UNIT_CONVERSION_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "unit-factor-label",
    title: "Why a conversion factor changes units but not quantity",
    equation: "new value = old value × (new units equal to one old unit)/(one old unit)",
    startingPoint: "One old unit and its stated number of new units represent the same physical quantity.",
    steps: [
      { expression: "(equivalent new quantity)/(1 old unit)=1", reason: "Numerator and denominator are equal quantities written in different units." },
      { expression: "old value×old unit×conversion factor", reason: "Multiply the measurement by this carefully labelled form of 1." },
      { expression: "old units cancel, leaving new units", reason: "The old unit appears once above and once below the fraction bar." },
    ],
    result: "The numerical label changes while the underlying length, mass, time or other quantity stays fixed.",
    assumptions: "The conversion must be a pure scale relation; shifted zero points such as °C and °F need the affine formula.",
    diagram: { description: "The unwanted old unit cancels and the target unit remains.", svg: unitSvg },
  },
  {
    id: "unit-affine",
    title: "How scale-and-shift unit conversion is combined",
    equation: "value₂=(value₁f₁+o₁-o₂)/f₂",
    startingPoint: "Represent every unit by the same base quantity: base=value×factor+offset.",
    steps: [
      { expression: "base=value₁f₁+o₁", reason: "Convert the starting value to the shared base scale." },
      { expression: "base=value₂f₂+o₂", reason: "Write the same base quantity using the target unit." },
      { expression: "value₂f₂=value₁f₁+o₁-o₂", reason: "Equate the base expressions and subtract the target offset." },
      { expression: "value₂=(value₁f₁+o₁-o₂)/f₂", reason: "Divide by the target scale factor." },
    ],
    result: "This single affine formula handles both ordinary scaling and temperature conversions.",
    assumptions: "Both unit definitions must refer to the same base quantity and f₂ must be non-zero.",
  },
];

export const REARRANGING_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "linear-equation-general",
    title: "How to solve ax+b=cx+d",
    equation: "x=(d-b)/(a-c)",
    startingPoint: "Begin with ax+b=cx+d and preserve the balance at every step.",
    steps: [
      { expression: "(a-c)x+b=d", reason: "Subtract cx from both sides to collect x terms." },
      { expression: "(a-c)x=d-b", reason: "Subtract b from both sides to move constants." },
      { expression: "x=(d-b)/(a-c)", reason: "Divide both sides by the remaining coefficient of x." },
    ],
    result: "Collect variables, move constants, then divide—the same route used by the interactive balance.",
    assumptions: "a≠c. If a=c, the equation has either no solution or infinitely many solutions.",
    diagram: { description: "Identical operations on both sides keep the equation balanced.", svg: balanceSvg },
  },
];

export const POWERS_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "powers-next",
    title: "Why increasing the exponent multiplies by the base",
    equation: "bⁿ⁺¹=bⁿ·b",
    startingPoint: "bⁿ is a product of n copies of b.",
    steps: [
      { expression: "bⁿ=b·b···b", reason: "Write the power as repeated multiplication." },
      { expression: "bⁿ⁺¹=b·b···b·b", reason: "The next exponent contains one additional copy of b." },
      { expression: "bⁿ⁺¹=bⁿ·b", reason: "Group the first n factors back into bⁿ." },
    ],
    result: "Each one-step increase in exponent scales the entire previous value by b.",
  },
  {
    id: "powers-geometric-sum",
    title: "Why 1+2+···+2ⁿ⁻¹=2ⁿ−1",
    equation: "1+r+···+rⁿ⁻¹=(rⁿ−1)/(r−1)",
    startingPoint: "Let S=1+r+r²+···+rⁿ⁻¹.",
    steps: [
      { expression: "rS=r+r²+···+rⁿ", reason: "Multiply every term by r." },
      { expression: "rS-S=rⁿ-1", reason: "Subtract the original sum; all middle terms cancel." },
      { expression: "S=(rⁿ-1)/(r-1)", reason: "Factor S and divide by r−1." },
      { expression: "S=2ⁿ-1 when r=2", reason: "Substitute the doubling ratio used by the chessboard story." },
    ],
    result: "The total of n doubling stages is one less than the next power of two.",
    assumptions: "r≠1; for r=1 the sum is simply n.",
  },
  {
    id: "powers-compound-growth",
    title: "Why repeated percentage growth gives A=P(1+r)ᵗ",
    equation: "A=P(1+r)ᵗ",
    startingPoint: "Each period keeps the whole current amount and adds the fraction r of it.",
    steps: [
      { expression: "A₁=P+rP=P(1+r)", reason: "After one period, add r times the principal." },
      { expression: "A₂=P(1+r)(1+r)=P(1+r)²", reason: "The same multiplier acts on the new amount." },
      { expression: "Aₜ=P(1+r)ᵗ", reason: "Repeating the multiplier for t periods creates a power." },
    ],
    result: "Exponential growth appears whenever the change is proportional to the current amount.",
    assumptions: "r is the growth rate per period and remains constant; t is a non-negative whole number in this discrete model.",
  },
];

export const LOGARITHM_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "log-laws",
    title: "Why logarithms turn products into sums",
    equation: "log_b(MN)=log_bM+log_bN; log_b(M/N)=log_bM-log_bN; log_b(Mᵖ)=p log_bM",
    startingPoint: "Let M=bˣ and N=bʸ, so x=log_bM and y=log_bN.",
    steps: [
      { expression: "MN=bˣbʸ=bˣ⁺ʸ", reason: "The exponent product law adds exponents." },
      { expression: "log_b(MN)=x+y=log_bM+log_bN", reason: "Take log base b, which returns the exponent." },
      { expression: "M/N=bˣ⁻ʸ", reason: "The exponent quotient law subtracts exponents." },
      { expression: "Mᵖ=(bˣ)ᵖ=bᵖˣ", reason: "The power-of-a-power law multiplies exponents." },
    ],
    result: "Logs translate multiplication, division and powers into addition, subtraction and multiplication.",
    assumptions: "b>0, b≠1, and M,N>0.",
  },
  {
    id: "natural-e-limit",
    title: "Why ever-finer compounding produces (1+1/n)ⁿ",
    equation: "e=limₙ→∞(1+1/n)ⁿ",
    startingPoint: "Invest £1 at 100% annual interest, split equally across n compounding periods.",
    steps: [
      { expression: "rate per period=1/n", reason: "Divide the total annual rate 1 into n equal pieces." },
      { expression: "multiplier per period=1+1/n", reason: "Keep the current amount and add its period interest." },
      { expression: "amount after n periods=(1+1/n)ⁿ", reason: "Apply the same multiplier n times." },
      { expression: "e=limₙ→∞(1+1/n)ⁿ", reason: "The amounts approach a finite limit as the periods become arbitrarily short." },
    ],
    result: "The natural base e is the limiting one-year growth factor for continuously compounded 100% growth.",
    assumptions: "This derives the defining limit from the compounding model; proving convergence requires further analysis.",
  },
];

export const BINOMIAL_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "binomial-theorem",
    title: "Why Pascal coefficients expand (a+b)ⁿ",
    equation: "(a+b)ⁿ=Σ C(n,k)aⁿ⁻ᵏbᵏ",
    startingPoint: "The product has n brackets, and each expanded term chooses a or b from every bracket.",
    steps: [
      { expression: "aⁿ⁻ᵏbᵏ", reason: "Choosing b from k brackets forces a from the other n−k." },
      { expression: "C(n,k)", reason: "There are C(n,k) ways to choose those k bracket positions." },
      { expression: "Σₖ₌₀ⁿ C(n,k)aⁿ⁻ᵏbᵏ", reason: "Add the grouped terms for every possible k." },
    ],
    result: "The coefficient is a count of identical products, not an arbitrary pattern.",
    assumptions: "n is a non-negative integer.",
    diagram: { description: "Pascal's recurrence counts whether the final choice is a or b.", svg: pascalSvg },
  },
  {
    id: "binomial-combinations",
    title: "Why C(n,k)=n!/[k!(n-k)!]",
    equation: "C(n,k)=n!/[k!(n-k)!]",
    startingPoint: "First count ordered selections of k distinct positions from n.",
    steps: [
      { expression: "n(n-1)···(n-k+1)=n!/(n-k)!", reason: "There are n choices first, then n−1, continuing for k positions." },
      { expression: "each k-set is counted k! times", reason: "The same chosen positions can appear in any of k! orders." },
      { expression: "C(n,k)=n!/[k!(n-k)!]", reason: "Divide ordered selections by the duplicate orderings." },
    ],
    result: "A combination counts positions without caring about their order.",
    assumptions: "0≤k≤n and n,k are whole numbers.",
  },
  {
    id: "binomial-product",
    title: "Why (x+p)(x+q)=x²+(p+q)x+pq",
    equation: "(x+p)(x+q)=x²+(p+q)x+pq",
    startingPoint: "Distribute each term in the first bracket across every term in the second.",
    steps: [
      { expression: "x(x+q)+p(x+q)", reason: "Apply the distributive law to the first bracket." },
      { expression: "x²+qx+px+pq", reason: "Distribute again inside both products." },
      { expression: "x²+(p+q)x+pq", reason: "Combine the two like x terms." },
    ],
    result: "The middle coefficient is the sum p+q and the constant is the product pq.",
    diagram: { description: "The four rectangle regions correspond to the four distributed products.", svg: rectangleSvg },
  },
];

export const PASCAL_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "pascal-binomial",
    title: "Why row n supplies the coefficients of (a+b)ⁿ",
    equation: "(a+b)ⁿ=Σ C(n,k)aⁿ⁻ᵏbᵏ",
    startingPoint: "Each term in the expanded product chooses b from k of the n brackets.",
    steps: [
      { expression: "aⁿ⁻ᵏbᵏ", reason: "The remaining n−k brackets contribute a." },
      { expression: "coefficient=C(n,k)", reason: "Choose which k bracket positions contribute b." },
      { expression: "C(n,k)=C(n-1,k-1)+C(n-1,k)", reason: "Separate choices that include the final position from those that do not." },
    ],
    result: "That recurrence is exactly Pascal's add-the-two-above construction.",
    assumptions: "n is a non-negative integer.",
    diagram: { description: "Each Pascal entry is the sum of the two possible previous-choice cases.", svg: pascalSvg },
  },
  {
    id: "pascal-row-sum",
    title: "Why every Pascal row sums to 2ⁿ",
    equation: "Σₖ C(n,k)=2ⁿ",
    startingPoint: "Use the binomial theorem and set a=1 and b=1.",
    steps: [
      { expression: "(1+1)ⁿ=Σ C(n,k)1ⁿ⁻ᵏ1ᵏ", reason: "Substitute 1 for both variables." },
      { expression: "2ⁿ=Σ C(n,k)", reason: "Every power of 1 equals 1, leaving only the coefficients." },
      { expression: "row sum=2ⁿ", reason: "Pascal row n is the list of those coefficients." },
    ],
    result: "The row also counts all subsets of an n-item set: each item has two choices, in or out.",
  },
  {
    id: "pascal-combinations",
    title: "Why a Pascal entry counts k choices from n",
    equation: "C(n,k)=n!/[k!(n-k)!]",
    startingPoint: "Count ordered choices of k distinct objects, then remove order.",
    steps: [
      { expression: "n!/(n-k)!", reason: "Choose k objects in sequence without replacement." },
      { expression: "k! orderings per chosen group", reason: "Each unordered group was counted once for every internal order." },
      { expression: "C(n,k)=n!/[k!(n-k)!]", reason: "Divide by those duplicate orderings." },
    ],
    result: "The same count describes teams, grid routes, card hands and success positions.",
    assumptions: "0≤k≤n.",
  },
];

export const PROBABILITY_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "probability-equally-likely",
    title: "Why favourable over possible gives probability",
    equation: "P(A)=|A|/|Ω|",
    startingPoint: "Suppose the finite sample space Ω has N outcomes and every outcome is equally likely.",
    steps: [
      { expression: "P(each outcome)=1/N", reason: "The N equal probabilities must add to 1." },
      { expression: "P(A)=|A|×(1/N)", reason: "Add the probabilities of the |A| favourable outcomes." },
      { expression: "P(A)=|A|/|Ω|", reason: "Replace N by the number of possible outcomes." },
    ],
    result: "Counting works only because each outcome contributes the same probability.",
    assumptions: "The sample space is finite and its elementary outcomes are equally likely.",
  },
  {
    id: "probability-core-rules",
    title: "Why complement and addition rules avoid double-counting",
    equation: "P(Aᶜ)=1-P(A); P(A∪B)=P(A)+P(B)-P(A∩B)",
    startingPoint: "Partition the sample space and the two events into disjoint pieces.",
    steps: [
      { expression: "1=P(A)+P(Aᶜ)", reason: "A and not-A are disjoint and together fill the sample space." },
      { expression: "P(Aᶜ)=1-P(A)", reason: "Rearrange the partition total." },
      { expression: "P(A)+P(B)", reason: "Adding both event probabilities counts their overlap twice." },
      { expression: "P(A∪B)=P(A)+P(B)-P(A∩B)", reason: "Subtract one copy of the overlap." },
    ],
    result: "The formulas follow from adding probabilities only across disjoint regions.",
    diagram: { description: "The overlap belongs to both circles and would be counted twice without subtraction.", svg: probabilitySvg },
  },
  {
    id: "probability-conditional",
    title: "Why conditional probability changes the denominator",
    equation: "P(A|B)=P(A∩B)/P(B)",
    startingPoint: "After learning B, discard every outcome outside B and renormalise B to total probability 1.",
    steps: [
      { expression: "relevant favourable mass=P(A∩B)", reason: "Both A and the known condition B must hold." },
      { expression: "new total mass=P(B)", reason: "B is now the entire restricted sample space." },
      { expression: "P(A|B)=P(A∩B)/P(B)", reason: "Divide favourable mass by the new total mass." },
    ],
    result: "Conditioning zooms into B, so B—not the original sample space—becomes the denominator.",
    assumptions: "P(B)>0.",
    diagram: { description: "Inside event B, only the overlapping A∩B region is favourable.", svg: probabilitySvg },
  },
  {
    id: "probability-binomial",
    title: "Why the binomial probability formula works",
    equation: "P(X=k)=C(n,k)pᵏ(1-p)ⁿ⁻ᵏ",
    startingPoint: "A particular sequence with k successes and n−k failures has independent trial probabilities.",
    steps: [
      { expression: "pᵏ(1-p)ⁿ⁻ᵏ", reason: "Multiply k success probabilities and n−k failure probabilities." },
      { expression: "C(n,k)", reason: "Choose which k of the n positions are successes." },
      { expression: "P(X=k)=C(n,k)pᵏ(1-p)ⁿ⁻ᵏ", reason: "Add the equal probabilities of all distinct success arrangements." },
    ],
    result: "The coefficient counts arrangements; the powers give the probability of each arrangement.",
    assumptions: "Trials are independent, use the same success probability p, and have exactly two outcomes.",
  },
  {
    id: "probability-z-score",
    title: "Why z=(x-μ)/σ standardises a value",
    equation: "z=(x-μ)/σ",
    startingPoint: "Standardisation should move the mean to 0 and measure distance in standard-deviation units.",
    steps: [
      { expression: "x-μ", reason: "Subtract the mean so values are measured relative to the centre." },
      { expression: "(x-μ)/σ", reason: "Divide by one standard deviation to make the scale unitless." },
      { expression: "E[Z]=0 and SD(Z)=1", reason: "Subtracting μ centres the variable; dividing by σ scales its spread to 1." },
    ],
    result: "z reports how many standard deviations x lies above or below its mean.",
    assumptions: "σ>0.",
  },
  {
    id: "probability-standard-error",
    title: "Why the sample-mean standard error is σ/√n",
    equation: "SD(X̄)=σ/√n",
    startingPoint: "Let X̄=(X₁+···+Xₙ)/n for independent observations with variance σ².",
    steps: [
      { expression: "Var(X₁+···+Xₙ)=nσ²", reason: "Variances add for independent observations." },
      { expression: "Var(X̄)=Var(sum/n)=nσ²/n²=σ²/n", reason: "Scaling a variable by 1/n scales variance by 1/n²." },
      { expression: "SD(X̄)=√(σ²/n)=σ/√n", reason: "Standard deviation is the square root of variance." },
    ],
    result: "Averages become more stable at the square-root rate.",
    assumptions: "Observations are independent with common finite variance σ².",
  },
  {
    id: "probability-bayes",
    title: "How Bayes' theorem reverses a condition",
    equation: "P(A|B)=P(B|A)P(A)/P(B)",
    startingPoint: "Write the same intersection probability using each conditional direction.",
    steps: [
      { expression: "P(A∩B)=P(A|B)P(B)", reason: "Rearrange the definition of P(A|B)." },
      { expression: "P(A∩B)=P(B|A)P(A)", reason: "Use the same definition with A and B reversed." },
      { expression: "P(A|B)P(B)=P(B|A)P(A)", reason: "Both expressions equal the same intersection." },
      { expression: "P(A|B)=P(B|A)P(A)/P(B)", reason: "Divide by P(B)." },
    ],
    result: "Likelihood times prior, normalised by evidence, gives the posterior.",
    assumptions: "P(B)>0.",
    diagram: { description: "The same overlap A∩B can be reached from either conditional direction.", svg: probabilitySvg },
  },
];

export const MARKOV_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "markov-forecast",
    title: "Why an n-step forecast is pₙ=p₀Pⁿ",
    equation: "pₙ=p₀Pⁿ",
    startingPoint: "The transition matrix P stores one-step conditional probabilities, and p₀ stores current state probabilities.",
    steps: [
      { expression: "(p₁)ⱼ=Σᵢ(p₀)ᵢPᵢⱼ", reason: "Use total probability over every possible current state i." },
      { expression: "p₁=p₀P", reason: "Matrix multiplication is exactly that weighted sum for every destination j." },
      { expression: "p₂=(p₀P)P=p₀P²", reason: "Apply the same one-step rule again." },
      { expression: "pₙ=p₀Pⁿ", reason: "Repeat for n transitions." },
    ],
    result: "Matrix powers sum the probabilities of every possible n-step route.",
    assumptions: "The transition probabilities are time-homogeneous and rows of P sum to 1.",
    diagram: { description: "Every forecast step sends probability mass along all outgoing state arrows.", svg: markovSvg },
  },
];

export const STOCHASTIC_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "stochastic-random-walk",
    title: "Mean and variance of a biased ±1 random walk",
    equation: "E[Xₙ]=n(2p-1); Var(Xₙ)=4np(1-p)",
    startingPoint: "Let Xₙ=Σξᵢ, where independent ξᵢ equals +1 with probability p and −1 with probability 1−p.",
    steps: [
      { expression: "E[ξ]=p-(1-p)=2p-1", reason: "Take the probability-weighted average of +1 and −1." },
      { expression: "Var(ξ)=E[ξ²]-E[ξ]²=1-(2p-1)²=4p(1-p)", reason: "Because ξ² is always 1." },
      { expression: "E[Xₙ]=nE[ξ]=n(2p-1)", reason: "Expectation adds across the n increments." },
      { expression: "Var(Xₙ)=nVar(ξ)=4np(1-p)", reason: "Variance adds because the increments are independent." },
    ],
    result: "Drift grows in proportion to n, while standard deviation grows in proportion to √n.",
    diagram: { description: "The final position is the accumulated sum of independent up and down steps.", svg: walkSvg },
  },
  {
    id: "stochastic-poisson",
    title: "Why a Poisson process has mean and variance λt",
    equation: "N(t)~Poisson(λt); E[N(t)]=Var(N(t))=λt",
    startingPoint: "Split time t into many short intervals Δt where one arrival has probability about λΔt and multiple arrivals are negligible.",
    steps: [
      { expression: "N(t)≈sum of m Bernoulli(λt/m) counts", reason: "Use m short independent intervals of length t/m." },
      { expression: "E[N(t)]≈m(λt/m)=λt", reason: "Add the interval means." },
      { expression: "Var(N(t))≈m(λt/m)(1-λt/m)→λt", reason: "Add independent interval variances and let intervals shrink." },
      { expression: "P(N(t)=k)=e⁻ˡᵗ(λt)ᵏ/k!", reason: "The binomial count limit becomes the Poisson distribution." },
    ],
    result: "Constant independent arrival intensity produces Poisson counts with equal mean and variance.",
    assumptions: "Arrivals have a constant rate, independent increments, and negligible simultaneous-event probability.",
  },
  {
    id: "stochastic-ar1-correlation",
    title: "Why AR(1) correlation decays as φᵏ",
    equation: "Corr(Xₜ,Xₜ₋ₖ)=φᵏ",
    startingPoint: "Centre the stationary AR(1) model: Yₜ=Xₜ-μ=φYₜ₋₁+εₜ.",
    steps: [
      { expression: "Cov(Yₜ,Yₜ₋₁)=φVar(Yₜ₋₁)", reason: "The new shock εₜ is uncorrelated with the past." },
      { expression: "Corr(Yₜ,Yₜ₋₁)=φ", reason: "Stationarity gives equal variances at t and t−1." },
      { expression: "Cov(Yₜ,Yₜ₋ₖ)=φ Cov(Yₜ₋₁,Yₜ₋ₖ)", reason: "Apply the same covariance step one lag earlier." },
      { expression: "Corr(Xₜ,Xₜ₋ₖ)=φᵏ", reason: "Repeat the recurrence k times." },
    ],
    result: "Each additional lag retains another factor φ of the previous dependence.",
    assumptions: "|φ|<1, shocks have finite variance, zero mean, and are uncorrelated over time.",
  },
];

export const VECTOR_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "vector-magnitude",
    title: "Why vector magnitude is √(x²+y²)",
    equation: "|v|=√(x²+y²)",
    startingPoint: "The vector from the origin to (x,y) is the hypotenuse of a right triangle.",
    steps: [
      { expression: "|v|²=x²+y²", reason: "Apply Pythagoras to the horizontal and vertical components." },
      { expression: "|v|=√(x²+y²)", reason: "Take the non-negative square root because length cannot be negative." },
    ],
    result: "Magnitude combines perpendicular components into one direction-independent length.",
    diagram: { description: "The vector and its x/y components form a right triangle.", svg: vectorSvg },
  },
  {
    id: "vector-dot",
    title: "Why A·B=|A||B|cosθ",
    equation: "A·B=aₓbₓ+aᵧbᵧ=|A||B|cosθ",
    startingPoint: "Compute |A−B|² both from components and from the triangle between A and B.",
    steps: [
      { expression: "|A-B|²=|A|²+|B|²-2(A·B)", reason: "Expand the squared component differences." },
      { expression: "|A-B|²=|A|²+|B|²-2|A||B|cosθ", reason: "Apply the cosine rule to the same triangle." },
      { expression: "A·B=|A||B|cosθ", reason: "Equate the two expressions and cancel common terms." },
    ],
    result: "The dot product measures the length of one vector in the other's direction, scaled by the other length.",
    assumptions: "θ is the smaller angle between the vectors.",
    diagram: { description: "The projection of one vector onto the other introduces the cosine factor.", svg: vectorSvg },
  },
  {
    id: "vector-cross",
    title: "Why |A×B| is parallelogram area",
    equation: "|A×B|=|A||B|sinθ",
    startingPoint: "A parallelogram with base |A| has height equal to the perpendicular component of B.",
    steps: [
      { expression: "height=|B|sinθ", reason: "Resolve B perpendicular to A." },
      { expression: "area=base×height=|A||B|sinθ", reason: "Use the parallelogram area formula." },
      { expression: "|A×B|=|A||B|sinθ", reason: "Define the cross-product magnitude to equal this oriented area." },
    ],
    result: "The cross product vanishes for parallel vectors and is largest for perpendicular vectors.",
    diagram: { description: "The perpendicular component supplies the parallelogram height.", svg: rectangleSvg },
  },
];

export const COMPLEX_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "complex-modulus",
    title: "Why |a+bi|=√(a²+b²)",
    equation: "|z|=√(a²+b²)",
    startingPoint: "The point a+bi has horizontal coordinate a and vertical coordinate b.",
    steps: [
      { expression: "|z|²=a²+b²", reason: "Apply Pythagoras to the real and imaginary components." },
      { expression: "|z|=√(a²+b²)", reason: "Take the non-negative root because modulus is a length." },
    ],
    result: "The modulus is the distance from the origin in the complex plane.",
    diagram: { description: "Rectangular components and the modulus form a right triangle.", svg: complexSvg },
  },
  {
    id: "complex-polar-product",
    title: "Why complex multiplication multiplies lengths and adds angles",
    equation: "r₁cisθ₁·r₂cisθ₂=r₁r₂cis(θ₁+θ₂)",
    startingPoint: "Write cisθ=cosθ+i sinθ and multiply the two polar forms.",
    steps: [
      { expression: "r₁r₂[(cosθ₁cosθ₂-sinθ₁sinθ₂)+i(sinθ₁cosθ₂+cosθ₁sinθ₂)]", reason: "Distribute and use i²=−1." },
      { expression: "cos(θ₁+θ₂)+i sin(θ₁+θ₂)", reason: "Recognise the angle-addition identities." },
      { expression: "r₁r₂cis(θ₁+θ₂)", reason: "Recombine into polar form." },
    ],
    result: "Scaling factors multiply while rotations compose by adding their angles.",
    diagram: { description: "Polar form records exactly the length and rotation used by multiplication.", svg: complexSvg },
  },
  {
    id: "complex-de-moivre",
    title: "Why De Moivre's theorem holds",
    equation: "[r cisθ]ⁿ=rⁿcis(nθ)",
    startingPoint: "Use the polar multiplication rule repeatedly.",
    steps: [
      { expression: "(r cisθ)²=r²cis(2θ)", reason: "Multiply lengths r·r and add angles θ+θ." },
      { expression: "(r cisθ)ᵏ⁺¹=rᵏcis(kθ)·r cisθ", reason: "Assume the rule after k factors and add one more." },
      { expression: "(r cisθ)ᵏ⁺¹=rᵏ⁺¹cis((k+1)θ)", reason: "Apply the polar product rule." },
    ],
    result: "By induction, every positive integer power raises the length and multiplies the angle.",
    assumptions: "n is a non-negative integer.",
    diagram: { description: "Repeated multiplication advances the angle by θ at every step.", svg: complexSvg },
  },
  {
    id: "complex-roots",
    title: "Why n-th roots are equally spaced",
    equation: "wₖ=|z|¹⁄ⁿ cis((arg z+2πk)/n), k=0,…,n−1",
    startingPoint: "Write z=r cisθ and seek w=ρ cisφ satisfying wⁿ=z.",
    steps: [
      { expression: "ρⁿ=r", reason: "Equal complex numbers have equal moduli." },
      { expression: "nφ=θ+2πk", reason: "Angles representing the same direction may differ by whole turns." },
      { expression: "ρ=r¹⁄ⁿ and φ=(θ+2πk)/n", reason: "Undo the n-th power in length and angle." },
      { expression: "k=0,…,n-1", reason: "After n choices the angles repeat modulo 2π." },
    ],
    result: "The n roots share one radius and sit 2π/n apart on a regular polygon.",
    assumptions: "n is a positive integer; for z=0 the only distinct root is 0.",
    diagram: { description: "Dividing wrapped angles by n places roots evenly around a circle.", svg: complexSvg },
  },
];

export const PRIME_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "prime-euler-product",
    title: "Why the zeta sum factors over primes",
    equation: "ζ(s)=Σn⁻ˢ=∏ₚ(1-p⁻ˢ)⁻¹",
    startingPoint: "For Re(s)>1, each prime contributes a convergent geometric series.",
    steps: [
      { expression: "(1-p⁻ˢ)⁻¹=1+p⁻ˢ+p⁻²ˢ+···", reason: "Apply the infinite geometric-series formula." },
      { expression: "∏ₚ(1+p⁻ˢ+p⁻²ˢ+···)", reason: "Multiply one series for every prime." },
      { expression: "each product term is n⁻ˢ exactly once", reason: "Unique prime factorisation chooses one exponent for every prime." },
      { expression: "∏ₚ(1-p⁻ˢ)⁻¹=Σₙ₌₁∞n⁻ˢ", reason: "Collect the uniquely represented integer terms." },
    ],
    result: "The Euler product is unique factorisation translated into an analytic identity.",
    assumptions: "Re(s)>1 ensures absolute convergence and justifies rearranging the infinite sums and product.",
    diagram: { description: "Choosing one exponent for each prime constructs each positive integer exactly once.", svg: primeSvg },
  },
  {
    id: "prime-trial-bound",
    title: "Why trial division stops at √n",
    equation: "if n=ab, then min(a,b)≤√n",
    startingPoint: "Suppose n is composite, so n=ab with positive factors a and b.",
    steps: [
      { expression: "assume a>√n and b>√n", reason: "Test what would happen if both factors exceeded the square root." },
      { expression: "ab>√n·√n=n", reason: "Multiply the two strict inequalities." },
      { expression: "contradiction, since ab=n", reason: "Therefore at least one factor is no larger than √n." },
    ],
    result: "If no prime at most √n divides n, then n has no non-trivial factor and is prime.",
    assumptions: "n is an integer greater than 1.",
  },
  {
    id: "prime-divisor-functions",
    title: "Why prime exponents give divisor count and sum",
    equation: "τ(n)=∏(aᵢ+1); σ(n)=∏(pᵢᵃⁱ⁺¹-1)/(pᵢ-1)",
    startingPoint: "Write n=∏pᵢᵃⁱ. Every divisor chooses an exponent eᵢ from 0 through aᵢ for each prime.",
    steps: [
      { expression: "aᵢ+1 choices for eᵢ", reason: "The allowed exponents are 0,1,…,aᵢ." },
      { expression: "τ(n)=∏(aᵢ+1)", reason: "Independent exponent choices multiply." },
      { expression: "1+pᵢ+···+pᵢᵃⁱ=(pᵢᵃⁱ⁺¹-1)/(pᵢ-1)", reason: "Sum all contributions from one prime using a geometric series." },
      { expression: "σ(n)=∏(pᵢᵃⁱ⁺¹-1)/(pᵢ-1)", reason: "Distributing the product forms every divisor exactly once and sums them." },
    ],
    result: "Prime factorisation turns divisor questions into independent choices for each prime.",
    diagram: { description: "A divisor is built by independently choosing each prime exponent.", svg: primeSvg },
  },
  {
    id: "prime-euclid",
    title: "Why there must be infinitely many primes",
    equation: "N=p₁p₂···pₖ+1",
    startingPoint: "Assume, for contradiction, that p₁,…,pₖ is the complete finite list of primes.",
    steps: [
      { expression: "N=p₁p₂···pₖ+1", reason: "Form a number one larger than their product." },
      { expression: "N mod pᵢ=1 for every listed prime", reason: "Dividing the product by pᵢ leaves zero, so adding one leaves remainder one." },
      { expression: "N has a prime factor not in the list", reason: "N>1 has a prime factor, but none of the listed primes divides it." },
    ],
    result: "The supposed complete list always misses a prime, so primes cannot be finite.",
    assumptions: "Uses the fact that every integer greater than 1 has a prime divisor.",
  },
];

export const MERSENNE_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "mersenne-binary",
    title: "Why 2ᵖ−1 is p ones in binary",
    equation: "2ᵖ−1=(111···111)₂",
    startingPoint: "In binary, 2ᵖ is one followed by p zeroes.",
    steps: [
      { expression: "2ᵖ=(100···000)₂", reason: "The 1 occupies binary place p." },
      { expression: "2ᵖ-1=(011···111)₂", reason: "Subtracting one borrows through all p zeroes." },
      { expression: "2ᵖ-1=(111···111)₂", reason: "Drop the leading zero; p ones remain." },
    ],
    result: "Mersenne numbers are binary repunits of length p.",
  },
  {
    id: "mersenne-composite-exponent",
    title: "Why a composite exponent makes 2ᵖ−1 composite",
    equation: "xˢ−1=(x−1)(xˢ⁻¹+xˢ⁻²+···+1)",
    startingPoint: "If p=rs with r,s>1, write 2ᵖ−1=(2ʳ)ˢ−1.",
    steps: [
      { expression: "xˢ−1=(x−1)(xˢ⁻¹+xˢ⁻²+···+1)", reason: "Multiply out: adjacent terms cancel, leaving xˢ−1." },
      { expression: "2ʳˢ−1=(2ʳ−1)(2ʳ⁽ˢ⁻¹⁾+···+1)", reason: "Substitute x=2ʳ." },
      { expression: "both factors exceed 1", reason: "Because r,s>1." },
    ],
    result: "A Mersenne prime can only have a prime exponent, although a prime exponent does not guarantee primality.",
    assumptions: "p is a positive composite integer.",
  },
  {
    id: "mersenne-perfect",
    title: "Why a Mersenne prime creates a perfect number",
    equation: "N=2ᵖ⁻¹(2ᵖ−1)",
    startingPoint: "Let M=2ᵖ−1 be prime and N=2ᵖ⁻¹M.",
    steps: [
      { expression: "divisors of N are 2ʲ and 2ʲM for j=0,…,p−1", reason: "M is an odd prime and is coprime to the power of two." },
      { expression: "σ(N)=(1+2+···+2ᵖ⁻¹)(1+M)", reason: "Choose the power-of-two part and whether to include M." },
      { expression: "σ(N)=(2ᵖ-1)·2ᵖ=M·2ᵖ=2N", reason: "Use the geometric sum and M=2ᵖ−1." },
      { expression: "proper divisors sum to σ(N)-N=N", reason: "Remove N itself from the sum of all divisors." },
    ],
    result: "N equals the sum of its positive proper divisors, so it is perfect.",
    assumptions: "2ᵖ−1 must be prime.",
    diagram: { description: "Prime-factor choices enumerate every divisor used in the perfect-number sum.", svg: primeSvg },
  },
];
