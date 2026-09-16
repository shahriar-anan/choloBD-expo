import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { RootState } from '@/store/store';
import { getUserHotelBookings } from '@/services/api/hotelBookings';

interface EarningsData {
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  monthlyEarnings: { month: string; amount: number }[];
  recentTransactions: {
    id: string;
    confirmationCode: string;
    amount: number;
    status: string;
    date: string;
    guestName: string;
  }[];
}

export default function HotelEarningsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const auth = useSelector((s: RootState) => s.auth);

  const hotelId = auth.user?.serviceEntityId;

  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = async () => {
    if (!hotelId) {
      setError('Hotel information not found');
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const bookingsData = await getUserHotelBookings({ hotelId });
      const bookings = bookingsData.results || [];

      const completedStatuses = ['COMPLETED', 'CHECKED_OUT'];
      const paidStatuses = ['COMPLETED', 'CHECKED_OUT'];
      const pendingStatuses = ['CONFIRMED'];

      const completedBookings = bookings.filter((b: any) =>
        completedStatuses.includes(b.status)
      );
      const paidBookings = bookings.filter((b: any) =>
        paidStatuses.includes(b.status)
      );
      const pendingBookings = bookings.filter((b: any) =>
        pendingStatuses.includes(b.status)
      );

      const totalEarnings = completedBookings.reduce(
        (sum: number, b: any) => sum + (b.totalCost || 0),
        0
      );
      const paidEarnings = paidBookings.reduce(
        (sum: number, b: any) => sum + (b.totalCost || 0),
        0
      );
      const pendingEarnings = pendingBookings.reduce(
        (sum: number, b: any) => sum + (b.totalCost || 0),
        0
      );

      // Calculate monthly earnings for last 6 months
      const now = new Date();
      const monthlyMap: Record<string, number> = {};

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyMap[key] = 0;
      }

      completedBookings.forEach((b: any) => {
        const bookingDate = new Date(b.checkInDate);
        const key = bookingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key] += b.totalCost || 0;
        }
      });

      const monthlyEarnings = Object.entries(monthlyMap).map(([month, amount]) => ({
        month,
        amount,
      }));

      // Get recent transactions (last 10 completed bookings)
      const recentTransactions = completedBookings
        .slice(0, 10)
        .map((b: any) => ({
          id: b.id,
          confirmationCode: b.confirmationCode || 'N/A',
          amount: b.totalCost || 0,
          status: b.status,
          date: b.checkInDate,
          guestName: b.guestName || b.user?.userName || b.user?.name || 'Guest',
        }));

      setEarnings({
        totalEarnings,
        paidEarnings,
        pendingEarnings,
        monthlyEarnings,
        recentTransactions,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [hotelId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="items-center justify-center flex-1 bg-background dark:bg-background-dark"
      >
        <ActivityIndicator
          size="large"
          color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 bg-background dark:bg-background-dark"
      >
        <View className="items-center justify-center flex-1 px-6">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
          />
          <Text className="mt-4 text-base text-center text-muted dark:text-muted-dark">
            {error}
          </Text>
          <Pressable
            onPress={fetchEarnings}
            className="px-6 py-3 mt-4 rounded-xl bg-primary dark:bg-primary-dark"
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!earnings) return null;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 6, marginBottom: 12 }}
            accessibilityRole="button"
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? theme.colors['text-dark'] : theme.colors.text}
            />
          </Pressable>

          <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EARNINGS.TITLE)}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EARNINGS.SUBTITLE)}
          </Text>
        </View>

        <View className="px-6 pb-6">
          {/* Earnings Summary */}
          <View className="p-4 mb-4 border rounded-xl bg-white dark:bg-surface-dark border-primary/20 dark:border-primary-dark/40">
            <Text className="text-xs font-semibold tracking-wide uppercase text-primary dark:text-primary-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EARNINGS.TOTAL_EARNINGS)}
            </Text>
            <Text className="mt-3 text-3xl font-bold font-heading text-text dark:text-text-dark">
              ৳{(earnings.totalEarnings / 1000).toFixed(1)}K
            </Text>
            <View className="flex-row gap-4 mt-4">
              <View className="flex-1">
                <Text className="text-xs text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EARNINGS.PAID)}
                </Text>
                <Text className="mt-1 text-lg font-semibold text-green-600 dark:text-green-500">
                  ৳{(earnings.paidEarnings / 1000).toFixed(1)}K
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EARNINGS.PENDING)}
                </Text>
                <Text className="mt-1 text-lg font-semibold text-orange-600 dark:text-orange-500">
                  ৳{(earnings.pendingEarnings / 1000).toFixed(1)}K
                </Text>
              </View>
            </View>
          </View>

          {/* Monthly Earnings Chart */}
          <View className="p-4 mb-4 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark">
            <Text className="mb-3 text-base font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EARNINGS.MONTHLY_TREND)}
            </Text>
            <View className="space-y-3">
              {earnings.monthlyEarnings.map((item, index) => {
                const maxAmount = Math.max(...earnings.monthlyEarnings.map((m) => m.amount), 1);
                const barWidth = (item.amount / maxAmount) * 100;

                return (
                  <View key={index}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-muted dark:text-muted-dark">
                        {item.month}
                      </Text>
                      <Text className="text-xs font-semibold text-text dark:text-text-dark">
                        ৳{(item.amount / 1000).toFixed(1)}K
                      </Text>
                    </View>
                    <View className="h-2 overflow-hidden rounded-full bg-border dark:bg-border-dark">
                      <View
                        className="h-full rounded-full bg-primary dark:bg-primary-dark"
                        style={{ width: `${barWidth}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Transactions */}
          <View className="p-4 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark">
            <Text className="mb-3 text-base font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EARNINGS.RECENT_TRANSACTIONS)}
            </Text>
            {earnings.recentTransactions.length === 0 ? (
              <Text className="text-sm text-center text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EARNINGS.NO_TRANSACTIONS)}
              </Text>
            ) : (
              <View className="space-y-3">
                {earnings.recentTransactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    className="pb-3 border-b border-border dark:border-border-dark last:border-b-0 last:pb-0"
                  >
                    <View className="flex-row items-start justify-between mb-1">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-text dark:text-text-dark">
                          {transaction.confirmationCode}
                        </Text>
                        <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                          {transaction.guestName}
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                        ৳{transaction.amount.toLocaleString()}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted dark:text-muted-dark">
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
