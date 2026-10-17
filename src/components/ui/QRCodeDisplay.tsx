import React from 'react';
import { View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import theme from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface QRCodeDisplayProps {
  qrToken: string;
  size?: number;
  label?: string;
  hint?: string;
  expiresAt?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrToken,
  size = 300,
  label,
  hint,
  expiresAt,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const title = label || t(TRANSLATION_KEYS.QR.CHECK_IN_TITLE);
  const caption = hint || t(TRANSLATION_KEYS.QR.SHOW_STAFF);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  return (
    <View className="items-center p-6 bg-white dark:bg-surface-dark rounded-2xl border" style={{ borderColor: primaryColor, borderWidth: 1 }}>
      <Text className="text-lg font-semibold text-text dark:text-text-dark mb-1">{title}</Text>
      <Text className="text-xs text-muted dark:text-muted-dark mb-6">{caption}</Text>

      <View
        className="bg-white p-4 rounded-2xl"
        style={{
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          borderWidth: 1,
          borderColor: primaryColor,
        }}
      >
        <QRCode
          value={qrToken}
          size={size}
          backgroundColor="white"
          color="black"
          quietZone={10}
        />
      </View>

      {expiresAt && (
        <View className="mt-6 px-4 py-2 rounded-lg bg-surface-2 dark:bg-surface-2-dark border border-border dark:border-border-dark">
          <Text className="text-xs font-medium text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.QR.EXPIRES, { time: new Date(expiresAt).toLocaleTimeString() })}
          </Text>
        </View>
      )}
    </View>
  );
};

export default QRCodeDisplay;
