/**
 * Tour Builder Types
 * Comprehensive type definitions for tour packages, day segments, and related data
 */

/**
 * Tour type options (from backend enum)
 */
export type TourType = 'ADVENTURE' | 'CULTURAL' | 'BEACH' | 'CITY_TOUR' | 'NATURE' | 'RELIGIOUS' | 'HISTORICAL' | 'MIXED';

/**
 * Transport service type options (from backend enum)
 */
export type TransportServiceType = 'BUS' | 'FLIGHT' | 'TRAIN' | 'CAR_RENTAL' | 'FERRY' | 'SELF_MANAGED';

/**
 * Transport quality type options (from backend enum)
 * Different transport types support different quality values
 */
export type TransportQualityType =
  // BUS qualities
  | 'AC_SLEEPER'
  | 'NON_AC_SLEEPER'
  | 'AC_SEATER'
  | 'NON_AC_SEATER'
  | 'DELUXE'
  | 'SEMI_DELUXE'
  | 'LUXURY'
  // FLIGHT qualities
  | 'ECONOMY'
  | 'BUSINESS'
  | 'FIRST_CLASS'
  | 'PREMIUM_ECONOMY'
  // TRAIN qualities
  | 'AC_1_TIER'
  | 'AC_2_TIER'
  | 'AC_3_TIER'
  | 'SLEEPER'
  | 'GENERAL'
  | 'CHAIR_CAR';

/**
 * Mapping of transport options to their valid quality values
 */
export const TRANSPORT_QUALITY_MAP: Record<TransportServiceType, TransportQualityType[] | null> = {
  BUS: ['AC_SLEEPER', 'NON_AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'DELUXE', 'SEMI_DELUXE', 'LUXURY'],
  FLIGHT: ['ECONOMY', 'BUSINESS', 'FIRST_CLASS', 'PREMIUM_ECONOMY'],
  TRAIN: ['AC_1_TIER', 'AC_2_TIER', 'AC_3_TIER', 'SLEEPER', 'GENERAL', 'CHAIR_CAR'],
  CAR_RENTAL: null, // Not applicable
  FERRY: null, // Not applicable
  SELF_MANAGED: null, // Not applicable
};

/**
 * Hotel option type (from backend enum)
 */
export type HotelOptionType = 'LUXURY' | 'BUDGET' | 'BOUTIQUE' | 'RESORT' | 'HOSTEL' | 'GUESTHOUSE' | 'APARTMENT';

/**
 * Input interface for a single day segment when creating/updating a tour
 */
export interface TourDaySegmentInput {
  dayNumber: number;
  tourSpotId: string;
  activitySpotId?: string;
  transportOption: TransportServiceType;
  transportQuality?: TransportQualityType; // Optional quality level
  hotelOption: HotelOptionType;
}

/**
 * Enriched day segment from backend with resolved spot/activity names
 */
export interface TourDaySegment extends TourDaySegmentInput {
  id?: string;
  tourSpotName: string;
  activitySpotName?: string;
}

/**
 * Payload for creating a new tour plan (admin only)
 */
export interface CreateTourPlanData {
  packageName: string;
  shortDescription?: string;
  tourType: TourType;
  duration: number;
  maxGroupSize?: number;
  locationId: string;
  totalBudget: number;
  rating?: number;
  isActive?: boolean;
  isPopular?: boolean;
  daySegments?: TourDaySegmentInput[];
}

/**
 * Payload for updating an existing tour plan (admin only)
 */
export interface UpdateTourPlanData {
  packageName?: string;
  shortDescription?: string;
  tourType?: TourType;
  duration?: number;
  maxGroupSize?: number;
  totalBudget?: number;
  rating?: number;
  isActive?: boolean;
  isPopular?: boolean;
  daySegments?: TourDaySegmentInput[];
}

/**
 * Complete tour package from backend (GET response)
 */
export interface TourPackage {
  id: string;
  packageName: string;
  shortDescription?: string;
  tourType: TourType;
  duration: number;
  maxGroupSize?: number;
  location: {
    id: string;
    name: string;
  };
  totalBudget: number;
  rating?: number;
  isActive: boolean;
  isPopular: boolean;
  images?: Array<{ url: string; order?: number }>;
  daySegments: TourDaySegment[];
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    userTripPlans: number;
  };
}

/**
 * Filters for listing tour plans
 */
export interface TourFilters {
  locationId?: string;
  tourType?: TourType;
  isActive?: boolean;
  isPopular?: boolean;
  minBudget?: number;
  maxBudget?: number;
}

/**
 * API response wrapper for tour endpoints
 */
export interface TourApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

/**
 * Typed error response from backend
 */
export interface ApiErrorResponse {
  status: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Tour builder state errors
 */
export interface TourApiError {
  type: 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'SERVER' | 'UNKNOWN';
  statusCode: number;
  message: string;
  details?: Record<string, any>;
}

/**
 * Validation result for tour data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

