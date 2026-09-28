import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { createBooking, updateBooking, getUserBookings, getBookingById, getHotelCancellationEligibility, cancelHotelBooking } from '../services/api/bookings';
import { CancellationEligibility } from '../types/cancellation';
import { buildCancelSuccessMessage } from '../utilities/bookingCancelHelpers';
import { guestContactIsComplete } from '../components/forms/hotelBookingForm';

export function useBookingLogic() {
  const auth = useSelector((s: RootState) => s.auth);
  const [submitting, setSubmitting] = useState(false);

  const [loadingBookings, setLoadingBookings] = useState(false);

  const submitBooking = async (bookingData: {
    hotelId: string;
    checkInDate: string;
    checkOutDate: string;
    selectedRoomsMap: Record<string, number>;
    guestName: string;
    guestEmail: string;
    guestPhoneNumber: string;
    paymentMethod?: string;
    specialRequests?: string;
  }) => {
    if (!bookingData.hotelId) {
      Alert.alert('Error', 'Hotel ID is required');
      return null;
    }
    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      Alert.alert('Error', 'Please enter check-in and check-out dates');
      return null;
    }
    const anyRooms = Object.values(bookingData.selectedRoomsMap).some((v) => v > 0);
    if (!anyRooms) {
      Alert.alert('Error', 'Please select at least one room');
      return null;
    }
    if (!guestContactIsComplete(bookingData.guestName, bookingData.guestEmail, bookingData.guestPhoneNumber)) {
      Alert.alert('Error', 'Enter the guest name, a valid email, and a mobile number');
      return null;
    }

    setSubmitting(true);
    try {
      const userId = auth.user?.id;
      if (!userId) {
        Alert.alert('Authentication required', 'Please login to create a booking');
        return null;
      }
      // Exclude empty paymentMethod for new bookings (payment happens via gateway later)
      const submitData = { ...bookingData, userId };
      if (!submitData.paymentMethod) {
        delete submitData.paymentMethod;
      }
      const result = await createBooking(submitData);
      return result;
    } catch (e: any) {
      if (__DEV__) console.error('[useBookingLogic] submitBooking error', e?.response?.data || e.message);
      Alert.alert('Error', 'Failed to create booking');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleBooking = async (
    bookingData: {
      hotelId: string;
      checkInDate: string;
      checkOutDate: string;
      selectedRoomsMap: Record<string, number>;
      guestName: string;
      guestEmail: string;
      guestPhoneNumber: string;
      paymentMethod?: string;
      specialRequests?: string;
    },
    onSuccess?: (data: any) => void
  ) => {
    const result = await submitBooking(bookingData);
    if (result && typeof onSuccess === 'function') {
      try {
        onSuccess(result);
      } catch (e) {
        console.warn('onSuccess callback failed', e);
      }
    }
    return result;
  };

  const editBooking = async (
    bookingId: string,
    updateData: {
      checkInDate?: string;
      checkOutDate?: string;
      selectedRoomsMap?: Record<string, number>;
      paymentMethod?: string;
      specialRequests?: string;
    },
    onSuccess?: (data: any) => void
  ) => {
    // Validate required dates
    if (updateData.checkInDate && updateData.checkOutDate) {
      if (updateData.checkInDate >= updateData.checkOutDate) {
        Alert.alert('Error', 'Check-out date must be after check-in date');
        return null;
      }
    }

    setSubmitting(true);
    try {
      // Transform selectedRoomsMap to roomDetails array if provided
      const payload: any = {};
      if (updateData.checkInDate) payload.checkInDate = updateData.checkInDate;
      if (updateData.checkOutDate) payload.checkOutDate = updateData.checkOutDate;
      if (updateData.paymentMethod) payload.paymentMethod = updateData.paymentMethod;
      if (updateData.specialRequests) payload.specialRequests = updateData.specialRequests;

      if (updateData.selectedRoomsMap) {
        payload.roomDetails = Object.entries(updateData.selectedRoomsMap)
          .filter(([_, qty]) => qty > 0)
          .map(([hotelRoomId, _]) => ({
            hotelRoomId,
            pricePerNight: 0, // Price will be fetched from hotel details
          }));
      }

      const result = await updateBooking(bookingId, payload);
      Alert.alert('Success', 'Booking updated successfully');
      if (result && typeof onSuccess === 'function') {
        try {
          onSuccess(result);
        } catch (e) {
          console.warn('onSuccess callback failed', e);
        }
      }
      return result;
    } catch (e: any) {
      if (__DEV__) console.error('[useBookingLogic] editBooking error', e?.response?.data || e.message);
      const errorMsg = e?.response?.data?.message || 'Failed to update booking';
      Alert.alert('Error', errorMsg);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    submitBooking,
    handleBooking,
    editBooking,
    // booking retrieval helpers
    fetchUserBookings: useCallback(async (page = 1, limit = 20) => {
      setLoadingBookings(true);
      try {
        const userId = auth.user?.id;
        if (!userId) {
          return { data: [], pagination: { total: 0, page, limit, pages: 0 } };
        }
        return await getUserBookings(userId, page, limit);
      } catch (e) {
        if (__DEV__) console.error('[useBookingLogic] fetchUserBookings error', e);
        throw e;
      } finally {
        setLoadingBookings(false);
      }
    }, [auth.user?.id]),
    fetchBookingDetails: useCallback(async (bookingId: string) => {
      try {
        return await getBookingById(bookingId);
      } catch (e) {
        if (__DEV__) console.error('[useBookingLogic] fetchBookingDetails error', e);
        throw e;
      }
    }, []),
    loadEligibility: useCallback(async (bookingId: string): Promise<CancellationEligibility | null> => {
      try {
        return await getHotelCancellationEligibility(bookingId);
      } catch (e: any) {
        if (__DEV__) console.error('[useBookingLogic] loadEligibility error', e);
        const errorMsg = e?.response?.data?.message || 'Failed to load cancellation eligibility';
        Alert.alert('Error', errorMsg);
        return null;
      }
    }, []),
    cancelBooking: useCallback(
      async (bookingId: string, onSuccess?: (payload: unknown) => void) => {
        try {
          const eligibility = await getHotelCancellationEligibility(bookingId);
          if (!eligibility.canCancel) {
            throw new Error(eligibility.reason || 'This booking cannot be cancelled');
          }
          const payload = await cancelHotelBooking(bookingId);
          const message = buildCancelSuccessMessage('Booking cancelled successfully', payload);
          Alert.alert('Success', message);
          if (typeof onSuccess === 'function') {
            onSuccess(payload);
          }
          return payload;
        } catch (e: any) {
          if (__DEV__) console.error('[useBookingLogic] cancelBooking error', e?.response?.data || e.message);
          const errorMsg =
            e?.message || e?.response?.data?.message || 'Failed to cancel booking';
          Alert.alert('Cancellation Failed', errorMsg);
          return null;
        }
      },
      []
    ),
  };
}
