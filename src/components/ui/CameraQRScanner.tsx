import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermission } from '../../hooks/useCameraPermission';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import theme from '../../constants/theme';

interface CameraQRScannerProps {
  onScan: (qrToken: string) => void;
  onSwitchToManual: () => void;
  isLoading?: boolean;
}

export const CameraQRScanner: React.FC<CameraQRScannerProps> = ({
  onScan,
  onSwitchToManual,
  isLoading = false,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { permission, isLoading: permissionLoading } = useCameraPermission();
  const cameraRef = useRef<CameraView>(null);
  const [scanned, setScanned] = useState(false);
  const lastScannedTimeRef = useRef(0);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    const now = Date.now();
    // Debounce: ignore if we scanned the same code within 1 second
    if (now - lastScannedTimeRef.current < 1000) {
      return;
    }

    lastScannedTimeRef.current = now;
    setScanned(true);

    // Extract QR token and send to parent
    onScan(data.trim());

    // Re-enable scanning after 2 seconds
    setTimeout(() => setScanned(false), 2000);
  };

  if (permissionLoading) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.QR.LOADING_CAMERA)}</Text>
      </View>
    );
  }

  if (permission === false) {
    return (
      <View className="items-center mb-6">
        <View className="w-64 h-64 rounded-xl items-center justify-center border-2 p-4" style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'], borderColor: isDark ? theme.colors['error-dark'] : theme.colors.error }}>
          <Ionicons name="close-circle" size={64} color={isDark ? theme.colors['error-dark'] : theme.colors.error} />
          <Text className="mt-4 text-sm font-semibold text-center text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.QR.CAMERA_DENIED)}
          </Text>
          <Text className="mt-2 text-xs text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.QR.CAMERA_DENIED_BODY)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onSwitchToManual}
          className="px-4 py-2 mt-4 border rounded-lg border-primary"
        >
          <Text className="font-semibold text-primary">{t(TRANSLATION_KEYS.QR.USE_MANUAL)}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="items-center mb-6">
      <View className="w-64 h-64 overflow-hidden border-2 rounded-xl border-primary">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Camera overlay guide */}
          <View className="items-center justify-center flex-1">
            <View
              className="w-48 h-48 border-2 border-white rounded-lg"
              style={{
                shadowColor: isDark ? theme.colors['text-dark'] : theme.colors.text,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            />
            {scanned && (
              <View className="absolute inset-0 items-center justify-center rounded-lg" style={{ backgroundColor: isDark ? theme.colors['success-dark'] + '33' : theme.colors.success + '33' }}>
                <Ionicons name="checkmark-circle" size={48} color={isDark ? theme.colors['success-dark'] : theme.colors.success} />
              </View>
            )}
          </View>
        </CameraView>
      </View>

      <View className="w-64 p-3 mt-4 rounded-lg" style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
        <Text className="text-xs text-center text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.QR.POSITION_FRAME)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onSwitchToManual}
        className="px-4 py-2 mt-4 border rounded-lg border-muted"
      >
        <Text className="font-semibold text-muted">{t(TRANSLATION_KEYS.QR.USE_MANUAL)}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CameraQRScanner;
