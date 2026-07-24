import type { FormulaDerivation } from "../../core/FormulaDerivations";

const termsSvg = `
  <svg viewBox="0 0 320 150" role="img" aria-label="Two groups of three x squared tiles combine into six x squared tiles">
    <g fill="#58a6ff" stroke="#b6d7ff">
      <rect x="24" y="42" width="38" height="38"/><rect x="68" y="42" width="38" height="38"/><rect x="112" y="42" width="38" height="38"/>
      <rect x="170" y="42" width="38" height="38"/><rect x="214" y="42" width="38" height="38"/><rect x="258" y="42" width="38" height="38"/>
    </g>
    <text x="35" y="67" fill="white" font-size="14">x²</text><text x="79" y="67" fill="white" font-size="14">x²</text><text x="123" y="67" fill="white" font-size="14">x²</text>
    <text x="181" y="67" fill="white" font-size="14">x²</text><text x="225" y="67" fill="white" font-size="14">x²</text><text x="269" y="67" fill="white" font-size="14">x²</text>
    <text x="24" y="112" fill="#ffd166" font-size="16">3x²</text><text x="172" y="112" fill="#ffd166" font-size="16">+ 3x² = 6x²</text>
  </svg>`;

const distributeSvg = `
  <svg viewBox="0 0 320 150" role="img" aria-label="Three groups each containing a and b split into three a groups and three b groups">
    <text x="24" y="38" fill="#ffd166" font-size="20">3(a + b)</text>
    <rect x="24" y="55" width="74" height="42" fill="#58a6ff33" stroke="#58a6ff"/><rect x="104" y="55" width="74" height="42" fill="#58a6ff33" stroke="#58a6ff"/><rect x="184" y="55" width="74" height="42" fill="#58a6ff33" stroke="#58a6ff"/>
    <text x="45" y="82" fill="#c9d1d9" font-size="18">a + b</text><text x="125" y="82" fill="#c9d1d9" font-size="18">a + b</text><text x="205" y="82" fill="#c9d1d9" font-size="18">a + b</text>
    <text x="24" y="128" fill="#7ee787" font-size="18">= 3a + 3b</text>
  </svg>`;

const indicesSvg = `
  <svg viewBox="0 0 320 150" role="img" aria-label="Two factors of x squared and x cubed joining to make five factors of x">
    <text x="24" y="32" fill="#ffd166" font-size="20">x² × x³</text>
    <g fill="#58a6ff" stroke="#b6d7ff"><rect x="24" y="52" width="38" height="38"/><rect x="68" y="52" width="38" height="38"/></g>
    <text x="113" y="77" fill="#c9d1d9" font-size="22">×</text>
    <g fill="#d2a8ff" stroke="#e6d0ff"><rect x="145" y="52" width="38" height="38"/><rect x="189" y="52" width="38" height="38"/><rect x="233" y="52" width="38" height="38"/></g>
    <text x="24" y="125" fill="#7ee787" font-size="18">five x factors = x⁵</text>
  </svg>`;

