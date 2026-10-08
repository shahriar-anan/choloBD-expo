import React, { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { differenceInCalendarDays, format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { CancellationEligibility } from '../../types/cancellation';
import { TransportBooking, TransportBookingItem, TransportRouteStop } from '../../types/transports';
import { CancellationEligibilityPreview } from '../booking/CancellationEligibilityPreview';
import { operatorStatusLabel, formatTripClock, formatTripDateTime } from '../../utilities/transportFormat';
import { profilePhotoUri } from '../../utilities/profileImage';

type TicketTab = 'ticket' | 'people' | 'fare';

interface TravelerTicketViewProps {
  booking: TransportBooking;
  eligibility: CancellationEligibility | null;
  onOpenLinked?: () => void;
}

function formatTaka(value: number): string {
  const rounded = Math.round(value);
  const grouped = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `৳${grouped}`;
}

function dayLabel(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return format(date, 'EEE, d MMM');
  } catch {
    return '—';
  }
}

function clockAt(base: string, offsetMinutes?: number | null): string {
  const date = new Date(base);
  if (Number.isNaN(date.getTime())) return '—';
  if (offsetMinutes) {
    date.setMinutes(date.getMinutes() + offsetMinutes);
  }
  return formatTripClock(date.toISOString());
}

function durationLabel(
  start: string,
  end: string,
  t: (key: string, options?: Record<string, number>) => string
): string | null {
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  const total = Math.round((to - from) / 60000);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours > 0 && minutes > 0) {
    return t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DURATION_HM, { hours, minutes });
  }
  if (hours > 0) {
    return t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DURATION_H, { hours });
  }
  return t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DURATION_M, { minutes });
}

function rentalDayCount(start: string, end: string): number {
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 1;
  return Math.max(1, differenceInCalendarDays(to, from));
}

function seatLabels(booking: TransportBooking): string[] {
  const fromItems = (booking.items ?? [])
    .map((item) => item.assignedSeatLabel || item.transportSeat?.seatLabel || '')
    .map((label) => label.trim())
    .filter(Boolean);
  if (fromItems.length) return fromItems;
  if (!booking.seatNumber) return [];
  return booking.seatNumber.split(/[,|/]/).map((part) => part.trim()).filter(Boolean);
}

function passengerName(item: TransportBookingItem, fallback: string): string {
  const joined = [item.passengerFirstName, item.passengerLastName].filter(Boolean).join(' ').trim();
  return item.passengerName?.trim() || joined || fallback;
}

function coachLabel(booking: TransportBooking): string | null {
  return (
    booking.serviceClass
    || booking.items?.find((item) => item.serviceClassLabel)?.serviceClassLabel
    || booking.items?.find((item) => item.transportClass?.name)?.transportClass?.name
    || booking.items?.find((item) => item.transportTrip?.coachLabel)?.transportTrip?.coachLabel
    || null
  );
}

function statusColor(status: string | null | undefined, isDark: boolean): string {
  const success = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const error = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  switch (String(status || '').toUpperCase()) {
    case 'CONFIRMED':
    case 'PAID':
    case 'COMPLETED':
    case 'ACCEPTED':
      return success;
    case 'PENDING':
    case 'UNPAID':
      return warning;
    case 'CANCELLED':
    case 'REFUNDED':
    case 'FAILED':
    case 'NO_SHOW':
      return error;
    default:
      return muted;
  }
}

function openMaps(stop?: TransportRouteStop | null) {
  if (stop?.latitude == null || stop.longitude == null) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
  Linking.openURL(url).catch(() => undefined);
}

function openPhone(phone: string) {
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => undefined);
}

function openEmail(email: string) {
  Linking.openURL(`mailto:${email}`).catch(() => undefined);
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: `${color}22` }} className="px-2.5 py-1 mr-2 mb-1 rounded-md">
      <Text style={{ color }} className="text-xs font-bold" numberOfLines={1}>{label}</Text>
    </View>
  );
}

