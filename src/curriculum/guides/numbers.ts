/** Teaching guides for the Stage 1 lessons on numbers and arithmetic. */
import type { LessonGuide } from "../types";

export const NUMBER_GUIDES: readonly LessonGuide[] = [
  {
    id: "foundations",
    plainEnglish: "This lesson is a map of the different kinds of number and the main ideas that build on them. Move through the short chapters to see how each new idea grows from an earlier one.",
    objectives: [
      "classify numbers into the families they belong to",
      "calculate common arithmetic examples without falling into sign, fraction, or ordering traps",
      "simplify a basic expression and solve a simple equation",
      "read roots, crossings, and slopes from basic graphs",
      "explain how functions, rates of change, and accumulated area connect to later maths",
    ],
    whyItMatters: "This map helps you recognise what a calculator result means, rearrange a household budget formula, read a graph in the news, and see where algebra and calculus fit before studying them in depth.",
    keyIdea: "Picture mathematics as a staircase: number families are the first step, and each later chapter reuses the rules built below it.",
    workedExample: {
      prompt: "Classify −3 using the nested number families.",
      steps: [
        "−3 has no fractional part, so it is an integer — integers include positive and negative whole-number steps.",
        "−3 = −3/1, so it is rational — it can be written as one integer divided by another non-zero integer.",
        "−3 lies on the ordinary number line, so it is real — every rational number is real.",
        "−3 = −3 + 0i, so it is complex — every real number is also a complex number with no imaginary part.",
        "−3 is not whole or natural — those families do not include negative values.",
      ],
      answer: "−3 is an integer, rational, real, algebraic, and complex number, but it is not whole or natural.",
    },
    pitfalls: [
      "−3 is a whole number because it has no fraction → whole numbers start at 0; −3 is an integer, not a whole number.",
      "1/2 + 1/3 = 2/5 → rename the parts with a shared denominator: 3/6 + 2/6 = 5/6.",
      "−3² = 9 → the power acts before the leading minus, so −3² = −(3²) = −9; use (−3)² = 9 when the negative is part of the base.",
      "3(x + 2) = 3x + 2 → multiply every term inside the brackets: 3(x + 2) = 3x + 6.",
    ],
    checks: [
      {
        question: "What is the smallest listed number family that contains 0?",
        answer: "The whole numbers. Natural numbers begin at 1 in this lesson, while whole numbers add 0.",
      },
      {
        question: "Why is 1/3 rational?",
        answer: "It is rational because it is already written as one integer divided by another non-zero integer.",
      },
      {
        question: "Solve 3x + 2 = 11.",
        answer: "Subtract 2 from both sides to get 3x = 9, then divide both sides by 3, giving x = 3.",
      },
    ],
    tryThis: "Choose F.1 Arithmetic, type √2 into the Number box, then click the π and i sample buttons. Watch the highlighted rings and labelled zones change as each value moves to its most specific number family.",
  },
  {
    id: "number-sense-fractions",
    plainEnglish: "An amount can be shared into equal groups or built by counting equal pieces. The top number counts the amount, and the bottom number says how finely each whole is split.",
    objectives: [
      "calculate a fraction by dividing its numerator by its denominator",
      "plot proper and improper fractions on a number line",
      "compare fractions and recognise two names for the same value",
      "simplify a fraction by dividing both numbers by a common factor",
      "add fractions by renaming them with equal-sized parts",
    ],
    whyItMatters: "Fractions appear when sharing a pizza, doubling a recipe, reading a probability, comparing prices per unit, or converting a test score into a percentage.",
    keyIdea: "The denominator chooses the size of each piece, and the numerator counts how many of those pieces you have.",
    workedExample: {
      prompt: "Add 1/2 and 1/3.",
      steps: [
        "The smallest shared denominator is 6 — both 2 and 3 divide exactly into 6.",
        "1/2 = 3/6 — multiply the numerator and denominator by 3, which keeps the value unchanged.",
        "1/3 = 2/6 — multiply the numerator and denominator by 2, which also keeps the value unchanged.",
        "3/6 + 2/6 = 5/6 — the pieces are now all sixths, so their counts can be added.",
        "5/6 is already simplest — 5 and 6 have no common factor greater than 1.",
      ],
      answer: "1/2 + 1/3 = 5/6.",
    },
    pitfalls: [
      "1/2 + 1/3 = 2/5 → the pieces are different sizes; rename them first: 3/6 + 2/6 = 5/6.",
      "A larger denominator means a larger fraction → for the same numerator, more equal splits make smaller pieces, so 1/8 is smaller than 1/4.",
      "5/4 must lie below 1 because it is a fraction → 5/4 = 1 and 1/4, so it lies beyond 1 on the number line.",
      "8/12 is simplest because both numbers are even → divide both by their greatest common divisor, 4: 8/12 = 2/3.",
    ],
    checks: [
      {
        question: "What decimal does 3/4 represent?",
        answer: "3/4 means 3 ÷ 4, which is 0.75.",
      },
      {
        question: "Why is 5/4 greater than 1?",
        answer: "Four quarters make one whole, and the fifth quarter adds another 1/4, so 5/4 = 1 and 1/4.",
      },
      {
        question: "Simplify 8/12.",
        answer: "The greatest common divisor of 8 and 12 is 4. Dividing both by 4 gives 8/12 = 2/3.",
      },
    ],
    tryThis: "Enter 7 as the Numerator and 3 as the Denominator, then press Add to plot. Choose 4× under Bar magnification and compare the dot beyond 2 with the sharing and counting-parts bars.",
  },
  {
    id: "arithmetic-operations",
    plainEnglish: "This lesson shows five useful ways to change or combine amounts: joining, taking away, making equal groups, sharing, and multiplying a number by every smaller counting number. The pictures show what each action does rather than asking you to memorise a mark.",
    objectives: [
      "calculate sums, differences, products, quotients with remainders, and factorials",
      "check addition with subtraction and multiplication with division",
      "explain when swapping or regrouping numbers keeps an answer unchanged",
      "apply the distributive rule to split a multiplication into easier parts",
      "explain why division by zero has no defined answer",
    ],
    whyItMatters: "These operations handle shopping totals, change, equal sharing, packing items into groups, and the counting of possible arrangements.",
    keyIdea: "Each operation is an action on an amount, and an inverse operation retraces that action to check the result.",
    workedExample: {
      prompt: "Share 17 counters equally between 5 groups.",
      steps: [
        "5 × 3 = 15 — three counters can go into each of the five groups.",
        "17 − 15 = 2 — two counters remain after making the equal groups.",
        "17 ÷ 5 = 3 remainder 2 — the quotient gives the amount per group and the remainder gives what is left.",
        "3 × 5 + 2 = 17 — multiplying back and adding the remainder rebuilds the starting total.",
      ],
      answer: "17 ÷ 5 = 3 remainder 2.",
    },
    pitfalls: [
      "4 − 9 = 5 because 9 − 4 = 5 → subtraction depends on order: 4 − 9 = −5.",
      "12 ÷ 3 = 3 ÷ 12 → division depends on order: 12 ÷ 3 = 4, while 3 ÷ 12 = 1/4.",
      "0! = 0 → by definition the empty descending product is 1, so 0! = 1.",
      "8 ÷ 0 = 0 → division by zero is undefined because no number multiplied by 0 can recover 8.",
    ],
    checks: [
      {
        question: "What is 8 + 5, and how can subtraction check it?",
        answer: "8 + 5 = 13. The inverse check is 13 − 5 = 8, which returns to the starting number.",
      },
      {
        question: "What is 14 ÷ 4?",
        answer: "Three full groups of 4 use 12, leaving 2, so 14 ÷ 4 = 3 remainder 2. The check is 3 × 4 + 2 = 14.",
      },
      {
        question: "What is 4!?",
        answer: "4! = 4 × 3 × 2 × 1 = 24 because factorial multiplies every descending whole number down to 1.",
      },
    ],
    tryThis: "Choose ÷ Division, set Dividend to 17 and Divisor to 5, then press Check with the inverse. Compare the five visible groups, the two leftover counters, and the rebuilding calculation.",
  },
  {
    id: "order-of-operations",
    plainEnglish: "One written calculation can contain several jobs, so people need an agreed rule for which job happens first. Following that rule makes everyone reach the same answer.",
    objectives: [
      "list the agreed order for brackets, powers, division, multiplication, addition, and subtraction",
      "calculate a mixed expression one operation at a time",
      "evaluate the innermost brackets before operations outside them",
      "apply division and multiplication from left to right when they share a line",
      "explain why blindly working from left to right can give a wrong answer",
    ],
    whyItMatters: "Spreadsheets, calculators, computer programs, bills, and scientific formulas all rely on the same ordering rules to avoid ambiguous results.",
    keyIdea: "Climb down the BODMAS ladder, and when two operations share a rung, take the left-most one first.",
    workedExample: {
      prompt: "Calculate 6 + 12 ÷ 2 × 3.",
      steps: [
        "12 ÷ 2 = 6 — division and multiplication come before addition, and division is the left-most of those equal-rank operations.",
        "6 × 3 = 18 — continue left to right on the division-and-multiplication rung.",
        "6 + 18 = 24 — addition is performed after the higher-rank operations are complete.",
      ],
      answer: "6 + 12 ÷ 2 × 3 = 24.",
    },
    pitfalls: [
      "2 + 3 × 4 = 20 → multiply before adding: 3 × 4 = 12, then 2 + 12 = 14.",
      "(2 + 3) × 4 = 14 → brackets come first: 2 + 3 = 5, then 5 × 4 = 20.",
      "6 + 12 ÷ 2 × 3 = 8 → division and multiplication have equal rank and go left to right: 12 ÷ 2 = 6, then 6 × 3 = 18, so the result is 24.",
      "24 − 8 + 2 = 14 → addition and subtraction have equal rank and go left to right: 24 − 8 = 16, then 16 + 2 = 18.",
    ],
    checks: [
      {
        question: "What is 3 + 4 × 2?",
        answer: "Multiply first: 4 × 2 = 8. Then add 3, giving 11.",
      },
      {
        question: "What is (3 + 4) × 2?",
        answer: "Complete the brackets first: 3 + 4 = 7. Then multiply 7 × 2 = 14.",
      },
      {
        question: "What is 18 ÷ 3 × 2?",
        answer: "Division and multiplication share a rank, so work left to right: 18 ÷ 3 = 6, then 6 × 2 = 12.",
      },
    ],
    tryThis: "Choose the 6 + 12 ÷ 2 × 3 preset, press Restart, and use Next to watch each highlighted operation collapse. Then change Auto step (s) and press Auto to replay the same reasoning at your chosen speed.",
  },
  {
    id: "times-tables",
    plainEnglish: "Equal rows and columns let you count a large group without touching every item. This lesson shows how a few trusted facts and simple splits can produce the harder answers.",
    objectives: [
      "list multiplication facts from one group to twelve groups for a chosen table",
      "calculate products by doubling, halving, or using ten as an anchor",
      "calculate a difficult fact by splitting one factor into easier parts",
      "swap the order of two factors to use a more familiar table",
      "check a multiplication fact with division",
    ],
    whyItMatters: "Fast multiplication helps with prices for several items, recipe batches, areas, time calculations, written arithmetic, fractions, and algebra.",
    keyIdea: "A hard multiplication fact is usually two easy facts joined together.",
    workedExample: {
      prompt: "Calculate 7 × 12 without recalling it as a single memorised fact.",
      steps: [
        "12 = 10 + 2 — split twelve into two easy table facts.",
        "7 × 12 = 7 × (10 + 2) — replacing 12 with an equal sum keeps the product unchanged.",
        "7 × (10 + 2) = 7 × 10 + 7 × 2 — distribute the seven groups across both parts.",
        "7 × 10 + 7 × 2 = 70 + 14 = 84 — use the ten-times fact and a double.",
        "84 ÷ 7 = 12 — division checks that the product contains twelve groups of seven.",
      ],
      answer: "7 × 12 = 84.",
    },
    pitfalls: [
      "7 × 8 = 54 → 54 belongs to 6 × 9; split 8 into 5 + 3: 35 + 21 = 56.",
      "8 × 9 = 80 → nine groups are one group fewer than ten: 8 × 10 − 8 = 80 − 8 = 72.",
      "3 × 12 and 12 × 3 need separate facts → swapping factors keeps the product unchanged, and both equal 36.",
      "4 × 13 = 26 after one double → multiplying by 4 needs two doubles: 13 → 26 → 52.",
    ],
    checks: [
      {
        question: "What is 4 × 13 using doubles?",
        answer: "Double 13 to get 26, then double 26 to get 52. Two doubles multiply by 4.",
      },
      {
        question: "What is 9 × 6 using ten groups?",
        answer: "Ten groups of 6 make 60. Subtract one group of 6: 60 − 6 = 54.",
      },
      {
        question: "What is 11 × 8?",
        answer: "Ten groups of 8 make 80, and one more group makes 88, so 11 × 8 = 88.",
      },
    ],
    tryThis: "Choose the ×7 table, then in Quick practice enter 42 for 6 × 7 and press Check. Press Next fact and use the displayed hint to derive the next answer instead of guessing.",
  },
  {
    id: "multiplication-division",
    plainEnglish: "This lesson gives a reliable written way to handle multiplying and sharing problems that are too large to do in one thought. It breaks each big job into small steps and then checks that the pieces fit back together correctly.",
    objectives: [
      "calculate a multi-digit product using place-value partial products",
      "calculate a quotient and remainder using long division",
      "estimate a product or quotient before finding its exact value",
      "check multiplication with division and division with multiplication",
      "apply mental shortcuts for multiplying or dividing by five, twenty-five, fifty, and one hundred and twenty-five",
    ],
    whyItMatters: "Written multiplication and division are useful for invoices, stock counts, project estimates, sharing costs, and checking whether a calculator entry has a misplaced digit.",
    keyIdea: "Split numbers by place value, solve the smaller jobs, and combine them without losing which digits represent ones, tens, or hundreds.",
    workedExample: {
      prompt: "Calculate 347 × 26 using long multiplication.",
      steps: [
        "26 = 20 + 6 — split the multiplier into its tens and ones.",
        "347 × 6 = 2,082 — this is the ones partial product.",
        "347 × 20 = 6,940 — multiply by 2 to get 694, then shift one place because the 2 represents two tens.",
        "2,082 + 6,940 = 9,022 — add the two place-value partial products.",
        "350 × 25 = 8,750 — this nearby estimate confirms that 9,022 has a sensible size.",
      ],
      answer: "347 × 26 = 9,022.",
    },
    pitfalls: [
      "347 × 20 = 694 → the 2 represents two tens, so shift one place: 347 × 20 = 6,940.",
      "18 ÷ 6 = 2 remainder 6 → a remainder must be smaller than the divisor; the extra group makes 18 ÷ 6 = 3.",
      "987 ÷ 6 = 164 with nothing left → 6 × 164 = 984, so 3 remains: 987 ÷ 6 = 164 remainder 3.",
      "4,782 × 63 = 30,126 → an estimate near 4,800 × 60 = 288,000 shows a missing place-value line; the exact product is 301,266.",
    ],
    checks: [
      {
        question: "What is 36 × 25 using the shortcut from the lesson?",
        answer: "Divide 36 by 4 to get 9, then multiply by 100: 9 × 100 = 900. This works because 25 is one quarter of 100.",
      },
      {
        question: "What is 987 ÷ 6?",
        answer: "6 × 164 = 984 and 987 − 984 = 3, so 987 ÷ 6 = 164 remainder 3. The remainder is smaller than 6.",
      },
      {
        question: "What is 87,654 ÷ 24?",
        answer: "24 × 3,652 = 87,648, leaving 87,654 − 87,648 = 6. Therefore the result is 3,652 remainder 6.",
      },
    ],
    tryThis: "Choose Long division, enter 987 in Number to share and 6 in Share between, then compare the Quotient, Remainder, and Check readouts with each divide, multiply, subtract, and bring-down step.",
  },
  {
    id: "unit-conversions",
    plainEnglish: "The same real amount can be described with different labels and different numbers. This lesson changes the label and number together so the amount itself stays unchanged.",
    objectives: [
      "convert values between units of length, mass, time, area, volume, speed, and other categories",
      "select a conversion factor whose unwanted unit cancels, and show the working",
      "convert temperatures where both the scale and zero point change",
      "calculate how long a journey takes by dividing a distance by a speed",
      "recall the everyday conversion factors, and tell an exact definition from a rounded value",
    ],
    whyItMatters: "Unit conversion is needed when following recipes, measuring rooms, comparing road speeds, reading weather forecasts, buying materials, and using scientific data from another country.",
    keyIdea: "Multiply by a fraction equal to one, arranged so the old unit cancels and the wanted unit remains; to combine quantities instead of swapping them, reduce everything to base units first and then divide.",
    workedExample: {
      prompt: "Convert 2.5 kilometres to metres.",
      steps: [
        "1 km = 1,000 m — this is the exact relationship between the two units.",
        "2.5 km × (1,000 m / 1 km) — place kilometres on the bottom so the old unit cancels.",
        "2.5 × 1,000 m = 2,500 m — after cancellation, only metres remain.",
        "2,500 m ÷ 1,000 = 2.5 km — converting back checks the original amount.",
      ],
      answer: "2.5 kilometres is 2,500 metres.",
    },
    pitfalls: [
      "3 km = 0.003 m → a kilometre is larger than a metre, so the metre count grows: 3 km = 3,000 m.",
      "1 m² = 100 cm² → both side lengths scale by 100, so the area scales by 100 × 100: 1 m² = 10,000 cm².",
      "10 miles ÷ 30 km/h = 0.33 hours → the units do not cancel; convert to base units first, giving 16093.44 m ÷ 8.333 m/s ≈ 32 minutes.",
      "1 kilobyte = 1,024 bytes → a kilobyte is 1,000 bytes; the 1,024 value belongs to the kibibyte (KiB), which is why drive capacities look short.",
    ],
    checks: [
      {
        question: "Convert 4 metres to centimetres.",
        answer: "Each metre contains 100 centimetres, so 4 × 100 = 400 centimetres.",
      },
      {
        question: "How long does a 10 mile drive take at 30 mph?",
        answer: "Time is distance divided by speed, and the units already match, so 10 ÷ 30 = 1/3 of an hour — 20 minutes.",
      },
      {
        question: "Why can you not divide 10 miles by 30 km/h directly?",
        answer: "The miles on top and the kilometres on the bottom are different units, so nothing cancels. Put both into base units first — 16093.44 m ÷ 8.333 m/s ≈ 1931 s, about 32 minutes.",
      },
      {
        question: "Which is exact by definition: 1 inch = 2.54 cm, or 1 horsepower = 745.7 W?",
        answer: "The inch. It is defined as exactly 25.4 millimetres, so 2.54 cm is not rounded. Horsepower is a convention whose value in watts carries more digits than the 745.7 shown, so it is approximate.",
      },
    ],
    tryThis: "Set Category to Length, enter 2.5 under Start with Kilometre and Metre as the units, then press ⇅ Swap to confirm 2,500 metres returns to 2.5 kilometres. Next scroll to the Journey planner, press 10 mi at 30 mph to get 20 min, and change the speed unit to km/h to watch the working switch to base units. Finally, open the Lookup table, type \"speed\" in its search box, and click the 1 m/s = 3.6 km/h row to load that factor straight into the converter.",
  },
];
