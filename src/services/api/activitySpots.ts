/**
 * Activity Spots API Service
 */

import { getApiInstance } from './axiosClient';
import { unwrapList } from './personalPlanMapping';
import type { PagedResult } from './tourSpots';

export interface ActivitySpot {
  id: string;
  name: string;
  description?: string;
  location: string;
  locationId?: string;
  locationName: string;
  imageUrl?: string;
  images?: { id: string; url: string }[];
  rating?: number;
  entryCost?: number;
  activityType?: string;
  duration?: string;
  openingHours?: string;
  closingHours?: string;
  ageRestriction?: string;
  bestTimeToVisit?: string;
  nearbyHotelsCount?: number;
  nearbyGuidesCount?: number;
}

export interface ActivitySpotFilters {
  locationId?: string;
  divisionId?: string;
  activityType?: string;
  name?: string;
  isPopular?: boolean;
  minRating?: number;
  maxEntryCost?: number;
  page?: number;
  limit?: number;
}

export async function getActivitySpots(filters?: ActivitySpotFilters): Promise<PagedResult<ActivitySpot>> {
  const api = getApiInstance();
  const params: Record<string, string | number | boolean> = {};
  if (filters?.locationId) params.locationId = filters.locationId;
  if (filters?.divisionId) params.divisionId = filters.divisionId;
  if (filters?.activityType) params.activityType = filters.activityType;
  if (filters?.name) params.name = filters.name;
  if (filters?.isPopular !== undefined) params.isPopular = filters.isPopular;
  if (filters?.minRating !== undefined) params.minRating = filters.minRating;
  if (filters?.maxEntryCost !== undefined) params.maxEntryCost = filters.maxEntryCost;
  if (filters?.page !== undefined) params.page = filters.page;
  if (filters?.limit !== undefined) params.limit = filters.limit;

  try {
    const response = await api.get('/api/activity-spots', { params });
    return readPage(response.data?.data);
  } catch (error: unknown) {
    throw new Error(readApiMessage(error));
  }
}

export async function getActivitySpotById(activitySpotId: string): Promise<ActivitySpot | null> {
  const api = getApiInstance();
  try {
    const response = await api.get(`/api/activity-spots/${activitySpotId}`);
    const spot = response.data?.data;
    if (!spot) return null;
    return mapActivitySpot(spot);
  } catch (error: unknown) {
    throw new Error(readApiMessage(error));
  }
}

export async function getPopularActivitySpots(limit = 8): Promise<ActivitySpot[]> {
  const api = getApiInstance();
  try {
    const response = await api.get('/api/activity-spots/popular', { params: { limit } });
    return readPage(response.data?.data).results;
  } catch (error: unknown) {
    throw new Error(readApiMessage(error));
  }
}

function mapActivitySpot(spot: any): ActivitySpot {
  const locationName =
    spot.location?.name ||
    [spot.location?.city, spot.location?.state, spot.location?.country].filter(Boolean).join(', ') ||
    [spot.city, spot.state, spot.country].filter(Boolean).join(', ') ||
    '';
  const entryCost = typeof spot.entryCost === 'number' ? spot.entryCost : undefined;
  return {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    location: locationName,
    locationId: spot.location?.id || spot.locationId,
    locationName,
    imageUrl: spot.images?.[0]?.url || spot.imageUrl,
    images: Array.isArray(spot.images)
      ? spot.images
          .filter((image: { url?: string }) => Boolean(image?.url))
          .map((image: { id?: string; url: string }, index: number) => ({
            id: image.id || `${spot.id}-${index}`,
            url: image.url,
          }))
      : undefined,
    rating: typeof spot.rating === 'number' ? spot.rating : undefined,
    entryCost,
    activityType: spot.activityType,
    duration: spot.duration || undefined,
    openingHours: spot.openingHours || undefined,
    closingHours: spot.closingHours || undefined,
    ageRestriction: spot.ageRestriction || undefined,
    bestTimeToVisit: spot.bestTimeToVisit || undefined,
    nearbyHotelsCount: typeof spot.nearbyHotelsCount === 'number' ? spot.nearbyHotelsCount : undefined,
    nearbyGuidesCount: typeof spot.nearbyGuidesCount === 'number' ? spot.nearbyGuidesCount : undefined,
  };
}

function readPage(data: unknown): PagedResult<ActivitySpot> {
  const rows = unwrapList<any>(data);
  const payload = data && typeof data === 'object' && !Array.isArray(data)
    ? data as { total?: number; page?: number; limit?: number }
    : {};
  return {
    results: rows.map(mapActivitySpot),
    total: typeof payload.total === 'number' ? payload.total : rows.length,
    page: typeof payload.page === 'number' ? payload.page : 1,
    limit: typeof payload.limit === 'number' ? payload.limit : (rows.length || 20),
  };
}

function readApiMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || 'Request failed';
}
