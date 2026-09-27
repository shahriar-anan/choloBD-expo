/**
 * Personal tour plan API client (GET/POST/PUT/DELETE /api/tour-builder/my)
 */

import { getApiInstance } from './axiosClient';
import {
  TripPlan,
  TripSummary,
  UserSegment,
  TripFilters,
  CreateTripData,
  UpdateTripData,
  CreateSegmentData,
  UpdateSegmentData,
  TripApiResponse,
  TripApiError,
  PaginationInfo,
  PersonalDaySegmentApi,
} from '../../types/trips';
import {
  mapPersonalPlanToTripPlan,
  mapCreateTripDataToPersonalApi,
  mapUpdateTripDataToPersonalApi,
  mapCreateSegmentToDaySegment,
  mergeSegmentUpdate,
  daySegmentsForPut,
  buildTripSummaryFromPlan,
  normalizeDaySegmentsInput,
  buildPersonalPlanBody,
  mapPersonalPackageToTripPlan,
  PersonalPlanSaveInput,
  unwrapList,
} from './personalPlanMapping';

function mapApiError(error: any): TripApiError {
  if (error?.response?.status === 400) {
    return {
      type: 'VALIDATION',
      statusCode: 400,
      message: error?.response?.data?.message || 'Validation failed. Check your input.',
      details: error?.response?.data?.details,
    };
  }
  if (error?.response?.status === 401) {
    return {
      type: 'UNAUTHORIZED',
      statusCode: 401,
      message: error?.response?.data?.message || 'Unauthorized. Please login again.',
      details: error?.response?.data?.details,
    };
  }
  if (error?.response?.status === 403) {
    return {
      type: 'FORBIDDEN',
      statusCode: 403,
      message: error?.response?.data?.message || 'Access denied. You do not own this trip.',
      details: error?.response?.data?.details,
    };
  }
  if (error?.response?.status === 404) {
    return {
      type: 'NOT_FOUND',
      statusCode: 404,
      message: error?.response?.data?.message || 'Trip plan not found.',
      details: error?.response?.data?.details,
    };
  }
  if (error?.response?.status === 409) {
    return {
      type: 'CONFLICT',
      statusCode: 409,
      message:
        error?.response?.data?.message || 'Conflict: Cannot delete trip with confirmed bookings.',
      details: error?.response?.data?.details,
    };
  }
  if (error?.response?.status === 500) {
    return {
      type: 'SERVER',
      statusCode: 500,
      message: 'Server error. Please try again later.',
      details: error?.response?.data?.details,
    };
  }
  return {
    type: 'UNKNOWN',
    statusCode: error?.response?.status || 0,
    message: error?.message || 'An unknown error occurred.',
    details: error?.response?.data?.details,
  };
}

async function putDaySegments(tripId: string, segments: PersonalDaySegmentApi[]): Promise<TripPlan> {
  const api = getApiInstance();
  const res = await api.put<TripApiResponse<any>>(`/api/tour-builder/my/${tripId}`, {
    daySegments: normalizeDaySegmentsInput(daySegmentsForPut(segments)),
  });
  return mapPersonalPlanToTripPlan(res.data.data);
}

export async function createTrip(payload: CreateTripData): Promise<TripPlan> {
  try {
    const api = getApiInstance();
    const { daySegments, ...rest } = payload;
    const normalizedSegments = daySegments?.length
      ? normalizeDaySegmentsInput(daySegments)
      : undefined;
    const body = mapCreateTripDataToPersonalApi(rest, normalizedSegments);
    const res = await api.post<TripApiResponse<any>>('/api/tour-builder/my', body);
    return mapPersonalPackageToTripPlan(res.data.data);
  } catch (error: any) {
    throw mapApiError(error);
  }
}

export async function getTrips(
  filters?: TripFilters
): Promise<{ trips: TripPlan[]; pagination: PaginationInfo }> {
  try {
    const api = getApiInstance();
    const params: Record<string, string | number | boolean> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.locationId) params.locationId = filters.locationId;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    const res = await api.get<TripApiResponse<any>>('/api/tour-builder/my', { params });
    const raw = unwrapList<any>(res.data.data);
    const trips = raw.map(mapPersonalPackageToTripPlan);
    const page = Number(res.data.data?.page || params.page || 1);
    const limit = Number(res.data.data?.limit || params.limit || trips.length || 10);
    const total = res.data.data?.total ?? trips.length;

    return {
      trips,
      pagination: res.data.pagination || {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / (limit || 1))),
      },
    };
  } catch (error: any) {
    throw mapApiError(error);
  }
}

export async function getTripDetails(tripId: string): Promise<TripPlan> {
  try {
    const api = getApiInstance();
    const res = await api.get<TripApiResponse<any>>(`/api/tour-builder/my/${tripId}`);
    return mapPersonalPackageToTripPlan(res.data.data);
  } catch (error: any) {
    throw mapApiError(error);
  }
}

