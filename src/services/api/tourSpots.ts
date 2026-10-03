/**
 * Tour Spots API Service
 * Handles fetching tour spots from the backend
 */

import { getApiInstance } from './axiosClient';
import { unwrapList } from './personalPlanMapping';

export interface TourSpot {
  id: string;
  name: string;
  description?: string;
  locationId?: string;
  locationName: string;
  tourType: string;
  rating?: number;
  imageUrl?: string;
  isPopular: boolean;
}

export interface TourSpotFilters {
  isPopular?: boolean;
  locationId?: string;
  divisionId?: string;
  name?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface PagedResult<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TourSpotImage {
  id: string;
  url: string;
  altText?: string;
  order: number;
}

export interface TourSpotReview {
  id: string;
  title?: string;
  description?: string;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    userName: string;
    imageUrl?: string;
  };
}

export interface TourSpotLocation {
  id: string;
  name: string;
  locationType?: string;
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface TourSpotDetail {
  id: string;
  name: string;
  description?: string;
  tourType: string;
  rating?: number;
  isPopular: boolean;
  isActive: boolean;
  bestTimeToVisit?: string;
  seasonalInfo?: any;
  createdAt: string;
  location: TourSpotLocation;
  images: TourSpotImage[];
  reviews: TourSpotReview[];
  nearbyHotelsCount: number;
  nearbyActivitySpotsCount: number;
  nearbyGuidesCount: number;
}

/**
 * Fetch tour spots with optional filters
 * GET /api/tour-spots
 * Do not send spotType or maxEntryCost. Those query names are not TourSpot columns.
 */
export async function getTourSpots(filters?: TourSpotFilters): Promise<PagedResult<TourSpot>> {
  const api = getApiInstance();
  const params: Record<string, string | number | boolean> = {};
  if (filters?.isPopular !== undefined) params.isPopular = filters.isPopular;
  if (filters?.locationId) params.locationId = filters.locationId;
  if (filters?.divisionId) params.divisionId = filters.divisionId;
  if (filters?.name) params.name = filters.name;
  if (filters?.minRating !== undefined) params.minRating = filters.minRating;
  if (filters?.page !== undefined) params.page = filters.page;
  if (filters?.limit !== undefined) params.limit = filters.limit;

  try {
    const response = await api.get('/api/tour-spots', { params });
    return readPage(response.data?.data, mapTourSpotRow);
  } catch (error: unknown) {
    throw new Error(readApiMessage(error));
  }
}

function mapTourSpotRow(spot: any): TourSpot {
  return {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    locationId: spot.location?.id,
    locationName: spot.location?.name || 'Unknown Location',
    tourType: spot.tourType || 'MIXED',
    rating: spot.rating,
    imageUrl: spot.images?.[0]?.url || undefined,
    isPopular: spot.isPopular || false,
  };
}

/**
 * GET /api/tour-spots/popular
 */
export async function getPopularTourSpots(limit = 24): Promise<TourSpot[]> {
  const api = getApiInstance();
  try {
    const response = await api.get('/api/tour-spots/popular', { params: { limit } });
    return readPage(response.data?.data, mapTourSpotRow).results;
  } catch (error: unknown) {
    throw new Error(readApiMessage(error));
  }
}

function readApiMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || 'Request failed';
}

function readPage<T>(data: unknown, mapRow: (row: any) => T): PagedResult<T> {
  const rows = unwrapList<any>(data);
  const payload = data && typeof data === 'object' && !Array.isArray(data)
    ? data as { total?: number; page?: number; limit?: number }
    : {};
  return {
    results: rows.map(mapRow),
    total: typeof payload.total === 'number' ? payload.total : rows.length,
    page: typeof payload.page === 'number' ? payload.page : 1,
    limit: typeof payload.limit === 'number' ? payload.limit : (rows.length || 20),
  };
}

/**
 * Fetch single tour spot detail by ID
 * GET /api/tour-spots/:id
 */
export async function getTourSpotDetail(id: string): Promise<TourSpotDetail> {
  const api = getApiInstance();
  
  console.log('[getTourSpotDetail] 🔍 Fetching spot:', id);

  const response = await api.get(`/api/tour-spots/${id}`);
  const spot = response.data.data;

  return {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    tourType: spot.tourType || 'MIXED',
    rating: spot.rating,
    isPopular: spot.isPopular || false,
    isActive: spot.isActive || false,
    bestTimeToVisit: spot.bestTimeToVisit,
    seasonalInfo: spot.seasonalInfo,
    createdAt: spot.createdAt,
    location: {
      id: spot.location.id,
      name: spot.location.name,
      locationType: spot.location.locationType,
      country: spot.location.country,
      state: spot.location.state,
      city: spot.location.city,
      latitude: spot.location.latitude,
      longitude: spot.location.longitude,
    },
    images: spot.images?.map((img: any) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      order: img.order,
    })) || [],
    reviews: spot.reviews?.map((review: any) => ({
      id: review.id,
      title: review.title,
      description: review.description,
      rating: review.rating,
      createdAt: review.createdAt,
      user: {
        id: review.user.id,
        userName: review.user.userName,
        imageUrl: review.user.imageUrl,
      },
    })) || [],
    nearbyHotelsCount: typeof spot.nearbyHotelsCount === 'number' ? spot.nearbyHotelsCount : 0,
    nearbyActivitySpotsCount: typeof spot.nearbyActivitySpotsCount === 'number' ? spot.nearbyActivitySpotsCount : 0,
    nearbyGuidesCount: typeof spot.nearbyGuidesCount === 'number' ? spot.nearbyGuidesCount : 0,
  };
}
