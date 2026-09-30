import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../hooks/useTheme';
import { useTransportBookingLogic } from '../../../hooks/useTransportBookingLogic';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { RootState } from '../../../store/store';
import { useTransportBusCheckout } from '../../../context/TransportBusCheckoutContext';
import { BusSeatPassenger, TransportPassengerGender, TransportSeat } from '../../../types/transports';
import {
  formatHoldCountdown,
  holdSecondsRemaining,
  sumSelectedSeatPrices,
} from '../../../utilities/transportFormat';
import { CreateTransportBookingResult } from '../../../services/api/transportBookings';

interface PassengerFormRow {
  seatId: string;
  seatLabel: string;
  firstName: string;
  lastName: string;
  gender: TransportPassengerGender;
}

function buildPassengerRows(seats: TransportSeat[]): PassengerFormRow[] {
  return seats.map((seat) => ({
    seatId: seat.id,
    seatLabel: seat.seatLabel,
    firstName: '',
    lastName: '',
    gender: 'MALE',
  }));
}

function earliestHoldExpiry(outboundAt: string, returnAt?: string | null): string {
  if (!returnAt) return outboundAt;
  return new Date(outboundAt) < new Date(returnAt) ? outboundAt : returnAt;
}

function firstUnpaidBooking(result: CreateTransportBookingResult) {
  if (result.kind === 'single') return result.booking;
  return result.result.bookings.find((row) => row.paymentStatus === 'UNPAID') ?? result.result.bookings[0];
}

