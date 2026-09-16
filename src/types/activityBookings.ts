import { BookingStatus, PaymentStatus } from './enums';

/**
 * Activity Booking entity
 */
export interface ActivityBooking {
  id: string;
  activitySpotId: string;
  userId: string;
  bookingDate: Date | string;
  participantCount: number;
  specialRequirements: string | null;
  price: number;
  totalPrice: number;
  /** Prefer totalPrice (FE); kept for existing mobile screens */
  totalCost?: number;
  confirmationCode: string;
  bookingConfirmInstruction: string | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  specialRequests: string | null;
  bookedAt: Date | string;
  confirmedAt: Date | string | null;
  cancelledAt: Date | string | null;
  cancellationReason: string | null;
  activitySpot?: {
    id: string;
    name: string;
    description: string;
    entryCost: number;
    activityType: string;
    location?: {
      id: string;
      name: string;
    };
  };
  user?: {
    id: string;
    userName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  userTripSegments?: unknown[];
}

/**
 * Filters for fetching activity bookings
 */
export interface GetActivityBookingsParams {
  userId?: string;
  activitySpotId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  confirmationCode?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

/**
 * Data for creating a new activity booking
 */
export interface CreateActivityBookingData {
  activitySpotId: string;
  userId: string;
  bookingDate: string | Date;
  participantCount: number;
  specialRequirements?: string;
  paymentMethod?: 'wallet' | 'sslcommerz' | 'cash';
  specialRequests?: string;
}

/**
 * Data for updating an existing activity booking
 */
export interface UpdateActivityBookingData {
  bookingDate?: string | Date;
  participantCount?: number;
  specialRequirements?: string;
  paymentMethod?: 'wallet' | 'sslcommerz' | 'cash';
  specialRequests?: string;
}

/**
 * QR token generation result
 */
export interface GenerateActivityBookingQrResult {
  qrToken: string;
  expiresAt: string | Date;
}

/**
 * QR token validation input
 */
export interface ValidateActivityBookingQrInput {
  qrToken: string;
}
