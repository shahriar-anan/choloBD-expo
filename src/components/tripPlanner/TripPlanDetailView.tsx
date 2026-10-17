/**
 * Scrolling personal trip detail, adapted from the web TourPackagePostView.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, Pressable, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHotelSearch } from '../../context/HotelSearchContext';
import { Toast } from '../ui/Toast';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { TripPlan, UserSegment } from '../../types/trips';
import {
  formatDisplayDate,
  formatEnumLabel,
  formatTaka,
  formatTripDayHeading,
} from '../../utils/tripPlanItinerary';
import {
  biggestCategoryShare,
  categoryTotals,
  dailyAllowance,
  groupStopCostsByDay,
  stopTotal,
} from '../../utils/tripBudget';
import {
  BudgetMeter,
  CostBreakdownSheet,
  PriceChangedNotice,
} from './budget';
import { DayChips } from './DayChips';
import { DayDetailsSheet, DaySheetStop } from './DayDetailsSheet';
import { StopCard, StopCardPlace } from './StopCard';

interface TripPlanDetailViewProps {
  trip: TripPlan;
  onEdit: () => void;
  onBack: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
  savedNotice?: boolean;
  onDismissSaved?: () => void;
  onEditDay?: (day: number) => void;
}

export function TripPlanDetailView({
  trip,
  onEdit,
  onBack,
  onDelete,
  onRefresh,
  refreshing,
  savedNotice,
  onDismissSaved,
  onEditDay,
}: TripPlanDetailViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { applyCatalogStay } = useHotelSearch();
  const { isDark } = useTheme();
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [ensureDay, setEnsureDay] = useState<number | null>(null);

  const days = new Map<number, UserSegment[]>();
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
  const budget = trip.budgetSummary?.budget ?? trip.estimatedBudget ?? 0;
  const duration = trip.duration || dayEntries.length;
  const planned =
    trip.budgetSummary?.plannedTotal ??
    (trip.userSegments || []).reduce((sum, segment) => sum + (Number(segment.estimatedCost) || 0), 0);
  const livePlanned = trip.budgetSummary?.livePlannedTotal ?? planned;
  const categories = trip.budgetSummary?.byCategory ?? categoryTotals(trip.userSegments || []);
  const byDay = trip.budgetSummary?.byDay ?? groupStopCostsByDay(trip.userSegments || []);
  const perDayPlanned = duration && planned ? Math.round(planned / duration) : null;
  const biggest = biggestCategoryShare(categories.stays, categories.activities);
  const priceChanged = trip.budgetSummary?.priceChanged ?? Math.abs(livePlanned - planned) > 0.5;
  const iconColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const dayCount = Math.max(duration || 0, ...dayEntries.map(([dayNumber]) => dayNumber), 0);
  const selectedDay = activeDay ?? (dayCount > 0 ? 1 : null);
  const selectedSegments = selectedDay != null ? days.get(selectedDay) ?? [] : [];
  const selectedCost = selectedDay == null
    ? 0
    : byDay.find((row) => row.dayNumber === selectedDay)?.total
      ?? selectedSegments.reduce((sum, segment) => sum + stopTotal(segment), 0);
  const guideAmount = dailyAllowance(budget, dayCount || duration);
  const emptyDays = Array.from({ length: dayCount }, (_, index) => index + 1).filter(
    (dayNumber) => (days.get(dayNumber) || []).length === 0
  );

  const segmentPlaces = (segment: UserSegment, isLast: boolean): StopCardPlace[] => {
    const places: StopCardPlace[] = [];
    if (segment.tourSpotName) {
      places.push({
        key: 'spot',
        label: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TOUR_SPOT),
        name: segment.tourSpotName,
        imageUrl: segment.tourSpotImageUrl,
        onPress: segment.customTourSpotId
          ? () => router.push({ pathname: '/(tabs)/explore/tour-spots-detail', params: { id: segment.customTourSpotId! } })
          : undefined,
      });
    }
    const activityName = segment.activitySpotName || segment.customActivitySpotName;
    if (activityName) {
      places.push({
        key: 'activity',
        label: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ACTIVITY),
        name: activityName,
        imageUrl: segment.activitySpotImageUrl,
        onPress: segment.customActivitySpotId
          ? () => router.push({ pathname: '/(tabs)/explore/activity-preview', params: { id: segment.customActivitySpotId! } })
          : undefined,
      });
    }
    const hotelName = segment.hotelName || formatEnumLabel(segment.customHotel);
    if (isLast && hotelName) {
      places.push({
        key: 'hotel',
        label: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HOTEL),
        name: hotelName,
        imageUrl: segment.hotelImageUrl,
        onPress: segment.hotelId
          ? () => {
              applyCatalogStay();
              router.push({ pathname: '/(tabs)/explore/hotel-stay', params: { hotelId: segment.hotelId! } });
            }
          : undefined,
      });
    }
    return places;
  };

  const sheetStops: DaySheetStop[] = selectedSegments.map((segment, index) => {
    const isLast = index === selectedSegments.length - 1;
    return {
      id: segment.id,
      title: segment.tourSpotName || segment.shortDescription || t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_NO_DESC),
      description:
        segment.shortDescription && segment.shortDescription !== segment.tourSpotName
          ? segment.shortDescription
          : undefined,
      notes: segment.customNotes,
      places: segmentPlaces(segment, isLast),
      transport: segment.customTransport
        ? t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_TRANSPORT_NOT_PRICED, { type: formatEnumLabel(segment.customTransport) })
        : undefined,
      activityCost: segment.activityCost || 0,
      stayCost: isLast ? segment.hotelCost || 0 : 0,
      stayDetail: isLast && segment.hotelRoomType ? formatEnumLabel(segment.hotelRoomType) : undefined,
      total: stopTotal(segment),
    };
  });

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            progressViewOffset={Platform.OS === 'android' ? 24 : 0}
            tintColor="#FFFFFF"
            colors={[iconColor]}
          />
        }
      >
        <View>
          <View className="h-64 bg-surface dark:bg-surface-dark justify-end">
            {cover ? <Image source={{ uri: cover }} className="absolute inset-0 w-full h-64" resizeMode="cover" /> : null}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.82)']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 }}
            />
            <TouchableOpacity
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_BACK)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.COMMON.VIEW_DETAILS)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="px-4 pb-5">
              {trip.primaryLocation?.name ? (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                  <Text className="text-white/90 text-sm font-semibold uppercase ml-1.5">
                    {trip.primaryLocation.name}
                  </Text>
                </View>
              ) : null}
              <Text className="text-white font-bold mt-1.5" style={{ fontSize: theme.typography.trip.pageTitle, lineHeight: 34 }}>{trip.name}</Text>
              <Text className="text-white/90 text-sm mt-1">
                {formatDisplayDate(trip.startDate)} → {formatDisplayDate(trip.endDate)}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 px-4 pt-4">
            {trip.tourType ? (
              <View className="rounded-full border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-2" style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text className="font-semibold text-text dark:text-text-dark" style={{ fontSize: theme.typography.trip.meta }}>{formatEnumLabel(trip.tourType)}</Text>
              </View>
            ) : null}
            <View className="rounded-full border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-2" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text className="font-semibold text-text dark:text-text-dark" style={{ fontSize: theme.typography.trip.meta }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_COUNT, { count: duration })}
              </Text>
            </View>
            <View className="rounded-full border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-2" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text className="font-semibold text-text dark:text-text-dark" style={{ fontSize: theme.typography.trip.meta }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_STOP_COUNT, { count: stopCount })}
              </Text>
            </View>
            <View className="rounded-full bg-primary px-4 py-2" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text className="font-semibold text-white" style={{ fontSize: theme.typography.trip.meta }}>{formatEnumLabel(trip.status)}</Text>
            </View>
          </View>
          {trip.basedOnPackageName ? (
            <Text className="px-4 mt-3 text-muted dark:text-muted-dark" style={{ fontSize: theme.typography.trip.meta }}>
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_BASED_ON)}: {trip.basedOnPackageName}
            </Text>
          ) : null}

          {budget > 0 || planned > 0 ? (
            <View
              className="mx-4 mt-4 rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4"
              style={theme.elevation.sm}
            >
              <BudgetMeter planned={planned} budget={budget} />
              <Text className="text-muted dark:text-muted-dark mt-2" style={{ fontSize: theme.typography.trip.caption }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_PRICES_FOR_ONE)}
              </Text>
              {priceChanged && livePlanned !== planned ? (
                <PriceChangedNotice liveTotal={livePlanned} savedTotal={planned} onUpdate={onEdit} />
              ) : null}
              <View className={`${perDayPlanned && biggest.label !== 'none' ? 'flex-row' : ''} gap-2 mt-3`}>
                {perDayPlanned ? (
                  <View className="flex-1 rounded-xl bg-background dark:bg-background-dark px-3 py-2.5">
                    <Text className="text-xs font-semibold text-text dark:text-text-dark">
                      {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_PER_DAY_PLANNED, {
                        amount: formatTaka(perDayPlanned),
                      })}
                    </Text>
                  </View>
                ) : null}
                {biggest.label !== 'none' ? (
                  <View className="flex-1 rounded-xl bg-background dark:bg-background-dark px-3 py-2.5">
                    <Text className="text-xs font-semibold text-text dark:text-text-dark">
                      {t(
                        biggest.label === 'stays'
                          ? TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_BIGGEST_STAYS
                          : TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_BIGGEST_ACTIVITIES,
                        { percent: biggest.percent }
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => setBreakdownOpen(true)}
                accessibilityRole="button"
                className="mt-3 py-2.5 rounded-xl items-center border border-border dark:border-border-dark"
              >
                <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_VIEW)}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View className="px-4 mt-6">
            <Text className="font-bold text-text dark:text-text-dark" style={{ fontSize: theme.typography.trip.sectionTitle }}>
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_ITINERARY)}
            </Text>
            <Text className="text-muted dark:text-muted-dark mt-1 mb-4" style={{ fontSize: theme.typography.trip.meta }}>
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_COUNT, { count: dayCount })}
              {' · '}
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_STOP_COUNT, { count: stopCount })}
            </Text>

            {dayCount === 0 ? (
              <Text className="text-base text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_NO_STOPS)}
              </Text>
            ) : (
              <>
                <View className="mb-3">
                  <DayChips
                    count={dayCount}
                    selected={selectedDay || 1}
                    emptyDays={emptyDays}
                    onSelect={setActiveDay}
                    ensureDay={ensureDay}
                    onEnsureDone={() => setEnsureDay(null)}
                  />
                </View>
                {selectedDay != null ? (
                  <View className="mb-5">
                    {selectedSegments.length === 0 ? (
                      <Text className="text-muted dark:text-muted-dark" style={{ fontSize: theme.typography.trip.body }}>
                        {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_EMPTY_DAY)}
                      </Text>
                    ) : null}
                    {selectedSegments.map((segment, index) => {
                      const isLast = index === selectedSegments.length - 1;
                      const title = segment.tourSpotName || segment.shortDescription || t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_NO_DESC);
                      return (
                        <StopCard
                          key={segment.id}
                          title={title}
                          description={
                            segment.shortDescription && segment.shortDescription !== segment.tourSpotName
                              ? segment.shortDescription
                              : undefined
                          }
                          places={segmentPlaces(segment, isLast)}
                          transport={
                            segment.customTransport
                              ? t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_TRANSPORT_NOT_PRICED, {
                                  type: formatEnumLabel(segment.customTransport),
                                })
                              : undefined
                          }
                          totalLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STOP_TOTAL) + '  ' + formatTaka(stopTotal(segment))}
                          onDetails={() => setDetailsOpen(true)}
                          detailsLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_DETAILS)}
                        />
                      );
                    })}
                  </View>
                ) : null}
              </>
            )}
          </View>

        </View>
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.COMMON.CLOSE)}
            onPress={() => setMenuOpen(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          <View className="rounded-t-3xl px-5 pt-3 pb-8" style={{ backgroundColor: surfaceColor }}>
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                onEdit();
              }}
              className="py-4"
              style={{ minHeight: 44 }}
            >
              <Text className="font-semibold text-text dark:text-text-dark" style={{ fontSize: theme.typography.trip.body }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_EDIT_TRIP)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="py-4"
              style={{ minHeight: 44 }}
            >
              <Text className="font-semibold" style={{ color: isDark ? theme.colors['error-dark'] : theme.colors.error, fontSize: theme.typography.trip.body }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_DELETE_TRIP)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuOpen(false)} className="py-4" style={{ minHeight: 44 }}>
              <Text className="font-semibold text-muted dark:text-muted-dark" style={{ fontSize: theme.typography.trip.body }}>
                {t(TRANSLATION_KEYS.COMMON.CANCEL)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CostBreakdownSheet
        visible={breakdownOpen}
        summary={{
          planned,
          budget,
          stays: categories.stays,
          activities: categories.activities,
          days: duration || dayEntries.length || 1,
          byDay,
          stops: trip.userSegments || [],
        }}
        onClose={() => setBreakdownOpen(false)}
        onSelectDay={(dayNumber) => {
          setActiveDay(dayNumber);
          setEnsureDay(dayNumber);
          setBreakdownOpen(false);
        }}
      />
      <DayDetailsSheet
        visible={detailsOpen && selectedDay != null}
        title={
          selectedDay != null && formatTripDayHeading(trip.startDate, selectedDay, true)
            ? t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_SUMMARY_TITLE, {
                day: selectedDay,
                date: formatTripDayHeading(trip.startDate, selectedDay, true),
              })
            : t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: selectedDay || 1 })
        }
        stopCount={selectedSegments.length}
        dayTotal={selectedCost}
        budget={budget}
        guideAmount={guideAmount}
        stops={sheetStops}
        emptyLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_EMPTY_DAY)}
        onClose={() => setDetailsOpen(false)}
        onEdit={
          selectedDay != null
            ? () => {
                setDetailsOpen(false);
                if (onEditDay) onEditDay(selectedDay);
                else onEdit();
              }
            : undefined
        }
      />
      <Toast
        visible={Boolean(savedNotice)}
        message={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SAVED_TOAST)}
        onDismiss={() => onDismissSaved?.()}
        duration={3000}
        placement="top"
      />
    </View>
  );
}
