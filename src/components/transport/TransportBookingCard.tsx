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

function dayLabel(value: string): string {
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
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const imageUrl = booking.transport?.images?.[0]?.url;
  const isBus = booking.transportType === 'BUS';
  const coach =
    booking.serviceClass ||
    booking.items?.find((item) => item.transportTrip?.coachLabel)?.transportTrip?.coachLabel ||
    null;

  const chip = (label: string, color: string) => (
    <View
      key={label}
      className="px-2.5 py-1 mr-2 rounded-full"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden"
      style={{
        backgroundColor: surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor,
        ...theme.elevation.sm,
      }}
    >
      <View style={{ height: 148, backgroundColor: isDark ? '#1E3A5F' : '#E8F1FF' }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 148 }} resizeMode="cover" />
        ) : (
          <View className="items-center justify-center flex-1">
            <Ionicons name={isBus ? 'bus' : 'car'} size={42} color={primary} />
          </View>
        )}
        <View className="absolute flex-row left-3 top-3">
          {chip(titleCase(booking.status), '#fff')}
          {chip(titleCase(booking.paymentStatus), '#fff')}
        </View>
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>
          {booking.transport?.name || booking.transportType}
        </Text>
        {coach ? (
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
            {coach}
          </Text>
        ) : null}

        <View className="flex-row items-center mt-3">
          <Text className="text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
            {booking.departureLocation}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={muted} style={{ marginHorizontal: 8 }} />
          <Text className="flex-1 text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
            {booking.arrivalLocation}
          </Text>
        </View>

        <View className="flex-row mt-4">
          <View className="flex-1 pr-2">
            <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DEPARTURE)}
            </Text>
            <Text className="mt-1 text-base font-bold" style={{ color: textColor }}>
              {formatTripClock(booking.departureDateTime)}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark">{dayLabel(booking.departureDateTime)}</Text>
          </View>
          <View className="items-end flex-1 pl-2">
            <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.ARRIVAL)}
            </Text>
            <Text className="mt-1 text-base font-bold" style={{ color: textColor }}>
              {formatTripClock(booking.arrivalDateTime)}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark">{dayLabel(booking.arrivalDateTime)}</Text>
          </View>
        </View>

        <View className="h-px my-3 bg-border dark:bg-border-dark" />

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-muted dark:text-muted-dark">{booking.confirmationCode}</Text>
          <Text className="text-base font-bold text-text dark:text-text-dark">৳{booking.totalPrice}</Text>
        </View>
        {booking.seatNumber ? (
          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.SEATS)}: {booking.seatNumber}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
