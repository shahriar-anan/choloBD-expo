import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { formatTaka } from '../../../utils/tripPlanItinerary';

export function OverBudgetBanner({
  overBy,
  raisedBudget,
  fromTemplate,
  onRaise,
  onSeeCosts,
}: {
  overBy: number;
  raisedBudget: number;
  fromTemplate?: boolean;
  onRaise: () => void;
  onSeeCosts: () => void;
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const error = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  return (
    <View
      className="rounded-2xl px-4 py-3 mb-3"
      style={{
        backgroundColor: isDark ? theme.colors['error-soft-dark'] : theme.colors['error-soft'],
        borderWidth: 1,
        borderColor: error,
      }}
    >
      <Text className="text-sm font-semibold" style={{ color: error }}>
        {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_OVER_BANNER, { amount: formatTaka(overBy) })}
      </Text>
      {fromTemplate ? (
        <Text className="text-xs mt-1" style={{ color: error }}>
          {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_TEMPLATE_OVER)}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap gap-2 mt-3">
        <TouchableOpacity
          onPress={onRaise}
          className="rounded-full px-3 py-2"
          style={{ backgroundColor: error }}
        >
          <Text className="text-xs font-bold text-white">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_RAISE_TO, { amount: formatTaka(raisedBudget) })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSeeCosts} className="rounded-full px-3 py-2 border" style={{ borderColor: primary }}>
          <Text className="text-xs font-bold" style={{ color: primary }}>
            {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_SEE_COSTS)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
