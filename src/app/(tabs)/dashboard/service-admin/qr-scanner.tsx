import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../../constants/theme';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarClearance } from '../../../../hooks/useHideTabBar';
import { QRCodeScanner } from '../../../../components/ui/QRCodeScanner';
import { QRBookingDetailsDisplay } from '../../../../components/ui/QRBookingDetailsDisplay';
import { useQRScanner } from '../../../../hooks/useQRScanner';
import { useTheme } from '../../../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import type { QRBookingDetail } from '../../../../types/qr';
import { updateHotelStayStatus } from '../../../../services/api/bookings';
import { canRecordStay } from '../../../../utilities/hotelDesk';

export default function QRScannerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const isTab = pathname === '/qr-scanner';
  const { scanQRCode, loading, error, clearError } = useQRScanner();
  const [scannedBooking, setScannedBooking] = useState<QRBookingDetail | null>(null);
  const [stayBusy, setStayBusy] = useState(false);

  const recordStay = (status: 'COMPLETED' | 'NO_SHOW') => {
    if (!scannedBooking?.id) return;
    const label = status === 'COMPLETED' ? t(TRANSLATION_KEYS.HOTEL_DESK.CHECK_OUT) : t(TRANSLATION_KEYS.HOTEL_DESK.NO_SHOW);
    Alert.alert(label, t(TRANSLATION_KEYS.HOTEL_DESK.SCAN_DOES_NOT_CHANGE), [
      { text: t(TRANSLATION_KEYS.COMMON.BACK), style: 'cancel' },
      {
        text: label,
        onPress: () => {
          void (async () => {
            try {
              setStayBusy(true);
              const updated = await updateHotelStayStatus(scannedBooking.id, status);
              setScannedBooking((current) => current ? { ...current, ...updated, status } : current);
            } catch (stayError: any) {
              Alert.alert(label, stayError?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_UPDATE_STAY));
            } finally {
              setStayBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const handleQRScan = async (qrToken: string) => {
    try {
      const booking = await scanQRCode(qrToken);
      if (booking) {
        setScannedBooking(booking);
      }
    } catch (scanError: unknown) {
      const err = scanError as { response?: { data?: { message?: string } }; message?: string };
      const message = err?.response?.data?.message || err?.message || t(TRANSLATION_KEYS.QR.SCAN_FAILED_BODY);
      Alert.alert(t(TRANSLATION_KEYS.QR.SCAN_FAILED), message);
    }
  };

  const resetScan = () => {
    setScannedBooking(null);
    clearError();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background dark:bg-background-dark" style={isTab ? { paddingBottom: tabBarClearance(insets.bottom) } : undefined}>
      <View className="p-6 border-b border-border dark:border-border-dark">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.QR.SCANNER_TITLE)}</Text>
          {isTab ? null : (
            <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 6 }}>
              <Ionicons name="close" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
            </Pressable>
          )}
        </View>
      </View>

      {scannedBooking ? (
        <View className="flex-1">
          <QRBookingDetailsDisplay booking={scannedBooking} />
          {canRecordStay(scannedBooking) ? (
            <View className="flex-row gap-2 px-4 pb-2">
              <Pressable onPress={() => recordStay('COMPLETED')} disabled={stayBusy} className="flex-1 px-3 py-3 border rounded-xl border-border dark:border-border-dark">
                <Text className="font-semibold text-center text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.CHECK_OUT)}</Text>
              </Pressable>
              <Pressable onPress={() => recordStay('NO_SHOW')} disabled={stayBusy} className="flex-1 px-3 py-3 border rounded-xl border-border dark:border-border-dark">
                <Text className="font-semibold text-center text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.NO_SHOW)}</Text>
              </Pressable>
            </View>
          ) : null}
          <View className="px-4 pt-2 pb-4 border-t border-border dark:border-border-dark">
            <Pressable
              onPress={resetScan}
              className="bg-primary px-6 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">{t(TRANSLATION_KEYS.QR.SCAN_ANOTHER)}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <QRCodeScanner onScan={handleQRScan} isLoading={loading} />

          {error ? (
            <View className="p-4 mx-4 mb-4 border rounded-2xl" style={{ borderColor: isDark ? theme.colors['error-dark'] : theme.colors.error }}>
              <Text className="text-sm font-semibold" style={{ color: isDark ? theme.colors['error-dark'] : theme.colors.error }}>
                {error}
              </Text>
              <Pressable onPress={clearError} className="mt-2">
                <Text className="text-sm font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.QR.DISMISS)}</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}
