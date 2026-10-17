import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import theme from '../../../../constants/theme';
import { QRCodeScanner } from '../../../../components/ui/QRCodeScanner';
import { TransportQrScanResult } from '../../../../components/transport/TransportQrScanResult';
import { useTransportQRScanner } from '../../../../hooks/useTransportQRScanner';
import { useTheme } from '../../../../hooks/useTheme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import type { TransportBooking } from '../../../../types/transports';

export default function TransportAdminQrScannerPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { scanQRCode, loading, error, clearError } = useTransportQRScanner();
  const [scannedBooking, setScannedBooking] = useState<TransportBooking | null>(null);

  const handleQRScan = async (qrToken: string) => {
    try {
      const booking = await scanQRCode(qrToken);
      if (booking) {
        setScannedBooking(booking);
      }
    } catch (scanError: unknown) {
      const message = scanError instanceof Error ? scanError.message : t(TRANSLATION_KEYS.QR.SCAN_FAILED_BODY);
      Alert.alert(t(TRANSLATION_KEYS.QR.SCAN_FAILED), message);
    }
  };

  const resetScan = () => {
    setScannedBooking(null);
    clearError();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="p-6 border-b border-border dark:border-border-dark">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SCAN_TICKETS)}
          </Text>
          <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
            <Ionicons name="close" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {scannedBooking ? (
        <View className="flex-1">
          <TransportQrScanResult booking={scannedBooking} />
          <View className="p-6 border-t border-border dark:border-border-dark">
            <Pressable onPress={resetScan} className="items-center px-6 py-3 rounded-lg bg-primary">
              <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.QR.SCAN_ANOTHER)}</Text>
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
