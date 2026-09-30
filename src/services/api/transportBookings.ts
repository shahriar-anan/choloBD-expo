import { getApiInstance } from './axiosClient';
import {
  CancellationEligibility,
  CancelBookingWithRefundData,
} from '../../types/cancellation';
import {
  CreateBusTransportBookingData,
  CreateTransportBookingData,
  TransportBooking,
  TransportBookingListFilters,
  TransportBookingListPage,
  TransportRoundTripBookingResult,
} from '../../types/transports';
import { assertOnPlatformTransport, getTransportById } from './transports';

function apiMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

function unwrapBookingPage(data: unknown): TransportBookingListPage {
  if (data && typeof data === 'object' && Array.isArray((data as TransportBookingListPage).results)) {
    const page = data as TransportBookingListPage;
    return {
      results: page.results,
      total: page.total ?? page.results.length,
      page: page.page ?? 1,
      limit: page.limit ?? page.results.length,
    };
  }
  return { results: [], total: 0, page: 1, limit: 10 };
}

export type CreateTransportBookingResult =
  | { kind: 'single'; booking: TransportBooking }
  | { kind: 'roundTrip'; result: TransportRoundTripBookingResult };

function unwrapRoundTripPayload(data: unknown): TransportRoundTripBookingResult | null {
  if (!data || typeof data !== 'object') return null;
  const payload = data as TransportRoundTripBookingResult;
  if (payload.roundTripGroupId && Array.isArray(payload.bookings) && payload.bookings.length >= 2) {
    return payload;
  }
  return null;
}

export async function createTransportBooking(
  data: CreateTransportBookingData
): Promise<CreateTransportBookingResult> {
  const transport = await getTransportById(data.transportId);
  assertOnPlatformTransport(transport.transportType);

  if (transport.transportType === 'BUS') {
    const busData = data as CreateBusTransportBookingData;
    if (!busData.transportTripId) {
      throw new Error('transportTripId is required for bus bookings');
    }
    const outboundCount = busData.passengers?.length || busData.seatIds?.length || 0;
    if (outboundCount === 0) {
      throw new Error('At least one seat is required');
    }
    if (busData.returnLeg) {
      const returnCount =
        busData.returnLeg.passengers?.length || busData.returnLeg.seatIds?.length || 0;
      if (returnCount === 0) {
        throw new Error('Return leg requires at least one seat');
      }
    }
  }

  if (transport.transportType === 'CAR_RENTAL') {
    const rentalData = data as Extract<CreateTransportBookingData, { transportVehicleId: string }>;
    if (!('transportVehicleId' in rentalData) || !rentalData.transportVehicleId) {
      throw new Error('transportVehicleId is required for car rental bookings');
    }
    if (!rentalData.departureDateTime || !rentalData.arrivalDateTime) {
      throw new Error('departureDateTime and arrivalDateTime are required for car rental bookings');
    }
  }

  try {
    const api = getApiInstance();
    const res = await api.post('/api/bookings/transports', data);
    const roundTrip = unwrapRoundTripPayload(res.data?.data);
    if (roundTrip) {
      return { kind: 'roundTrip', result: roundTrip };
    }
    const booking = res.data?.data as TransportBooking;
    if (!booking?.id) {
      throw new Error('Invalid booking response');
    }
    return { kind: 'single', booking };
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to create transport booking'));
  }
}

export async function getTransportBookings(
  filters: TransportBookingListFilters = {}
): Promise<TransportBookingListPage> {
  try {
    const api = getApiInstance();
    const params: Record<string, string | number> = {};
    if (filters.userId) params.userId = filters.userId;
    if (filters.transportId) params.transportId = filters.transportId;
    if (filters.status) params.status = filters.status;
    if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
    if (filters.confirmationCode) params.confirmationCode = filters.confirmationCode;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    const res = await api.get('/api/bookings/transports', { params });
    return unwrapBookingPage(res.data?.data);
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load transport bookings'));
  }
}

export async function getTransportBookingById(bookingId: string): Promise<TransportBooking> {
  try {
    const api = getApiInstance();
    const res = await api.get(`/api/bookings/transports/${bookingId}`);
    const booking = res.data?.data as TransportBooking | undefined;
    if (!booking?.id) {
      throw new Error('Transport booking not found');
    }
    return booking;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load transport booking'));
  }
}

export async function getTransportCancellationEligibility(
  bookingId: string
): Promise<CancellationEligibility> {
  try {
    const api = getApiInstance();
    const res = await api.get(
      `/api/bookings/transports/${bookingId}/cancellation-eligibility`
    );
    return res.data.data as CancellationEligibility;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to load cancellation eligibility'));
  }
}

export async function cancelTransportBooking(
  bookingId: string,
  cancellationReason?: string
): Promise<CancelBookingWithRefundData<TransportBooking>> {
  try {
    const api = getApiInstance();
    const trimmed = cancellationReason?.trim().slice(0, 500);
    const res = await api.delete(`/api/bookings/transports/${bookingId}`, {
      data: trimmed ? { cancellationReason: trimmed } : undefined,
    });
    return res.data.data as CancelBookingWithRefundData<TransportBooking>;
  } catch (error: unknown) {
    throw new Error(apiMessage(error, 'Failed to cancel transport booking'));
  }
}
