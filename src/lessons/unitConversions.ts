import { derivationButton } from "../core/FormulaDerivations";

/**
 * Unit-conversion data + helpers.
 *
 * Every unit is stored as an *affine* map to its category's base unit:
 *
 *     base = value * factor + offset
 *     value = (base - offset) / factor
 *
 * A pure `offset = 0` covers all the everyday scale conversions (length, mass,
 * speed …) where "1 km = 1000 m". The offset term is only needed for
 * temperature (°C / °F sit at a shifted zero), but supporting it everywhere
 * keeps a single, uniform conversion path — no special cases in the calculator.
 */
export interface Unit {
  /** Stable id used in <option value>. */
  id: string;
  /** Human label shown in the dropdown, e.g. "Kilometre (km)". */
  label: string;
  /** Short symbol used in the worked-example string, e.g. "km". */
  symbol: string;
  /** Multiplier onto the base unit. */
  factor: number;
  /** Added after scaling (0 for everything except temperature). */
  offset?: number;
}

export interface Category {
  id: string;
  /** Menu label, e.g. "Length". */
  label: string;
  /** Symbol of the base unit, e.g. "m" — used in the working line. */
  base: string;
  /** Whether conversions are a simple ×factor (so we can show the unit-fraction working). */
  linear: boolean;
  units: Unit[];
}

/** value expressed in the base unit. */
export function toBase(u: Unit, value: number): number {
  return value * u.factor + (u.offset ?? 0);
}

/** base-unit quantity expressed in unit u. */
export function fromBase(u: Unit, base: number): number {
  return (base - (u.offset ?? 0)) / u.factor;
}

/** Convert a value from one unit to another within the same category. */
export function convert(from: Unit, to: Unit, value: number): number {
  return fromBase(to, toBase(from, value));
}

