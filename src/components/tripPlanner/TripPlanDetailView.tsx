/**
 * Scrolling personal trip detail, adapted from the web TourPackagePostView.
 */

import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { TripPlan } from '../../types/trips';
import {
  formatDisplayDate,
  formatEnumLabel,
  formatTaka,
} from '../../utils/tripPlanItinerary';

const LIGHT_BLUE = '#7EC8F8';

interface TripPlanDetailViewProps {
  trip: TripPlan;
  onEdit: () => void;
  onBack: () => void;
}

export function TripPlanDetailView({ trip, onEdit, onBack }: TripPlanDetailViewProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const itineraryOffset = useRef(0);
  const dayLocalOffsets = useRef<Record<number, number>>({});
  const dayOffsets = useRef<Record<number, number>>({});
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const days = new Map<number, typeof trip.userSegments>();
  for (const segment of [...(trip.userSegments || [])].sort(
    (a, b) => a.dayNumber - b.dayNumber || a.segmentOrder - b.segmentOrder
  )) {
    const list = days.get(segment.dayNumber) || [];
    list.push(segment);
    days.set(segment.dayNumber, list);
  }
  const dayEntries = [...days.entries()];
  const stopCount = trip.userSegments?.length || 0;
  const cover = trip.images?.[0]?.url;
  const budget = trip.estimatedBudget || 0;
  const duration = trip.duration || dayEntries.length;
  const perDay = duration && budget ? Math.round(budget / duration) : null;
  const iconColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const selectedDay = activeDay ?? dayEntries[0]?.[0] ?? null;

  const scrollToDay = (dayNumber: number) => {
    setActiveDay(dayNumber);
    const y = dayOffsets.current[dayNumber];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  };

  const publishDayOffsets = () => {
    for (const [day, localY] of Object.entries(dayLocalOffsets.current)) {
      dayOffsets.current[Number(day)] = itineraryOffset.current + localY;
    }
  };

  return (
    <View className="flex-1">
      {dayEntries.length > 0 ? (
        <View className="border-b border-border dark:border-border-dark bg-background dark:bg-background-dark px-3 py-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center gap-2">
              {dayEntries.map(([dayNumber, segments]) => {
                const selected = dayNumber === selectedDay;
                return (
                  <TouchableOpacity
                    key={dayNumber}
                    onPress={() => scrollToDay(dayNumber)}
                    className={`min-w-[84px] items-center rounded-2xl border px-4 py-2.5 ${
                      selected
                        ? 'border-transparent'
                        : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'
                    }`}
                    style={selected ? { backgroundColor: LIGHT_BLUE } : theme.elevation.sm}
                  >
                    <Text
                      className={`text-base font-bold ${
                        selected ? 'text-white' : 'text-text dark:text-text-dark'
                      }`}
                    >
                      {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: dayNumber })}
                    </Text>
                    <Text
                      className={`text-xs mt-0.5 ${
                        selected ? 'text-white' : 'text-text dark:text-text-dark'
                      }`}
                    >
                      {segments.length} {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_STOPS).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        scrollEventThrottle={32}
        onScroll={(event) => {
          const y = event.nativeEvent.contentOffset.y + 48;
          let current = dayEntries[0]?.[0] ?? null;
          for (const [dayNumber, offset] of Object.entries(dayOffsets.current)) {
            if (offset <= y) current = Number(dayNumber);
          }
          if (current != null && current !== activeDay) setActiveDay(current);
        }}
      >
        <View>
          <View className="h-64 bg-surface dark:bg-surface-dark justify-end">
            {cover ? <Image source={{ uri: cover }} className="absolute inset-0 w-full h-64" resizeMode="cover" /> : null}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.82)']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 }}
            />
            <View className="px-4 pb-5">
              {trip.primaryLocation?.name ? (
                <View className="flex-row items-center">
                  <Feather name="map-pin" size={14} color="#FFFFFF" />
                  <Text className="text-white/90 text-sm font-semibold uppercase ml-1.5">
                    {trip.primaryLocation.name}
                  </Text>
                </View>
              ) : null}
              <Text className="text-white text-3xl font-bold mt-1.5 leading-9">{trip.name}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 px-4 pt-4">
            {trip.tourType ? (
              <View className="rounded-full border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-2">
                <Text className="text-sm font-semibold text-text dark:text-text-dark">{formatEnumLabel(trip.tourType)}</Text>
              </View>
            ) : null}
            <View className="rounded-full border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-2">
              <Text className="text-sm font-semibold text-text dark:text-text-dark">
                {duration} {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DAYS)}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap px-4 mt-3 gap-2">
            <Highlight label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_DURATION)} value={`${duration}`} />
            <Highlight label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_STOPS)} value={`${stopCount}`} />
            <Highlight label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_TRAVELLERS)} value={`${trip.participantCount}`} />
            <Highlight label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_BUDGET)} value={formatTaka(budget)} />
          </View>

          {trip.shortDescription || trip.description ? (
            <View className="px-4 mt-6">
              <Text className="text-xl font-bold text-text dark:text-text-dark mb-3">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_ABOUT)}
              </Text>
              <View
                className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4"
                style={theme.elevation.sm}
              >
                <Text className="text-base leading-7 text-text dark:text-text-dark">
                  {trip.shortDescription || trip.description}
                </Text>
              </View>
            </View>
          ) : null}

          <View
            className="px-4 mt-6"
            onLayout={(event) => {
              itineraryOffset.current = event.nativeEvent.layout.y;
              publishDayOffsets();
            }}
          >
            <Text className="text-xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_ITINERARY)}
            </Text>
            <Text className="text-sm text-muted dark:text-muted-dark mt-1 mb-4">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_ITINERARY_HINT, {
                days: dayEntries.length,
                stops: stopCount,
              })}
            </Text>
            {dayEntries.length === 0 ? (
              <Text className="text-base text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_NO_STOPS)}
              </Text>
            ) : (
              dayEntries.map(([dayNumber, segments]) => {
                return (
                  <View
                    key={dayNumber}
                    className="mb-5"
                    onLayout={(event) => {
                      dayLocalOffsets.current[dayNumber] = event.nativeEvent.layout.y;
                      publishDayOffsets();
                    }}
                  >
                    <Text className="text-lg font-bold text-text dark:text-text-dark mb-3">
                      {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: dayNumber })}
                    </Text>
                    {segments.map((segment, index) => {
                      const isLast = index === segments.length - 1;
                      return (
                        <View key={segment.id} className="flex-row">
                          <View className="items-center mr-3 w-9">
                            <View className="w-8 h-8 rounded-full bg-text dark:bg-text-dark items-center justify-center">
                              <Text className="text-background dark:text-background-dark text-sm font-bold">
                                {segment.segmentOrder || index + 1}
                              </Text>
                            </View>
                            {isLast ? null : <View className="w-0.5 flex-1 bg-border dark:bg-border-dark my-1" />}
                          </View>
                          <View
                            className="flex-1 rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 mb-4"
                            style={theme.elevation.sm}
                          >
                            <Text className="self-start text-xs font-semibold text-text dark:text-text-dark bg-background dark:bg-background-dark px-2.5 py-1 rounded-full">
                              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_LABEL, {
                                order: segment.segmentOrder || index + 1,
                              })}
                            </Text>
                            <Text className="text-sm leading-5 text-text dark:text-text-dark mt-2">
                              {segment.shortDescription ||
                                segment.customNotes ||
                                t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_NO_DESC)}
                            </Text>
                            <Fact
                              icon="map-pin"
                              label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TOUR_SPOT)}
                              text={segment.tourSpotName}
                              iconColor={iconColor}
                              mutedColor={mutedColor}
                            />
                            <Fact
                              icon="flag"
                              label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ACTIVITY)}
                              text={segment.activitySpotName || segment.customActivitySpotName}
                              iconColor={iconColor}
                              mutedColor={mutedColor}
                            />
                            <Fact
                              icon="truck"
                              label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TRANSPORT)}
                              text={formatEnumLabel(segment.customTransport)}
                              iconColor={iconColor}
                              mutedColor={mutedColor}
                            />
                            {isLast ? (
                              <Fact
                                icon="home"
                                label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HOTEL)}
                                text={segment.hotelName || formatEnumLabel(segment.customHotel)}
                                iconColor={iconColor}
                                mutedColor={mutedColor}
                              />
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}
          </View>

          <View
            className="mx-4 mt-2 rounded-2xl border border-border dark:border-border-dark p-4 bg-surface dark:bg-surface-dark"
            style={theme.elevation.sm}
          >
            <Text className="text-xs uppercase tracking-wide text-muted dark:text-muted-dark font-semibold">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_GLANCE)}
            </Text>
            <Text className="text-2xl font-bold text-text dark:text-text-dark mt-1">{formatTaka(budget)}</Text>
            {perDay ? (
              <Text className="text-sm text-muted dark:text-muted-dark mb-2">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_PER_DAY, { amount: formatTaka(perDay) })}
              </Text>
            ) : null}
            <FactRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_LOCATION)} value={trip.primaryLocation?.name} />
            <FactRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_TYPE)} value={formatEnumLabel(trip.tourType)} />
            <FactRow
              label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_WINDOW)}
              value={`${formatDisplayDate(trip.startDate)} → ${formatDisplayDate(trip.endDate)}`}
            />
            {trip.basedOnPackageName ? (
              <FactRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_BASED_ON)} value={trip.basedOnPackageName} />
            ) : null}
            <TouchableOpacity onPress={onEdit} className="bg-primary rounded-xl py-3.5 items-center mt-4">
              <Text className="text-onPrimary text-base font-semibold">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_EDIT)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onBack} className="py-3 items-center">
              <Text className="text-base text-text dark:text-text-dark font-semibold">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_BACK)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-[47%] rounded-xl border border-border dark:border-border-dark px-3 py-2 bg-surface dark:bg-surface-dark">
      <Text className="text-[11px] uppercase tracking-wide text-muted dark:text-muted-dark font-semibold">{label}</Text>
      <Text className="text-base font-bold text-text dark:text-text-dark mt-0.5">{value}</Text>
    </View>
  );
}

function Fact({
  icon,
  label,
  text,
  iconColor,
  mutedColor,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  text?: string;
  iconColor: string;
  mutedColor: string;
}) {
  if (!text) return null;
  return (
    <View className="flex-row items-start mt-3">
      <View className="w-8 h-8 rounded-full bg-background dark:bg-background-dark items-center justify-center">
        <Feather name={icon} size={15} color={iconColor} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: mutedColor }}>
          {label}
        </Text>
        <Text className="text-sm text-text dark:text-text-dark mt-0.5">{text}</Text>
      </View>
    </View>
  );
}

function FactRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between items-start py-3 border-b border-border dark:border-border-dark">
      <Text className="text-base text-muted dark:text-muted-dark">{label}</Text>
      <Text className="text-base font-semibold text-text dark:text-text-dark flex-1 text-right ml-3">{value}</Text>
    </View>
  );
}
