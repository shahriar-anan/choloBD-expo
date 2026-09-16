/**
 * Personal Tour Package Form Component
 * Multi-step form for creating/editing custom/personal tour packages
 * Adapted from frontend CustomTourPackageForm.tsx for React Native
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { HotelType, TransportServiceType, TourType } from '../../types/enums';
import { StepIndicator } from './StepIndicator';
import { PersonalTourStopCard } from './PersonalTourStopCard';
import { TourImageUpload } from './TourImageUpload';
import {
  PersonalTourSegmentRow,
  formatTaka,
  toTitle,
  enumToOptions,
  mapSpotOptions,
  createBlankSegment,
  clampDayNumber,
  clampDaySegmentsToDuration,
  nextSegmentOrderForDay,
  countStopsForDay,
  isDayAtStopLimit,
  missingDurationDays,
  getDetailsContinueReason,
  getItineraryContinueReason,
  getOverBudgetReason,
  groupStopsByDay,
  applyOvernightHotelToLastStop,
  collectVisitSpotNames,
  sumStopTotals,
  toDateInputValue,
  inferEndDate,
  formatDisplayDate,
  getStopTotal,
  MAX_STOPS_PER_DAY,
} from './utils';
import type { Location } from '../../types/locations';

/** Minimal spot shape accepted from API list projections or full domain types */
interface SpotListItem {
  id: string;
  name: string;
  locationId?: string;
  locationName?: string;
  location?: string | { id?: string; name?: string };
}

