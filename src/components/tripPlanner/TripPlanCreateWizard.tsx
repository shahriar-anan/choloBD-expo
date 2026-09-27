/**
 * Four-step personal trip plan create wizard (details → catalog → itinerary → review).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { LocationSelection } from './LocationSelection';
import { Location } from '../../types/locations';
import {
  WizardItineraryStop,
  TOUR_TYPE_VALUES,
  inferEndDateString,
  toPersonalPlanStartIso,
  toPersonalPlanEndIso,
  getDetailsContinueBlockReason,
  getItineraryContinueBlockReason,
  countStopsForDay,
  nextSegmentOrderForDay,
  createBlankStop,
  applyOvernightHotelToLastStop,
  wizardStopsToDaySegments,
  MAX_STOPS_PER_DAY,
  missingDurationDays,
} from '../../utils/tripPlanItinerary';
import {
  HotelTypePreference,
  TransportTypePreference,
  TourTypePreference,
  CreateTripData,
} from '../../types/trips';
import { getTourPlan, getTourPlans } from '../../services/api/tourBuilder';
import { catalogSegmentsToWizardStops } from '../../services/api/personalPlanMapping';
import { TourPackage } from '../../types/tours';
import { StopSegmentForm } from './StopSegmentForm';

const HOTEL_TYPES: HotelTypePreference[] = [
  'RESORT',
  'HOSTEL',
  'BOUTIQUE',
  'BUDGET',
  'LUXURY',
  'GUESTHOUSE',
  'APARTMENT',
];
const TRANSPORT_TYPES: TransportTypePreference[] = [
  'BUS',
  'FLIGHT',
  'TRAIN',
  'CAR_RENTAL',
  'FERRY',
  'SELF_MANAGED',
];

export interface TripPlanWizardDraft {
  packageName: string;
  shortDescription: string;
  tourType: TourTypePreference | '';
  location: Location | null;
  startDate: string;
  duration: number;
  participantCount: number;
  estimatedBudget: string;
  preferredHotelType: HotelTypePreference;
  preferredTransport: TransportTypePreference;
  basedOnPackageId: string;
  basedOnPackageName: string;
  daySegments: WizardItineraryStop[];
}

function initialDraft(): TripPlanWizardDraft {
  return {
    packageName: '',
    shortDescription: '',
    tourType: '',
    location: null,
    startDate: '',
    duration: 3,
    participantCount: 2,
    estimatedBudget: '10000',
    preferredHotelType: 'RESORT',
    preferredTransport: 'BUS',
    basedOnPackageId: '',
    basedOnPackageName: '',
    daySegments: [],
  };
}

interface TripPlanCreateWizardProps {
  onCreate: (payload: CreateTripData) => Promise<{ id: string }>;
  isSubmitting: boolean;
}

export function TripPlanCreateWizard({ onCreate, isSubmitting }: TripPlanCreateWizardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark } = useTheme();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const placeholderColor = mutedColor;

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<TripPlanWizardDraft>(initialDraft);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogList, setCatalogList] = useState<TourPackage[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [stopEditorVisible, setStopEditorVisible] = useState(false);
  const [editingStop, setEditingStop] = useState<WizardItineraryStop | null>(null);

  const totalSteps = 4;
  const stepTitles = [
    t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DETAILS_TITLE),
    t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_TITLE),
    t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ITINERARY_TITLE),
    t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_REVIEW_TITLE),
  ];

  useEffect(() => {
    if (step !== 1) return;
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      try {
        const list = await getTourPlans({ isActive: true });
        if (!cancelled) setCatalogList(list.slice(0, 20));
      } catch {
        if (!cancelled) setCatalogList([]);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step]);

  const patch = useCallback((partial: Partial<TripPlanWizardDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const endDateYmd = useMemo(
    () => inferEndDateString(draft.startDate, draft.duration),
    [draft.startDate, draft.duration]
  );

  const detailsBlock = getDetailsContinueBlockReason({
    packageName: draft.packageName,
    shortDescription: draft.shortDescription,
    tourType: draft.tourType,
    locationId: draft.location?.id ?? '',
    startDate: draft.startDate,
    duration: draft.duration,
    estimatedBudget: Number(draft.estimatedBudget) || 0,
    participantCount: draft.participantCount,
  });

  const itineraryBlock = getItineraryContinueBlockReason(draft.daySegments, draft.duration);

  const handleBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  };

  const applyCatalog = async (pkg: TourPackage) => {
    try {
      setCatalogLoading(true);
      const detail = await getTourPlan(pkg.id);
      const duration = detail.duration || draft.duration;
      const stops = detail.daySegments?.length
        ? catalogSegmentsToWizardStops(detail.daySegments, duration)
        : [];
      setDraft((prev) => ({
        ...prev,
        basedOnPackageId: detail.id,
        basedOnPackageName: detail.packageName,
        packageName: detail.packageName || prev.packageName,
        shortDescription: detail.shortDescription || prev.shortDescription,
        tourType: (detail.tourType as TourTypePreference) || prev.tourType,
        duration,
        daySegments: applyOvernightHotelToLastStop(stops),
        location: detail.location
          ? ({
              id: detail.location.id,
              name: detail.location.name,
              locationType: 'CITY',
              country: 'Bangladesh',
            } as Location)
          : prev.location,
      }));
    } catch (e: any) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), e?.message || 'Failed to load catalog package');
    } finally {
      setCatalogLoading(false);
    }
  };

  const clearCatalog = () => {
    setDraft(initialDraft());
    setStep(0);
  };

  const openAddStop = (dayNumber: number) => {
    if (countStopsForDay(draft.daySegments, dayNumber) >= MAX_STOPS_PER_DAY) {
      Alert.alert(
        t(TRANSLATION_KEYS.COMMON.ERROR),
        t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_LIMIT, { max: MAX_STOPS_PER_DAY })
      );
      return;
    }
    setEditingStop(
      createBlankStop(dayNumber, nextSegmentOrderForDay(draft.daySegments, dayNumber))
    );
    setStopEditorVisible(true);
  };

  const saveStop = (stop: WizardItineraryStop) => {
    setDraft((prev) => {
      const without = prev.daySegments.filter((s) => s.id !== stop.id);
      const next = applyOvernightHotelToLastStop([...without, stop]);
      return { ...prev, daySegments: next };
    });
    setStopEditorVisible(false);
    setEditingStop(null);
  };

  const removeStop = (stopId: string) => {
    setDraft((prev) => ({
      ...prev,
      daySegments: applyOvernightHotelToLastStop(prev.daySegments.filter((s) => s.id !== stopId)),
    }));
  };

  const handleSavePlan = async () => {
    if (!draft.location || !draft.tourType || !draft.startDate || !endDateYmd) return;
    const payload: CreateTripData = {
      name: draft.packageName.trim(),
      description: draft.shortDescription.trim(),
      tourType: draft.tourType,
      primaryLocationId: draft.location.id,
      startDate: toPersonalPlanStartIso(draft.startDate),
      endDate: toPersonalPlanEndIso(endDateYmd),
      estimatedBudget: Number(draft.estimatedBudget) || 0,
      participantCount: draft.participantCount,
      preferredHotelType: draft.preferredHotelType,
      preferredTransport: draft.preferredTransport,
      basedOnPackageId: draft.basedOnPackageId || undefined,
      daySegments: wizardStopsToDaySegments(draft.daySegments),
    };
    try {
      const created = await onCreate(payload);
      Alert.alert(
        t(TRANSLATION_KEYS.COMMON.SUCCESS),
        t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CREATE_SUCCESS),
        [{ text: t(TRANSLATION_KEYS.COMMON.CONFIRM), onPress: () => router.replace(`/(tabs)/trip-planner/${created.id}`) }]
      );
    } catch (e: any) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), e?.message || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CREATE_FAIL));
    }
  };

  const renderDetails = () => (
    <ScrollView className="flex-1 px-6 py-4" keyboardShouldPersistTaps="handled">
      <LocationSelection
        onLocationSelected={(loc) => patch({ location: loc })}
        selectedLocation={draft.location}
      />
      <View className="mt-4">
        <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PACKAGE_NAME)}
        </Text>
        <TextInput
          value={draft.packageName}
          onChangeText={(v) => patch({ packageName: v })}
          className="p-3 border rounded-lg border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text dark:text-text-dark"
          placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PACKAGE_NAME_PH)}
          placeholderTextColor={placeholderColor}
        />
      </View>
      <View className="mt-4">
        <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SHORT_DESC)}
        </Text>
        <TextInput
          value={draft.shortDescription}
          onChangeText={(v) => patch({ shortDescription: v })}
          multiline
          className="p-3 border rounded-lg border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text dark:text-text-dark min-h-[80px]"
          placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SHORT_DESC_PH)}
          placeholderTextColor={placeholderColor}
        />
      </View>
      <Text className="text-sm font-semibold text-text dark:text-text-dark mt-4 mb-2">
        {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TOUR_TYPE)}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {TOUR_TYPE_VALUES.map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => patch({ tourType: type })}
            className={`px-3 py-2 rounded-full mr-2 border ${
              draft.tourType === type ? 'bg-primary border-primary' : 'border-border dark:border-border-dark'
            }`}
          >
            <Text className={`text-xs font-medium ${draft.tourType === type ? 'text-white' : 'text-text dark:text-text-dark'}`}>
              {type.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="flex-row items-center p-3 border rounded-lg border-border dark:border-border-dark mb-4"
      >
        <Feather name="calendar" size={18} color={primaryColor} />
        <Text className="ml-3 text-text dark:text-text-dark">
          {draft.startDate || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_START_DATE_LABEL)}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={draft.startDate ? new Date(`${draft.startDate}T12:00:00`) : new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) {
              const ymd = date.toISOString().slice(0, 10);
              patch({ startDate: ymd });
            }
          }}
        />
      )}
      <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
        {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DURATION_DAYS)}
      </Text>
      <View className="flex-row flex-wrap mb-4">
        {[1, 2, 3, 4, 5, 7, 10, 14].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => patch({ duration: d })}
            className={`w-12 h-10 items-center justify-center rounded-lg mr-2 mb-2 border ${
              draft.duration === d ? 'bg-primary border-primary' : 'border-border dark:border-border-dark'
            }`}
          >
            <Text className={draft.duration === d ? 'text-white font-semibold' : 'text-text dark:text-text-dark'}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_BUDGET)}
          </Text>
          <TextInput
            value={draft.estimatedBudget}
            onChangeText={(v) => patch({ estimatedBudget: v })}
            keyboardType="numeric"
            className="p-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark"
            placeholderTextColor={placeholderColor}
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TRAVELERS)}
          </Text>
          <TextInput
            value={String(draft.participantCount)}
            onChangeText={(v) => patch({ participantCount: Math.max(1, parseInt(v, 10) || 1) })}
            keyboardType="number-pad"
            className="p-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark"
            placeholderTextColor={placeholderColor}
          />
        </View>
      </View>
      {detailsBlock && (
        <Text className="text-xs text-muted dark:text-muted-dark mt-4">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DETAILS_HINT)}
        </Text>
      )}
      <TouchableOpacity
        disabled={Boolean(detailsBlock) || !draft.location}
        onPress={() => setStep(1)}
        className={`mt-6 py-3 rounded-lg ${detailsBlock || !draft.location ? 'bg-muted opacity-50' : 'bg-primary'}`}
      >
        <Text className="text-center font-semibold text-white">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CONTINUE)}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCatalog = () => (
    <ScrollView className="flex-1 px-6 py-4">
      <Text className="text-sm text-muted dark:text-muted-dark mb-4">
        {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_SUBTITLE)}
      </Text>
      {draft.basedOnPackageId ? (
        <View className="p-4 mb-4 rounded-lg border border-primary bg-primary/10">
          <Text className="font-semibold text-text dark:text-text-dark">{draft.basedOnPackageName}</Text>
          <TouchableOpacity onPress={clearCatalog} className="mt-3">
            <Text className="text-sm text-primary dark:text-primary-dark font-semibold">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CLEAR_CATALOG)}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {catalogLoading ? (
        <ActivityIndicator color={primaryColor} />
      ) : (
        catalogList.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            onPress={() => applyCatalog(pkg)}
            className="p-4 mb-3 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
          >
            <Text className="font-semibold text-text dark:text-text-dark">{pkg.packageName}</Text>
            <Text className="text-xs text-muted dark:text-muted-dark mt-1">
              {pkg.duration} {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DAYS_LABEL)} · {pkg.tourType}
            </Text>
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity onPress={() => setStep(2)} className="mt-4 py-3 rounded-lg bg-primary">
        <Text className="text-center font-semibold text-white">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CONTINUE)}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderItinerary = () => {
    const missing = missingDurationDays(draft.daySegments, draft.duration);
    return (
      <View className="flex-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pt-4 max-h-12">
          {Array.from({ length: draft.duration }, (_, i) => i + 1).map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => setActiveDay(day)}
              className={`px-4 py-2 mr-2 rounded-full ${
                activeDay === day ? 'bg-primary' : 'bg-surface dark:bg-surface-dark border border-border dark:border-border-dark'
              }`}
            >
              <Text className={activeDay === day ? 'text-white font-semibold' : 'text-text dark:text-text-dark'}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {missing.length > 0 && (
          <Text className="px-6 py-2 text-xs text-warning">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_MISSING_DAYS, { days: missing.join(', ') })}
          </Text>
        )}
        <ScrollView className="flex-1 px-6 py-2">
          {draft.daySegments
            .filter((s) => s.dayNumber === activeDay)
            .sort((a, b) => a.segmentOrder - b.segmentOrder)
            .map((stop) => (
              <View
                key={stop.id}
                className="p-4 mb-3 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
              >
                <Text className="font-semibold text-text dark:text-text-dark">{stop.shortDescription}</Text>
                <Text className="text-xs text-muted dark:text-muted-dark mt-1">
                  {stop.tourSpotName || stop.tourSpotId}
                </Text>
                <View className="flex-row mt-3 gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setEditingStop(stop);
                      setStopEditorVisible(true);
                    }}
                  >
                    <Text className="text-sm text-primary dark:text-primary-dark">{t(TRANSLATION_KEYS.COMMON.EDIT)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeStop(stop.id)}>
                    <Text className="text-sm text-danger">{t(TRANSLATION_KEYS.COMMON.DELETE)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          <TouchableOpacity
            onPress={() => openAddStop(activeDay)}
            className="py-3 rounded-lg border border-dashed border-primary items-center mb-8"
          >
            <Text className="text-primary dark:text-primary-dark font-semibold">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ADD_STOP)}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {itineraryBlock && (
          <Text className="px-6 text-xs text-muted dark:text-muted-dark pb-2">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ITINERARY_HINT)}
          </Text>
        )}
        <TouchableOpacity
          disabled={Boolean(itineraryBlock)}
          onPress={() => setStep(3)}
          className={`mx-6 mb-6 py-3 rounded-lg ${itineraryBlock ? 'bg-muted opacity-50' : 'bg-primary'}`}
        >
          <Text className="text-center font-semibold text-white">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CONTINUE)}</Text>
        </TouchableOpacity>
        {draft.location && editingStop && (
          <StopSegmentForm
            visible={stopEditorVisible}
            locationId={draft.location.id}
            dayNumber={editingStop.dayNumber}
            isLastStopOnDay={
              editingStop.segmentOrder ===
              Math.max(
                ...draft.daySegments.filter((s) => s.dayNumber === editingStop.dayNumber).map((s) => s.segmentOrder),
                editingStop.segmentOrder
              )
            }
            initial={editingStop}
            onClose={() => {
              setStopEditorVisible(false);
              setEditingStop(null);
            }}
            onSave={saveStop}
          />
        )}
      </View>
    );
  };

  const renderReview = () => (
    <ScrollView className="flex-1 px-6 py-4">
      <Text className="text-lg font-bold text-text dark:text-text-dark">{draft.packageName}</Text>
      <Text className="text-sm text-muted dark:text-muted-dark mt-2">{draft.shortDescription}</Text>
      <Text className="text-sm text-text dark:text-text-dark mt-4">
        {draft.location?.name} · {draft.tourType} · {draft.duration} {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DAYS_LABEL)}
      </Text>
      <Text className="text-sm text-text dark:text-text-dark mt-1">
        {draft.startDate} → {endDateYmd}
      </Text>
      <Text className="text-sm font-semibold text-text dark:text-text-dark mt-6 mb-2">
        {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_REVIEW_STOPS)}
      </Text>
      {draft.daySegments
        .slice()
        .sort((a, b) => a.dayNumber - b.dayNumber || a.segmentOrder - b.segmentOrder)
        .map((s) => (
          <Text key={s.id} className="text-sm text-muted dark:text-muted-dark mb-1">
            Day {s.dayNumber}: {s.shortDescription}
          </Text>
        ))}
      <TouchableOpacity
        disabled={isSubmitting}
        onPress={handleSavePlan}
        className="mt-8 py-3 rounded-lg bg-primary"
        style={{ opacity: isSubmitting ? 0.6 : 1 }}
      >
        <Text className="text-center font-semibold text-white">
          {isSubmitting
            ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CREATING_TRIP)
            : t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SAVE_PLAN)}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-6 py-4 border-b border-border dark:border-border-dark flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-text dark:text-text-dark">{stepTitles[step]}</Text>
          <Text className="text-xs text-muted dark:text-muted-dark mt-1">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STEP_OF, { step: step + 1, total: totalSteps })}
          </Text>
        </View>
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Feather name={step === 0 ? 'x' : 'chevron-left'} size={24} color={primaryColor} />
        </TouchableOpacity>
      </View>
      <View className="h-1 bg-border dark:bg-border-dark">
        <View className="h-1 bg-primary" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </View>
      {step === 0 && renderDetails()}
      {step === 1 && renderCatalog()}
      {step === 2 && renderItinerary()}
      {step === 3 && renderReview()}
    </View>
  );
}
