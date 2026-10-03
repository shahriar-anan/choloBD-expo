import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { formatBdt } from '../../utils/money';
import { ActivityBookingRecord } from '../../services/api/activityBookings';
import { GuideBookingRecord } from '../../services/api/guideBookings';
import { canPayActivity, canPayGuide } from '../../hooks/useAttractionBookings';
import { shouldFetchCancellationEligibility } from '../../utilities/bookingCancelHelpers';

type AttractionBookingCardProps =
  | {
      kind: 'activity';
      booking: ActivityBookingRecord;
      cancelling: boolean;
      onPay: () => void;
      onCancel: () => void;
    }
  | {
      kind: 'guide';
      booking: GuideBookingRecord;
      cancelling: boolean;
      onPay: () => void;
      onCancel: () => void;
    };

function dayLabel(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function titleCase(value?: string | null): string {
  if (!value) return '';
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function guideName(booking: GuideBookingRecord): string {
  return [booking.guide?.firstName, booking.guide?.lastName].filter(Boolean).join(' ') || 'Guide';
}

export function AttractionBookingCard(props: AttractionBookingCardProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const onPrimary = isDark ? theme.colors['onPrimary-dark'] : theme.colors.onPrimary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;

  const booking = props.booking;
  const title = props.kind === 'activity'
    ? props.booking.activitySpot?.name || t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TAB_ACTIVITIES)
    : guideName(props.booking);
  const imageUrl = props.kind === 'activity'
    ? props.booking.activitySpot?.images?.[0]?.url
    : props.booking.guide?.images?.[0]?.url;
  const location = props.kind === 'activity'
    ? props.booking.activitySpot?.location?.name
    : props.booking.guide?.location?.name;
  const meta = props.kind === 'activity'
    ? `${dayLabel(props.booking.bookingDate)} · ${props.booking.participantCount}`
    : `${dayLabel(props.booking.bookingDate)} · ${props.booking.travelerCount}`;
  const payable = props.kind === 'activity' ? canPayActivity(props.booking) : canPayGuide(props.booking);
  const cancellable = shouldFetchCancellationEligibility(booking.status);

  return (
    <View
      className="mb-3 overflow-hidden"
      style={{
        backgroundColor: surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor,
        ...theme.elevation.sm,
      }}
    >
      <View style={{ height: 88, backgroundColor: isDark ? '#1E3A5F' : '#E8F1FF' }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 88 }} resizeMode="cover" />
        ) : (
          <View className="items-center justify-center flex-1">
            <Ionicons name={props.kind === 'activity' ? 'bicycle' : 'person'} size={28} color={primary} />
          </View>
        )}
        <View className="absolute flex-row left-3 top-3">
          <View className="px-2.5 py-1 mr-2 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{titleCase(booking.status)}</Text>
          </View>
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{titleCase(booking.paymentStatus)}</Text>
          </View>
        </View>
      </View>
      <View className="p-3">
        <Text className="text-base font-bold text-text dark:text-text-dark" numberOfLines={1}>
          {title}
        </Text>
        {location ? (
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
            {location}
          </Text>
        ) : null}
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-sm" style={{ color: muted }}>{meta}</Text>
          <Text className="text-base font-bold" style={{ color: primary }}>{formatBdt(booking.totalPrice)}</Text>
        </View>
        {props.kind === 'guide' && booking.status === 'PENDING' ? (
          <Text className="mt-2 text-xs" style={{ color: muted }}>
            {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.PAY_AFTER_ACCEPT)}
          </Text>
        ) : null}
        {payable || cancellable ? (
          <View className="flex-row mt-3" style={{ gap: 8 }}>
            {payable ? (
              <Pressable
                onPress={props.onPay}
                disabled={props.cancelling}
                className="items-center justify-center flex-1 rounded-xl"
                style={{ backgroundColor: primary, minHeight: 44, opacity: props.cancelling ? 0.6 : 1 }}
              >
                <Text style={{ color: onPrimary, fontWeight: '700', fontSize: 14 }}>
                  {t(TRANSLATION_KEYS.PAYMENT.COMPLETE_PAYMENT)}
                </Text>
              </Pressable>
            ) : null}
            {cancellable ? (
              <Pressable
                onPress={props.onCancel}
                disabled={props.cancelling}
                className="items-center justify-center flex-1 rounded-xl"
                style={{ borderWidth: 1, borderColor: errorColor, minHeight: 44, opacity: props.cancelling ? 0.6 : 1 }}
              >
                {props.cancelling ? (
                  <ActivityIndicator color={errorColor} />
                ) : (
                  <Text style={{ color: errorColor, fontWeight: '700', fontSize: 14 }}>
                    {t(TRANSLATION_KEYS.BOOKING.CANCEL)}
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
