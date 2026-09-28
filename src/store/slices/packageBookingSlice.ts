/**
 * Package Booking Redux Slice
 * State management for package bookings, filtering, and CRUD operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  PackageBooking,
  CreatePackageBookingData,
  CancelPackageBookingData,
  PackageBookingFilters,
  PackageBookingError,
  PackageBookingStats,
} from '../../types/packageBookings';
import { unwrapCancelBookingPayload } from '../../types/cancellation';
import * as packageBookingApi from '../../services/api/packageBookings';

/**
 * Package booking state shape
 */
export interface PackageBookingState {
  // List view state
  bookings: PackageBooking[];
  bookingsLoading: boolean;
  bookingsError: PackageBookingError | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };

  // Detail view state
  currentBooking: PackageBooking | null;
  currentBookingLoading: boolean;
  currentBookingError: PackageBookingError | null;

  // Purchase state
  purchaseLoading: boolean;
  purchaseError: PackageBookingError | null;
  lastPurchasedBooking: PackageBooking | null;

  // Cancel state
  cancelLoading: boolean;
  cancelError: PackageBookingError | null;

  // Filters
  filters: PackageBookingFilters;

  // Admin stats (keyed by packageId)
  stats: Record<string, PackageBookingStats>;
  statsLoading: boolean;
  statsError: PackageBookingError | null;
}

const initialState: PackageBookingState = {
  bookings: [],
  bookingsLoading: false,
  bookingsError: null,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  },
  currentBooking: null,
  currentBookingLoading: false,
  currentBookingError: null,
  purchaseLoading: false,
  purchaseError: null,
  lastPurchasedBooking: null,
  cancelLoading: false,
  cancelError: null,
  filters: {
    limit: 10,
    offset: 0,
    sortBy: 'bookingDate',
    sortOrder: 'desc',
  },
  stats: {},
  statsLoading: false,
  statsError: null,
};

/**
 * Async thunk: Purchase package
 */
