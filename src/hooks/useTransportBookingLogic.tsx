import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { usePaymentLogic } from './usePaymentLogic';
import {
  cancelTransportBooking,
  createTransportBooking,
  getTransportBookingById,
  getTransportBookings,
  getTransportCancellationEligibility,
} from '../services/api/transportBookings';
import { CancellationEligibility } from '../types/cancellation';
import {
  CreateTransportBookingData,
  TransportBooking,
  TransportBookingListFilters,
  TransportBookingListPage,
} from '../types/transports';
import { CreateTransportBookingResult } from '../services/api/transportBookings';
import { buildCancelSuccessMessage } from '../utilities/bookingCancelHelpers';

export function useTransportBookingLogic() {
  const auth = useSelector((s: RootState) => s.auth);
  const { startPayment, isLoading: paymentLoading, error: paymentError } = usePaymentLogic();

  const [submitting, setSubmitting] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [bookingsPage, setBookingsPage] = useState<TransportBookingListPage>({
    results: [],
    total: 0,
    page: 1,
    limit: 20,
  });

  const createBooking = useCallback(async (
    data: CreateTransportBookingData
  ): Promise<CreateTransportBookingResult | null> => {
    if (!auth.user?.id) {
      Alert.alert('Authentication required', 'Please login to create a booking');
      return null;
    }

    setSubmitting(true);
    try {
      return await createTransportBooking(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      Alert.alert('Booking failed', message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [auth.user?.id]);

  const payBooking = useCallback(async (booking: TransportBooking) => {
    return startPayment({
      serviceType: 'TRANSPORT_SERVICE',
      serviceTypeId: booking.id,
      bookingId: booking.id,
    });
  }, [startPayment]);

  const fetchMyBookings = useCallback(async (
    filters: TransportBookingListFilters = {}
  ): Promise<TransportBookingListPage> => {
    setLoadingBookings(true);
    try {
      const page = await getTransportBookings({
        page: 1,
        limit: 20,
        ...filters,
      });
      setBookingsPage(page);
      return page;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load bookings';
      Alert.alert('Error', message);
      return { results: [], total: 0, page: 1, limit: 20 };
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const fetchBookingDetail = useCallback(async (
    bookingId: string
  ): Promise<TransportBooking | null> => {
    try {
      return await getTransportBookingById(bookingId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load booking';
      Alert.alert('Error', message);
      return null;
    }
  }, []);

  const loadEligibility = useCallback(async (
    bookingId: string
  ): Promise<CancellationEligibility | null> => {
    try {
      return await getTransportCancellationEligibility(bookingId);
    } catch (error: unknown) {
      if (__DEV__) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[useTransportBookingLogic] eligibility', message);
      }
      return null;
    }
  }, []);

  const handleCancelBooking = useCallback(async (
    bookingId: string,
    cancellationReason?: string,
    onSuccess?: () => void
  ): Promise<void> => {
    try {
      const eligibility = await getTransportCancellationEligibility(bookingId);
      if (!eligibility.canCancel) {
        Alert.alert('Cannot cancel', eligibility.reason || 'This booking cannot be cancelled');
        return;
      }

      setCancelSubmitting(true);
      const result = await cancelTransportBooking(bookingId, cancellationReason);
      Alert.alert('Success', buildCancelSuccessMessage('Booking cancelled successfully', result));
      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel booking';
      Alert.alert('Cancellation failed', message);
    } finally {
      setCancelSubmitting(false);
    }
  }, []);

  return {
    submitting,
    loadingBookings,
    cancelSubmitting,
    paymentLoading,
    paymentError,
    bookings: bookingsPage.results,
    pagination: {
      total: bookingsPage.total,
      page: bookingsPage.page,
      limit: bookingsPage.limit,
    },
    createBooking,
    payBooking,
    fetchMyBookings,
    fetchBookingDetail,
    loadEligibility,
    handleCancelBooking,
  };
}