interface PersonalTourPackageFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  locations: Location[];
  tourSpots: SpotListItem[];
  activitySpots: SpotListItem[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const FORM_STEPS = [
  { id: 'details', label: 'Details', icon: 'information-circle' as const },
  { id: 'itinerary', label: 'Itinerary', icon: 'map' as const },
  { id: 'review', label: 'Review', icon: 'checkmark-circle' as const },
];

export function PersonalTourPackageForm({
  mode,
  initialData,
  locations,
  tourSpots,
  activitySpots,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PersonalTourPackageFormProps) {
  const { isDark } = useTheme();

  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const bgColor = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;

  const [formStep, setFormStep] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [divisionModalVisible, setDivisionModalVisible] = useState(false);
  const [tourTypeModalVisible, setTourTypeModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);

  // Form state
  const [packageName, setPackageName] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const [division, setDivision] = useState('');
  const [divisionLocationId, setDivisionLocationId] = useState('');
  const [tourType, setTourType] = useState<TourType | ''>('');
  const [duration, setDuration] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [daySegments, setDaySegments] = useState<PersonalTourSegmentRow[]>([]);
  const [draftSegment, setDraftSegment] = useState<PersonalTourSegmentRow | null>(null);
  const [activeDayNumber, setActiveDayNumber] = useState<number | null>(null);
  const [tourImages, setTourImages] = useState<Array<{ url: string; publicId?: string }>>([]);

  // Options
  const divisionList = useMemo(
    () => locations.filter((loc) => loc.locationType === 'DIVISION'),
    [locations]
  );

  const tourTypeOptions = useMemo(
    () => enumToOptions(TourType as any, '-- Select a tour type --'),
    []
  );

  const transportOptions = useMemo(
    () => enumToOptions(TransportServiceType as any, '-- Select transport --'),
    []
  );

  const hotelOptions = useMemo(
    () => enumToOptions(HotelType as any, '-- Select hotel --'),
    []
  );

  const durationOptions = useMemo(() => {
    return Array.from({ length: 14 }, (_, idx) => idx + 1).map((d) => ({
      label: `${d} day${d > 1 ? 's' : ''}`,
      value: String(d),
    }));
  }, []);

  // Filter spots by division
  const [filteredTourSpots, setFilteredTourSpots] = useState<SpotListItem[]>([]);
  const [filteredActivitySpots, setFilteredActivitySpots] = useState<SpotListItem[]>([]);

  useEffect(() => {
    if (!divisionLocationId) {
      setFilteredTourSpots([]);
      setFilteredActivitySpots([]);
      return;
    }

    const districts = locations.filter(
      (loc) => loc.locationType === 'DISTRICT' && loc.parentLocationId === divisionLocationId
    );
    const districtIds = new Set(districts.map((d) => d.id));

    const spotMatchesDistrict = (spot: SpotListItem) => {
      const locationId =
        spot.locationId ||
        (typeof spot.location === 'object' ? spot.location?.id : undefined);
      return locationId ? districtIds.has(locationId) : false;
    };

    setFilteredTourSpots(tourSpots.filter(spotMatchesDistrict));
    setFilteredActivitySpots(activitySpots.filter(spotMatchesDistrict));
  }, [divisionLocationId, locations, tourSpots, activitySpots]);

  const tourSpotOptions = useMemo(
    () => mapSpotOptions('-- Select a tour spot --', filteredTourSpots),
    [filteredTourSpots]
  );

  const activitySpotOptions = useMemo(
    () => mapSpotOptions('-- Select activities --', filteredActivitySpots),
    [filteredActivitySpots]
  );

  // Load initial data for edit mode
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setPackageName(initialData.packageName || '');
      setTotalBudget(initialData.estimatedBudget || initialData.totalBudget || 0);
      setDivision(initialData.location?.name || '');
      setDivisionLocationId(initialData.locationId || '');
      setTourType(initialData.tourType || '');
      setDuration(initialData.duration || 0);
      setStartDate(toDateInputValue(initialData.startDate));
      setShortDescription(initialData.shortDescription || '');
      setDaySegments(
        clampDaySegmentsToDuration(
          initialData.daySegments?.map((seg: any) => ({
            id: seg.id || `segment-${Date.now()}-${Math.random()}`,
            dayNumber: seg.dayNumber,
            segmentOrder: seg.segmentOrder || 1,
            shortDescription: seg.shortDescription || '',
            tourSpotId: seg.tourSpotId || '',
            activitySpotId: seg.activitySpotId || '',
            transportOption: (seg.transportOption || '') as TransportServiceType | '',
            hotelOption: (seg.hotelOption || '') as HotelType | '',
            hotelId: seg.hotelId || '',
            activityCost: 0,
            hotelCost: 0,
            notes: seg.notes || '',
          })) || [],
          initialData.duration || 0
        )
      );
    }
  }, [initialData, mode]);

  // Computed values
  const inferredEndDate = useMemo(
    () => inferEndDate(startDate, duration),
    [startDate, duration]
  );

  const visibleDaySegments = useMemo(
    () =>
      clampDaySegmentsToDuration(daySegments, duration).sort(
        (a, b) => a.dayNumber - b.dayNumber || a.segmentOrder - b.segmentOrder
      ),
    [daySegments, duration]
  );

  const computedPackageTotal = useMemo(
    () => sumStopTotals(visibleDaySegments),
    [visibleDaySegments]
  );

  const stopsByDay = useMemo(() => groupStopsByDay(visibleDaySegments), [visibleDaySegments]);

  const visitSpotNames = useMemo(
    () => collectVisitSpotNames(visibleDaySegments, filteredTourSpots),
    [visibleDaySegments, filteredTourSpots]
  );

  const daysMissingStops = useMemo(
    () => missingDurationDays(daySegments, duration),
    [daySegments, duration]
  );

  // Validation
  const canContinueStep1 =
    packageName.trim() !== '' &&
    totalBudget > 0 &&
    division !== '' &&
    divisionLocationId !== '' &&
    tourType !== '' &&
    duration > 0 &&
    startDate !== '' &&
    !!inferredEndDate &&
    shortDescription.trim() !== '';

  const canContinueStep2 =
    daysMissingStops.length === 0 &&
    daySegments.length > 0 &&
    daySegments.every(
      (seg) => seg.tourSpotId.trim() !== '' && seg.shortDescription.trim().length >= 2
    ) &&
    !(totalBudget > 0 && computedPackageTotal > totalBudget);

  const canSaveForm = canContinueStep1 && canContinueStep2;

  const continueDisabledReason =
    formStep === 0
      ? getDetailsContinueReason({
          packageName,
          totalBudget,
          division,
          tourType,
          duration,
          shortDescription,
          startDate,
        })
      : getItineraryContinueReason(
          daySegments,
          duration,
          daysMissingStops,
          computedPackageTotal,
          totalBudget
        );

  // Initialize draft segment when duration changes
  useEffect(() => {
    if (duration > 0 && !draftSegment) {
      const defaultDay = 1;
      setDraftSegment(createBlankSegment(defaultDay, nextSegmentOrderForDay(daySegments, defaultDay)));
    }
  }, [duration, draftSegment, daySegments]);

  // Handlers
  const handleAddSegment = () => {
    if (!draftSegment) {
      Alert.alert('Error', 'Please fill in the segment details.');
      return;
    }
    if (!draftSegment.tourSpotId.trim()) {
      Alert.alert('Error', 'Please select a tour spot for this segment.');
      return;
    }
    if (draftSegment.shortDescription.trim().length < 2) {
      Alert.alert('Error', 'Please enter a short description for this day segment.');
      return;
    }
    if (isDayAtStopLimit(daySegments, draftSegment.dayNumber)) {
      Alert.alert('Error', `Day ${draftSegment.dayNumber} already has ${MAX_STOPS_PER_DAY} stops.`);
      return;
    }

    const projectedTotal = computedPackageTotal + getStopTotal(draftSegment);
    const overBudgetReason = getOverBudgetReason(projectedTotal, totalBudget);
    if (overBudgetReason) {
      Alert.alert('Budget Warning', overBudgetReason);
      return;
    }

    const dayNumber = clampDayNumber(draftSegment.dayNumber, duration);
    const segmentOrder = nextSegmentOrderForDay(daySegments, dayNumber);
    const added = { ...draftSegment, dayNumber, segmentOrder };

    setDaySegments(applyOvernightHotelToLastStop([...daySegments, added]));
    setActiveDayNumber(dayNumber);

    // Create new draft for the same day
    setDraftSegment(
      createBlankSegment(dayNumber, nextSegmentOrderForDay([...daySegments, added], dayNumber))
    );
  };

  const handleSubmit = () => {
    if (!canSaveForm) {
      Alert.alert('Form Incomplete', 'Please complete all required fields before submitting.');
      return;
    }

    const payload = {
      packageName: packageName.trim(),
      totalBudget,
      estimatedBudget: totalBudget,
      shortDescription: shortDescription.trim(),
      tourType,
      locationId: divisionLocationId,
      startDate,
      endDate: inferredEndDate,
      daySegments: applyOvernightHotelToLastStop(daySegments).map((seg) => ({
        dayNumber: seg.dayNumber,
        segmentOrder: seg.segmentOrder,
        shortDescription: seg.shortDescription.trim(),
        tourSpotId: seg.tourSpotId,
        activitySpotId: seg.activitySpotId || undefined,
        transportOption: seg.transportOption || undefined,
        hotelOption: seg.hotelOption || undefined,
        hotelId: seg.hotelId || undefined,
        notes: seg.notes.trim() || undefined,
        estimatedCost: (seg.activityCost || 0) + (seg.hotelCost || 0),
      })),
    };

    onSubmit(payload);
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <StepIndicator
        steps={FORM_STEPS}
        currentStep={formStep}
        onStepPress={(index) => {
          if (index > formStep) return;
          if (index >= 2 && !canContinueStep2) return;
          setFormStep(index);
        }}
      />

      <ScrollView className="flex-1 px-4 pb-6">
        {/* Step 1: Package Details */}
        {formStep === 0 && (
          <View>
            <Text style={{ color: textColor }} className="text-xl font-bold mb-2">
              Package Details
            </Text>
            <Text style={{ color: mutedColor }} className="text-sm mb-6">
              Basic information about your custom tour package
            </Text>

            {/* Package Name */}
            <View className="mb-4">
              <Text style={{ color: mutedColor }} className="text-xs font-semibold mb-1.5">
                PACKAGE NAME *
              </Text>
              <TextInput
                style={{
                  backgroundColor: surfaceColor,
                  borderColor: !packageName.trim() ? errorColor : borderColor,
                  color: textColor,
                }}
                className="px-4 py-3 rounded-lg border"
                placeholder="e.g. Cox's Bazar Weekend Getaway"
                placeholderTextColor={mutedColor}
                value={packageName}
                onChangeText={setPackageName}
              />
            </View>

            {/* Total Budget */}
            <View className="mb-4">
              <Text style={{ color: mutedColor }} className="text-xs font-semibold mb-1.5">
                ESTIMATED TOTAL COST *
              </Text>
              <TextInput
                style={{
                  backgroundColor: surfaceColor,
                  borderColor: totalBudget <= 0 ? errorColor : borderColor,
                  color: textColor,
                }}
                className="px-4 py-3 rounded-lg border"
                placeholder="e.g. 15000"
                placeholderTextColor={mutedColor}
                keyboardType="numeric"
                value={totalBudget ? String(totalBudget) : ''}
                onChangeText={(text) => setTotalBudget(text ? Number(text) : 0)}
              />
              {totalBudget > 0 && (
                <Text style={{ color: successColor }} className="text-sm mt-1 font-semibold">
                  {formatTaka(totalBudget)}
                </Text>
              )}
            </View>

            {/* Division */}
            <View className="mb-4">
              <Text style={{ color: mutedColor }} className="text-xs font-semibold mb-1.5">
                DIVISION *
              </Text>
              <TouchableOpacity
                onPress={() => setDivisionModalVisible(true)}
                style={{
                  backgroundColor: surfaceColor,
                  borderColor: !division ? errorColor : borderColor,
                }}
                className="px-4 py-3 rounded-lg border flex-row items-center justify-between"
              >
                <Text style={{ color: division ? textColor : mutedColor }} numberOfLines={1}>
                  {division || 'Select a division'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={mutedColor} />
              </TouchableOpacity>
            </View>

            {/* Tour Type */}
            <View className="mb-4">
              <Text style={{ color: mutedColor }} className="text-xs font-semibold mb-1.5">
                TOUR TYPE *
              </Text>
              <TouchableOpacity
                onPress={() => setTourTypeModalVisible(true)}
                style={{
                  backgroundColor: surfaceColor,
                  borderColor: !tourType ? errorColor : borderColor,
                }}
                className="px-4 py-3 rounded-lg border flex-row items-center justify-between"
              >
                <Text style={{ color: tourType ? textColor : mutedColor }} numberOfLines={1}>
                  {tourType ? toTitle(tourType) : 'Select a tour type'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={mutedColor} />
              </TouchableOpacity>
            </View>

            {/* Duration */}
            {division && tourType && (
              <View className="mb-4">
                <Text style={{ color: mutedColor }} className="text-xs font-semibold mb-1.5">
                  DURATION (DAYS) *
                </Text>
                <TouchableOpacity
                  onPress={() => setDurationModalVisible(true)}
                  style={{
                    backgroundColor: surfaceColor,
                    borderColor: duration <= 0 ? errorColor : borderColor,
                  }}
                  className="px-4 py-3 rounded-lg border flex-row items-center justify-between"
                >
                  <Text style={{ color: duration ? textColor : mutedColor }} numberOfLines={1}>
                    {duration ? `${duration} day${duration > 1 ? 's' : ''}` : 'Select duration'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={mutedColor} />
                </TouchableOpacity>
              </View>
            )}

            {/* Start Date */}
            {duration > 0 && (
              <View className="mb-4">
                <Text style={{ color: mutedColor }} className="text-xs font-semibold mb-1.5">
                  START DATE *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    backgroundColor: surfaceColor,
                    borderColor: !startDate ? errorColor : borderColor,
                  }}
                  className="px-4 py-3 rounded-lg border flex-row items-center justify-between"
                >
                  <Text style={{ color: startDate ? textColor : mutedColor }}>
                    {startDate ? formatDisplayDate(startDate) : 'Select start date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={mutedColor} />
                </TouchableOpacity>
                {startDate && inferredEndDate && (
                  <Text style={{ color: mutedColor }} className="text-sm mt-1">
                    End date: <Text style={{ color: textColor }}>{formatDisplayDate(inferredEndDate)}</Text>
                  </Text>
                )}
              </View>
            )}

            {/* Short Description */}
            {duration > 0 && (
              <View className="mb-4">
                <Text style={{ color: mutedColor }} className="text-xs font-semibold mb-1.5">
                  SHORT DESCRIPTION *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: surfaceColor,
                    borderColor: !shortDescription.trim() ? errorColor : borderColor,
                    color: textColor,
                  }}
                  className="px-4 py-3 rounded-lg border min-h-[100px]"
                  placeholder="A brief summary of what travelers can expect..."
                  placeholderTextColor={mutedColor}
                  multiline
                  numberOfLines={4}
                  value={shortDescription}
                  onChangeText={setShortDescription}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>
        )}

        {/* Step 2: Itinerary */}
        {formStep === 1 && (
          <View>
            <Text style={{ color: textColor }} className="text-xl font-bold mb-2">
              Build Itinerary
            </Text>
            <Text style={{ color: mutedColor }} className="text-sm mb-2">
              Add stops for each day of your {duration}-day tour
            </Text>
            <View className="flex-row items-center mb-6 p-3 rounded-lg" style={{ backgroundColor: surfaceColor }}>
              <Ionicons name="information-circle" size={20} color={primaryColor} />
              <Text style={{ color: mutedColor }} className="ml-2 flex-1 text-xs">
                Total: <Text style={{ color: successColor, fontWeight: '600' }}>{formatTaka(computedPackageTotal)}</Text>
                {' / '}Budget: <Text style={{ color: textColor, fontWeight: '600' }}>{formatTaka(totalBudget)}</Text>
              </Text>
            </View>

            {/* Existing Stops by Day */}
            {stopsByDay.map(([dayNumber, stops]) => (
              <View key={dayNumber} className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text style={{ color: textColor }} className="text-lg font-bold">
                    Day {dayNumber}
                  </Text>
                  <Text style={{ color: mutedColor }} className="text-sm">
                    {stops.length} stop{stops.length > 1 ? 's' : ''}
                  </Text>
                </View>
                {stops.map((stop, stopIndex) => (
                  <PersonalTourStopCard
                    key={stop.id}
                    stop={stop}
                    stopNumber={stopIndex + 1}
                    isLastOfDay={stopIndex === stops.length - 1}
                    tourSpotOptions={tourSpotOptions}
                    activitySpotOptions={activitySpotOptions}
                    transportOptions={transportOptions}
                    hotelOptions={hotelOptions}
                    canMoveUp={stopIndex > 0}
                    canMoveDown={stopIndex < stops.length - 1}
                    onChange={(updated) => {
                      setDaySegments((prev) =>
                        prev.map((seg) => (seg.id === stop.id ? updated : seg))
                      );
                    }}
                    onDelete={() => {
                      setDaySegments((prev) => prev.filter((seg) => seg.id !== stop.id));
                    }}
                    onMoveUp={
                      stopIndex > 0
                        ? () => {
                            const newSegments = [...daySegments];
                            const idx = newSegments.findIndex((s) => s.id === stop.id);
                            const prevIdx = idx - 1;
                            if (prevIdx >= 0) {
                              [newSegments[idx], newSegments[prevIdx]] = [
                                newSegments[prevIdx],
                                newSegments[idx],
                              ];
                              setDaySegments(
                                applyOvernightHotelToLastStop(
                                  newSegments.map((s, i) => ({ ...s, segmentOrder: i + 1 }))
                                )
                              );
                            }
                          }
                        : undefined
                    }
                    onMoveDown={
                      stopIndex < stops.length - 1
                        ? () => {
                            const newSegments = [...daySegments];
                            const idx = newSegments.findIndex((s) => s.id === stop.id);
                            const nextIdx = idx + 1;
                            if (nextIdx < newSegments.length) {
                              [newSegments[idx], newSegments[nextIdx]] = [
                                newSegments[nextIdx],
                                newSegments[idx],
                              ];
                              setDaySegments(
                                applyOvernightHotelToLastStop(
                                  newSegments.map((s, i) => ({ ...s, segmentOrder: i + 1 }))
                                )
                              );
                            }
                          }
                        : undefined
                    }
                  />
                ))}
              </View>
            ))}

            {/* Add New Stop */}
            {draftSegment && (
              <View className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: surfaceColor, borderColor: primaryColor }}>
                <Text style={{ color: textColor }} className="text-lg font-bold mb-3">
                  Add New Stop
                </Text>

                {/* Day Number Picker */}
                <View className="mb-3">
                  <Text style={{ color: mutedColor }} className="text-xs font-semibold mb-1.5">
                    DAY NUMBER *
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {Array.from({ length: duration }, (_, i) => i + 1).map((day) => {
                      const isSelected = draftSegment.dayNumber === day;
                      const dayStopCount = countStopsForDay(daySegments, day);
                      const isFull = dayStopCount >= MAX_STOPS_PER_DAY;
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => {
                            if (!isFull) {
                              setDraftSegment({
                                ...draftSegment,
                                dayNumber: day,
                                segmentOrder: nextSegmentOrderForDay(daySegments, day),
                              });
                            }
                          }}
                          disabled={isFull}
                          style={{
                            backgroundColor: isSelected ? primaryColor : isFull ? mutedColor + '20' : surfaceColor,
                            borderColor: isSelected ? primaryColor : borderColor,
                            opacity: isFull ? 0.5 : 1,
                          }}
                          className="px-4 py-2 rounded-lg border"
                        >
                          <Text style={{ color: isSelected ? '#fff' : textColor }} className="font-semibold">
                            Day {day}
                          </Text>
                          {dayStopCount > 0 && (
                            <Text style={{ color: isSelected ? '#fff' : mutedColor }} className="text-xs">
                              {dayStopCount}/{MAX_STOPS_PER_DAY}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Draft Stop Card */}
                <PersonalTourStopCard
                  stop={draftSegment}
                  stopNumber={countStopsForDay(daySegments, draftSegment.dayNumber) + 1}
                  isLastOfDay={true}
                  tourSpotOptions={tourSpotOptions}
                  activitySpotOptions={activitySpotOptions}
                  transportOptions={transportOptions}
                  hotelOptions={hotelOptions}
                  canMoveUp={false}
                  canMoveDown={false}
                  onChange={setDraftSegment}
                  onDelete={() => {
                    setDraftSegment(createBlankSegment(draftSegment.dayNumber, nextSegmentOrderForDay(daySegments, draftSegment.dayNumber)));
                  }}
                />

                <TouchableOpacity
                  onPress={handleAddSegment}
                  style={{ backgroundColor: primaryColor }}
                  className="mt-3 py-3 rounded-lg items-center flex-row justify-center gap-2"
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text className="text-white font-bold text-base">Add This Stop</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Missing Days Warning */}
            {daysMissingStops.length > 0 && (
              <View className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: errorColor + '10', borderColor: errorColor }}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="alert-circle" size={18} color={errorColor} />
                  <Text style={{ color: errorColor }} className="flex-1 text-sm font-semibold">
                    Missing stops for: Day {daysMissingStops.join(', Day ')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Step 3: Review */}
        {formStep === 2 && (
          <View>
            <Text style={{ color: textColor }} className="text-xl font-bold mb-2">
              Review & Submit
            </Text>
            <Text style={{ color: mutedColor }} className="text-sm mb-6">
              Review your tour package before submitting
            </Text>

            {/* Package Summary */}
            <View className="mb-4 p-4 rounded-xl" style={{ backgroundColor: surfaceColor }}>
              <Text style={{ color: textColor }} className="text-lg font-bold mb-3">
                {packageName}
              </Text>
              <View className="gap-2">
                <View className="flex-row">
                  <Text style={{ color: mutedColor }} className="text-sm w-24">
                    Duration:
                  </Text>
                  <Text style={{ color: textColor }} className="text-sm font-semibold">
                    {duration} day{duration > 1 ? 's' : ''}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text style={{ color: mutedColor }} className="text-sm w-24">
                    Tour Type:
                  </Text>
                  <Text style={{ color: textColor }} className="text-sm font-semibold">
                    {toTitle(tourType)}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text style={{ color: mutedColor }} className="text-sm w-24">
                    Division:
                  </Text>
                  <Text style={{ color: textColor }} className="text-sm font-semibold">
                    {division}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text style={{ color: mutedColor }} className="text-sm w-24">
                    Dates:
                  </Text>
                  <Text style={{ color: textColor }} className="text-sm font-semibold">
                    {formatDisplayDate(startDate)} - {formatDisplayDate(inferredEndDate)}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text style={{ color: mutedColor }} className="text-sm w-24">
                    Visits:
                  </Text>
                  <Text style={{ color: textColor }} className="text-sm font-semibold">
                    {visitSpotNames.join(', ')}
                  </Text>
                </View>
                <View className="flex-row mt-2 pt-2 border-t" style={{ borderColor: borderColor }}>
                  <Text style={{ color: mutedColor }} className="text-sm w-24">
                    Total:
                  </Text>
                  <Text style={{ color: successColor }} className="text-base font-bold">
                    {formatTaka(computedPackageTotal)}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text style={{ color: mutedColor }} className="text-sm w-24">
                    Budget:
                  </Text>
                  <Text style={{ color: textColor }} className="text-base font-bold">
                    {formatTaka(totalBudget)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-4 p-4 rounded-xl" style={{ backgroundColor: surfaceColor }}>
              <Text style={{ color: mutedColor }} className="text-sm">
                {shortDescription}
              </Text>
            </View>

            {/* Image Upload */}
            <View className="mb-4">
              <TourImageUpload
                tourId={mode === 'edit' ? initialData?.id : undefined}
                initialImages={initialData?.images || []}
                onImagesChange={setTourImages}
                maxImages={5}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-4 pb-6 pt-3 border-t" style={{ backgroundColor: surfaceColor, borderColor: borderColor }}>
        {continueDisabledReason && formStep < 2 && (
          <View className="mb-3 p-3 rounded-lg" style={{ backgroundColor: mutedColor + '20' }}>
            <Text style={{ color: mutedColor }} className="text-xs">
              {continueDisabledReason}
            </Text>
          </View>
        )}

        <View className="flex-row gap-3">
          {formStep > 0 && (
            <TouchableOpacity
              onPress={() => setFormStep((prev) => Math.max(prev - 1, 0))}
              style={{ borderColor: primaryColor }}
              className="flex-1 py-3 rounded-lg border items-center"
              disabled={isSubmitting}
            >
              <Text style={{ color: primaryColor }} className="font-bold text-base">
                Back
              </Text>
            </TouchableOpacity>
          )}

          {formStep < 2 ? (
            <TouchableOpacity
              onPress={() => {
                if (formStep === 0 && !canContinueStep1) {
                  Alert.alert('Incomplete', 'Please complete all required fields.');
                  return;
                }
                if (formStep === 1 && !canContinueStep2) {
                  Alert.alert('Incomplete', continueDisabledReason || 'Please complete the itinerary.');
                  return;
                }
                setFormStep((prev) => Math.min(prev + 1, 2));
              }}
              style={{ backgroundColor: primaryColor, opacity: formStep === 0 ? (!canContinueStep1 ? 0.5 : 1) : (!canContinueStep2 ? 0.5 : 1) }}
              className="flex-1 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-bold text-base">Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              style={{ backgroundColor: successColor, opacity: isSubmitting || !canSaveForm ? 0.5 : 1 }}
              className="flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2"
              disabled={isSubmitting || !canSaveForm}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white font-bold text-base">Saving...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                  <Text className="text-white font-bold text-base">
                    {mode === 'create' ? 'Create Tour' : 'Save Changes'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onCancel}
            style={{ borderColor: errorColor }}
            className="py-3 px-4 rounded-lg border items-center"
            disabled={isSubmitting}
          >
            <Text style={{ color: errorColor }} className="font-bold text-base">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={startDate ? new Date(startDate + 'T00:00:00') : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setStartDate(toDateInputValue(selectedDate));
            }
          }}
        />
      )}

      {/* Division Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={divisionModalVisible}
        onRequestClose={() => setDivisionModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="flex-1 justify-end">
            <View style={{ backgroundColor: surfaceColor }} className="rounded-t-2xl max-h-96">
              <View className="p-4 border-b" style={{ borderColor: borderColor }}>
                <View className="flex-row items-center justify-between">
                  <Text style={{ color: textColor }} className="text-lg font-bold">
                    Select Division
                  </Text>
                  <TouchableOpacity onPress={() => setDivisionModalVisible(false)}>
                    <Ionicons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView className="p-4">
                {divisionList.map((div) => {
                  const isSelected = div.id === divisionLocationId;
                  return (
                    <TouchableOpacity
                      key={div.id}
                      onPress={() => {
                        setDivision(div.name);
                        setDivisionLocationId(div.id);
                        setDivisionModalVisible(false);
                      }}
                      style={{
                        backgroundColor: isSelected ? primaryColor + '20' : 'transparent',
                      }}
                      className="py-3 px-4 rounded-lg mb-2 flex-row items-center justify-between"
                    >
                      <Text
                        style={{
                          color: isSelected ? primaryColor : textColor,
                          fontWeight: isSelected ? '600' : '400',
                        }}
                      >
                        {div.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tour Type Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={tourTypeModalVisible}
        onRequestClose={() => setTourTypeModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="flex-1 justify-end">
            <View style={{ backgroundColor: surfaceColor }} className="rounded-t-2xl max-h-96">
              <View className="p-4 border-b" style={{ borderColor: borderColor }}>
                <View className="flex-row items-center justify-between">
                  <Text style={{ color: textColor }} className="text-lg font-bold">
                    Select Tour Type
                  </Text>
                  <TouchableOpacity onPress={() => setTourTypeModalVisible(false)}>
                    <Ionicons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView className="p-4">
                {tourTypeOptions.map((option) => {
                  if (!option.value) return null;
                  const isSelected = option.value === tourType;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setTourType(option.value as TourType);
                        setTourTypeModalVisible(false);
                      }}
                      style={{
                        backgroundColor: isSelected ? primaryColor + '20' : 'transparent',
                      }}
                      className="py-3 px-4 rounded-lg mb-2 flex-row items-center justify-between"
                    >
                      <Text
                        style={{
                          color: isSelected ? primaryColor : textColor,
                          fontWeight: isSelected ? '600' : '400',
                        }}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Duration Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={durationModalVisible}
        onRequestClose={() => setDurationModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="flex-1 justify-end">
            <View style={{ backgroundColor: surfaceColor }} className="rounded-t-2xl max-h-96">
              <View className="p-4 border-b" style={{ borderColor: borderColor }}>
                <View className="flex-row items-center justify-between">
                  <Text style={{ color: textColor }} className="text-lg font-bold">
                    Select Duration
                  </Text>
                  <TouchableOpacity onPress={() => setDurationModalVisible(false)}>
                    <Ionicons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView className="p-4">
                {durationOptions.map((option) => {
                  const isSelected = Number(option.value) === duration;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        const newDuration = Number(option.value);
                        setDuration(newDuration);
                        setDaySegments((prev) => clampDaySegmentsToDuration(prev, newDuration));
                        setDurationModalVisible(false);
                      }}
                      style={{
                        backgroundColor: isSelected ? primaryColor + '20' : 'transparent',
                      }}
                      className="py-3 px-4 rounded-lg mb-2 flex-row items-center justify-between"
                    >
                      <Text
                        style={{
                          color: isSelected ? primaryColor : textColor,
                          fontWeight: isSelected ? '600' : '400',
                        }}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