export async function updateTrip(tripId: string, payload: UpdateTripData): Promise<TripPlan> {
  try {
    const api = getApiInstance();
    const body = mapUpdateTripDataToPersonalApi(payload);
    const res = await api.put<TripApiResponse<any>>(`/api/tour-builder/my/${tripId}`, body);
    return mapPersonalPackageToTripPlan(res.data.data);
  } catch (error: any) {
    throw mapApiError(error);
  }
}

export async function deleteTrip(tripId: string): Promise<{ success: boolean }> {
  try {
    const api = getApiInstance();
    await api.delete(`/api/tour-builder/my/${tripId}`);
    return { success: true };
  } catch (error: any) {
    throw mapApiError(error);
  }
}

export async function addSegment(tripId: string, payload: CreateSegmentData): Promise<TripPlan> {
  const trip = await getTripDetails(tripId);
  const dayNumber = payload.dayNumber;
  const existing = trip.daySegments ?? [];
  const dayStops = existing.filter((s) => s.dayNumber === dayNumber);
  if (dayStops.length >= 4) {
    throw mapApiError({ response: { status: 400, data: { message: 'Day can have at most 4 stops' } } });
  }
  const nextOrder = payload.segmentOrder ?? dayStops.length + 1;
  const segmentInput = mapCreateSegmentToDaySegment({ ...payload, segmentOrder: nextOrder }, dayNumber);
  const next = [...daySegmentsForPut(existing), segmentInput];
  const api = getApiInstance();
  const res = await api.put<TripApiResponse<any>>(`/api/tour-builder/my/${tripId}`, {
    daySegments: normalizeDaySegmentsInput(next),
  });
  return mapPersonalPlanToTripPlan(res.data.data);
}

export async function updateSegment(
  tripId: string,
  segmentId: string,
  payload: UpdateSegmentData
): Promise<TripPlan> {
  const trip = await getTripDetails(tripId);
  const existing = trip.daySegments ?? [];
  const idx = existing.findIndex((s) => s.id === segmentId);
  if (idx < 0) {
    throw mapApiError({ response: { status: 404, data: { message: 'Segment not found' } } });
  }
  const merged = mergeSegmentUpdate(existing[idx], payload);
  const next = existing.map((s, i) =>
    i === idx ? { ...s, ...merged, shortDescription: merged.shortDescription } : s
  );
  const api = getApiInstance();
  const res = await api.put<TripApiResponse<any>>(`/api/tour-builder/my/${tripId}`, {
    daySegments: normalizeDaySegmentsInput(daySegmentsForPut(next as PersonalDaySegmentApi[])),
  });
  return mapPersonalPlanToTripPlan(res.data.data);
}

export async function deleteSegment(tripId: string, segmentId: string): Promise<TripPlan> {
  const trip = await getTripDetails(tripId);
  const existing = trip.daySegments ?? [];
  const next = existing.filter((s) => s.id !== segmentId);
  if (next.length === existing.length) {
    throw mapApiError({ response: { status: 404, data: { message: 'Segment not found' } } });
  }
  return putDaySegments(tripId, next);
}

export async function getDaySegments(tripId: string, dayNumber: number): Promise<UserSegment[]> {
  const trip = await getTripDetails(tripId);
  return (trip.userSegments ?? []).filter((s) => s.dayNumber === dayNumber);
}

export async function getTripSummary(tripId: string): Promise<TripSummary> {
  const trip = await getTripDetails(tripId);
  return buildTripSummaryFromPlan(trip);
}

export async function savePersonalTourPlan(input: PersonalPlanSaveInput): Promise<TripPlan> {
  try {
    const api = getApiInstance();
    const res = await api.post<TripApiResponse<any>>(
      '/api/tour-builder/my',
      buildPersonalPlanBody(input, 'create')
    );
    return mapPersonalPackageToTripPlan(res.data.data);
  } catch (error: any) {
    throw mapApiError(error);
  }
}

export async function updatePersonalTourPlan(
  tourPackageId: string,
  input: PersonalPlanSaveInput
): Promise<TripPlan> {
  try {
    const api = getApiInstance();
    const res = await api.put<TripApiResponse<any>>(
      `/api/tour-builder/my/${tourPackageId}`,
      buildPersonalPlanBody(input, 'edit')
    );
    return mapPersonalPackageToTripPlan(res.data.data);
  } catch (error: any) {
    throw mapApiError(error);
  }
}

export async function attachPersonalTourImages(
  tourPackageId: string,
  imageURLs: string[]
): Promise<TripPlan> {
  try {
    const api = getApiInstance();
    const res = await api.put<TripApiResponse<any>>(`/api/tour-builder/my/${tourPackageId}`, {
      imageURLs,
    });
    return mapPersonalPackageToTripPlan(res.data.data);
  } catch (error: any) {
    throw mapApiError(error);
  }
}
