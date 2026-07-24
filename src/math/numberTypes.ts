export interface NumberClassification {
  input: string;
  display: string;
  value: number | null;
  sets: string[];
  facts: string[];
  error?: string;
}

const KNOWN: Record<string, { display: string; value: number | null; sets: string[]; facts: string[] }> = {
  pi: {
    display: "π",
    value: Math.PI,
    sets: ["irrational", "real", "complex", "transcendental"],
    facts: ["π is not a ratio of whole numbers.", "π is transcendental: it is not the root of any non-zero polynomial with rational coefficients."],
  },
  "π": {
    display: "π",
    value: Math.PI,
    sets: ["irrational", "real", "complex", "transcendental"],
    facts: ["π is not a ratio of whole numbers.", "π is transcendental: it is not algebraic."],
  },
  e: {
    display: "e",
    value: Math.E,
    sets: ["irrational", "real", "complex", "transcendental"],
    facts: [
      "e is about 2.71828.",
      "It is the natural growth base: if something grows continuously at 100% per unit time, it multiplies by e after one unit.",
      "The curve y = eˣ is special because its slope is also eˣ everywhere.",
      "e is transcendental, so it sits outside the algebraic numbers.",
    ],
  },
  "sqrt(2)": {
    display: "√2",
    value: Math.SQRT2,
    sets: ["irrational", "real", "complex", "algebraic"],
    facts: ["√2 is irrational.", "√2 is algebraic because it solves x² - 2 = 0."],
  },
  "√2": {
    display: "√2",
    value: Math.SQRT2,
    sets: ["irrational", "real", "complex", "algebraic"],
    facts: ["√2 cannot be written as p/q.", "It is still algebraic because it is the root of x² - 2."],
  },
  i: {
    display: "i",
    value: null,
    sets: ["imaginary", "complex"],
    facts: ["i is defined by i² = -1.", "It is not real, but it is complex."],
  },
};

export function classifyNumber(input: string): NumberClassification {
  const raw = input.trim();
  if (!raw) {
    return { input, display: "", value: null, sets: [], facts: [], error: "Type a number or expression." };
  }

  const key = raw.toLowerCase().replace(/\s+/g, "");
  const known = KNOWN[key];
  if (known) return { input, ...known };

  const fraction = raw.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator === 0) {
      return { input, display: raw, value: null, sets: [], facts: [], error: "Division by zero is undefined." };
    }
    return classifyRational(input, numerator / denominator, `${numerator}/${denominator}`);
  }

  const sqrt = raw.match(/^(?:sqrt\((\d+)\)|√(\d+))$/i);
  if (sqrt) {
    const n = Number(sqrt[1] ?? sqrt[2]);
    const root = Math.sqrt(n);
    if (Number.isInteger(root)) return classifyRational(input, root, `√${n}`);
    return {
      input,
      display: `√${n}`,
      value: root,
      sets: ["irrational", "real", "complex", "algebraic"],
      facts: [`√${n} is irrational because ${n} is not a perfect square.`, `It is algebraic because it solves x² - ${n} = 0.`],
    };
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return classifyRational(input, numeric, raw);

  return {
    input,
    display: raw,
    value: null,
    sets: [],
    facts: ["Try examples like 7, -3, 1/3, 0.25, √2, π, e, or i."],
    error: "I do not recognise that number yet.",
  };
}

function classifyRational(input: string, value: number, display: string): NumberClassification {
  const sets = ["rational", "real", "complex", "algebraic"];
  const facts = ["Rational means it can be written as a ratio p/q of whole numbers.", "Every rational number is also real and algebraic."];

  if (Number.isInteger(value)) {
    sets.unshift("integer");
    facts.unshift(`${display} is an integer: no fractional part.`);
    if (value >= 0) {
      sets.unshift("whole");
      facts.unshift("Whole numbers are 0, 1, 2, 3, ...");
    }
    if (value > 0) {
      sets.unshift("natural");
      facts.unshift("Natural numbers are the counting numbers: 1, 2, 3, ...");
      if (isPrime(value)) sets.push("prime");
      else if (value > 1) sets.push("composite");
    }
  } else {
    facts.unshift(`${display} has a fractional part, so it is rational but not an integer.`);
  }

  return { input, display, value, sets, facts };
}

function isPrime(value: number): boolean {
  if (!Number.isInteger(value) || value < 2) return false;
  if (value === 2) return true;
  if (value % 2 === 0) return false;
  for (let d = 3; d * d <= value; d += 2) {
    if (value % d === 0) return false;
  }
  return true;
}

export function containsSet(classification: NumberClassification, set: string): boolean {
  return classification.sets.includes(set);
}
