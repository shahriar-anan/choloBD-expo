import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import theme from '../../constants/theme';

interface DaySummaryCardProps {
  day: number;
  dateLabel?: string;
  stopCount: number;
  amountLabel: string;
  aboveGuide?: string;
  onDetails?: () => void;
}

export function DaySummaryCard({
  day,
  dateLabel,
  stopCount,
  amountLabel,
  aboveGuide,
  onDetails,
}: DaySummaryCardProps) {
  const { t } = useTranslation();
  const title = dateLabel
    ? t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_SUMMARY_TITLE, { day, date: dateLabel })
    : t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day });

  return (
    <View
      className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-3 mb-3"
      style={theme.elevation.sm}
    >
      <Text className="text-base font-semibold text-text dark:text-text-dark">
        {title}
      </Text>
      <View className="flex-row items-center mt-1">
        <Text className="text-sm text-text dark:text-text-dark flex-1 pr-3">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_STOP_COUNT, { count: stopCount })}
          {' · '}
          {amountLabel}
        </Text>
        {onDetails ? (
          <TouchableOpacity
            onPress={onDetails}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_DETAILS)}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_DETAILS)} ›
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {aboveGuide ? (
        <Text className="text-xs text-muted dark:text-muted-dark mt-1">
          {aboveGuide}
        </Text>
      ) : null}
    </View>
  );
}
