import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import theme from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface DeskScanVerdictProps {
  unpaid: boolean;
  checkedInAt?: string | null;
}

export function DeskScanVerdict({ unpaid, checkedInAt }: DeskScanVerdictProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const checkedIn = Boolean(checkedInAt);
  const color = checkedIn
    ? (isDark ? theme.colors['primary-dark'] : theme.colors.primary)
    : unpaid
      ? (isDark ? theme.colors['warning-dark'] : theme.colors.warning)
      : (isDark ? theme.colors['success-dark'] : theme.colors.success);

  const label = checkedIn
    ? t(TRANSLATION_KEYS.QR.VERDICT_CHECKED_IN, {
        time: new Date(checkedInAt as string).toLocaleString(),
      })
    : unpaid
      ? t(TRANSLATION_KEYS.QR.VERDICT_UNPAID)
      : t(TRANSLATION_KEYS.QR.VERDICT_VALID);

  const icon = unpaid && !checkedIn ? 'alert-circle' : 'checkmark-circle';

  return (
    <View
      className="flex-row items-center px-4 py-3 rounded-2xl"
      style={{ backgroundColor: `${color}22` }}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text className="flex-1 ml-2 text-base font-bold" style={{ color }}>
        {label}
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
