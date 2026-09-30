import { getApiInstance } from './axiosClient';
import { unwrapList } from './personalPlanMapping';
import {
  cannotBookOnPlatformMessage,
  isOnPlatformTransportType,
  PaginatedTransports,
  TransportListFilters,
  TransportOperator,
  TransportSearchParams,
  TransportSeatHoldResult,
  TransportTrip,
  TransportTripFilters,
  TransportTripSeatMap,
  TransportVehicle,
  TransportVehicleFilters,
} from '../../types/transports';

function apiMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

function unwrapPaginatedTransports(data: unknown): PaginatedTransports {
  if (data && typeof data === 'object' && Array.isArray((data as PaginatedTransports).results)) {
    const page = data as PaginatedTransports;
    return {
      results: page.results,
      total: page.total ?? page.results.length,
      page: page.page ?? 1,
      limit: page.limit ?? page.results.length,
    };
  }
  const results = unwrapList<TransportOperator>(data);
  return { results, total: results.length, page: 1, limit: results.length };
}

export async function getTransports(
  filters: TransportListFilters = {}
): Promise<PaginatedTransports> {
  try {
    const api = getApiInstance();
    const params: Record<string, string | number> = {};
    if (filters.locationId) params.locationId = filters.locationId;
    if (filters.divisionId) params.divisionId = filters.divisionId;
    if (filters.transportType) params.transportType = filters.transportType;
    if (filters.name) params.name = filters.name;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    const res = await api.get('/api/transports', { params });
    return unwrapPaginatedTransports(res.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load transports'));
  }
}

export async function searchTransports(
  params: TransportSearchParams
): Promise<PaginatedTransports> {
  try {
    const api = getApiInstance();
    const query: Record<string, string | number> = { q: params.q };
    if (params.locationId) query.locationId = params.locationId;
    if (params.transportType) query.transportType = params.transportType;
    if (params.page) query.page = params.page;
    if (params.limit) query.limit = params.limit;
    const res = await api.get('/api/transports/search', { params: query });
    return unwrapPaginatedTransports(res.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to search transports'));
  }
}

export async function getTransportsByLocation(
  locationId: string
): Promise<TransportOperator[]> {
  try {
    const api = getApiInstance();
    const res = await api.get(`/api/transports/location/${locationId}`);
    return unwrapList<TransportOperator>(res.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load transports for this location'));
  }
}

export async function getTransportById(transportId: string): Promise<TransportOperator> {
  try {
    const api = getApiInstance();
    const res = await api.get(`/api/transports/${transportId}`);
    const transport = res.data?.data as TransportOperator | undefined;
    if (!transport?.id) {
      throw new Error('Transport not found');
    }
    return transport;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load transport'));
  }
}

export async function getTransportTrips(
  filters: TransportTripFilters = {}
): Promise<TransportTrip[]> {
  try {
    const api = getApiInstance();
    const params: Record<string, string> = {};
    if (filters.transportId) params.transportId = filters.transportId;
    if (filters.originLocationId) params.originLocationId = filters.originLocationId;
    if (filters.destinationLocationId) params.destinationLocationId = filters.destinationLocationId;
    if (filters.departureDate) params.departureDate = filters.departureDate;
    const res = await api.get('/api/transport-inventory/trips', { params });
    return unwrapList<TransportTrip>(res.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load trips'));
  }
}

export async function getTransportTripById(tripId: string): Promise<TransportTrip> {
  try {
    const api = getApiInstance();
    const res = await api.get(`/api/transport-inventory/trips/${tripId}`);
    const trip = res.data?.data as TransportTrip | undefined;
    if (!trip?.id) {
      throw new Error('Transport trip not found');
    }
    return trip;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load trip'));
  }
}

export async function createTransportSeatHolds(
  tripId: string,
  seatIds: string[]
): Promise<TransportSeatHoldResult> {
  try {
    const api = getApiInstance();
    const res = await api.post(`/api/transport-inventory/trips/${tripId}/seat-holds`, { seatIds });
    const data = res.data?.data as TransportSeatHoldResult | undefined;
    if (!data?.expiresAt) {
      throw new Error('Failed to hold seats');
    }
    return {
      tripId: data.tripId ?? tripId,
      seatIds: data.seatIds ?? seatIds,
      expiresAt: data.expiresAt,
    };
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to hold seats'));
  }
}

export async function releaseTransportSeatHolds(tripId: string): Promise<void> {
  try {
    const api = getApiInstance();
    await api.delete(`/api/transport-inventory/trips/${tripId}/seat-holds`);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to release seat holds'));
  }
}

export async function getTransportTripSeats(tripId: string): Promise<TransportTripSeatMap> {
  try {
    const api = getApiInstance();
    const res = await api.get(`/api/transport-inventory/trips/${tripId}/seats`);
    const data = res.data?.data as TransportTripSeatMap | undefined;
    return {
      tripId: data?.tripId ?? tripId,
      layoutId: data?.layoutId ?? '',
      seats: Array.isArray(data?.seats) ? data.seats : [],
    };
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load seats'));
  }
}

export async function getTransportVehicles(
  filters: TransportVehicleFilters
): Promise<TransportVehicle[]> {
  try {
    const api = getApiInstance();
    const params: Record<string, string> = { transportId: filters.transportId };
    if (filters.transportClassId) params.transportClassId = filters.transportClassId;
    if (filters.checkInDate) params.checkInDate = filters.checkInDate;
    if (filters.checkOutDate) params.checkOutDate = filters.checkOutDate;
    const res = await api.get('/api/transport-inventory/vehicles', { params });
    return unwrapList<TransportVehicle>(res.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load vehicles'));
  }
}

export function assertOnPlatformTransport(transportType: string | undefined): void {
  if (!isOnPlatformTransportType(transportType)) {
    throw new Error(cannotBookOnPlatformMessage(transportType));
  }
}
