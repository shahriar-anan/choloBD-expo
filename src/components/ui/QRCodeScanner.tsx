import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { KeyboardAwareScroll } from './KeyboardAwareScroll';
import { Ionicons } from '@expo/vector-icons';
import { CameraQRScanner } from './CameraQRScanner';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

interface QRCodeScannerProps {
  onScan: (qrToken: string) => void;
  isLoading?: boolean;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, isLoading = false }) => {
  const { isDark } = useTheme();
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
              Manual QR Token Entry
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
                Paste QR Token
              </Text>
              <TextInput
                className="p-3 border border-border dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-text dark:text-text-dark text-xs"
                placeholder="Paste QR token here..."
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
                {isLoading ? 'Scanning...' : 'Validate QR Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setScanMethod('camera')}
              className="px-4 py-2 rounded-lg border border-primary items-center"
            >
              <Text className="text-primary font-semibold">Try Camera Scanner</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View className="mt-8 p-4 rounded-lg" style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
          <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
            How to use:
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark">
            {scanMethod === 'camera'
              ? '• Point camera at the guest\'s QR code\n• The code will scan automatically\n• The guest\'s booking details will appear below'
              : '• Paste or type the QR token below\n• Press "Validate QR Code"\n• The guest\'s booking details will appear below'}
          </Text>
        </View>
    </KeyboardAwareScroll>
  );
};

export default QRCodeScanner;
