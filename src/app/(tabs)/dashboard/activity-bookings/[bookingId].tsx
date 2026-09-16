import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { useActivityBookingLogic } from '@/hooks/useActivityBookingLogic';
import { getActivityBookingDetail } from '@/services/api/activityBookings';
import type { ActivityBooking } from '@/types/activityBookings';

type StatusType = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export default function ActivityBookingDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { loading: mutating, handleCancel, handleGenerateQr } = useActivityBookingLogic();

  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<ActivityBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getActivityBookingDetail(bookingId);
      setBooking(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const statusColors = {
    PENDING: { bg: '#FEF3C7', text: '#92400E', dark: { bg: '#78350F', text: '#FEF3C7' } },
    CONFIRMED: { bg: '#DBEAFE', text: '#1E40AF', dark: { bg: '#1E3A8A', text: '#DBEAFE' } },
    COMPLETED: { bg: '#D1FAE5', text: '#065F46', dark: { bg: '#064E3B', text: '#D1FAE5' } },
    CANCELLED: { bg: '#FEE2E2', text: '#991B1B', dark: { bg: '#7F1D1D', text: '#FEE2E2' } },
  };

  const handleCancelPress = () => {
    if (!booking) return;

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await handleCancel(booking.id);
              await fetchBooking();
            } catch {
              // Error handled in hook
            }
          },
        },
      ]
    );
  };

  const handleGenerateQrPress = async () => {
    if (!booking) return;

    try {
      const result = await handleGenerateQr(booking.id);
      if (result?.qrToken) {
        Alert.alert('QR Code', `Your QR token: ${result.qrToken}`);
      }
    } catch {
      // Error handled in hook
    }
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

  if (error || !booking) {
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
            {error || 'Booking not found'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="px-6 py-3 mt-4 rounded-xl bg-primary dark:bg-primary-dark"
          >
            <Text className="font-semibold text-white">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = statusColors[booking.status as StatusType];
  const bgColor = isDark ? statusColor.dark.bg : statusColor.bg;
  const textColor = isDark ? statusColor.dark.text : statusColor.text;

  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const canGenerateQr = booking.status === 'CONFIRMED';

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
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
            Booking Details
          </Text>
        </View>

        <View className="px-6 pb-6">
          {/* Status Badge */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-lg font-semibold text-text dark:text-text-dark">
                {booking.activitySpot?.name || 'Activity'}
              </Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                {booking.confirmationCode || 'Awaiting confirmation'}
              </Text>
            </View>
            <View
              className="px-3 py-2 rounded-lg"
              style={{ backgroundColor: bgColor }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: textColor }}
              >
                {booking.status}
              </Text>
            </View>
          </View>

          {/* Booking Info Card */}
          <View className="p-4 mb-6 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark">
            <View className="flex-row items-center pb-3 mb-3 border-b border-border dark:border-border-dark">
              <Ionicons
                name="calendar-outline"
                size={20}
                color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
              />
              <View className="flex-1 ml-3">
                <Text className="text-xs text-muted dark:text-muted-dark">
                  Booking Date
                </Text>
                <Text className="mt-1 text-base font-semibold text-text dark:text-text-dark">
                  {new Date(booking.bookingDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center pb-3 mb-3 border-b border-border dark:border-border-dark">
              <Ionicons
                name="people-outline"
                size={20}
                color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
              />
              <View className="flex-1 ml-3">
                <Text className="text-xs text-muted dark:text-muted-dark">
                  Participants
                </Text>
                <Text className="mt-1 text-base font-semibold text-text dark:text-text-dark">
                  {booking.participantCount} person(s)
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Ionicons
                name="cash-outline"
                size={20}
                color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
              />
              <View className="flex-1 ml-3">
                <Text className="text-xs text-muted dark:text-muted-dark">
                  Total Cost
                </Text>
                <Text className="mt-1 text-base font-semibold text-primary dark:text-primary-dark">
                  ৳{booking.totalCost?.toLocaleString() || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Special Requirements */}
          {booking.specialRequirements && (
            <View className="p-4 mb-4 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark">
              <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
                Special Requirements
              </Text>
              <Text className="text-sm text-muted dark:text-muted-dark">
                {booking.specialRequirements}
              </Text>
            </View>
          )}

          {/* Special Requests */}
          {booking.specialRequests && (
            <View className="p-4 mb-6 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark">
              <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
                Special Requests
              </Text>
              <Text className="text-sm text-muted dark:text-muted-dark">
                {booking.specialRequests}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3">
            {canGenerateQr && (
              <Pressable
                onPress={handleGenerateQrPress}
                disabled={mutating}
                className="p-4 border rounded-xl border-primary dark:border-primary-dark"
                style={{
                  opacity: mutating ? 0.6 : 1,
                }}
              >
                <Text className="text-base font-semibold text-center text-primary dark:text-primary-dark">
                  Generate QR Code
                </Text>
              </Pressable>
            )}

            {canCancel && (
              <Pressable
                onPress={handleCancelPress}
                disabled={mutating}
                className="p-4 border border-red-600 rounded-xl dark:border-red-500"
                style={{
                  opacity: mutating ? 0.6 : 1,
                }}
              >
                <Text className="text-base font-semibold text-center text-red-600 dark:text-red-500">
                  Cancel Booking
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
