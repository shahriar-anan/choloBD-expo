import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { appAlert } from '../../../../components/ui/appAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import theme from '../../../../constants/theme';
import { QRCodeScanner } from '../../../../components/ui/QRCodeScanner';
import { useQRScanner } from '../../../../hooks/useQRScanner';
import { useTheme } from '../../../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { HotelDeskScanPanel, type HotelDeskResult } from '../../../../components/desk/HotelDeskScanPanel';

export default function QRScannerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const isTab = pathname === '/qr-scanner';
  const { scanQRCode, loading, error, clearError } = useQRScanner();
  const [deskResult, setDeskResult] = useState<HotelDeskResult | null>(null);

  const handleQRScan = async (qrToken: string) => {
    try {
      const booking = await scanQRCode(qrToken);
      if (booking) {
        setDeskResult({
          booking,
          checkedInAt: booking.checkedInAt ?? null,
        });
      }
    } catch (scanError: unknown) {
      const err = scanError as { response?: { data?: { message?: string } }; message?: string };
      const message = err?.response?.data?.message || err?.message || t(TRANSLATION_KEYS.QR.SCAN_FAILED_BODY);
      appAlert(t(TRANSLATION_KEYS.QR.SCAN_FAILED), message, undefined, 'error');
    }
  };

  const iconColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-4 py-4 border-b border-border dark:border-border-dark">
        <View className="flex-row items-center">
          {isTab ? null : (
            <Pressable onPress={() => router.replace('/(tabs)/dashboard')} hitSlop={8} className="p-1 mr-2">
              <Ionicons name="close" size={24} color={iconColor} />
            </Pressable>
          )}
          <Text className="flex-1 text-2xl font-bold text-text dark:text-text-dark" numberOfLines={1}>
            {t(TRANSLATION_KEYS.QR.SCANNER_TITLE)}
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/dashboard/service-admin/qr-scan-history')}
            hitSlop={8}
            className="flex-row items-center px-3 py-2 rounded-full bg-surface dark:bg-surface-dark"
          >
            <Ionicons name="time-outline" size={18} color={primary} />
            <Text className="ml-1.5 text-sm font-semibold" style={{ color: primary }}>
              {t(TRANSLATION_KEYS.QR.HISTORY)}
            </Text>
          </Pressable>
        </View>
      </View>

      {deskResult ? (
        <HotelDeskScanPanel
          result={deskResult}
          onChange={setDeskResult}
          onScanAnother={() => {
            setDeskResult(null);
            clearError();
          }}
        />
      ) : (
        <View className="flex-1">
          <QRCodeScanner
            onScan={handleQRScan}
            isLoading={loading}
            footer={
              error ? (
                <View
                  className="p-4 mt-4 border rounded-2xl"
                  style={{ borderColor: isDark ? theme.colors['error-dark'] : theme.colors.error }}
                >
                  <Text className="text-sm font-semibold" style={{ color: isDark ? theme.colors['error-dark'] : theme.colors.error }}>
                    {error}
                  </Text>
                  <Pressable onPress={clearError} className="mt-2">
                    <Text className="text-sm font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.QR.DISMISS)}</Text>
                  </Pressable>
                </View>
              ) : null
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}
