import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TransportBooking } from '../../types/transports';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { formatTripDateTime, operatorStatusLabel } from '../../utilities/transportFormat';
import { DeskScanVerdict, paymentMethodLabel } from '../ui/DeskScanVerdict';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

interface TransportQrScanResultProps {
  booking: TransportBooking;
}

export function TransportQrScanResult({ booking }: TransportQrScanResultProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const unpaid = String(booking.paymentStatus || '').toUpperCase() !== 'PAID';
  const items = booking.items || [];
  const lead =
    items
      .map((item) => item.passengerName || [item.passengerFirstName, item.passengerLastName].filter(Boolean).join(' '))
      .find(Boolean) ||
    [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(' ') ||
    booking.user?.userName ||
    t(TRANSLATION_KEYS.QR.GUEST);
  const method = paymentMethodLabel(booking.paymentMethod, t);

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <DeskScanVerdict unpaid={unpaid} />

      <Text className="mt-5 text-3xl font-bold text-text dark:text-text-dark">{lead}</Text>
      <Text className="mt-1 text-base font-semibold text-text dark:text-text-dark">
        {formatTripDateTime(booking.departureDateTime)}
      </Text>
      <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
        {booking.departureLocation} → {booking.arrivalLocation}
      </Text>

      {items.length ? (
        <View className="mt-4">
          {items.map((item, index) => {
            const seat = item.assignedSeatLabel || item.transportSeat?.seatLabel || '';
            const name =
              item.passengerName ||
              [item.passengerFirstName, item.passengerLastName].filter(Boolean).join(' ');
            return (
              <View
                key={item.id || `${seat}-${index}`}
                className="flex-row items-center p-3 mb-2 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark"
              >
                <View className="items-center justify-center w-14 h-14 mr-3 rounded-xl" style={{ backgroundColor: `${primary}18` }}>
                  <Text className="text-base font-bold" style={{ color: primary }}>{seat || '—'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-text dark:text-text-dark">
                    {name || t(TRANSLATION_KEYS.QR.GUEST)}
                  </Text>
                  {item.serviceClassLabel ? (
                    <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{item.serviceClassLabel}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {booking.boardingStop?.name ? (
        <View className="p-4 mt-2 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark">
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT_BOOKING.BOARDING)}</Text>
          <Text className="mt-1 text-base font-semibold text-text dark:text-text-dark">{booking.boardingStop.name}</Text>
          {booking.droppingStop?.name ? (
            <Text className="mt-2 text-sm text-muted dark:text-muted-dark">{booking.droppingStop.name}</Text>
          ) : null}
        </View>
      ) : null}

      <View className="p-4 mt-3 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.BOOKING.CONFIRMATION_CODE)}</Text>
        <Text className="mt-1 text-lg font-bold text-text dark:text-text-dark" style={{ letterSpacing: 0.4 }}>
          {booking.confirmationCode}
        </Text>
        <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
          {operatorStatusLabel(booking.status, t)}
          {' · '}
          {operatorStatusLabel(booking.paymentStatus, t)}
          {method ? ` · ${method}` : ''}
        </Text>
        {booking.contactPhone ? (
          <Text className="mt-2 text-sm text-text dark:text-text-dark">{booking.contactPhone}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
