/**
 * Package Booking API Client
 * Handles all HTTP calls to package booking endpoints
 */

import { getApiInstance } from './axiosClient';
import {
  PackageBooking,
  CreatePackageBookingData,
  CancelPackageBookingData,
  PackageBookingFilters,
  PackageBookingApiResponse,
  PackageBookingStats,
  PackageBookingError,
} from '../../types/packageBookings';

/**
 * Helper to map HTTP errors to typed PackageBookingError
 */
function mapApiError(error: any): PackageBookingError {
  console.error('[packageBookings.ts] Mapping API error:', error?.response?.status, error?.message);

  if (error?.response?.status === 400) {
    return {
      type: 'VALIDATION',
      statusCode: 400,
      message: error?.response?.data?.message || 'Validation failed. Check your input.',
      details: error?.response?.data?.details,
    };
  } else if (error?.response?.status === 401) {
    return {
      type: 'UNAUTHORIZED',
      statusCode: 401,
      message: error?.response?.data?.message || 'Authentication required.',
      details: error?.response?.data?.details,
    };
  } else if (error?.response?.status === 403) {
    return {
      type: 'FORBIDDEN',
      statusCode: 403,
      message: error?.response?.data?.message || 'You do not have permission to access this resource.',
      details: error?.response?.data?.details,
    };
  } else if (error?.response?.status === 404) {
    return {
      type: 'NOT_FOUND',
      statusCode: 404,
      message: error?.response?.data?.message || 'Package or booking not found.',
      details: error?.response?.data?.details,
    };
  } else if (error?.response?.status === 409) {
    return {
      type: 'CONFLICT',
      statusCode: 409,
      message: error?.response?.data?.message || 'Conflict: Cannot perform this action.',
      details: error?.response?.data?.details,
    };
  } else if (error?.response?.status === 500) {
    return {
      type: 'SERVER',
      statusCode: 500,
      message: 'Server error. Please try again later.',
      details: error?.response?.data?.details,
    };
  } else {
    return {
      type: 'UNKNOWN',
      statusCode: error?.response?.status || 0,
      message: error?.message || 'An unknown error occurred.',
      details: error?.response?.data?.details,
    };
  }
}

/**
 * POST /api/bookings/package-bookings/:tourPackageId/purchase
 * Create a new package booking
 * @param tourPackageId - ID of the tour package to book
 * @param data - Booking details (quantity, requests, notes)
 * @returns Created booking with confirmation code
 */
export async function purchasePackage(
  tourPackageId: string,
  data: CreatePackageBookingData = {}
): Promise<PackageBooking> {
  try {
    console.log('[packageBookings.ts] Purchasing package:', tourPackageId, 'data:', data);
    const api = getApiInstance();

    const res = await api.post<PackageBookingApiResponse<PackageBooking>>(
      `/api/bookings/package-bookings/${tourPackageId}/purchase`,
      data
    );

    console.log('[packageBookings.ts] Purchase success, confirmationCode:', res.data.data?.confirmationCode);
    return res.data.data;
  } catch (error: any) {
    console.error('[packageBookings.ts] purchasePackage error:', error?.response?.status, error?.message);
    throw mapApiError(error);
  }
}

/**
 * GET /api/bookings/package-bookings/my-bookings
 * Fetch current user's package bookings with optional filters
 * @param filters - Query parameters for filtering and pagination
 * @returns Array of package bookings with pagination info
 */
/**
 * Dashboard-friendly wrapper around my-bookings (returns `{ results }`).
 */
export async function getPackageBookings(
  _params?: { userId?: string }
): Promise<{ results: PackageBooking[]; total?: number }> {
  const { bookings, pagination } = await getUserPackageBookings();
  return {
    results: bookings,
    total: pagination?.total ?? bookings.length,
  };
}

export async function getUserPackageBookings(
  filters?: PackageBookingFilters
): Promise<{ bookings: PackageBooking[]; pagination: any }> {
  try {
    console.log('[packageBookings.ts] Fetching user package bookings, filters:', filters);
    const api = getApiInstance();

    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
    if (filters?.limit !== undefined) params.limit = filters.limit;
    if (filters?.offset !== undefined) params.offset = filters.offset;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    const res = await api.get<PackageBookingApiResponse<PackageBooking[]>>(
      '/api/bookings/package-bookings/my-bookings',
      { params }
    );

    console.log('[packageBookings.ts] getUserPackageBookings success, count:', res.data.data?.length);
    return {
      bookings: res.data.data || [],
      pagination: res.data.pagination || { total: 0, limit: 10, offset: 0, hasMore: false },
    };
  } catch (error: any) {
    console.error('[packageBookings.ts] getUserPackageBookings error:', error?.response?.status, error?.message);
    throw mapApiError(error);
  }
}

