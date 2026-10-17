import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { formatTaka } from '../../utils/tripPlanItinerary';
import { StopCard, StopCardPlace } from './StopCard';

export interface DaySheetStop {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  places: StopCardPlace[];
  transport?: string;
  activityCost: number;
  stayCost: number;
  stayDetail?: string;
  total: number;
}

interface DayDetailsSheetProps {
  visible: boolean;
  title: string;
  stopCount: number;
  dayTotal: number;
  budget: number;
  guideAmount: number;
  stops: DaySheetStop[];
  emptyLabel: string;
  onClose: () => void;
  onEdit?: () => void;
}

export function DayDetailsSheet({
  visible,
  title,
  stopCount,
  dayTotal,
  budget,
  guideAmount,
  stops,
  emptyLabel,
  onClose,
  onEdit,
}: DayDetailsSheetProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const share = budget > 0 ? Math.round((dayTotal / budget) * 100) : 0;
  const aboveGuide = guideAmount > 0 && dayTotal > guideAmount;
  const activityTotal = stops.reduce((sum, stop) => sum + (stop.activityCost || 0), 0);
  const stayTotal = stops.reduce((sum, stop) => sum + (stop.stayCost || 0), 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.COMMON.CLOSE)}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
        />
        <View className="rounded-t-3xl pt-3" style={{ backgroundColor: surface, height: '92%' }}>
          <View className="flex-row items-center px-4 pb-3 border-b border-border dark:border-border-dark">
            <Text className="flex-1 text-base font-semibold text-text dark:text-text-dark pr-3">
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.COMMON.CLOSE)}
              className="w-11 h-11 items-center justify-center"
            >
              <Ionicons name="close" size={22} color={muted} />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
            <Text className="text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_STOP_COUNT, { count: stopCount })}
              {budget > 0 ? ` · ${t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_SHARE, { percent: share })}` : ''}
            </Text>
            <View className="mt-3">
              <CostRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_ACTIVITY)} amount={formatTaka(activityTotal)} />
              <CostRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STAY)} amount={formatTaka(stayTotal)} />
              <CostRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_TOTAL)} amount={formatTaka(dayTotal)} strong />
            </View>
            {aboveGuide ? (
              <Text className="text-xs text-muted dark:text-muted-dark mt-1">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_ABOVE_DAY_GUIDE, { amount: formatTaka(guideAmount) })}
              </Text>
            ) : null}
            <View className="mt-4">
              {stops.length === 0 ? (
                <Text className="text-sm text-muted dark:text-muted-dark">
                  {emptyLabel}
                </Text>
              ) : (
                stops.map((stop, index) => (
                  <StopCard
                    key={stop.id}
                    badge={String(index + 1)}
                    title={stop.title}
                    description={stop.description}
                    notes={stop.notes}
                    showNotes
                    places={stop.places}
                    transport={stop.transport}
                  >
                    <View className="mt-3">
                      <CostRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_ACTIVITY)} amount={formatTaka(stop.activityCost || 0)} />
                      <CostRow
                        label={
                          stop.stayDetail
                            ? `${t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STAY)} · ${stop.stayDetail}`
                            : t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STAY)
                        }
                        amount={formatTaka(stop.stayCost || 0)}
                      />
                      <CostRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STOP_TOTAL)} amount={formatTaka(stop.total)} strong />
                    </View>
                  </StopCard>
                ))
              )}
            </View>
          </ScrollView>
          <View className="px-4 pt-3 pb-8 border-t border-border dark:border-border-dark">
            <View className="flex-row justify-between mb-3">
              <Text className="text-sm font-semibold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_TOTAL)}
              </Text>
              <Text className="text-base font-bold text-text dark:text-text-dark">
                {formatTaka(dayTotal)}
              </Text>
            </View>
            {onEdit ? (
              <TouchableOpacity onPress={onEdit} className="bg-primary rounded-xl py-3.5 items-center" style={{ minHeight: 44 }}>
                <Text className="text-base font-semibold text-white">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_EDIT)}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CostRow({ label, amount, strong }: { label: string; amount: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text
        className={`flex-1 pr-3 ${strong ? 'text-sm font-semibold text-text dark:text-text-dark' : 'text-sm text-muted dark:text-muted-dark'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text className={`text-sm ${strong ? 'font-bold text-text dark:text-text-dark' : 'font-semibold text-text dark:text-text-dark'}`}>
        {amount}
      </Text>
    </View>
  );
}
