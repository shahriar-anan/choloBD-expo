/**
 * Hotel Booking Selection Utilities
 * Pure functions for fetching hotel booking data for trip segments
 */

import { getApiInstance } from './axiosClient';
import { getHotelBookings, getUserBookings } from './bookings';

export interface HotelBookingInfo {
  id: string;
  hotelId: string;
  hotelName: string;
  location: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  totalPrice: number;
  confirmationCode: string;
}

export interface AvailableHotel {
  id: string;
  name: string;
  location: string;
  avgRating?: number;
  image?: string;
}

export async function fetchUserHotelBookings(locationId?: string): Promise<HotelBookingInfo[]> {
  try {
    const api = getApiInstance();
    const res = await api.get('/api/hotel-bookings', {
      params: locationId ? { locationId } : {},
    });
    return res.data.data || [];
  } catch {
    return [];
  }
}

/**
 * Paginated hotel bookings for dashboards/stats.
 * Prefer hotel-room booking routes when userId/hotelId is provided.
 */
export async function getUserHotelBookings(params?: {
  userId?: string;
  hotelId?: string;
  page?: number;
  limit?: number;
}): Promise<{ results: any[]; total?: number }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;

  if (params?.hotelId) {
    const { data, pagination } = await getHotelBookings(params.hotelId, page, limit);
    return { results: data ?? [], total: pagination?.total };
  }

  if (params?.userId) {
    const response = await getUserBookings(params.userId, page, limit);
    const list = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response.data as any)?.data)
        ? (response.data as any).data
        : [];
    return { results: list, total: response.pagination?.total ?? list.length };
  }

  const bookings = await fetchUserHotelBookings();
  return { results: bookings, total: bookings.length };
}

export function filterBookingsByLocation(
  bookings: HotelBookingInfo[],
  locationId: string,
  locationName?: string
): HotelBookingInfo[] {
  if (!locationName) return [];
  return bookings.filter((b) => b.location.toLowerCase() === locationName.toLowerCase());
}

export function formatBookingForDisplay(booking: HotelBookingInfo): string {
  const statusIndicator = {
    PENDING: '⏳',
    CONFIRMED: '✅',
    COMPLETED: '✔️',
    CANCELLED: '❌',
  }[booking.status];
  return `${statusIndicator} ${booking.hotelName} (${booking.checkInDate}) - ₹${booking.totalPrice}`;
}
