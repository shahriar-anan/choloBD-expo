import { getApiInstance } from './axiosClient';
import { Hotel } from '../../types/hotels';
import { unwrapList } from './personalPlanMapping';

export interface HotelFilters {
  locationId?: string;
  hotelType?: string;
  minRating?: number;
  maxRating?: number;
  isActive?: boolean;
}

export async function fetchHotels(filters: HotelFilters = {}): Promise<Hotel[]> {
  const api = getApiInstance();
  const params: Record<string, any> = {};
  if (filters.locationId) params.locationId = filters.locationId;
  if (filters.hotelType) params.hotelType = filters.hotelType;
  if (filters.minRating) params.minRating = filters.minRating;
  if (filters.maxRating) params.maxRating = filters.maxRating;
  if (filters.isActive !== undefined) params.isActive = filters.isActive;
  const res = await api.get('/api/hotels', { params });
  return unwrapList<Hotel>(res.data?.data);
}

export { Hotel } from '../../types/hotels';
