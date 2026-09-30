import { useEffect, useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { logoutUser } from '../store/slices/authSlice';
import { useRouter } from 'expo-router';
import { useBookingLogic } from './useBookingLogic';
import { getOwnWallet, OwnWallet } from '../services/api/wallet';
import { getUnreadNotificationCount } from '../services/api/notifications';
import { getUserProfile } from '../services/api/users';
import { bookingSortTime } from '../utilities/newestBooking';
import { getTransportBookings } from '../services/api/transportBookings';
import { TransportBooking } from '../types/transports';

export type RecentDashboardItem =
  | { kind: 'hotel'; booking: any }
  | { kind: 'transport'; booking: TransportBooking };

export interface TravelerWalletStrip {
  balance: number;
  currency: string;
}

export function useDashboardLogic() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [transportBookings, setTransportBookings] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<TravelerWalletStrip | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [employeeServiceType, setEmployeeServiceType] = useState<string | null>(null);
  const [operatorProfileLoaded, setOperatorProfileLoaded] = useState(false);
  const { fetchUserBookings } = useBookingLogic();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const [payload, transportPage] = await Promise.all([
        fetchUserBookings(1, 20),
        getTransportBookings({ page: 1, limit: 20 }).catch(() => null),
      ]);
      const data = payload?.data ?? [];
      setBookings(Array.isArray(data) ? data : []);
      setTransportBookings(transportPage?.results ?? []);
    } catch (e: any) {
      console.error('[useDashboardLogic] fetchBookings error', e?.message ?? e);
      Alert.alert('Error', 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, [fetchUserBookings]);

  const loadWallet = useCallback(async () => {
    try {
      const data: OwnWallet = await getOwnWallet();
      if (typeof data?.balance !== 'number' || typeof data?.currency !== 'string' || !data.currency) {
        setWallet(null);
        return;
      }
      setWallet({ balance: data.balance, currency: data.currency });
    } catch (e: any) {
      console.error('[useDashboardLogic] loadWallet error', e?.message ?? e);
      setWallet(null);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      const imageUrl = typeof profile?.imageUrl === 'string' ? profile.imageUrl.trim() : '';
      setProfileImageUrl(imageUrl || null);
      setProfileStatus(typeof profile?.userStatus === 'string' ? profile.userStatus : null);
      setServiceType(typeof profile?.serviceType === 'string' ? profile.serviceType : null);
      setEmployeeServiceType(
        typeof profile?.employeeServiceType === 'string' ? profile.employeeServiceType : null
      );
    } catch (e: any) {
      console.error('[useDashboardLogic] loadProfile error', e?.message ?? e);
      setServiceType(null);
      setEmployeeServiceType(null);
    } finally {
      setOperatorProfileLoaded(true);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (e: any) {
      console.error('[useDashboardLogic] loadUnreadCount error', e?.message ?? e);
      setUnreadCount(null);
    }
  }, []);

  const refreshTravelerHome = useCallback(async () => {
    await Promise.all([fetchBookings(), loadWallet(), loadUnreadCount(), loadProfile()]);
  }, [fetchBookings, loadWallet, loadUnreadCount, loadProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const recentBookings = useMemo(() => {
    const isCancelled = (status?: string | null) => String(status || '').toUpperCase() === 'CANCELLED';
    const hotels: RecentDashboardItem[] = bookings
      .filter((booking) => !isCancelled(booking.status))
      .map((booking) => ({ kind: 'hotel' as const, booking }));
    const transports: RecentDashboardItem[] = transportBookings
      .filter((booking) => !isCancelled(booking.status))
      .map((booking) => ({ kind: 'transport' as const, booking }));
    return [...hotels, ...transports]
      .sort((left, right) => bookingSortTime(right.booking) - bookingSortTime(left.booking))
      .slice(0, 2);
  }, [bookings, transportBookings]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      router.replace('/(auth)/login');
    } catch (e) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  const onPressBooking = (bookingId: string) => {
    router.push(`/(tabs)/dashboard/${bookingId}`);
  };

  return {
    auth,
    bookings,
    recentBookings,
    wallet,
    unreadCount,
    profileImageUrl,
    profileStatus,
    serviceType,
    employeeServiceType,
    operatorProfileLoaded,
    loading,
    handleLogout,
    onPressBooking,
    onRefresh: fetchBookings,
    refreshTravelerHome,
  };
}