export default function TransportPassengersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const auth = useSelector((s: RootState) => s.auth);
  const { createBooking, submitting } = useTransportBookingLogic();
  const { outbound, returnLeg, boardingStopId, droppingStopId } = useTransportBusCheckout();
  const isFocused = useIsFocused();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const fieldBg = isDark ? theme.colors['background-dark'] : theme.colors['surface-2'];
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;

  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState(auth.user?.email ?? '');
  const [outboundRows, setOutboundRows] = useState<PassengerFormRow[]>([]);
  const [returnRows, setReturnRows] = useState<PassengerFormRow[]>([]);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!isFocused) return;
    if (!outbound) {
      if (!leavingRef.current) {
        router.replace('/(tabs)/explore/transport-search');
      }
      return;
    }
    setOutboundRows(buildPassengerRows(outbound.seats));
    if (returnLeg) {
      setReturnRows(buildPassengerRows(returnLeg.seats));
    }
  }, [outbound, returnLeg, router, isFocused]);

  const holdExpiresAt = useMemo(
    () => (outbound ? earliestHoldExpiry(outbound.holdExpiresAt, returnLeg?.holdExpiresAt) : null),
    [outbound, returnLeg]
  );

  useEffect(() => {
    if (!holdExpiresAt) return;
    const tick = () => {
      const remaining = holdSecondsRemaining(holdExpiresAt);
      setHoldSeconds(remaining);
      if (remaining <= 0) {
        if (leavingRef.current || !isFocused) return;
        Alert.alert(
          t(TRANSLATION_KEYS.TRANSPORT.HOLD_EXPIRED_TITLE),
          t(TRANSLATION_KEYS.TRANSPORT.HOLD_EXPIRED_BODY),
          [{
            text: t(TRANSLATION_KEYS.COMMON.CONFIRM),
            onPress: () => router.replace('/(tabs)/explore/transport-search'),
          }]
        );
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [holdExpiresAt, router, t, isFocused]);

  const totalFare = useMemo(() => {
    const outboundFare = outbound ? sumSelectedSeatPrices(outbound.seats) : 0;
    const returnFare = returnLeg ? sumSelectedSeatPrices(returnLeg.seats) : 0;
    return outboundFare + returnFare;
  }, [outbound, returnLeg]);

  const toPassengers = (rows: PassengerFormRow[]): BusSeatPassenger[] =>
    rows.map((row) => ({
      seatId: row.seatId,
      passengerFirstName: row.firstName.trim(),
      passengerLastName: row.lastName.trim(),
      passengerGender: row.gender,
    }));

  const validate = (): boolean => {
    if (!contactPhone.trim() || contactPhone.trim().length > 20) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.CONTACT_PHONE), t(TRANSLATION_KEYS.TRANSPORT.CONTACT_PHONE_HINT));
      return false;
    }
    if (!contactEmail.trim()) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.CONTACT_EMAIL), t(TRANSLATION_KEYS.TRANSPORT.CONTACT_EMAIL_HINT));
      return false;
    }
    const allRows = [...outboundRows, ...returnRows];
    for (const row of allRows) {
      if (!row.firstName.trim() || !row.lastName.trim()) {
        Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.PASSENGER_DETAILS), t(TRANSLATION_KEYS.TRANSPORT.PASSENGER_NAME_REQUIRED));
        return false;
      }
    }
    if (holdSeconds <= 0) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.HOLD_EXPIRED_TITLE), t(TRANSLATION_KEYS.TRANSPORT.HOLD_EXPIRED_BODY));
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!outbound || !validate()) return;
    const payload = {
      transportId: outbound.transportId,
      transportTripId: outbound.tripId,
      seatIds: outbound.seatIds,
      passengers: toPassengers(outboundRows),
      boardingStopId: boardingStopId ?? undefined,
      droppingStopId: droppingStopId ?? undefined,
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim(),
      returnLeg: returnLeg
        ? {
            transportTripId: returnLeg.tripId,
            seatIds: returnLeg.seatIds,
            passengers: toPassengers(returnRows),
          }
        : undefined,
    };
    const result = await createBooking(payload);
    if (!result) return;

    const booking = firstUnpaidBooking(result);
    if (!booking?.id) return;
    leavingRef.current = true;
    router.replace({
      pathname: '/(tabs)/explore/transport-payment',
      params: { bookingId: booking.id },
    });
  };

  const fieldStyle = {
    backgroundColor: fieldBg,
    borderColor,
    color: textColor,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  };

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      keyboardType?: 'default' | 'phone-pad' | 'email-address';
      autoCapitalize?: 'none' | 'words';
      icon?: keyof typeof Ionicons.glyphMap;
    }
  ) => (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-semibold text-muted dark:text-muted-dark">{label}</Text>
      <View className="flex-row items-center">
        {options?.icon ? (
          <View
            className="absolute z-10 items-center justify-center"
            style={{ left: 12, width: 20 }}
            pointerEvents="none"
          >
            <Ionicons name={options.icon} size={16} color={muted} />
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={options?.keyboardType ?? 'default'}
          autoCapitalize={options?.autoCapitalize ?? 'words'}
          placeholder={label}
          placeholderTextColor={muted}
          style={[fieldStyle, options?.icon ? { paddingLeft: 36, flex: 1 } : { flex: 1 }]}
        />
      </View>
    </View>
  );

  const renderGender = (
    row: PassengerFormRow,
    onChange: (gender: TransportPassengerGender) => void
  ) => (
    <View>
      <Text className="mb-1.5 text-xs font-semibold text-muted dark:text-muted-dark">
        {t(TRANSLATION_KEYS.TRANSPORT.GENDER)}
      </Text>
      <View className="flex-row overflow-hidden" style={{ borderRadius: 12, borderWidth: 1, borderColor }}>
        {(['MALE', 'FEMALE'] as TransportPassengerGender[]).map((gender) => {
          const selected = row.gender === gender;
          return (
            <Pressable
              key={gender}
              onPress={() => onChange(gender)}
              className="flex-row items-center justify-center flex-1 py-3"
              style={{ backgroundColor: selected ? primary : fieldBg }}
            >
              <Ionicons
                name={gender === 'MALE' ? 'man-outline' : 'woman-outline'}
                size={16}
                color={selected ? '#fff' : muted}
              />
              <Text
                className="ml-1.5 text-sm font-semibold"
                style={{ color: selected ? '#fff' : textColor }}
              >
                {gender === 'MALE'
                  ? t(TRANSLATION_KEYS.TRANSPORT.GENDER_MALE)
                  : t(TRANSLATION_KEYS.TRANSPORT.GENDER_FEMALE)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderPassengerBlock = (
    title: string,
    rows: PassengerFormRow[],
    onUpdate: (next: PassengerFormRow[]) => void
  ) => (
    <View className="mb-2">
      <Text className="mb-3 text-base font-bold text-text dark:text-text-dark">{title}</Text>
      {rows.map((row, index) => (
        <View
          key={row.seatId}
          className="p-4 mb-3"
          style={{
            backgroundColor: surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor,
            ...theme.elevation.sm,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.PASSENGER_NUMBER, { index: index + 1 })}
            </Text>
            <View className="px-3 py-1" style={{ backgroundColor: isDark ? '#1E3A5F' : '#E8F1FF', borderRadius: 999 }}>
              <Text className="text-xs font-bold" style={{ color: primary }}>
                {t(TRANSLATION_KEYS.TRANSPORT.SEAT_LABEL, { label: row.seatLabel })}
              </Text>
            </View>
          </View>
          {renderField(t(TRANSLATION_KEYS.TRANSPORT.FIRST_NAME), row.firstName, (text) => {
            const next = [...rows];
            next[index] = { ...row, firstName: text };
            onUpdate(next);
          })}
          {renderField(t(TRANSLATION_KEYS.TRANSPORT.LAST_NAME), row.lastName, (text) => {
            const next = [...rows];
            next[index] = { ...row, lastName: text };
            onUpdate(next);
          })}
          {renderGender(row, (gender) => {
            const next = [...rows];
            next[index] = { ...row, gender };
            onUpdate(next);
          })}
        </View>
      ))}
    </View>
  );

  const holdUrgent = holdSeconds > 0 && holdSeconds < 120;
  const holdColor = holdUrgent ? warning : primary;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="text-xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRANSPORT.PASSENGER_DETAILS)}
        </Text>
      </View>
      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
        {holdExpiresAt ? (
          <View
            className="flex-row items-center px-4 py-3 mb-4"
            style={{
              backgroundColor: isDark ? '#2A2110' : '#FFF7ED',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: holdUrgent ? warning : borderColor,
            }}
          >
            <Ionicons name="time-outline" size={18} color={holdColor} />
            <Text className="flex-1 ml-2 text-sm font-semibold" style={{ color: holdColor }}>
              {t(TRANSLATION_KEYS.TRANSPORT.HOLD_TIMER, { time: formatHoldCountdown(holdSeconds) })}
            </Text>
          </View>
        ) : null}

        <View
          className="p-4 mb-5"
          style={{
            backgroundColor: surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor,
            ...theme.elevation.sm,
          }}
        >
          <Text className="text-base font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT.CONTACT_SECTION)}
          </Text>
          <Text className="mt-1 mb-4 text-xs text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT.CONTACT_SECTION_HINT)}
          </Text>
          {renderField(t(TRANSLATION_KEYS.TRANSPORT.CONTACT_PHONE), contactPhone, setContactPhone, {
            keyboardType: 'phone-pad',
            autoCapitalize: 'none',
            icon: 'call-outline',
          })}
          {renderField(t(TRANSLATION_KEYS.TRANSPORT.CONTACT_EMAIL), contactEmail, setContactEmail, {
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            icon: 'mail-outline',
          })}
        </View>

        {renderPassengerBlock(t(TRANSLATION_KEYS.TRANSPORT.OUTBOUND_PASSENGERS), outboundRows, setOutboundRows)}
        {returnLeg
          ? renderPassengerBlock(t(TRANSLATION_KEYS.TRANSPORT.RETURN_PASSENGERS), returnRows, setReturnRows)
          : null}
      </ScrollView>
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-4 bg-background dark:bg-background-dark"
        style={{ borderTopWidth: 1, borderTopColor: borderColor }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT.FARE)}</Text>
          <Text className="text-xl font-bold text-text dark:text-text-dark">৳{totalFare}</Text>
        </View>
        <Pressable
          onPress={submit}
          disabled={submitting}
          className="items-center py-4 rounded-xl"
          style={{ backgroundColor: submitting ? muted : primary }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRANSPORT.CONFIRM_BOOKING)}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
