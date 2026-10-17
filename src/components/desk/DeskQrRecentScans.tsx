import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import type { QrScanHistoryItem } from '../../types/qr';

interface DeskQrRecentScansProps {
  rows: QrScanHistoryItem[];
  loading: boolean;
  onSelect: (scanId: string) => void;
  showHeading?: boolean;
}

export function DeskQrRecentScans({ rows, loading, onSelect, showHeading = true }: DeskQrRecentScansProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const success = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  return (
    <View className="mt-2">
      {showHeading ? (
        <Text className="mb-2 text-lg font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.QR.RECENT_SCANS)}
        </Text>
      ) : null}
      {loading ? (
        <ActivityIndicator className="py-4" color={theme.colors.primary} />
      ) : rows.length === 0 ? (
        <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.QR.RECENT_EMPTY)}</Text>
      ) : (
        rows.map((row) => (
          <Pressable
            key={row.id}
            onPress={() => onSelect(row.id)}
            className="p-3 mb-2 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-text dark:text-text-dark">
                {new Date(row.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <View className="flex-row items-center">
                {row.checkedInAt ? (
                  <Text className="mr-2 text-xs font-bold" style={{ color: success }}>
                    {t(TRANSLATION_KEYS.QR.CHECKED_IN)}
                  </Text>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={muted} />
              </View>
            </View>
            <Text className="mt-1 text-base font-bold text-text dark:text-text-dark" numberOfLines={1}>
              {row.guestLabel}
            </Text>
            <Text className="text-sm text-muted dark:text-muted-dark" numberOfLines={1}>
              {row.detailLabel}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}
