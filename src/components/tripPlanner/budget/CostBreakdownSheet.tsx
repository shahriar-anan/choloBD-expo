import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { dailyAllowance, stopTotal, topCostStops, CostStopLike } from '../../../utils/tripBudget';
import { formatTaka } from '../../../utils/tripPlanItinerary';
import { BudgetMeter } from './BudgetMeter';
import { CategorySplitBar } from './CategorySplitBar';

export interface BreakdownSummary {
  planned: number;
  budget: number;
  stays: number;
  activities: number;
  days: number;
  byDay: Array<{ dayNumber: number; total: number }>;
  stops: CostStopLike[];
  estimate?: boolean;
}

export function CostBreakdownSheet({
  visible,
  summary,
  onClose,
  onSelectDay,
}: {
  visible: boolean;
  summary: BreakdownSummary;
  onClose: () => void;
  onSelectDay?: (dayNumber: number) => void;
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const allowance = dailyAllowance(summary.budget, summary.days);
  const topStops = topCostStops(summary.stops, 3);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.COMMON.CLOSE)}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
        />
        <View className="rounded-t-3xl px-5 pt-5 pb-8" style={{ backgroundColor: surface, maxHeight: '88%' }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xl font-bold" style={{ color: text }}>
              {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_BREAKDOWN)}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.COMMON.CLOSE)}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={22} color={text} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <BudgetMeter planned={summary.planned} budget={summary.budget} estimate={summary.estimate} />
            <View className="mt-5">
              <Text className="text-sm font-bold mb-2" style={{ color: text }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_BY_CATEGORY)}
              </Text>
              <CategorySplitBar stays={summary.stays} activities={summary.activities} />
              <Row label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STAYS)} value={formatTaka(summary.stays)} muted={muted} text={text} border={border} />
              <Row label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_ACTIVITIES)} value={formatTaka(summary.activities)} muted={muted} text={text} border={border} />
              <Row
                label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_TRANSPORT)}
                value={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_NOT_PRICED)}
                muted={muted}
                text={text}
                border={border}
              />
            </View>
            <View className="mt-5">
              <Text className="text-sm font-bold mb-2" style={{ color: text }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_BY_DAY)}
              </Text>
              {Array.from({ length: Math.max(summary.days, summary.byDay.length, 0) }, (_, index) => {
                const dayNumber = index + 1;
                const day = summary.byDay.find((row) => row.dayNumber === dayNumber) || {
                  dayNumber,
                  total: 0,
                };
                return (
                <TouchableOpacity
                  key={day.dayNumber}
                  disabled={!onSelectDay}
                  onPress={() => {
                    onSelectDay?.(day.dayNumber);
                    onClose();
                  }}
                  className="py-2.5"
                  style={{ borderBottomWidth: 1, borderBottomColor: border }}
                >
                  <View className="flex-row justify-between">
                    <Text className="text-sm font-semibold" style={{ color: text }}>
                      {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: day.dayNumber })}
                    </Text>
                    <Text className="text-sm font-semibold" style={{ color: text }}>
                      {formatTaka(day.total)}
                    </Text>
                  </View>
                  {allowance > 0 && day.total > allowance ? (
                    <Text className="text-xs mt-1" style={{ color: muted }}>
                      {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_ABOVE_DAY_GUIDE, { amount: formatTaka(allowance) })}
                    </Text>
                  ) : null}
                </TouchableOpacity>
                );
              })}
            </View>
            {topStops.length > 0 ? (
              <View className="mt-5">
                <Text className="text-sm font-bold mb-2" style={{ color: text }}>
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_TOP_STOPS)}
                </Text>
                {topStops.map((stop, index) => (
                  <Row
                    key={stop.id || `${stop.dayNumber}-${stop.segmentOrder}`}
                    label={`${index + 1}. ${stop.tourSpotName || stop.shortDescription || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_LABEL, { order: stop.segmentOrder })}`}
                    value={formatTaka(stopTotal(stop))}
                    muted={muted}
                    text={text}
                    border={border}
                  />
                ))}
              </View>
            ) : null}
            <Text className="text-xs mt-5 leading-5" style={{ color: muted }}>
              {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_FOOTNOTE)}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Row({
  label,
  value,
  muted,
  text,
  border,
}: {
  label: string;
  value: string;
  muted: string;
  text: string;
  border: string;
}) {
  return (
    <View className="flex-row justify-between py-2.5" style={{ borderBottomWidth: 1, borderBottomColor: border }}>
      <Text className="text-sm flex-1 pr-3" style={{ color: muted }}>
        {label}
      </Text>
      <Text className="text-sm font-semibold" style={{ color: text }}>
        {value}
      </Text>
    </View>
  );
}
