import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { KeyboardAwareScroll } from './KeyboardAwareScroll';
import { Ionicons } from '@expo/vector-icons';
import { CameraQRScanner } from './CameraQRScanner';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import theme from '../../constants/theme';

interface QRCodeScannerProps {
  onScan: (qrToken: string) => void;
  isLoading?: boolean;
  footer?: React.ReactNode;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, isLoading = false, footer }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [manualInput, setManualInput] = useState('');
  const [scanMethod, setScanMethod] = useState<'camera' | 'manual'>('camera');

  const handleManualScan = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  const handleCameraScan = (qrToken: string) => {
    onScan(qrToken);
    setManualInput('');
  };

  return (
    <KeyboardAwareScroll className="flex-1 p-6 bg-background dark:bg-background-dark">
        {/* Camera Scanner */}
        {scanMethod === 'camera' && (
          <CameraQRScanner
            onScan={handleCameraScan}
            onSwitchToManual={() => setScanMethod('manual')}
            isLoading={isLoading}
          />
        )}

        {/* Manual Input Method */}
        {scanMethod === 'manual' && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-text dark:text-text-dark mb-4">
              {t(TRANSLATION_KEYS.QR.MANUAL_TITLE)}
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
                {t(TRANSLATION_KEYS.QR.PASTE_TOKEN)}
              </Text>
              <TextInput
                className="p-3 border border-border dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-text dark:text-text-dark text-xs"
                placeholder={t(TRANSLATION_KEYS.QR.PASTE_PLACEHOLDER)}
                placeholderTextColor={isDark ? '#9ca3af' : '#d1d5db'}
                multiline
                numberOfLines={4}
                value={manualInput}
                onChangeText={setManualInput}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              onPress={handleManualScan}
              disabled={!manualInput.trim() || isLoading}
              className="bg-primary px-4 py-3 rounded-lg items-center mb-3"
              style={{
                opacity: !manualInput.trim() || isLoading ? 0.5 : 1,
              }}
            >
              <Text className="text-white font-semibold">
                {isLoading ? t(TRANSLATION_KEYS.QR.SCANNING) : t(TRANSLATION_KEYS.QR.VALIDATE)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setScanMethod('camera')}
              className="px-4 py-2 rounded-lg border border-primary items-center"
            >
              <Text className="text-primary font-semibold">{t(TRANSLATION_KEYS.QR.TRY_CAMERA)}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View className="mt-8 p-4 rounded-lg" style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
          <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
            {t(TRANSLATION_KEYS.QR.HOW_TO)}
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark">
            {scanMethod === 'camera' ? t(TRANSLATION_KEYS.QR.CAMERA_STEPS) : t(TRANSLATION_KEYS.QR.MANUAL_STEPS)}
          </Text>
        </View>
        {footer}
    </KeyboardAwareScroll>
  );
};

export default QRCodeScanner;
