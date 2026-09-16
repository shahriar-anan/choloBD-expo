/**
 * ActivitySpot — FE global.d.ts shape (additive file).
 * services/api/activitySpots.ts may still define a thinner list-card projection locally.
 */
export interface ActivitySpot {
  id: string;
  name: string;
  description: string;
  locationId: string;
  addressId?: string;
  phoneNumber?: string;
  extraPhoneNumbers?: string[];
  entryCost: number;
  maxBookingsPerDay?: number;
  bookingConfirmInstruction?: string | null;
  openingHours?: string;
  closingHours?: string;
  bestTimeToVisit?: string;
  duration?: string;
  ageRestriction?: string;
  activityType: string;
  nearbyHotelsCount?: number;
  nearbyGuidesCount?: number;
  rating?: number;
  isActive: boolean;
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
  }>;
  images?: Array<{
    id: string;
    url: string;
    altText?: string;
  }>;
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
