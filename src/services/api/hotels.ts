import { getApiInstance } from './axiosClient';
import { Hotel } from '../../types/hotels';
import { unwrapListData } from '../../utils/paginatedList';

export interface HotelFilters {
  locationId?: string;
  divisionId?: string;
  name?: string;
  hotelType?: string;
  minRating?: number;
  maxRating?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdateHotelInfoData {
  description?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  totalRooms?: number;
  availableRooms?: number;
  checkInTime?: string;
  checkOutTime?: string;
  isActive?: boolean;
  nearbyAttractions?: string[];
}

export interface UpdateHotelCoreData {
  name?: string;
  locationId?: string;
  addressId?: string;
  hotelType?: string;
}

export async function fetchHotels(filters: HotelFilters = {}): Promise<Hotel[]> {
  const api = getApiInstance();
  const params: Record<string, any> = {};
  if (filters.locationId) params.locationId = filters.locationId;
  if (filters.divisionId) params.divisionId = filters.divisionId;
  if (filters.name) params.name = filters.name;
  if (filters.hotelType) params.hotelType = filters.hotelType;
  if (filters.minRating) params.minRating = filters.minRating;
  if (filters.maxRating) params.maxRating = filters.maxRating;
  if (filters.isActive !== undefined) params.isActive = filters.isActive;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.limit !== undefined) params.limit = filters.limit;
  const res = await api.get('/api/hotels', { params });
  return unwrapListData<Hotel>(res.data.data, filters.page, filters.limit).results;
}

/** PUT /api/hotels/:id — service-admin profile fields */
export async function updateHotelInfo(
  hotelId: string,
  data: UpdateHotelInfoData
): Promise<Hotel> {
  const api = getApiInstance();
  const res = await api.put(`/api/hotels/${hotelId}`, data);
  return res.data.data;
}

/** PUT /api/hotels/admin/:id — core identity fields */
export async function updateHotelCoreInfo(
  hotelId: string,
  data: UpdateHotelCoreData
): Promise<any> {
  const api = getApiInstance();
  const res = await api.put(`/api/hotels/admin/${hotelId}`, data);
  return res.data.data;
}

export { Hotel } from '../../types/hotels';
