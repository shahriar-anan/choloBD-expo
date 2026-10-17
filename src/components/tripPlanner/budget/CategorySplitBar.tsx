import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { formatTaka } from '../../../utils/tripPlanItinerary';

export function CategorySplitBar({ stays, activities }: { stays: number; activities: number }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const total = stays + activities;
  const stayShare = total > 0 ? (stays / total) * 100 : 0;
  const activityShare = total > 0 ? (activities / total) * 100 : 0;
  const stayColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const activityColor = isDark ? theme.colors['accent-dark'] : theme.colors.accent;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const track = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];

  return (
    <View>
      <View className="h-2.5 rounded-full overflow-hidden flex-row" style={{ backgroundColor: track }}>
        {stayShare > 0 ? <View style={{ width: `${stayShare}%`, backgroundColor: stayColor }} /> : null}
        {activityShare > 0 ? <View style={{ width: `${activityShare}%`, backgroundColor: activityColor }} /> : null}
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="text-xs" style={{ color: muted }}>
          {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STAYS)} {formatTaka(stays)}
        </Text>
        <Text className="text-xs" style={{ color: muted }}>
          {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_ACTIVITIES)} {formatTaka(activities)}
        </Text>
      </View>
    </View>
  );
}
