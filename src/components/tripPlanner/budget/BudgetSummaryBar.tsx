import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { BudgetMeter } from './BudgetMeter';

export function BudgetSummaryBar({
  planned,
  budget,
  updating,
  estimate,
  onPress,
  onRetry,
}: {
  planned: number;
  budget: number;
  updating?: boolean;
  estimate?: boolean;
  onPress: () => void;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      className="mx-4 mt-3 mb-2 rounded-2xl border px-4 py-3"
      style={{ backgroundColor: surface, borderColor: border, ...theme.elevation.sm }}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <BudgetMeter planned={planned} budget={budget} compact updating={updating} estimate={estimate} />
        </View>
        <Ionicons name="chevron-forward" size={20} color={muted} />
      </View>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} accessibilityRole="button" className="mt-2">
          <Text className="text-xs font-semibold" style={{ color: isDark ? theme.colors['primary-dark'] : theme.colors.primary }}>
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_RETRY_PRICES)}
          </Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}
