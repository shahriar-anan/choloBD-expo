import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { useTransportBookingLogic } from '../../../hooks/useTransportBookingLogic';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { TransportBooking } from '../../../types/transports';
import { TransportBookingCard } from '../../../components/transport/TransportBookingCard';

type BookingListFilter = 'BUS' | 'TRAIN' | 'CAR_RENTAL';

const FILTERS: { id: BookingListFilter; labelKey: string }[] = [
  { id: 'BUS', labelKey: TRANSLATION_KEYS.TRANSPORT.BUS },
  { id: 'TRAIN', labelKey: TRANSLATION_KEYS.TRANSPORT.FILTER_TRAIN },
  { id: 'CAR_RENTAL', labelKey: TRANSLATION_KEYS.TRANSPORT.FILTER_CAR },
];

function matchesFilter(booking: TransportBooking, filter: BookingListFilter): boolean {
  return String(booking.transportType || '').toUpperCase() === filter;
}

export default function TransportBookingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { bookings, loadingBookings, fetchMyBookings } = useTransportBookingLogic();
  const [filter, setFilter] = useState<BookingListFilter>('BUS');
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const visible = useMemo(
    () => bookings.filter((booking) => matchesFilter(booking, filter)),
    [bookings, filter]
  );

  useEffect(() => {
    fetchMyBookings({ page: 1, limit: 50 });
  }, [fetchMyBookings]);

  const leaveList = () => {
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 p-6">
        <View className="flex-row items-center mb-6">
          <Pressable onPress={leaveList} style={{ padding: 6, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.MY_BOOKINGS)}
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.MY_BOOKINGS_DESC)}
            </Text>
          </View>
        </View>

        {bookings.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            persistentScrollbar={false}
            style={{ flexGrow: 0, alignSelf: 'flex-start', marginBottom: 16 }}
          >
            {FILTERS.map((item) => {
              const selected = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  className="px-4 py-2 mr-2 rounded-full"
                  style={{
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
        ) : null}

        {loadingBookings ? (
          <View className="items-center justify-center flex-1">
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : bookings.length === 0 ? (
          <Text className="mt-8 text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.NO_BOOKINGS_DESC)}
          </Text>
        ) : visible.length === 0 ? (
          <Text className="mt-8 text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.BOOKING.FILTER_EMPTY)}
          </Text>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            onRefresh={() => fetchMyBookings({ page: 1, limit: 50 })}
            refreshing={loadingBookings}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TransportBookingCard
                booking={item}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/dashboard/transport-bookings/[bookingId]',
                    params: { bookingId: item.id },
                  })
                }
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
