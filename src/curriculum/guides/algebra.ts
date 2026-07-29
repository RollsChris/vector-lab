import type { LessonGuide } from "../types";

/** Teaching guides for the six lessons in Stage 2: Algebra. */
export const ALGEBRA_GUIDES: readonly LessonGuide[] = [
  {
    id: "algebraic-laws",
    plainEnglish:
      "Letters can stand in for numbers. This lesson shows when pieces may be joined, swapped or opened out without changing what they are worth.",
    objectives: [
      "calculate sums and differences of like terms",
      "explain why terms with different letters or powers cannot be collected",
      "rearrange and regroup addition or multiplication without changing the value",
      "expand brackets and factor out a common factor",
      "calculate products, quotients and powers with matching bases",
    ],
    whyItMatters:
      "These laws let you simplify formulas used in spreadsheets, engineering calculations and computer code, and they prevent errors in every later algebra lesson.",
    keyIdea:
      "Identify whether the pieces are being added, multiplied, divided or raised to a power first, because that operation selects the safe rule.",
    workedExample: {
      prompt: "Simplify 3x² + 2x² + 4(x² − 3).",
      steps: [
        "4(x² − 3) = 4x² − 12 — distribute 4 to every term inside the brackets.",
        "3x² + 2x² + 4(x² − 3) = 3x² + 2x² + 4x² − 12 — replace the brackets with their expansion.",
        "3x² + 2x² + 4x² − 12 = (3 + 2 + 4)x² − 12 — collect the three like x² terms.",
        "(3 + 2 + 4)x² − 12 = 9x² − 12 — add the coefficients and keep x² unchanged.",
      ],
      answer: "The simplified expression is 9x² − 12.",
    },
    pitfalls: [
      "x² + x³ = x⁵ → the terms have different powers, so x² + x³ cannot be collected",
      "3(x + 4) = 3x + 4 → distribute 3 to both terms: 3(x + 4) = 3x + 12",
      "a − b = b − a → subtraction is not commutative, so changing the order changes the value",
      "(2x³)² = 2x⁶ → square every factor: (2x³)² = 4x⁶",
    ],
    checks: [
      {
        question: "Simplify 4a + 7a.",
        answer:
          "Both terms contain exactly a, so add their coefficients: 4a + 7a = (4 + 7)a = 11a.",
      },
      {
        question: "Simplify x² × x⁵.",
        answer:
          "The base is the same and the operation is multiplication, so join the two and five repeated x factors: x² × x⁵ = x⁷.",
      },
      {
        question: "Factor 8x − 12 using the greatest common factor.",
        answer:
          "Both terms are divisible by 4. Dividing each term by 4 gives 2x and −3, so 8x − 12 = 4(2x − 3).",
      },
      {
        question: "Why is x⁰ equal to 1 when x is not zero?",
        answer:
          "The quotient rule gives x³ ÷ x³ = x³⁻³ = x⁰, while any non-zero number divided by itself is 1. Therefore x⁰ = 1.",
      },
    ],
    tryThis:
      "Open 1 · Terms and compare the two readouts, then visit 2 · Rearrange safely, 3 · Brackets and 4 · Powers; for each button, say aloud which operation makes the displayed rule valid.",
  },
  {
    id: "rearranging-equations",
    plainEnglish:
      "A letter can hide a number. You can reveal it by making the same change on both sides until the letter is alone.",
    objectives: [
      "rearrange a linear equation by applying the same operation to both sides",
      "solve equations with the unknown on one or both sides",
      "solve equations containing negative or fractional coefficients",
      "check a solution by substituting it into the original equation",
      "explain why an equation can have one solution, no solution or every number as a solution",
    ],
    whyItMatters:
      "Rearranging equations lets you calculate an unknown price, distance, time or measurement from a formula, such as finding a circle's radius from its circumference.",
    keyIdea:
      "Picture an equation as a balanced scale: matching changes to both pans preserve equality while you isolate the unknown.",
    workedExample: {
      prompt: "Solve 5x − 4 = 2x + 8 and check the result.",
      steps: [
        "5x − 4 − 2x = 2x + 8 − 2x — subtract 2x from both sides to collect the x terms on the left.",
        "3x − 4 = 8 — simplify both sides.",
        "3x − 4 + 4 = 8 + 4 — add 4 to both sides to remove the constant beside x.",
        "3x = 12 — simplify both sides.",
        "x = 4 — divide both sides by 3.",
        "5(4) − 4 = 16 and 2(4) + 8 = 16 — substitute x = 4 into the original equation to check both sides match.",
      ],
      answer: "The solution is x = 4.",
    },
    pitfalls: [
      "5x − 4 = 2x + 8 becomes 5x = 2x + 4 → adding 4 to both sides gives 5x = 2x + 12",
      "3x = 12, so x = 12 → divide both sides by 3: x = 4",
      "2(x − 3) = 2x − 3 → distribute 2 to every term: 2(x − 3) = 2x − 6",
      "4 − 3x = 19 gives x = 5 → −3x = 15, then dividing by −3 gives x = −5",
    ],
    checks: [
      {
        question: "Solve 2x + 3 = 11.",
        answer:
          "Subtract 3 from both sides to get 2x = 8, then divide both sides by 2. Therefore x = 4.",
      },
      {
        question: "Solve x ÷ 3 + 2 = 5.",
        answer:
          "Subtract 2 from both sides to get x ÷ 3 = 3, then multiply both sides by 3. Therefore x = 9.",
      },
      {
        question: "Solve 4 − 3x = 19 and check the sign.",
        answer:
          "Subtract 4 from both sides to get −3x = 15, then divide by −3 to get x = −5. Checking gives 4 − 3(−5) = 4 + 15 = 19.",
      },
      {
        question: "Rearrange C = 2πr to make r the subject.",
        answer:
          "Divide both sides by 2π, which leaves C ÷ (2π) = r. Writing the subject first gives r = C ÷ (2π).",
      },
    ],
    tryThis:
      "Choose the 5x − 4 = 2x + 8 preset, keep Show blocks and Animate moves switched on, follow the starred move buttons until x is alone, then use ↶ Undo and solve it again without the hint.",
  },
  {
    id: "powers",
    plainEnglish:
      "Multiplying the same number by itself again and again can make results grow very quickly. This lesson shows how a small repeated change becomes a huge one.",
    objectives: [
      "calculate whole-number powers from repeated multiplication",
      "explain why increasing an exponent by one multiplies the result by the base",
      "compare exponential growth with growth that adds a fixed amount",
      "calculate how many states are represented by a given number of binary switches",
      "read exact power values from a logarithmically scaled bar chart",
    ],
    whyItMatters:
      "Powers model compound interest, population growth and radioactive decay, while powers of two count computer memory states and possible digital combinations.",
    keyIdea:
      "Each step in the exponent multiplies the entire previous result by the base, so equal steps can create rapidly widening values.",
    workedExample: {
      prompt: "A colony starts with 2 cells and triples every hour. How many cells are there after 4 hours?",
      steps: [
        "3⁴ = 3 × 3 × 3 × 3 — four hours apply the tripling factor four times.",
        "3 × 3 × 3 × 3 = 81 — calculate the repeated multiplication.",
        "2 × 3⁴ = 2 × 81 — multiply the starting population by the four-hour growth factor.",
        "2 × 81 = 162 — calculate the final population.",
      ],
      answer: "After 4 hours there are 162 cells.",
    },
    pitfalls: [
      "2³ = 2 × 3 = 6 → the exponent counts repeated factors: 2³ = 2 × 2 × 2 = 8",
      "5⁰ = 0 → any non-zero base to the power zero is 1, so 5⁰ = 1",
      "2³ × 2⁴ = 4⁷ → keep the matching base and add exponents: 2³ × 2⁴ = 2⁷",
      "Equal bar-height jumps mean equal amounts were added → read the labels: the bars use a log scale, so each exponent step multiplies by the base",
    ],
    checks: [
      {
        question: "Calculate 4³.",
        answer:
          "The exponent 3 means three factors of 4: 4³ = 4 × 4 × 4 = 64.",
      },
      {
        question: "If 3⁵ = 243, what is 3⁶?",
        answer:
          "Increasing the exponent by one multiplies the previous value by the base, so 3⁶ = 243 × 3 = 729.",
      },
      {
        question: "How many on-or-off patterns can 10 binary switches make?",
        answer:
          "Each switch doubles the number of patterns, so 10 independent switches make 2¹⁰ = 1,024 patterns.",
      },
      {
        question: "Why does doubling eventually outgrow adding ten each step?",
        answer:
          "Adding ten increases by the same amount each step, but doubling multiplies the whole accumulated value by two. The amount added by each doubling therefore grows with the total.",
      },
    ],
    tryThis:
      "Set Base b to 2 and raise Largest exponent n from 4 to 12 while reading the exact labels, then change Base b to 10 and compare how much one exponent step multiplies the value.",
  },
  {
    id: "logarithms",
    plainEnglish:
      "Sometimes you know a starting number and a final result but not how many repeated multiplications happened. This lesson shows how to work backwards and find that missing count.",
    objectives: [
      "calculate a logarithm by identifying the required exponent",
      "convert between exponential and logarithmic statements",
      "check a logarithm by raising the base to the answer",
      "apply the product, quotient and power rules for logarithms",
      "explain how logarithmic scales compress very large ranges",
    ],
    whyItMatters:
      "Logarithms let you solve compound-interest and half-life questions, and they power real scales for sound in decibels, acidity in pH and earthquake magnitude.",
    keyIdea:
      "A logarithm asks which exponent produces the chosen value, so its graph is the exponential graph reflected across y = x.",
    workedExample: {
      prompt: "Solve 3ˣ = 81 using a logarithm.",
      steps: [
        "x = log₃(81) — apply the inverse of raising 3 to a power.",
        "81 = 3 × 3 × 3 × 3 — express 81 as repeated factors of the base.",
        "81 = 3⁴ — four factors of 3 make the fourth power.",
        "log₃(81) = 4 — the required exponent is therefore 4.",
        "3⁴ = 81 — raise the base to the answer to check it reproduces the original value.",
      ],
      answer: "The solution is x = 4.",
    },
    pitfalls: [
      "log₂(8) = 8 ÷ 2 = 4 → ask which exponent gives 8: 2³ = 8, so log₂(8) = 3",
      "log(MN) = log(M) × log(N) → multiplication inside becomes addition: log(MN) = log(M) + log(N)",
      "log(M + N) = log(M) + log(N) → there is no matching rule for a sum inside a logarithm",
      "log₁₀(0) = 0 → no power of 10 equals zero, so log₁₀(0) is undefined",
    ],
    checks: [
      {
        question: "Calculate log₂(16).",
        answer:
          "The question asks which power of 2 equals 16. Since 2⁴ = 16, log₂(16) = 4.",
      },
      {
        question: "Calculate log₁₀(1,000).",
        answer:
          "Since 10³ = 1,000, the exponent needed is 3. Therefore log₁₀(1,000) = 3.",
      },
      {
        question: "Simplify log₁₀(100 × 1,000) using a log rule.",
        answer:
          "The product rule gives log₁₀(100) + log₁₀(1,000) = 2 + 3 = 5. This agrees with 100 × 1,000 = 100,000 = 10⁵.",
      },
      {
        question: "What does ln(x) mean?",
        answer:
          "It is the logarithm with base e, where e ≈ 2.71828. It asks which power of e produces x and is the inverse of eˣ.",
      },
    ],
    tryThis:
      "Set Base b to 2 and Value x to 8, check that the readout gives 3 and that the marker lies on the blue curve, then switch Show log rules off and on before trying Base b 10 with Value x 1,000.",
  },
  {
    id: "binomials",
    plainEnglish:
      "When two pairs are multiplied, every part of one must meet every part of the other. The same pairing pattern also counts the different ways repeated choices can happen.",
    objectives: [
      "expand a product of two binomials by multiplying all four pairs of terms",
      "combine the two middle like terms in a quadratic expansion",
      "expand a power of a binomial using the matching Pascal row",
      "evaluate an expanded binomial at a chosen value",
      "calculate the probability of exactly a chosen number of heads in fair coin flips",
    ],
    whyItMatters:
      "Binomial expansions appear in area calculations, algebraic models and approximation methods, while the same coefficients calculate risks such as the chance of a given number of successful trials.",
    keyIdea:
      "Split a rectangle both ways so every small area records one required product; at higher powers, Pascal's numbers count repeated copies of each term.",
    workedExample: {
      prompt: "Expand and simplify (x + 2)(x + 3).",
      steps: [
        "x × x = x² — multiply the first term from each bracket.",
        "x × 3 = 3x — multiply the first term of the first bracket by the second term of the second.",
        "2 × x = 2x — multiply the second term of the first bracket by the first term of the second.",
        "2 × 3 = 6 — multiply the two constant terms.",
        "(x + 2)(x + 3) = x² + 3x + 2x + 6 — add all four products.",
        "x² + 3x + 2x + 6 = x² + 5x + 6 — combine the like middle terms.",
      ],
      answer: "The expanded expression is x² + 5x + 6.",
    },
    pitfalls: [
      "(x + 2)(x + 3) = x² + 6 → include both cross-products: x² + 3x + 2x + 6 = x² + 5x + 6",
      "(a + b)² = a² + b² → multiply both brackets: (a + b)² = a² + 2ab + b²",
      "The powers of a and b stay fixed across an expansion → a descends while b ascends, and their exponents add to the original power",
      "Exactly k heads in n fair flips has probability C(n, k) ÷ n → there are 2ⁿ equally likely sequences, so use C(n, k) ÷ 2ⁿ",
    ],
    checks: [
      {
        question: "Expand (x + 1)(x + 4).",
        answer:
          "The four products are x², 4x, x and 4. Combining the middle terms gives x² + 5x + 4.",
      },
      {
        question: "Expand (x + 1)².",
        answer:
          "Write it as (x + 1)(x + 1). The four products are x², x, x and 1, so the result is x² + 2x + 1.",
      },
      {
        question: "Which coefficients expand (a + b)⁴?",
        answer:
          "Pascal row 4 is 1, 4, 6, 4, 1, so (a + b)⁴ = a⁴ + 4a³b + 6a²b² + 4ab³ + b⁴.",
      },
      {
        question: "What is the probability of exactly 2 heads in 4 fair coin flips?",
        answer:
          "Pascal row 4 gives C(4, 2) = 6 favourable sequences, and there are 2⁴ = 16 total sequences. The probability is 6 ÷ 16 = 3 ÷ 8 = 37.5%.",
      },
    ],
    tryThis:
      "In 1 · multiply choose (x + 2)(x + 3) and match each coloured region to one product; then open 2 · powers, set Exponent n to 4 and Choose x to 2, before using 3 · probability with Number of flips n set to 4 and Exact heads k set to 2.",
  },
  {
    id: "pascal-triangle",
    plainEnglish:
      "This triangle grows by adding neighbouring numbers to make the next row. Its simple pattern can count choices and predict how repeated pairings spread out.",
    objectives: [
      "construct the next Pascal row by adding adjacent entries",
      "expand a binomial using the coefficients from a selected row",
      "calculate a row sum and connect it to a power of two",
      "calculate the number of ways to choose k objects from n",
      "calculate the probability of exactly k heads in n fair coin flips",
    ],
    whyItMatters:
      "Pascal's Triangle counts possible teams, routes through a grid and card selections, and it gives exact probabilities for repeated events such as coin flips.",
    keyIdea:
      "Each number counts paths arriving from the two positions above, which is why the same triangle describes algebraic coefficients and combinations.",
    workedExample: {
      prompt: "Use Pascal's Triangle to expand (x + 2)⁴.",
      steps: [
        "Pascal row 4 is 1, 4, 6, 4, 1 — these are the coefficients for a fourth power.",
        "(x + 2)⁴ = 1x⁴ + 4x³(2) + 6x²(2²) + 4x(2³) + 1(2⁴) — let the power of x descend while the power of 2 ascends.",
        "(x + 2)⁴ = x⁴ + 8x³ + 24x² + 32x + 16 — evaluate each numerical factor.",
        "At x = 1, the expansion gives 1 + 8 + 24 + 32 + 16 = 81 — check against the original expression, where (1 + 2)⁴ = 3⁴ = 81.",
      ],
      answer: "The expansion is x⁴ + 8x³ + 24x² + 32x + 16.",
    },
    pitfalls: [
      "Pascal row 4 is 1, 3, 3, 1 → rows start at zero, so row 4 is 1, 4, 6, 4, 1",
      "An interior entry copies one number above → add the two entries directly above it",
      "C(5, 2) = 5 → row 5 is 1, 5, 10, 10, 5, 1, so C(5, 2) = 10",
      "Exactly 2 heads in 5 fair flips has probability 10 ÷ 5 → divide by all 2⁵ sequences: 10 ÷ 32 = 31.25%",
    ],
    checks: [
      {
        question: "What row follows 1, 4, 6, 4, 1?",
        answer:
          "Keep 1 at each edge and add adjacent pairs inside: 1 + 4 = 5, 4 + 6 = 10, 6 + 4 = 10 and 4 + 1 = 5. The next row is 1, 5, 10, 10, 5, 1.",
      },
      {
        question: "What is the sum of Pascal row 5?",
        answer:
          "Row 5 is 1, 5, 10, 10, 5, 1, whose sum is 32. Row sums equal 2ⁿ, and 2⁵ = 32.",
      },
      {
        question: "How many ways can 2 objects be chosen from 5?",
        answer:
          "The entry at position 2 in Pascal row 5 is 10, so C(5, 2) = 10 possible choices.",
      },
      {
        question: "What is the probability of exactly 3 heads in 5 fair coin flips?",
        answer:
          "Pascal row 5 gives C(5, 3) = 10 favourable sequences out of 2⁵ = 32 total sequences. The probability is 10 ÷ 32 = 31.25%.",
      },
    ],
    tryThis:
      "Set Pascal row n to 5 and Choose k to 2 to highlight C(5, 2), then set Value of a and Value of b to 1 and compare the displayed row sum with 2⁵.",
  },
];
