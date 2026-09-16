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
import { getHotelDetail } from '@/services/api/hotelDetail';

interface HotelStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
  totalRooms: number;
  bookedRooms: number;
}

export default function HotelStatsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const auth = useSelector((s: RootState) => s.auth);

  const hotelId = auth.user?.serviceEntityId;

  const [stats, setStats] = useState<HotelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!hotelId) {
      setError('Hotel information not found');
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const [hotelData, bookingsData] = await Promise.allSettled([
        getHotelDetail(hotelId),
        getUserHotelBookings({ hotelId }),
      ]);

      const hotel = hotelData.status === 'fulfilled' ? hotelData.value : null;
      const bookings = bookingsData.status === 'fulfilled' ? bookingsData.value.results : [];

      if (!hotel) {
        throw new Error('Failed to load hotel data');
      }

      // Calculate stats
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const activeStatuses = ['PENDING', 'CONFIRMED'];
      const completedStatuses = ['COMPLETED', 'CHECKED_OUT'];
      const cancelledStatuses = ['CANCELLED'];

      const activeBookings = bookings.filter((b: any) =>
        activeStatuses.includes(b.status)
      );
      const completedBookings = bookings.filter((b: any) =>
        completedStatuses.includes(b.status)
      );
      const cancelledBookings = bookings.filter((b: any) =>
        cancelledStatuses.includes(b.status)
      );

      const totalRevenue = [...completedBookings, ...activeBookings].reduce(
        (sum: number, b: any) => sum + (b.totalCost || 0),
        0
      );

      const monthlyBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.checkInDate);
        return (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear &&
          (completedStatuses.includes(b.status) || activeStatuses.includes(b.status))
        );
      });

      const monthlyRevenue = monthlyBookings.reduce(
        (sum: number, b: any) => sum + (b.totalCost || 0),
        0
      );

      const averageBookingValue =
        bookings.length > 0
          ? totalRevenue / bookings.length
          : 0;

      const totalRooms =
        hotel.rooms?.length ||
        hotel.roomTypes?.reduce((sum: number, rt: any) => sum + (rt.totalCount || 0), 0) ||
        hotel.totalRooms ||
        0;
      const bookedRooms = activeBookings.length;
      const occupancyRate = totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0;

      setStats({
        totalBookings: bookings.length,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalRevenue,
        monthlyRevenue,
        averageBookingValue,
        occupancyRate,
        totalRooms,
        bookedRooms,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [hotelId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({
    icon,
    label,
    value,
    subtitle,
    color,
  }: {
    icon: string;
    label: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <View className="p-4 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
            {value}
          </Text>
          {subtitle && (
            <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
              {subtitle}
            </Text>
          )}
        </View>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
      </View>
      <Text className="text-sm text-muted dark:text-muted-dark">{label}</Text>
    </View>
  );

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
            onPress={fetchStats}
            className="px-6 py-3 mt-4 rounded-xl bg-primary dark:bg-primary-dark"
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) return null;

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
            {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.TITLE)}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.SUBTITLE)}
          </Text>
        </View>

        <View className="px-6 pb-6">
          {/* Revenue Stats */}
          <View className="mb-4">
            <Text className="mb-3 text-base font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.REVENUE)}
            </Text>
            <View className="gap-3">
              <StatCard
                icon="cash-outline"
                label={t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.TOTAL_REVENUE)}
                value={`৳${(stats.totalRevenue / 1000).toFixed(1)}K`}
                color="#10B981"
              />
              <StatCard
                icon="trending-up-outline"
                label={t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.MONTHLY_REVENUE)}
                value={`৳${(stats.monthlyRevenue / 1000).toFixed(1)}K`}
                subtitle={t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.THIS_MONTH)}
                color="#3B82F6"
              />
              <StatCard
                icon="calculator-outline"
                label={t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.AVG_BOOKING_VALUE)}
                value={`৳${Math.round(stats.averageBookingValue).toLocaleString()}`}
                color="#F59E0B"
              />
            </View>
          </View>

          {/* Booking Stats */}
          <View className="mb-4">
            <Text className="mb-3 text-base font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.BOOKINGS)}
            </Text>
            <View className="gap-3">
              <StatCard
                icon="calendar-outline"
                label={t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.TOTAL_BOOKINGS)}
                value={stats.totalBookings}
                color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <StatCard
                    icon="time-outline"
                    label={t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.ACTIVE)}
                    value={stats.activeBookings}
                    color="#10B981"
                  />
                </View>
                <View className="flex-1">
                  <StatCard
                    icon="checkmark-circle-outline"
                    label={t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.COMPLETED)}
                    value={stats.completedBookings}
                    color="#3B82F6"
                  />
                </View>
              </View>
              <StatCard
                icon="close-circle-outline"
                label={t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.CANCELLED)}
                value={stats.cancelledBookings}
                color="#EF4444"
              />
            </View>
          </View>

          {/* Occupancy Stats */}
          <View className="mb-4">
            <Text className="mb-3 text-base font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.OCCUPANCY)}
            </Text>
            <View className="gap-3">
              <StatCard
                icon="bed-outline"
                label={t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.OCCUPANCY_RATE)}
                value={`${stats.occupancyRate.toFixed(1)}%`}
                subtitle={`${stats.bookedRooms} / ${stats.totalRooms} ${t(TRANSLATION_KEYS.DASHBOARD.HOTEL_STATS.ROOMS)}`}
                color="#8B5CF6"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
