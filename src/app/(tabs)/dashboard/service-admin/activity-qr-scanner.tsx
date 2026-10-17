import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../../constants/theme';
import { useFocusEffect, useRouter } from 'expo-router';
import { QRCodeScanner } from '../../../../components/ui/QRCodeScanner';
import { ActivityQrScanResult } from '../../../../components/attractions/ActivityQrScanResult';
import { DeskQrRecentScans } from '../../../../components/desk/DeskQrRecentScans';
import { DeskScanActions } from '../../../../components/desk/DeskScanActions';
import { useActivityQRScanner } from '../../../../hooks/useActivityQRScanner';
import { useTheme } from '../../../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import type { ActivityBookingRecord } from '../../../../services/api/activityBookings';
import {
  activityQrCheckIn,
  getActivityQrScanDetail,
  listActivityQrScans,
} from '../../../../services/api/activityBookings';
import type { QrScanHistoryItem } from '../../../../types/qr';

type DeskResult = {
  booking: ActivityBookingRecord;
  checkedInAt: string | null;
};

export default function ActivityQrScannerPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { scanQRCode, loading, error, clearError } = useActivityQRScanner();
  const [deskResult, setDeskResult] = useState<DeskResult | null>(null);
  const [recentScans, setRecentScans] = useState<QrScanHistoryItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [checkInBusy, setCheckInBusy] = useState(false);

  const loadRecent = useCallback(async () => {
    try {
      setRecentLoading(true);
      setRecentScans(await listActivityQrScans());
    } catch {
      setRecentScans([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!deskResult) void loadRecent();
    }, [deskResult, loadRecent])
  );

  const openScanDetail = async (scanId: string) => {
    try {
      setRecentLoading(true);
      const detail = await getActivityQrScanDetail(scanId);
      const payload = detail.data;
      const booking = payload?.booking as ActivityBookingRecord | undefined;
      if (!booking?.id) return;
      const checkedInAt = payload.checkedInAt ?? booking.checkedInAt ?? null;
      setDeskResult({ booking: { ...booking, checkedInAt }, checkedInAt });
    } catch (detailError: unknown) {
      const err = detailError as { message?: string };
      Alert.alert(t(TRANSLATION_KEYS.QR.SCAN_FAILED), err?.message || t(TRANSLATION_KEYS.QR.SCAN_FAILED_BODY));
    } finally {
      setRecentLoading(false);
    }
  };

  const handleCheckIn = () => {
    if (!deskResult?.booking.id || deskResult.checkedInAt) return;
    void (async () => {
      try {
        setCheckInBusy(true);
        const { checkedInAt } = await activityQrCheckIn(deskResult.booking.id);
        setDeskResult((current) =>
          current ? { ...current, checkedInAt, booking: { ...current.booking, checkedInAt } } : current
        );
        await loadRecent();
      } catch (checkInError: unknown) {
        const err = checkInError as { message?: string };
        Alert.alert(t(TRANSLATION_KEYS.QR.CHECK_IN_GUEST), err?.message || t(TRANSLATION_KEYS.QR.SCAN_FAILED_BODY));
      } finally {
        setCheckInBusy(false);
      }
    })();
  };

  const handleQRScan = async (qrToken: string) => {
    try {
      const booking = await scanQRCode(qrToken);
      if (booking) {
        setDeskResult({ booking, checkedInAt: booking.checkedInAt ?? null });
        await loadRecent();
      }
    } catch (scanError: unknown) {
      const err = scanError as { message?: string };
      Alert.alert(t(TRANSLATION_KEYS.QR.SCAN_FAILED), err?.message || t(TRANSLATION_KEYS.QR.SCAN_FAILED_BODY));
    }
  };

  const resetScan = () => {
    setDeskResult(null);
    clearError();
    void loadRecent();
  };

  const scannedBooking = deskResult?.booking ?? null;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="p-6 border-b border-border dark:border-border-dark">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.QR.SCANNER_TITLE)}
          </Text>
          <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
            <Ionicons name="close" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {scannedBooking ? (
        <View className="flex-1">
          <ActivityQrScanResult booking={{ ...scannedBooking, checkedInAt: deskResult?.checkedInAt ?? scannedBooking.checkedInAt }} />
          <DeskScanActions
            showCheckIn={!deskResult?.checkedInAt}
            checkInBusy={checkInBusy}
            onCheckIn={handleCheckIn}
            onScanAnother={resetScan}
          />
        </View>
      ) : (
        <View className="flex-1">
          <QRCodeScanner
            onScan={handleQRScan}
            isLoading={loading}
            footer={
              <>
                <DeskQrRecentScans
                  rows={recentScans}
                  loading={recentLoading}
                  onSelect={(id) => void openScanDetail(id)}
                />
                {error ? (
                  <View className="p-4 mt-4 border rounded-2xl" style={{ borderColor: isDark ? theme.colors['error-dark'] : theme.colors.error }}>
                    <Text className="text-sm font-semibold" style={{ color: isDark ? theme.colors['error-dark'] : theme.colors.error }}>
                      {error}
                    </Text>
                    <Pressable onPress={clearError} className="mt-2">
                      <Text className="text-sm font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.QR.DISMISS)}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}
