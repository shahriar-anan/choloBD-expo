export interface GuideLocation {
  id: string;
  name: string;
}

export interface GuideSummary {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  specializations: string[];
  languages: string[];
  experienceYears: number;
  toursCompleted: number;
  rating: number;
  pricePerDay: number;
  isVerified: boolean;
  locationId?: string;
  locationName: string;
  imageUrl?: string;
  workingDays: number[];
  workingHoursStart?: string;
  workingHoursEnd?: string;
  requiresStartTime: boolean;
  unavailableDates: string[];
}

export interface GuideFilters {
  locationId?: string;
  divisionId?: string;
  specialization?: string;
  language?: string;
  name?: string;
  isVerified?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface GuideAvailability {
  available: boolean;
  reason?: string;
}

export interface CreateGuideBookingInput {
  guideId: string;
  userId: string;
  bookingDate: string;
  endTime: string;
  travelerCount: number;
  startTime?: string;
  specialRequirements?: string;
  specialRequests?: string;
}
