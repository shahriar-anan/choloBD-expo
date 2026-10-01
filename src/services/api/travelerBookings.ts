import { getApiInstance } from './axiosClient';
import { getUserBookings } from './bookings';
import { getUserPackageBookings } from './packageBookings';
import { getTransportBookings } from './transportBookings';
import { TravelerBookingSources } from '../../utilities/recentBookingItems';

function asList(payload: unknown): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const record = payload as { data?: unknown; results?: unknown; bookings?: unknown };
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.bookings)) return record.bookings;
  return [];
}

async function getData(path: string, params?: Record<string, string | number>): Promise<unknown> {
  const api = getApiInstance();
  const res = await api.get(path, { params });
  return res.data?.data;
}

export async function loadTravelerBookingSources(userId: string): Promise<TravelerBookingSources> {
  const [hotels, transports, activities, guides, packages, trips] = await Promise.all([
    getUserBookings(userId, 1, 20).catch(() => null),
    getTransportBookings({ page: 1, limit: 20 }).catch(() => null),
    getData('/api/bookings/activity-spots', { userId, page: 1, limit: 20 }).catch(() => null),
    getData('/api/bookings/guides', { userId, page: 1, limit: 20 }).catch(() => null),
    getUserPackageBookings({ limit: 20, offset: 0, sortBy: 'bookingDate', sortOrder: 'desc' }).catch(() => null),
    getData('/api/bookings/trip-bookings/my', { limit: 20, offset: 0, sortBy: 'bookedAt', sortOrder: 'desc' }).catch(() => null),
  ]);

  return {
    hotels: asList(hotels?.data ?? hotels),
    transports: transports?.results ?? [],
    activities: asList(activities),
    guides: asList(guides),
    packages: packages?.bookings ?? [],
    trips: asList(trips),
  };
}
