import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { roleBookings } from '../../../utilities/travelerShell';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { usePaymentLogic } from '../../../hooks/usePaymentLogic';
import { useTransportBookingLogic } from '../../../hooks/useTransportBookingLogic';
import { useTransportBusCheckout } from '../../../context/TransportBusCheckoutContext';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { chargeWalletCredits, getOwnWallet, pointsCostForTotal } from '../../../services/api/wallet';
import { PaymentStatusBadge } from '../../../components/ui/PaymentStatusBadge';
import { TransportBooking, TransportBookingItem, TransportPassengerGender } from '../../../types/transports';
import { formatTripDateTime } from '../../../utilities/transportFormat';

type PayMethod = 'card' | 'points';

function isUnpaid(booking: TransportBooking): boolean {
  return booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED';
}

function shownSeatLabel(item: TransportBookingItem, displaySeatById: Map<string, string>): string | null {
  const seatId = item.transportSeat?.id;
  if (seatId && displaySeatById.has(seatId)) {
    return displaySeatById.get(seatId) ?? null;
  }
  return item.assignedSeatLabel || item.transportSeat?.seatLabel || null;
}

function seatLabels(booking: TransportBooking, displaySeatById: Map<string, string>): string {
  const labels = (booking.items ?? [])
    .map((item) => shownSeatLabel(item, displaySeatById))
    .filter((label): label is string => Boolean(label));
  if (labels.length > 0) return labels.join(', ');
  return booking.seatNumber ?? '';
}

function coachLabel(booking: TransportBooking): string | null {
  const fromTrip = booking.items?.find((item) => item.transportTrip?.coachLabel)?.transportTrip?.coachLabel;
  return fromTrip || booking.serviceClass || booking.items?.[0]?.serviceClassLabel || null;
}

function vehicleLabel(booking: TransportBooking): string | null {
  const vehicle = booking.items?.find((item) => item.transportVehicle)?.transportVehicle;
  if (!vehicle) return null;
  return vehicle.name || vehicle.licensePlate || null;
}

function passengerName(item: TransportBookingItem): string {
  if (item.passengerName) return item.passengerName;
  const joined = [item.passengerFirstName, item.passengerLastName].filter(Boolean).join(' ').trim();
  return joined || '—';
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="mb-3">
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">
        {label}
      </Text>
      <Text className="mt-0.5 text-sm font-medium text-text dark:text-text-dark">{value}</Text>
    </View>
  );
}

