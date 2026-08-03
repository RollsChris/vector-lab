export interface CutListPart {
  name: string;
  length: number;
  quantity: number;
}

export interface CutListError {
  line?: number;
  message: string;
}

export interface PlannedPiece {
  name: string;
  length: number;
  start: number;
  end: number;
}

export interface PlannedBoard {
  pieces: PlannedPiece[];
  trimLoss: number;
  kerfLoss: number;
  offcut: number;
}

export interface CutListPlan {
  boards: PlannedBoard[];
  errors: CutListError[];
  totalPieces: number;
  totalPartLength: number;
  totalKerfLoss: number;
  totalTrimLoss: number;
  totalOffcut: number;
  yield: number;
}

const MAX_PIECES = 500;
const MICRONS_PER_MM = 1000;

/** Parse `name, length mm, quantity` rows. Quantity is optional and defaults to one. */
export function parseCutList(raw: string): { parts: CutListPart[]; errors: CutListError[] } {
  const parts: CutListPart[] = [];
  const errors: CutListError[] = [];

  raw.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    const lineNumber = index + 1;
    if (!line || line.startsWith("#")) return;
    const fields = line.split(",").map((field) => field.trim());
    if (fields.length < 2) {
      errors.push({ line: lineNumber, message: "Use name, length mm, quantity." });
      return;
    }

    const hasQuantity = fields.length >= 3;
    const quantityText = hasQuantity ? fields.at(-1)! : "1";
    const lengthText = fields.at(hasQuantity ? -2 : -1)!;
    const name = fields.slice(0, hasQuantity ? -2 : -1).join(", ").trim();
    const length = parseMm(lengthText);
    const quantity = parseQuantity(quantityText);
    if (!name) {
      errors.push({ line: lineNumber, message: "Give this part a name." });
    } else if (length === undefined) {
      errors.push({ line: lineNumber, message: "Length must be a positive number in mm." });
    } else if (quantity === undefined) {
      errors.push({ line: lineNumber, message: "Quantity must be a positive whole number." });
    } else {
      parts.push({ name, length, quantity });
    }
  });

  return { parts, errors };
}

/**
 * Packs a cut list using first-fit decreasing. It is deterministic and quick, but it is
 * intentionally not a grain-, defect-, or offcut-aware optimiser.
 */
export function planCutList(
  stockLength: number,
  endTrim: number,
  kerf: number,
  parts: readonly CutListPart[],
): CutListPlan {
  const errors: CutListError[] = [];
  if (!isNonNegativeFinite(stockLength) || stockLength <= 0) {
    return emptyPlan([{ message: "Stock length must be greater than zero." }]);
  }
  if (!isNonNegativeFinite(endTrim) || !isNonNegativeFinite(kerf)) {
    return emptyPlan([{ message: "Trim and kerf must be zero or greater." }]);
  }

  const stock = toMicrons(stockLength);
  const trim = toMicrons(endTrim);
  const kerfMicrons = toMicrons(kerf);
  const usable = stock - trim * 2;
  if (usable <= 0) return emptyPlan([{ message: "End trim leaves no usable board length." }]);

  const expanded: Array<{ name: string; length: number; order: number }> = [];
  for (const [order, part] of parts.entries()) {
    if (!isNonNegativeFinite(part.length) || part.length <= 0 || !Number.isInteger(part.quantity) || part.quantity <= 0) {
      errors.push({ message: `Invalid part "${part.name}".` });
      continue;
    }
    const length = toMicrons(part.length);
    if (length > usable) {
      errors.push({ message: `${part.name} (${formatMm(length)} mm) exceeds usable board length.` });
      continue;
    }
    if (expanded.length + part.quantity > MAX_PIECES) {
      errors.push({ message: `Cut list exceeds the ${MAX_PIECES}-piece planning limit.` });
      break;
    }
    for (let count = 0; count < part.quantity; count++) expanded.push({ name: part.name, length, order });
  }

  expanded.sort((a, b) => b.length - a.length || a.order - b.order);
  const boards: Array<{ pieces: Array<{ name: string; length: number }>; used: number }> = [];
  for (const part of expanded) {
    const board = boards.find((candidate) => candidate.used + (candidate.pieces.length ? kerfMicrons : 0) + part.length <= usable);
    if (board) {
      board.used += (board.pieces.length ? kerfMicrons : 0) + part.length;
      board.pieces.push(part);
    } else {
      boards.push({ pieces: [part], used: part.length });
    }
  }

  const plannedBoards = boards.map((board): PlannedBoard => {
    let cursor = 0;
    const pieces = board.pieces.map((piece, index) => {
      if (index > 0) cursor += kerfMicrons;
      const start = cursor;
      cursor += piece.length;
      return { name: piece.name, length: fromMicrons(piece.length), start: fromMicrons(start), end: fromMicrons(cursor) };
    });
    const kerfLoss = kerfMicrons * Math.max(0, pieces.length - 1);
    return {
      pieces,
      trimLoss: fromMicrons(trim * 2),
      kerfLoss: fromMicrons(kerfLoss),
      offcut: fromMicrons(stock - trim * 2 - board.pieces.reduce((sum, piece) => sum + piece.length, 0) - kerfLoss),
    };
  });

  const totalPartLength = plannedBoards.flatMap((board) => board.pieces).reduce((sum, piece) => sum + piece.length, 0);
  const totalKerfLoss = plannedBoards.reduce((sum, board) => sum + board.kerfLoss, 0);
  const totalTrimLoss = plannedBoards.reduce((sum, board) => sum + board.trimLoss, 0);
  const totalOffcut = plannedBoards.reduce((sum, board) => sum + board.offcut, 0);
  return {
    boards: plannedBoards,
    errors,
    totalPieces: expanded.length,
    totalPartLength,
    totalKerfLoss,
    totalTrimLoss,
    totalOffcut,
    yield: plannedBoards.length ? (totalPartLength / (plannedBoards.length * stockLength)) * 100 : 0,
  };
}

function emptyPlan(errors: CutListError[]): CutListPlan {
  return {
    boards: [],
    errors,
    totalPieces: 0,
    totalPartLength: 0,
    totalKerfLoss: 0,
    totalTrimLoss: 0,
    totalOffcut: 0,
    yield: 0,
  };
}

function parseMm(value: string): number | undefined {
  const match = /^(\d+(?:\.\d+)?)\s*(?:mm)?$/i.exec(value.trim());
  const parsed = match ? Number(match[1]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseQuantity(value: string): number | undefined {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function toMicrons(mm: number): number {
  return Math.round(mm * MICRONS_PER_MM);
}

function fromMicrons(microns: number): number {
  return microns / MICRONS_PER_MM;
}

function formatMm(microns: number): string {
  return (microns / MICRONS_PER_MM).toFixed(3).replace(/\.?0+$/, "");
}
