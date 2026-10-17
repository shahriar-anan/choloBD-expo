import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { budgetState, BudgetTone } from '../../../utils/tripBudget';
import { formatTaka } from '../../../utils/tripPlanItinerary';

export function toneColor(tone: BudgetTone, isDark: boolean): string {
  if (tone === 'over') return isDark ? theme.colors['error-dark'] : theme.colors.error;
  if (tone === 'warn') return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  return isDark ? theme.colors['primary-dark'] : theme.colors.primary;
}

export function BudgetMeter({
  planned,
  budget,
  compact = false,
  updating = false,
  estimate = false,
}: {
  planned: number;
  budget: number;
  compact?: boolean;
  updating?: boolean;
  estimate?: boolean;
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const state = budgetState(planned, budget);
  const color = toneColor(state.tone, isDark);
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const track = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];
  const fill = Math.min(1, Math.max(0, state.ratio)) * 100;
  const headline =
    state.tone === 'over'
      ? t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_OVER_BY, { amount: formatTaka(state.overBy) })
      : t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_LEFT, { amount: formatTaka(state.remaining) });

  return (
    <View>
      <Text
        className={compact ? 'text-base font-bold' : 'text-lg font-bold'}
        style={{ color }}
        accessibilityRole="text"
      >
        {headline}
      </Text>
      <Text className="text-xs mt-0.5" style={{ color: muted }}>
        {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_PLANNED_OF, {
          planned: formatTaka(planned),
          budget: formatTaka(budget),
        })}
        {estimate ? ` · ${t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_ESTIMATE)}` : ''}
        {updating ? ` · ${t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_UPDATING)}` : ''}
      </Text>
      <View
        className="mt-2 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: track }}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: Math.max(budget, planned, 1),
          now: planned,
          text: headline,
        }}
      >
        <View
          style={{
            width: `${state.tone === 'over' ? 100 : fill}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 999,
          }}
        />
      </View>
      {state.tone === 'over' ? (
        <Text className="text-xs font-semibold mt-1" style={{ color }}>
          {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_OVER_LABEL)}
        </Text>
      ) : null}
    </View>
  );
}