/** Tidy a number for display: trims float noise, keeps small/large in range. */
export function fmt(n: number): string {
  if (!isFinite(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e9 || abs < 1e-4) return n.toExponential(4).replace(/\.?0+e/, "e");
  // Up to 6 significant figures, then strip trailing zeros.
  return parseFloat(n.toPrecision(6)).toString();
}

/**
 * How long a journey takes: time = distance ÷ speed.
 *
 * Both inputs are reduced to base units first (metres and metres per second), which is
 * exactly the dimensional-analysis move the lesson teaches — once everything is in base
 * units the division is unit-free, and the answer comes out in seconds.
 *
 * Returns `NaN` for inputs that have no meaningful journey time (non-finite values,
 * negative distance, or a speed of zero or less — you never arrive).
 */
export function journeyTimeSeconds(
  distance: number,
  distanceUnit: Unit,
  speed: number,
  speedUnit: Unit,
): number {
  if (!isFinite(distance) || !isFinite(speed)) return NaN;
  if (distance < 0 || speed <= 0) return NaN;
  const metres = toBase(distanceUnit, distance);
  const metresPerSecond = toBase(speedUnit, speed);
  if (metresPerSecond <= 0) return NaN;
  return metres / metresPerSecond;
}

/**
 * A duration in seconds written the way a person would say it, e.g. "1 hr 12 min 30 s".
 *
 * Only the two or three largest non-zero units are shown: "2 days 4 hr" is useful,
 * "2 days 4 hr 0 min 13 s" is not. Sub-second journeys keep their precision instead of
 * collapsing to "0 s".
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "—";
  if (seconds === 0) return "0 s";
  if (seconds < 1) return `${fmt(seconds)} s`;

  const parts: string[] = [];
  let left = Math.round(seconds);
  const units: { label: string; size: number }[] = [
    { label: "day", size: 86400 },
    { label: "hr", size: 3600 },
    { label: "min", size: 60 },
    { label: "s", size: 1 },
  ];
  for (const unit of units) {
    const count = Math.floor(left / unit.size);
    if (count > 0) {
      parts.push(`${count} ${unit.label}${unit.label === "day" && count > 1 ? "s" : ""}`);
      left -= count * unit.size;
    }
  }
  // Beyond three terms the extra precision is noise for a journey estimate.
  return parts.slice(0, 3).join(" ");
}

export const CATEGORIES: Category[] = [
  {
    id: "si-prefix",
    label: "SI prefixes",
    base: "base unit",
    linear: true,
    units: [
      { id: "G", label: "Giga (G) ×10⁹", symbol: "G-unit", factor: 1e9 },
      { id: "M", label: "Mega (M) ×10⁶", symbol: "M-unit", factor: 1e6 },
      { id: "k", label: "Kilo (k) ×10³", symbol: "k-unit", factor: 1e3 },
      { id: "h", label: "Hecto (h) ×10²", symbol: "h-unit", factor: 1e2 },
      { id: "da", label: "Deca (da) ×10¹", symbol: "da-unit", factor: 10 },
      { id: "one", label: "Base unit ×10⁰", symbol: "unit", factor: 1 },
      { id: "d", label: "Deci (d) ×10⁻¹", symbol: "d-unit", factor: 1e-1 },
      { id: "c", label: "Centi (c) ×10⁻²", symbol: "c-unit", factor: 1e-2 },
      { id: "m", label: "Milli (m) ×10⁻³", symbol: "m-unit", factor: 1e-3 },
      { id: "u", label: "Micro (µ) ×10⁻⁶", symbol: "µ-unit", factor: 1e-6 },
      { id: "n", label: "Nano (n) ×10⁻⁹", symbol: "n-unit", factor: 1e-9 },
    ],
  },
  {
    id: "length",
    label: "Length",
    base: "m",
    linear: true,
    units: [
      { id: "km", label: "Kilometre (km)", symbol: "km", factor: 1000 },
      { id: "m", label: "Metre (m)", symbol: "m", factor: 1 },
      { id: "cm", label: "Centimetre (cm)", symbol: "cm", factor: 0.01 },
      { id: "mm", label: "Millimetre (mm)", symbol: "mm", factor: 0.001 },
      { id: "um", label: "Micrometre (µm)", symbol: "µm", factor: 1e-6 },
      { id: "mi", label: "Mile (mi)", symbol: "mi", factor: 1609.344 },
      { id: "yd", label: "Yard (yd)", symbol: "yd", factor: 0.9144 },
      { id: "ft", label: "Foot (ft)", symbol: "ft", factor: 0.3048 },
      { id: "in", label: "Inch (in)", symbol: "in", factor: 0.0254 },
      { id: "nmi", label: "Nautical mile (nmi)", symbol: "nmi", factor: 1852 },
    ],
  },
  {
    id: "mass",
    label: "Mass",
    base: "kg",
    linear: true,
    units: [
      { id: "t", label: "Tonne (t)", symbol: "t", factor: 1000 },
      { id: "kg", label: "Kilogram (kg)", symbol: "kg", factor: 1 },
      { id: "g", label: "Gram (g)", symbol: "g", factor: 0.001 },
      { id: "mg", label: "Milligram (mg)", symbol: "mg", factor: 1e-6 },
      { id: "lb", label: "Pound (lb)", symbol: "lb", factor: 0.45359237 },
      { id: "oz", label: "Ounce (oz)", symbol: "oz", factor: 0.028349523 },
      { id: "st", label: "Stone (st)", symbol: "st", factor: 6.35029318 },
    ],
  },
  {
    id: "time",
    label: "Time",
    base: "s",
    linear: true,
    units: [
      { id: "ms", label: "Millisecond (ms)", symbol: "ms", factor: 0.001 },
      { id: "s", label: "Second (s)", symbol: "s", factor: 1 },
      { id: "min", label: "Minute (min)", symbol: "min", factor: 60 },
      { id: "hr", label: "Hour (hr)", symbol: "hr", factor: 3600 },
      { id: "day", label: "Day", symbol: "day", factor: 86400 },
      { id: "wk", label: "Week", symbol: "wk", factor: 604800 },
      { id: "yr", label: "Year (365.25 d)", symbol: "yr", factor: 31557600 },
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    base: "K",
    linear: false,
    units: [
      { id: "K", label: "Kelvin (K)", symbol: "K", factor: 1, offset: 0 },
      { id: "C", label: "Celsius (°C)", symbol: "°C", factor: 1, offset: 273.15 },
      { id: "F", label: "Fahrenheit (°F)", symbol: "°F", factor: 5 / 9, offset: 255.372222 },
    ],
  },
  {
    id: "area",
    label: "Area",
    base: "m²",
    linear: true,
    units: [
      { id: "km2", label: "Square kilometre (km²)", symbol: "km²", factor: 1e6 },
      { id: "m2", label: "Square metre (m²)", symbol: "m²", factor: 1 },
      { id: "cm2", label: "Square centimetre (cm²)", symbol: "cm²", factor: 1e-4 },
      { id: "mm2", label: "Square millimetre (mm²)", symbol: "mm²", factor: 1e-6 },
      { id: "ha", label: "Hectare (ha)", symbol: "ha", factor: 1e4 },
      { id: "acre", label: "Acre", symbol: "acre", factor: 4046.8564224 },
      { id: "ft2", label: "Square foot (ft²)", symbol: "ft²", factor: 0.09290304 },
      { id: "in2", label: "Square inch (in²)", symbol: "in²", factor: 0.00064516 },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    base: "L",
    linear: true,
    units: [
      { id: "m3", label: "Cubic metre (m³)", symbol: "m³", factor: 1000 },
      { id: "L", label: "Litre (L)", symbol: "L", factor: 1 },
      { id: "mL", label: "Millilitre (mL)", symbol: "mL", factor: 0.001 },
      { id: "cm3", label: "Cubic centimetre (cm³)", symbol: "cm³", factor: 0.001 },
      { id: "galUS", label: "US gallon", symbol: "gal", factor: 3.785411784 },
      { id: "galUK", label: "UK gallon", symbol: "gal", factor: 4.54609 },
      { id: "ptUK", label: "UK pint", symbol: "pt", factor: 0.56826125 },
      { id: "flozUK", label: "UK fluid ounce", symbol: "fl oz", factor: 0.0284130625 },
    ],
  },
  {
    id: "speed",
    label: "Speed",
    base: "m/s",
    linear: true,
    units: [
      { id: "mps", label: "Metre/second (m/s)", symbol: "m/s", factor: 1 },
      { id: "kmh", label: "Kilometre/hour (km/h)", symbol: "km/h", factor: 1 / 3.6 },
      { id: "mph", label: "Mile/hour (mph)", symbol: "mph", factor: 0.44704 },
      { id: "fts", label: "Foot/second (ft/s)", symbol: "ft/s", factor: 0.3048 },
      { id: "kn", label: "Knot (kn)", symbol: "kn", factor: 0.514444 },
    ],
  },
  {
    id: "pressure",
    label: "Pressure",
    base: "Pa",
    linear: true,
    units: [
      { id: "Pa", label: "Pascal (Pa)", symbol: "Pa", factor: 1 },
      { id: "kPa", label: "Kilopascal (kPa)", symbol: "kPa", factor: 1000 },
      { id: "bar", label: "Bar", symbol: "bar", factor: 1e5 },
      { id: "psi", label: "Pound/inch² (psi)", symbol: "psi", factor: 6894.757293 },
      { id: "atm", label: "Atmosphere (atm)", symbol: "atm", factor: 101325 },
      { id: "mmHg", label: "Millimetre of mercury", symbol: "mmHg", factor: 133.322388 },
    ],
  },
  {
    id: "force",
    label: "Force",
    base: "N",
    linear: true,
    units: [
      { id: "MN", label: "Meganewton (MN)", symbol: "MN", factor: 1e6 },
      { id: "kN", label: "Kilonewton (kN)", symbol: "kN", factor: 1000 },
      { id: "N", label: "Newton (N)", symbol: "N", factor: 1 },
      { id: "mN", label: "Millinewton (mN)", symbol: "mN", factor: 0.001 },
      { id: "lbf", label: "Pound-force (lbf)", symbol: "lbf", factor: 4.4482216152605 },
    ],
  },
  {
    id: "power",
    label: "Power",
    base: "W",
    linear: true,
    units: [
      { id: "MW", label: "Megawatt (MW)", symbol: "MW", factor: 1e6 },
      { id: "kW", label: "Kilowatt (kW)", symbol: "kW", factor: 1000 },
      { id: "W", label: "Watt (W)", symbol: "W", factor: 1 },
      { id: "mW", label: "Milliwatt (mW)", symbol: "mW", factor: 0.001 },
      { id: "hp", label: "Mechanical horsepower (hp)", symbol: "hp", factor: 745.699872 },
    ],
  },
  {
    id: "frequency",
    label: "Frequency",
    base: "Hz",
    linear: true,
    units: [
      { id: "MHz", label: "Megahertz (MHz)", symbol: "MHz", factor: 1e6 },
      { id: "kHz", label: "Kilohertz (kHz)", symbol: "kHz", factor: 1000 },
      { id: "Hz", label: "Hertz (Hz)", symbol: "Hz", factor: 1 },
      { id: "mHz", label: "Millihertz (mHz)", symbol: "mHz", factor: 0.001 },
      { id: "rpm", label: "Revolutions/minute (rpm)", symbol: "rpm", factor: 1 / 60 },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    base: "J",
    linear: true,
    units: [
      { id: "J", label: "Joule (J)", symbol: "J", factor: 1 },
      { id: "kJ", label: "Kilojoule (kJ)", symbol: "kJ", factor: 1000 },
      { id: "cal", label: "Calorie (cal)", symbol: "cal", factor: 4.184 },
      { id: "kcal", label: "Kilocalorie (kcal)", symbol: "kcal", factor: 4184 },
      { id: "Wh", label: "Watt-hour (Wh)", symbol: "Wh", factor: 3600 },
      { id: "kWh", label: "Kilowatt-hour (kWh)", symbol: "kWh", factor: 3.6e6 },
    ],
  },
  {
    id: "angle",
    label: "Angle",
    base: "rad",
    linear: true,
    units: [
      { id: "rad", label: "Radian (rad)", symbol: "rad", factor: 1 },
      { id: "deg", label: "Degree (°)", symbol: "°", factor: Math.PI / 180 },
      { id: "grad", label: "Gradian (gon)", symbol: "gon", factor: Math.PI / 200 },
      { id: "turn", label: "Turn (rev)", symbol: "rev", factor: 2 * Math.PI },
    ],
  },
  {
    id: "data",
    label: "Digital storage",
    base: "B",
    linear: true,
    units: [
      { id: "bit", label: "Bit", symbol: "bit", factor: 0.125 },
      { id: "B", label: "Byte (B)", symbol: "B", factor: 1 },
      { id: "KB", label: "Kilobyte (KB, 1000)", symbol: "KB", factor: 1e3 },
      { id: "MB", label: "Megabyte (MB, 1000)", symbol: "MB", factor: 1e6 },
      { id: "GB", label: "Gigabyte (GB, 1000)", symbol: "GB", factor: 1e9 },
      { id: "KiB", label: "Kibibyte (KiB, 1024)", symbol: "KiB", factor: 1024 },
      { id: "MiB", label: "Mebibyte (MiB)", symbol: "MiB", factor: 1024 ** 2 },
      { id: "GiB", label: "Gibibyte (GiB)", symbol: "GiB", factor: 1024 ** 3 },
    ],
  },
];

/** The "general rule" explainer — dimensional analysis / the factor-label method. */
export const CONVERSION_RULE = `
  <div class="course">
    <h3>The one rule behind every conversion</h3>
    <p>To convert a quantity, <b>multiply by a fraction that equals 1</b> — a
    <i>conversion factor</i> — chosen so the unit you don't want <b>cancels</b>.
    This is called <b>dimensional analysis</b> (or the factor-label method).</p>

    <p class="conv-rule">value in new unit&nbsp;=&nbsp;value in old unit&nbsp;×&nbsp;<span class="conv-frac"><span>new units equal to 1 old unit</span><span>1 old unit</span></span></p>
    ${derivationButton("unit-factor-label")}

    <p>Because the top and bottom of the fraction are the <i>same real length</i>
    (just written two ways), the fraction is exactly 1 — so multiplying by it
    changes the <b>units</b> without changing the <b>amount</b>.</p>

    <div class="deriv-eg">
      <b>Worked example — 2500 millimetres into metres</b>
      <div class="deriv-work">1 mm = 0.001 m, so the factor is <code>0.001 m / 1 mm</code></div>
      <div class="deriv-work">2500 <s>mm</s> × ( 0.001 m / 1 <s>mm</s> ) = <b>2.5 m</b></div>
      <div class="deriv-work">The "mm" on top and bottom cancel, leaving metres.</div>
    </div>

    <div class="deriv-eg">
      <b>Chaining factors — 90 km/h into m/s</b>
      <div class="deriv-work">90 <s>km</s>/<s>h</s> × (1000 m / 1 <s>km</s>) × (1 <s>h</s> / 3600 s) = <b>25 m/s</b></div>
      <div class="deriv-work">Stack as many factors as you need; keep cancelling units until only the target remains.</div>
    </div>

    <p class="conv-note"><b>Temperature is the exception.</b> °C, °F and K don't share a
    zero point, so you can't just scale — you scale <i>and</i> shift, e.g.
    <code>°F = °C × 9/5 + 32</code>. The calculator below handles this for you.</p>
    ${derivationButton("unit-affine")}
  </div>`;

/** Look up a category by id. Throws on a typo rather than silently drawing the wrong units. */
export function categoryById(id: string): Category {
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown unit category: ${id}`);
  return category;
}

/** Look up a unit within a category. Throws on a typo for the same reason. */
export function unitById(categoryId: string, unitId: string): Unit {
  const unit = categoryById(categoryId).units.find((u) => u.id === unitId);
  if (!unit) throw new Error(`Unknown unit ${unitId} in category ${categoryId}`);
  return unit;
}

/**
 * One entry in the quick-reference table of common conversion factors.
 *
 * Only the *identity* of the pair is stored here — never the number. The factor itself is
 * computed from `CATEGORIES` when the table is built, so the reference sheet and the
 * calculator can never disagree: fix a factor in one place and both update.
 */
export interface FactorPair {
  categoryId: string;
  fromUnitId: string;
  toUnitId: string;
  /**
   * True when the relationship is exact *by definition* (an inch is defined as 25.4 mm),
   * false when the printed digits are a rounded measurement or a rounded definition.
   * Knowing which is which is the difference between "0.45359237 kg is a fact" and
   * "745.7 W is a convention with more digits available".
   */
  exact: boolean;
  /** A memory hook — the everyday anchor that makes the number stick. */
  hint?: string;
}

/** A built, display-ready row of the reference table. */
export interface FactorRow {
  categoryId: string;
  categoryLabel: string;
  fromUnitId: string;
  toUnitId: string;
  /** e.g. "1 mi" */
  from: string;
  /** e.g. "1.60934 km" */
  to: string;
  /** The reverse reading, e.g. "1 km = 0.621371 mi". */
  reverse: string;
  exact: boolean;
  hint?: string;
  /** Lowercase haystack for the search box: symbols, labels and category. */
  search: string;
}

/**
 * The conversions worth knowing by heart.
 *
 * Curated rather than generated: every unit pair in the calculator would be thousands of
 * rows of noise. These are the ones that actually come up — the ones a fluent person
 * recalls instantly and everyone else looks up every single time.
 */
export const COMMON_FACTORS: readonly FactorPair[] = [
  // Length
  { categoryId: "length", fromUnitId: "mi", toUnitId: "km", exact: true, hint: "5 miles ≈ 8 km. Multiply miles by 8/5 to get kilometres." },
  { categoryId: "length", fromUnitId: "m", toUnitId: "ft", exact: false, hint: "A metre is a long stride — a bit over three feet." },
  { categoryId: "length", fromUnitId: "in", toUnitId: "cm", exact: true, hint: "Exactly 2.54 — the inch is <i>defined</i> from the centimetre." },
  { categoryId: "length", fromUnitId: "ft", toUnitId: "m", exact: true, hint: "Roughly 0.3, so 10 ft ≈ 3 m." },
  { categoryId: "length", fromUnitId: "yd", toUnitId: "m", exact: true, hint: "A yard is a metre minus a hand's width." },
  { categoryId: "length", fromUnitId: "nmi", toUnitId: "km", exact: true, hint: "The sea and air mile: one minute of latitude." },
  { categoryId: "length", fromUnitId: "km", toUnitId: "m", exact: true, hint: "The whole SI system in one row: kilo means 1000." },

  // Mass
  { categoryId: "mass", fromUnitId: "kg", toUnitId: "lb", exact: false, hint: "A kilo is 2.2 lb. Double it and add 10%." },
  { categoryId: "mass", fromUnitId: "lb", toUnitId: "kg", exact: true, hint: "Just under half a kilo." },
  { categoryId: "mass", fromUnitId: "st", toUnitId: "kg", exact: true, hint: "14 lb to the stone, so ≈ 6.35 kg." },
  { categoryId: "mass", fromUnitId: "oz", toUnitId: "g", exact: false, hint: "16 oz to the pound, so ≈ 28 g each." },
  { categoryId: "mass", fromUnitId: "t", toUnitId: "kg", exact: true, hint: "A tonne is a cubic metre of water." },

  // Volume
  { categoryId: "volume", fromUnitId: "galUK", toUnitId: "L", exact: true, hint: "The UK gallon is ~20% bigger than the US one." },
  { categoryId: "volume", fromUnitId: "galUS", toUnitId: "L", exact: true, hint: "Check which gallon you mean before you quote a price." },
  { categoryId: "volume", fromUnitId: "ptUK", toUnitId: "mL", exact: true, hint: "A pint is a bit over half a litre." },
  { categoryId: "volume", fromUnitId: "m3", toUnitId: "L", exact: true, hint: "1 m³ = 1000 L, and 1 L = 1000 cm³." },

  // Speed
  { categoryId: "speed", fromUnitId: "mps", toUnitId: "kmh", exact: true, hint: "×3.6 to go up, ÷3.6 to come back. The single most useful speed fact." },
  { categoryId: "speed", fromUnitId: "mph", toUnitId: "kmh", exact: true, hint: "Same 8/5 as miles to kilometres — speed is just distance per time." },
  { categoryId: "speed", fromUnitId: "kn", toUnitId: "kmh", exact: true, hint: "A knot is one nautical mile per hour." },
  { categoryId: "speed", fromUnitId: "mph", toUnitId: "mps", exact: true, hint: "Handy for physics: 60 mph ≈ 27 m/s." },

  // Time
  { categoryId: "time", fromUnitId: "hr", toUnitId: "s", exact: true, hint: "60 × 60. This is the factor hiding inside every km/h ↔ m/s conversion." },
  { categoryId: "time", fromUnitId: "day", toUnitId: "s", exact: true, hint: "86 400 — worth memorising for rates and throughput." },
  { categoryId: "time", fromUnitId: "yr", toUnitId: "day", exact: true, hint: "365.25 days averages in the leap year." },

  // Area
  { categoryId: "area", fromUnitId: "ha", toUnitId: "m2", exact: true, hint: "A hectare is 100 m × 100 m." },
  { categoryId: "area", fromUnitId: "acre", toUnitId: "m2", exact: true, hint: "About 0.4 ha — roughly a football pitch." },
  { categoryId: "area", fromUnitId: "km2", toUnitId: "ha", exact: true, hint: "Areas scale by the *square*: ×1000 length is ×1 000 000 area." },
  { categoryId: "area", fromUnitId: "m2", toUnitId: "cm2", exact: true, hint: "×100 length ⇒ ×10 000 area. Not ×100." },

  // Pressure
  { categoryId: "pressure", fromUnitId: "atm", toUnitId: "kPa", exact: true, hint: "Sea-level air pressure, ≈ 101 kPa." },
  { categoryId: "pressure", fromUnitId: "bar", toUnitId: "kPa", exact: true, hint: "1 bar = 100 kPa, near enough 1 atmosphere." },
  { categoryId: "pressure", fromUnitId: "psi", toUnitId: "kPa", exact: false, hint: "Car tyres: 32 psi ≈ 2.2 bar." },

  // Energy & power
  { categoryId: "energy", fromUnitId: "kcal", toUnitId: "J", exact: true, hint: "A food 'Calorie' is a kilocalorie: 4184 J." },
  { categoryId: "energy", fromUnitId: "kWh", toUnitId: "J", exact: true, hint: "A unit of electricity = 3.6 million joules." },
  { categoryId: "power", fromUnitId: "hp", toUnitId: "W", exact: false, hint: "Mechanical horsepower ≈ ¾ kW." },
  { categoryId: "power", fromUnitId: "kW", toUnitId: "hp", exact: false, hint: "A 100 kW car is about 134 hp." },

  // Force
  { categoryId: "force", fromUnitId: "lbf", toUnitId: "N", exact: true, hint: "≈ 4.45 N. A newton is about the weight of an apple." },

  // Angle
  { categoryId: "angle", fromUnitId: "turn", toUnitId: "rad", exact: false, hint: "A full turn is 2π radians." },
  { categoryId: "angle", fromUnitId: "rad", toUnitId: "deg", exact: false, hint: "1 rad ≈ 57.3°. Radians are the calculus-friendly unit." },
  { categoryId: "angle", fromUnitId: "deg", toUnitId: "rad", exact: false, hint: "× π/180. Always check your calculator's mode." },

  // Digital storage
  { categoryId: "data", fromUnitId: "B", toUnitId: "bit", exact: true, hint: "8 bits to the byte." },
  { categoryId: "data", fromUnitId: "KiB", toUnitId: "B", exact: true, hint: "1024, not 1000 — the binary kilo." },
  { categoryId: "data", fromUnitId: "GiB", toUnitId: "GB", exact: false, hint: "Why a '1 TB' drive shows up smaller than you expected." },
];

/**
 * Build the reference rows, computing every factor from `CATEGORIES`.
 *
 * Throws if a curated pair names a unit that doesn't exist, so a typo fails loudly at
 * startup instead of quietly dropping a row from the reference sheet.
 */
export function buildFactorTable(pairs: readonly FactorPair[] = COMMON_FACTORS): FactorRow[] {
  return pairs.map((pair) => {
    const category = categoryById(pair.categoryId);
    const from = unitById(pair.categoryId, pair.fromUnitId);
    const to = unitById(pair.categoryId, pair.toUnitId);
    const forward = convert(from, to, 1);
    const backward = convert(to, from, 1);
    return {
      categoryId: category.id,
      categoryLabel: category.label,
      fromUnitId: from.id,
      toUnitId: to.id,
      from: `1 ${from.symbol}`,
      to: `${fmt(forward)} ${to.symbol}`,
      reverse: `1 ${to.symbol} = ${fmt(backward)} ${from.symbol}`,
      exact: pair.exact,
      hint: pair.hint,
      search: [
        from.symbol,
        to.symbol,
        from.label,
        to.label,
        category.label,
        pair.hint ?? "",
      ]
        .join(" ")
        .toLowerCase(),
    };
  });
}

/** Filter the reference table by a free-text query. An empty query keeps every row. */
export function searchFactors(rows: readonly FactorRow[], query: string): FactorRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...rows];
  const terms = needle.split(/\s+/);
  return rows.filter((row) => terms.every((term) => row.search.includes(term)));
}

export interface JourneyPreset {
  label: string;
  distance: number;
  distanceUnitId: string;
  speed: number;
  speedUnitId: string;
  /** Why this journey is worth trying — shown when the preset is loaded. */
  note: string;
}

/**
 * Everyday journeys spanning several orders of magnitude, so the learner sees that one
 * formula covers a walk to the shops and a flight across the Atlantic.
 */
export const JOURNEY_PRESETS: readonly JourneyPreset[] = [
  {
    label: "10 mi at 30 mph",
    distance: 10,
    distanceUnitId: "mi",
    speed: 30,
    speedUnitId: "mph",
    note: "A typical town drive. The units already match (miles and miles per hour), so the answer is simply 10 ÷ 30 hours.",
  },
  {
    label: "5 km run at 12 km/h",
    distance: 5,
    distanceUnitId: "km",
    speed: 12,
    speedUnitId: "kmh",
    note: "A steady 5k. Matching units again: 5 ÷ 12 of an hour.",
  },
  {
    label: "400 m sprint at 8 m/s",
    distance: 400,
    distanceUnitId: "m",
    speed: 8,
    speedUnitId: "mps",
    note: "Base units throughout, so the division needs no conversion at all: 400 ÷ 8 = 50 s.",
  },
  {
    label: "26.2 mi marathon at 10 km/h",
    distance: 26.2,
    distanceUnitId: "mi",
    speed: 10,
    speedUnitId: "kmh",
    note: "Mixed units — miles against kilometres per hour. This is where converting to base units first saves you.",
  },
  {
    label: "3500 nmi flight at 480 kn",
    distance: 3500,
    distanceUnitId: "nmi",
    speed: 480,
    speedUnitId: "kn",
    note: "Nautical miles and knots are built for each other: a knot is one nautical mile per hour.",
  },
];