/**
 * GET /api/bookings/package-bookings/:bookingId
 * Fetch single package booking details
 * @param bookingId - ID of the booking
 * @returns Package booking details
 */
export async function getPackageBookingById(bookingId: string): Promise<PackageBooking> {
  try {
    console.log('[packageBookings.ts] Fetching package booking detail:', bookingId);
    const api = getApiInstance();

    const res = await api.get<PackageBookingApiResponse<PackageBooking>>(
      `/api/bookings/package-bookings/${bookingId}`
    );

    console.log('[packageBookings.ts] getPackageBookingById success');
    return res.data.data;
  } catch (error: any) {
    console.error('[packageBookings.ts] getPackageBookingById error:', error?.response?.status, error?.message);
    throw mapApiError(error);
  }
}

/**
 * PUT /api/bookings/package-bookings/:bookingId/cancel
 * Cancel a PENDING package booking
 * @param bookingId - ID of the booking to cancel
 * @param data - Cancellation reason and notes
 * @returns Updated booking with CANCELLED status
 */
export async function cancelPackageBooking(
  bookingId: string,
  data: CancelPackageBookingData = {}
): Promise<PackageBooking> {
  try {
    console.log('[packageBookings.ts] Cancelling package booking:', bookingId, 'data:', data);
    const api = getApiInstance();

    const res = await api.put<PackageBookingApiResponse<PackageBooking>>(
      `/api/bookings/package-bookings/${bookingId}/cancel`,
      data
    );

    console.log('[packageBookings.ts] cancelPackageBooking success');
    return res.data.data;
  } catch (error: any) {
    console.error('[packageBookings.ts] cancelPackageBooking error:', error?.response?.status, error?.message);
    throw mapApiError(error);
  }
}

/**
 * GET /api/bookings/package-bookings/package/:tourPackageId
 * Admin only: Fetch all bookings for a specific package
 * @param tourPackageId - ID of the tour package
 * @param filters - Optional filters
 * @returns Array of bookings for the package
 */
export async function getPackageBookingsByPackageId(
  tourPackageId: string,
  filters?: PackageBookingFilters
): Promise<{ bookings: PackageBooking[]; pagination: any }> {
  try {
    console.log('[packageBookings.ts] Fetching bookings for package:', tourPackageId);
    const api = getApiInstance();

    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
    if (filters?.limit !== undefined) params.limit = filters.limit;
    if (filters?.offset !== undefined) params.offset = filters.offset;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    const res = await api.get<PackageBookingApiResponse<PackageBooking[]>>(
      `/api/bookings/package-bookings/package/${tourPackageId}`,
      { params }
    );

    console.log('[packageBookings.ts] getPackageBookingsByPackageId success, count:', res.data.data?.length);
    return {
      bookings: res.data.data || [],
      pagination: res.data.pagination || { total: 0, limit: 10, offset: 0, hasMore: false },
    };
  } catch (error: any) {
    console.error('[packageBookings.ts] getPackageBookingsByPackageId error:', error?.response?.status, error?.message);
    throw mapApiError(error);
  }
}

/**
 * GET /api/bookings/package-bookings/package/:tourPackageId/stats
 * Admin only: Fetch booking statistics for a package
 * @param tourPackageId - ID of the tour package
 * @returns Booking statistics (counts, revenue, etc.)
 */
export async function getPackageBookingStats(tourPackageId: string): Promise<PackageBookingStats> {
  try {
    console.log('[packageBookings.ts] Fetching stats for package:', tourPackageId);
    const api = getApiInstance();

    const res = await api.get<PackageBookingApiResponse<PackageBookingStats>>(
      `/api/bookings/package-bookings/package/${tourPackageId}/stats`
    );

    console.log('[packageBookings.ts] getPackageBookingStats success');
    return res.data.data;
  } catch (error: any) {
    console.error('[packageBookings.ts] getPackageBookingStats error:', error?.response?.status, error?.message);
    throw mapApiError(error);
  }
}
