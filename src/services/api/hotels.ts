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

export { Hotel } from '../../types/hotels';
