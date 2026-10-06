import { TransportSeat } from '../types/transports';

export type CabinVariant = 'ac' | 'nonAc';

export interface LaidOutSeat extends TransportSeat {
  displayLabel: string;
}

export interface SeatRowLayout {
  rowKey: string;
  variant: CabinVariant;
  left: LaidOutSeat[];
  right: LaidOutSeat[];
}

const AC_SERVICE_TYPES = new Set([
  'AC_SEATER',
  'AC_SLEEPER',
  'DELUXE',
  'SEMI_DELUXE',
  'LUXURY',
]);

function seatPosition(seat: TransportSeat): { row: string; column: string } {
  if (seat.rowLabel && seat.columnLabel) {
    return { row: seat.rowLabel, column: seat.columnLabel };
  }
  const label = seat.seatLabel.trim();
  const letterThenNumber = label.match(/^([A-Za-z]+)\s*(\d+)$/);
  if (letterThenNumber) {
    return { column: letterThenNumber[1].toUpperCase(), row: letterThenNumber[2] };
  }
  const numberThenLetter = label.match(/^(\d+)\s*([A-Za-z]+)$/);
  if (numberThenLetter) {
    return { row: numberThenLetter[1], column: numberThenLetter[2].toUpperCase() };
  }
  return { row: '1', column: label };
}

function compareRows(a: string, b: string): number {
  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
  return a.localeCompare(b);
}

function rowLetter(index: number): string {
  let n = index;
  let label = '';
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function cabinVariantForSeat(seat: TransportSeat): CabinVariant {
  const type = seat.transportClass?.busServiceType ?? '';
  if (AC_SERVICE_TYPES.has(type) || type.startsWith('AC_')) return 'ac';
  return 'nonAc';
}

function sortSeats(seats: TransportSeat[]): TransportSeat[] {
  return [...seats].sort((a, b) => {
    const left = seatPosition(a);
    const right = seatPosition(b);
    const rowDiff = compareRows(left.row, right.row);
    if (rowDiff !== 0) return rowDiff;
    return left.column.localeCompare(right.column);
  });
}

function variantFromColumns(columns: string[]): CabinVariant {
  const max = columns.reduce((highest, column) => {
    const value = Number(column);
    return Number.isNaN(value) ? highest : Math.max(highest, value);
  }, 0);
  return max <= 3 ? 'ac' : 'nonAc';
}

/** Group by stored row/column so AC stays 2+1 and Non-AC stays 2+2 even if class type is missing. */
function layoutFromRowLabels(seats: TransportSeat[]): SeatRowLayout[] | null {
  const positioned = seats.filter((seat) => seat.rowLabel && seat.columnLabel);
  if (positioned.length !== seats.length || positioned.length === 0) return null;

  const byRow = new Map<string, TransportSeat[]>();
  for (const seat of positioned) {
    const row = seat.rowLabel as string;
    const bucket = byRow.get(row) ?? [];
    bucket.push(seat);
    byRow.set(row, bucket);
  }

  const rowKeys = [...byRow.keys()].sort((a, b) => a.localeCompare(b));
  return rowKeys.map((rowKey) => {
    const ordered = [...(byRow.get(rowKey) ?? [])].sort(
      (a, b) => Number(a.columnLabel) - Number(b.columnLabel)
    );
    const variant = variantFromColumns(ordered.map((seat) => seat.columnLabel as string));
    const leftCount = variant === 'ac' ? 1 : 2;
    const laidOut: LaidOutSeat[] = ordered.map((seat) => ({
      ...seat,
      displayLabel: seat.seatLabel,
    }));
    return {
      rowKey,
      variant,
      left: laidOut.slice(0, leftCount),
      right: laidOut.slice(leftCount),
    };
  });
}

function chunkLayout(seats: TransportSeat[], variant: CabinVariant, keyPrefix: string): SeatRowLayout[] {
  const perRow = variant === 'ac' ? 3 : 4;
  const leftCount = variant === 'ac' ? 1 : 2;
  const ordered = sortSeats(seats);
  const rows: SeatRowLayout[] = [];

  for (let offset = 0; offset < ordered.length; offset += perRow) {
    const letter = rowLetter(rows.length);
    const chunk: LaidOutSeat[] = ordered.slice(offset, offset + perRow).map((seat, index) => ({
      ...seat,
      displayLabel: `${letter}${index + 1}`,
    }));
    rows.push({
      rowKey: `${keyPrefix}${letter}`,
      variant,
      left: chunk.slice(0, leftCount),
      right: chunk.slice(leftCount),
    });
  }

  return rows;
}

export function layoutDeck(seats: TransportSeat[]): SeatRowLayout[] {
  const fromLabels = layoutFromRowLabels(seats);
  if (fromLabels) return fromLabels;

  const ac = seats.filter((seat) => cabinVariantForSeat(seat) === 'ac');
  const nonAc = seats.filter((seat) => cabinVariantForSeat(seat) === 'nonAc');
  if (ac.length > 0 && nonAc.length > 0) {
    return [...chunkLayout(nonAc, 'nonAc', 'non-'), ...chunkLayout(ac, 'ac', 'ac-')];
  }
  if (ac.length > 0) return chunkLayout(seats, 'ac', 'ac-');
  return chunkLayout(seats, 'nonAc', 'non-');
}

export function displayLabelMap(groups: TransportSeat[][]): Map<string, string> {
  const labels = new Map<string, string>();
  groups.forEach((seats) => {
    layoutDeck(seats).forEach((row) => {
      [...row.left, ...row.right].forEach((seat) => {
        labels.set(seat.id, seat.displayLabel);
      });
    });
  });
  return labels;
}
