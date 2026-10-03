import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCurrentBookingsFetch } from '../../hooks/useCurrentBookingsFetch';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { DeskBucket, formatDeskDate, matchesDeskBucket } from '../../utilities/hotelDesk';

const ROWS: { lens: Exclude<DeskBucket, 'all'>; labelKey: string }[] = [
  { lens: 'arriving', labelKey: TRANSLATION_KEYS.HOTEL_DESK.ARRIVING },
  { lens: 'inHouse', labelKey: TRANSLATION_KEYS.HOTEL_DESK.IN_HOUSE },
  { lens: 'departing', labelKey: TRANSLATION_KEYS.HOTEL_DESK.DEPARTING },
  { lens: 'unpaid', labelKey: TRANSLATION_KEYS.HOTEL_DESK.UNPAID },
];

export function HotelDeskHome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { bookings, loading, error, refetch } = useCurrentBookingsFetch(100);
  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    ROWS.forEach((row) => {
      next[row.lens] = bookings.filter((booking) => matchesDeskBucket(booking, row.lens)).length;
    });
    return next;
  }, [bookings]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        <Text className="text-2xl font-bold text-text dark:text-text-dark">{formatDeskDate(new Date())}</Text>

        {loading ? (
          <ActivityIndicator className="mt-8" size="large" color={theme.colors.primary} />
        ) : error ? (
          <View className="mt-6">
            <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.LOAD_FAILED)}</Text>
            <Pressable onPress={() => { void refetch(); }} className="self-start mt-3" accessibilityRole="button">
              <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                {t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3 mt-6">
            {ROWS.map((row) => (
              <Pressable
                key={row.lens}
                onPress={() => router.push(`/(tabs)/bookings?lens=${row.lens}`)}
                accessibilityRole="button"
                accessibilityLabel={t(row.labelKey)}
                className="w-[47%] p-4 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark"
              >
                <Text className="text-2xl font-bold text-primary dark:text-primary-dark">{counts[row.lens] ?? 0}</Text>
                <Text className="mt-1 text-sm text-text dark:text-text-dark">{t(row.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => router.push('/(tabs)/dashboard/service-admin/availability')}
          className="mt-6"
          accessibilityRole="button"
        >
          <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.AVAILABILITY)}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
