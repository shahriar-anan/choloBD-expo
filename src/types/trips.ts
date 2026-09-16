/**
 * Trip Planner Types
 * Comprehensive type definitions for user trip plans, segments, and related data
 */

/**
 * Trip status lifecycle
 */
export type TripStatus = 'PLANNING' | 'SAVED' | 'BOOKED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Hotel type preference for trip (matches backend HotelType enum)
 */
export type HotelTypePreference = 'RESORT' | 'HOSTEL' | 'BOUTIQUE' | 'BUDGET' | 'LUXURY' | 'GUESTHOUSE' | 'APARTMENT';

/**
 * Transport type preference for trip (matches backend TransportServiceType enum)
 */
export type TransportTypePreference = 'BUS' | 'FLIGHT' | 'TRAIN' | 'CAR_RENTAL' | 'FERRY' | 'SELF_MANAGED';

/**
 * Budget status compared to estimated budget
 */
export type BudgetStatus = 'WITHIN_BUDGET' | 'APPROACHING_BUDGET' | 'EXCEEDED_BUDGET';

/**
 * User data in trip context
 */
export interface TripUser {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Location data in trip context
 */
export interface TripLocation {
  id: string;
  name: string;
  locationType: 'CITY' | 'REGION' | 'BEACH' | 'MOUNTAIN' | 'HILL_STATION';
  country: string;
  state?: string;
}

/**
 * Cost breakdown by category
 */
export interface CostCategory {
  total: number;
  confirmed: number;
  pending: number;
}

/**
 * Complete cost breakdown for a trip
 */
export interface CostBreakdown {
  hotel: CostCategory;
  transport: CostCategory;
  activity: CostCategory;
}

/**
 * Booking details linked to a segment (enriched from booking ID)
 */
export interface SegmentBookingDetails {
  id: string;
  type: 'HOTEL' | 'TRANSPORT' | 'ACTIVITY';
  name: string;
  cost: number;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  details?: Record<string, any>;
}

/**
 * Single day segment of a trip plan
 */
export interface UserSegment {
  id: string;
  userTripPlanId: string;
  dayNumber: number;
  segmentOrder: number;
  customNotes?: string;
  startTime?: string;
  endTime?: string;
  estimatedCost: number;
  hotelRoomBookingId?: string;
  transportBookingId?: string;
  activityBookingId?: string;
  customTourSpotId?: string;
  customActivitySpotId?: string;
  customActivitySpotName?: string;
  customHotel?: HotelTypePreference;
  customTransport?: TransportTypePreference;
  hotelDetails?: SegmentBookingDetails;
  transportDetails?: SegmentBookingDetails;
  activityDetails?: SegmentBookingDetails;
  createdAt: string;
  updatedAt: string;
}

/**
 * Complete trip plan object from backend
 */
export interface TripPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  generalNotes?: string[];
  primaryLocationId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status: TripStatus;
  estimatedBudget: number;
  actualCost?: number;
  participantCount: number;
  preferredHotelType: HotelTypePreference;
  preferredTransport: TransportTypePreference;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: TripUser;
  primaryLocation: TripLocation;
  userSegments: UserSegment[];
  _count?: {
    userSegments: number;
    tripBookings: number;
  };
}

/**
 * Trip summary with cost breakdown
 */
export interface TripSummary {
  tripId: string;
  tripName: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
  totalDays: number;
  participantCount: number;
  costBreakdown: CostBreakdown;
  totalEstimatedCost: number;
  totalConfirmedCost: number;
  totalPendingCost: number;
  costPerPerson: number;
  estimatedBudget: number;
  actualCost?: number;
  budgetStatus: BudgetStatus;
  bookingsSummary: {
    hotels: number;
    transport: number;
    activities: number;
  };
}

/**
 * Payload for creating a new trip plan
 */
export interface CreateTripData {
  name: string;
  description?: string;
  generalNotes?: string[];
  primaryLocationId: string;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  participantCount: number;
  preferredHotelType: HotelTypePreference;
  preferredTransport: TransportTypePreference;
  isPublic?: boolean;
}

/**
 * Payload for updating a trip plan
 */
export interface UpdateTripData {
  name?: string;
  description?: string;
  generalNotes?: string[];
  estimatedBudget?: number;
  status?: TripStatus;
  participantCount?: number;
  isPublic?: boolean;
}

/**
 * Payload for creating a trip segment
 */
export interface CreateSegmentData {
  dayNumber: number;
  segmentOrder?: number;
  customNotes?: string;
  startTime?: string;
  endTime?: string;
  estimatedCost?: number;
  customTourSpotId?: string;
  customActivitySpotId?: string;
  customActivitySpotName?: string;
  customHotel?: HotelTypePreference;
  customTransport?: TransportTypePreference;
}

/**
 * Payload for updating a trip segment
 */
export interface UpdateSegmentData {
  dayNumber?: number;
  segmentOrder?: number;
  customNotes?: string;
  startTime?: string;
  endTime?: string;
  estimatedCost?: number;
  hotelRoomBookingId?: string;
  transportBookingId?: string;
  activityBookingId?: string;
  customTourSpotId?: string;
  customActivitySpotId?: string;
  customActivitySpotName?: string;
  customHotel?: HotelTypePreference;
  customTransport?: TransportTypePreference;
}

/**
 * Pagination metadata in list responses
 */
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * API response wrapper for trip endpoints
 */
export interface TripApiResponse<T> {
  status: 'success' | 'failed';
  message: string;
  data: T;
  pagination?: PaginationInfo;
}

/**
 * Trip planner API errors
 */
export interface TripApiError {
  type: 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'SERVER' | 'UNKNOWN' | 'UNAUTHORIZED' | 'FORBIDDEN';
  statusCode: number;
  message: string;
  details?: Record<string, any>;
}

/**
 * Query filters for listing trips
 */
export interface TripFilters {
  status?: TripStatus;
  locationId?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

/** FE naming aliases — additive */
export type UserTripPlan = TripPlan;
export type UserTripSegment = UserSegment;

/** FE TripBooking — additive */
export interface TripBooking {
  id: string;
  userTripPlanId: string;
  userId: string;
  status: string;
  totalAmount: number;
  advanceAmount?: number;
  remainingAmount?: number;
  paymentMethod?: string;
  confirmationCode?: string;
  specialRequests?: string;
  bookedAt: Date | string;
  confirmeddAt?: Date | string;
  checkInDate?: Date | string;
  checkOutDate?: Date | string;
}


