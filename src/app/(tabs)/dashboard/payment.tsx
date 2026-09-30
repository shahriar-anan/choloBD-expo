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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { usePaymentLogic } from '@/hooks/usePaymentLogic';
import { chargeWalletCredits, getOwnWallet, pointsCostForTotal } from '@/services/api/wallet';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import type { ServiceType } from '@/types/payments';

type ScreenState = 'idle' | 'processing' | 'success' | 'failed' | 'unknown';

export default function DashboardPaymentScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId: string;
    serviceType: string;
    totalPrice?: string;
  }>();

  const { startPayment } = usePaymentLogic();
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [payMethod, setPayMethod] = useState<'card' | 'points'>('card');
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;

  const bookingId = params.bookingId ?? '';
  const serviceType = (params.serviceType ?? 'HOTEL_BOOKING') as ServiceType;
  const totalPrice = params.totalPrice;
  const pointsCost = pointsCostForTotal(Number(totalPrice ?? 0));
  const canPayWithWallet = serviceType !== 'WALLET_TOP_UP' && pointsBalance !== null && pointsBalance >= pointsCost && pointsCost > 0;

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
    if (!bookingId) return;
    setPayMethod('card');
    setPointsError(null);
    setScreenState('processing');
    const result = await startPayment({
      serviceType,
      serviceTypeId: bookingId,
      bookingId,
    });
    if (result.success) {
      setScreenState('success');
    } else {
      setScreenState(result.status === 'PENDING' ? 'unknown' : 'failed');
    }
  };

  const handlePayWithWallet = async () => {
    if (!bookingId || serviceType === 'WALLET_TOP_UP' || !canPayWithWallet) return;
    setPayMethod('points');
    setPointsError(null);
    setScreenState('processing');
    try {
      await chargeWalletCredits({
        serviceType,
        serviceTypeId: bookingId,
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

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={handleBack} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.PAYMENT.COMPLETE_PAYMENT)}
        </Text>
      </View>

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
              onPress={handleBack}
              style={{ backgroundColor: successColor, borderRadius: 12, marginTop: 32, width: '100%' }}
              className="py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">
                {t(TRANSLATION_KEYS.COMMON.BACK)}
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
              onPress={payMethod === 'points' ? handlePayWithWallet : handlePayNow}
              style={{ backgroundColor: primaryColor, borderRadius: 12, marginTop: 32, width: '100%' }}
              className="py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">{t(TRANSLATION_KEYS.PAYMENT.RETRY)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBack} className="mt-4 py-3 w-full items-center">
              <Text style={{ color: primaryColor }} className="font-medium text-sm">
                {t(TRANSLATION_KEYS.COMMON.BACK)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── IDLE / PROCESSING STATE ── */}
        {(screenState === 'idle' || screenState === 'processing') && (
          <>
            {/* Summary Card */}
            <View
              className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark mb-8"
              style={theme.elevation.sm}
            >
              <View className="p-5">
                <Text className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark mb-3">
                  {t(TRANSLATION_KEYS.PAYMENT.PAYMENT_STATUS)}
                </Text>
                <View className="flex-row items-center mb-4">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: (isDark ? theme.colors['warning-dark'] : theme.colors.warning) + '1A',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="card-outline" size={20} color={isDark ? theme.colors['warning-dark'] : theme.colors.warning} />
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-text dark:text-text-dark">
                      {t(TRANSLATION_KEYS.PAYMENT.UNPAID)}
                    </Text>
                    <Text className="text-xs text-muted dark:text-muted-dark">
                      {t(TRANSLATION_KEYS.PAYMENT.BOOKING_RESERVED)}
                    </Text>
                  </View>
                </View>
                {totalPrice && (
                  <View className="flex-row justify-between items-center pt-4 border-t border-border dark:border-border-dark">
                    <Text className="text-sm text-muted dark:text-muted-dark">
                      {t(TRANSLATION_KEYS.PAYMENT.TOTAL_AMOUNT)}
                    </Text>
                    <Text className="text-xl font-bold text-text dark:text-text-dark">
                      ৳{totalPrice}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* SSLCommerz badge */}
            <View className="flex-row items-center justify-center mb-8">
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

            {serviceType !== 'WALLET_TOP_UP' ? (
              <TouchableOpacity
                onPress={handlePayWithWallet}
                disabled={!canPayWithWallet || screenState === 'processing'}
                style={{
                  borderRadius: 12,
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: primaryColor,
                  opacity: canPayWithWallet ? 1 : 0.5,
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
                {!canPayWithWallet && pointsBalance !== null ? (
                  <Text className="text-xs mt-1" style={{ color: errorColor }}>
                    {t(TRANSLATION_KEYS.PAYMENT.INSUFFICIENT_POINTS)}
                  </Text>
                ) : null}
                {pointsError && screenState === 'idle' ? (
                  <Text className="text-xs mt-1 text-center" style={{ color: errorColor }}>{pointsError}</Text>
                ) : null}
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
