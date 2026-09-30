import { getApiInstance } from './axiosClient';
import { Hotel } from '../../types/hotels';
import { unwrapList } from './personalPlanMapping';

export interface HotelFilters {
  locationId?: string;
  divisionId?: string;
  hotelType?: string;
  name?: string;
  minRating?: number;
  maxRating?: number;
  isActive?: boolean;
  checkInDate?: string;
  checkOutDate?: string;
  page?: number;
  limit?: number;
}

export async function fetchHotels(filters: HotelFilters = {}): Promise<Hotel[]> {
  const api = getApiInstance();
  const params: Record<string, string | number | boolean> = {};
  if (filters.locationId) params.locationId = filters.locationId;
  if (filters.divisionId) params.divisionId = filters.divisionId;
  if (filters.hotelType) params.hotelType = filters.hotelType;
  if (filters.name) params.name = filters.name;
  if (filters.minRating) params.minRating = filters.minRating;
  if (filters.maxRating) params.maxRating = filters.maxRating;
  if (filters.isActive !== undefined) params.isActive = filters.isActive;
  if (filters.checkInDate) params.checkInDate = filters.checkInDate;
  if (filters.checkOutDate) params.checkOutDate = filters.checkOutDate;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  const res = await api.get('/api/hotels', { params });
  return unwrapList<Hotel>(res.data?.data);
}

export interface PopularHotel {
  id: string;
  name: string;
  rating: number;
  locationName: string;
  imageUrl?: string;
  startingPrice?: number;
}

export async function fetchPopularHotels(limit = 8): Promise<PopularHotel[]> {
  const api = getApiInstance();
  try {
    const res = await api.get('/api/hotels/popular', { params: { limit } });
    const rows = unwrapList<Hotel>(res.data?.data);
    return rows.map((hotel) => {
      const prices = (hotel.roomTypes ?? [])
        .map((room) => room.pricePerNight)
        .filter((price) => typeof price === 'number' && price > 0);
      return {
        id: hotel.id,
        name: hotel.name,
        rating: hotel.rating,
        locationName: hotel.location?.name || '',
        imageUrl: hotel.images?.[0]?.url,
        startingPrice: prices.length > 0 ? Math.min(...prices) : undefined,
      };
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    throw new Error(err.response?.data?.message || err.message || 'Request failed');
  }
}

export type HotelRoomDeskStatus = 'AVAILABLE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export async function updateHotelRoomTypePrice(roomTypeId: string, pricePerNight: number): Promise<any> {
  const api = getApiInstance();
  const res = await api.put(`/api/hotel-rooms/roomTypes/${roomTypeId}`, { pricePerNight });
  return res.data?.data ?? null;
}

export async function createHotelRoomType(data: {
  hotelId: string;
  roomType: string;
  pricePerNight: number;
  totalCount: number;
}): Promise<any> {
  const api = getApiInstance();
  const res = await api.post('/api/hotel-rooms/roomTypes', data);
  return res.data?.data ?? null;
}

export async function updateHotelRoomStatus(roomId: string, roomStatus: HotelRoomDeskStatus): Promise<any> {
  const api = getApiInstance();
  const res = await api.put(`/api/hotel-rooms/rooms/${roomId}`, { roomStatus });
  return res.data?.data ?? null;
}

export { Hotel } from '../../types/hotels';
