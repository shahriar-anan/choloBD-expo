import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { roleBookings } from '../../../../utilities/travelerShell';
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
import { DetailCard, DetailRow } from '../../../../components/booking/DetailBlocks';
import { BookingQrSheet } from '../../../../components/booking/BookingQrSheet';
import { profilePhotoUri } from '../../../../utilities/profileImage';

function dayLabel(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function AttractionBookingDetailPage() {
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const { bookingId, kind } = useLocalSearchParams<{ bookingId: string; kind?: string }>();
  const bookingKind = kind === 'guide' ? 'guide' : 'activity';
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityBookingRecord | null>(null);
  const [guide, setGuide] = useState<GuideBookingRecord | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

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
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(roleBookings(role));
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

  const cover = profilePhotoUri(activity?.activitySpot?.images?.[0]?.url || guide?.guide?.images?.[0]?.url);
  const hours = [activity?.activitySpot?.openingHours, activity?.activitySpot?.closingHours].filter(Boolean).join(' – ');
  const languages = guide?.guide?.languages?.filter(Boolean).join(', ');

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: payable ? 120 : 32 }}>
        <View style={{ height: 180, backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
          {cover ? (
            <Image source={{ uri: cover }} style={{ width: '100%', height: 180 }} resizeMode="cover" accessibilityRole="image" />
          ) : (
            <View className="items-center justify-center flex-1">
              <Ionicons name={activity ? 'walk-outline' : 'person-outline'} size={40} color={muted} />
            </View>
          )}
          <Pressable
            onPress={leave}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)}
            className="absolute items-center justify-center w-10 h-10 rounded-full"
            style={{ top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.92)' }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">{title}</Text>
          <Text className="mt-1 text-sm" style={{ color: muted }}>
            {activity?.activitySpot?.location?.name || guide?.guide?.location?.name || ''}
          </Text>
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-1 pr-3">
              <Text className="text-xs" style={{ color: muted }}>{t(TRANSLATION_KEYS.BOOKING.CONFIRMATION_CODE)}</Text>
              <Text className="text-sm font-semibold text-text dark:text-text-dark">{booking.confirmationCode}</Text>
            </View>
            <Pressable
              onPress={() => setQrOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.BOOKING.QR_CODE)}
              className="flex-row items-center px-3 py-2 rounded-full"
              style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}
            >
              <Ionicons name="qr-code" size={20} color={primary} />
              <Text className="ml-2 text-sm font-bold" style={{ color: primary }}>{t(TRANSLATION_KEYS.BOOKING.QR_CODE)}</Text>
            </Pressable>
          </View>
          <View className="flex-row items-center mt-3">
            <Text className="mr-2 text-sm font-semibold text-text dark:text-text-dark">{booking.status}</Text>
            <PaymentStatusBadge status={(booking.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID') as PaymentStatus} />
          </View>
        </View>

        <DetailCard title={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.DETAILS)}>
          <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.DATE)} value={dayLabel(booking.bookingDate)} />
          <DetailRow
            label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TIME)}
            value={guide ? [guide.startTime, guide.endTime].filter(Boolean).map((value) => dayLabel(value)).join(' – ') : null}
          />
          <DetailRow
            label={activity
              ? t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PARTICIPANTS)
              : t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TRAVELERS)}
            value={activity ? activity.participantCount : guide?.travelerCount}
          />
          <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PER_PERSON)} value={activity?.price != null ? formatBdt(activity.price) : guide?.price != null ? formatBdt(guide.price) : null} />
          <DetailRow label={t(TRANSLATION_KEYS.BOOKING.TOTAL_PRICE)} value={formatBdt(booking.totalPrice)} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PAYMENT)} value={booking.paymentMethod || booking.paymentStatus} />
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.BOOKED_ON)}
            value={(activity?.bookedAt || guide?.bookedAt) ? dayLabel(activity?.bookedAt || guide?.bookedAt) : null}
          />
        </DetailCard>

        {activity?.activitySpot ? (
          <DetailCard title={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.ABOUT)}>
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.LOCATION)} value={activity.activitySpot.location?.name} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PHONE)} value={activity.activitySpot.phoneNumber} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.HOURS)} value={hours} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.DURATION)} value={activity.activitySpot.duration} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.BEST_TIME)} value={activity.activitySpot.bestTimeToVisit} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.AGE)} value={activity.activitySpot.ageRestriction} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.ENTRY)} value={activity.activitySpot.entryCost != null ? formatBdt(activity.activitySpot.entryCost) : null} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.ABOUT)} value={activity.activitySpot.description} />
          </DetailCard>
        ) : null}

        {guide?.guide ? (
          <DetailCard title={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.ABOUT)}>
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.LOCATION)} value={guide.guide.location?.name} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.LANGUAGES)} value={languages} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.EXPERIENCE)} value={guide.guide.experienceYears != null ? String(guide.guide.experienceYears) : null} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PHONE)} value={guide.guide.phoneNumber} />
            <DetailRow label={t(TRANSLATION_KEYS.BOOKING.EMAIL)} value={guide.guide.contactEmail} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.ABOUT)} value={guide.guide.bio} />
          </DetailCard>
        ) : null}

        {(activity?.specialRequests || guide?.specialRequests || activity?.specialRequirements || guide?.specialRequirements || activity?.bookingConfirmInstruction || guide?.status === 'PENDING') ? (
          <DetailCard>
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.REQUESTS)} value={activity?.specialRequests || guide?.specialRequests} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.REQUIREMENTS)} value={activity?.specialRequirements || guide?.specialRequirements} />
            <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.INSTRUCTIONS)} value={activity?.bookingConfirmInstruction} />
            {guide?.status === 'PENDING' ? (
              <Text className="py-2 text-sm" style={{ color: muted }}>
                {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PAY_AFTER_ACCEPT)}
              </Text>
            ) : null}
          </DetailCard>
        ) : null}
      </ScrollView>
      {payable ? (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background dark:bg-background-dark">
          <Pressable onPress={pay} className="items-center py-4 rounded-xl" style={{ backgroundColor: primary }}>
            <Text style={{ color: onPrimary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.PAYMENT.COMPLETE_PAYMENT)}</Text>
          </Pressable>
        </View>
      ) : null}
      <BookingQrSheet
        visible={qrOpen}
        mode={activity ? 'activity' : 'unsupported'}
        bookingId={booking.id}
        onClose={() => setQrOpen(false)}
      />
    </SafeAreaView>
  );
}
