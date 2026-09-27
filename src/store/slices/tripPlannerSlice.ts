/**
 * Trip Planner Redux Slice
 * State management for user trip plans, segments, and CRUD operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  TripPlan,
  TripSummary,
  UserSegment,
  TripFilters,
  CreateTripData,
  UpdateTripData,
  CreateSegmentData,
  UpdateSegmentData,
  TripApiError,
  PaginationInfo,
} from '../../types/trips';
import { Location } from '../../types/locations';
import { Spot } from '../../components/tripPlanner/SpotsSelection';
import * as tripApi from '../../services/api/tripPlanner';

console.log('[tripPlannerSlice] Initializing trip planner slice...');

/**
 * Trip planner state shape
 */
export interface TripPlannerState {
  // List view state
  list: TripPlan[];
  pagination: PaginationInfo | null;
  listLoading: boolean;
  listError: TripApiError | null;

  // Detail view state
  currentTrip: TripPlan | null;
  currentSegments: UserSegment[];
  detailLoading: boolean;
  detailError: TripApiError | null;

  // Summary state
  tripSummary: TripSummary | null;
  summaryLoading: boolean;
  summaryError: TripApiError | null;

  // Form submission state
  formLoading: boolean;
  formError: TripApiError | null;

  // Filters
  filters: TripFilters;

  // Wizard state for trip creation flow
  wizard: {
    currentStep: number;
    selectedLocation: Location | null;
    startDate: string | null; // ISO string format
    endDate: string | null; // ISO string format
    selectedSpots: Spot[];
  };
}

const initialState: TripPlannerState = {
  list: [],
  pagination: null,
  listLoading: false,
  listError: null,
  currentTrip: null,
  currentSegments: [],
  detailLoading: false,
  detailError: null,
  tripSummary: null,
  summaryLoading: false,
  summaryError: null,
  formLoading: false,
  formError: null,
  filters: {},
  wizard: {
    currentStep: 0,
    selectedLocation: null,
    startDate: null,
    endDate: null,
    selectedSpots: [],
  },
};

/**
 * Async thunk: Fetch user's trips
 */
