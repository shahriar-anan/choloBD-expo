import React, { useEffect, useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

interface DayChipsProps {
  count: number;
  selected: number;
  emptyDays?: number[];
  onSelect: (day: number) => void;
  /** Scroll this day into view once, and only when the chip is off-screen. */
  ensureDay?: number | null;
  onEnsureDone?: () => void;
}

export function DayChips({ count, selected, emptyDays = [], onSelect, ensureDay, onEnsureDone }: DayChipsProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const listRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<number, number>>({});
  const widths = useRef<Record<number, number>>({});
  const scrollX = useRef(0);
  const viewWidth = useRef(0);
  const empty = new Set(emptyDays);
  const ensureDoneRef = useRef(onEnsureDone);
  ensureDoneRef.current = onEnsureDone;

  const scrollIfNeeded = (day: number) => {
    const x = offsets.current[day];
    const width = widths.current[day];
    if (x == null || width == null || viewWidth.current <= 0) return false;
    const left = scrollX.current;
    const right = left + viewWidth.current;
    if (x < left + 4 || x + width > right - 4) {
      listRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
    }
    return true;
  };

  useEffect(() => {
    if (ensureDay == null) return;
    if (scrollIfNeeded(ensureDay)) ensureDoneRef.current?.();
  }, [ensureDay, count]);

  if (count <= 0) return null;

  return (
    <ScrollView
      ref={listRef}
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      onLayout={(event) => {
        viewWidth.current = event.nativeEvent.layout.width;
      }}
      onScroll={(event) => {
        scrollX.current = event.nativeEvent.contentOffset.x;
      }}
      scrollEventThrottle={16}
    >
      <View className="flex-row gap-2">
        {Array.from({ length: count }, (_, index) => index + 1).map((day) => {
          const isSelected = day === selected;
          const isEmpty = empty.has(day);
          return (
            <TouchableOpacity
              key={day}
              onPress={() => onSelect(day)}
              onLayout={(event) => {
                offsets.current[day] = event.nativeEvent.layout.x;
                widths.current[day] = event.nativeEvent.layout.width;
                if (ensureDay === day && scrollIfNeeded(day)) ensureDoneRef.current?.();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day })}
              className={`rounded-full border px-3.5 py-2 items-center justify-center flex-row ${
                isSelected ? 'bg-primary border-primary' : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'
              }`}
              style={{ minHeight: 40 }}
            >
              <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day })}
              </Text>
              {isEmpty ? (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    marginLeft: 6,
                    backgroundColor: isSelected ? '#FFFFFF' : primary,
                  }}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
