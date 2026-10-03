import { useCallback, useState } from 'react';
import {
  ActivityBookingRecord,
  getActivityBooking,
  getMyActivityBookings,
} from '../services/api/activityBookings';
import {
  getGuideBooking,
  getMyGuideBookings,
  GuideBookingRecord,
} from '../services/api/guideBookings';

export type AttractionBookingTab = 'places' | 'activities' | 'guides';

export function canPayActivity(booking: Pick<ActivityBookingRecord, 'status' | 'paymentStatus' | 'totalPrice'>): boolean {
  return booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED' && booking.totalPrice > 0;
}

export function canPayGuide(booking: Pick<GuideBookingRecord, 'status' | 'paymentStatus' | 'totalPrice'>): boolean {
  return booking.status === 'ACCEPTED' && booking.paymentStatus === 'UNPAID' && booking.totalPrice > 0;
}

export function useAttractionBookings(userId?: string) {
  const [activities, setActivities] = useState<ActivityBookingRecord[]>([]);
  const [guides, setGuides] = useState<GuideBookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setActivities([]);
      setGuides([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [activityRows, guideRows] = await Promise.all([
        getMyActivityBookings(userId),
        getMyGuideBookings(userId),
      ]);
      setActivities(activityRows);
      setGuides(guideRows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bookings could not be loaded');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { activities, guides, loading, error, refresh };
}

export async function loadAttractionBooking(
  kind: 'activity' | 'guide',
  bookingId: string,
): Promise<ActivityBookingRecord | GuideBookingRecord> {
  if (kind === 'guide') return getGuideBooking(bookingId);
  return getActivityBooking(bookingId);
}
