import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { logoutUser } from '../store/slices/authSlice';
import { useRouter } from 'expo-router';
import { getOwnWallet, OwnWallet } from '../services/api/wallet';
import { getUnreadNotificationCount } from '../services/api/notifications';
import { getUserProfile } from '../services/api/users';
import { loadTravelerBookingSources } from '../services/api/travelerBookings';
import { buildTravelerDashboardHub, TravelerDashboardHub } from '../utilities/dashboardHub';
import { buildRecentBookingItems, RecentBookingView } from '../utilities/recentBookingItems';

const emptyHub: TravelerDashboardHub = {
  upNext: null,
  attentionItems: [],
  hotelActiveCount: 0,
  transportActiveCount: 0,
};

export interface TravelerWalletStrip {
  balance: number;
  currency: string;
}

export function useDashboardLogic() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [recentBookingItems, setRecentBookingItems] = useState<RecentBookingView[]>([]);
  const [hub, setHub] = useState<TravelerDashboardHub>(emptyHub);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<TravelerWalletStrip | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [employeeServiceType, setEmployeeServiceType] = useState<string | null>(null);
  const [operatorProfileLoaded, setOperatorProfileLoaded] = useState(false);

  const fetchBookings = useCallback(async () => {
    const userId = auth.user?.id;
    if (!userId) {
      setBookings([]);
      setRecentBookingItems([]);
      setHub(emptyHub);
      return;
    }

    setLoading(true);
    try {
      const sources = await loadTravelerBookingSources(userId);
      setBookings(sources.hotels);
      setRecentBookingItems(buildRecentBookingItems(sources, 5));
      setHub(buildTravelerDashboardHub(sources.hotels, sources.transports));
    } catch (e: any) {
      console.error('[useDashboardLogic] fetchBookings error', e?.message ?? e);
      Alert.alert('Error', 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id]);

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

  const onPressRecentBooking = (item: RecentBookingView) => {
    if (item.kind === 'hotel') {
      router.push(`/(tabs)/dashboard/${item.id}`);
      return;
    }
    if (item.kind === 'transport') {
      router.push({
        pathname: '/(tabs)/dashboard/transport-bookings/[bookingId]',
        params: { bookingId: item.id },
      });
    }
  };

  return {
    auth,
    bookings,
    recentBookingItems,
    upNext: hub.upNext,
    attentionItems: hub.attentionItems,
    hotelActiveCount: hub.hotelActiveCount,
    transportActiveCount: hub.transportActiveCount,
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
    onPressRecentBooking,
    onRefresh: fetchBookings,
    refreshTravelerHome,
  };
}
