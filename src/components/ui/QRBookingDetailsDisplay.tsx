import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { QRBookingDetail } from '../../types/qr';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { operatorStatusLabel, formatTripDateTime } from '../../utilities/transportFormat';
import { DeskScanVerdict, paymentMethodLabel } from './DeskScanVerdict';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

interface QRBookingDetailsDisplayProps {
  booking: QRBookingDetail;
}

const SHIFT_KEYS: Record<string, string> = {
  MORNING: TRANSLATION_KEYS.HOTEL_DESK.MORNING,
  AFTERNOON: TRANSLATION_KEYS.HOTEL_DESK.AFTERNOON,
  NIGHT: TRANSLATION_KEYS.HOTEL_DESK.NIGHT,
};

export const QRBookingDetailsDisplay: React.FC<QRBookingDetailsDisplayProps> = ({ booking }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const guestName =
    booking.guestName ||
    [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(' ') ||
    booking.user?.userName ||
    t(TRANSLATION_KEYS.QR.GUEST);
  const unpaid = String(booking.paymentStatus || '').toUpperCase() !== 'PAID';
  const shiftKey = booking.shift ? SHIFT_KEYS[booking.shift] : undefined;
  const rooms = booking.roomDetails || [];
  const method = paymentMethodLabel(booking.paymentMethod, t);

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <DeskScanVerdict unpaid={unpaid} />

      <Text className="mt-5 text-3xl font-bold text-text dark:text-text-dark">{guestName}</Text>
      {booking.user?.phoneNumber || booking.guestPhoneNumber ? (
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
          {booking.user?.phoneNumber || booking.guestPhoneNumber}
        </Text>
      ) : null}

      {rooms.length ? (
        <View className="flex-row flex-wrap mt-4">
          {rooms.map((item, index) => (
            <View
              key={item.hotelRoom?.id || `${item.hotelRoom?.roomNumber}-${index}`}
              className="px-3 py-2 mr-2 mb-2 rounded-xl"
              style={{ backgroundColor: `${primary}18` }}
            >
              <Text className="text-base font-bold" style={{ color: primary }}>
                {item.hotelRoom?.roomNumber
                  ? t(TRANSLATION_KEYS.QR.ROOM_NUMBER, { number: item.hotelRoom.roomNumber })
                  : t(TRANSLATION_KEYS.QR.ROOM_FALLBACK)}
              </Text>
              {item.hotelRoomType?.roomType ? (
                <Text className="text-xs text-muted dark:text-muted-dark">{item.hotelRoomType.roomType}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View className="p-4 mt-2 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.CHECK_IN)}</Text>
        <Text className="mt-1 text-base font-bold text-text dark:text-text-dark">{formatTripDateTime(booking.checkInDate)}</Text>
        <Text className="mt-3 text-xs font-semibold text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.CHECK_OUT)}</Text>
        <Text className="mt-1 text-base font-bold text-text dark:text-text-dark">{formatTripDateTime(booking.checkOutDate)}</Text>
        {shiftKey ? (
          <Text className="mt-3 text-sm font-semibold text-text dark:text-text-dark">{t(shiftKey)}</Text>
        ) : null}
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
        {booking.hotel?.name ? (
          <Text className="mt-2 text-sm text-text dark:text-text-dark">{booking.hotel.name}</Text>
        ) : null}
      </View>

      {booking.specialRequests ? (
        <View className="p-4 mt-3 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark">
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.QR.SPECIAL_REQUESTS)}</Text>
          <Text className="mt-1 text-sm leading-5 text-text dark:text-text-dark">{booking.specialRequests}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

export default QRBookingDetailsDisplay;
