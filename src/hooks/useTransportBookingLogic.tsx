import { appAlert } from '../components/ui/appAlert';
import { useCallback, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../constants/translationKeys';
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
  const { t } = useTranslation();
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
      appAlert('Authentication required', 'Please login to create a booking');
      return null;
    }

    setSubmitting(true);
    try {
      return await createTransportBooking(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      appAlert('Booking failed', message, undefined, 'error');
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
      appAlert('Error', message, undefined, 'error');
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
      appAlert('Error', message, undefined, 'error');
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
        appAlert('Cannot cancel', eligibility.reason || 'This booking cannot be cancelled', undefined, 'error');
        return;
      }

      setCancelSubmitting(true);
      const result = await cancelTransportBooking(bookingId, cancellationReason);
      let message = buildCancelSuccessMessage('Booking cancelled successfully', result);
      if (result.emailDispatched) {
        message += t(TRANSLATION_KEYS.BOOKING.CANCEL_EMAIL_NOTE);
      }
      appAlert('Success', message, undefined, 'success');
      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel booking';
      appAlert('Cancellation failed', message, undefined, 'error');
    } finally {
      setCancelSubmitting(false);
    }
  }, [t]);

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
