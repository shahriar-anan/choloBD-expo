/**
 * Phone layout of the web custom tour builder: details, itinerary, photos.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { useFetchLocations } from '../../hooks/useFetchLocations';
import { getApiInstance } from '../../services/api/axiosClient';
import { unwrapList, catalogSegmentsToWizardStops } from '../../services/api/personalPlanMapping';
import { uploadCommunityImageToCloudinary } from '../../services/api/cloudinaryUpload';
import { getTourPlan } from '../../services/api/tourBuilder';
import {
  attachPersonalTourImages,
  savePersonalTourPlan,
  updatePersonalTourPlan,
} from '../../services/api/tripPlanner';
import { TripPlan } from '../../types/trips';
import { NamedOption } from './StopEditorSheet';
import { StopEditorSheet } from './StopEditorSheet';
import {
  MAX_DURATION,
  MAX_STOPS_PER_DAY,
  MIN_DURATION,
  TOUR_TYPE_VALUES,
  WizardStop,
  applyOvernightHotelToLastStop,
  clampDaySegmentsToDuration,
  countStopsForDay,
  createBlankStop,
  formatDisplayDate,
  formatEnumLabel,
  formatTaka,
  getDetailsContinueReason,
  getItineraryContinueReason,
  inferEndDateString,
  missingDurationDays,
  moveStopWithinDay,
  nextSegmentOrderForDay,
  removeStop,
  sumStopTotals,
  toDateInputValue,
} from '../../utils/tripPlanItinerary';

const STEPS = ['details', 'itinerary', 'photos'] as const;

export interface WizardInitial {
  packageName: string;
  shortDescription: string;
  tourType: string;
  locationId: string;
  startDate: string;
  duration: number;
  totalBudget: number;
  basedOnPackageId?: string;
  stops: WizardStop[];
  images?: { url: string }[];
}

interface TripPlanCreateWizardProps {
  mode: 'create' | 'edit';
  initial?: WizardInitial;
  planId?: string;
  templateId?: string;
  onSaved: (plan: TripPlan) => void;
  onCancel: () => void;
}

function readCost(raw: any): number {
  const value = raw?.entryFee ?? raw?.cost ?? raw?.pricePerNight ?? raw?.basePrice ?? raw?.price;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNamed(raw: any): NamedOption {
  return {
    id: raw.id,
    name: raw.name || raw.packageName || 'Untitled',
    cost: readCost(raw),
    locationId: raw.locationId || raw.location?.id,
  };
}

export function TripPlanCreateWizard({
  mode,
  initial,
  planId,
  templateId,
  onSaved,
  onCancel,
}: TripPlanCreateWizardProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const { locations, loading: locationsLoading } = useFetchLocations();
  const divisions = useMemo(
    () => locations.filter((location) => location.locationType === 'DIVISION'),
    [locations]
  );

  const [step, setStep] = useState(0);
  const [packageName, setPackageName] = useState(initial?.packageName || '');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription || '');
  const [tourType, setTourType] = useState(initial?.tourType || '');
  const [locationId, setLocationId] = useState(initial?.locationId || '');
  const [startDate, setStartDate] = useState(initial?.startDate || '');
  const [duration, setDuration] = useState(initial?.duration || 0);
  const [totalBudget, setTotalBudget] = useState(
    initial?.totalBudget ? String(initial.totalBudget) : ''
  );
  const [basedOnPackageId, setBasedOnPackageId] = useState(initial?.basedOnPackageId || '');
  const [stops, setStops] = useState<WizardStop[]>(initial?.stops || []);
  const [cloning, setCloning] = useState(false);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [tourSpots, setTourSpots] = useState<NamedOption[]>([]);
  const [activitySpots, setActivitySpots] = useState<NamedOption[]>([]);
  const [hotels, setHotels] = useState<NamedOption[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [editor, setEditor] = useState<WizardStop | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [photos, setPhotos] = useState<{ uri: string; mimeType?: string | null; fileName?: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const detailsScrollRef = useRef<ScrollView>(null);
  const questionOffsets = useRef<Record<number, number>>({});
  const wasUnlockedRef = useRef(false);
  const descriptionFieldFocusedRef = useRef(false);

  const registerQuestionOffset = useCallback((num: number, y: number) => {
    questionOffsets.current[num] = y;
  }, []);

  const scrollToQuestion = useCallback((num: number) => {
    requestAnimationFrame(() => {
      const y = questionOffsets.current[num];
      if (y !== undefined) {
        detailsScrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      }
    });
  }, []);

  const scrollDescriptionIntoView = useCallback(() => {
    scrollToQuestion(7);
    setTimeout(() => {
      detailsScrollRef.current?.scrollToEnd({ animated: true });
    }, Platform.OS === 'ios' ? 120 : 80);
  }, [scrollToQuestion]);

  const budgetNumber = Number(totalBudget) || 0;
  const inferredEnd = inferEndDateString(startDate, duration);
  const unlocked = Boolean(locationId && tourType);
  const liveTotal = sumStopTotals(stops);
  const missingDays = missingDurationDays(stops, duration);
  const detailsReason = getDetailsContinueReason({
    packageName,
    totalBudget: budgetNumber,
    division: locationId,
    tourType,
    duration,
    startDate,
    shortDescription,
  });
  const itineraryReason = getItineraryContinueReason(stops, duration, liveTotal, budgetNumber);
  const dayStops = stops
    .filter((stop) => stop.dayNumber === activeDay)
    .sort((a, b) => a.segmentOrder - b.segmentOrder);

  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const wizardFooterHeight = 76;
  const scrollBottomPadding = 24 + (keyboardHeight > 0 ? keyboardHeight + wizardFooterHeight : wizardFooterHeight);

  useEffect(() => {
    if (step !== 0) return;
    if (unlocked && !wasUnlockedRef.current) {
      scrollToQuestion(5);
    }
    wasUnlockedRef.current = unlocked;
  }, [unlocked, step, scrollToQuestion]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      if (step === 0 && descriptionFieldFocusedRef.current) {
        setTimeout(() => {
          detailsScrollRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 80 : 40);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [step]);

  useEffect(() => {
    if (mode !== 'create' || !templateId) return;
    let cancelled = false;
    (async () => {
      setCloning(true);
      try {
        const tour = await getTourPlan(templateId);
        if (cancelled || !tour) return;
        setBasedOnPackageId(tour.id);
        setPackageName(tour.packageName || '');
        setShortDescription(tour.shortDescription || '');
        setTourType(tour.tourType || '');
        setLocationId(tour.location?.id || '');
        setDuration(tour.duration || 0);
        setTotalBudget(String(tour.totalBudget || ''));
        setStops(catalogSegmentsToWizardStops(tour.daySegments || []));
        setActiveDay(1);
        setChecklistDismissed(false);
      } catch (error: any) {
        if (!cancelled) {
          setBasedOnPackageId('');
          Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), error?.message || 'Could not load this template');
        }
      } finally {
        if (!cancelled) setCloning(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, templateId]);

  useEffect(() => {
    if (!locationId) {
      setTourSpots([]);
      setActivitySpots([]);
      setHotels([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setAssetsLoading(true);
      try {
        const api = getApiInstance();
        const [tourRes, activityRes, hotelRes] = await Promise.all([
          api.get('/api/tour-spots', { params: { divisionId: locationId, limit: 100 } }),
          api.get('/api/activity-spots', { params: { divisionId: locationId, limit: 100 } }),
          api.get('/api/hotels', { params: { divisionId: locationId, limit: 100 } }),
        ]);
        if (cancelled) return;
        setTourSpots(unwrapList<any>(tourRes.data?.data).map(toNamed));
        setActivitySpots(unwrapList<any>(activityRes.data?.data).map(toNamed));
        setHotels(unwrapList<any>(hotelRes.data?.data).map(toNamed));
      } catch {
        if (!cancelled) {
          setTourSpots([]);
          setActivitySpots([]);
          setHotels([]);
        }
      } finally {
        if (!cancelled) setAssetsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  const commitStops = (next: WizardStop[]) => {
    setStops(applyOvernightHotelToLastStop(next));
  };

  const openAdd = () => {
    if (countStopsForDay(stops, activeDay) >= MAX_STOPS_PER_DAY) {
      Alert.alert(
        t(TRANSLATION_KEYS.COMMON.ERROR),
        t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_LIMIT, { max: MAX_STOPS_PER_DAY, day: activeDay })
      );
      return;
    }
    setEditor(createBlankStop(activeDay, nextSegmentOrderForDay(stops, activeDay)));
  };

  const saveEditor = (stop: WizardStop) => {
    const exists = stops.some((item) => item.id === stop.id);
    const next = exists ? stops.map((item) => (item.id === stop.id ? stop : item)) : [...stops, stop];
    commitStops(next);
    setEditor(null);
    const stillMissing = missingDurationDays(
      applyOvernightHotelToLastStop(next),
      duration
    );
    if (stillMissing.length > 0 && stillMissing[0] !== activeDay) {
      setActiveDay(stillMissing[0]);
    }
  };

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PHOTO_PERMISSION));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3,
      quality: 0.8,
    });
    if (result.canceled) return;
    setPhotos(
      result.assets.slice(0, 3).map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      }))
    );
  };

  const savePlan = async () => {
    if (detailsReason || itineraryReason) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), detailsReason || itineraryReason || '');
      return;
    }
    setSaving(true);
    try {
      const input = {
        packageName,
        totalBudget: budgetNumber,
        shortDescription,
        tourType,
        locationId,
        startDate,
        duration,
        basedOnPackageId: mode === 'create' ? basedOnPackageId || undefined : undefined,
        daySegments: stops,
      };
      const saved =
        mode === 'edit' && planId
          ? await updatePersonalTourPlan(planId, input)
          : await savePersonalTourPlan(input);
      if (photos.length > 0) {
        try {
          const urls: string[] = [];
          for (const photo of photos) {
            const url = await uploadCommunityImageToCloudinary(
              {
                uri: photo.uri,
                name: photo.fileName || `tour-${saved.id}.jpg`,
                type: photo.mimeType,
              },
              `cholo_bd/tour-packages/${saved.id}/images`
            );
            urls.push(url);
          }
          const withImages = await attachPersonalTourImages(saved.id, urls);
          onSaved(withImages);
          return;
        } catch (error: any) {
          Alert.alert(
            t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SAVED_TITLE),
            error?.message || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PHOTO_FAIL)
          );
        }
      }
      onSaved(saved);
    } catch (error: any) {
      Alert.alert(
        t(TRANSLATION_KEYS.COMMON.ERROR),
        error?.message || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SAVE_FAIL)
      );
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (step === 0 && detailsReason) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), detailsReason);
      return;
    }
    if (step === 1 && itineraryReason) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), itineraryReason);
      return;
    }
    setStep((current) => Math.min(current + 1, 2));
  };

  const visitNames = stops
    .map((stop) => stop.tourSpotName)
    .filter((name): name is string => Boolean(name));

  return (
    <View className="flex-1">
      <View className="px-4 pt-2 pb-3 border-b border-border dark:border-border-dark">
        <Text className="text-xl font-bold text-text dark:text-text-dark">
          {mode === 'edit'
            ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_EDIT_TITLE)
            : t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CREATE_TITLE)}
        </Text>
        <View className="flex-row gap-2 mt-3">
          {STEPS.map((key, index) => {
            const selected = step === index;
            const locked = index > step || (index === 2 && Boolean(itineraryReason));
            return (
              <TouchableOpacity
                key={key}
                disabled={locked && index > step}
                onPress={() => {
                  if (index > step) return;
                  if (index === 2 && itineraryReason) return;
                  setStep(index);
                }}
                className={`flex-1 py-2.5 rounded-full items-center ${selected ? 'bg-primary' : 'bg-surface dark:bg-surface-dark'}`}
              >
                <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                  {index + 1}. {t(
                    index === 0
                      ? TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STEP_DETAILS
                      : index === 1
                        ? TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STEP_ITINERARY
                        : TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STEP_PHOTOS
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 88 : 0}
      >
        <ScrollView
          ref={detailsScrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: scrollBottomPadding, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
        {cloning ? <ActivityIndicator className="mt-4" /> : null}

        {step === 0 ? (
          <View className="mt-4 gap-4">
            <Question
              number={1}
              title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_NAME)}
              hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_NAME_HINT)}
              onRegisterOffset={registerQuestionOffset}
            >
              <TextInput
                value={packageName}
                onChangeText={setPackageName}
                placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_NAME_PH)}
                placeholderTextColor={mutedColor}
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (packageName.trim().length >= 2) scrollToQuestion(2);
                }}
                onEndEditing={() => {
                  if (packageName.trim().length >= 2) scrollToQuestion(2);
                }}
                className="border border-border dark:border-border-dark rounded-xl px-3 py-3.5 text-text dark:text-text-dark bg-surface dark:bg-surface-dark"
              />
            </Question>
            <Question
              number={2}
              title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_BUDGET)}
              hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_BUDGET_HINT)}
              onRegisterOffset={registerQuestionOffset}
            >
              <TextInput
                value={totalBudget}
                onChangeText={setTotalBudget}
                keyboardType="numeric"
                placeholder="15000"
                placeholderTextColor={mutedColor}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if ((Number(totalBudget) || 0) > 0) scrollToQuestion(3);
                }}
                onEndEditing={() => {
                  if ((Number(totalBudget) || 0) > 0) scrollToQuestion(3);
                }}
                className="border border-border dark:border-border-dark rounded-xl px-3 py-3.5 text-text dark:text-text-dark bg-surface dark:bg-surface-dark"
              />
              {budgetNumber > 0 ? <Text className="text-primary mt-2 font-medium">{formatTaka(budgetNumber)}</Text> : null}
            </Question>
            <Question
              number={3}
              title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DIVISION)}
              hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DIVISION_HINT)}
              onRegisterOffset={registerQuestionOffset}
            >
              {locationsLoading ? <ActivityIndicator className="my-2" color={primaryColor} /> : null}
              <View className="flex-row flex-wrap gap-2">
                {divisions.map((division) => {
                  const selected = locationId === division.id;
                  return (
                    <TouchableOpacity
                      key={division.id}
                      onPress={() => {
                        setLocationId(division.id);
                        scrollToQuestion(4);
                      }}
                      className={`px-3.5 py-2 rounded-full border ${
                        selected ? 'bg-primary border-primary' : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'
                      }`}
                    >
                      <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                        {division.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {locationId ? (
                <Text className="text-xs text-muted dark:text-muted-dark mt-2">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SPOT_COUNTS, {
                    tours: tourSpots.length,
                    activities: activitySpots.length,
                  })}
                </Text>
              ) : null}
            </Question>
            <Question
              number={4}
              title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_TYPE)}
              hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_TYPE_HINT)}
              onRegisterOffset={registerQuestionOffset}
            >
              <View className="flex-row flex-wrap gap-2">
                {TOUR_TYPE_VALUES.map((value) => {
                  const selected = tourType === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => {
                        setTourType(value);
                        scrollToQuestion(5);
                      }}
                      className={`px-3.5 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'}`}
                    >
                      <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                        {formatEnumLabel(value)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Question>
            {unlocked ? (
              <>
                <Question
                  number={5}
                  title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DURATION)}
                  hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DURATION_HINT)}
                  onRegisterOffset={registerQuestionOffset}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2 py-1">
                      {Array.from({ length: MAX_DURATION - MIN_DURATION + 1 }, (_, index) => index + 1).map((value) => {
                        const selected = duration === value;
                        return (
                          <TouchableOpacity
                            key={value}
                            onPress={() => {
                              setDuration(value);
                              setStops((current) => clampDaySegmentsToDuration(current, value));
                              setActiveDay(1);
                              scrollToQuestion(6);
                            }}
                            className={`w-11 h-11 rounded-full items-center justify-center border ${
                              selected ? 'bg-primary border-primary' : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'
                            }`}
                          >
                            <Text className={`font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                              {value}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </Question>
                <Question
                  number={6}
                  title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_START)}
                  hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_START_HINT)}
                  onRegisterOffset={registerQuestionOffset}
                >
                  <TouchableOpacity
                    onPress={() => setShowDate(true)}
                    className="border border-border dark:border-border-dark rounded-xl px-3 py-3.5 bg-surface dark:bg-surface-dark"
                  >
                    <Text className="text-text dark:text-text-dark">
                      {startDate ? formatDisplayDate(startDate) : t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PICK_DATE)}
                    </Text>
                  </TouchableOpacity>
                  {showDate ? (
                    <DateTimePicker
                      value={startDate ? new Date(`${startDate}T00:00:00`) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, date) => {
                        if (Platform.OS !== 'ios') setShowDate(false);
                        if (date) {
                          setStartDate(toDateInputValue(date));
                          scrollToQuestion(7);
                        }
                      }}
                    />
                  ) : null}
                  {inferredEnd ? (
                    <Text className="text-xs text-muted dark:text-muted-dark mt-2">
                      {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_END_INFERRED, { date: formatDisplayDate(inferredEnd) })}
                    </Text>
                  ) : null}
                </Question>
                <Question
                  number={7}
                  title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DESC)}
                  hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DESC_HINT)}
                  onRegisterOffset={registerQuestionOffset}
                >
                  <TextInput
                    value={shortDescription}
                    onChangeText={setShortDescription}
                    multiline
                    textAlignVertical="top"
                    placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DESC_PH)}
                    placeholderTextColor={mutedColor}
                    onFocus={() => {
                      descriptionFieldFocusedRef.current = true;
                      scrollDescriptionIntoView();
                    }}
                    onBlur={() => {
                      descriptionFieldFocusedRef.current = false;
                    }}
                    className="border border-border dark:border-border-dark rounded-xl px-3 py-3.5 text-text dark:text-text-dark min-h-[112px] bg-surface dark:bg-surface-dark"
                  />
                </Question>
              </>
            ) : null}
          </View>
        ) : null}

        {step === 1 ? (
          <View className="mt-4">
            <View className="rounded-2xl p-4 mb-3 border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-dark">
              <Text className="text-base font-semibold text-text dark:text-text-dark mb-2">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_RULES_TITLE)}
              </Text>
              <Text className="text-sm text-muted dark:text-muted-dark leading-5">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_RULES_BODY)}
              </Text>
            </View>
            {missingDays.length > 0 ? (
              <Text className="text-sm text-text dark:text-text-dark mb-2">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_MISSING_DAYS, { days: missingDays.join(', ') })}
              </Text>
            ) : null}
            {itineraryReason ? <Text className="text-sm text-muted mb-3">{itineraryReason}</Text> : null}
            {basedOnPackageId && !checklistDismissed ? (
              <View className="rounded-xl p-3 border border-primary mb-3">
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-primary flex-1">
                    {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TEMPLATE_LOADED)}
                  </Text>
                  <TouchableOpacity onPress={() => setChecklistDismissed(true)}>
                    <Text className="text-sm text-muted">{t(TRANSLATION_KEYS.COMMON.CLOSE)}</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-muted mt-1">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TEMPLATE_HINT)}
                </Text>
              </View>
            ) : null}
            {assetsLoading ? <ActivityIndicator className="mb-3" /> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {Array.from({ length: duration || 0 }, (_, index) => index + 1).map((day) => {
                  const selected = activeDay === day;
                  const empty = countStopsForDay(stops, day) === 0;
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setActiveDay(day)}
                      className={`px-4 py-2.5 rounded-full border ${
                        selected
                          ? 'bg-primary border-primary'
                          : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}
                      >
                        {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day })}
                        {empty ? ` · ${t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DAY_EMPTY_TAB)}` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            {dayStops.map((stop, index) => (
              <View
                key={stop.id}
                className="rounded-2xl p-3 mb-2 border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-dark"
              >
                <TouchableOpacity onPress={() => setEditor(stop)}>
                  <Text className="text-base font-semibold text-text dark:text-text-dark">
                    {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_LABEL, { order: stop.segmentOrder || index + 1 })}
                  </Text>
                  <Text className="text-base text-text dark:text-text-dark mt-1">
                    {stop.shortDescription || stop.tourSpotName || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_EMPTY)}
                  </Text>
                  <WizardStopPlacePreview stop={stop} isLastOnDay={index === dayStops.length - 1} />
                  {stop.transportOption ? (
                    <Text className="text-xs text-muted dark:text-muted-dark mt-2">
                      {formatEnumLabel(stop.transportOption)}
                    </Text>
                  ) : null}
                </TouchableOpacity>
                <View className="flex-row items-center gap-3 mt-3">
                  <TouchableOpacity
                    onPress={() => commitStops(moveStopWithinDay(stops, stop.id, 'up'))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-2"
                  >
                    <Feather name="arrow-up" size={20} color={primaryColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => commitStops(moveStopWithinDay(stops, stop.id, 'down'))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-2"
                  >
                    <Feather name="arrow-down" size={20} color={primaryColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => commitStops(removeStop(stops, stop.id))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-2 ml-auto"
                  >
                    <Feather name="trash-2" size={20} color={errorColor} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={openAdd} className="border border-dashed border-primary rounded-lg py-3 items-center mt-1">
              <Text className="text-primary font-semibold">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ADD_STOP)}</Text>
            </TouchableOpacity>
            <Text className="text-sm text-muted mt-3">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_LIVE_TOTAL, {
                total: formatTaka(liveTotal),
                budget: formatTaka(budgetNumber),
              })}
            </Text>
          </View>
        ) : null}

        {step === 2 ? (
          <View className="mt-4">
            <View className="rounded-xl p-4 bg-surface dark:bg-surface-dark mb-4">
              <Text className="text-lg font-bold text-text dark:text-text-dark">{packageName}</Text>
              <Text className="text-sm text-muted mt-1">
                {duration} {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DAYS)} · {formatTaka(liveTotal)} / {formatTaka(budgetNumber)}
              </Text>
              <Text className="text-sm text-text dark:text-text-dark mt-2">
                {visitNames.join(', ') || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_NO_SPOTS_YET)}
              </Text>
            </View>
            <Text className="font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PHOTOS_TITLE)}
            </Text>
            <Text className="text-xs text-muted mt-1 mb-3">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PHOTOS_HINT)}</Text>
            <TouchableOpacity onPress={pickPhotos} className="bg-surface dark:bg-surface-dark rounded-lg py-3 items-center">
              <Text className="text-primary font-semibold">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PICK_PHOTOS)}</Text>
            </TouchableOpacity>
            <View className="flex-row flex-wrap gap-2 mt-3">
              {photos.map((photo) => (
                <Image key={photo.uri} source={{ uri: photo.uri }} className="w-24 h-24 rounded-lg" />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

        <View className="px-4 py-3 border-t border-border dark:border-border-dark flex-row gap-3 bg-background dark:bg-background-dark">
          <TouchableOpacity
            onPress={() => (step === 0 ? onCancel() : setStep((current) => current - 1))}
            className="flex-1 py-3 rounded-lg items-center bg-surface dark:bg-surface-dark"
          >
            <Text className="font-semibold text-text dark:text-text-dark">
              {step === 0 ? t(TRANSLATION_KEYS.COMMON.CANCEL) : t(TRANSLATION_KEYS.COMMON.BACK)}
            </Text>
          </TouchableOpacity>
          {step < 2 ? (
            <TouchableOpacity onPress={goNext} className="flex-1 py-3 rounded-lg items-center bg-primary">
              <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CONTINUE)}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={savePlan} disabled={saving} className="flex-1 py-3 rounded-lg items-center bg-primary">
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">
                  {mode === 'edit'
                    ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SAVE_CHANGES)
                    : t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CREATE_BTN)}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {editor ? (
        <StopEditorSheet
          visible
          stop={editor}
          divisionId={locationId}
          isLastStop={
            editor.segmentOrder ===
            Math.max(
              ...stops.filter((stop) => stop.dayNumber === editor.dayNumber).map((stop) => stop.segmentOrder),
              editor.segmentOrder
            )
          }
          onClose={() => setEditor(null)}
          onSave={saveEditor}
        />
      ) : null}
    </View>
  );
}

function WizardStopPlacePreview({
  stop,
  isLastOnDay,
}: {
  stop: WizardStop;
  isLastOnDay: boolean;
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const rows = [
    {
      label: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_KIND_TOUR),
      name: stop.tourSpotName,
      imageUrl: stop.tourSpotImageUrl,
    },
    {
      label: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_KIND_ACTIVITY),
      name: stop.activitySpotName,
      imageUrl: stop.activitySpotImageUrl,
    },
    ...(isLastOnDay
      ? [
          {
            label: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_KIND_HOTEL),
            name: stop.hotelName || (stop.hotelOption ? formatEnumLabel(stop.hotelOption) : undefined),
            imageUrl: stop.hotelImageUrl,
          },
        ]
      : []),
  ].filter((row) => row.name);

  if (rows.length === 0) return null;

  return (
    <View className="mt-2 gap-1.5">
      {rows.map((row) => (
        <View key={row.label} className="flex-row items-center">
          <View className="w-10 h-10 rounded-lg overflow-hidden bg-background dark:bg-background-dark mr-2">
            {row.imageUrl ? (
              <Image source={{ uri: row.imageUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Feather name="image" size={16} color={mutedColor} />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-[10px] uppercase text-muted dark:text-muted-dark font-semibold">{row.label}</Text>
            <Text className="text-sm text-text dark:text-text-dark" numberOfLines={1}>{row.name}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Question({
  number,
  title,
  hint,
  children,
  onRegisterOffset,
}: {
  number: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
  onRegisterOffset?: (num: number, y: number) => void;
}) {
  return (
    <View
      onLayout={(event) => onRegisterOffset?.(number, event.nativeEvent.layout.y)}
      className="rounded-2xl p-4 border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-dark"
    >
      <View className="flex-row gap-3">
        <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
          <Text className="text-sm font-bold text-white">{number}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-text dark:text-text-dark">{title}</Text>
          {hint ? <Text className="text-xs text-muted dark:text-muted-dark mt-1 mb-3 leading-4">{hint}</Text> : null}
          {children}
        </View>
      </View>
    </View>
  );
}
