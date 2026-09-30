import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../hooks/useTheme';
import { useTransportBookingLogic } from '../../../../hooks/useTransportBookingLogic';
import theme from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { CancellationEligibility } from '../../../../types/cancellation';
import { TransportBooking } from '../../../../types/transports';
import { CancellationEligibilityPreview } from '../../../../components/booking/CancellationEligibilityPreview';
import { PaymentStatusBadge } from '../../../../components/ui/PaymentStatusBadge';
import { getCancelActionLabel, shouldFetchCancellationEligibility } from '../../../../utilities/bookingCancelHelpers';

function formatWhen(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function TransportBookingDetailPage() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { fetchBookingDetail, loadEligibility, handleCancelBooking, cancelSubmitting } =
    useTransportBookingLogic();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<TransportBooking | null>(null);
  const [eligibility, setEligibility] = useState<CancellationEligibility | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;

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

  const pay = () => {
    if (!booking) return;
    router.push({
      pathname: '/(tabs)/explore/transport-payment',
      params: { bookingId: booking.id },
    });
  };

  const confirmCancel = async () => {
    if (!bookingId) return;
    await handleCancelBooking(bookingId, undefined, () => {
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

  const showCancel = shouldFetchCancellationEligibility(booking.status);
  const unpaid = booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/(tabs)/dashboard/transport-bookings');
        }} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="text-xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DETAILS)}
        </Text>
      </View>
      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 140 }}>
        <Text className="text-lg font-bold text-text dark:text-text-dark">
          {booking.transport?.name || booking.transportType}
        </Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{booking.confirmationCode}</Text>
        <View className="mt-3">
          <PaymentStatusBadge status={booking.paymentStatus} />
        </View>
        <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.ROUTE)}
        </Text>
        <Text className="text-text dark:text-text-dark">
          {booking.departureLocation} → {booking.arrivalLocation}
        </Text>
        <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DEPARTURE)}
        </Text>
        <Text className="text-text dark:text-text-dark">{formatWhen(booking.departureDateTime)}</Text>
        <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.ARRIVAL)}
        </Text>
        <Text className="text-text dark:text-text-dark">{formatWhen(booking.arrivalDateTime)}</Text>
        {booking.seatNumber ? (
          <>
            <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.SEATS)}
            </Text>
            <Text className="text-text dark:text-text-dark">{booking.seatNumber}</Text>
          </>
        ) : null}
        {booking.boardingStop?.name ? (
          <>
            <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.BOARDING)}
            </Text>
            <Text className="text-text dark:text-text-dark">{booking.boardingStop.name}</Text>
          </>
        ) : null}
        {booking.droppingStop?.name ? (
          <>
            <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DROPPING)}
            </Text>
            <Text className="text-text dark:text-text-dark">{booking.droppingStop.name}</Text>
          </>
        ) : null}
        {booking.contactPhone || booking.contactEmail ? (
          <>
            <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.CONTACT)}
            </Text>
            {booking.contactPhone ? (
              <Text className="text-text dark:text-text-dark">{booking.contactPhone}</Text>
            ) : null}
            {booking.contactEmail ? (
              <Text className="text-text dark:text-text-dark">{booking.contactEmail}</Text>
            ) : null}
          </>
        ) : null}
        {booking.items && booking.items.length > 0 ? (
          <>
            <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PASSENGERS)}
            </Text>
            {booking.items.map((item) => (
              <Text key={item.id} className="text-text dark:text-text-dark">
                {item.passengerName || item.assignedSeatLabel}
                {item.passengerGender ? ` · ${item.passengerGender}` : ''}
              </Text>
            ))}
          </>
        ) : null}
        {booking.linkedLegBookingId ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/dashboard/transport-bookings/[bookingId]',
                params: { bookingId: booking.linkedLegBookingId as string },
              })
            }
            className="mt-4"
          >
            <Text style={{ color: primary }}>{t(TRANSLATION_KEYS.TRANSPORT_BOOKING.OPEN_LINKED_LEG)}</Text>
          </Pressable>
        ) : null}
        <Text className="mt-3 text-lg font-bold text-text dark:text-text-dark">৳{booking.totalPrice}</Text>
        {showCancel && eligibility ? (
          <View className="mt-6">
            <CancellationEligibilityPreview
              eligibility={eligibility}
              t={t}
              surfaceColor={isDark ? '#1a1a1a' : '#f5f5f5'}
              borderColor={borderColor}
              textColor={textColor}
              mutedColor={mutedColor}
              primaryColor={primary}
            />
          </View>
        ) : null}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background dark:bg-background-dark">
        {unpaid ? (
          <Pressable onPress={pay} className="items-center py-4 mb-2 rounded-xl" style={{ backgroundColor: primary }}>
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PAY)}</Text>
          </Pressable>
        ) : null}
        {showCancel ? (
          <Pressable
            onPress={() => {
              if (!eligibility?.canCancel) {
                Alert.alert(
                  t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANNOT_CANCEL),
                  eligibility?.reason || t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANNOT_CANCEL_DESC)
                );
                return;
              }
              setShowCancelModal(true);
            }}
            className="items-center py-4 rounded-xl"
            style={{ backgroundColor: errorColor }}
          >
            <Text className="font-semibold text-white">
              {eligibility ? getCancelActionLabel(eligibility) : t(TRANSLATION_KEYS.BOOKING.CANCEL)}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
        <View className="justify-end flex-1 bg-black/50">
          <View className="p-6 rounded-t-3xl" style={{ backgroundColor: surfaceColor }}>
            <Text className="mb-4 text-2xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.BOOKING.CANCEL)}
            </Text>
            {eligibility ? (
              <CancellationEligibilityPreview
                eligibility={eligibility}
                t={t}
                surfaceColor={isDark ? '#1a1a1a' : '#f5f5f5'}
                borderColor={borderColor}
                textColor={textColor}
                mutedColor={mutedColor}
                primaryColor={primary}
              />
            ) : null}
            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={() => setShowCancelModal(false)}
                className="items-center justify-center flex-1 py-3 rounded-lg"
                style={{ backgroundColor: isDark ? '#333' : '#e0e0e0' }}
              >
                <Text className="font-semibold" style={{ color: textColor }}>
                  {t(TRANSLATION_KEYS.COMMON.CANCEL)}
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmCancel}
                disabled={cancelSubmitting}
                className="items-center justify-center flex-1 py-3 rounded-lg"
                style={{ backgroundColor: errorColor }}
              >
                {cancelSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.COMMON.CONFIRM)}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
