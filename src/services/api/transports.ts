import { getApiInstance } from './axiosClient';
import { unwrapList } from './personalPlanMapping';
import {
  cannotBookOnPlatformMessage,
  CreateTransportClassPayload,
  CreateTransportLayoutPayload,
  UpdateTransportLayoutPayload,
  CreateTransportRoutePayload,
  CreateTransportRouteStopPayload,
  CreateTransportTripPayload,
  CreateTransportVehiclePayload,
  isOnPlatformTransportType,
  PaginatedTransports,
  TransportClassRef,
  TransportLayoutRef,
  TransportListFilters,
  TransportOperator,
  TransportRouteRef,
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

export async function setTransportTripSeatSold(
  tripId: string,
  seatId: string,
  sold: boolean
): Promise<TransportTripSeatMap> {
  try {
    const api = getApiInstance();
    const res = await api.post(`/api/transport-inventory/trips/${tripId}/seat-sales`, { seatId, sold });
    const data = res.data?.data as TransportTripSeatMap | undefined;
    return {
      tripId: data?.tripId ?? tripId,
      layoutId: data?.layoutId ?? '',
      seats: Array.isArray(data?.seats) ? data.seats : [],
    };
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to update seat'));
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

export async function getMyTransport(): Promise<TransportOperator[]> {
  try {
    const api = getApiInstance();
    const res = await api.get('/api/transports/my');
    const data = res.data?.data;
    if (Array.isArray(data)) {
      return data as TransportOperator[];
    }
    if (data && typeof data === 'object' && (data as TransportOperator).id) {
      return [data as TransportOperator];
    }
    return [];
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    if (err?.response?.status === 404) {
      return [];
    }
    throw new Error(apiMessage(error, 'Failed to load your transport company'));
  }
}

export async function getTransportClasses(transportId: string): Promise<TransportClassRef[]> {
  try {
    const api = getApiInstance();
    const res = await api.get('/api/transport-inventory/classes', { params: { transportId } });
    return unwrapList<TransportClassRef>(res.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load coach classes'));
  }
}

export async function createTransportClass(
  payload: CreateTransportClassPayload
): Promise<TransportClassRef> {
  try {
    const api = getApiInstance();
    const res = await api.post('/api/transport-inventory/classes', payload);
    return res.data?.data as TransportClassRef;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to create coach class'));
  }
}

export async function getTransportLayouts(transportId: string): Promise<TransportLayoutRef[]> {
  try {
    const api = getApiInstance();
    const res = await api.get('/api/transport-inventory/layouts', { params: { transportId } });
    return unwrapList<TransportLayoutRef>(res.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load coach layouts'));
  }
}

export async function createTransportLayout(
  payload: CreateTransportLayoutPayload
): Promise<TransportLayoutRef> {
  try {
    const api = getApiInstance();
    const res = await api.post('/api/transport-inventory/layouts', payload);
    return res.data?.data as TransportLayoutRef;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to create coach layout'));
  }
}

export async function deleteTransportLayout(layoutId: string): Promise<void> {
  try {
    const api = getApiInstance();
    await api.delete(`/api/transport-inventory/layouts/${layoutId}`);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to delete coach'));
  }
}

export async function deleteTransportTrip(tripId: string): Promise<void> {
  try {
    const api = getApiInstance();
    await api.delete(`/api/transport-inventory/trips/${tripId}`);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to delete departure'));
  }
}

export async function updateTransportLayout(
  layoutId: string,
  payload: UpdateTransportLayoutPayload
): Promise<TransportLayoutRef> {
  try {
    const api = getApiInstance();
    const res = await api.put(`/api/transport-inventory/layouts/${layoutId}`, payload);
    return res.data?.data as TransportLayoutRef;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to update coach layout'));
  }
}

export async function getTransportRoutes(transportId: string): Promise<TransportRouteRef[]> {
  try {
    const api = getApiInstance();
    const res = await api.get('/api/transport-inventory/routes', { params: { transportId } });
    return unwrapList<TransportRouteRef>(res.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load routes'));
  }
}

export async function createTransportRoute(
  payload: CreateTransportRoutePayload
): Promise<TransportRouteRef> {
  try {
    const api = getApiInstance();
    const res = await api.post('/api/transport-inventory/routes', payload);
    return res.data?.data as TransportRouteRef;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to create route'));
  }
}

export async function addTransportRouteStop(
  routeId: string,
  payload: CreateTransportRouteStopPayload
): Promise<unknown> {
  try {
    const api = getApiInstance();
    const res = await api.post(`/api/transport-inventory/routes/${routeId}/stops`, payload);
    return res.data?.data;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to add route stop'));
  }
}

export async function createTransportTrip(
  payload: CreateTransportTripPayload
): Promise<TransportTrip> {
  try {
    const api = getApiInstance();
    const res = await api.post('/api/transport-inventory/trips', payload);
    return res.data?.data as TransportTrip;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to schedule trip'));
  }
}

export async function getOperatorTransportTrips(transportId: string): Promise<TransportTrip[]> {
  return getTransportTrips({ transportId });
}

export async function deleteTransportClass(classId: string): Promise<void> {
  try {
    const api = getApiInstance();
    await api.delete(`/api/transport-inventory/classes/${classId}`);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to delete class'));
  }
}

export async function updateTransportClass(
  classId: string,
  payload: { name?: string; basePrice?: number; vehicleRentalCategory?: string }
): Promise<TransportClassRef> {
  try {
    const api = getApiInstance();
    const res = await api.put(`/api/transport-inventory/classes/${classId}`, payload);
    return res.data?.data as TransportClassRef;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to update rental rate'));
  }
}

export async function updateTransportVehicle(
  vehicleId: string,
  payload: { name?: string; licensePlate?: string; imageUrl?: string | null; vehicleStatus?: string; transportClassId?: string; isActive?: boolean }
): Promise<TransportVehicle> {
  try {
    const api = getApiInstance();
    const res = await api.put(`/api/transport-inventory/vehicles/${vehicleId}`, payload);
    return res.data?.data as TransportVehicle;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to update vehicle'));
  }
}

export async function deleteTransportVehicle(vehicleId: string): Promise<void> {
  try {
    const api = getApiInstance();
    await api.delete(`/api/transport-inventory/vehicles/${vehicleId}`);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to delete car'));
  }
}

export async function createTransportVehicle(
  payload: CreateTransportVehiclePayload
): Promise<TransportVehicle> {
  try {
    const api = getApiInstance();
    const res = await api.post('/api/transport-inventory/vehicles', payload);
    return res.data?.data as TransportVehicle;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to add vehicle'));
  }
}

export async function getOperatorTransportVehicles(
  transportId: string
): Promise<TransportVehicle[]> {
  return getTransportVehicles({ transportId });
}
