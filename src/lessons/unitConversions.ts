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
