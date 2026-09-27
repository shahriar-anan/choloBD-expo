/**
 * Tour Builder Redux Slice
 * State management for tour packages, filtering, and CRUD operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  TourPackage,
  TourFilters,
  CreateTourPlanData,
  UpdateTourPlanData,
  TourApiError,
} from '../../types/tours';
import * as tourApi from '../../services/api/tourBuilder';

/**
 * Tour builder state shape
 */
export interface TourBuilderState {
  // List view state
  list: TourPackage[];
  listLoading: boolean;
  listError: TourApiError | null;

  // Detail view state
  detail: TourPackage | null;
  detailLoading: boolean;
  detailError: TourApiError | null;

  // Form submission state
  formLoading: boolean;
  formError: TourApiError | null;

  // Filters
  filters: TourFilters;

  // Admin mode
  adminMode: boolean;
}

const initialState: TourBuilderState = {
  list: [],
  listLoading: false,
  listError: null,
  detail: null,
  detailLoading: false,
  detailError: null,
  formLoading: false,
  formError: null,
  filters: {},
  adminMode: false,
};

/**
 * Async thunk: Fetch tour list
 */
export const fetchTourPlans = createAsyncThunk(
  'tourBuilder/fetchTourPlans',
  async (filters: TourFilters | undefined, { rejectWithValue }) => {
    try {
      const tours = await tourApi.getTourPlans(filters);
      return tours;
    } catch (error: any) {
      if (__DEV__) console.error('[tourBuilderSlice] fetchTourPlans error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Catalog tour packages for admin screens (replaces removed by-admin list).
 */
export const fetchTourPlansByAdmin = createAsyncThunk(
  'tourBuilder/fetchTourPlansByAdmin',
  async ({ filters }: { adminId?: string; filters?: TourFilters } = {}, { rejectWithValue }) => {
    try {
      const tours = await tourApi.getTourPlans(filters);
      return tours;
    } catch (error: any) {
      if (__DEV__) console.error('[tourBuilderSlice] fetchTourPlansByAdmin error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Fetch single tour detail
 */
export const fetchTourPlanDetail = createAsyncThunk(
  'tourBuilder/fetchTourPlanDetail',
  async (tourPackageId: string, { rejectWithValue }) => {
    try {
      const tour = await tourApi.getTourPlan(tourPackageId);
      return tour;
    } catch (error: any) {
      if (__DEV__) console.error('[tourBuilderSlice] fetchTourPlanDetail error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Create tour plan
 */
export const createTourPlanAsync = createAsyncThunk(
  'tourBuilder/createTourPlan',
  async (payload: CreateTourPlanData, { rejectWithValue }) => {
    try {
      const tour = await tourApi.createTourPlan(payload);
      return tour;
    } catch (error: any) {
      if (__DEV__) console.error('[tourBuilderSlice] createTourPlan error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Update tour plan
 */
export const updateTourPlanAsync = createAsyncThunk(
  'tourBuilder/updateTourPlan',
  async (
    { id, payload }: { id: string; payload: UpdateTourPlanData },
    { rejectWithValue }
  ) => {
    try {
      const tour = await tourApi.updateTourPlan(id, payload);
      return tour;
    } catch (error: any) {
      if (__DEV__) console.error('[tourBuilderSlice] updateTourPlan error:', error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Async thunk: Delete tour plan
 */
export const deleteTourPlanAsync = createAsyncThunk(
  'tourBuilder/deleteTourPlan',
  async (tourPackageId: string, { rejectWithValue }) => {
    try {
      await tourApi.deleteTourPlan(tourPackageId);
      return tourPackageId;
    } catch (error: any) {
      if (__DEV__) console.error('[tourBuilderSlice] deleteTourPlan error:', error);
      return rejectWithValue(error);
    }
  }
);

const tourBuilderSlice = createSlice({
  name: 'tourBuilder',
  initialState,
  reducers: {
    /**
     * Update filters and keep in state for re-fetching
     */
    setFilters(state, action: PayloadAction<TourFilters>) {
      state.filters = action.payload;
    },

    /**
     * Clear all filters
     */
    clearFilters(state) {
      state.filters = {};
    },

    /**
     * Set admin mode
     */
    setAdminMode(state, action: PayloadAction<boolean>) {
      state.adminMode = action.payload;
    },

    /**
     * Clear list and detail
     */
    clearTourData(state) {
      state.list = [];
      state.detail = null;
      state.listError = null;
      state.detailError = null;
    },

    /**
     * Clear form error
     */
    clearFormError(state) {
      state.formError = null;
    },

    /**
     * Clear detail
     */
    clearDetail(state) {
      state.detail = null;
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch tour plans
    builder
      .addCase(fetchTourPlans.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchTourPlans.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
        state.listError = null;
      })
      .addCase(fetchTourPlans.rejected, (state, action: any) => {
        state.listLoading = false;
        state.listError = action.payload;
      });

    // Fetch tour plans by admin
    builder
      .addCase(fetchTourPlansByAdmin.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchTourPlansByAdmin.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
        state.listError = null;
      })
      .addCase(fetchTourPlansByAdmin.rejected, (state, action: any) => {
        state.listLoading = false;
        state.listError = action.payload;
      });

    // Fetch tour detail
    builder
      .addCase(fetchTourPlanDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchTourPlanDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
        state.detailError = null;
      })
      .addCase(fetchTourPlanDetail.rejected, (state, action: any) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });

    // Create tour plan
    builder
      .addCase(createTourPlanAsync.pending, (state) => {
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(createTourPlanAsync.fulfilled, (state, action) => {
        state.formLoading = false;
        state.formError = null;
        // Add to list
        state.list.push(action.payload);
        // Set as detail
        state.detail = action.payload;
      })
      .addCase(createTourPlanAsync.rejected, (state, action: any) => {
        state.formLoading = false;
        state.formError = action.payload;
      });

    // Update tour plan
    builder
      .addCase(updateTourPlanAsync.pending, (state) => {
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(updateTourPlanAsync.fulfilled, (state, action) => {
        state.formLoading = false;
        state.formError = null;
        // Update in list
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx >= 0) {
          state.list[idx] = action.payload;
        }
        // Update detail
        if (state.detail?.id === action.payload.id) {
          state.detail = action.payload;
        }
      })
      .addCase(updateTourPlanAsync.rejected, (state, action: any) => {
        state.formLoading = false;
        state.formError = action.payload;
      });

    // Delete tour plan
    builder
      .addCase(deleteTourPlanAsync.pending, (state) => {
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(deleteTourPlanAsync.fulfilled, (state, action) => {
        state.formLoading = false;
        state.formError = null;
        // Remove from list
        state.list = state.list.filter((t) => t.id !== action.payload);
        // Clear detail if it was deleted
        if (state.detail?.id === action.payload) {
          state.detail = null;
        }
      })
      .addCase(deleteTourPlanAsync.rejected, (state, action: any) => {
        state.formLoading = false;
        state.formError = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setAdminMode, clearTourData, clearFormError, clearDetail } = tourBuilderSlice.actions;

export default tourBuilderSlice.reducer;