function Perforation({ borderColor }: { borderColor: string }) {
  return (
    <View className="flex-row items-center justify-between px-4 my-4">
      {Array.from({ length: 24 }).map((_, index) => (
        <View key={index} style={{ width: 7, height: 2, borderRadius: 1, backgroundColor: borderColor }} />
      ))}
    </View>
  );
}

function SeatChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: `${color}18` }} className="px-2.5 py-1 mr-2 mb-2 rounded-md">
      <Text style={{ color }} className="text-sm font-bold">{label}</Text>
    </View>
  );
}

export function TravelerTicketView({ booking, eligibility, onOpenLinked }: TravelerTicketViewProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [tab, setTab] = useState<TicketTab>('ticket');

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const rental = booking.transportType === 'CAR_RENTAL';
  const vehicle = booking.items?.find((item) => item.transportVehicle)?.transportVehicle;
  const vehicleImage = profilePhotoUri(vehicle?.imageUrl) || profilePhotoUri(booking.transport?.images?.[0]?.url);
  const coach = coachLabel(booking);
  const seats = seatLabels(booking);
  const journey = durationLabel(booking.departureDateTime, booking.arrivalDateTime, t);
  const days = rentalDayCount(booking.departureDateTime, booking.arrivalDateTime);
  const passengers = (booking.items ?? []).filter((item) =>
    item.passengerName || item.passengerFirstName || item.passengerLastName || item.assignedSeatLabel || item.transportSeat
  );
  const plate = vehicle?.licensePlate?.trim() || '';
  const operatorName = booking.transport?.name || (rental ? t(TRANSLATION_KEYS.TRANSPORT.RENTAL) : t(TRANSLATION_KEYS.TRANSPORT.BUS));
  const category = vehicle?.transportClass?.vehicleRentalCategory || vehicle?.transportClass?.name || coach;

  const tabs: { id: TicketTab; label: string }[] = [
    { id: 'ticket', label: t(TRANSLATION_KEYS.TRANSPORT_BOOKING.TAB_TICKET) },
    {
      id: 'people',
      label: t(rental ? TRANSLATION_KEYS.TRANSPORT_BOOKING.VEHICLE : TRANSLATION_KEYS.TRANSPORT_BOOKING.PASSENGERS),
    },
    { id: 'fare', label: t(TRANSLATION_KEYS.TRANSPORT_BOOKING.TAB_FARE) },
  ];

  const context = rental
    ? [vehicle?.name || category, dayLabel(booking.departureDateTime)].filter(Boolean).join(' · ')
    : `${booking.departureLocation} → ${booking.arrivalLocation}`;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      <View
        className="flex-row p-1 mx-4 mt-2 rounded-xl"
        style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}
      >
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className="items-center flex-1 py-2 rounded-lg"
              style={{ backgroundColor: selected ? (isDark ? theme.colors['surface-dark'] : theme.colors.surface) : 'transparent' }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: selected ? textColor : mutedColor }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab !== 'ticket' ? (
        <Text className="px-4 mt-3 text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
          {context}
          {booking.confirmationCode ? ` · ${booking.confirmationCode}` : ''}
        </Text>
      ) : null}

      {tab === 'ticket' ? (
        <View
          className="mx-4 mt-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
          style={theme.elevation.sm}
        >
          <View className="px-4 pt-4">
            <Text className="text-base font-bold text-text dark:text-text-dark" numberOfLines={1}>
              {operatorName}
            </Text>
            <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
              {rental
                ? t(TRANSLATION_KEYS.TRANSPORT.RENTAL)
                : [t(TRANSLATION_KEYS.TRANSPORT.BUS), coach].filter(Boolean).join(' · ')}
            </Text>
            <View className="flex-row flex-wrap mt-2">
              <StatusChip
                label={operatorStatusLabel(booking.status, t)}
                color={statusColor(booking.status, isDark)}
              />
              <StatusChip
                label={operatorStatusLabel(booking.paymentStatus, t)}
                color={statusColor(booking.paymentStatus, isDark)}
              />
            </View>

            {rental ? (
              <RentalTimeline
                booking={booking}
                vehicleName={vehicle?.name || category || t(TRANSLATION_KEYS.TRANSPORT_BOOKING.VEHICLE)}
                plate={plate}
                imageUrl={vehicleImage}
                daysLabel={t(TRANSLATION_KEYS.TRANSPORT.RENTAL_DAYS, { count: days })}
                primary={primary}
                mutedColor={mutedColor}
              />
            ) : (
              <BusRoute
                booking={booking}
                journey={journey}
                primary={primary}
              />
            )}
          </View>

          <Perforation borderColor={borderColor} />

          <View className="px-4 pb-4">
            {seats.length ? (
              <View className="flex-row flex-wrap">
                {seats.map((seat, index) => (
                  <SeatChip key={`${seat}-${index}`} label={seat} color={primary} />
                ))}
              </View>
            ) : null}
            <View className="flex-row items-end justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PNR)}
                </Text>
                <Text
                  className="mt-0.5 text-base font-bold text-text dark:text-text-dark"
                  style={{ letterSpacing: 0.5 }}
                  numberOfLines={1}
                >
                  {booking.confirmationCode}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT.FARE)}
                </Text>
                <Text className="text-xl font-bold text-text dark:text-text-dark">
                  {formatTaka(booking.totalPrice)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {tab === 'ticket' && onOpenLinked ? (
        <Pressable
          onPress={onOpenLinked}
          accessibilityRole="button"
          className="flex-row items-center justify-between px-4 py-3 mx-4 mt-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
        >
          <View className="flex-1 pr-3">
            <Text className="text-sm font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.LINKED_LEG)}
            </Text>
            <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.OPEN_LINKED_LEG)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={mutedColor} />
        </Pressable>
      ) : null}

      {tab === 'people' && !rental ? (
        <PassengerList
          booking={booking}
          passengers={passengers}
          seats={seats}
          primary={primary}
          fallback={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PASSENGER_FALLBACK)}
        />
      ) : null}

      {tab === 'people' && rental ? (
        <VehiclePanel
          name={vehicle?.name || t(TRANSLATION_KEYS.TRANSPORT_BOOKING.VEHICLE)}
          plate={plate}
          category={category}
          imageUrl={vehicleImage}
          operatorName={operatorName}
          primary={primary}
        />
      ) : null}

      {tab === 'fare' ? (
        <FarePanel
          booking={booking}
          eligibility={eligibility}
          primary={primary}
          textColor={textColor}
          mutedColor={mutedColor}
          borderColor={borderColor}
          isDark={isDark}
        />
      ) : null}
    </ScrollView>
  );
}

