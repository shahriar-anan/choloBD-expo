import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { PaymentStatusBadge } from '../../../../components/ui/PaymentStatusBadge';
import { formatBdt } from '../../../../utils/money';
import { ActivityBookingRecord } from '../../../../services/api/activityBookings';
import { GuideBookingRecord } from '../../../../services/api/guideBookings';
import { canPayActivity, canPayGuide, loadAttractionBooking } from '../../../../hooks/useAttractionBookings';
import type { PaymentStatus } from '../../../../types/payments';

function dayLabel(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function AttractionBookingDetailPage() {
  const router = useRouter();
  const { bookingId, kind } = useLocalSearchParams<{ bookingId: string; kind?: string }>();
  const bookingKind = kind === 'guide' ? 'guide' : 'activity';
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityBookingRecord | null>(null);
  const [guide, setGuide] = useState<GuideBookingRecord | null>(null);

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const onPrimary = isDark ? theme.colors['onPrimary-dark'] : theme.colors.onPrimary;

  const reload = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const row = await loadAttractionBooking(bookingKind, bookingId);
      if (bookingKind === 'guide') {
        setGuide(row as GuideBookingRecord);
        setActivity(null);
      } else {
        setActivity(row as ActivityBookingRecord);
        setGuide(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.NOT_FOUND));
    } finally {
      setLoading(false);
    }
  }, [bookingId, bookingKind, t]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const booking = bookingKind === 'guide' ? guide : activity;
  const payable = activity ? canPayActivity(activity) : guide ? canPayGuide(guide) : false;
  const title = activity?.activitySpot?.name
    || [guide?.guide?.firstName, guide?.guide?.lastName].filter(Boolean).join(' ')
    || t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.DETAILS);

  const pay = () => {
    if (!booking) return;
    router.push({
      pathname: '/(tabs)/dashboard/payment',
      params: {
        bookingId: booking.id,
        serviceType: bookingKind === 'guide' ? 'GUIDE_SERVICE' : 'ACTIVITY_BOOKING',
        totalPrice: String(booking.totalPrice),
      },
    });
  };

  const leave = () => {
    router.replace({
      pathname: '/(tabs)/dashboard/attraction-bookings',
      params: { tab: bookingKind === 'guide' ? 'guides' : 'activities' },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 px-6 bg-background dark:bg-background-dark">
        <Text className="text-center text-muted dark:text-muted-dark">
          {error || t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.NOT_FOUND)}
        </Text>
        <Pressable onPress={leave} className="mt-4">
          <Text style={{ color: primary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.COMMON.BACK)}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={leave} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="text-xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.DETAILS)}
        </Text>
      </View>
      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 140 }}>
        <Text className="text-lg font-bold text-text dark:text-text-dark">{title}</Text>
        <Text className="mt-1 text-sm" style={{ color: muted }}>{booking.confirmationCode}</Text>
        <View className="mt-3">
          <PaymentStatusBadge status={(booking.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID') as PaymentStatus} />
        </View>
        <Text className="mt-4 text-sm" style={{ color: muted }}>
          {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.DATE)}
        </Text>
        <Text className="text-text dark:text-text-dark">{dayLabel(booking.bookingDate)}</Text>
        {guide?.startTime || guide?.endTime ? (
          <>
            <Text className="mt-3 text-sm" style={{ color: muted }}>
              {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TIME)}
            </Text>
            <Text className="text-text dark:text-text-dark">
              {[guide.startTime, guide.endTime].filter(Boolean).map((value) => dayLabel(value)).join(' – ')}
            </Text>
          </>
        ) : null}
        <Text className="mt-3 text-sm" style={{ color: muted }}>
          {activity
            ? t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PARTICIPANTS)
            : t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TRAVELERS)}
        </Text>
        <Text className="text-text dark:text-text-dark">
          {activity ? activity.participantCount : guide?.travelerCount}
        </Text>
        <Text className="mt-3 text-lg font-bold text-text dark:text-text-dark">{formatBdt(booking.totalPrice)}</Text>
        {guide && guide.status === 'PENDING' ? (
          <Text className="mt-4 text-sm" style={{ color: muted }}>
            {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PAY_AFTER_ACCEPT)}
          </Text>
        ) : null}
      </ScrollView>
      {payable ? (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background dark:bg-background-dark">
          <Pressable onPress={pay} className="items-center py-4 rounded-xl" style={{ backgroundColor: primary }}>
            <Text style={{ color: onPrimary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.PAYMENT.COMPLETE_PAYMENT)}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
