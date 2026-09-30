import { getApiInstance } from './axiosClient';

export async function getHotelReviews(hotelId: string): Promise<any[]> {
  const api = getApiInstance();
  const res = await api.get('/api/reviews', { params: { hotelId, limit: 20 } });
  const data = res.data?.data;
  return Array.isArray(data) ? data : [];
}
