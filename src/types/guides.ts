/**
 * Guide Types
 * Type definitions for tour guides and guide bookings
 */

/**
 * Guide booking lifecycle status (from backend BookingStatus enum)
 */
export type GuideBookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'NO_SHOW';

/**
 * Payment status (from backend PaymentStatus enum)
 */
export type GuidePaymentStatus = 'UNPAID' | 'PAID';

/**
 * Guide specializations (from backend TourType enum)
 */
export type TourType =
  | 'ADVENTURE'
  | 'CULTURAL'
  | 'BEACH'
  | 'CITY_TOUR'
  | 'NATURE'
  | 'RELIGIOUS'
  | 'HISTORICAL'
  | 'MIXED';

/**
 * Languages a guide can speak (from backend Language enum)
 */
export type Language =
  | 'ENGLISH'
  | 'MANDARIN_CHINESE'
  | 'HINDI'
  | 'SPANISH'
  | 'FRENCH'
  | 'ARABIC'
  | 'BENGALI'
  | 'PORTUGUESE'
  | 'RUSSIAN'
  | 'URDU'
  | 'GERMAN'
  | 'JAPANESE'
  | 'KOREAN'
  | 'ITALIAN'
  | 'DUTCH'
  | 'SWEDISH'
  | 'NORWEGIAN'
  | 'DANISH'
  | 'THAI'
  | 'MALAY';

/**
 * Actions the traveler or guide operator can take on a booking
 */
export type GuideBookingAction = 'accept' | 'decline' | 'complete' | 'cancel';

/**
 * Payment methods accepted when requesting a guide
 */
export type GuidePaymentMethod = 'wallet' | 'sslcommerz' | 'cash';

/**
 * Guide entity as returned by the backend.
 * `contactEmail` / `phoneNumber` are only present for the guide's own
 * SERVICE_ADMIN, MASTER_ADMIN, or on CONFIRMED/COMPLETED bookings.
 */
export interface Guide {
  id: string;
  serviceAdminUserId: string;
  firstName: string;
  lastName: string;
  bio: string;
  specializations: TourType[];
  languages: Language[];
  toursCompleted: number;
  experienceYears: number;
  rating: number;
  pricePerDay: number;
  contactEmail?: string;
  phoneNumber?: string;
  certificationNumber?: string | null;
  licenseNumber?: string | null;
  locationId: string;
  isActive: boolean;
  isVerified: boolean;
  availabilityStatus: string;
  workingDays: number[];
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  unavailableDates?: string[] | null;
  requiresStartTime: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  location?: {
    id: string;
    name: string;
    locationType?: string;
    country?: string;
    state?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  images?: Array<{ id: string; url: string; altText?: string | null; order?: number | null }>;
  reviews?: GuideReview[];
  _count?: {
    reviews: number;
    bookings: number;
  };
}

/**
 * Review nested on a guide detail response
 */
export interface GuideReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: {
    id: string;
    userName: string;
    imageUrl?: string | null;
  };
}

/**
 * Guide booking entity as returned by the backend
 */
export interface GuideBooking {
  id: string;
  guideId: string;
  userId: string;
  bookingDate: string;
  startTime?: string | null;
  endTime: string;
  travelerCount: number;
  specialRequirements?: string | null;
  price: number;
  totalPrice: number;
  confirmationCode: string;
  status: GuideBookingStatus;
  paymentStatus: GuidePaymentStatus;
  paymentMethod?: string | null;
  paymentExpiresAt?: string | null;
  specialRequests?: string | null;
  bookedAt: string;
  acceptedAt?: string | null;
  confirmedAt?: string | null;
  declinedAt?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  declinedReason?: string | null;
  cancellationReason?: string | null;
  // Populated relations
  guide?: Guide;
  user?: {
    id: string;
    userName: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
  };
}

/**
 * Filters for listing guides
 */
export interface GuideFilters {
  locationId?: string;
  divisionId?: string;
  specialization?: TourType;
  language?: Language;
  name?: string;
  isActive?: boolean;
  isVerified?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
}

/**
 * Query params for guide keyword search (`q` is required)
 */
export interface GuideSearchParams extends GuideFilters {
  q: string;
}

/**
 * Query params for the availability check endpoint.
 * Dates must be ISO8601 strings.
 */
export interface GuideAvailabilityParams {
  bookingDate: string;
  endTime: string;
  startTime?: string;
}

/**
 * Availability check result — never throws for an unavailable guide
 */
export interface GuideAvailabilityResult {
  available: boolean;
  reason?: string;
}

/**
 * Payload for requesting a guide (POST /api/bookings/guides).
 * `userId` is injected by the booking hook from the authenticated user.
 */
export interface CreateGuideBookingData {
  guideId: string;
  userId: string;
  bookingDate: string;
  endTime: string;
  travelerCount: number;
  startTime?: string;
  specialRequirements?: string;
  specialRequests?: string;
  paymentMethod?: GuidePaymentMethod;
}

/**
 * Filters for listing guide bookings
 */
export interface GuideBookingFilters {
  userId?: string;
  guideId?: string;
  status?: GuideBookingStatus;
  paymentStatus?: GuidePaymentStatus;
  confirmationCode?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

/**
 * Payload for the booking status transition endpoint
 */
export interface UpdateGuideBookingStatusData {
  action: GuideBookingAction;
  reason?: string;
}

/**
 * Payload for a guide operator updating their own availability
 */
export interface UpdateGuideAvailabilityData {
  workingDays?: number[];
  workingHoursStart?: string;
  workingHoursEnd?: string;
  unavailableDates?: string[];
  availabilityStatus?: string;
}

/**
 * Payload for a guide operator updating their own profile
 */
export interface UpdateGuideData {
  bio?: string;
  specializations?: TourType[];
  languages?: Language[];
  experienceYears?: number;
  pricePerDay?: number;
  contactEmail?: string;
  phoneNumber?: string;
  certificationNumber?: string;
  licenseNumber?: string;
  locationId?: string;
  requiresStartTime?: boolean;
  workingDays?: number[];
  workingHoursStart?: string;
  workingHoursEnd?: string;
  imageURLs?: string[];
  imageIdsToDelete?: string[];
}

/**
 * Paginated payload shape returned by list endpoints when page+limit are sent
 */
export interface GuidePaginatedResult<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * API response wrapper for guide endpoints
 */
export interface GuideApiResponse<T> {
  status: 'success' | 'failed' | 'error';
  message: string;
  data: T;
}

/**
 * Guide domain error types
 */
export interface GuideError {
  type: 'VALIDATION' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CONFLICT' | 'SERVER' | 'UNKNOWN';
  statusCode: number;
  message: string;
  details?: Record<string, any>;
}

/** FE GuideAvailability schedule shape — additive (does not replace GuideAvailabilityResult) */
export interface GuideAvailability {
  workingDays: number[];
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  unavailableDates?: string[] | null;
  availabilityStatus: string;
  requiresStartTime: boolean;
}

