/**
 * Activity booking create. Catalog reads stay in activitySpots.ts.
 */

import { getApiInstance } from './axiosClient';
import { withCatalogLang } from './catalogLang';
import type { QrScanDetailResponse, QrScanHistoryItem } from '../../types/qr';

export interface CreateActivityBookingInput {
  activitySpotId: string;
  userId: string;
  bookingDate: string;
  participantCount: number;
  specialRequirements?: string;
  specialRequests?: string;
}

export interface ActivityBookingRecord {
  id: string;
  bookingDate: string;
  participantCount: number;
  totalPrice: number;
  confirmationCode: string;
  status: string;
  paymentStatus: string;
  specialRequests?: string | null;
  specialRequirements?: string | null;
  price?: number | null;
  paymentMethod?: string | null;
  bookedAt?: string | null;
  checkedInAt?: string | null;
  bookingConfirmInstruction?: string | null;
  user?: {
    id: string;
    userName?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
    phoneNumber?: string | null;
  } | null;
  activitySpot?: {
    id: string;
    name: string;
    description?: string | null;
    phoneNumber?: string | null;
    openingHours?: string | null;
    closingHours?: string | null;
    duration?: string | null;
    bestTimeToVisit?: string | null;
    ageRestriction?: string | null;
    entryCost?: number | null;
    location?: { name?: string | null } | null;
    images?: { url?: string | null }[];
  } | null;
}

function apiMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || fallback;
}

function unwrapActivityList(payload: unknown): ActivityBookingRecord[] {
  if (Array.isArray(payload)) return payload as ActivityBookingRecord[];
  if (payload && typeof payload === 'object') {
    const record = payload as { data?: unknown; results?: unknown };
    if (Array.isArray(record.data)) return record.data as ActivityBookingRecord[];
    if (Array.isArray(record.results)) return record.results as ActivityBookingRecord[];
  }
  return [];
}

export async function getMyActivityBookings(userId: string): Promise<ActivityBookingRecord[]> {
  const api = getApiInstance();
  try {
    const response = await api.get('/api/bookings/activity-spots', {
      params: withCatalogLang({ userId, page: 1, limit: 50 }),
    });
    return unwrapActivityList(response.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Activity bookings could not be loaded'));
  }
}

export async function cancelActivityBooking(bookingId: string): Promise<void> {
  const api = getApiInstance();
  try {
    await api.delete(`/api/bookings/activity-spots/${bookingId}`);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Activity booking could not be cancelled'));
  }
}

export async function generateActivityQr(bookingId: string): Promise<{ qrToken: string }> {
  const api = getApiInstance();
  try {
    const response = await api.post(`/api/bookings/activity-spots/${bookingId}/qr-generate`, {});
    const data = response.data?.data as { qrToken?: string } | undefined;
    if (!data?.qrToken) {
      throw new Error(response.data?.message || 'QR code could not be created');
    }
    return { qrToken: data.qrToken };
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'QR code could not be created'));
  }
}

export async function scanActivityQr(qrToken: string): Promise<ActivityBookingRecord> {
  const api = getApiInstance();
  try {
    const response = await api.post('/api/bookings/activity-spots/qr-scan', { qrToken });
    const booking = response.data?.data?.booking as ActivityBookingRecord | undefined;
    if (!booking?.id) {
      throw new Error(response.data?.message || 'Failed to validate QR code');
    }
    return booking;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to validate QR code'));
  }
}

export async function listActivityQrScans(date?: string): Promise<QrScanHistoryItem[]> {
  const api = getApiInstance();
  const response = await api.get('/api/bookings/activity-spots/qr-scans', {
    params: date ? { date } : undefined,
  });
  const body = response.data as { data?: { results?: QrScanHistoryItem[] } };
  return body.data?.results ?? [];
}

export async function getActivityQrScanDetail(scanId: string): Promise<QrScanDetailResponse> {
  const api = getApiInstance();
  const response = await api.get(`/api/bookings/activity-spots/qr-scans/${scanId}`);
  return response.data as QrScanDetailResponse;
}

export async function activityQrCheckIn(bookingId: string): Promise<{ checkedInAt: string }> {
  const api = getApiInstance();
  const response = await api.post(`/api/bookings/activity-spots/${bookingId}/qr-check-in`, {});
  const checkedInAt = response.data?.data?.checkedInAt as string | undefined;
  if (!checkedInAt) {
    throw new Error(response.data?.message || 'Check-in failed');
  }
  return { checkedInAt };
}

export async function getActivityBooking(bookingId: string): Promise<ActivityBookingRecord> {
  const api = getApiInstance();
  try {
    const response = await api.get(`/api/bookings/activity-spots/${bookingId}`, { params: withCatalogLang() });
    const booking = response.data?.data as ActivityBookingRecord | undefined;
    if (!booking?.id) {
      throw new Error(response.data?.message || 'Activity booking could not be loaded');
    }
    return booking;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Activity booking could not be loaded'));
  }
}

export async function createActivityBooking(input: CreateActivityBookingInput): Promise<{ id: string }> {
  const api = getApiInstance();
  try {
    const response = await api.post('/api/bookings/activity-spots', {
      activitySpotId: input.activitySpotId,
      userId: input.userId,
      bookingDate: input.bookingDate,
      participantCount: input.participantCount,
      ...(input.specialRequirements ? { specialRequirements: input.specialRequirements } : {}),
      ...(input.specialRequests ? { specialRequests: input.specialRequests } : {}),
    });
    const booking = response.data?.data;
    if (!booking?.id) {
      throw new Error(response.data?.message || 'Activity booking could not be created');
    }
    return { id: booking.id };
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Activity booking could not be created'));
  }
}