export const ALGEBRAIC_LAWS_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "like-terms",
    title: "Why like terms combine by coefficients",
    equation: "3x² + 3x² = 6x²",
    startingPoint: "A term is a number of identical pieces. Here each piece is x².",
    steps: [
      { expression: "3x² = x² + x² + x²", reason: "The coefficient 3 counts three identical x² terms." },
      { expression: "3x² + 3x² = six copies of x²", reason: "Both groups contain the same kind of term, so their counts can be combined." },
      { expression: "3x² + 3x² = 6x²", reason: "Write the total count as the new coefficient." },
    ],
    result: "Addition and subtraction change coefficients, not exponents. Unlike terms such as x² and x³ cannot be combined.",
    diagram: { description: "Every tile represents the same object, x², so only the number of tiles changes.", svg: termsSvg },
  },
  {
    id: "commutative-associative",
    title: "What commutative and associative laws allow",
    equation: "a + b = b + a; (a + b) + c = a + (b + c)",
    startingPoint: "Addition counts a total, regardless of the order in which groups are counted.",
    steps: [
      { expression: "a + b = b + a", reason: "Changing the order of two addends does not change the total." },
      { expression: "(a + b) + c = a + (b + c)", reason: "Changing brackets changes the grouping, not the total number of addends." },
      { expression: "ab = ba and (ab)c = a(bc)", reason: "Multiplication has the same order and grouping properties for ordinary numbers." },
    ],
    result: "You may reorder or regroup addition and multiplication, but not subtraction or division without changing the expression.",
  },
  {
    id: "distributive",
    title: "Why multiplication distributes over addition",
    equation: "a(b + c) = ab + ac",
    startingPoint: "a groups of (b + c) contain a groups of b and a groups of c.",
    steps: [
      { expression: "a(b + c)", reason: "Start with a equal groups, each holding b and c." },
      { expression: "ab + ac", reason: "Count the b parts across all groups, then the c parts across all groups." },
      { expression: "a(b + c) = ab + ac", reason: "Both expressions count the same collection." },
    ],
    result: "Distribution expands brackets; factoring reverses it: ab + ac = a(b + c).",
    diagram: { description: "Each of the three groups contains one a-part and one b-part, so the total separates into 3a and 3b.", svg: distributeSvg },
  },
  {
    id: "product-of-powers",
    title: "Why multiplying powers adds exponents",
    equation: "xᵐ × xⁿ = xᵐ⁺ⁿ",
    startingPoint: "An exponent counts how many identical factors of the base are multiplied.",
    steps: [
      { expression: "x² × x³ = (x × x) × (x × x × x)", reason: "Expand each power into repeated multiplication." },
      { expression: "x² × x³ = x × x × x × x × x", reason: "Joining the products leaves five x factors." },
      { expression: "x² × x³ = x⁵ = x²⁺³", reason: "The total factor count is the sum of the two counts." },
    ],
    result: "Add exponents only when multiplying the same base; do not use this rule for x² + x³.",
    diagram: { description: "Two x factors joined to three x factors make five x factors.", svg: indicesSvg },
  },
  {
    id: "quotient-of-powers",
    title: "Why dividing powers subtracts exponents",
    equation: "xᵐ / xⁿ = xᵐ⁻ⁿ",
    startingPoint: "Division cancels matching factors in numerator and denominator.",
    steps: [
      { expression: "x⁵ / x² = (x × x × x × x × x) / (x × x)", reason: "Expand both powers." },
      { expression: "x⁵ / x² = x × x × x", reason: "Cancel two matching factors, provided x is not zero." },
      { expression: "x⁵ / x² = x³ = x⁵⁻²", reason: "The remaining factor count is the difference." },
    ],
    result: "Subtract exponents only for division of the same non-zero base.",
    assumptions: "x ≠ 0 because division by zero is undefined.",
  },
  {
    id: "power-of-power",
    title: "Why a power of a power multiplies exponents",
    equation: "(xᵐ)ⁿ = xᵐⁿ",
    startingPoint: "The outside exponent repeats the entire inside product n times.",
    steps: [
      { expression: "(x²)³ = x² × x² × x²", reason: "The outer 3 repeats the factor x² three times." },
      { expression: "(x²)³ = (x × x)(x × x)(x × x)", reason: "Expand each x²." },
      { expression: "(x²)³ = x⁶ = x²×³", reason: "There are 2 groups of factors repeated 3 times." },
    ],
    result: "Multiply the exponents only when one whole power is raised to another power.",
  },
  {
    id: "zero-negative-indices",
    title: "Why zero and negative indices work",
    equation: "x⁰ = 1; x⁻ⁿ = 1/xⁿ",
    startingPoint: "Dividing by x reduces an exponent by one.",
    steps: [
      { expression: "x³ / x = x², then x² / x = x¹", reason: "Each division by x removes one factor." },
      { expression: "x¹ / x = x⁰ = 1", reason: "Any non-zero quantity divided by itself equals one." },
      { expression: "x⁰ / x = x⁻¹ = 1/x", reason: "One further division produces a reciprocal." },
    ],
    result: "Zero exponent means one and negative exponents mean reciprocals, for non-zero bases.",
    assumptions: "x ≠ 0.",
  },
];