export default function TransportPaymentPage() {
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { startPayment } = usePaymentLogic();
  const { fetchBookingDetail } = useTransportBookingLogic();
  const { resetCheckout, outbound, returnLeg } = useTransportBusCheckout();
  const displaySeatById = useMemo(() => {
    const labels = new Map<string, string>();
    for (const leg of [outbound, returnLeg]) {
      for (const seat of leg?.seats ?? []) {
        if (seat.id && seat.seatLabel) labels.set(seat.id, seat.seatLabel);
      }
    }
    return labels;
  }, [outbound, returnLeg]);

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyMethod, setBusyMethod] = useState<PayMethod>('card');
  const [payError, setPayError] = useState<string | null>(null);
  const [allPaid, setAllPaid] = useState(false);

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  const loadWallet = useCallback(async () => {
    try {
      const wallet = await getOwnWallet();
      setPointsBalance(Number(wallet.balance) || 0);
    } catch {
      setPointsBalance(null);
    }
  }, []);

  const loadBookings = useCallback(async (opts?: { silent?: boolean }) => {
    if (!bookingId) return;
    if (!opts?.silent) setLoading(true);
    try {
      const primaryBooking = await fetchBookingDetail(bookingId);
      if (!primaryBooking) {
        setBookings([]);
        return;
      }
      const rows: TransportBooking[] = [primaryBooking];
      if (primaryBooking.linkedLegBookingId) {
        const linked = await fetchBookingDetail(primaryBooking.linkedLegBookingId);
        if (linked) rows.push(linked);
      }
      rows.sort(
        (a, b) => new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime()
      );
      setBookings(rows);
      setAllPaid(rows.length > 0 && rows.every((row) => row.paymentStatus === 'PAID'));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [bookingId, fetchBookingDetail]);

  useEffect(() => {
    loadBookings();
    loadWallet();
  }, [loadBookings, loadWallet]);

  const unpaidBookings = useMemo(() => bookings.filter(isUnpaid), [bookings]);

  const genderLabel = (gender?: TransportPassengerGender | null): string => {
    if (gender === 'MALE') return t(TRANSLATION_KEYS.TRANSPORT.GENDER_MALE);
    if (gender === 'FEMALE') return t(TRANSLATION_KEYS.TRANSPORT.GENDER_FEMALE);
    return '';
  };

  const goToDashboard = () => {
    resetCheckout();
    router.replace(roleBookings(role));
  };

  const payWithSsl = async (booking: TransportBooking) => {
    setBusyId(booking.id);
    setBusyMethod('card');
    setPayError(null);
    const result = await startPayment({
      serviceType: 'TRANSPORT_SERVICE',
      serviceTypeId: booking.id,
      bookingId: booking.id,
    });
    setBusyId(null);
    if (result.success || result.error?.includes('already')) {
      await loadBookings({ silent: true });
      return;
    }
    setPayError(
      result.error ||
        t(result.status === 'PENDING' ? TRANSLATION_KEYS.PAYMENT.PENDING_DESC : TRANSLATION_KEYS.PAYMENT.FAILED_DESC)
    );
  };

  const payWithPoints = async (booking: TransportBooking) => {
    const pointsCost = pointsCostForTotal(Number(booking.totalPrice ?? 0));
    const canPay = pointsBalance !== null && pointsBalance >= pointsCost && pointsCost > 0;
    if (!canPay) return;
    setBusyId(booking.id);
    setBusyMethod('points');
    setPayError(null);
    try {
      await chargeWalletCredits({
        serviceType: 'TRANSPORT_SERVICE',
        serviceTypeId: booking.id,
        paymentAmount: pointsCost,
      });
      setPointsBalance((current) => (current === null ? current : current - pointsCost));
      await loadBookings({ silent: true });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setPayError(err?.response?.data?.message || err?.message || t(TRANSLATION_KEYS.PAYMENT.FAILED_DESC));
    } finally {
      setBusyId(null);
    }
  };

  const renderPayActions = (booking: TransportBooking) => {
    if (!isUnpaid(booking)) {
      return (
        <View className="flex-row items-center mt-2">
          <Ionicons name="checkmark-circle" size={16} color={successColor} />
          <Text className="ml-1 text-sm font-medium" style={{ color: successColor }}>
            {t(TRANSLATION_KEYS.TRANSPORT.THIS_TICKET_PAID)}
          </Text>
        </View>
      );
    }

    const pointsCost = pointsCostForTotal(Number(booking.totalPrice ?? 0));
    const canPayWithPoints = pointsBalance !== null && pointsBalance >= pointsCost && pointsCost > 0;
    const busy = busyId === booking.id;

    return (
      <View className="mt-2">
        {busy ? (
          <View
            style={{ backgroundColor: primary, borderRadius: 12 }}
            className="items-center py-4"
          >
            <ActivityIndicator color="#fff" />
            <Text className="mt-1 text-sm text-white">
              {t(busyMethod === 'points' ? TRANSLATION_KEYS.PAYMENT.POINTS_PROCESSING : TRANSLATION_KEYS.PAYMENT.INITIALIZING)}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => payWithSsl(booking)}
            disabled={Boolean(busyId)}
            style={{ backgroundColor: primary, borderRadius: 12, opacity: busyId ? 0.6 : 1 }}
            className="items-center py-4"
          >
            <Text className="text-base font-bold text-white">{t(TRANSLATION_KEYS.PAYMENT.PAY_NOW)}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => payWithPoints(booking)}
          disabled={!canPayWithPoints || Boolean(busyId)}
          style={{
            borderRadius: 12,
            marginTop: 12,
            borderWidth: 1,
            borderColor: primary,
            opacity: canPayWithPoints && !busyId ? 1 : 0.5,
          }}
          className="items-center py-4"
        >
          <Text style={{ color: primary }} className="text-base font-bold">
            {t(TRANSLATION_KEYS.PAYMENT.PAY_WITH_POINTS)}
          </Text>
          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.PAYMENT.POINTS_COST, { points: pointsCost.toLocaleString('en-US') })}
          </Text>
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
            {pointsBalance === null
              ? '—'
              : `${t(TRANSLATION_KEYS.PAYMENT.POINTS_BALANCE)}: ${pointsBalance.toLocaleString('en-US')}`}
          </Text>
          {!canPayWithPoints && pointsBalance !== null ? (
            <Text className="mt-1 text-xs" style={{ color: errorColor }}>
              {t(TRANSLATION_KEYS.PAYMENT.INSUFFICIENT_POINTS)}
            </Text>
          ) : null}
        </Pressable>
      </View>
    );
  };

  const renderTicket = (booking: TransportBooking, index: number) => {
    const title = bookings.length > 1
      ? (index === 0
        ? t(TRANSLATION_KEYS.TRANSPORT.OUTBOUND_TICKET)
        : t(TRANSLATION_KEYS.TRANSPORT.RETURN_TICKET))
      : (booking.transport?.name || booking.transportType);

    return (
      <View
        key={booking.id}
        className="mb-5 overflow-hidden bg-white border rounded-2xl border-border dark:border-border-dark dark:bg-surface-dark"
        style={theme.elevation.sm}
      >
        <View className="p-4 border-b border-border dark:border-border-dark">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 mr-3 text-base font-bold text-text dark:text-text-dark">
              {title}
            </Text>
            <PaymentStatusBadge status={booking.paymentStatus} />
          </View>
          {booking.transport?.name && bookings.length > 1 ? (
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{booking.transport.name}</Text>
          ) : null}
          <Text className="mt-1 font-mono text-sm text-text dark:text-text-dark">
            {booking.confirmationCode}
          </Text>
        </View>
        <View className="p-4">
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.ROUTE)}
            value={`${booking.departureLocation} → ${booking.arrivalLocation}`}
          />
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DEPARTURE)}
            value={formatTripDateTime(booking.departureDateTime)}
          />
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.ARRIVAL)}
            value={formatTripDateTime(booking.arrivalDateTime)}
          />
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT.COACH)}
            value={coachLabel(booking)}
          />
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.SEATS)}
            value={seatLabels(booking, displaySeatById)}
          />
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.VEHICLE)}
            value={vehicleLabel(booking)}
          />
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.BOARDING)}
            value={booking.boardingStop?.name}
          />
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DROPPING)}
            value={booking.droppingStop?.name}
          />
          <DetailRow
            label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.CONTACT)}
            value={[booking.contactPhone, booking.contactEmail].filter(Boolean).join(' · ') || null}
          />
          {booking.items && booking.items.length > 0 ? (
            <View className="mb-3">
              <Text className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PASSENGERS)}
              </Text>
              {booking.items.map((item) => {
                const gender = genderLabel(item.passengerGender);
                const seat = shownSeatLabel(item, displaySeatById);
                const parts = [
                  seat ? t(TRANSLATION_KEYS.TRANSPORT.SEAT_LABEL, { label: seat }) : null,
                  passengerName(item),
                  gender || null,
                ].filter(Boolean);
                return (
                  <Text key={item.id} className="mt-0.5 text-sm font-medium text-text dark:text-text-dark">
                    {parts.join(' · ')}
                  </Text>
                );
              })}
            </View>
          ) : null}
          <View className="flex-row items-center justify-between pt-3 border-t border-border dark:border-border-dark">
            <Text className="text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.FARE)}
            </Text>
            <Text className="text-xl font-bold text-text dark:text-text-dark">
              ৳{booking.totalPrice}
            </Text>
          </View>
          {renderPayActions(booking)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  if (bookings.length === 0) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 px-6 bg-background dark:bg-background-dark">
        <Text className="text-center text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.NOT_FOUND)}
        </Text>
        <Pressable onPress={goToDashboard} className="mt-4">
          <Text style={{ color: primary }}>{t(TRANSLATION_KEYS.PAYMENT.GO_TO_DASHBOARD)}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {allPaid ? (
          <View className="items-center pt-12">
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: successColor + '1F',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons name="checkmark-circle" size={44} color={successColor} />
            </View>
            <Text className="text-2xl font-bold text-center text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.PAYMENT.SUCCESS_TITLE)}
            </Text>
            <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.PAYMENT.SUCCESS_DESC)}
            </Text>
            <Pressable
              onPress={goToDashboard}
              style={{ backgroundColor: successColor, borderRadius: 12, marginTop: 32, width: '100%' }}
              className="items-center py-4"
            >
              <Text className="text-base font-semibold text-white">
                {t(TRANSLATION_KEYS.PAYMENT.GO_TO_DASHBOARD)}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="mb-6">
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: successColor + '1A',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  marginBottom: 12,
                }}
              >
                <Ionicons name="checkmark-circle" size={14} color={successColor} style={{ marginRight: 4 }} />
                <Text style={{ color: successColor, fontSize: 12, fontWeight: '700' }}>
                  {t(TRANSLATION_KEYS.PAYMENT.BOOKING_RESERVED)}
                </Text>
              </View>
              <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.TRANSPORT.CONFIRM_PAY_TITLE)}
              </Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.TRANSPORT.CONFIRM_PAY_SUBTITLE)}
              </Text>
              {bookings.length > 1 ? (
                <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT.PAY_EACH_TICKET)}
                </Text>
              ) : null}
            </View>

            {bookings.map((booking, index) => renderTicket(booking, index))}

            {payError ? (
              <Text className="mb-4 text-sm text-center" style={{ color: errorColor }}>
                {payError}
              </Text>
            ) : null}

            <View className="flex-row items-center justify-center mb-6">
              <Ionicons name="shield-checkmark" size={14} color={muted} style={{ marginRight: 5 }} />
              <Text className="text-xs text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.PAYMENT.SECURE_PAYMENT)} · {t(TRANSLATION_KEYS.PAYMENT.POWERED_BY_SSLCOMMERZ)}
              </Text>
            </View>

            {unpaidBookings.length > 0 ? (
              <Pressable onPress={goToDashboard} disabled={Boolean(busyId)} className="items-center py-3">
                <Text style={{ color: primary }} className="text-sm font-medium">
                  {t(TRANSLATION_KEYS.PAYMENT.PAY_LATER)}
                </Text>
                <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.PAYMENT.PAY_LATER_DESC)}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
