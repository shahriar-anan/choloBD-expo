import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api/notifications';
import { AppNotification } from '../types/notification';

interface InboxOptions {
  traveler?: boolean;
}

export function useNotificationInbox(options?: InboxOptions) {
  const traveler = options?.traveler === true;
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getMyNotifications();
      setItems(results);
    } catch (error) {
      console.error('[useNotificationInbox] load error', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNotification = useCallback(async (item: AppNotification) => {
    if (!item.isRead) {
      try {
        await markNotificationRead(item.id);
        setItems((prev) => prev.map((row) => (
          row.id === item.id ? { ...row, isRead: true } : row
        )));
      } catch (error) {
        console.error('[useNotificationInbox] mark read error', error);
      }
    }

    const entityId = item.relatedEntityId;
    const entityType = item.relatedEntityType;
    if (traveler) {
      if (entityType === 'HOTEL_BOOKING' && entityId) {
        router.push(`/(tabs)/bookings/stay/${entityId}`);
        return;
      }
      if ((entityType === 'TRANSPORT_BOOKING' || entityType === 'TRANSPORT_SERVICE') && entityId) {
        router.push(`/(tabs)/bookings/ticket/${entityId}`);
        return;
      }
      if (entityType === 'ACTIVITY_BOOKING' && entityId) {
        router.push({ pathname: '/(tabs)/bookings/activity/[bookingId]', params: { bookingId: entityId, kind: 'activity' } });
        return;
      }
      if ((entityType === 'GUIDE_SERVICE' || entityType === 'GUIDE_BOOKING') && entityId) {
        router.push({ pathname: '/(tabs)/bookings/activity/[bookingId]', params: { bookingId: entityId, kind: 'guide' } });
      }
      return;
    }

    if (entityType === 'HOTEL_TASK') {
      router.push('/(tabs)/dashboard/service-admin/tasks');
      return;
    }
    if (entityType === 'HOTEL_BOOKING' && entityId) {
      router.push(`/(tabs)/dashboard/${entityId}`);
      return;
    }
    if (entityType === 'PACKAGE_BOOKING') {
      router.push('/(tabs)/dashboard');
    }
  }, [router, traveler]);

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((row) => ({ ...row, isRead: true })));
    } catch (error) {
      console.error('[useNotificationInbox] mark all read error', error);
    } finally {
      setMarkingAll(false);
    }
  }, []);

  return {
    items,
    loading,
    markingAll,
    openNotification,
    markAllRead,
    load,
  };
}
