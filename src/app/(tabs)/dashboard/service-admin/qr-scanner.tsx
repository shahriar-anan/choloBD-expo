import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../../constants/theme';
import { useRouter } from 'expo-router';
import { QRCodeScanner } from '../../../../components/ui/QRCodeScanner';
import { QRBookingDetailsDisplay } from '../../../../components/ui/QRBookingDetailsDisplay';
import { useQRScanner } from '../../../../hooks/useQRScanner';
import { useTheme } from '../../../../hooks/useTheme';
import type { QRBookingDetail } from '../../../../types/qr';
import { updateHotelStayStatus } from '../../../../services/api/bookings';
import { canRecordStay } from '../../../../utilities/hotelDesk';

export default function QRScannerPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { scanQRCode, loading, error, clearError } = useQRScanner();
  const [scannedBooking, setScannedBooking] = useState<QRBookingDetail | null>(null);
  const [stayBusy, setStayBusy] = useState(false);

  const recordStay = (status: 'COMPLETED' | 'NO_SHOW') => {
    if (!scannedBooking?.id) return;
    const label = status === 'COMPLETED' ? 'Check out' : 'No-show';
    Alert.alert(label, 'The scan itself does not change the stay. This button does.', [
      { text: 'Back', style: 'cancel' },
      {
        text: label,
        onPress: () => {
          void (async () => {
            try {
              setStayBusy(true);
              const updated = await updateHotelStayStatus(scannedBooking.id, status);
              setScannedBooking((current) => current ? { ...current, ...updated, status } : current);
            } catch (stayError: any) {
              Alert.alert(label, stayError?.response?.data?.message || 'Could not update this stay.');
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
    } catch (e) {
      // Error is already set in the hook and logged
      Alert.alert('Scan Failed', error || 'Failed to validate QR code');
    }
  };

  const resetScan = () => {
    setScannedBooking(null);
    clearError();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background dark:bg-background-dark">
      <View className="p-6 border-b border-border dark:border-border-dark">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">QR Scanner</Text>
          <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 6 }}>
            <Ionicons name="close" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {scannedBooking ? (
        <View className="flex-1">
          <QRBookingDetailsDisplay booking={scannedBooking} />
          {canRecordStay(scannedBooking) ? (
            <View className="flex-row gap-2 px-6">
              <Pressable onPress={() => recordStay('COMPLETED')} disabled={stayBusy} className="flex-1 px-3 py-3 border rounded-lg border-border dark:border-border-dark">
                <Text className="font-semibold text-center text-text dark:text-text-dark">Check out</Text>
              </Pressable>
              <Pressable onPress={() => recordStay('NO_SHOW')} disabled={stayBusy} className="flex-1 px-3 py-3 border rounded-lg border-border dark:border-border-dark">
                <Text className="font-semibold text-center text-text dark:text-text-dark">No-show</Text>
              </Pressable>
            </View>
          ) : null}
          <View className="p-6 border-t border-border dark:border-border-dark">
            <Pressable
              onPress={resetScan}
              className="bg-primary px-6 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Scan Another QR Code</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <QRCodeScanner onScan={handleQRScan} isLoading={loading} />

          {error && (
            <View className="p-6 bg-red-50 dark:bg-red-900 border-t border-red-200 dark:border-red-700">
              <Text className="text-sm font-semibold text-red-900 dark:text-red-50 mb-2">
                {error}
              </Text>
              <Pressable
                onPress={clearError}
                className="mt-2 p-2 rounded"
              >
                <Text className="text-sm text-red-900 dark:text-red-50 font-semibold">Dismiss</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
