import { getApiInstance } from './axiosClient';
import { AppNotification } from '../../types/notification';

export async function getUnreadNotificationCount(): Promise<number> {
  const api = getApiInstance();
  const res = await api.get('/api/notifications/unread-count');
  const count = res.data?.data?.count;
  if (typeof count !== 'number') {
    throw new Error('Unread count missing');
  }
  return count;
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const api = getApiInstance();
  const res = await api.get('/api/notifications');
  const results = res.data?.data?.results;
  if (!Array.isArray(results)) {
    throw new Error('Notifications missing');
  }
  return results as AppNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const api = getApiInstance();
  await api.patch(`/api/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const api = getApiInstance();
  await api.patch('/api/notifications/read-all');
}
