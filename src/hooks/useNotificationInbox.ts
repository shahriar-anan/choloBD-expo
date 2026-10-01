import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api/notifications';
import { AppNotification } from '../types/notification';

export function useNotificationInbox() {
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

    if (item.relatedEntityType === 'HOTEL_BOOKING' && item.relatedEntityId) {
      router.push(`/(tabs)/dashboard/${item.relatedEntityId}`);
      return;
    }
    if (item.relatedEntityType === 'PACKAGE_BOOKING') {
      router.push('/(tabs)/dashboard');
    }
  }, [router]);

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
  };
}
