import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { roleBookings } from '@/utilities/travelerShell';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { usePaymentLogic } from '@/hooks/usePaymentLogic';
import { chargeWalletCredits, getOwnWallet, pointsCostForTotal } from '@/services/api/wallet';
import { useExplore } from './_provider';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import type { TransactionStatus } from '@/types/payments';

type ScreenState = 'idle' | 'processing' | 'success' | 'failed' | 'unknown';

export default function ExplorePaymentScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const { lastBookingResult, hotelDetail, checkInDate, checkOutDate, clearAllAndGoToSearch } =
    useExplore();
  const { startPayment } = usePaymentLogic();

  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [payMethod, setPayMethod] = useState<'card' | 'points'>('card');
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [txnStatus, setTxnStatus] = useState<TransactionStatus | undefined>();

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;

  const pointsCost = pointsCostForTotal(Number(lastBookingResult?.totalPrice ?? 0));
  const canPayWithPoints = pointsBalance !== null && pointsBalance >= pointsCost && pointsCost > 0;

  useEffect(() => {
    let cancelled = false;
    const loadWallet = async () => {
      try {
        const wallet = await getOwnWallet();
        if (!cancelled) {
          setPointsBalance(Number(wallet.balance) || 0);
        }
      } catch {
        if (!cancelled) {
          setPointsBalance(null);
        }
      }
    };
    loadWallet();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePayNow = async () => {
    if (!lastBookingResult?.id) return;
    setPayMethod('card');
    setPointsError(null);
    setScreenState('processing');
    const result = await startPayment({
      serviceType: 'HOTEL_BOOKING',
      serviceTypeId: lastBookingResult.id,
      bookingId: lastBookingResult.id,
    });
    setTxnStatus(result.status);
    if (result.success) {
      setScreenState('success');
    } else if (result.error?.includes('already')) {
      setScreenState('success');
    } else {
      setScreenState(result.status === 'PENDING' ? 'unknown' : 'failed');
    }
  };

  const handlePayWithPoints = async () => {
    if (!lastBookingResult?.id || !canPayWithPoints) return;
    setPayMethod('points');
    setPointsError(null);
    setScreenState('processing');
    try {
      await chargeWalletCredits({
        serviceType: 'HOTEL_BOOKING',
        serviceTypeId: lastBookingResult.id,
        paymentAmount: pointsCost,
      });
      setPointsBalance((current) => (current === null ? current : current - pointsCost));
      setScreenState('success');
    } catch (error: any) {
      const message = error?.response?.data?.message || t(TRANSLATION_KEYS.PAYMENT.FAILED_DESC);
      setPointsError(message);
      setScreenState('failed');
    }
  };

  const handlePayLater = () => {
    clearAllAndGoToSearch();
    router.replace(roleBookings(role));
  };

  const handleGoToDashboard = () => {
    clearAllAndGoToSearch();
    router.replace(roleBookings(role));
  };

  if (!lastBookingResult) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <Text className="text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.COMMON.ERROR)}</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/explore')} className="mt-4">
          <Text style={{ color: primaryColor }}>{t(TRANSLATION_KEYS.COMMON.BACK)}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>

        {/* ── SUCCESS STATE ── */}
        {screenState === 'success' && (
          <View className="items-center pt-12">
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: successColor + '1F',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons name="checkmark-circle" size={44} color={successColor} />
            </View>
            <Text className="text-2xl font-bold text-text dark:text-text-dark text-center">
              {t(TRANSLATION_KEYS.PAYMENT.SUCCESS_TITLE)}
            </Text>
            <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.PAYMENT.SUCCESS_DESC)}
            </Text>
            <TouchableOpacity
              onPress={handleGoToDashboard}
              style={{ backgroundColor: successColor, borderRadius: 12, marginTop: 32, width: '100%' }}
              className="py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">
                {t(TRANSLATION_KEYS.PAYMENT.GO_TO_DASHBOARD)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── FAILED STATE ── */}
        {(screenState === 'failed' || screenState === 'unknown') && (
          <View className="items-center pt-12">
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: errorColor + '1F',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons
                name={screenState === 'unknown' ? 'help-circle' : 'close-circle'}
                size={44}
                color={screenState === 'unknown' ? (isDark ? theme.colors['warning-dark'] : theme.colors.warning) : errorColor}
              />
            </View>
            <Text className="text-2xl font-bold text-text dark:text-text-dark text-center">
              {t(screenState === 'unknown' ? TRANSLATION_KEYS.PAYMENT.PENDING_TITLE : TRANSLATION_KEYS.PAYMENT.FAILED_TITLE)}
            </Text>
            <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
              {pointsError || t(screenState === 'unknown' ? TRANSLATION_KEYS.PAYMENT.PENDING_DESC : TRANSLATION_KEYS.PAYMENT.FAILED_DESC)}
            </Text>
            <TouchableOpacity
              onPress={payMethod === 'points' ? handlePayWithPoints : handlePayNow}
              style={{ backgroundColor: primaryColor, borderRadius: 12, marginTop: 32, width: '100%' }}
              className="py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">{t(TRANSLATION_KEYS.PAYMENT.RETRY)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePayLater} className="mt-4 py-3 w-full items-center">
              <Text style={{ color: primaryColor }} className="font-medium text-sm">
                {t(TRANSLATION_KEYS.PAYMENT.PAY_LATER)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── IDLE / PROCESSING STATE ── */}
        {(screenState === 'idle' || screenState === 'processing') && (
          <>
            {/* Header */}
            <View className="mb-6">
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: successColor + '1A',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  marginBottom: 12,
                }}
              >
                <Ionicons name="checkmark-circle" size={14} color={successColor} style={{ marginRight: 4 }} />
                <Text style={{ color: successColor, fontSize: 12, fontWeight: '700' }}>
                  {t(TRANSLATION_KEYS.PAYMENT.BOOKING_RESERVED)}
                </Text>
              </View>
              <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.PAYMENT.TITLE)}
              </Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.PAYMENT.SUBTITLE)}
              </Text>
            </View>

            {/* Booking Summary Card */}
            <View
              className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark mb-6"
              style={theme.elevation.sm}
            >
              <View className="p-4 border-b border-border dark:border-border-dark">
                <Text className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark mb-1">
                  {t(TRANSLATION_KEYS.BOOKING.BOOKING_DETAILS)}
                </Text>
                <Text className="text-base font-bold text-text dark:text-text-dark">
                  {hotelDetail?.name ?? '—'}
                </Text>
                {checkInDate && checkOutDate && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="calendar-outline" size={13} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} />
                    <Text className="ml-1 text-sm text-muted dark:text-muted-dark">
                      {checkInDate} → {checkOutDate}
                    </Text>
                  </View>
                )}
              </View>
              <View className="p-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.BOOKING.CONFIRMATION_CODE)}
                  </Text>
                  <Text className="text-sm font-mono font-semibold text-text dark:text-text-dark">
                    {lastBookingResult.confirmationCode}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.PAYMENT.TOTAL_AMOUNT)}
                  </Text>
                  <Text className="text-xl font-bold text-text dark:text-text-dark">
                    ৳{lastBookingResult.totalPrice ?? '—'}
                  </Text>
                </View>
              </View>
            </View>

            {/* SSLCommerz badge */}
            <View className="flex-row items-center justify-center mb-6">
              <Ionicons name="shield-checkmark" size={14} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} style={{ marginRight: 5 }} />
              <Text className="text-xs text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.PAYMENT.SECURE_PAYMENT)} · {t(TRANSLATION_KEYS.PAYMENT.POWERED_BY_SSLCOMMERZ)}
              </Text>
            </View>

            {/* Pay Now button */}
            {screenState === 'processing' ? (
              <View
                style={{ backgroundColor: primaryColor, borderRadius: 12 }}
                className="py-4 items-center"
              >
                <ActivityIndicator color="#fff" />
                <Text className="text-white text-sm mt-1">
                  {t(payMethod === 'points' ? TRANSLATION_KEYS.PAYMENT.POINTS_PROCESSING : TRANSLATION_KEYS.PAYMENT.INITIALIZING)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePayNow}
                style={{ backgroundColor: primaryColor, borderRadius: 12 }}
                className="py-4 items-center"
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold text-base">
                  {t(TRANSLATION_KEYS.PAYMENT.PAY_NOW)}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handlePayWithPoints}
              disabled={!canPayWithPoints || screenState === 'processing'}
              style={{
                borderRadius: 12,
                marginTop: 12,
                borderWidth: 1,
                borderColor: primaryColor,
                opacity: canPayWithPoints ? 1 : 0.5,
              }}
              className="py-4 items-center"
              activeOpacity={0.85}
            >
              <Text style={{ color: primaryColor }} className="font-bold text-base">
                {t(TRANSLATION_KEYS.PAYMENT.PAY_WITH_POINTS)}
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark mt-1">
                {t(TRANSLATION_KEYS.PAYMENT.POINTS_COST, { points: pointsCost.toLocaleString('en-US') })}
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">
                {pointsBalance === null
                  ? '—'
                  : `${t(TRANSLATION_KEYS.PAYMENT.POINTS_BALANCE)}: ${pointsBalance.toLocaleString('en-US')}`}
              </Text>
              {!canPayWithPoints && pointsBalance !== null ? (
                <Text className="text-xs mt-1" style={{ color: errorColor }}>
                  {t(TRANSLATION_KEYS.PAYMENT.INSUFFICIENT_POINTS)}
                </Text>
              ) : null}
              {pointsError ? (
                <Text className="text-xs mt-1 text-center" style={{ color: errorColor }}>{pointsError}</Text>
              ) : null}
            </TouchableOpacity>

            {/* Pay Later link */}
            <TouchableOpacity
              onPress={handlePayLater}
              className="mt-4 py-3 items-center"
              disabled={screenState === 'processing'}
            >
              <Text style={{ color: primaryColor }} className="font-medium text-sm">
                {t(TRANSLATION_KEYS.PAYMENT.PAY_LATER)}
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">
                {t(TRANSLATION_KEYS.PAYMENT.PAY_LATER_DESC)}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
