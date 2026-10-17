import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { formatTaka } from '../../../utils/tripPlanItinerary';

export function PriceChangedNotice({
  liveTotal,
  savedTotal,
  onUpdate,
}: {
  liveTotal: number;
  savedTotal: number;
  onUpdate?: () => void;
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const delta = liveTotal - savedTotal;
  const signed = `${delta > 0 ? '+' : ''}${formatTaka(delta)}`;

  return (
    <View
      className="rounded-xl px-3 py-2 mt-3"
      style={{ backgroundColor: isDark ? theme.colors['warning-soft-dark'] : theme.colors['warning-soft'] }}
    >
      <Text className="text-xs leading-5" style={{ color: warning }}>
        {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_PRICE_CHANGED, {
          amount: formatTaka(liveTotal),
          delta: signed,
        })}
      </Text>
      {onUpdate ? (
        <TouchableOpacity onPress={onUpdate} accessibilityRole="button" className="mt-2" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text className="text-xs font-bold" style={{ color: warning }}>
            {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_UPDATE_PRICES)}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
