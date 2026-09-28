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
import { pickNewestBooking } from '../utilities/newestBooking';

export interface TravelerWalletStrip {
  balance: number;
  currency: string;
}

export function useDashboardLogic() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<TravelerWalletStrip | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const { fetchUserBookings } = useBookingLogic();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchUserBookings(1, 20);
      const data = payload?.data ?? [];
      setBookings(Array.isArray(data) ? data : []);
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
    } catch (e: any) {
      console.error('[useDashboardLogic] loadProfile error', e?.message ?? e);
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
    fetchBookings();
    loadProfile();
  }, [fetchBookings, loadProfile]);

  const recentBooking = useMemo(() => pickNewestBooking(bookings), [bookings]);

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
    recentBooking,
    wallet,
    unreadCount,
    profileImageUrl,
    profileStatus,
    loading,
    handleLogout,
    onPressBooking,
    onRefresh: fetchBookings,
    refreshTravelerHome,
  };
}
