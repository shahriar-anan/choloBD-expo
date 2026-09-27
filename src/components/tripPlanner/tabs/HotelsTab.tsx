/**
 * Hotels tab — read-only plan stop hotel preferences (no booking link in increment 01).
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { TripPlan } from '../../../types/trips';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';

interface HotelsTabProps {
  trip: TripPlan;
}

export function HotelsTab({ trip }: HotelsTabProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  const stopsWithHotel = (trip.userSegments || []).filter((s) => s.customHotel);

  return (
    <View className="px-2">
      <Text className="text-sm text-muted dark:text-muted-dark mb-4">
        {t(TRANSLATION_KEYS.TRIP_PLANNER.HOTELS_READ_ONLY_NOTE)}
      </Text>
      {stopsWithHotel.length === 0 ? (
        <View className="items-center py-8">
          <Feather name="home" size={36} color={mutedColor} />
          <Text className="mt-3 text-muted dark:text-muted-dark text-center">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.HOTELS_NO_PREFS)}
          </Text>
        </View>
      ) : (
        stopsWithHotel.map((seg) => (
          <View
            key={seg.id}
            className="p-4 mb-3 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
          >
            <Text className="font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: seg.dayNumber })} · {seg.shortDescription || seg.customNotes}
            </Text>
            <Text className="text-sm text-primary dark:text-primary-dark mt-2">{seg.customHotel}</Text>
          </View>
        ))
      )}
    </View>
  );
}
