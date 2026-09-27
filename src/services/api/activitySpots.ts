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
  const response = await api.get(`/api/activity-spots/${activitySpotId}`);
  const spot = response.data?.data;
  if (!spot) return null;
  return {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    location: [spot.city, spot.state, spot.country].filter(Boolean).join(', ') || 'Unknown Location',
    imageUrl: spot.imageUrl,
    rating: spot.rating,
  };
}
