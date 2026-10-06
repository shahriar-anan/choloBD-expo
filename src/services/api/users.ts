import { getApiInstance } from './axiosClient';

export async function getUserProfile(): Promise<any> {
  const api = getApiInstance();
  const res = await api.get('/api/users/profile');
  return res.data?.data ?? null;
}

export interface UpdateUserProfileData {
  userName?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  imageUrl?: string;
}

export async function updateUserProfile(data: UpdateUserProfileData): Promise<any> {
  const api = getApiInstance();
  const res = await api.put('/api/users/profile', data);
  return res.data?.data ?? null;
}

/**
 * Hotels assigned to the signed-in hotel admin or hotel employee.
 * GET /api/hotels/my always returns an array.
 */
export async function getMyHotel(): Promise<any[]> {
  const api = getApiInstance();
  const res = await api.get('/api/hotels/my');
  const data = res.data?.data;
  return Array.isArray(data) ? data : [];
}

export async function getOperatorHotel(hotelId: string): Promise<any> {
  const api = getApiInstance();
  const res = await api.get(`/api/hotels/${hotelId}`);
  return res.data?.data ?? null;
}

export interface UpdateHotelProfileData {
  phoneNumber?: string;
  email?: string;
  website?: string;
  checkInTime?: string;
  checkOutTime?: string;
  amenities?: string[];
  policies?: string[];
  nearbyTourSpots?: string[];
  nearbyActivitySpots?: string[];
}

export async function updateMyHotel(hotelId: string, data: UpdateHotelProfileData): Promise<any> {
  const api = getApiInstance();
  const res = await api.put(`/api/hotels/${hotelId}`, data);
  return res.data?.data ?? null;
}

export async function getHotelRooms(hotelId: string): Promise<any[]> {
  const api = getApiInstance();
  const res = await api.get(`/api/hotel-rooms/rooms/${hotelId}`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}