export const fetchTrips = createAsyncThunk(
  'tripPlanner/fetchTrips',
  async (filters: TripFilters | undefined, { rejectWithValue }) => {
    try {
      console.log('[tripPlannerSlice] Fetching trips with filters:', filters);
      const { trips, pagination } = await tripApi.getTrips(filters);
      console.log('[tripPlannerSlice] Fetched', trips.length, 'trips');
      return { trips, pagination };
    } catch (error: any) {
      console.error('[tripPlannerSlice] fetchTrips error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Fetch single trip detail with all segments
 */
export const fetchTripDetail = createAsyncThunk(
  'tripPlanner/fetchTripDetail',
  async (tripId: string, { rejectWithValue }) => {
    try {
      console.log('[tripPlannerSlice] Fetching trip detail:', tripId);
      const trip = await tripApi.getTripDetails(tripId);
      console.log('[tripPlannerSlice] Fetched trip:', trip.name);
      console.log('[tripPlannerSlice] Segments count:', trip.userSegments?.length);
      return trip;
    } catch (error: any) {
      console.error('[tripPlannerSlice] fetchTripDetail error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Create new trip plan
 */
export const createTripAsync = createAsyncThunk(
  'tripPlanner/createTrip',
  async (payload: CreateTripData, { rejectWithValue }) => {
    try {
      console.log('[tripPlannerSlice] ========== THUNK: CREATE TRIP ==========');
      console.log('[tripPlannerSlice] Trip Name:', payload.name);
      console.log('[tripPlannerSlice] Calling tripApi.createTrip()...');
      const trip = await tripApi.createTrip(payload);
      console.log('[tripPlannerSlice] ✅ Trip created by API:', trip.id);
      return trip;
    } catch (error: any) {
      console.error('[tripPlannerSlice] ❌ createTrip thunk error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Update trip plan
 */
export const updateTripAsync = createAsyncThunk(
  'tripPlanner/updateTrip',
  async (
    { id, payload }: { id: string; payload: UpdateTripData },
    { rejectWithValue }
  ) => {
    try {
      console.log('[tripPlannerSlice] Updating trip:', id);
      const trip = await tripApi.updateTrip(id, payload);
      console.log('[tripPlannerSlice] Trip updated:', trip.id);
      return trip;
    } catch (error: any) {
      console.error('[tripPlannerSlice] updateTrip error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Delete trip plan
 */
export const deleteTripAsync = createAsyncThunk(
  'tripPlanner/deleteTrip',
  async (tripId: string, { rejectWithValue }) => {
    try {
      console.log('[tripPlannerSlice] Deleting trip:', tripId);
      await tripApi.deleteTrip(tripId);
      console.log('[tripPlannerSlice] Trip deleted:', tripId);
      return tripId;
    } catch (error: any) {
      console.error('[tripPlannerSlice] deleteTrip error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Add segment to trip
 */
export const addSegmentAsync = createAsyncThunk(
  'tripPlanner/addSegment',
  async (
    { tripId, payload }: { tripId: string; payload: CreateSegmentData },
    { rejectWithValue }
  ) => {
    try {
      console.log('[tripPlannerSlice] Adding segment to trip:', tripId);
      const trip = await tripApi.addSegment(tripId, payload);
      return trip;
    } catch (error: any) {
      console.error('[tripPlannerSlice] addSegment error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Update segment
 */
export const updateSegmentAsync = createAsyncThunk(
  'tripPlanner/updateSegment',
  async (
    {
      tripId,
      segmentId,
      payload,
    }: { tripId: string; segmentId: string; payload: UpdateSegmentData },
    { rejectWithValue }
  ) => {
    try {
      console.log('[tripPlannerSlice] Updating segment:', segmentId, 'trip:', tripId);
      const trip = await tripApi.updateSegment(tripId, segmentId, payload);
      return trip;
    } catch (error: any) {
      console.error('[tripPlannerSlice] updateSegment error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Delete segment
 */
export const deleteSegmentAsync = createAsyncThunk(
  'tripPlanner/deleteSegment',
  async (
    { tripId, segmentId }: { tripId: string; segmentId: string },
    { rejectWithValue }
  ) => {
    try {
      console.log('[tripPlannerSlice] Deleting segment:', segmentId);
      const trip = await tripApi.deleteSegment(tripId, segmentId);
      return trip;
    } catch (error: any) {
      console.error('[tripPlannerSlice] deleteSegment error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Fetch trip summary with cost breakdown
 */
export const fetchTripSummary = createAsyncThunk(
  'tripPlanner/fetchTripSummary',
  async (tripId: string, { rejectWithValue }) => {
    try {
      console.log('[tripPlannerSlice] Fetching trip summary:', tripId);
      const summary = await tripApi.getTripSummary(tripId);
      console.log('[tripPlannerSlice] Summary fetched - Total cost:', summary.totalEstimatedCost);
      return summary;
    } catch (error: any) {
      console.error('[tripPlannerSlice] fetchTripSummary error:', error);
      return rejectWithValue(error);
    }
  }
);

const tripPlannerSlice = createSlice({
  name: 'tripPlanner',
  initialState,
  reducers: {
    /**
     * Wizard: Set selected location
     */
    setWizardLocation(state, action: PayloadAction<Location | null>) {
      console.log('[tripPlannerSlice] Setting wizard location:', action.payload?.name);
      state.wizard.selectedLocation = action.payload;
      // Auto-advance to next step
      if (action.payload) {
        state.wizard.currentStep = 1;
      }
    },

    /**
     * Wizard: Set date range
     */
    setWizardDates(state, action: PayloadAction<{ startDate: string; endDate: string }>) {
      console.log('[tripPlannerSlice] Setting wizard dates');
      state.wizard.startDate = action.payload.startDate;
      state.wizard.endDate = action.payload.endDate;
      // Auto-advance to next step
      state.wizard.currentStep = 2;
    },

    /**
     * Wizard: Set selected spots
     */
    setWizardSpots(state, action: PayloadAction<Spot[]>) {
      console.log('[tripPlannerSlice] Setting wizard spots, count:', action.payload.length);
      state.wizard.selectedSpots = action.payload;
    },

    /**
     * Wizard: Set current step
     */
    setWizardStep(state, action: PayloadAction<number>) {
      console.log('[tripPlannerSlice] Setting wizard step:', action.payload);
      state.wizard.currentStep = action.payload;
    },

    /**
     * Wizard: Reset wizard state
     */
    resetWizard(state) {
      console.log('[tripPlannerSlice] Resetting wizard');
      state.wizard = {
        currentStep: 0,
        selectedLocation: null,
        startDate: null,
        endDate: null,
        selectedSpots: [],
      };
    },

    /**
     * Update filters and keep in state for re-fetching
     */
    setFilters(state, action: PayloadAction<TripFilters>) {
      console.log('[tripPlannerSlice] Setting filters:', action.payload);
      state.filters = action.payload;
    },

    /**
     * Clear all filters
     */
    clearFilters(state) {
      console.log('[tripPlannerSlice] Clearing filters');
      state.filters = {};
    },

    /**
     * Clear all trip data
     */
    clearTripsData(state) {
      console.log('[tripPlannerSlice] Clearing all trips data');
      state.list = [];
      state.currentTrip = null;
      state.currentSegments = [];
      state.pagination = null;
      state.listError = null;
      state.detailError = null;
    },

    /**
     * Clear current trip and segments
     */
    clearCurrentTrip(state) {
      console.log('[tripPlannerSlice] Clearing current trip');
      state.currentTrip = null;
      state.currentSegments = [];
      state.detailError = null;
      state.tripSummary = null;
    },

    /**
     * Clear form error
     */
    clearFormError(state) {
      console.log('[tripPlannerSlice] Clearing form error');
      state.formError = null;
    },

    /**
     * Clear trip summary
     */
    clearTripSummary(state) {
      console.log('[tripPlannerSlice] Clearing trip summary');
      state.tripSummary = null;
      state.summaryError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch trips
    builder
      .addCase(fetchTrips.pending, (state) => {
        console.log('[tripPlannerSlice] fetchTrips pending');
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        console.log('[tripPlannerSlice] fetchTrips fulfilled, count:', action.payload.trips.length);
        state.listLoading = false;
        state.list = action.payload.trips;
        state.pagination = action.payload.pagination;
        state.listError = null;
      })
      .addCase(fetchTrips.rejected, (state, action: any) => {
        console.error('[tripPlannerSlice] fetchTrips rejected:', action.payload);
        state.listLoading = false;
        state.listError = action.payload;
      });

    // Fetch trip detail
    builder
      .addCase(fetchTripDetail.pending, (state) => {
        console.log('[tripPlannerSlice] fetchTripDetail pending');
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchTripDetail.fulfilled, (state, action) => {
        console.log('[tripPlannerSlice] fetchTripDetail fulfilled:', action.payload.name);
        state.detailLoading = false;
        state.currentTrip = action.payload;
        state.currentSegments = action.payload.userSegments || [];
        state.detailError = null;
      })
      .addCase(fetchTripDetail.rejected, (state, action: any) => {
        console.error('[tripPlannerSlice] fetchTripDetail rejected:', action.payload);
        state.detailLoading = false;
        state.detailError = action.payload;
      });

    // Create trip
    builder
      .addCase(createTripAsync.pending, (state) => {
        console.log('[tripPlannerSlice] ⏳ createTrip PENDING');
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(createTripAsync.fulfilled, (state, action) => {
        console.log('[tripPlannerSlice] ✅ createTrip FULFILLED');
        state.formLoading = false;
        state.formError = null;
        state.list.push(action.payload);
        state.currentTrip = action.payload;
        state.currentSegments = action.payload.userSegments || [];
      })
      .addCase(createTripAsync.rejected, (state, action: any) => {
        console.error('[tripPlannerSlice] ❌ createTrip REJECTED');
        state.formLoading = false;
        state.formError = action.payload;
      });

    // Update trip
    builder
      .addCase(updateTripAsync.pending, (state) => {
        console.log('[tripPlannerSlice] updateTrip pending');
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(updateTripAsync.fulfilled, (state, action) => {
        console.log('[tripPlannerSlice] updateTrip fulfilled:', action.payload.id);
        state.formLoading = false;
        state.formError = null;
        // Update in list
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx >= 0) {
          state.list[idx] = action.payload;
        }
        // Update current trip
        if (state.currentTrip?.id === action.payload.id) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(updateTripAsync.rejected, (state, action: any) => {
        console.error('[tripPlannerSlice] updateTrip rejected:', action.payload);
        state.formLoading = false;
        state.formError = action.payload;
      });

    // Delete trip
    builder
      .addCase(deleteTripAsync.pending, (state) => {
        console.log('[tripPlannerSlice] deleteTrip pending');
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(deleteTripAsync.fulfilled, (state, action) => {
        console.log('[tripPlannerSlice] deleteTrip fulfilled:', action.payload);
        state.formLoading = false;
        state.formError = null;
        state.list = state.list.filter((t) => t.id !== action.payload);
        if (state.currentTrip?.id === action.payload) {
          state.currentTrip = null;
          state.currentSegments = [];
        }
      })
      .addCase(deleteTripAsync.rejected, (state, action: any) => {
        console.error('[tripPlannerSlice] deleteTrip rejected:', action.payload);
        state.formLoading = false;
        state.formError = action.payload;
      });

    // Add segment
    builder
      .addCase(addSegmentAsync.pending, (state) => {
        console.log('[tripPlannerSlice] addSegment pending');
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(addSegmentAsync.fulfilled, (state, action) => {
        state.formLoading = false;
        state.formError = null;
        state.currentTrip = action.payload;
        state.currentSegments = action.payload.userSegments || [];
      })
      .addCase(addSegmentAsync.rejected, (state, action: any) => {
        console.error('[tripPlannerSlice] addSegment rejected:', action.payload);
        state.formLoading = false;
        state.formError = action.payload;
      });

    // Update segment
    builder
      .addCase(updateSegmentAsync.pending, (state) => {
        console.log('[tripPlannerSlice] updateSegment pending');
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(updateSegmentAsync.fulfilled, (state, action) => {
        state.formLoading = false;
        state.formError = null;
        state.currentTrip = action.payload;
        state.currentSegments = action.payload.userSegments || [];
      })
      .addCase(updateSegmentAsync.rejected, (state, action: any) => {
        console.error('[tripPlannerSlice] updateSegment rejected:', action.payload);
        state.formLoading = false;
        state.formError = action.payload;
      });

    // Delete segment
    builder
      .addCase(deleteSegmentAsync.pending, (state) => {
        console.log('[tripPlannerSlice] deleteSegment pending');
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(deleteSegmentAsync.fulfilled, (state, action) => {
        state.formLoading = false;
        state.formError = null;
        state.currentTrip = action.payload;
        state.currentSegments = action.payload.userSegments || [];
      })
      .addCase(deleteSegmentAsync.rejected, (state, action: any) => {
        console.error('[tripPlannerSlice] deleteSegment rejected:', action.payload);
        state.formLoading = false;
        state.formError = action.payload;
      });

    // Fetch trip summary
    builder
      .addCase(fetchTripSummary.pending, (state) => {
        console.log('[tripPlannerSlice] fetchTripSummary pending');
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchTripSummary.fulfilled, (state, action) => {
        console.log('[tripPlannerSlice] fetchTripSummary fulfilled');
        state.summaryLoading = false;
        state.tripSummary = action.payload;
        state.summaryError = null;
      })
      .addCase(fetchTripSummary.rejected, (state, action: any) => {
        console.error('[tripPlannerSlice] fetchTripSummary rejected:', action.payload);
        state.summaryLoading = false;
        state.summaryError = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearTripsData,
  clearCurrentTrip,
  clearFormError,
  clearTripSummary,
  setWizardLocation,
  setWizardDates,
  setWizardSpots,
  setWizardStep,
  resetWizard,
} = tripPlannerSlice.actions;

export default tripPlannerSlice.reducer;

console.log('[tripPlannerSlice] Slice initialized');