export const purchasePackageAsync = createAsyncThunk(
  'packageBooking/purchasePackage',
  async (
    { tourPackageId, data }: { tourPackageId: string; data?: CreatePackageBookingData },
    { rejectWithValue }
  ) => {
    try {
      const booking = await packageBookingApi.purchasePackage(tourPackageId, data);
      return booking;
    } catch (error: any) {
      if (__DEV__) console.error('[packageBookingSlice] purchasePackage error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Fetch user's package bookings
 */
export const fetchUserPackageBookings = createAsyncThunk(
  'packageBooking/fetchUserBookings',
  async (filters: PackageBookingFilters | undefined, { rejectWithValue }) => {
    try {
      const result = await packageBookingApi.getUserPackageBookings(filters);
      return result;
    } catch (error: any) {
      if (__DEV__) console.error('[packageBookingSlice] fetchUserBookings error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Fetch single package booking detail
 */
export const fetchPackageBookingDetail = createAsyncThunk(
  'packageBooking/fetchBookingDetail',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const booking = await packageBookingApi.getPackageBookingById(bookingId);
      return booking;
    } catch (error: any) {
      if (__DEV__) console.error('[packageBookingSlice] fetchBookingDetail error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Cancel package booking
 */
export const cancelPackageBookingAsync = createAsyncThunk(
  'packageBooking/cancelBooking',
  async (
    { bookingId, data }: { bookingId: string; data?: CancelPackageBookingData },
    { rejectWithValue }
  ) => {
    try {
      return await packageBookingApi.cancelPackageBooking(bookingId, data);
    } catch (error: any) {
      if (__DEV__) console.error('[packageBookingSlice] cancelBooking error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Fetch package booking stats (admin only)
 */
export const fetchPackageBookingStats = createAsyncThunk(
  'packageBooking/fetchStats',
  async (tourPackageId: string, { rejectWithValue }) => {
    try {
      const stats = await packageBookingApi.getPackageBookingStats(tourPackageId);
      return { tourPackageId, stats };
    } catch (error: any) {
      if (__DEV__) console.error('[packageBookingSlice] fetchStats error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Fetch bookings by package ID (admin only)
 */
export const fetchPackageBookingsByPackageId = createAsyncThunk(
  'packageBooking/fetchByPackageId',
  async (
    { tourPackageId, filters }: { tourPackageId: string; filters?: PackageBookingFilters },
    { rejectWithValue }
  ) => {
    try {
      const result = await packageBookingApi.getPackageBookingsByPackageId(tourPackageId, filters);
      return result;
    } catch (error: any) {
      if (__DEV__) console.error('[packageBookingSlice] fetchByPackageId error:', error);
      return rejectWithValue(error);
    }
  }
);

const packageBookingSlice = createSlice({
  name: 'packageBooking',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<PackageBookingFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearPurchaseError: (state) => {
      state.purchaseError = null;
    },
    clearBookingsError: (state) => {
      state.bookingsError = null;
    },
    clearCurrentBookingError: (state) => {
      state.currentBookingError = null;
    },
    clearCancelError: (state) => {
      state.cancelError = null;
    },
    clearLastPurchasedBooking: (state) => {
      state.lastPurchasedBooking = null;
    },
  },
  extraReducers: (builder) => {
    // Purchase package
    builder
      .addCase(purchasePackageAsync.pending, (state) => {
        state.purchaseLoading = true;
        state.purchaseError = null;
        state.lastPurchasedBooking = null;
      })
      .addCase(purchasePackageAsync.fulfilled, (state, action) => {
        state.purchaseLoading = false;
        state.lastPurchasedBooking = action.payload;
        // Add to bookings list if it's not already there
        if (!state.bookings.find((b) => b.id === action.payload.id)) {
          state.bookings.unshift(action.payload);
        }
      })
      .addCase(purchasePackageAsync.rejected, (state, action) => {
        state.purchaseLoading = false;
        state.purchaseError = action.payload as PackageBookingError;
      });

    // Fetch user bookings
    builder
      .addCase(fetchUserPackageBookings.pending, (state) => {
        state.bookingsLoading = true;
        state.bookingsError = null;
      })
      .addCase(fetchUserPackageBookings.fulfilled, (state, action) => {
        state.bookingsLoading = false;
        state.bookings = action.payload.bookings;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUserPackageBookings.rejected, (state, action) => {
        state.bookingsLoading = false;
        state.bookingsError = action.payload as PackageBookingError;
      });

    // Fetch booking detail
    builder
      .addCase(fetchPackageBookingDetail.pending, (state) => {
        state.currentBookingLoading = true;
        state.currentBookingError = null;
      })
      .addCase(fetchPackageBookingDetail.fulfilled, (state, action) => {
        state.currentBookingLoading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchPackageBookingDetail.rejected, (state, action) => {
        state.currentBookingLoading = false;
        state.currentBookingError = action.payload as PackageBookingError;
      });

    // Cancel booking
    builder
      .addCase(cancelPackageBookingAsync.pending, (state) => {
        state.cancelLoading = true;
        state.cancelError = null;
      })
      .addCase(cancelPackageBookingAsync.fulfilled, (state, action) => {
        state.cancelLoading = false;
        const booking = unwrapCancelBookingPayload(action.payload);
        // Update in bookings list
        const index = state.bookings.findIndex((b) => b.id === booking.id);
        if (index !== -1) {
          state.bookings[index] = booking;
        }
        // Update current booking if it's the same one
        if (state.currentBooking?.id === booking.id) {
          state.currentBooking = booking;
        }
      })
      .addCase(cancelPackageBookingAsync.rejected, (state, action) => {
        state.cancelLoading = false;
        state.cancelError = action.payload as PackageBookingError;
      });

    // Fetch stats (admin)
    builder
      .addCase(fetchPackageBookingStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchPackageBookingStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        // Store stats keyed by packageId
        state.stats[action.payload.tourPackageId] = action.payload.stats;
      })
      .addCase(fetchPackageBookingStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload as PackageBookingError;
      });

    // Fetch by package ID (admin)
    builder
      .addCase(fetchPackageBookingsByPackageId.pending, (state) => {
        state.bookingsLoading = true;
        state.bookingsError = null;
      })
      .addCase(fetchPackageBookingsByPackageId.fulfilled, (state, action) => {
        state.bookingsLoading = false;
        state.bookings = action.payload.bookings;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPackageBookingsByPackageId.rejected, (state, action) => {
        state.bookingsLoading = false;
        state.bookingsError = action.payload as PackageBookingError;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  clearPurchaseError,
  clearBookingsError,
  clearCurrentBookingError,
  clearCancelError,
  clearLastPurchasedBooking,
} = packageBookingSlice.actions;

export default packageBookingSlice.reducer;
