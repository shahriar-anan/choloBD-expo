/**
 * Package Booking Logic Hook
 * Business logic for purchasing and managing package bookings
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  purchasePackageAsync,
  fetchUserPackageBookings,
  fetchPackageBookingDetail,
  cancelPackageBookingAsync,
  clearPurchaseError,
  clearCancelError,
  clearLastPurchasedBooking,
} from '../store/slices/packageBookingSlice';
import { CreatePackageBookingData, CancelPackageBookingData } from '../types/packageBookings';
import { getPackageCancellationEligibility } from '../services/api/packageBookings';
import { buildCancelSuccessMessage } from '../utilities/bookingCancelHelpers';

export function usePackageBookingLogic() {
  const dispatch = useDispatch<AppDispatch>();
  const packageBookingState = useSelector((state: RootState) => state.packageBooking);
  const auth = useSelector((state: RootState) => state.auth);

  /**
   * Purchase a tour package
   * @param tourPackageId - ID of the tour package to book
   * @param data - Booking data (quantity, special requests, notes)
   * @param onSuccess - Callback after successful purchase
   */
  const handlePurchase = useCallback(
    async (
      tourPackageId: string,
      data: CreatePackageBookingData = {},
      onSuccess?: (booking: any) => void
    ) => {
      if (!auth.user?.id) {
        Alert.alert('Authentication Required', 'Please login to book a tour package');
        return null;
      }

      try {
        const result = await dispatch(purchasePackageAsync({ tourPackageId, data })).unwrap();
        
        if (__DEV__) console.log('[usePackageBookingLogic] Purchase successful:', result.confirmationCode);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (error: any) {
        console.error('[usePackageBookingLogic] Purchase error:', error);
        const errorMessage = error?.message || 'Failed to book tour package. Please try again.';
        Alert.alert('Booking Failed', errorMessage);
        return null;
      }
    },
    [dispatch, auth.user?.id]
  );

  /**
   * Fetch user's package bookings
   * @param filters - Optional filters for bookings
   */
  const fetchMyBookings = useCallback(
    async (filters?: any) => {
      try {
        await dispatch(fetchUserPackageBookings(filters)).unwrap();
      } catch (error: any) {
        console.error('[usePackageBookingLogic] Fetch bookings error:', error);
        const errorMessage = error?.message || 'Failed to load bookings';
        Alert.alert('Error', errorMessage);
      }
    },
    [dispatch]
  );

  /**
   * Fetch single booking detail
   * @param bookingId - ID of the booking
   */
  const fetchBookingDetail = useCallback(
    async (bookingId: string) => {
      try {
        const result = await dispatch(fetchPackageBookingDetail(bookingId)).unwrap();
        return result;
      } catch (error: any) {
        console.error('[usePackageBookingLogic] Fetch booking detail error:', error);
        const errorMessage = error?.message || 'Failed to load booking details';
        Alert.alert('Error', errorMessage);
        return null;
      }
    },
    [dispatch]
  );

  /**
   * Cancel a package booking (eligibility-gated)
   */
  const handleCancelBooking = useCallback(
    async (bookingId: string, data: CancelPackageBookingData = {}, onSuccess?: () => void) => {
      try {
        const eligibility = await getPackageCancellationEligibility(bookingId);
        if (!eligibility.canCancel) {
          Alert.alert('Cannot cancel', eligibility.reason || 'This booking cannot be cancelled');
          return;
        }

        const trimmedReason = data.reason?.trim().slice(0, 500);
        const trimmedNotes = data.notes?.trim().slice(0, 500);
        const cancelPayload: CancelPackageBookingData = {
          reason: trimmedReason || undefined,
          notes: trimmedNotes || undefined,
        };

        const result = await dispatch(
          cancelPackageBookingAsync({ bookingId, data: cancelPayload })
        ).unwrap();

        if (__DEV__) console.log('[usePackageBookingLogic] Cancellation successful');
        const message = buildCancelSuccessMessage('Booking cancelled successfully', result);
        Alert.alert('Success', message);

        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        console.error('[usePackageBookingLogic] Cancel error:', error);
        const errorMessage =
          error?.message || error?.reason || 'Failed to cancel booking. Please try again.';
        Alert.alert('Cancellation Failed', errorMessage);
      }
    },
    [dispatch]
  );

  /**
   * Clear purchase error
   */
  const clearPurchaseErr = useCallback(() => {
    dispatch(clearPurchaseError());
  }, [dispatch]);

  /**
   * Clear cancel error
   */
  const clearCancelErr = useCallback(() => {
    dispatch(clearCancelError());
  }, [dispatch]);

  /**
   * Clear last purchased booking (after showing success modal)
   */
  const clearLastPurchased = useCallback(() => {
    dispatch(clearLastPurchasedBooking());
  }, [dispatch]);

  return {
    // State
    bookings: packageBookingState.bookings,
    bookingsLoading: packageBookingState.bookingsLoading,
    bookingsError: packageBookingState.bookingsError,
    currentBooking: packageBookingState.currentBooking,
    currentBookingLoading: packageBookingState.currentBookingLoading,
    purchaseLoading: packageBookingState.purchaseLoading,
    purchaseError: packageBookingState.purchaseError,
    lastPurchasedBooking: packageBookingState.lastPurchasedBooking,
    cancelLoading: packageBookingState.cancelLoading,
    cancelError: packageBookingState.cancelError,
    pagination: packageBookingState.pagination,

    // Actions
    handlePurchase,
    fetchMyBookings,
    fetchBookingDetail,
    handleCancelBooking,
    clearPurchaseErr,
    clearCancelErr,
    clearLastPurchased,
  };
}
