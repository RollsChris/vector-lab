export interface GeometrySection {
  id: string;
  title: string;
  summary: string;
}

export interface GeometryInput {
  id: string;
  label: string;
  unit: string;
  defaultValue: number;
  min?: number;
  step?: number | "any";
  integer?: boolean;
}

export interface GeometryResult {
  label: string;
  value: number;
  unit: string;
  formula: string;
}

export interface GeometrySolved {
  results: GeometryResult[];
  note?: string;
  error?: string;
}

export interface GeometryCalculator {
  id: string;
  section: string;
  title: string;
  blurb: string;
  formula: string;
  inputs: GeometryInput[];
  solve: (values: Record<string, number>) => GeometrySolved;
}

export const GEOMETRY_SECTIONS: GeometrySection[] = [
  {
    id: "circles",
    title: "Circles",
    summary: "Radius, diameter, circumference and area.",
  },
  {
    id: "parallelograms",
    title: "Parallelograms",
    summary: "Base × perpendicular height, plus perimeter.",
  },
  {
    id: "polygons",
    title: "Polygons",
    summary: "Regular polygons from side count and side length.",
  },
  {
    id: "area",
    title: "Area",
    summary: "Common flat-shape area tools.",
  },
  {
    id: "volume",
    title: "Volume",
    summary: "Solids: cuboids, cylinders, cones and spheres.",
  },
];

const lengthUnit = "units";
const areaUnit = "units²";
const volumeUnit = "units³";

const pos = (id: string, label: string, defaultValue: number): GeometryInput => ({
  id,
  label,
  unit: lengthUnit,
  defaultValue,
  min: 0,
  step: "any",
});

const sideCount: GeometryInput = {
  id: "sides",
  label: "Number of sides",
  unit: "",
  defaultValue: 6,
  min: 3,
  step: 1,
  integer: true,
};

function requirePositive(values: Record<string, number>, inputs: GeometryInput[]): string | undefined {
  for (const input of inputs) {
    const value = values[input.id];
    if (!Number.isFinite(value) || value <= 0) {
      return `${input.label} must be a positive number.`;
    }
    if (input.integer && !Number.isInteger(value)) {
      return `${input.label} must be a whole number.`;
    }
    if (input.min !== undefined && value < input.min) {
      return `${input.label} must be at least ${input.min}.`;
    }
  }
  return undefined;
}

function solved(results: GeometryResult[], note?: string): GeometrySolved {
  return { results, note };
}