function paymentMethodLabel(value?: string | null): string {
  if (!value) return '';
  const known: Record<string, string> = {
    WALLET: 'Wallet',
    SSLCOMMERZ: 'SSLCommerz',
    CASH: 'Cash',
  };
  return known[value] || value.replace(/_/g, ' ');
}

function BusRoute({
  booking,
  journey,
  primary,
}: {
  booking: TransportBooking;
  journey: string | null;
  primary: string;
}) {
  const { t } = useTranslation();
  const boardTime = clockAt(booking.departureDateTime, booking.boardingStop?.arrivalOffsetMinutes);
  const dropClock = booking.droppingStop?.arrivalOffsetMinutes != null
    ? clockAt(booking.departureDateTime, booking.droppingStop.arrivalOffsetMinutes)
    : formatTripClock(booking.arrivalDateTime);
  const boardingName = booking.boardingStop?.name || booking.departureLocation;
  const droppingName = booking.droppingStop?.name || booking.arrivalLocation;

  return (
    <View className="mt-4">
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {formatTripClock(booking.departureDateTime)}
          </Text>
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{dayLabel(booking.departureDateTime)}</Text>
          <Text className="mt-2 text-sm font-semibold text-text dark:text-text-dark" numberOfLines={2}>
            {booking.departureLocation}
          </Text>
        </View>
        <View className="items-center px-1" style={{ width: 96, paddingTop: 6 }}>
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark" numberOfLines={1}>
            {journey || t(TRANSLATION_KEYS.TRANSPORT_BOOKING.JOURNEY_TIME)}
          </Text>
          <View className="flex-row items-center w-full my-1">
            <View className="flex-1 h-px bg-border dark:bg-border-dark" />
            <View
              className="items-center justify-center w-6 h-6 mx-1 rounded-full"
              style={{ backgroundColor: `${primary}18` }}
            >
              <Ionicons name="bus" size={13} color={primary} />
            </View>
            <View className="flex-1 h-px bg-border dark:bg-border-dark" />
          </View>
        </View>
        <View className="items-end flex-1">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {formatTripClock(booking.arrivalDateTime)}
          </Text>
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{dayLabel(booking.arrivalDateTime)}</Text>
          <Text className="mt-2 text-sm font-semibold text-right text-text dark:text-text-dark" numberOfLines={2}>
            {booking.arrivalLocation}
          </Text>
        </View>
      </View>

      <View className="flex-row mt-4">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center">
            <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.BOARDING)}
            </Text>
            {booking.boardingStop?.latitude != null ? (
              <Pressable
                onPress={() => openMaps(booking.boardingStop)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t(TRANSLATION_KEYS.TRANSPORT.OPEN_MAPS)}
                className="ml-2"
              >
                <Ionicons name="navigate-outline" size={14} color={primary} />
              </Pressable>
            ) : null}
          </View>
          <Text className="mt-1 text-sm font-semibold text-text dark:text-text-dark" numberOfLines={2}>
            {boardingName}
          </Text>
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{boardTime}</Text>
        </View>
        <View className="items-end flex-1 pl-3">
          <View className="flex-row items-center">
            {booking.droppingStop?.latitude != null ? (
              <Pressable
                onPress={() => openMaps(booking.droppingStop)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t(TRANSLATION_KEYS.TRANSPORT.OPEN_MAPS)}
                className="mr-2"
              >
                <Ionicons name="navigate-outline" size={14} color={primary} />
              </Pressable>
            ) : null}
            <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DROPPING)}
            </Text>
          </View>
          <Text className="mt-1 text-sm font-semibold text-right text-text dark:text-text-dark" numberOfLines={2}>
            {droppingName}
          </Text>
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{dropClock}</Text>
        </View>
      </View>
    </View>
  );
}

