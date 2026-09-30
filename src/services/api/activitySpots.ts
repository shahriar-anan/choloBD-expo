/**
 * Activity Spots API Service
 */

import { getApiInstance } from './axiosClient';
import { unwrapList } from './personalPlanMapping';

export interface ActivitySpot {
  id: string;
  name: string;
  description?: string;
  location: string;
  imageUrl?: string;
  rating?: number;
  entryCost?: number;
}

export async function getActivitySpots(locationId: string): Promise<ActivitySpot[]> {
  const api = getApiInstance();
  const response = await api.get('/api/activity-spots', {
    params: { locationId, limit: 100 },
  });
  const data = unwrapList<any>(response.data?.data);
  return data.map((spot: any) => ({
    id: spot.id,
    name: spot.name,
    description: spot.description,
    location:
      spot.location?.name ||
      [spot.location?.city, spot.location?.state, spot.location?.country]
        .filter(Boolean)
        .join(', ') ||
      'Unknown Location',
    imageUrl: spot.images?.[0]?.url || spot.imageUrl,
    rating: spot.rating,
  }));
}

export async function getActivitySpotById(activitySpotId: string): Promise<ActivitySpot | null> {
  const api = getApiInstance();
  try {
    const response = await api.get(`/api/activity-spots/${activitySpotId}`);
    const spot = response.data?.data;
    if (!spot) return null;
    return mapActivitySpot(spot);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    throw new Error(err.response?.data?.message || err.message || 'Request failed');
  }
}

export async function getPopularActivitySpots(limit = 8): Promise<ActivitySpot[]> {
  const api = getApiInstance();
  try {
    const response = await api.get('/api/activity-spots/popular', { params: { limit } });
    const data = unwrapList<any>(response.data?.data);
    return data.map(mapActivitySpot);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    throw new Error(err.response?.data?.message || err.message || 'Request failed');
  }
}

function mapActivitySpot(spot: any): ActivitySpot {
  const locationName =
    spot.location?.name ||
    [spot.location?.city, spot.location?.state, spot.location?.country].filter(Boolean).join(', ') ||
    [spot.city, spot.state, spot.country].filter(Boolean).join(', ') ||
    '';
  const entryCost = typeof spot.entryCost === 'number' && spot.entryCost > 0 ? spot.entryCost : undefined;
  return {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    location: locationName,
    imageUrl: spot.images?.[0]?.url || spot.imageUrl,
    rating: typeof spot.rating === 'number' ? spot.rating : undefined,
    entryCost,
  };
}
