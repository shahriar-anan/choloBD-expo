import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { formatEnumLabel, formatTaka } from '../../../utils/tripPlanItinerary';

export function StopCostLines({
  activityCost,
  hasActivity,
  hotelCost,
  hotelRoomType,
  showHotel,
  transportOption,
  total,
  linesKnown = true,
  prominent = false,
}: {
  activityCost?: number;
  hasActivity?: boolean;
  hotelCost?: number;
  hotelRoomType?: string | null;
  showHotel?: boolean;
  transportOption?: string | null;
  total?: number;
  linesKnown?: boolean;
  /** Card size: 15pt rows and a 17pt total. */
  prominent?: boolean;
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const rowSize = prominent ? theme.typography.sizes.sm : theme.typography.trip.caption;
  const totalSize = prominent ? theme.typography.sizes.md : theme.typography.trip.meta;

  const activityLine = hasActivity
    ? activityCost
      ? formatTaka(activityCost)
      : t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_FREE)
    : null;

  return (
    <View className="mt-2">
      {linesKnown && activityLine ? (
        <View className="flex-row justify-between">
          <Text style={{ color: muted, fontSize: rowSize }}>
            {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_ACTIVITY)}
          </Text>
          <Text className="font-semibold" style={{ color: text, fontSize: rowSize }}>
            {activityLine}
          </Text>
        </View>
      ) : null}
      {linesKnown && showHotel && hotelCost != null && hotelCost > 0 ? (
        <View className="flex-row justify-between mt-1">
          <Text className="flex-1 pr-2" style={{ color: muted, fontSize: rowSize }} numberOfLines={1}>
            {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STAY)}
            {hotelRoomType ? ` · ${formatEnumLabel(hotelRoomType)}` : ''}
          </Text>
          <Text className="font-semibold" style={{ color: text, fontSize: rowSize }}>
            {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_PER_NIGHT, { amount: formatTaka(hotelCost) })}
          </Text>
        </View>
      ) : null}
      {transportOption ? (
        <Text className="mt-1" style={{ color: muted, fontSize: rowSize }}>
          {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_TRANSPORT_NOT_PRICED, {
            type: formatEnumLabel(transportOption),
          })}
        </Text>
      ) : null}
      {typeof total === 'number' && (hasActivity || (showHotel && (hotelCost || 0) > 0) || !linesKnown) ? (
        <View className="flex-row justify-between mt-1.5">
          <Text className="font-semibold" style={{ color: muted, fontSize: rowSize }}>
            {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STOP_TOTAL)}
          </Text>
          <Text className="font-bold" style={{ color: text, fontSize: totalSize }}>
            {formatTaka(total)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
