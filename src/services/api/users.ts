import { getApiInstance } from './axiosClient';

export async function getUserProfile(): Promise<any> {
  const api = getApiInstance();
  const res = await api.get('/api/users/profile');
  return res.data?.data ?? null;
}

/**
 * Fetch the service admin's assigned hotel via GET /api/hotels/my
 */
export async function getMyHotel(hotelId?: string): Promise<any> {
  const api = getApiInstance();

  if (hotelId) {
    const res = await api.get(`/api/hotels/${hotelId}`);
    return res.data?.data ?? null;
  }

  const res = await api.get('/api/hotels/my');
  const data = res.data?.data;
  return data ?? null;
}

export async function getHotelRooms(hotelId: string): Promise<any[]> {
  const api = getApiInstance();
  const res = await api.get(`/api/hotel-rooms/rooms/${hotelId}`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}
