import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCurrentBookingsFetch } from '../../../../hooks/useCurrentBookingsFetch';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import { DeskBucket, formatDeskDate, matchesDeskBucket } from '../../../../utilities/hotelDesk';

const ROWS: { lens: DeskBucket; label: string }[] = [
  { lens: 'arriving', label: 'Arriving' },
  { lens: 'inHouse', label: 'In house' },
  { lens: 'departing', label: 'Departing' },
  { lens: 'unpaid', label: 'Unpaid' },
];

export default function HotelTodayScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { bookings, loading, error } = useCurrentBookingsFetch(100);
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    ROWS.forEach((row) => {
      next[row.lens] = bookings.filter((booking) => matchesDeskBucket(booking, row.lens)).length;
    });
    return next;
  }, [bookings]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">{formatDeskDate(new Date())}</Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">Morning 08:00–15:00 · Afternoon 15:00–22:00 · Night 22:00–08:00</Text>

        {loading ? (
          <ActivityIndicator className="mt-8" size="large" color={theme.colors.primary} />
        ) : error ? (
          <Text className="mt-6 text-sm text-muted dark:text-muted-dark">Could not load today&apos;s house.</Text>
        ) : (
          <View className="flex-row flex-wrap gap-3 mt-6">
            {ROWS.map((row) => (
              <Pressable
                key={row.lens}
                onPress={() => router.push(`/(tabs)/dashboard/service-admin/current-bookings?lens=${row.lens}`)}
                className="w-[47%] p-4 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark"
              >
                <Text className="text-2xl font-bold text-primary dark:text-primary-dark">{counts[row.lens] ?? 0}</Text>
                <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{row.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={() => router.push('/(tabs)/dashboard/service-admin/availability')} className="mt-6">
          <Text className="text-sm font-semibold text-primary dark:text-primary-dark">Week availability</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
