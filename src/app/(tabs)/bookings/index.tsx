import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { RootState } from '../../../store/store';
import { loadTravelerBookingSources } from '../../../services/api/travelerBookings';
import { listTravelerReservations, RecentBookingKind, RecentBookingView } from '../../../utilities/recentBookingItems';
import { RecentBookingCard } from '../../../components/ui/recentBookingCard';
import { BookingQrSheet } from '../../../components/booking/BookingQrSheet';
import { useHotelAdminSession } from '../../../hooks/useHotelAdminSession';
import { HotelGuestBookings } from '../../../components/hotel/HotelGuestBookings';
import { tabBarClearance } from '../../../hooks/useHideTabBar';

type Chip = 'all' | 'hotels' | 'tickets' | 'activities';
type HotelFilter = 'all' | 'unpaid' | 'confirmed' | 'pending' | 'cancelled';
type ActivityFilter = 'activities' | 'guides';

const CHIPS: { id: Chip; labelKey: string }[] = [
  { id: 'all', labelKey: TRANSLATION_KEYS.BOOKINGS_TAB.ALL },
  { id: 'hotels', labelKey: TRANSLATION_KEYS.BOOKINGS_TAB.HOTELS },
  { id: 'tickets', labelKey: TRANSLATION_KEYS.BOOKINGS_TAB.TICKETS },
  { id: 'activities', labelKey: TRANSLATION_KEYS.BOOKINGS_TAB.ACTIVITIES },
];

const HOTEL_FILTERS: { id: HotelFilter; labelKey: string }[] = [
  { id: 'all', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_ALL },
  { id: 'unpaid', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_UNPAID },
  { id: 'confirmed', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_CONFIRMED },
  { id: 'pending', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_PENDING },
  { id: 'cancelled', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_CANCELLED },
];

function matchesChip(item: RecentBookingView, chip: Chip, activity: ActivityFilter): boolean {
  if (chip === 'all') return true;
  if (chip === 'hotels') return item.kind === 'hotel';
  if (chip === 'tickets') return item.kind === 'transport';
  if (activity === 'guides') return item.kind === 'guide';
  return item.kind === 'activity';
}

function matchesHotelFilter(item: RecentBookingView, filter: HotelFilter): boolean {
  if (item.kind !== 'hotel' || filter === 'all') return true;
  const status = item.status.toUpperCase();
  const payment = item.paymentStatus.toUpperCase();
  if (filter === 'unpaid') return payment === 'UNPAID';
  if (filter === 'confirmed') return status === 'CONFIRMED';
  if (filter === 'pending') return status === 'PENDING';
  if (filter === 'cancelled') return status === 'CANCELLED';
  return true;
}

function TravelerBookingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [chip, setChip] = useState<Chip>('all');
  const [hotelFilter, setHotelFilter] = useState<HotelFilter>('all');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('activities');
  const [rows, setRows] = useState<RecentBookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [qrItem, setQrItem] = useState<RecentBookingView | null>(null);
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const load = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setFailed(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sources = await loadTravelerBookingSources(userId);
      setRows(listTravelerReservations(sources));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(
    () => rows.filter((item) => matchesChip(item, chip, activityFilter) && matchesHotelFilter(item, chip === 'hotels' ? hotelFilter : 'all')),
    [rows, chip, activityFilter, hotelFilter],
  );

  const listTitle = chip === 'activities'
    ? t(activityFilter === 'guides'
      ? TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TAB_GUIDES
      : TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TAB_ACTIVITIES)
    : t(CHIPS.find((item) => item.id === chip)?.labelKey ?? TRANSLATION_KEYS.BOOKINGS_TAB.ALL);

  const openRow = (item: RecentBookingView) => {
    if (item.kind === 'hotel') {
      router.push(`/(tabs)/bookings/stay/${item.id}`);
      return;
    }
    if (item.kind === 'transport') {
      router.push(`/(tabs)/bookings/ticket/${item.id}`);
      return;
    }
    const kind: RecentBookingKind = item.kind === 'guide' ? 'guide' : 'activity';
    router.push({
      pathname: '/(tabs)/bookings/activity/[bookingId]',
      params: { bookingId: item.id, kind },
    });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <Text className="px-6 pt-4 text-3xl font-bold font-heading text-text dark:text-text-dark">
        {t(TRANSLATION_KEYS.BOOKINGS_TAB.TITLE)}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ height: 48, flexGrow: 0, flexShrink: 0, marginTop: 12 }}
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 24, height: 48 }}
      >
        {CHIPS.map((item) => {
          const selected = chip === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setChip(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className="px-4 mr-2 rounded-full"
              style={{
                height: 34,
                justifyContent: 'center',
                backgroundColor: selected ? primary : 'transparent',
                borderWidth: 1,
                borderColor: primary,
              }}
            >
              <Text style={{ color: selected ? '#fff' : primary }} className="text-sm font-semibold">
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {chip === 'hotels' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ height: 40, flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 24, height: 40 }}
        >
          {HOTEL_FILTERS.map((item) => {
            const selected = hotelFilter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setHotelFilter(item.id)}
                className="px-3 mr-2 rounded-full"
                style={{
                  height: 30,
                  justifyContent: 'center',
                  backgroundColor: selected ? primary : 'transparent',
                  borderWidth: 1,
                  borderColor: primary,
                }}
              >
                <Text style={{ color: selected ? '#fff' : primary }} className="text-xs font-semibold">{t(item.labelKey)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {chip === 'activities' ? (
        <View className="flex-row items-center px-6" style={{ height: 40, gap: 8 }}>
          {(['activities', 'guides'] as ActivityFilter[]).map((value) => {
            const selected = activityFilter === value;
            const label = value === 'guides'
              ? t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TAB_GUIDES)
              : t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TAB_ACTIVITIES);
            return (
              <Pressable
                key={value}
                onPress={() => setActivityFilter(value)}
                className="px-3 rounded-full"
                style={{
                  height: 30,
                  justifyContent: 'center',
                  backgroundColor: selected ? primary : 'transparent',
                  borderWidth: 1,
                  borderColor: primary,
                }}
              >
                <Text style={{ color: selected ? '#fff' : primary }} className="text-xs font-semibold">{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Text className="px-6 pt-3 pb-2 text-xl font-bold font-heading text-text dark:text-text-dark">
        {listTitle}
      </Text>

      {loading && rows.length === 0 ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : failed ? (
        <View className="items-center px-6 py-12">
          <Text className="text-sm text-center text-error dark:text-error-dark">{t(TRANSLATION_KEYS.COMMON.ERROR)}</Text>
          <Pressable onPress={() => { void load(); }} className="mt-4">
            <Text style={{ color: primary }} className="font-semibold">{t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}</Text>
          </Pressable>
        </View>
      ) : visible.length === 0 ? (
        <View className="px-6 py-8">
          <Text className="text-base font-semibold text-center text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.BOOKINGS_TAB.EMPTY)}
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/explore/hotel-search?fromHome=true')} className="mt-6">
            <Text style={{ color: primary }} className="text-base font-semibold text-center">{t(TRANSLATION_KEYS.BOOKINGS_TAB.FIND_HOTEL)}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/explore/transport-search?fromHome=true')} className="mt-4">
            <Text style={{ color: primary }} className="text-base font-semibold text-center">{t(TRANSLATION_KEYS.BOOKINGS_TAB.FIND_TRANSPORT)}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/explore/attractions?tab=places&fromHome=true')} className="mt-4">
            <Text style={{ color: primary }} className="text-base font-semibold text-center">{t(TRANSLATION_KEYS.BOOKINGS_TAB.FIND_ATTRACTIONS)}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          renderItem={({ item }) => (
            <RecentBookingCard
              item={item}
              onPress={openRow}
              onQrPress={(row) => {
                if (row.kind === 'hotel') {
                  router.push(`/(tabs)/dashboard/${row.id}/qr-generate`);
                  return;
                }
                setQrItem(row);
              }}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: tabBarClearance(insets.bottom) }}
          refreshing={loading}
          onRefresh={() => { void load(); }}
        />
      )}
      <BookingQrSheet
        visible={qrItem != null}
        mode={qrItem?.kind === 'activity' ? 'activity' : 'unsupported'}
        bookingId={qrItem?.id}
        onClose={() => setQrItem(null)}
      />
    </SafeAreaView>
  );
}

export default function BookingsIndex() {
  const { isHotelAdmin, isHotelEmployee, pending } = useHotelAdminSession();
  if (pending) {
    return (
      <View className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator />
      </View>
    );
  }
  if (isHotelAdmin || isHotelEmployee) {
    return <HotelGuestBookings />;
  }
  return <TravelerBookingsScreen />;
}