function RentalTimeline({
  booking,
  vehicleName,
  plate,
  imageUrl,
  daysLabel,
  primary,
  mutedColor,
}: {
  booking: TransportBooking;
  vehicleName: string;
  plate: string;
  imageUrl: string | null;
  daysLabel: string;
  primary: string;
  mutedColor: string;
}) {
  const { t } = useTranslation();
  return (
    <View className="mt-4">
      <View className="flex-row items-center">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: 72, height: 72, borderRadius: 12 }} />
        ) : (
          <View
            className="items-center justify-center rounded-xl bg-background dark:bg-background-dark"
            style={{ width: 72, height: 72 }}
          >
            <Ionicons name="car-outline" size={28} color={mutedColor} />
          </View>
        )}
        <View className="flex-1 ml-3">
          <Text className="text-base font-bold text-text dark:text-text-dark" numberOfLines={2}>
            {vehicleName}
          </Text>
          {plate ? (
            <View
              className="self-start px-2 py-1 mt-1 border rounded-md border-border dark:border-border-dark"
            >
              <Text className="text-xs font-bold text-text dark:text-text-dark" style={{ letterSpacing: 0.6 }}>
                {plate}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="mt-4">
        <View className="flex-row">
          <View className="items-center mr-3" style={{ width: 16 }}>
            <View className="w-3 h-3 mt-1 rounded-full" style={{ backgroundColor: primary }} />
            <View className="w-px flex-1 my-1 bg-border dark:bg-border-dark" />
          </View>
          <View className="flex-1 pb-4">
            <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_LABEL)}
            </Text>
            <Text className="mt-0.5 text-base font-bold text-text dark:text-text-dark">
              {dayLabel(booking.departureDateTime)} · {formatTripClock(booking.departureDateTime)}
            </Text>
            <Text className="mt-0.5 text-sm text-text dark:text-text-dark" numberOfLines={2}>
              {booking.departureLocation}
            </Text>
          </View>
        </View>
        <View className="flex-row">
          <View className="items-center mr-3" style={{ width: 16 }}>
            <View className="w-3 h-3 mt-1 border-2 rounded-full" style={{ borderColor: primary }} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_RETURN_LABEL)}
            </Text>
            <Text className="mt-0.5 text-base font-bold text-text dark:text-text-dark">
              {dayLabel(booking.arrivalDateTime)} · {formatTripClock(booking.arrivalDateTime)}
            </Text>
            <Text className="mt-0.5 text-sm text-muted dark:text-muted-dark">{daysLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function PassengerList({
  booking,
  passengers,
  seats,
  primary,
  fallback,
}: {
  booking: TransportBooking;
  passengers: TransportBookingItem[];
  seats: string[];
  primary: string;
  fallback: string;
}) {
  const { t } = useTranslation();
  if (!passengers.length) {
    return (
      <View className="p-4 mx-4 mt-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
        <Text className="text-sm text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PASSENGER_COUNT)}: {booking.passengerCount}
        </Text>
        {seats.length ? (
          <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.SEATS)}: {seats.join(', ')}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="mx-4 mt-3">
      {passengers.map((item, index) => {
        const seat = item.assignedSeatLabel || item.transportSeat?.seatLabel || seats[index] || String(index + 1);
        const meta = [
          item.passengerGender ? operatorStatusLabel(item.passengerGender, t) : '',
          item.serviceClassLabel || item.transportClass?.name || '',
        ].filter(Boolean).join(' · ');
        return (
          <View
            key={item.id}
            className="flex-row items-center p-3 mb-2 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
          >
            <View
              className="items-center justify-center rounded-lg"
              style={{ width: 48, height: 48, backgroundColor: `${primary}18` }}
            >
              <Text style={{ color: primary }} className="text-sm font-bold" numberOfLines={1}>
                {seat}
              </Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-text dark:text-text-dark" numberOfLines={1}>
                {passengerName(item, fallback)}
              </Text>
              {meta ? (
                <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                  {meta}
                </Text>
              ) : (
                <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT.SEAT_LABEL, { label: seat })}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function VehiclePanel({
  name,
  plate,
  category,
  imageUrl,
  operatorName,
  primary,
}: {
  name: string;
  plate: string;
  category?: string | null;
  imageUrl: string | null;
  operatorName: string;
  primary: string;
}) {
  const { t } = useTranslation();
  return (
    <View className="mx-4 mt-3 overflow-hidden bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
      ) : (
        <View className="items-center justify-center h-36 bg-background dark:bg-background-dark">
          <Ionicons name="car-outline" size={36} color={primary} />
        </View>
      )}
      <View className="p-4">
        <Text className="text-lg font-bold text-text dark:text-text-dark">{name}</Text>
        {category ? (
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{category}</Text>
        ) : null}
        {plate ? (
          <View className="mt-3">
            <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PLATE)}
            </Text>
            <Text className="mt-0.5 text-base font-bold text-text dark:text-text-dark" style={{ letterSpacing: 0.6 }}>
              {plate}
            </Text>
          </View>
        ) : null}
        <View className="mt-3">
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.OPERATOR)}
          </Text>
          <Text className="mt-0.5 text-sm font-semibold text-text dark:text-text-dark">{operatorName}</Text>
        </View>
      </View>
    </View>
  );
}

function FarePanel({
  booking,
  eligibility,
  primary,
  textColor,
  mutedColor,
  borderColor,
  isDark,
}: {
  booking: TransportBooking;
  eligibility: CancellationEligibility | null;
  primary: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const lines = (booking.items ?? []).filter((item) => typeof item.subtotal === 'number' && item.subtotal > 0);
  const operatorPhone = booking.transport?.phoneNumber?.trim() || '';
  const operatorEmail = booking.transport?.contactEmail?.trim() || '';
  const contactPhone = booking.contactPhone?.trim() || '';
  const contactEmail = booking.contactEmail?.trim() || '';

  return (
    <View className="mx-4 mt-3">
      <View className="p-4 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
        {lines.length > 1 ? lines.map((item) => {
          const label = [
            passengerName(item, t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PASSENGER_FALLBACK)),
            item.assignedSeatLabel || item.transportSeat?.seatLabel || item.transportVehicle?.name || '',
          ].filter(Boolean).join(' · ');
          return (
            <View key={item.id} className="flex-row items-center justify-between py-1.5">
              <Text className="flex-1 pr-3 text-sm text-muted dark:text-muted-dark" numberOfLines={1}>
                {label}
              </Text>
              <Text className="text-sm font-semibold text-text dark:text-text-dark">
                {formatTaka(item.subtotal)}
              </Text>
            </View>
          );
        }) : null}
        <View className="flex-row items-center justify-between pt-1">
          <Text className="text-base font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.BOOKING.TOTAL_PRICE)}
          </Text>
          <Text className="text-xl font-bold text-text dark:text-text-dark">
            {formatTaka(booking.totalPrice)}
          </Text>
        </View>
        <View className="h-px my-3 bg-border dark:bg-border-dark" />
        <InfoLine
          label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PAYMENT)}
          value={[
            operatorStatusLabel(booking.paymentStatus, t),
            paymentMethodLabel(booking.paymentMethod),
          ].filter(Boolean).join(' · ')}
        />
        <InfoLine
          label={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.BOOKED_ON)}
          value={formatTripDateTime(booking.bookedAt)}
        />
        {contactPhone ? (
          <InfoLine label={t(TRANSLATION_KEYS.TRANSPORT.CONTACT_PHONE)} value={contactPhone} />
        ) : null}
        {contactEmail ? (
          <InfoLine label={t(TRANSLATION_KEYS.TRANSPORT.CONTACT_EMAIL)} value={contactEmail} />
        ) : null}
      </View>

      {booking.specialRequests ? (
        <View className="p-4 mt-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.REQUESTS)}
          </Text>
          <Text className="mt-1 text-sm text-text dark:text-text-dark">{booking.specialRequests}</Text>
        </View>
      ) : null}

      {booking.cancellationReason ? (
        <View className="p-4 mt-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.BOOKING.CANCEL)}
          </Text>
          <Text className="mt-1 text-sm text-text dark:text-text-dark">{booking.cancellationReason}</Text>
        </View>
      ) : null}

      {operatorPhone || operatorEmail ? (
        <View className="px-4 mt-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
          <Text className="pt-3 text-xs font-semibold text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.OPERATOR)}
          </Text>
          <Text className="mt-1 text-sm font-semibold text-text dark:text-text-dark">
            {booking.transport?.name}
          </Text>
          {operatorPhone ? (
            <Pressable
              onPress={() => openPhone(operatorPhone)}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.TRANSPORT_BOOKING.CALL_OPERATOR)}
              className="flex-row items-center py-3"
            >
              <Ionicons name="call-outline" size={18} color={primary} />
              <Text className="ml-3 text-sm font-semibold" style={{ color: primary }}>{operatorPhone}</Text>
            </Pressable>
          ) : null}
          {operatorEmail ? (
            <Pressable
              onPress={() => openEmail(operatorEmail)}
              accessibilityRole="button"
              className="flex-row items-center py-3"
            >
              <Ionicons name="mail-outline" size={18} color={primary} />
              <Text className="flex-1 ml-3 text-sm font-semibold" style={{ color: primary }} numberOfLines={1}>
                {operatorEmail}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {eligibility ? (
        <View className="mt-3">
          <CancellationEligibilityPreview
            eligibility={eligibility}
            t={t}
            surfaceColor={isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2']}
            borderColor={borderColor}
            textColor={textColor}
            mutedColor={mutedColor}
            primaryColor={primary}
          />
        </View>
      ) : null}
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between py-1.5">
      <Text className="text-sm text-muted dark:text-muted-dark" style={{ width: 108 }}>{label}</Text>
      <Text className="flex-1 text-sm font-semibold text-right text-text dark:text-text-dark">{value}</Text>
    </View>
  );
}
