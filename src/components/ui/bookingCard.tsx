import React from 'react';
import { View, Text, TouchableOpacity, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface BookingCardProps {
  booking: any;
  onPress?: (id: string) => void;
  showGenerateQr?: boolean;
  showRooms?: boolean;
  deskView?: boolean;
  footer?: React.ReactNode;
  /** Dashboard preview: smaller single-row layout */
  compact?: boolean;
}

// Helper function to format dates in a readable way
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export function BookingCard({ booking, onPress, showGenerateQr = false, showRooms = true, deskView, footer, compact = false }: BookingCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const auth = useSelector((s: RootState) => s.auth);
  const muteIconColor = isDark ? '#9ca3af' : '#666';
  
  // Determine what name to display based on user role
  const isServiceAdmin = deskView ?? auth.user?.role === 'SERVICE_ADMIN';
  const guestName = booking.guestName || [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(' ') || booking.user?.userName || booking.guest || 'Guest';
  const guestEmail = booking.guestEmail || booking.user?.email || '';
  const guestPhone = booking.guestPhoneNumber || booking.user?.phoneNumber || '';
  const displayName = isServiceAdmin 
    ? guestName
    : (booking.hotel?.name || booking.hotelDetails?.name || booking.hotelName || 'Hotel');
  const coverUrl = booking.hotel?.images?.[0]?.url || booking.hotelDetails?.images?.[0]?.url;
  const showThumb = !isServiceAdmin;

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return isDark ? theme.colors['success-dark'] : theme.colors.success;
      case 'pending':
        return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
      case 'cancelled':
        return isDark ? theme.colors['error-dark'] : theme.colors.error;
      default:
        return isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return isDark ? theme.colors['success-dark'] : theme.colors.success;
      case 'pending':
        return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
      case 'failed':
        return isDark ? theme.colors['error-dark'] : theme.colors.error;
      default:
        return isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    }
  };

  if (compact && !isServiceAdmin) {
    const thumbSize = 52;
    const compactBody = (
      <View className="p-3 mb-2 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
        <View className="flex-row items-center">
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              accessibilityLabel={displayName}
              style={{ width: thumbSize, height: thumbSize, borderRadius: 10 }}
            />
          ) : (
            <View
              className="items-center justify-center bg-background dark:bg-background-dark"
              style={{ width: thumbSize, height: thumbSize, borderRadius: 10 }}
            >
              <Ionicons name="bed-outline" size={22} color={muteIconColor} />
            </View>
          )}
          <View className="flex-1 ml-3 min-w-0">
            <Text className="text-sm font-bold text-text dark:text-text-dark" numberOfLines={1}>
              {displayName}
            </Text>
            <View className="flex-row flex-wrap mt-1.5 gap-1">
              <View
                style={{ backgroundColor: `${getStatusColor(booking.status)}20` }}
                className="px-2 py-0.5 rounded-md"
              >
                <Text style={{ color: getStatusColor(booking.status) }} className="text-[10px] font-bold">
                  {booking.status || 'Unknown'}
                </Text>
              </View>
              <View
                style={{ backgroundColor: `${getPaymentStatusColor(booking.paymentStatus)}20` }}
                className="px-2 py-0.5 rounded-md"
              >
                <Text style={{ color: getPaymentStatusColor(booking.paymentStatus) }} className="text-[10px] font-bold">
                  {booking.paymentStatus || 'Unpaid'}
                </Text>
              </View>
            </View>
            <Text className="mt-1.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
              {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
              {booking.totalPrice != null ? ` · ৳${booking.totalPrice}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={muteIconColor} />
        </View>
      </View>
    );

    if (!onPress) {
      return compactBody;
    }

    return (
      <TouchableOpacity onPress={() => onPress(booking.id)} activeOpacity={0.8}>
        {compactBody}
      </TouchableOpacity>
    );
  }

  const card = (
      <View className="p-4 mb-3 bg-white border shadow rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
        {/* Header: cover, name, and status badges */}
        <View className="flex-row items-start">
          {showThumb ? (
            coverUrl ? (
              <Image
                source={{ uri: coverUrl }}
                accessibilityLabel={displayName}
                style={{ width: 96, height: 96, borderRadius: 12 }}
              />
            ) : (
              <View
                className="items-center justify-center bg-background dark:bg-background-dark"
                style={{ width: 96, height: 96, borderRadius: 12 }}
              >
                <Ionicons name="bed-outline" size={28} color={muteIconColor} />
              </View>
            )
          ) : null}
          <View style={{ flex: 1, marginLeft: showThumb ? 12 : 0 }}>
            <Text className="text-lg font-bold text-text dark:text-text-dark">
              {displayName}
            </Text>
            {/* Show guest contact info only for SERVICE_ADMIN, hide for regular users */}
            {isServiceAdmin && guestEmail ? (
              <View className="flex-row items-center mt-2">
                <Ionicons name="mail" size={14} color={muteIconColor} style={{ marginRight: 6 }} />
                <Text className="flex-1 text-sm text-muted dark:text-muted-dark">
                  {guestEmail}
                </Text>
              </View>
            ) : null}
            {isServiceAdmin && guestPhone ? (
              <View className="flex-row items-center mt-1.5">
                <Ionicons name="call" size={14} color={muteIconColor} style={{ marginRight: 6 }} />
                <Text className="text-sm text-muted dark:text-muted-dark">
                  {guestPhone}
                </Text>
              </View>
            ) : null}
            <View className="flex-row flex-wrap mt-2">
              <View
                style={{ backgroundColor: `${getStatusColor(booking.status)}20` }}
                className="px-3 py-1 mr-2 rounded-lg"
              >
                <Text style={{ color: getStatusColor(booking.status) }} className="text-xs font-bold">
                  {booking.status || 'Unknown'}
                </Text>
              </View>
              <View
                style={{ backgroundColor: `${getPaymentStatusColor(booking.paymentStatus)}20` }}
                className="px-3 py-1 rounded-lg"
              >
                <Text style={{ color: getPaymentStatusColor(booking.paymentStatus) }} className="text-xs font-bold">
                  {booking.paymentStatus || 'Unpaid'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px my-3 bg-border dark:bg-border-dark" />

        {/* Booking details */}
        <View>
          {/* Confirmation code */}
          <View className="flex-row items-center mb-3">
            <Ionicons name="receipt" size={16} color={theme.colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text className="text-xs text-muted dark:text-muted-dark mb-0.5">
                {t(TRANSLATION_KEYS.BOOKING.CONFIRMATION_CODE)}
              </Text>
              <Text className="text-sm font-semibold text-text dark:text-text-dark">
                {booking.confirmationCode || booking.id?.substring(0, 16) || 'N/A'}
              </Text>
            </View>
            {showGenerateQr ? (
              <Pressable
                onPress={() => router.push(`/(tabs)/dashboard/${booking.id}/qr-generate`)}
                accessibilityRole="button"
                accessibilityLabel={t(TRANSLATION_KEYS.BOOKING.QR_CODE)}
                className="flex-row items-center ml-2"
              >
                <Ionicons name="qr-code" size={18} color={primaryColor} style={{ marginRight: 6 }} />
                <Text className="text-sm font-semibold" style={{ color: primaryColor }}>
                  {t(TRANSLATION_KEYS.BOOKING.QR_CODE)}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Check-in and check-out dates */}
          <View className="flex-row justify-between gap-3 mb-3">
            <View className="flex-1 p-3 border border-border rounded-lg bg-surface-2 dark:bg-surface-2-dark dark:border-border-dark">
              <Text className="mb-1 text-xs font-semibold text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.BOOKING.CHECK_IN)}
              </Text>
              <Text className="text-base font-bold text-text dark:text-text-dark">
                {formatDate(booking.checkInDate)}
              </Text>
            </View>
            <View className="flex-1 p-3 border border-border rounded-lg bg-surface-2 dark:bg-surface-2-dark dark:border-border-dark">
              <Text className="mb-1 text-xs font-semibold text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.BOOKING.CHECK_OUT)}
              </Text>
              <Text className="text-base font-bold text-text dark:text-text-dark">
                {formatDate(booking.checkOutDate)}
              </Text>
            </View>
          </View>

          {/* Total price and booking date */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="cash" size={16} color={theme.colors.primary} style={{ marginRight: 10 }} />
              <View>
                <Text className="text-xs text-muted dark:text-muted-dark mb-0.5">
                  {t(TRANSLATION_KEYS.BOOKING.TOTAL_PRICE)}
                </Text>
                <Text className="text-base font-bold text-text dark:text-text-dark">
                  ৳{booking.totalPrice ?? 'N/A'}
                </Text>
              </View>
            </View>
            {booking.bookedAt && (
              <View className="items-end">
                <Text className="text-xs text-muted dark:text-muted-dark mb-0.5">
                  {t(TRANSLATION_KEYS.BOOKING.BOOKED_ON)}
                </Text>
                <Text className="text-sm font-semibold text-text dark:text-text-dark">
                  {formatDate(booking.bookedAt)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Room details if available */}
        {showRooms && booking.roomDetails && booking.roomDetails.length > 0 && (
          <View className="pt-4 mt-4 border-t border-border dark:border-border-dark">
            <View className="flex-row items-center mb-3">
              <Ionicons name="bed" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text className="text-sm font-bold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.BOOKING.ROOM_NUMBER)}{booking.roomDetails.length > 1 ? 's' : ''} ({booking.roomDetails.length})
              </Text>
            </View>
            {booking.roomDetails.map((room: any, idx: number) => (
              <View key={idx} className="p-3 mb-2 rounded-lg bg-surface-2 dark:bg-surface-2-dark border border-border dark:border-border-dark">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-text dark:text-text-dark">
                    {t(TRANSLATION_KEYS.BOOKING.ROOM_NUMBER)} {room.hotelRoom?.roomNumber || '?'}
                  </Text>
                  <Text className="text-base font-bold text-success dark:text-success-dark">
                    ৳{room.pricePerNight}{t(TRANSLATION_KEYS.BOOKING.PRICE_PER_NIGHT)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {footer ? (
          <View className="pt-3 mt-3 border-t border-border dark:border-border-dark">
            {footer}
          </View>
        ) : null}
      </View>
  );

  if (!onPress) {
    return card;
  }

  return (
    <TouchableOpacity onPress={() => onPress(booking.id)} activeOpacity={0.8}>
      {card}
    </TouchableOpacity>
  );
}
