/**
 * Activity booking create. Catalog reads stay in activitySpots.ts.
 */

import { getApiInstance } from './axiosClient';

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
  bookingConfirmInstruction?: string | null;
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
      params: { userId, page: 1, limit: 50 },
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

export async function generateActivityQr(bookingId: string): Promise<{ qrToken: string; expiresAt: string }> {
  const api = getApiInstance();
  try {
    const response = await api.post(`/api/bookings/activity-spots/${bookingId}/qr-generate`, {});
    const data = response.data?.data as { qrToken?: string; expiresAt?: string } | undefined;
    if (!data?.qrToken) {
      throw new Error(response.data?.message || 'QR code could not be created');
    }
    return { qrToken: data.qrToken, expiresAt: data.expiresAt || '' };
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'QR code could not be created'));
  }
}

export async function getActivityBooking(bookingId: string): Promise<ActivityBookingRecord> {
  const api = getApiInstance();
  try {
    const response = await api.get(`/api/bookings/activity-spots/${bookingId}`);
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
