import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { TransportBooking } from '../../types/transports';
import { formatTripClock } from '../../utilities/transportFormat';

interface TransportBookingCardProps {
  booking: TransportBooking;
  onPress: () => void;
}

function titleCase(value?: string | null): string {
  if (!value) return '';
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function dayLabel(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return format(date, 'd MMM, yyyy');
  } catch {
    return '—';
  }
}

export function TransportBookingCard({ booking, onPress }: TransportBookingCardProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const success = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const error = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const imageUrl = booking.transport?.images?.[0]?.url;
  const isBus = booking.transportType === 'BUS';
  const coach =
    booking.serviceClass ||
    booking.items?.find((item) => item.transportTrip?.coachLabel)?.transportTrip?.coachLabel ||
    null;

  const statusColor = (status?: string | null) => {
    switch (String(status || '').toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return success;
      case 'pending':
      case 'unpaid':
        return warning;
      case 'cancelled':
      case 'failed':
        return error;
      default:
        return muted;
    }
  };

  const badge = (label: string, color: string) => (
    <View
      key={label}
      style={{ backgroundColor: `${color}20` }}
      className="px-3 py-1 mr-2 rounded-lg"
    >
      <Text style={{ color }} className="text-xs font-bold">{label}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      className="p-4 mb-3 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark"
    >
      <View className="flex-row items-start">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 96, height: 96, borderRadius: 12 }}
          />
        ) : (
          <View
            className="items-center justify-center bg-background dark:bg-background-dark"
            style={{ width: 96, height: 96, borderRadius: 12 }}
          >
            <Ionicons name={isBus ? 'bus-outline' : 'car-outline'} size={28} color={muted} />
          </View>
        )}
        <View className="flex-1 ml-3">
          <Text className="text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>
            {booking.transport?.name || titleCase(booking.transportType)}
          </Text>
          {coach ? (
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark" numberOfLines={1}>
              {coach}
            </Text>
          ) : null}
          <View className="flex-row flex-wrap mt-2">
            {badge(titleCase(booking.status), statusColor(booking.status))}
            {badge(titleCase(booking.paymentStatus), statusColor(booking.paymentStatus))}
          </View>
        </View>
      </View>

      <View className="h-px my-3 bg-border dark:bg-border-dark" />

      <View className="flex-row items-center mb-3">
        <Ionicons name="receipt" size={16} color={primary} style={{ marginRight: 10 }} />
        <View className="flex-1">
          <Text className="text-xs text-muted dark:text-muted-dark mb-0.5">
            {t(TRANSLATION_KEYS.BOOKING.CONFIRMATION_CODE)}
          </Text>
          <Text className="text-sm font-semibold text-text dark:text-text-dark">
            {booking.confirmationCode}
          </Text>
        </View>
        <Text className="text-base font-bold text-text dark:text-text-dark">৳{booking.totalPrice}</Text>
      </View>

      {isBus ? (
      <View className="flex-row items-center mb-3">
        <Text className="text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
          {booking.departureLocation}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={muted} style={{ marginHorizontal: 8 }} />
        <Text className="flex-1 text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
          {booking.arrivalLocation}
        </Text>
      </View>
      ) : (
      <View className="flex-row items-center mb-3">
        <Ionicons name="location-outline" size={16} color={primary} style={{ marginRight: 8 }} />
        <Text className="flex-1 text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
          {booking.departureLocation}
        </Text>
      </View>
      )}

      <View className="flex-row justify-between gap-3">
        <View className="flex-1 p-3 border border-border rounded-lg bg-surface-2 dark:bg-surface-2-dark dark:border-border-dark">
          <Text className="mb-1 text-xs font-semibold text-muted dark:text-muted-dark">
            {t(isBus ? TRANSLATION_KEYS.TRANSPORT_BOOKING.DEPARTURE : TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_LABEL)}
          </Text>
          <Text className="text-base font-bold text-text dark:text-text-dark">
            {formatTripClock(booking.departureDateTime)}
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark">{dayLabel(booking.departureDateTime)}</Text>
        </View>
        <View className="flex-1 p-3 border border-border rounded-lg bg-surface-2 dark:bg-surface-2-dark dark:border-border-dark">
          <Text className="mb-1 text-xs font-semibold text-muted dark:text-muted-dark">
            {t(isBus ? TRANSLATION_KEYS.TRANSPORT_BOOKING.ARRIVAL : TRANSLATION_KEYS.TRANSPORT.RENTAL_RETURN_LABEL)}
          </Text>
          <Text className="text-base font-bold text-text dark:text-text-dark">
            {formatTripClock(booking.arrivalDateTime)}
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark">{dayLabel(booking.arrivalDateTime)}</Text>
        </View>
      </View>

      {booking.seatNumber ? (
        <Text className="mt-3 text-xs text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.SEATS)}: {booking.seatNumber}
        </Text>
      ) : null}
    </Pressable>
  );
}
