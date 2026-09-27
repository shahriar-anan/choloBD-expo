/**
 * Transport tab — read-only stop transport preferences (no booking in increment 01).
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { TripPlan } from '../../../types/trips';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';

interface TransportTabProps {
  trip: TripPlan;
}

export function TransportTab({ trip }: TransportTabProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const stops = (trip.userSegments || []).filter((s) => s.customTransport);

  return (
    <View className="px-2">
      <Text className="text-sm text-muted dark:text-muted-dark mb-4">
        {t(TRANSLATION_KEYS.TRIP_PLANNER.TRANSPORT_READ_ONLY_NOTE)}
      </Text>
      {stops.length === 0 ? (
        <View className="items-center py-8">
          <Feather name="truck" size={36} color={mutedColor} />
          <Text className="mt-3 text-muted dark:text-muted-dark text-center">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.TRANSPORT_EMPTY_TITLE)}
          </Text>
        </View>
      ) : (
        stops.map((seg) => (
          <View
            key={seg.id}
            className="p-4 mb-3 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
          >
            <View className="flex-row items-center mb-1">
              <Feather name="truck" size={14} color={primaryColor} />
              <Text className="ml-2 font-semibold text-text dark:text-text-dark">{seg.customTransport}</Text>
            </View>
            <Text className="text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: seg.dayNumber })} · {seg.shortDescription}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
