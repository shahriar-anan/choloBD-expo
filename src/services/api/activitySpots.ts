/**
 * Activity Spots API Service
 * Handles fetching / updating activity spots from the backend
 */

import { getApiInstance } from './axiosClient';
import { unwrapListData } from '../../utils/paginatedList';
import type { ActivitySpot as ActivitySpotDetail } from '../../types/activitySpots';

export interface ActivitySpot {
  id: string;
  name: string;
  description?: string;
  location: string;
  imageUrl?: string;
  rating?: number;
}

export interface ActivitySpotFilters {
  locationId?: string;
  divisionId?: string;
  name?: string;
  activityType?: string;
  isActive?: boolean;
  isPopular?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface UpdateActivitySpotData {
  name?: string;
  description?: string;
  phoneNumber?: string;
  entryCost?: number;
  openingHours?: string;
  closingHours?: string;
  bestTimeToVisit?: string;
  duration?: string;
  ageRestriction?: string;
  bookingConfirmInstruction?: string | null;
  maxBookingsPerDay?: number;
  isActive?: boolean;
  isPopular?: boolean;
}

export async function getActivitySpots(
  locationIdOrFilters?: string | ActivitySpotFilters
): Promise<ActivitySpot[]> {
  const api = getApiInstance();
  const filters: ActivitySpotFilters =
    typeof locationIdOrFilters === 'string'
      ? { locationId: locationIdOrFilters }
      : locationIdOrFilters ?? {};

  const params: Record<string, string | number | boolean> = { limit: filters.limit ?? 100 };
  if (filters.locationId) params.locationId = filters.locationId;
  if (filters.divisionId) params.divisionId = filters.divisionId;
  if (filters.name) params.name = filters.name;
  if (filters.activityType) params.activityType = filters.activityType;
  if (filters.isActive !== undefined) params.isActive = filters.isActive;
  if (filters.isPopular !== undefined) params.isPopular = filters.isPopular;
  if (filters.minRating !== undefined) params.minRating = filters.minRating;
  if (filters.page !== undefined) params.page = filters.page;

  const response = await api.get('/api/activity-spots', { params });
  const data = unwrapListData<any>(response.data.data, filters.page, filters.limit).results;
  return data.map((spot: any) => ({
    id: spot.id,
    name: spot.name,
    description: spot.description,
    location:
      spot.location?.name ||
      [spot.city, spot.state, spot.country].filter(Boolean).join(', ') ||
      'Unknown Location',
    imageUrl: spot.images?.[0]?.url || spot.imageUrl,
    rating: spot.rating,
  }));
}

/** GET /api/activity-spots/:id */
export async function getActivitySpotDetail(
  activitySpotId: string
): Promise<ActivitySpotDetail> {
  const api = getApiInstance();
  const res = await api.get(`/api/activity-spots/${activitySpotId}`);
  return res.data.data;
}

/** PUT /api/activity-spots/:id — service-admin profile updates */
export async function updateActivitySpot(
  activitySpotId: string,
  data: UpdateActivitySpotData
): Promise<ActivitySpotDetail> {
  const api = getApiInstance();
  const res = await api.put(`/api/activity-spots/${activitySpotId}`, data);
  return res.data.data;
}
