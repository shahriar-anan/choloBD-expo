import { TransportTrip } from '../types/transports';

export type BusServiceClassFilter = 'ALL' | 'AC' | 'NON_AC';

export function tripHasAcService(busServiceTypes: string[] | undefined): boolean {
  return (busServiceTypes ?? []).some((value) => value.startsWith('AC_'));
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
    return trips.filter((trip) => tripHasAcService(trip.busServiceTypes));
  }
  return trips.filter((trip) => tripHasNonAcService(trip.busServiceTypes));
}

export function countTripsByServiceClass(trips: TransportTrip[]): Record<BusServiceClassFilter, number> {
  return {
    ALL: trips.length,
    AC: trips.filter((trip) => tripHasAcService(trip.busServiceTypes)).length,
    NON_AC: trips.filter((trip) => tripHasNonAcService(trip.busServiceTypes)).length,
  };
}

export function tripIsSoldOut(trip: TransportTrip): boolean {
  if (typeof trip.availableSeatCount === 'number') {
    return trip.availableSeatCount <= 0;
  }
  return false;
}
