import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../hooks/useTheme';
import { useTransportBookingLogic } from '../../../../hooks/useTransportBookingLogic';
import theme from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { CancellationEligibility } from '../../../../types/cancellation';
import { TransportBooking } from '../../../../types/transports';
import { CancellationEligibilityPreview } from '../../../../components/booking/CancellationEligibilityPreview';
import { TravelerTicketView } from '../../../../components/transport/TravelerTicketView';
import { getCancelActionLabel, shouldFetchCancellationEligibility } from '../../../../utilities/bookingCancelHelpers';

export default function TransportBookingDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { fetchBookingDetail, loadEligibility, handleCancelBooking, cancelSubmitting } =
    useTransportBookingLogic();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<TransportBooking | null>(null);
  const [eligibility, setEligibility] = useState<CancellationEligibility | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const onPrimary = isDark ? theme.colors['onPrimary-dark'] : theme.colors.onPrimary;

  const reload = async () => {
    if (!bookingId) return;
    setLoading(true);
    const row = await fetchBookingDetail(bookingId);
    setBooking(row);
    if (row && shouldFetchCancellationEligibility(row.status)) {
      setEligibility(await loadEligibility(bookingId));
    } else {
      setEligibility(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [bookingId]);

  const pay = () => {
    if (!booking) return;
    router.push({
      pathname: '/(tabs)/explore/transport-payment',
      params: { bookingId: booking.id },
    });
  };

  const confirmCancel = async () => {
    if (!bookingId) return;
    await handleCancelBooking(bookingId, undefined, () => {
      setShowCancelModal(false);
      reload();
    });
  };

  const leave = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/dashboard/transport-bookings');
  };

  const showCancel = Boolean(booking && shouldFetchCancellationEligibility(booking.status));
  const unpaid = Boolean(booking && booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED');
  const title = booking?.transport?.name || t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DETAILS);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <View className="flex-row items-center h-12 px-1">
        <Pressable
          onPress={leave}
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)}
          hitSlop={8}
          className="items-center justify-center w-11 h-11"
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="flex-1 pr-3 text-base font-bold text-text dark:text-text-dark" numberOfLines={1}>
          {title}
        </Text>
      </View>

      {loading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator color={primary} />
        </View>
      ) : !booking ? (
        <View className="items-center justify-center flex-1 px-6">
          <Text className="text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.NOT_FOUND)}
          </Text>
        </View>
      ) : (
        <>
          <TravelerTicketView
            booking={booking}
            eligibility={showCancel ? eligibility : null}
            onOpenLinked={
              booking.linkedLegBookingId
                ? () =>
                    router.push({
                      pathname: pathname.includes('/bookings/')
                        ? '/(tabs)/bookings/ticket/[bookingId]'
                        : '/(tabs)/dashboard/transport-bookings/[bookingId]',
                      params: { bookingId: booking.linkedLegBookingId as string },
                    })
                : undefined
            }
          />
          {unpaid || showCancel ? (
            <View className="px-4 pt-3 pb-2 border-t border-border dark:border-border-dark">
              {unpaid ? (
                <Pressable
                  onPress={pay}
                  accessibilityRole="button"
                  className="items-center py-3.5 rounded-xl"
                  style={{ backgroundColor: primary }}
                >
                  <Text className="font-semibold" style={{ color: onPrimary }}>
                    {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.PAY)}
                  </Text>
                </Pressable>
              ) : null}
              {showCancel ? (
                <Pressable
                  onPress={() => {
                    if (!eligibility?.canCancel) {
                      Alert.alert(
                        t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANNOT_CANCEL),
                        eligibility?.reason || t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANNOT_CANCEL_DESC)
                      );
                      return;
                    }
                    setShowCancelModal(true);
                  }}
                  accessibilityRole="button"
                  className="items-center py-3 mt-2 border rounded-xl"
                  style={{ borderColor: errorColor }}
                >
                  <Text className="font-semibold text-center" style={{ color: errorColor }}>
                    {eligibility ? getCancelActionLabel(eligibility) : t(TRANSLATION_KEYS.BOOKING.CANCEL)}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
        <View className="justify-end flex-1 bg-black/50">
          <View className="p-6 rounded-t-3xl" style={{ backgroundColor: surfaceColor }}>
            <Text className="mb-4 text-2xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.BOOKING.CANCEL)}
            </Text>
            {eligibility ? (
              <CancellationEligibilityPreview
                eligibility={eligibility}
                t={t}
                surfaceColor={isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2']}
                borderColor={borderColor}
                textColor={textColor}
                mutedColor={mutedColor}
                primaryColor={primary}
              />
            ) : null}
            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={() => setShowCancelModal(false)}
                className="items-center justify-center flex-1 py-3 rounded-lg"
                style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}
              >
                <Text className="font-semibold" style={{ color: textColor }}>
                  {t(TRANSLATION_KEYS.COMMON.CANCEL)}
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmCancel}
                disabled={cancelSubmitting}
                className="items-center justify-center flex-1 py-3 rounded-lg"
                style={{ backgroundColor: errorColor }}
              >
                {cancelSubmitting ? (
                  <ActivityIndicator color={onPrimary} />
                ) : (
                  <Text className="font-semibold" style={{ color: onPrimary }}>
                    {t(TRANSLATION_KEYS.COMMON.CONFIRM)}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
