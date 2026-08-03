export interface MiterSawInput {
  width: number;
  thickness: number;
  miterDegrees: number;
  bevelDegrees: number;
}

export interface MiterSawCut {
  miterMagnitudeDegrees: number;
  bevelMagnitudeDegrees: number;
  cutLineAcuteAngleDegrees: number;
  topFaceCutLength: number;
  endOffset: number;
  flatFrameCornerDegrees: number;
  cutFaceSideLength: number;
  cutFaceIncludedAngleDegrees: number;
  cutFaceArea: number;
}

export interface RegularPolygonFrame {
  sides: number;
  miterDegrees: number;
  interiorAngleDegrees: number;
  cuts: number;
  outerLength: number;
  innerLength: number;
  endCutLength: number;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Calculates the geometry of a mitre-saw blade plane through rectangular stock.
 *
 * The miter setting is measured from a square crosscut; the bevel tilts the blade
 * away from vertical. Signed settings preserve the cut-face handedness, while
 * lengths use their magnitudes.
 */
export function miterSawCut(input: MiterSawInput): MiterSawCut {
  assertPositiveFinite("width", input.width);
  assertPositiveFinite("thickness", input.thickness);
  assertFinite("miterDegrees", input.miterDegrees);
  assertFinite("bevelDegrees", input.bevelDegrees);
  if (Math.abs(input.miterDegrees) >= 90) {
    throw new RangeError("miterDegrees must stay between -90° and 90°");
  }
  if (Math.abs(input.bevelDegrees) >= 90) {
    throw new RangeError("bevelDegrees must stay between -90° and 90°");
  }

  const miter = input.miterDegrees * DEG2RAD;
  const bevel = input.bevelDegrees * DEG2RAD;
  const miterMagnitudeDegrees = Math.abs(input.miterDegrees);
  const bevelMagnitudeDegrees = Math.abs(input.bevelDegrees);
  const cosMiter = Math.cos(miter);
  const cosBevel = Math.cos(bevel);
  const faceSideFactor = Math.sqrt(1 + (Math.tan(bevel) / cosMiter) ** 2);
  const faceAngleCosine =
    (Math.tan(miter) * Math.tan(bevel)) / faceSideFactor;

  return {
    miterMagnitudeDegrees,
    bevelMagnitudeDegrees,
    cutLineAcuteAngleDegrees: 90 - miterMagnitudeDegrees,
    topFaceCutLength: input.width / cosMiter,
    endOffset: input.width * Math.tan(miterMagnitudeDegrees * DEG2RAD),
    flatFrameCornerDegrees: 180 - 2 * miterMagnitudeDegrees,
    cutFaceSideLength: input.thickness * faceSideFactor,
    cutFaceIncludedAngleDegrees: Math.acos(clamp(faceAngleCosine, -1, 1)) * RAD2DEG,
    cutFaceArea: (input.width * input.thickness) / (cosMiter * cosBevel),
  };
}

/** Geometry for a flat regular-polygon frame built from matching mitred segments. */
export function regularPolygonFrame(
  sides: number,
  outerLength: number,
  radialWidth: number,
): RegularPolygonFrame {
  if (!Number.isInteger(sides) || sides < 3) {
    throw new RangeError("sides must be an integer of at least 3");
  }
  assertPositiveFinite("outerLength", outerLength);
  assertPositiveFinite("radialWidth", radialWidth);

  const halfExterior = Math.PI / sides;
  const innerLength = outerLength - 2 * radialWidth * Math.tan(halfExterior);
  if (innerLength <= 0) {
    throw new RangeError("radialWidth is too large for this polygon");
  }

  const miterDegrees = 180 / sides;
  return {
    sides,
    miterDegrees,
    interiorAngleDegrees: 180 - 360 / sides,
    cuts: sides * 2,
    outerLength,
    innerLength,
    endCutLength: miterSawCut({
      width: radialWidth,
      thickness: 1,
      miterDegrees,
      bevelDegrees: 0,
    }).topFaceCutLength,
  };
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}

function assertPositiveFinite(name: string, value: number): void {
  assertFinite(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
