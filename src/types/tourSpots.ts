/**
 * TourSpot — FE global.d.ts shape (additive file).
 * services/api/tourSpots.ts may still define a thinner list-card projection locally.
 */
export interface TourSpot {
  id: string;
  name: string;
  description?: string;
  locationId: string;
  bestTimeToVisit?: string;
  seasonalInfo?: Record<string, unknown>;
  tourType: string;
  rating?: number;
  nearbyHotelsCount?: number;
  nearbyGuidesCount?: number;
  nearbyActivitySpotsCount?: number;
  isPopular: boolean;
  createdAt?: Date | string;
  location?: {
    id: string;
    name: string;
  };
  reviews?: Array<{
    id: string;
    rating: number;
    description?: string;
    title?: string;
    createdAt?: string;
  }>;
  images?: Array<{
    id: string;
    url: string;
    altText?: string;
    order?: number;
  }>;
}

export interface TourSpotFilters {
  locationId?: string;
  divisionId?: string;
  name?: string;
  tourType?: string;
  isPopular?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
}
