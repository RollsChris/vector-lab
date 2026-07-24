import type { FormulaDerivation } from "../../core/FormulaDerivations";

const groupsSvg = `
  <svg viewBox="0 0 320 130" role="img" aria-label="Six groups of seven dots split into six groups of five and six groups of two">
    <text x="20" y="28" fill="#ffd166" font-size="18">6 × 7 = 6 × (5 + 2)</text>
    <g fill="#58a6ff">${Array.from({ length: 30 }, (_, i) => `<circle cx="${28 + (i % 10) * 14}" cy="${55 + Math.floor(i / 10) * 20}" r="5"/>`).join("")}</g>
    <g fill="#7ee787">${Array.from({ length: 12 }, (_, i) => `<circle cx="${184 + (i % 4) * 18}" cy="${55 + Math.floor(i / 4) * 20}" r="5"/>`).join("")}</g>
    <text x="20" y="122" fill="#58a6ff" font-size="16">30</text><text x="174" y="122" fill="#7ee787" font-size="16">+ 12 = 42</text>
  </svg>`;

export const TIMES_TABLES_DERIVATIONS: readonly FormulaDerivation[] = [
  {
    id: "times-double",
    title: "Why multiplying by two means doubling",
    equation: "n × 2 = n + n",
    startingPoint: "Multiplication counts equal groups.",
    steps: [
      { expression: "n × 2", reason: "This means two equal groups of n." },
      { expression: "n + n", reason: "Write those two groups as repeated addition." },
      { expression: "n × 2 = n + n", reason: "Both expressions count the same total." },
    ],
    result: "Double a number for the ×2 table; double twice for ×4 and double three times for ×8.",
  },
  {
    id: "times-five",
    title: "Why multiplying by five is half of multiplying by ten",
    equation: "n × 5 = (n × 10) / 2",
    startingPoint: "Five is exactly half of ten.",
    steps: [
      { expression: "5 = 10 / 2", reason: "Two fives make ten." },
      { expression: "n × 5 = n × (10 / 2)", reason: "Replace 5 with its equal value." },
      { expression: "n × 5 = (n × 10) / 2", reason: "Multiply by ten, then halve." },
    ],
    result: "For 38 × 5, calculate 380 ÷ 2 = 190.",
  },
  {
    id: "times-nine",
    title: "Why the nine-times trick subtracts one group",
    equation: "n × 9 = n × 10 − n",
    startingPoint: "Nine is one less than ten.",
    steps: [
      { expression: "9 = 10 − 1", reason: "Start from the nearby easy multiplier ten." },
      { expression: "n × 9 = n × (10 − 1)", reason: "Replace 9 with 10 − 1." },
      { expression: "n × 9 = 10n − n", reason: "Distribute n across the bracket." },
    ],
    result: "For 7 × 9, take 70 and remove one 7: 70 − 7 = 63.",
  },
  {
    id: "times-split",
    title: "How splitting a hard fact makes it manageable",
    equation: "a × (b + c) = ab + ac",
    startingPoint: "Each of a equal groups contains b items and c items.",
    steps: [
      { expression: "6 × 7 = 6 × (5 + 2)", reason: "Split 7 into two easier parts." },
      { expression: "6 × 5 + 6 × 2", reason: "Each of the six groups contains both parts." },
      { expression: "30 + 12 = 42", reason: "Calculate the familiar facts and add them." },
    ],
    result: "Choose the split that uses facts you know: 7 = 5 + 2, 8 = 10 − 2, or 12 = 10 + 2.",
    diagram: { description: "Six groups of seven can be counted as six groups of five plus six groups of two.", svg: groupsSvg },
  },
];
