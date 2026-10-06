import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { RecentBookingKind, RecentBookingView } from '../../utilities/recentBookingItems';
import { profilePhotoUri } from '../../utilities/profileImage';

interface RecentBookingCardProps {
  item: RecentBookingView;
  onPress?: (item: RecentBookingView) => void;
  onQrPress?: (item: RecentBookingView) => void;
  compact?: boolean;
}

const KIND_ICON: Record<RecentBookingKind, keyof typeof Ionicons.glyphMap> = {
  hotel: 'bed-outline',
  transport: 'ticket-outline',
  activity: 'walk-outline',
  guide: 'person-outline',
  package: 'map-outline',
  trip: 'compass-outline',
};

function kindLabelKey(kind: RecentBookingKind): string {
  switch (kind) {
    case 'hotel':
      return TRANSLATION_KEYS.DASHBOARD.BOOKING_KINDS.HOTEL;
    case 'transport':
      return TRANSLATION_KEYS.DASHBOARD.BOOKING_KINDS.TICKET;
    case 'activity':
      return TRANSLATION_KEYS.DASHBOARD.BOOKING_KINDS.ACTIVITY;
    case 'guide':
      return TRANSLATION_KEYS.DASHBOARD.BOOKING_KINDS.GUIDE;
    case 'package':
      return TRANSLATION_KEYS.DASHBOARD.BOOKING_KINDS.PACKAGE;
    case 'trip':
      return TRANSLATION_KEYS.DASHBOARD.BOOKING_KINDS.TRIP;
  }
}

function statusColor(status: string | undefined, isDark: boolean): string {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'completed':
    case 'paid':
      return isDark ? theme.colors['success-dark'] : theme.colors.success;
    case 'pending':
    case 'accepted':
    case 'unpaid':
      return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    case 'cancelled':
    case 'declined':
    case 'failed':
      return isDark ? theme.colors['error-dark'] : theme.colors.error;
    default:
      return isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  }
}

export function RecentBookingCard({ item, onPress, onQrPress, compact = false }: RecentBookingCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const pale = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];
  const bookingStatus = statusColor(item.status, isDark);
  const payment = statusColor(item.paymentStatus, isDark);
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setPhotoFailed(false);
  }, [item.imageUrl]);
  const photoUri = photoFailed ? null : profilePhotoUri(item.imageUrl);
  const thumb = compact ? 52 : 72;

  const body = (
    <View className="p-3 mb-2 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
      <View className="flex-row items-center">
        <View
          style={{
            width: thumb,
            height: thumb,
            borderRadius: 12,
            backgroundColor: pale,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={{ width: thumb, height: thumb }}
              resizeMode="cover"
              onError={() => setPhotoFailed(true)}
              accessibilityRole="image"
              accessibilityLabel={item.title}
            />
          ) : (
            <Ionicons name={KIND_ICON[item.kind]} size={compact ? 20 : 28} color={primary} />
          )}
        </View>
        <View className="flex-1 ml-3 min-w-0">
          <Text className="text-[11px] font-semibold text-primary dark:text-primary-dark">
            {t(kindLabelKey(item.kind))}
          </Text>
          <Text className="text-sm font-bold text-text dark:text-text-dark" numberOfLines={1}>
            {item.title}
          </Text>
          <View className="flex-row flex-wrap mt-1.5 gap-1">
            {item.status ? (
              <View style={{ backgroundColor: `${bookingStatus}20` }} className="px-2 py-0.5 rounded-md">
                <Text style={{ color: bookingStatus }} className="text-[10px] font-bold">
                  {item.status}
                </Text>
              </View>
            ) : null}
            {item.paymentStatus ? (
              <View style={{ backgroundColor: `${payment}20` }} className="px-2 py-0.5 rounded-md">
                <Text style={{ color: payment }} className="text-[10px] font-bold">
                  {item.paymentStatus}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-1.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
            {item.detail}
            {item.price != null ? ` · ৳${item.price}` : ''}
          </Text>
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={16} color={muted} /> : null}
      </View>
      {onQrPress && String(item.status || '').toUpperCase() !== 'CANCELLED' && (item.kind === 'hotel' || item.kind === 'activity' || item.kind === 'transport') ? (
        <Pressable
          onPress={() => onQrPress(item)}
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.BOOKING.QR_CODE)}
          className="flex-row items-center self-start px-3 py-2 mt-3 rounded-full"
          style={{ backgroundColor: pale }}
        >
          <Ionicons name="qr-code" size={16} color={primary} />
          <Text className="ml-2 text-xs font-bold" style={{ color: primary }}>{t(TRANSLATION_KEYS.BOOKING.QR_CODE)}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable onPress={() => onPress(item)} accessibilityRole="button" accessibilityLabel={item.title}>
      {body}
    </Pressable>
  );
}
