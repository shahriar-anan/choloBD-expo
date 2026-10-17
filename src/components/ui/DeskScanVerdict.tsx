import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import theme from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface DeskScanVerdictProps {
  unpaid: boolean;
}

export function DeskScanVerdict({ unpaid }: DeskScanVerdictProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const color = unpaid
    ? (isDark ? theme.colors['warning-dark'] : theme.colors.warning)
    : (isDark ? theme.colors['success-dark'] : theme.colors.success);

  return (
    <View
      className="flex-row items-center px-4 py-3 rounded-2xl"
      style={{ backgroundColor: `${color}22` }}
    >
      <Ionicons name={unpaid ? 'alert-circle' : 'checkmark-circle'} size={22} color={color} />
      <Text className="flex-1 ml-2 text-base font-bold" style={{ color }}>
        {unpaid ? t(TRANSLATION_KEYS.QR.VERDICT_UNPAID) : t(TRANSLATION_KEYS.QR.VERDICT_VALID)}
      </Text>
    </View>
  );
}

export function paymentMethodLabel(method: string | null | undefined, t: (key: string) => string): string {
  const value = (method || '').toLowerCase();
  if (!value) return '';
  if (value === 'wallet') return t(TRANSLATION_KEYS.QR.METHOD_WALLET);
  if (value === 'cash') return t(TRANSLATION_KEYS.QR.METHOD_CASH);
  if (value === 'sslcommerz' || value === 'card') return t(TRANSLATION_KEYS.QR.METHOD_CARD);
  return method || '';
}
