/**
 * Scrolling personal trip detail, adapted from the web TourPackagePostView.
 */

import React, { useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { TripPlan } from '../../types/trips';
import {
  formatDisplayDate,
  formatEnumLabel,
  formatTaka,
} from '../../utils/tripPlanItinerary';

interface TripPlanDetailViewProps {
  trip: TripPlan;
  onEdit: () => void;
  onBack: () => void;
}

export function TripPlanDetailView({ trip, onEdit, onBack }: TripPlanDetailViewProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const dayOffsets = useRef<Record<number, number>>({});

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
  const perDay = trip.duration && budget ? Math.round(budget / trip.duration) : null;

  const scrollToDay = (dayNumber: number) => {
    const y = dayOffsets.current[dayNumber];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  };

  return (
    <View className="flex-1">
      {dayEntries.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-12 border-b border-border dark:border-border-dark">
          <View className="flex-row items-center px-4 gap-2">
            {dayEntries.map(([dayNumber]) => (
              <TouchableOpacity key={dayNumber} onPress={() => scrollToDay(dayNumber)} className="px-3 py-2">
                <Text className="text-xs font-semibold text-primary">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: dayNumber })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : null}
      <ScrollView ref={scrollRef} className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="h-56 bg-surface dark:bg-surface-dark justify-end">
          {cover ? <Image source={{ uri: cover }} className="absolute inset-0 w-full h-56" /> : null}
          <View className="p-4 bg-black/45">
            <Text className="text-white text-xs font-semibold uppercase">
              {trip.primaryLocation?.name}
            </Text>
            <Text className="text-white text-2xl font-bold mt-1">{trip.name}</Text>
            <View className="flex-row flex-wrap gap-2 mt-2">
              {trip.tourType ? (
                <Text className="text-white text-xs bg-primary px-2 py-1 rounded-full">
                  {formatEnumLabel(trip.tourType)}
                </Text>
              ) : null}
              <Text className="text-white text-xs bg-white/20 px-2 py-1 rounded-full">
                {trip.duration || dayEntries.length} {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DAYS)}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap px-4 mt-4 gap-3">
          <Highlight
            label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_DURATION)}
            value={`${trip.duration || dayEntries.length}`}
          />
          <Highlight label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_STOPS)} value={`${stopCount}`} />
          <Highlight
            label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_TRAVELLERS)}
            value={`${trip.participantCount}`}
          />
          <Highlight label={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_BUDGET)} value={formatTaka(budget)} />
        </View>

        {trip.shortDescription || trip.description ? (
          <View className="px-4 mt-6">
            <Text className="text-lg font-semibold text-text dark:text-text-dark mb-2">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_ABOUT)}
            </Text>
            <Text className="text-text dark:text-text-dark leading-6">
              {trip.shortDescription || trip.description}
            </Text>
          </View>
        ) : null}

        <View className="px-4 mt-6">
          <Text className="text-lg font-semibold text-text dark:text-text-dark mb-1">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_ITINERARY)}
          </Text>
          <Text className="text-xs text-muted mb-3">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_ITINERARY_HINT, {
              days: dayEntries.length,
              stops: stopCount,
            })}
          </Text>
          {dayEntries.length === 0 ? (
            <Text className="text-muted">{t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_NO_STOPS)}</Text>
          ) : (
            dayEntries.map(([dayNumber, segments]) => (
              <View
                key={dayNumber}
                onLayout={(event) => {
                  dayOffsets.current[dayNumber] = event.nativeEvent.layout.y + 280;
                }}
                className="mb-5"
              >
                <Text className="font-bold text-text dark:text-text-dark mb-2">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: dayNumber })}
                </Text>
                {segments.map((segment, index) => {
                  const isLast = index === segments.length - 1;
                  return (
                    <View key={segment.id} className="flex-row mb-3">
                      <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
                        <Text className="text-onPrimary text-xs font-bold">{segment.segmentOrder || index + 1}</Text>
                      </View>
                      <View className="flex-1 rounded-xl p-3 bg-surface dark:bg-surface-dark">
                        <Text className="text-xs text-primary font-semibold">
                          {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_LABEL, {
                            order: segment.segmentOrder || index + 1,
                          })}
                        </Text>
                        <Text className="text-sm text-text dark:text-text-dark mt-2">
                          {segment.shortDescription || segment.customNotes || t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_NO_DESC)}
                        </Text>
                        <Fact icon="map-pin" text={segment.tourSpotName} />
                        <Fact icon="flag" text={segment.activitySpotName || segment.customActivitySpotName} />
                        <Fact icon="truck" text={formatEnumLabel(segment.customTransport)} />
                        {isLast ? (
                          <Fact
                            icon="home"
                            text={segment.hotelName || formatEnumLabel(segment.customHotel)}
                          />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>

        <View className="mx-4 mt-2 rounded-2xl p-4 bg-surface dark:bg-surface-dark">
          <Text className="text-xs uppercase text-muted font-semibold">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_GLANCE)}
          </Text>
          <Text className="text-2xl font-bold text-primary mt-1">{formatTaka(budget)}</Text>
          {perDay ? (
            <Text className="text-xs text-muted mb-2">
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
          <TouchableOpacity onPress={onEdit} className="bg-primary rounded-lg py-3 items-center mt-4">
            <Text className="text-onPrimary font-semibold">{t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_EDIT)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack} className="py-3 items-center">
            <Text className="text-text dark:text-text-dark font-semibold">{t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_BACK)}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-[47%] rounded-2xl p-3 bg-surface dark:bg-surface-dark">
      <Text className="text-[11px] uppercase text-muted font-semibold">{label}</Text>
      <Text className="text-lg font-bold text-text dark:text-text-dark mt-1">{value}</Text>
    </View>
  );
}

function Fact({ icon, text }: { icon: React.ComponentProps<typeof Feather>['name']; text?: string }) {
  if (!text) return null;
  return (
    <View className="flex-row items-center mt-2">
      <Feather name={icon} size={12} color="#64748B" />
      <Text className="text-xs text-muted ml-2 flex-1">{text}</Text>
    </View>
  );
}

function FactRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between py-2 border-b border-border dark:border-border-dark">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm font-semibold text-text dark:text-text-dark flex-1 text-right ml-3">{value}</Text>
    </View>
  );
}
