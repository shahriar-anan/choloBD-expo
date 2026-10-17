import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { appAlert } from '../../../../components/ui/appAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import theme from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { useTheme } from '../../../../hooks/useTheme';
import { DeskQrRecentScans } from '../../../../components/desk/DeskQrRecentScans';
import { HotelDeskScanPanel, type HotelDeskResult } from '../../../../components/desk/HotelDeskScanPanel';
import { getHotelQrScanDetail, listHotelQrScans } from '../../../../services/api/qr';
import type { QRBookingDetail, QrScanHistoryItem } from '../../../../types/qr';

export default function HotelQrScanHistoryPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [rows, setRows] = useState<QrScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deskResult, setDeskResult] = useState<HotelDeskResult | null>(null);

  const loadRows = useCallback(async (mode: 'initial' | 'refresh') => {
    try {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      const next = await listHotelQrScans();
      setRows(next);
    } catch {
      if (mode === 'initial') setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!deskResult) {
        void loadRows('initial');
      }
    }, [deskResult, loadRows])
  );

  const openScan = async (scanId: string) => {
    try {
      setLoading(true);
      const detail = await getHotelQrScanDetail(scanId);
      const payload = detail.data;
      const booking = payload?.booking as QRBookingDetail | undefined;
      if (!booking?.id) return;
      setDeskResult({
        booking: {
          ...booking,
          checkedInAt: payload?.checkedInAt ?? booking.checkedInAt ?? null,
        },
        checkedInAt: payload?.checkedInAt ?? booking.checkedInAt ?? null,
      });
    } catch (detailError: unknown) {
      const err = detailError as { response?: { data?: { message?: string } }; message?: string };
      appAlert(
        t(TRANSLATION_KEYS.QR.SCAN_FAILED),
        err?.response?.data?.message || err?.message || t(TRANSLATION_KEYS.QR.SCAN_FAILED_BODY)
      , undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (deskResult) {
      setDeskResult(null);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/dashboard/service-admin/qr-scanner');
  };

  const iconColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-4 border-b border-border dark:border-border-dark">
        <Pressable onPress={goBack} hitSlop={8} className="p-1 mr-3">
          <Ionicons name="chevron-back" size={24} color={iconColor} />
        </Pressable>
        <Text className="flex-1 text-2xl font-bold text-text dark:text-text-dark" numberOfLines={1}>
          {deskResult?.booking.guestName || t(TRANSLATION_KEYS.QR.SCAN_HISTORY)}
        </Text>
      </View>

      {deskResult ? (
        <HotelDeskScanPanel
          result={deskResult}
          onChange={setDeskResult}
          onScanAnother={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/(tabs)/dashboard/service-admin/qr-scanner');
          }}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadRows('refresh')} />
          }
        >
          <DeskQrRecentScans
            rows={rows}
            loading={loading}
            showHeading={false}
            onSelect={(id) => void openScan(id)}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
