import { appAlert } from '../components/ui/appAlert';
import { useState, useCallback, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../constants/translationKeys';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { createBooking, updateBooking, getUserBookings, getBookingById, getHotelCancellationEligibility, cancelHotelBooking } from '../services/api/bookings';
import { CancellationEligibility } from '../types/cancellation';
import { buildCancelSuccessMessage } from '../utilities/bookingCancelHelpers';
import { guestContactIsComplete } from '../components/forms/hotelBookingForm';
import { RoomShift } from '../types/hotelSearch';

export function useBookingLogic() {
  const { t } = useTranslation();
  const auth = useSelector((s: RootState) => s.auth);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  const [loadingBookings, setLoadingBookings] = useState(false);

  const submitBooking = async (bookingData: {
    hotelId: string;
    checkInDate: string;
    checkOutDate: string;
    shift: RoomShift;
    totalPrice: number;
    selectedRoomsMap: Record<string, number>;
    guestName: string;
    guestEmail: string;
    guestPhoneNumber: string;
      paymentMethod?: string;
      specialRequests?: string;
      guestCount: number;
    }) => {
    if (!bookingData.hotelId) {
      appAlert('Error', 'Hotel ID is required', undefined, 'error');
      return null;
    }
    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      appAlert('Error', 'Please enter check-in and check-out dates', undefined, 'error');
      return null;
    }
    const anyRooms = Object.values(bookingData.selectedRoomsMap).some((v) => v > 0);
    if (!anyRooms) {
      appAlert('Error', 'Please select at least one room', undefined, 'error');
      return null;
    }
    if (!guestContactIsComplete(bookingData.guestName, bookingData.guestEmail, bookingData.guestPhoneNumber)) {
      appAlert('Error', 'Enter the guest name, a valid email, and a mobile number', undefined, 'error');
      return null;
    }
    if (!bookingData.totalPrice || bookingData.totalPrice <= 0) {
      appAlert('Error', 'Select a room with a price for this stay', undefined, 'error');
      return null;
    }
    if (submitLock.current) {
      return null;
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      const userId = auth.user?.id;
      if (!userId) {
        appAlert('Authentication required', 'Please login to create a booking');
        return null;
      }
      // Exclude empty paymentMethod for new bookings (payment happens via gateway later)
      const submitData = {
        ...bookingData,
        userId,
        paymentMethod: bookingData.paymentMethod || 'sslcommerz',
      };
      const result = await createBooking(submitData);
      return result;
    } catch (e: any) {
      if (__DEV__) console.error('[useBookingLogic] submitBooking error', e?.response?.data || e.message);
      const serverMessage = e?.response?.data?.message;
      appAlert('Error', typeof serverMessage === 'string' && serverMessage ? serverMessage : 'Failed to create booking', undefined, 'error');
      return null;
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const handleBooking = async (
    bookingData: {
      hotelId: string;
      checkInDate: string;
      checkOutDate: string;
      shift: RoomShift;
      totalPrice: number;
      selectedRoomsMap: Record<string, number>;
      guestName: string;
      guestEmail: string;
      guestPhoneNumber: string;
      paymentMethod?: string;
      specialRequests?: string;
      guestCount: number;
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
        appAlert('Error', 'Check-out date must be after check-in date', undefined, 'error');
        return null;
      }
    }

    if (submitLock.current) {
      return null;
    }
    submitLock.current = true;
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
      appAlert('Success', 'Booking updated successfully', undefined, 'success');
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
      appAlert('Error', errorMsg, undefined, 'error');
      return null;
    } finally {
      submitLock.current = false;
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
        appAlert('Error', errorMsg, undefined, 'error');
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
          let message = buildCancelSuccessMessage('Booking cancelled successfully', payload);
          if (payload?.emailDispatched) {
            message += t(TRANSLATION_KEYS.BOOKING.CANCEL_EMAIL_NOTE);
          }
          appAlert('Success', message, undefined, 'success');
          if (typeof onSuccess === 'function') {
            onSuccess(payload);
          }
          return payload;
        } catch (e: any) {
          if (__DEV__) console.error('[useBookingLogic] cancelBooking error', e?.response?.data || e.message);
          const errorMsg =
            e?.message || e?.response?.data?.message || 'Failed to cancel booking';
          appAlert('Cancellation Failed', errorMsg, undefined, 'error');
          return null;
        }
      },
      [t]
    ),
  };
}
