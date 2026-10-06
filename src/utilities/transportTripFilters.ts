import { TransportTrip } from '../types/transports';

export type BusServiceClassFilter = 'ALL' | 'AC' | 'NON_AC';

const AC_SERVICE_TYPES = new Set(['AC_SEATER', 'AC_SLEEPER', 'DELUXE', 'SEMI_DELUXE', 'LUXURY']);

/** Live list payloads sometimes omit busServiceTypes; layout name still says AC vs Non-AC. */
export function effectiveBusServiceTypes(trip: TransportTrip): string[] {
  if (trip.busServiceTypes && trip.busServiceTypes.length > 0) return trip.busServiceTypes;
  const haystack = `${trip.layout?.name ?? ''} ${trip.coachLabel ?? ''}`;
  if (/non[-\s]?ac/i.test(haystack)) return ['NON_AC_SEATER'];
  if (/\bac\b/i.test(haystack)) return ['AC_SEATER'];
  return [];
}

export function tripHasAcService(busServiceTypes: string[] | undefined): boolean {
  return (busServiceTypes ?? []).some(
    (value) => value.startsWith('AC_') || AC_SERVICE_TYPES.has(value)
  );
}

export function tripHasNonAcService(busServiceTypes: string[] | undefined): boolean {
  return (busServiceTypes ?? []).some(
    (value) => value === 'NON_AC_SEATER' || value === 'NON_AC_SLEEPER'
  );
}

export function filterTripsByServiceClass(
  trips: TransportTrip[],
  filter: BusServiceClassFilter
): TransportTrip[] {
  if (filter === 'ALL') return trips;
  if (filter === 'AC') {
    return trips.filter((trip) => tripHasAcService(effectiveBusServiceTypes(trip)));
  }
  return trips.filter((trip) => tripHasNonAcService(effectiveBusServiceTypes(trip)));
}

export function countTripsByServiceClass(trips: TransportTrip[]): Record<BusServiceClassFilter, number> {
  return {
    ALL: trips.length,
    AC: trips.filter((trip) => tripHasAcService(effectiveBusServiceTypes(trip))).length,
    NON_AC: trips.filter((trip) => tripHasNonAcService(effectiveBusServiceTypes(trip))).length,
  };
}

export function tripIsSoldOut(trip: TransportTrip): boolean {
  if (typeof trip.availableSeatCount === 'number') {
    return trip.availableSeatCount <= 0;
  }
  return false;
}
