import { getApiInstance } from './axiosClient';
import {
    CancellationEligibility,
    CancelBookingWithRefundData,
} from '../../types/cancellation';

export interface CreateBookingData {
  hotelId: string;
  userId: string;
  checkInDate: string;
  checkOutDate: string;
  selectedRoomsMap: Record<string, number>;
  guestName: string;
  guestEmail: string;
  guestPhoneNumber: string;
  paymentMethod?: string; // Only used in edit mode; not sent for new bookings
  specialRequests?: string;
}

export interface UpdateBookingData {
  checkInDate?: string;
  checkOutDate?: string;
  roomDetails?: Array<{
    hotelRoomId: string;
    pricePerNight: number;
  }>;
  paymentMethod?: string;
  specialRequests?: string;
}

export async function createBooking(data: CreateBookingData): Promise<any> {
  const api = getApiInstance();
  const res = await api.post('/api/bookings/hotel-rooms', data);
  return res.data.data;
}

export async function getUserBookings(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ data: any[]; pagination: any }> {
  const api = getApiInstance();
  const res = await api.get(`/api/bookings/hotel-rooms?userId=${userId}&page=${page}&limit=${limit}`);
  return res.data?.data ?? { data: [], pagination: { total: 0, page, limit, pages: 0 } };
}

export async function getHotelBookings(
  hotelId: string,
  page = 1,
  limit = 20
): Promise<{ data: any[]; pagination: any }> {
  const api = getApiInstance();
  const res = await api.get('/api/bookings/hotel-rooms', {
    params: { hotelId, page, limit },
  });
  const responseData = res.data?.data?.data || [];
  const responsePagination = res.data?.data?.pagination || null;
  return { data: Array.isArray(responseData) ? responseData : [], pagination: responsePagination };
}

export async function getBookingById(bookingId: string): Promise<any> {
  const api = getApiInstance();
  const res = await api.get(`/api/bookings/hotel-rooms/${bookingId}`);
  return res.data?.data ?? null;
}

export async function updateBooking(bookingId: string, data: UpdateBookingData): Promise<any> {
  const api = getApiInstance();
  const res = await api.put(`/api/bookings/hotel-rooms/${bookingId}`, data);
  return res.data?.data ?? null;
}

export async function getHotelCancellationEligibility(
  bookingId: string
): Promise<CancellationEligibility> {
  const api = getApiInstance();
  const res = await api.get(
    `/api/bookings/hotel-rooms/${bookingId}/cancellation-eligibility`
  );
  return res.data?.data;
}

export async function cancelHotelBooking(
  bookingId: string,
  reason?: string
): Promise<CancelBookingWithRefundData<unknown>> {
  const api = getApiInstance();
  const res = await api.delete(`/api/bookings/hotel-rooms/${bookingId}`, {
    data: reason ? { reason } : undefined,
  });
  return res.data?.data;
}
