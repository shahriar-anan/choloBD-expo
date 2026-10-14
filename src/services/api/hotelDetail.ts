import { getApiInstance } from './axiosClient';
import { HotelDetail, RoomType } from '../../types/hotels';
import { withCatalogLang } from './catalogLang';

export async function fetchHotelById(hotelId: string): Promise<HotelDetail | null> {
  const api = getApiInstance();
  const res = await api.get(`/api/hotels/${hotelId}`, { params: withCatalogLang() });
  return res.data.data || null;
}

export { HotelDetail, RoomType } from '../../types/hotels';
