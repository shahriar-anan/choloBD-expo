import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { RootState } from '@/store/store';
import { getHotelRooms } from '@/services/api/hotelRooms';
import { getUserHotelBookings } from '@/services/api/hotelBookings';

export function HotelMetricsTab() {
  const { isDark } = useTheme();
  const auth = useSelector((s: RootState) => s.auth);
  
  const hotelId = auth.user?.employeeServiceEntityId || auth.user?.serviceEntityId;

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    maintenanceRooms: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    occupancyRate: 0,
  });

  useEffect(() => {
    if (hotelId) {
      fetchMetrics();
    }
  }, [hotelId]);

  const fetchMetrics = async () => {
    if (!hotelId) return;

    try {
      setLoading(true);

      const [rooms, bookings] = await Promise.all([
        getHotelRooms(hotelId),
        getUserHotelBookings({ hotelId }),
      ]);

      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter((r: any) => r.roomStatus === 'OCCUPIED').length;
      const availableRooms = rooms.filter((r: any) => r.roomStatus === 'AVAILABLE').length;
      const maintenanceRooms = rooms.filter((r: any) => r.roomStatus === 'MAINTENANCE').length;

      const today = new Date().toDateString();
      const todayCheckIns = bookings.results.filter(
        (b: any) => new Date(b.checkInDate).toDateString() === today
      ).length;
      const todayCheckOuts = bookings.results.filter(
        (b: any) => new Date(b.checkOutDate).toDateString() === today
      ).length;

      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      setMetrics({
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        todayCheckIns,
        todayCheckOuts,
        occupancyRate,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="items-center justify-center py-12">
        <ActivityIndicator
          size="large"
          color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
        />
      </View>
    );
  }

  const MetricCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: string;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <View className="flex-1 p-4 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark">
      <View
        className="w-10 h-10 mb-3 rounded-full items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
        {value}
      </Text>
      <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{label}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
      <Text className="mb-4 text-lg font-semibold text-text dark:text-text-dark">
        Hotel Metrics
      </Text>

      {/* Room Status Grid */}
      <View className="flex-row gap-3 mb-4">
        <MetricCard
          icon="bed-outline"
          label="Total Rooms"
          value={metrics.totalRooms}
          color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
        />
        <MetricCard
          icon="checkmark-circle"
          label="Occupied"
          value={metrics.occupiedRooms}
          color="#EF4444"
        />
      </View>

      <View className="flex-row gap-3 mb-4">
        <MetricCard
          icon="time-outline"
          label="Available"
          value={metrics.availableRooms}
          color="#10B981"
        />
        <MetricCard
          icon="construct-outline"
          label="Maintenance"
          value={metrics.maintenanceRooms}
          color="#F59E0B"
        />
      </View>

      {/* Today's Activity */}
      <View className="p-4 mt-2 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark">
        <Text className="mb-3 text-base font-semibold text-text dark:text-text-dark">
          Today's Activity
        </Text>
        <View className="space-y-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name="enter-outline"
                size={16}
                color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
              />
              <Text className="ml-2 text-sm text-text dark:text-text-dark">
                Check-ins
              </Text>
            </View>
            <Text className="text-base font-semibold text-primary dark:text-primary-dark">
              {metrics.todayCheckIns}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name="exit-outline"
                size={16}
                color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
              />
              <Text className="ml-2 text-sm text-text dark:text-text-dark">
                Check-outs
              </Text>
            </View>
            <Text className="text-base font-semibold text-primary dark:text-primary-dark">
              {metrics.todayCheckOuts}
            </Text>
          </View>

          <View className="flex-row items-center justify-between pt-3 border-t border-border dark:border-border-dark">
            <View className="flex-row items-center">
              <Ionicons
                name="stats-chart"
                size={16}
                color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
              />
              <Text className="ml-2 text-sm text-text dark:text-text-dark">
                Occupancy Rate
              </Text>
            </View>
            <Text className="text-base font-semibold text-primary dark:text-primary-dark">
              {metrics.occupancyRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
