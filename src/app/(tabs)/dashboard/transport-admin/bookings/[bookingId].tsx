import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../hooks/useTheme';
import { useTransportBookingLogic } from '../../../../../hooks/useTransportBookingLogic';
import theme from '../../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../../constants/translationKeys';
import { CancellationEligibility } from '../../../../../types/cancellation';
import { TransportBooking } from '../../../../../types/transports';
import { format } from 'date-fns';
import { CancellationEligibilityPreview } from '../../../../../components/booking/CancellationEligibilityPreview';
import { getCancelActionLabel, shouldFetchCancellationEligibility } from '../../../../../utilities/bookingCancelHelpers';
import { operatorStatusLabel } from '../../../../../utilities/transportFormat';
import { goBack } from '../../../../../utilities/navigation';

function formatWhen(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return `${format(date, 'EEE, d MMM yyyy')} · ${format(date, 'h:mm a')}`;
  } catch {
    return date.toLocaleString();
  }
}

function hireDays(start?: string | null, end?: string | null): number {
  if (!start || !end) return 1;
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return 1;
  return Math.max(1, Math.ceil((to - from) / (24 * 60 * 60 * 1000)));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="p-4 mb-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
      <Text className="mb-3 text-sm font-bold text-text dark:text-text-dark">{title}</Text>
      {children}
    </View>
  );
}

function travelerName(booking: TransportBooking): string {
  const user = booking.user;
  if (user) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || user.userName || user.email || '';
  }
  return '';
}

