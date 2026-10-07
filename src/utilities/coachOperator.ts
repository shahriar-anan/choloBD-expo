import {
  CreateTransportLayoutSeatPayload,
  TransportClassRef,
  TransportLayoutRef,
  TransportSeat,
} from '../types/transports';

export const COACH_BUS_TYPES = ['AC_SEATER', 'NON_AC_SEATER', 'AC_SLEEPER', 'NON_AC_SLEEPER'] as const;
export type CoachBusType = (typeof COACH_BUS_TYPES)[number];
const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

export function isAcCoachType(type: string): boolean {
  return type.startsWith('AC_');
}

export function planCoachSeats(type: CoachBusType, transportClassId: string): CreateTransportLayoutSeatPayload[] {
  const labelsPerRow = isAcCoachType(type) ? 3 : 4;
  return ROW_LETTERS.flatMap((letter) =>
    Array.from({ length: labelsPerRow }, (_, index) => ({
      seatLabel: `${letter}${index + 1}`,
      transportClassId,
      rowLabel: letter,
      columnLabel: String(index + 1),
    }))
  );
}

export function previewCoachSeats(type: CoachBusType): TransportSeat[] {
  return planCoachSeats(type, 'preview').map((seat) => ({
    id: seat.seatLabel,
    compartmentId: 'preview',
    transportClassId: 'preview',
    seatLabel: seat.seatLabel,
    rowLabel: seat.rowLabel,
    columnLabel: seat.columnLabel,
    isActive: true,
    isAvailable: true,
    transportClass: {
      id: 'preview',
      name: type,
      basePrice: 0,
      busServiceType: type,
    },
  }));
}

export function layoutSeatCount(layout: TransportLayoutRef): number {
  return (layout.compartments ?? []).reduce((sum, compartment) => sum + (compartment.seats?.length ?? 0), 0);
}

export function layoutToTransportSeats(layout: TransportLayoutRef): TransportSeat[] {
  return (layout.compartments ?? []).flatMap((compartment) =>
    (compartment.seats ?? []).map((seat) => ({
      id: seat.id,
      compartmentId: compartment.id,
      transportClassId: seat.transportClassId ?? '',
      seatLabel: seat.seatLabel,
      rowLabel: seat.rowLabel,
      columnLabel: seat.columnLabel,
      isActive: seat.isActive !== false,
      isAvailable: true,
      compartmentName: compartment.name,
      transportClass: seat.transportClass,
    }))
  );
}

export function layoutCoachClass(layout: TransportLayoutRef): TransportClassRef | null {
  for (const compartment of layout.compartments ?? []) {
    for (const seat of compartment.seats ?? []) {
      if (seat.transportClass) return seat.transportClass;
    }
  }
  return null;
}

export function coachTypeLabelKey(type: string | null | undefined): string | null {
  if (!type) return null;
  if (type === 'AC_SEATER') return 'transportOperator.acSeater';
  if (type === 'NON_AC_SEATER') return 'transportOperator.nonAcSeater';
  if (type === 'AC_SLEEPER') return 'transportOperator.acSleeper';
  if (type === 'NON_AC_SLEEPER') return 'transportOperator.nonAcSleeper';
  return null;
}

export function routeLabelFromRef(route: {
  id: string;
  name?: string | null;
  originLocation?: { name?: string } | null;
  destinationLocation?: { name?: string } | null;
}): string {
  const from = route.originLocation?.name;
  const to = route.destinationLocation?.name;
  if (from && to) return `${from} → ${to}`;
  return route.name || route.id.slice(0, 8);
}

export function tomorrowAt(hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date;
}
