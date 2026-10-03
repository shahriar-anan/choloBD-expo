/**
 * Traveler guide request. Payment is not started from this module.
 */

import { getApiInstance } from './axiosClient';
import type { CreateGuideBookingInput } from '../../types/guides';

export interface GuideBookingRecord {
  id: string;
  bookingDate: string;
  startTime?: string | null;
  endTime?: string | null;
  travelerCount: number;
  totalPrice: number;
  confirmationCode: string;
  status: string;
  paymentStatus: string;
  specialRequests?: string | null;
  guide?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    location?: { name?: string | null } | null;
    images?: { url?: string | null }[];
  } | null;
}

function apiMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || fallback;
}

function unwrapGuideList(payload: unknown): GuideBookingRecord[] {
  if (Array.isArray(payload)) return payload as GuideBookingRecord[];
  if (payload && typeof payload === 'object') {
    const record = payload as { results?: unknown; data?: unknown };
    if (Array.isArray(record.results)) return record.results as GuideBookingRecord[];
    if (Array.isArray(record.data)) return record.data as GuideBookingRecord[];
  }
  return [];
}

export async function getMyGuideBookings(userId: string): Promise<GuideBookingRecord[]> {
  const api = getApiInstance();
  try {
    const response = await api.get('/api/bookings/guides', {
      params: { userId, page: 1, limit: 50 },
    });
    return unwrapGuideList(response.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Guide bookings could not be loaded'));
  }
}

export async function cancelGuideBooking(bookingId: string): Promise<void> {
  const api = getApiInstance();
  try {
    await api.patch(`/api/bookings/guides/${bookingId}/status`, { action: 'cancel' });
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Guide booking could not be cancelled'));
  }
}

export async function getGuideBooking(bookingId: string): Promise<GuideBookingRecord> {
  const api = getApiInstance();
  try {
    const response = await api.get(`/api/bookings/guides/${bookingId}`);
    const booking = response.data?.data as GuideBookingRecord | undefined;
    if (!booking?.id) {
      throw new Error(response.data?.message || 'Guide booking could not be loaded');
    }
    return booking;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Guide booking could not be loaded'));
  }
}

export async function createGuideBooking(input: CreateGuideBookingInput): Promise<{ id: string; status: string }> {
  const api = getApiInstance();
  const body: Record<string, string | number> = {
    guideId: input.guideId,
    userId: input.userId,
    bookingDate: input.bookingDate,
    endTime: input.endTime,
    travelerCount: input.travelerCount,
  };
  if (input.startTime) body.startTime = input.startTime;
  if (input.specialRequirements) body.specialRequirements = input.specialRequirements;
  if (input.specialRequests) body.specialRequests = input.specialRequests;

  try {
    const response = await api.post('/api/bookings/guides', body);
    const booking = response.data?.data;
    if (!booking?.id) {
      throw new Error(response.data?.message || 'Guide request could not be sent');
    }
    return { id: booking.id, status: booking.status || 'PENDING' };
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Guide request could not be sent'));
  }
}
