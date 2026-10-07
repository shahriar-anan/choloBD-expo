import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
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
import { profilePhotoUri } from '../../../../utilities/profileImage';
import { DetailCard, DetailRow } from '../../../../components/booking/DetailBlocks';
import { BookingQrSheet } from '../../../../components/booking/BookingQrSheet';

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
  const [qrOpen, setQrOpen] = useState(false);

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
  const cover = profilePhotoUri(booking.transport?.images?.[0]?.url);
  const leave = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/dashboard/transport-bookings');
  };
  const vehicle = booking.items?.find((item) => item.transportVehicle)?.transportVehicle;
  const rental = booking.transportType === 'CAR_RENTAL';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={{ height: 180, backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
          {cover ? (
            <Image source={{ uri: cover }} style={{ width: '100%', height: 180 }} resizeMode="cover" accessibilityRole="image" />
          ) : (
            <View className="items-center justify-center flex-1">
              <Ionicons name="ticket-outline" size={40} color={mutedColor} />
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
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {booking.transport?.name || booking.transportType}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {rental
              ? [booking.departureLocation, vehicle?.name || booking.serviceClass].filter(Boolean).join(' · ')
              : `${booking.departureLocation} → ${booking.arrivalLocation}`}
          </Text>
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-1 pr-3">
              <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.BOOKING.CONFIRMATION_CODE)}</Text>
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
            <PaymentStatusBadge status={booking.paymentStatus} />
          </View>
        </View>

        <DetailCard title={t(rental ? TRANSLATION_KEYS.TRANSPORT.RENTAL : TRANSLATION_KEYS.TRANSPORT_BOOKING.ROUTE)}>
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.TYPE)} value={rental ? t(TRANSLATION_KEYS.TRANSPORT.FILTER_CAR) : t(TRANSLATION_KEYS.TRANSPORT.BUS)} />
          {rental ? (
            <>
              <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_LABEL)} value={`${booking.departureLocation} · ${formatWhen(booking.departureDateTime)}`} />
              <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT.RENTAL_RETURN_LABEL)} value={formatWhen(booking.arrivalDateTime)} />
              <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.VEHICLE)} value={[vehicle?.name, vehicle?.licensePlate, booking.serviceClass].filter(Boolean).join(' · ')} />
            </>
          ) : (
            <>
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DEPARTURE)} value={`${booking.departureLocation} · ${formatWhen(booking.departureDateTime)}`} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.ARRIVAL)} value={`${booking.arrivalLocation} · ${formatWhen(booking.arrivalDateTime)}`} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.BOARDING)} value={booking.boardingStop?.name} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DROPPING)} value={booking.droppingStop?.name} />
            </>
          )}
        </DetailCard>

        {rental ? null : (
        <DetailCard title={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PASSENGERS)}>
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PASSENGER_COUNT)} value={booking.passengerCount} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.SEATS)} value={booking.seatNumber} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.CLASS)} value={booking.serviceClass} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.VEHICLE)} value={[vehicle?.name, vehicle?.licensePlate].filter(Boolean).join(' · ')} />
          {booking.items?.map((item) => (
            <Text key={item.id} className="py-1 text-sm text-text dark:text-text-dark">
              {[item.passengerName || [item.passengerFirstName, item.passengerLastName].filter(Boolean).join(' '), item.assignedSeatLabel || item.transportSeat?.seatLabel, item.serviceClassLabel || item.transportClass?.name, item.passengerGender].filter(Boolean).join(' · ')}
            </Text>
          ))}
        </DetailCard>
        )}

        <DetailCard title={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.OPERATOR)}>
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.OPERATOR)} value={booking.transport?.name} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.CONTACT)} value={[booking.contactPhone, booking.contactEmail].filter(Boolean).join(' · ')} />
          <DetailRow label={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PHONE)} value={booking.transport?.phoneNumber} />
          <DetailRow label={t(TRANSLATION_KEYS.BOOKING.EMAIL)} value={booking.transport?.contactEmail} />
        </DetailCard>

        <DetailCard>
          <DetailRow label={t(TRANSLATION_KEYS.BOOKING.TOTAL_PRICE)} value={`৳${booking.totalPrice}`} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PAYMENT)} value={booking.paymentMethod || booking.paymentStatus} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.BOOKED_ON)} value={formatWhen(booking.bookedAt)} />
          <DetailRow label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.REQUESTS)} value={booking.specialRequests} />
          {booking.cancellationReason ? (
            <DetailRow label={t(TRANSLATION_KEYS.BOOKING.CANCEL)} value={booking.cancellationReason} />
          ) : null}
          {booking.linkedLegBookingId ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/bookings/ticket/[bookingId]',
                  params: { bookingId: booking.linkedLegBookingId as string },
                })
              }
              className="py-2"
            >
              <Text style={{ color: primary }}>{t(TRANSLATION_KEYS.TRANSPORT_BOOKING.OPEN_LINKED_LEG)}</Text>
            </Pressable>
          ) : null}
        </DetailCard>

        {showCancel && eligibility ? (
          <View className="mx-3 mt-3">
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
      <BookingQrSheet visible={qrOpen} mode="unsupported" onClose={() => setQrOpen(false)} />
    </SafeAreaView>
  );
}
