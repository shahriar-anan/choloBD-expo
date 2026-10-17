import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ActivityBookingRecord } from '../../services/api/activityBookings';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { formatTripDateTime, operatorStatusLabel } from '../../utilities/transportFormat';
import { DeskScanVerdict, paymentMethodLabel } from '../ui/DeskScanVerdict';

interface ActivityQrScanResultProps {
  booking: ActivityBookingRecord;
}

export function ActivityQrScanResult({ booking }: ActivityQrScanResultProps) {
  const { t } = useTranslation();
  const unpaid = String(booking.paymentStatus || '').toUpperCase() !== 'PAID';
  const guest =
    [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(' ') ||
    booking.user?.userName ||
    t(TRANSLATION_KEYS.QR.GUEST);
  const method = paymentMethodLabel(booking.paymentMethod, t);

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <DeskScanVerdict unpaid={unpaid} checkedInAt={booking.checkedInAt} />

      <Text className="mt-5 text-3xl font-bold text-text dark:text-text-dark">{guest}</Text>
      {booking.user?.phoneNumber ? (
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{booking.user.phoneNumber}</Text>
      ) : null}

      <Text className="mt-4 text-xl font-bold text-text dark:text-text-dark">
        {booking.activitySpot?.name || t(TRANSLATION_KEYS.DASHBOARD.BOOKING_KINDS.ACTIVITY)}
      </Text>

      <View className="p-4 mt-3 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.DATE)}
        </Text>
        <Text className="mt-1 text-base font-bold text-text dark:text-text-dark">
          {formatTripDateTime(booking.bookingDate)}
        </Text>
        <Text className="mt-3 text-sm text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PARTICIPANTS)}: {booking.participantCount}
        </Text>
      </View>

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
      </View>
    </ScrollView>
  );
}
