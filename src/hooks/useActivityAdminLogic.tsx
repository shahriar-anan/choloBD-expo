/**
 * Activity Spot service-admin logic (profile + operator bookings/earnings)
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { getUserProfile } from '../services/api/users';
import {
  getActivitySpotDetail,
  updateActivitySpot,
  UpdateActivitySpotData,
} from '../services/api/activitySpots';
import {
  cancelActivityBooking,
  getActivityBookings,
} from '../services/api/activityBookings';
import type { ActivitySpot } from '../types/activitySpots';
import type { ActivityBooking } from '../types/activityBookings';

export interface ActivityEarningsSummary {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  paidEarnings: number;
  pendingEarnings: number;
  totalEarnings: number;
}

export function summarizeActivityBookings(
  bookings: ActivityBooking[]
): ActivityEarningsSummary {
  return bookings.reduce<ActivityEarningsSummary>(
    (acc, booking) => {
      const amount = booking.totalPrice ?? booking.totalCost ?? booking.price ?? 0;
      acc.totalBookings += 1;
      if (booking.status === 'PENDING') acc.pendingBookings += 1;
      if (booking.status === 'CONFIRMED') acc.confirmedBookings += 1;
      if (booking.status === 'COMPLETED') acc.completedBookings += 1;
      if (booking.status === 'CANCELLED') acc.cancelledBookings += 1;

      if (booking.paymentStatus === 'PAID') acc.paidEarnings += amount;
      else if (booking.status === 'PENDING' || booking.status === 'CONFIRMED') {
        acc.pendingEarnings += amount;
      }
      acc.totalEarnings = acc.paidEarnings + acc.pendingEarnings;
      return acc;
    },
    {
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      paidEarnings: 0,
      pendingEarnings: 0,
      totalEarnings: 0,
    }
  );
}

export function useActivityAdminLogic() {
  const [activitySpot, setActivitySpot] = useState<ActivitySpot | null>(null);
  const [spotLoading, setSpotLoading] = useState(false);
  const [spotError, setSpotError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<ActivityBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const resolveActivitySpotId = useCallback(async (): Promise<string | null> => {
    const profile = await getUserProfile();
    return profile?.serviceEntityId || null;
  }, []);

  const fetchMyActivitySpot = useCallback(async (): Promise<ActivitySpot | null> => {
    setSpotLoading(true);
    setSpotError(null);
    try {
      const spotId = await resolveActivitySpotId();
      if (!spotId) {
        setSpotError('No activity spot assigned to this account');
        setActivitySpot(null);
        return null;
      }
      const spot = await getActivitySpotDetail(spotId);
      setActivitySpot(spot);
      return spot;
    } catch (error: any) {
      const message = error?.message || 'Failed to load activity spot';
      setSpotError(message);
      setActivitySpot(null);
      return null;
    } finally {
      setSpotLoading(false);
    }
  }, [resolveActivitySpotId]);

  const fetchActivityBookings = useCallback(async (activitySpotId: string) => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const result = await getActivityBookings({
        activitySpotId,
        limit: 100,
        page: 1,
      });
      setBookings(result.results || []);
    } catch (error: any) {
      setBookingsError(error?.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    const spot = await fetchMyActivitySpot();
    if (spot?.id) await fetchActivityBookings(spot.id);
  }, [fetchMyActivitySpot, fetchActivityBookings]);

  const saveActivitySpot = useCallback(
    async (data: UpdateActivitySpotData) => {
      if (!activitySpot?.id) return null;
      try {
        setActionLoading(true);
        const updated = await updateActivitySpot(activitySpot.id, data);
        setActivitySpot(updated);
        Alert.alert('Success', 'Activity profile updated');
        return updated;
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to update activity profile');
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [activitySpot?.id]
  );

  const handleCancelBooking = useCallback(
    async (bookingId: string, reason?: string) => {
      try {
        setActionLoading(true);
        await cancelActivityBooking(bookingId, reason);
        if (activitySpot?.id) await fetchActivityBookings(activitySpot.id);
        Alert.alert('Success', 'Booking cancelled');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to cancel booking');
      } finally {
        setActionLoading(false);
      }
    },
    [activitySpot?.id, fetchActivityBookings]
  );

  return {
    activitySpot,
    spotLoading,
    spotError,
    bookings,
    bookingsLoading,
    bookingsError,
    actionLoading,
    summary: summarizeActivityBookings(bookings),
    fetchMyActivitySpot,
    fetchActivityBookings,
    loadDashboard,
    saveActivitySpot,
    handleCancelBooking,
  };
}