export default function TransportAdminBookingDetailPage() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { fetchBookingDetail, loadEligibility, handleCancelBooking, cancelSubmitting } =
    useTransportBookingLogic();

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<TransportBooking | null>(null);
  const [eligibility, setEligibility] = useState<CancellationEligibility | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const reload = async () => {
    if (!bookingId) return;
    setLoading(true);
    const row = await fetchBookingDetail(bookingId);
    setBooking(row);
    if (row && shouldFetchCancellationEligibility(row.status)) {
      setEligibility(await loadEligibility(bookingId));
    } else {
      setEligibility(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [bookingId]);

  const confirmCancel = async () => {
    if (!bookingId) return;
    await handleCancelBooking(bookingId, 'Cancelled by operator', () => {
      setShowCancelModal(false);
      reload();
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
          {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.NOT_FOUND)}
        </Text>
      </SafeAreaView>
    );
  }

  const showCancel = eligibility?.canCancel === true;
  const rental = booking.transportType === 'CAR_RENTAL';
  const vehicle = booking.items?.find((item) => item.transportVehicle)?.transportVehicle;
  const carName = vehicle?.name || booking.serviceClass || t(TRANSLATION_KEYS.TRANSPORT.FILTER_CAR);
  const days = hireDays(booking.departureDateTime, booking.arrivalDateTime);
  const statusKey = (booking.status || '').toUpperCase();
  const statusOk = statusKey === 'CONFIRMED' || statusKey === 'COMPLETED';
  const statusPending = statusKey === 'PENDING';
  const statusBg = statusOk
    ? (isDark ? 'rgba(34,197,94,0.18)' : 'rgba(22,163,74,0.12)')
    : statusPending
      ? (isDark ? 'rgba(245,158,11,0.18)' : 'rgba(217,119,6,0.12)')
      : (isDark ? 'rgba(156,163,175,0.18)' : 'rgba(107,114,128,0.12)');
  const statusFg = statusOk
    ? (isDark ? '#4ADE80' : '#15803D')
    : statusPending
      ? (isDark ? '#FBBF24' : '#B45309')
      : (isDark ? '#D1D5DB' : '#4B5563');

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-5 pt-3" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => goBack(router)} style={{ padding: 6, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={22} color={primary} />
          </Pressable>
          <Text className="text-xl font-bold text-text dark:text-text-dark">
            {rental ? t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.RENTALS) : t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.PASSENGERS)}
          </Text>
        </View>

        <View className="p-4 mb-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
          <View className="flex-row items-start">
            {rental && vehicle?.imageUrl ? (
              <Image source={{ uri: vehicle.imageUrl }} style={{ width: 64, height: 64, borderRadius: 16, marginRight: 12 }} resizeMode="cover" />
            ) : (
            <View className="items-center justify-center w-12 h-12 mr-3 rounded-2xl bg-primary/10">
              <Ionicons name={rental ? 'car-sport' : 'bus'} size={22} color={primary} />
            </View>
            )}
            <View className="flex-1">
              <Text className="text-lg font-bold text-text dark:text-text-dark" numberOfLines={2}>
                {rental ? carName : `${booking.departureLocation} → ${booking.arrivalLocation}`}
              </Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                {rental
                  ? [vehicle?.licensePlate, booking.serviceClass].filter(Boolean).join(' · ')
                  : booking.confirmationCode}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between mt-4">
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: statusBg }}>
              <Text className="text-xs font-semibold" style={{ color: statusFg }}>
                {operatorStatusLabel(booking.status, t)}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-text dark:text-text-dark">
              ৳{Number(booking.totalPrice).toLocaleString()}
            </Text>
          </View>
          <Text className="mt-1 text-xs text-right text-muted dark:text-muted-dark">
            {operatorStatusLabel(booking.paymentStatus, t)}
            {rental ? ` · ${t(TRANSLATION_KEYS.TRANSPORT.RENTAL_DAYS, { count: days })}` : ''}
          </Text>
        </View>

        {rental ? (
          <Section title={t(TRANSLATION_KEYS.TRANSPORT.RENTAL)}>
            <View className="flex-row">
              <View className="flex-1 pr-3">
                <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_LABEL)}</Text>
                <Text className="mt-1 text-sm font-semibold text-text dark:text-text-dark">{formatWhen(booking.departureDateTime)}</Text>
              </View>
              <View className="flex-1 pl-3">
                <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT.RENTAL_RETURN_LABEL)}</Text>
                <Text className="mt-1 text-sm font-semibold text-text dark:text-text-dark">{formatWhen(booking.arrivalDateTime)}</Text>
              </View>
            </View>
            <Text className="mt-3 text-sm text-text dark:text-text-dark">{booking.departureLocation}</Text>
            <Text className="mt-2 text-xs text-muted dark:text-muted-dark">{booking.confirmationCode}</Text>
          </Section>
        ) : (
          <Section title={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.ROUTE)}>
            <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DEPARTURE)}</Text>
            <Text className="mt-1 text-sm font-semibold text-text dark:text-text-dark">
              {booking.departureLocation} · {formatWhen(booking.departureDateTime)}
            </Text>
            <Text className="mt-3 text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT_BOOKING.ARRIVAL)}</Text>
            <Text className="mt-1 text-sm font-semibold text-text dark:text-text-dark">
              {booking.arrivalLocation} · {formatWhen(booking.arrivalDateTime)}
            </Text>
            {booking.boardingStop?.name ? (
              <Text className="mt-3 text-sm text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.BOARDING)}: {booking.boardingStop.name}
              </Text>
            ) : null}
            {booking.droppingStop?.name ? (
              <Text className="mt-1 text-sm text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DROPPING)}: {booking.droppingStop.name}
              </Text>
            ) : null}
          </Section>
        )}

        <Section title={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.TRAVELER)}>
          <Text className="text-base font-semibold text-text dark:text-text-dark">
            {travelerName(booking) || t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.TRAVELER)}
          </Text>
          {booking.contactPhone || booking.user?.phoneNumber ? (
            <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
              {booking.contactPhone || booking.user?.phoneNumber}
            </Text>
          ) : null}
          {booking.contactEmail || booking.user?.email ? (
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {booking.contactEmail || booking.user?.email}
            </Text>
          ) : null}
        </Section>

        {!rental && (booking.items || []).length > 0 ? (
          <Section title={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PASSENGERS)}>
            {(booking.items || []).map((item) => (
              <Text key={item.id} className="mb-2 text-sm text-text dark:text-text-dark">
                {[
                  item.passengerName ||
                    [item.passengerFirstName, item.passengerLastName].filter(Boolean).join(' '),
                  item.assignedSeatLabel || item.transportSeat?.seatLabel,
                  item.passengerGender ? operatorStatusLabel(item.passengerGender, t) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ))}
          </Section>
        ) : null}

        {showCancel ? (
          <Pressable
            onPress={() => setShowCancelModal(true)}
            disabled={cancelSubmitting}
            className="items-center py-4 mt-2 rounded-2xl"
            style={{ backgroundColor: `${errorColor}22`, borderColor: errorColor, borderWidth: 1 }}
          >
            <Text style={{ color: errorColor, fontWeight: '600' }}>
              {getCancelActionLabel(eligibility)}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal visible={showCancelModal} transparent animationType="fade">
        <View className="justify-end flex-1 bg-black/50">
          <View className="p-6 rounded-t-2xl bg-surface dark:bg-surface-dark">
            {eligibility ? (
              <CancellationEligibilityPreview
                eligibility={eligibility}
                t={t}
                surfaceColor={surfaceColor}
                borderColor={borderColor}
                textColor={textColor}
                mutedColor={mutedColor}
                primaryColor={primary}
                plain
              />
            ) : null}
            <Pressable
              onPress={confirmCancel}
              disabled={cancelSubmitting}
              className="items-center py-3 mt-4 rounded-xl bg-error dark:bg-error-dark"
            >
              <Text className="font-semibold text-white">
                {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.CANCEL)}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowCancelModal(false)} className="items-center py-3 mt-2">
              <Text className="text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.CLOSE)}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
