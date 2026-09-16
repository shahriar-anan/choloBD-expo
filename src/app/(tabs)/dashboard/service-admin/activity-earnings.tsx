import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { useActivityAdminLogic } from '@/hooks/useActivityAdminLogic';

export default function ActivityEarningsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const {
    activitySpot,
    spotLoading,
    spotError,
    bookings,
    bookingsLoading,
    summary,
    loadDashboard,
  } = useActivityAdminLogic();
  const [refreshing, setRefreshing] = useState(false);

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const transactions = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            new Date(b.bookedAt || b.bookingDate).getTime() -
            new Date(a.bookedAt || a.bookingDate).getTime()
        )
        .slice(0, 30),
    [bookings]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const card = (label: string, value: string) => (
    <View
      className="flex-1 p-4 border rounded-xl"
      style={{ backgroundColor: surface, borderColor: border }}
    >
      <Text className="text-xs text-muted dark:text-muted-dark">{label}</Text>
      <Text className="mt-1 text-xl font-bold text-text dark:text-text-dark">{value}</Text>
    </View>
  );

  const loading = (spotLoading || bookingsLoading) && !refreshing;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()} style={{ padding: 6, marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={24} color={text} />
        </Pressable>
        <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_EARNINGS)}
        </Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
          {activitySpot?.name || t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_EARNINGS_DESC)}
        </Text>
      </View>

      {loading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : spotError ? (
        <View className="px-6">
          <Text className="text-sm text-text dark:text-text-dark">{spotError}</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          ListHeaderComponent={
            <View className="mb-4">
              <View className="flex-row gap-3 mb-3">
                {card('Paid', `৳${summary.paidEarnings.toLocaleString()}`)}
                {card('Pending', `৳${summary.pendingEarnings.toLocaleString()}`)}
              </View>
              <View className="flex-row gap-3 mb-4">
                {card('Total', `৳${summary.totalEarnings.toLocaleString()}`)}
                {card('Bookings', `${summary.totalBookings}`)}
              </View>
              <Text className="mb-2 text-base font-semibold text-text dark:text-text-dark">
                Recent transactions
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text className="py-8 text-center text-muted dark:text-muted-dark">
              No earnings yet
            </Text>
          }
          renderItem={({ item }) => (
            <View
              className="p-4 mb-3 border rounded-xl"
              style={{ backgroundColor: surface, borderColor: border }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="font-semibold text-text dark:text-text-dark">
                    {item.confirmationCode || item.id.slice(0, 8)}
                  </Text>
                  <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                    {new Date(item.bookedAt || item.bookingDate).toLocaleDateString()} · {item.status}
                  </Text>
                </View>
                <Text className="font-bold text-primary dark:text-primary-dark">
                  ৳{(item.totalPrice ?? item.totalCost ?? 0).toLocaleString()}
                </Text>
              </View>
              <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                Payment: {item.paymentStatus}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
