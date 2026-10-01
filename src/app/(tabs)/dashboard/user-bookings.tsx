import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BookingCard } from '../../../components/ui/bookingCard';
import { useTheme } from '../../../hooks/useTheme';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';

type BookingListFilter = 'all' | 'unpaid' | 'confirmed' | 'pending' | 'cancelled';

const FILTERS: { id: BookingListFilter; labelKey: string }[] = [
  { id: 'all', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_ALL },
  { id: 'unpaid', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_UNPAID },
  { id: 'confirmed', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_CONFIRMED },
  { id: 'pending', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_PENDING },
  { id: 'cancelled', labelKey: TRANSLATION_KEYS.BOOKING.FILTER_CANCELLED },
];

function matchesBookingFilter(booking: { status?: string; paymentStatus?: string }, filter: BookingListFilter): boolean {
  const status = String(booking.status || '').toUpperCase();
  const payment = String(booking.paymentStatus || '').toUpperCase();
  if (filter === 'unpaid') return payment === 'UNPAID';
  if (filter === 'confirmed') return status === 'CONFIRMED';
  if (filter === 'pending') return status === 'PENDING';
  if (filter === 'cancelled') return status === 'CANCELLED';
  return true;
}

export default function UserBookingsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { bookings, loading, onRefresh, onPressBooking } = useDashboardLogic();
  const [filter, setFilter] = useState<BookingListFilter>('all');
  const [hasLoaded, setHasLoaded] = useState(false);
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const visibleBookings = useMemo(
    () => bookings.filter((booking) => matchesBookingFilter(booking, filter)),
    [bookings, filter],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      onRefresh().finally(() => {
        if (active) {
          setHasLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, [onRefresh])
  );

  const busy = !hasLoaded || (loading && bookings.length === 0);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 p-6">
        {/* Header with back button */}
        <View className="flex-row items-center mb-6">
          <Pressable 
            onPress={() => router.back()} 
            style={{ padding: 6, marginRight: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.USER_CARDS.MY_BOOKINGS)}
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.USER_CARDS.MY_BOOKINGS_DESC)}
            </Text>
          </View>
        </View>

        {bookings.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, alignSelf: 'flex-start', marginBottom: 16 }}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {FILTERS.map((item) => {
              const selected = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className="px-4 py-2 mr-2 rounded-full"
                  style={{
                    backgroundColor: selected ? primaryColor : 'transparent',
                    borderWidth: 1,
                    borderColor: primaryColor,
                  }}
                >
                  <Text style={{ color: selected ? '#fff' : primaryColor }} className="text-sm font-semibold">
                    {t(item.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {busy ? (
          <View className="items-center justify-center flex-1 mt-6">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.COMMON.LOADING)}
            </Text>
          </View>
        ) : bookings.length === 0 ? (
          <View className="items-center p-6 py-12 mt-6 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
            <Ionicons 
              name="calendar-clear-outline" 
              size={48} 
              color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} 
            />
            <Text className="mt-4 text-base font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.NO_BOOKINGS)}
            </Text>
            <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
              Book your first hotel stay from the Explore tab
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            {visibleBookings.length === 0 ? (
              <View className="items-center p-6 py-12 mt-2 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
                <Text className="text-sm text-center text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.BOOKING.FILTER_EMPTY)}
                </Text>
              </View>
            ) : (
            <FlatList
              data={visibleBookings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <BookingCard
                  booking={item}
                  onPress={onPressBooking}
                  showGenerateQr
                  showRooms={false}
                />
              )}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}
              onRefresh={onRefresh}
              refreshing={loading}
            />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
