import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
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
import { useFetchActivityBookings } from '@/hooks/useFetchActivityBookings';
import type { ActivityBooking } from '@/types/activityBookings';

type StatusType = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export default function ActivityBookingsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const auth = useSelector((s: RootState) => s.auth);

  const [statusFilter, setStatusFilter] = useState<StatusType | 'all'>('all');

  const { bookings, loading, error, refetch } = useFetchActivityBookings({
    userId: auth.user?.id,
    status: statusFilter === 'all' ? undefined : (statusFilter as any),
  });

  const bookingList = bookings.results;

  const statusColors = {
    PENDING: { bg: '#FEF3C7', text: '#92400E', dark: { bg: '#78350F', text: '#FEF3C7' } },
    CONFIRMED: { bg: '#DBEAFE', text: '#1E40AF', dark: { bg: '#1E3A8A', text: '#DBEAFE' } },
    COMPLETED: { bg: '#D1FAE5', text: '#065F46', dark: { bg: '#064E3B', text: '#D1FAE5' } },
    CANCELLED: { bg: '#FEE2E2', text: '#991B1B', dark: { bg: '#7F1D1D', text: '#FEE2E2' } },
  };

  const handleBookingPress = (bookingId: string) => {
    router.push({
      pathname: '/(tabs)/dashboard/activity-bookings/[bookingId]',
      params: { bookingId },
    });
  };

  const renderBookingCard = ({ item }: { item: ActivityBooking }) => {
    const statusColor = statusColors[item.status as StatusType];
    const bgColor = isDark ? statusColor.dark.bg : statusColor.bg;
    const textColor = isDark ? statusColor.dark.text : statusColor.text;

    return (
      <Pressable
        onPress={() => handleBookingPress(item.id)}
        className="mb-4 overflow-hidden border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark"
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-base font-semibold text-text dark:text-text-dark">
                {item.activitySpot?.name || 'Activity'}
              </Text>
              <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                {item.confirmationCode || 'Pending confirmation'}
              </Text>
            </View>
            <View
              className="px-2 py-1 rounded-md"
              style={{ backgroundColor: bgColor }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: textColor }}
              >
                {item.status}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-2">
            <Ionicons
              name="calendar-outline"
              size={14}
              color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
            />
            <Text className="ml-2 text-sm text-muted dark:text-muted-dark">
              {new Date(item.bookingDate).toLocaleDateString()}
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <Ionicons
              name="people-outline"
              size={14}
              color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
            />
            <Text className="ml-2 text-sm text-muted dark:text-muted-dark">
              {item.participantCount} participant(s)
            </Text>
          </View>

          <View className="flex-row items-center justify-between pt-3 mt-3 border-t border-border dark:border-border-dark">
            <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
              ৳{(item.totalCost ?? item.totalPrice)?.toLocaleString() || 0}
            </Text>
            <View className="flex-row items-center">
              <Text className="mr-2 text-sm text-primary dark:text-primary-dark">
                View Details
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
              />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
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
          My Activity Bookings
        </Text>
      </View>

      {/* Status Filter */}
      <View className="px-6 mb-4">
        <FlatList
          data={['all', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setStatusFilter(item as any)}
              className="px-4 py-2 mr-2 border rounded-full"
              style={{
                backgroundColor:
                  statusFilter === item
                    ? isDark
                      ? theme.colors['primary-dark']
                      : theme.colors.primary
                    : 'transparent',
                borderColor:
                  statusFilter === item
                    ? isDark
                      ? theme.colors['primary-dark']
                      : theme.colors.primary
                    : isDark
                    ? theme.colors['border-dark']
                    : theme.colors.border,
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color:
                    statusFilter === item
                      ? '#ffffff'
                      : isDark
                      ? theme.colors['text-dark']
                      : theme.colors.text,
                }}
              >
                {item === 'all' ? 'All' : item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Bookings List */}
      {loading && !bookingList.length ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator
            size="large"
            color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
          />
        </View>
      ) : error ? (
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
            onPress={refetch}
            className="px-6 py-3 mt-4 rounded-xl bg-primary dark:bg-primary-dark"
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : bookingList.length === 0 ? (
        <View className="items-center justify-center flex-1 px-6">
          <Ionicons
            name="calendar-outline"
            size={64}
            color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
          />
          <Text className="mt-4 text-lg font-semibold text-center text-text dark:text-text-dark">
            No Activity Bookings
          </Text>
          <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
            {statusFilter === 'all'
              ? 'You haven\'t made any activity bookings yet'
              : `No ${statusFilter.toLowerCase()} bookings found`}
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/explore')}
            className="px-6 py-3 mt-6 rounded-xl bg-primary dark:bg-primary-dark"
          >
            <Text className="font-semibold text-white">Explore Activities</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={bookingList}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
