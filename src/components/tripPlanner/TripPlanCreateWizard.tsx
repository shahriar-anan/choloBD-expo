/**
 * Phone layout of the web custom tour builder: details, itinerary, photos.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { appAlert } from '../ui/appAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScroll } from '../ui/KeyboardAwareScroll';
import { Toast } from '../ui/Toast';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
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
import { DayChips } from './DayChips';
import { DayDetailsSheet, DaySheetStop } from './DayDetailsSheet';
import { StopCard, StopCardPlace } from './StopCard';
import { usePlanQuote } from '../../hooks/usePlanQuote';
import {
  BudgetMeter,
  BudgetSummaryBar,
  CostBreakdownSheet,
  OverBudgetBanner,
} from './budget';
import { applyQuoteToStops, budgetState, dailyAllowance, raisedBudgetAmount, stopTotal } from '../../utils/tripBudget';
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
  formatTripDayHeading,
  formatEnumLabel,
  formatTaka,
  getDetailsContinueReason,
  getItineraryContinueReason,
  inferEndDateString,
  missingDurationDays,
  moveStopWithinDay,
  nextSegmentOrderForDay,
  removeStop,
  toDateInputValue,
} from '../../utils/tripPlanItinerary';

const STEPS = ['details', 'itinerary', 'photos'] as const;

interface WizardPhoto {
  uri: string;
  remote?: boolean;
  mimeType?: string | null;
  fileName?: string | null;
}

const RULES_SEEN_KEY = 'tripPlanner.rulesSeen';

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

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
  initialStep?: number;
  initialDay?: number;
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
  initialStep = 0,
  initialDay = 1,
  onSaved,
  onCancel,
}: TripPlanCreateWizardProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const keyboardOpen = useKeyboardVisible();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const { locations, loading: locationsLoading } = useFetchLocations();
  const divisions = useMemo(
    () => locations.filter((location) => location.locationType === 'DIVISION'),
    [locations]
  );

  const [step, setStep] = useState(initialStep);
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
  const [detailsTried, setDetailsTried] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [tabNotice, setTabNotice] = useState<string | null>(null);
  const [dayDetailsOpen, setDayDetailsOpen] = useState(false);
  const [ensureDay, setEnsureDay] = useState<number | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [tourSpots, setTourSpots] = useState<NamedOption[]>([]);
  const [activitySpots, setActivitySpots] = useState<NamedOption[]>([]);
  const [hotels, setHotels] = useState<NamedOption[]>([]);
  const [activeDay, setActiveDay] = useState(initialDay);
  const [editor, setEditor] = useState<WizardStop | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [photos, setPhotos] = useState<WizardPhoto[]>(
    () => (initial?.images || []).map((image) => ({ uri: image.url, remote: true }))
  );
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [removedStops, setRemovedStops] = useState<WizardStop[] | null>(null);
  const [saving, setSaving] = useState(false);
  const allowLeaveRef = useRef(false);
  const formBaselineRef = useRef<string | null>(null);
  const detailsScrollRef = useRef<ScrollView>(null);
  const budgetInputRef = useRef<TextInput>(null);
  const questionOffsets = useRef<Record<number, number>>({});

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

  const budgetDigits = totalBudget.replace(/\D/g, '');
  const budgetNumber = Number(budgetDigits) || 0;
  const budgetDisplay = budgetDigits ? Number(budgetDigits).toLocaleString('en-US') : '';
  const inferredEnd = inferEndDateString(startDate, duration);
  const { quote, totals, error: quoteError, retry: retryQuote } = usePlanQuote(
    stops,
    budgetNumber,
    step === 1 || step === 2 || Boolean(editor)
  );
  const liveTotal = totals.plannedTotal;
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
  const budgetOver = budgetState(liveTotal, budgetNumber);
  const pricedStops = useMemo(
    () => (totals.source === 'quote' && quote?.stops ? applyQuoteToStops(stops, quote.stops) : stops),
    [stops, quote, totals.source]
  );
  const fieldMissing = {
    name: !packageName.trim(),
    budget: !(budgetNumber > 0),
    division: !locationId,
    type: !tourType,
    duration: !(duration > 0),
    start: !startDate,
    desc: !shortDescription.trim(),
  };
  const formSnapshot = JSON.stringify({
    packageName,
    shortDescription,
    tourType,
    locationId,
    startDate,
    duration,
    budgetDigits,
    stops,
    photos: photos.map((photo) => photo.uri),
  });
  const isDirty = formBaselineRef.current != null && formBaselineRef.current !== formSnapshot;
  const dayStops = pricedStops
    .filter((stop) => stop.dayNumber === activeDay)
    .sort((a, b) => a.segmentOrder - b.segmentOrder);
  const dayTotal = dayStops.reduce((sum, stop) => sum + stopTotal(stop), 0);

  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(RULES_SEEN_KEY)
      .then((value) => {
        if (active) setRulesOpen(value !== '1');
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!rulesOpen) return;
    return () => {
      AsyncStorage.setItem(RULES_SEEN_KEY, '1').catch(() => undefined);
    };
  }, [rulesOpen]);

  useEffect(() => {
    if (cloning) return;
    if (formBaselineRef.current == null) formBaselineRef.current = formSnapshot;
  }, [cloning, formSnapshot]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeaveRef.current || !isDirty) return;
      event.preventDefault();
      appAlert(
        t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DISCARD_TITLE),
        t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DISCARD_BODY),
        [
          { text: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_KEEP_EDITING), style: 'cancel' },
          {
            text: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DISCARD_CONFIRM),
            style: 'destructive',
            onPress: () => {
              allowLeaveRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, isDirty, t]);

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
        setStops(
          catalogSegmentsToWizardStops(tour.daySegments || []).map((stop) => ({
            ...stop,
            shortDescriptionBn: '',
            notesBn: '',
          }))
        );
        setTourType(tour.tourType || '');
        setLocationId(tour.location?.id || '');
        setDuration(tour.duration || 0);
        setTotalBudget(String(tour.totalBudget || ''));
        setActiveDay(1);
        setChecklistDismissed(false);
      } catch (error: any) {
        if (!cancelled) {
          setBasedOnPackageId('');
          appAlert(t(TRANSLATION_KEYS.COMMON.ERROR), error?.message || 'Could not load this template', undefined, 'error');
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
      appAlert(
        t(TRANSLATION_KEYS.COMMON.ERROR),
        t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_LIMIT, { max: MAX_STOPS_PER_DAY, day: activeDay })
      , undefined, 'error');
      return;
    }
    setEditor(createBlankStop(activeDay, nextSegmentOrderForDay(stops, activeDay)));
  };

  const saveEditor = (stop: WizardStop) => {
    const exists = stops.some((item) => item.id === stop.id);
    let next = exists ? stops.map((item) => (item.id === stop.id ? stop : item)) : [...stops, stop];
    const dayItems = next.filter((item) => item.dayNumber === stop.dayNumber);
    const lastOrder = Math.max(...dayItems.map((item) => item.segmentOrder));
    if (stop.segmentOrder === lastOrder && !stop.hotelId) {
      next = next.map((item) =>
        item.dayNumber === stop.dayNumber
          ? {
              ...item,
              hotelOption: '',
              hotelId: '',
              hotelName: undefined,
              hotelImageUrl: undefined,
              hotelRoomType: undefined,
              hotelCost: 0,
            }
          : item
      );
    }
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
    const room = 3 - photos.length;
    if (room <= 0) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      appAlert(t(TRANSLATION_KEYS.COMMON.ERROR), t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PHOTO_PERMISSION), undefined, 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: room,
      quality: 0.8,
    });
    if (result.canceled) return;
    setPhotos((current) => [
      ...current,
      ...result.assets.slice(0, room).map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      })),
    ]);
  };

  const removeWithUndo = (stopId: string) => {
    setRemovedStops(stops);
    commitStops(removeStop(stops, stopId));
  };

  const selectDayFromList = (day: number) => {
    setActiveDay(day);
    setEnsureDay(day);
    if (step !== 1) setStep(1);
  };

  const savePlan = async () => {
    if (detailsReason || itineraryReason) {
      setDetailsTried(true);
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
      const localPhotos = photos.filter((photo) => !photo.remote);
      if (photos.length > 0) {
        try {
          const urls: string[] = [];
          let uploaded = 0;
          for (const photo of photos) {
            if (photo.remote) {
              urls.push(photo.uri);
              continue;
            }
            uploaded += 1;
            setUploadLabel(
              t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_UPLOADING, {
                current: uploaded,
                total: localPhotos.length,
              })
            );
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
          allowLeaveRef.current = true;
          onSaved(withImages);
          return;
        } catch (error: any) {
          allowLeaveRef.current = true;
          appAlert(
            t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SAVED_TITLE),
            error?.message || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PHOTO_FAIL)
          , undefined, 'error');
        }
      }
      allowLeaveRef.current = true;
      onSaved(saved);
    } catch (error: any) {
      appAlert(
        t(TRANSLATION_KEYS.COMMON.ERROR),
        error?.message || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SAVE_FAIL)
      , undefined, 'error');
    } finally {
      setSaving(false);
      setUploadLabel(null);
    }
  };

  const goNext = () => {
    if (step === 0 && detailsReason) {
      setDetailsTried(true);
      const first = fieldMissing.name
        ? 1
        : fieldMissing.budget
          ? 2
          : fieldMissing.division
            ? 3
            : fieldMissing.type
              ? 4
              : fieldMissing.duration
                ? 5
                : fieldMissing.start
                  ? 6
                  : 7;
      scrollToQuestion(first);
      return;
    }
    if (step === 1 && itineraryReason) return;
    setTabNotice(null);
    setStep((current) => Math.min(current + 1, 2));
  };

  const wizardPlaces = (stop: WizardStop, isLastOnDay: boolean): StopCardPlace[] => {
    const rows: StopCardPlace[] = [];
    if (stop.tourSpotName) {
      rows.push({
        key: 'spot',
        label: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_KIND_TOUR),
        name: stop.tourSpotName,
        imageUrl: stop.tourSpotImageUrl,
      });
    }
    if (stop.activitySpotName) {
      rows.push({
        key: 'activity',
        label: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ACTIVITY),
        name: stop.activitySpotName,
        imageUrl: stop.activitySpotImageUrl,
      });
    }
    const hotelName = stop.hotelName || (stop.hotelOption ? formatEnumLabel(stop.hotelOption) : '');
    if (isLastOnDay && hotelName) {
      rows.push({
        key: 'hotel',
        label: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HOTEL),
        name: hotelName,
        imageUrl: stop.hotelImageUrl,
      });
    }
    return rows;
  };

  const daySheetStops: DaySheetStop[] = dayStops.map((stop, index) => {
    const isLast = index === dayStops.length - 1;
    const title = stop.tourSpotName || stop.shortDescription || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_EMPTY);
    return {
      id: stop.id,
      title,
      description:
        stop.tourSpotName && stop.shortDescription && stop.shortDescription !== stop.tourSpotName
          ? stop.shortDescription
          : undefined,
      notes: stop.notes,
      places: wizardPlaces(stop, isLast),
      transport: stop.transportOption
        ? t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_TRANSPORT_NOT_PRICED, { type: formatEnumLabel(stop.transportOption) })
        : undefined,
      activityCost: stop.activityCost || 0,
      stayCost: isLast ? stop.hotelCost || 0 : 0,
      stayDetail: isLast && stop.hotelRoomType ? formatEnumLabel(stop.hotelRoomType) : undefined,
      total: stopTotal(stop),
    };
  });

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
            const done = index < step;
            const blocked =
              index > step &&
              ((index === 1 && Boolean(detailsReason)) || (index === 2 && Boolean(detailsReason || itineraryReason)));
            const label = t(
              index === 0
                ? TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STEP_DETAILS
                : index === 1
                  ? TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STEP_ITINERARY
                  : TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STEP_PHOTOS
            );
            return (
              <TouchableOpacity
                key={key}
                accessibilityState={{ selected, disabled: blocked }}
                onPress={() => {
                  if (index === step) return;
                  if (blocked) {
                    setTabNotice(index === 1 ? detailsReason : detailsReason || itineraryReason);
                    return;
                  }
                  setTabNotice(null);
                  setStep(index);
                }}
                className={`flex-1 py-2 px-1 rounded-2xl items-center border ${
                  selected
                    ? 'bg-primary border-primary'
                    : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'
                }`}
                style={{ opacity: blocked ? 0.45 : 1, minHeight: 44 }}
              >
                {done && !selected ? (
                  <Ionicons name="checkmark-circle" size={14} color={primaryColor} />
                ) : null}
                <Text
                  numberOfLines={2}
                  className={`text-center font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}
                  style={{ fontSize: theme.typography.trip.caption }}
                >
                  {index + 1}. {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {step === 1 ? (
        <BudgetSummaryBar
          planned={liveTotal}
          budget={budgetNumber}
          updating={totals.isUpdating}
          estimate={totals.source === 'estimate'}
          onRetry={quoteError && totals.source === 'estimate' ? retryQuote : undefined}
          onPress={() => setBreakdownOpen(true)}
        />
      ) : null}

        <KeyboardAwareScroll
          ref={detailsScrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
        {step === 0 ? (
          <View className="pt-4 gap-4">
            <Question
              number={1}
              title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_NAME)}
              hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_NAME_HINT)}
              error={detailsTried && fieldMissing.name ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_FIELD_MISSING) : undefined}
              onRegisterOffset={registerQuestionOffset}
            >
              <TextInput
                value={packageName}
                onChangeText={setPackageName}
                placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_NAME_PH)}
                placeholderTextColor={mutedColor}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => budgetInputRef.current?.focus()}
                className="border border-border dark:border-border-dark rounded-xl px-3 py-3.5 text-text dark:text-text-dark bg-surface dark:bg-surface-dark"
              />
            </Question>
            <Question
              number={2}
              title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_BUDGET)}
              hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_BUDGET_HINT)}
              error={detailsTried && fieldMissing.budget ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_FIELD_MISSING) : undefined}
              onRegisterOffset={registerQuestionOffset}
            >
              <TextInput
                ref={budgetInputRef}
                value={budgetDisplay}
                onChangeText={(value) => setTotalBudget(value.replace(/\D/g, ''))}
                keyboardType="numeric"
                placeholder="15,000"
                placeholderTextColor={mutedColor}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                className="border border-border dark:border-border-dark rounded-xl px-3 py-3.5 text-text dark:text-text-dark bg-surface dark:bg-surface-dark"
              />
              {budgetNumber > 0 && duration > 0 ? (
                <Text className="text-xs text-muted dark:text-muted-dark mt-2">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_DAILY_HINT, {
                    amount: formatTaka(dailyAllowance(budgetNumber, duration)),
                    days: duration,
                  })}
                </Text>
              ) : null}
            </Question>
            <Question
              number={3}
              title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DIVISION)}
              hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DIVISION_HINT)}
              error={detailsTried && fieldMissing.division ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_FIELD_MISSING) : undefined}
              onRegisterOffset={registerQuestionOffset}
            >
              {locationsLoading ? <ActivityIndicator className="my-2" color={primaryColor} /> : null}
              <View className="flex-row flex-wrap gap-2">
                {divisions.map((division) => {
                  const selected = locationId === division.id;
                  return (
                    <TouchableOpacity
                      key={division.id}
                      onPress={() => setLocationId(division.id)}
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
              error={detailsTried && fieldMissing.type ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_FIELD_MISSING) : undefined}
              onRegisterOffset={registerQuestionOffset}
            >
              <View className="flex-row flex-wrap gap-2">
                {TOUR_TYPE_VALUES.map((value) => {
                  const selected = tourType === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setTourType(value)}
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
                <Question
                  number={5}
                  title={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DURATION)}
                  hint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DURATION_HINT)}
                  error={detailsTried && fieldMissing.duration ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_FIELD_MISSING) : undefined}
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
                  error={detailsTried && fieldMissing.start ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_FIELD_MISSING) : undefined}
                  onRegisterOffset={registerQuestionOffset}
                >
                  <TouchableOpacity
                    onPress={() => setShowDate(true)}
                    className="border border-border dark:border-border-dark rounded-xl px-3 py-3.5 bg-surface dark:bg-surface-dark"
                    style={{ minHeight: 44, justifyContent: 'center' }}
                  >
                    <Text className="text-text dark:text-text-dark">
                      {startDate ? formatDisplayDate(startDate) : t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PICK_DATE)}
                    </Text>
                  </TouchableOpacity>
                  {showDate && Platform.OS === 'android' ? (
                    <DateTimePicker
                      value={startDate ? new Date(`${startDate}T00:00:00`) : new Date()}
                      mode="date"
                      minimumDate={startOfToday()}
                      display="default"
                      onChange={(_, date) => {
                        setShowDate(false);
                        if (date) setStartDate(toDateInputValue(date));
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
                  error={detailsTried && fieldMissing.desc ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_FIELD_MISSING) : undefined}
                  onRegisterOffset={registerQuestionOffset}
                >
                  <TextInput
                    value={shortDescription}
                    onChangeText={setShortDescription}
                    multiline
                    textAlignVertical="top"
                    placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_Q_DESC_PH)}
                    placeholderTextColor={mutedColor}
                    className="border border-border dark:border-border-dark rounded-xl px-3 py-3.5 text-text dark:text-text-dark min-h-[112px] bg-surface dark:bg-surface-dark"
                  />
                </Question>
          </View>
        ) : null}

        {step === 1 ? (
          <View className="mt-4">
            <View className="rounded-2xl mb-3 border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-dark">
              <TouchableOpacity
                onPress={() => {
                  setRulesOpen((open) => {
                    if (open) AsyncStorage.setItem(RULES_SEEN_KEY, '1').catch(() => undefined);
                    return !open;
                  });
                }}
                className="flex-row items-center justify-between px-4 py-3"
                style={{ minHeight: 44 }}
              >
                <Text className="text-base font-semibold text-text dark:text-text-dark flex-1">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_RULES_TITLE)}
                </Text>
                <Text className="text-xs font-semibold text-primary">
                  {rulesOpen ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_RULES_HIDE) : t(TRANSLATION_KEYS.COMMON.VIEW_DETAILS)}
                </Text>
              </TouchableOpacity>
              {rulesOpen ? (
                <Text className="text-sm text-muted dark:text-muted-dark leading-5 px-4 pb-4">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_RULES_BODY)}
                </Text>
              ) : null}
            </View>
            {missingDays.length > 0 ? (
              <Text className="text-sm text-text dark:text-text-dark mb-2">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_MISSING_DAYS, { days: missingDays.join(', ') })}
              </Text>
            ) : null}
            {budgetOver.tone === 'over' ? (
              <OverBudgetBanner
                overBy={budgetOver.overBy}
                raisedBudget={raisedBudgetAmount(liveTotal)}
                fromTemplate={Boolean(basedOnPackageId)}
                onRaise={() => setTotalBudget(String(raisedBudgetAmount(liveTotal)))}
                onSeeCosts={() => setBreakdownOpen(true)}
              />
            ) : itineraryReason ? (
              <Text className="text-sm text-muted dark:text-muted-dark mb-3">{itineraryReason}</Text>
            ) : null}
            {basedOnPackageId && !checklistDismissed ? (
                <View className="rounded-xl p-3 border border-primary dark:border-primary-dark mb-3">
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-primary dark:text-primary-dark flex-1">
                    {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TEMPLATE_LOADED)}
                  </Text>
                  <TouchableOpacity onPress={() => setChecklistDismissed(true)} style={{ minHeight: 44, justifyContent: 'center' }}>
                    <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.COMMON.CLOSE)}</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-muted dark:text-muted-dark mt-1">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TEMPLATE_HINT)}
                </Text>
              </View>
            ) : null}
            {assetsLoading ? <ActivityIndicator className="mb-3" /> : null}
            <View className="mb-3">
              <DayChips
                count={duration || 0}
                selected={activeDay}
                emptyDays={Array.from({ length: duration || 0 }, (_, index) => index + 1).filter(
                  (day) => countStopsForDay(stops, day) === 0
                )}
                onSelect={setActiveDay}
                ensureDay={ensureDay}
                onEnsureDone={() => setEnsureDay(null)}
              />
            </View>
            {dayStops.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-primary px-4 py-6 items-center mb-2">
                <Ionicons name="map-outline" size={28} color={primaryColor} />
                <Text className="text-base font-semibold text-text dark:text-text-dark mt-2 text-center">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_EMPTY_DAY_TITLE)}
                </Text>
                <Text className="text-sm text-muted dark:text-muted-dark mt-1 text-center">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_EMPTY_DAY_BODY)}
                </Text>
              </View>
            ) : null}
            {dayStops.map((stop, index) => {
              const isLast = index === dayStops.length - 1;
              const title = stop.tourSpotName || stop.shortDescription || t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_EMPTY);
              const description =
                stop.tourSpotName && stop.shortDescription && stop.shortDescription !== stop.tourSpotName
                  ? stop.shortDescription
                  : undefined;
              return (
                <StopCard
                  key={stop.id}
                  title={title}
                  description={description}
                  places={wizardPlaces(stop, isLast)}
                  transport={
                    stop.transportOption
                      ? t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_TRANSPORT_NOT_PRICED, {
                          type: formatEnumLabel(stop.transportOption),
                        })
                      : undefined
                  }
                  onPress={() => setEditor(stop)}
                  totalLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STOP_TOTAL) + '  ' + formatTaka(stopTotal(stop))}
                  onDetails={() => setDayDetailsOpen(true)}
                  detailsLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_DETAILS)}
                  reorder={{
                    canUp: index > 0,
                    canDown: index < dayStops.length - 1,
                    onUp: () => commitStops(moveStopWithinDay(stops, stop.id, 'up')),
                    onDown: () => commitStops(moveStopWithinDay(stops, stop.id, 'down')),
                    onDelete: () => removeWithUndo(stop.id),
                    upLabel: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_MOVE_UP),
                    downLabel: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_MOVE_DOWN),
                    deleteLabel: t(TRANSLATION_KEYS.COMMON.DELETE),
                  }}
                />
              );
            })}
            {(() => {
              const atLimit = countStopsForDay(stops, activeDay) >= MAX_STOPS_PER_DAY;
              return (
                <TouchableOpacity
                  onPress={openAdd}
                  disabled={atLimit}
                  className="border border-dashed border-primary rounded-lg py-3 items-center mt-1"
                  style={{ opacity: atLimit ? 0.5 : 1, minHeight: 44 }}
                >
                  <Text className="text-primary font-semibold">
                    {atLimit
                      ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_FULL, {
                          count: countStopsForDay(stops, activeDay),
                          max: MAX_STOPS_PER_DAY,
                        })
                      : t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ADD_STOP)}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        ) : null}

        {step === 2 ? (
          <View className="mt-4">
            <View className="rounded-xl p-4 bg-surface dark:bg-surface-dark mb-4">
              <Text className="text-lg font-bold text-text dark:text-text-dark">{packageName}</Text>
              <Text className="text-sm text-muted dark:text-muted-dark mt-1">
                {[
                  divisions.find((division) => division.id === locationId)?.name,
                  tourType ? formatEnumLabel(tourType) : undefined,
                  startDate ? `${formatDisplayDate(startDate)}${inferredEnd ? ` → ${formatDisplayDate(inferredEnd)}` : ''}` : undefined,
                  `${duration} ${t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DAYS)}`,
                ].filter(Boolean).join(' · ')}
              </Text>
              <View className="mt-3">
                {Array.from({ length: duration || 0 }, (_, index) => index + 1).map((day) => {
                  const names = pricedStops
                    .filter((stop) => stop.dayNumber === day)
                    .map((stop) => stop.tourSpotName)
                    .filter(Boolean);
                  const dayCost = totals.byDay.find((row) => row.dayNumber === day)?.total || 0;
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => selectDayFromList(day)}
                      className="flex-row items-center py-2"
                      style={{ minHeight: 44 }}
                    >
                      <Text className="text-sm text-text dark:text-text-dark flex-1 pr-2" numberOfLines={1}>
                        {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day })}
                        {names.length ? ` · ${names.join(', ')}` : ''}
                      </Text>
                      <Text className="text-sm font-semibold text-text dark:text-text-dark">{formatTaka(dayCost)}</Text>
                      <Ionicons name="chevron-forward" size={16} color={mutedColor} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View className="mt-4">
                <Text className="text-sm font-bold text-text dark:text-text-dark mb-2">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_COST_SUMMARY)}
                </Text>
                <BudgetMeter
                  planned={liveTotal}
                  budget={budgetNumber}
                  updating={totals.isUpdating}
                  estimate={totals.source === 'estimate'}
                />
                <View className="mt-3">
                  <MoneyRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_STAYS)} value={formatTaka(totals.byCategory.stays)} />
                  <MoneyRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_ACTIVITIES)} value={formatTaka(totals.byCategory.activities)} />
                  <MoneyRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_TRANSPORT)} value={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_NOT_PRICED)} />
                  <MoneyRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_PLANNED_TOTAL)} value={formatTaka(liveTotal)} strong />
                  <MoneyRow label={t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_YOUR_BUDGET)} value={formatTaka(budgetNumber)} strong />
                  <MoneyRow
                    label={budgetOver.tone === 'over'
                      ? t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_OVER_BY, { amount: formatTaka(budgetOver.overBy) })
                      : t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_LEFT, { amount: formatTaka(budgetOver.remaining) })}
                    value=""
                    strong
                  />
                </View>
                <Text className="text-xs text-muted dark:text-muted-dark mt-3 leading-5">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_FOOTNOTE)}
                </Text>
              </View>
            </View>
            <Text className="font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PHOTOS_TITLE)}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark mt-1 mb-3">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PHOTOS_HINT)}</Text>
            <TouchableOpacity
              onPress={pickPhotos}
              disabled={photos.length >= 3 || saving}
              className="bg-surface dark:bg-surface-dark rounded-lg py-3 items-center"
              style={{ opacity: photos.length >= 3 ? 0.5 : 1, minHeight: 44 }}
            >
              <Text className="text-primary font-semibold">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PICK_PHOTOS)}</Text>
            </TouchableOpacity>
            {uploadLabel ? (
              <Text className="text-xs text-muted dark:text-muted-dark mt-2">{uploadLabel}</Text>
            ) : null}
            <View className="flex-row flex-wrap gap-2 mt-3">
              {photos.map((photo, index) => (
                <View key={photo.uri} className="relative">
                  <Image source={{ uri: photo.uri }} className="w-24 h-24 rounded-lg" />
                  {index === 0 ? (
                    <View className="absolute left-1 top-1 px-1.5 py-0.5 rounded bg-primary">
                      <Text className="font-bold text-white" style={{ fontSize: theme.typography.trip.caption }}>{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_COVER)}</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => setPhotos((current) => current.filter((item) => item.uri !== photo.uri))}
                    accessibilityLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_REMOVE_PHOTO)}
                    className="absolute right-1 top-1 w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </KeyboardAwareScroll>

        {keyboardOpen ? null : (
        <View className="px-4 pt-2 pb-3 border-t border-border dark:border-border-dark bg-background dark:bg-background-dark">
          {step > 0 ? (
            <Text className="font-semibold text-text dark:text-text-dark mb-1" style={{ fontSize: theme.typography.trip.caption, minHeight: 16 }}>
              {budgetNumber > 0
                ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PLANNED_FOOTER, { amount: formatTaka(liveTotal) })
                : ' '}
            </Text>
          ) : null}
          {tabNotice ? (
            <Text className="text-error mb-2" style={{ fontSize: theme.typography.trip.caption }}>{tabNotice}</Text>
          ) : null}
          <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => (step === 0 ? onCancel() : setStep((current) => current - 1))}
            className="flex-1 py-3 rounded-lg items-center bg-surface dark:bg-surface-dark"
            style={{ minHeight: 44 }}
          >
            <Text className="font-semibold text-text dark:text-text-dark">
              {step === 0 ? t(TRANSLATION_KEYS.COMMON.CANCEL) : t(TRANSLATION_KEYS.COMMON.BACK)}
            </Text>
          </TouchableOpacity>
          {step < 2 ? (
            <TouchableOpacity
              onPress={goNext}
              className="flex-1 py-3 rounded-lg items-center bg-primary"
              style={{ minHeight: 44, opacity: (step === 0 && detailsReason) || (step === 1 && itineraryReason) ? 0.55 : 1 }}
            >
              <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CONTINUE)}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={savePlan}
              disabled={saving}
              className="flex-1 py-3 rounded-lg items-center bg-primary"
              style={{ minHeight: 44, opacity: saving || detailsReason || itineraryReason ? 0.55 : 1 }}
            >
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
        </View>
        )}

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
          budget={budgetNumber}
          otherStops={stops.filter((stop) => stop.id !== editor.id)}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
        />
      ) : null}
      <CostBreakdownSheet
        visible={breakdownOpen}
        summary={{
          planned: liveTotal,
          budget: budgetNumber,
          stays: totals.byCategory.stays,
          activities: totals.byCategory.activities,
          days: duration,
          byDay: totals.byDay,
          stops: pricedStops,
          estimate: totals.source === 'estimate',
        }}
        onClose={() => setBreakdownOpen(false)}
        onSelectDay={selectDayFromList}
      />
      <DayDetailsSheet
        visible={dayDetailsOpen}
        title={
          formatTripDayHeading(startDate, activeDay, true)
            ? t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_SUMMARY_TITLE, {
                day: activeDay,
                date: formatTripDayHeading(startDate, activeDay, true),
              })
            : t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: activeDay })
        }
        stopCount={dayStops.length}
        dayTotal={dayTotal}
        budget={budgetNumber}
        guideAmount={dailyAllowance(budgetNumber, duration)}
        stops={daySheetStops}
        emptyLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_EMPTY_DAY)}
        onClose={() => setDayDetailsOpen(false)}
        onEdit={() => setDayDetailsOpen(false)}
      />
      <Toast
        visible={removedStops != null}
        message={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_REMOVED)}
        actionLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_UNDO)}
        onAction={() => {
          if (removedStops) commitStops(removedStops);
          setRemovedStops(null);
        }}
        onDismiss={() => setRemovedStops(null)}
        duration={4000}
        placement="bottom"
        bottomOffset={keyboardOpen ? 24 : 96}
      />
      {showDate && Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide" onRequestClose={() => setShowDate(false)}>
          <View className="flex-1 justify-end">
            <TouchableOpacity className="flex-1" onPress={() => setShowDate(false)} />
            <View className="bg-surface dark:bg-surface-dark rounded-t-3xl px-4 pt-3 pb-8">
              <View className="flex-row justify-end mb-2">
                <TouchableOpacity onPress={() => setShowDate(false)} style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text className="text-base font-semibold text-primary">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DATE_DONE)}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={startDate ? new Date(`${startDate}T00:00:00`) : new Date()}
                mode="date"
                display="spinner"
                minimumDate={startOfToday()}
                onChange={(_, date) => {
                  if (date) setStartDate(toDateInputValue(date));
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
      {cloning ? (
        <View
          className="absolute left-0 right-0 top-0 bottom-0 z-20 items-center justify-center"
          style={{ backgroundColor: 'rgba(12,12,15,0.45)' }}
        >
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : null}
    </View>
  );
}

function MoneyRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className={`text-sm flex-1 pr-3 ${strong ? 'font-semibold text-text dark:text-text-dark' : 'text-muted dark:text-muted-dark'}`}>
        {label}
      </Text>
      {value ? (
        <Text className={`text-sm ${strong ? 'font-semibold text-text dark:text-text-dark' : 'text-text dark:text-text-dark'}`}>
          {value}
        </Text>
      ) : null}
    </View>
  );
}

function Question({
  number,
  title,
  hint,
  error,
  children,
  onRegisterOffset,
}: {
  number: number;
  title: string;
  hint?: string;
  error?: string;
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
          <Text className="font-semibold text-text dark:text-text-dark" style={{ fontSize: theme.typography.trip.cardTitle }}>{title}</Text>
          {hint ? <Text className="text-muted dark:text-muted-dark mt-1 mb-3" style={{ fontSize: theme.typography.trip.caption, lineHeight: 16 }}>{hint}</Text> : null}
          {children}
          {error ? <Text className="text-xs text-error mt-2">{error}</Text> : null}
        </View>
      </View>
    </View>
  );
}
