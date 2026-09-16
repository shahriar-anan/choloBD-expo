import { getApiInstance } from './axiosClient';
import { HotelDetail, RoomType } from '../../types/hotels';

export async function fetchHotelById(hotelId: string): Promise<HotelDetail | null> {
  const api = getApiInstance();
  const res = await api.get(`/api/hotels/${hotelId}`);
  return res.data.data || null;
}

/** Alias used by service-admin hotel stats screens */
export async function getHotelDetail(hotelId: string): Promise<HotelDetail | null> {
  return fetchHotelById(hotelId);
}

export { HotelDetail, RoomType } from '../../types/hotels';