export const GEOMETRY_CALCULATORS: GeometryCalculator[] = [
  {
    id: "circle",
    section: "circles",
    title: "Circle",
    blurb: "Enter radius to get diameter, circumference and area.",
    formula: "d = 2r, C = 2πr, A = πr²",
    inputs: [pos("radius", "Radius", 3)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      const r = values.radius;
      return solved([
        { label: "Diameter", value: 2 * r, unit: lengthUnit, formula: "d = 2r" },
        { label: "Circumference", value: 2 * Math.PI * r, unit: lengthUnit, formula: "C = 2πr" },
        { label: "Area", value: Math.PI * r * r, unit: areaUnit, formula: "A = πr²" },
      ]);
    },
  },
  {
    id: "parallelogram",
    section: "parallelograms",
    title: "Parallelogram",
    blurb: "Area uses the perpendicular height, not the slanted side.",
    formula: "A = b × h, P = 2(b + s)",
    inputs: [pos("base", "Base", 8), pos("height", "Perpendicular height", 4), pos("side", "Side length", 5)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      const { base, height, side } = values;
      return solved([
        { label: "Area", value: base * height, unit: areaUnit, formula: "A = b × h" },
        { label: "Perimeter", value: 2 * (base + side), unit: lengthUnit, formula: "P = 2(b + s)" },
      ]);
    },
  },
  {
    id: "regular-polygon",
    section: "polygons",
    title: "Regular polygon",
    blurb: "All sides and all angles are equal.",
    formula: "P = ns, a = s / (2tan(π/n)), A = Pa / 2",
    inputs: [sideCount, pos("sideLength", "Side length", 2)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      const n = values.sides;
      const s = values.sideLength;
      const perimeter = n * s;
      const apothem = s / (2 * Math.tan(Math.PI / n));
      const area = (perimeter * apothem) / 2;
      return solved([
        { label: "Perimeter", value: perimeter, unit: lengthUnit, formula: "P = n × s" },
        { label: "Apothem", value: apothem, unit: lengthUnit, formula: "a = s / (2tan(π/n))" },
        { label: "Area", value: area, unit: areaUnit, formula: "A = P × a / 2" },
        { label: "Interior angle", value: ((n - 2) * 180) / n, unit: "°", formula: "((n - 2) × 180°) / n" },
        { label: "Exterior angle", value: 360 / n, unit: "°", formula: "360° / n" },
      ]);
    },
  },
  {
    id: "triangle-area",
    section: "area",
    title: "Triangle area",
    blurb: "Half a rectangle/parallelogram with the same base and height.",
    formula: "A = ½bh",
    inputs: [pos("base", "Base", 10), pos("height", "Height", 6)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      return solved([{ label: "Area", value: 0.5 * values.base * values.height, unit: areaUnit, formula: "A = ½bh" }]);
    },
  },
  {
    id: "rectangle-area",
    section: "area",
    title: "Rectangle area",
    blurb: "Length × width, with perimeter around the outside.",
    formula: "A = lw, P = 2(l + w)",
    inputs: [pos("length", "Length", 8), pos("width", "Width", 5)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      const { length, width } = values;
      return solved([
        { label: "Area", value: length * width, unit: areaUnit, formula: "A = l × w" },
        { label: "Perimeter", value: 2 * (length + width), unit: lengthUnit, formula: "P = 2(l + w)" },
      ]);
    },
  },
  {
    id: "trapezium-area",
    section: "area",
    title: "Trapezium / trapezoid area",
    blurb: "Average the two parallel sides, then multiply by height.",
    formula: "A = ½(a + b)h",
    inputs: [pos("parallelA", "Parallel side a", 8), pos("parallelB", "Parallel side b", 5), pos("height", "Height", 4)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      return solved([
        {
          label: "Area",
          value: 0.5 * (values.parallelA + values.parallelB) * values.height,
          unit: areaUnit,
          formula: "A = ½(a + b)h",
        },
      ]);
    },
  },
  {
    id: "cuboid-volume",
    section: "volume",
    title: "Cuboid / box",
    blurb: "A rectangular prism: volume and total surface area.",
    formula: "V = lwh, SA = 2(lw + lh + wh)",
    inputs: [pos("length", "Length", 5), pos("width", "Width", 3), pos("height", "Height", 2)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      const { length, width, height } = values;
      return solved([
        { label: "Volume", value: length * width * height, unit: volumeUnit, formula: "V = l × w × h" },
        {
          label: "Surface area",
          value: 2 * (length * width + length * height + width * height),
          unit: areaUnit,
          formula: "SA = 2(lw + lh + wh)",
        },
      ]);
    },
  },
  {
    id: "cylinder-volume",
    section: "volume",
    title: "Cylinder",
    blurb: "A circle extruded straight up.",
    formula: "V = πr²h, SA = 2πr(r + h)",
    inputs: [pos("radius", "Radius", 2), pos("height", "Height", 6)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      const { radius, height } = values;
      return solved([
        { label: "Volume", value: Math.PI * radius * radius * height, unit: volumeUnit, formula: "V = πr²h" },
        { label: "Surface area", value: 2 * Math.PI * radius * (radius + height), unit: areaUnit, formula: "SA = 2πr(r + h)" },
      ]);
    },
  },
  {
    id: "cone-volume",
    section: "volume",
    title: "Cone",
    blurb: "One third of a cylinder with the same base and height.",
    formula: "V = ⅓πr²h, SA = πr(r + l)",
    inputs: [pos("radius", "Radius", 2), pos("height", "Height", 6)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      const { radius, height } = values;
      const slant = Math.hypot(radius, height);
      return solved([
        { label: "Volume", value: (Math.PI * radius * radius * height) / 3, unit: volumeUnit, formula: "V = ⅓πr²h" },
        { label: "Slant height", value: slant, unit: lengthUnit, formula: "l = √(r² + h²)" },
        { label: "Surface area", value: Math.PI * radius * (radius + slant), unit: areaUnit, formula: "SA = πr(r + l)" },
      ]);
    },
  },
  {
    id: "sphere-volume",
    section: "volume",
    title: "Sphere",
    blurb: "A perfectly round solid from radius alone.",
    formula: "V = ⁴⁄₃πr³, SA = 4πr²",
    inputs: [pos("radius", "Radius", 2)],
    solve(values) {
      const error = requirePositive(values, this.inputs);
      if (error) return { results: [], error };
      const r = values.radius;
      return solved([
        { label: "Volume", value: (4 * Math.PI * r ** 3) / 3, unit: volumeUnit, formula: "V = ⁴⁄₃πr³" },
        { label: "Surface area", value: 4 * Math.PI * r * r, unit: areaUnit, formula: "SA = 4πr²" },
      ]);
    },
  },
];

export function defaultGeometryValues(calculator: GeometryCalculator): Record<string, number> {
  return Object.fromEntries(calculator.inputs.map((input) => [input.id, input.defaultValue]));
}

export function geometryCalculator(id: string): GeometryCalculator {
  return GEOMETRY_CALCULATORS.find((calculator) => calculator.id === id) ?? GEOMETRY_CALCULATORS[0];
}

export function calculatorsForSection(sectionId: string): GeometryCalculator[] {
  return GEOMETRY_CALCULATORS.filter((calculator) => calculator.section === sectionId);
}

export function solveGeometry(id: string, values: Record<string, number>): GeometrySolved {
  const calculator = geometryCalculator(id);
  return calculator.solve({ ...defaultGeometryValues(calculator), ...values });
}

export function fmtGeometry(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e9 || abs < 1e-4) return n.toExponential(4).replace(/\.?0+e/, "e");
  return parseFloat(n.toPrecision(6)).toString();
}
