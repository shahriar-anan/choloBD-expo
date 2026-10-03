import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCurrentBookingsFetch } from '../../../../hooks/useCurrentBookingsFetch';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import { inCurrentMonth, summarizeBookings } from '../../../../utilities/hotelDesk';

export default function HotelEarningsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { bookings, loading, error } = useCurrentBookingsFetch(100);
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const scoped = useMemo(
    () => (period === 'month' ? bookings.filter((booking) => inCurrentMonth(booking.checkInDate)) : bookings),
    [bookings, period],
  );
  const figures = summarizeBookings(scoped);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">Earnings</Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
          Figures are from the bookings loaded for this hotel, not a payout from the payment gateway.
        </Text>

        <View className="flex-row gap-2 mt-4">
          {(['month', 'all'] as const).map((item) => {
            const selected = period === item;
            return (
              <Pressable
                key={item}
                onPress={() => setPeriod(item)}
                className={`px-3 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'bg-white border-border dark:bg-surface-dark dark:border-border-dark'}`}
              >
                <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                  {item === 'month' ? 'This month' : 'All loaded'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator className="mt-8" size="large" color={theme.colors.primary} />
        ) : error ? (
          <Text className="mt-6 text-sm text-text dark:text-text-dark">{error}</Text>
        ) : (
          <View className="gap-3 mt-6">
            <View className="p-4 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
              <Text className="text-xs text-muted dark:text-muted-dark">Paid</Text>
              <Text className="mt-1 text-2xl font-bold text-text dark:text-text-dark">৳{figures.paidTotal.toLocaleString()}</Text>
            </View>
            <View className="p-4 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
              <Text className="text-xs text-muted dark:text-muted-dark">Unpaid</Text>
              <Text className="mt-1 text-2xl font-bold text-text dark:text-text-dark">৳{figures.unpaidTotal.toLocaleString()}</Text>
            </View>
            <View className="p-4 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
              <Text className="text-xs text-muted dark:text-muted-dark">Refunded ({figures.refundedCount})</Text>
              <Text className="mt-1 text-2xl font-bold text-text dark:text-text-dark">৳{figures.refundedTotal.toLocaleString()}</Text>
            </View>
          </View>
        )}

        <Pressable onPress={() => router.push('/(tabs)/dashboard/service-admin/current-bookings')} className="mt-6">
          <Text className="text-sm text-muted dark:text-muted-dark">Open reservations for each stay.</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
