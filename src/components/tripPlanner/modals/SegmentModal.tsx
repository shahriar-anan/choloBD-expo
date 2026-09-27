/**
 * Segment Modal Component
 * Form for adding/editing trip segments (activities, accommodations, transport)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { HotelTypePreference, TransportTypePreference, UserSegment, CreateSegmentData, UpdateSegmentData } from '../../../types/trips';
import { TripPlan } from '../../../types/trips';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFetchActivitySpots, ActivitySpot } from '../../../hooks/useFetchActivitySpots';

interface SegmentModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  trip: TripPlan;
  dayNumber: number;
  existingSegment?: UserSegment; // For edit mode
  onClose: () => void;
  onSubmit: (data: CreateSegmentData | UpdateSegmentData) => Promise<void>;
  isSubmitting: boolean;
}

const HOTEL_TYPES: HotelTypePreference[] = ['RESORT', 'HOSTEL', 'BOUTIQUE', 'BUDGET', 'LUXURY', 'GUESTHOUSE', 'APARTMENT'];
const TRANSPORT_TYPES: TransportTypePreference[] = ['BUS', 'FLIGHT', 'TRAIN', 'CAR_RENTAL', 'FERRY', 'SELF_MANAGED'];

export function SegmentModal({
  visible,
  mode,
  trip,
  dayNumber,
  existingSegment,
  onClose,
  onSubmit,
  isSubmitting,
}: SegmentModalProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const backgroundColor = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;

  // Fetch activity spots for the trip location
  const { spots: activitySpots, isLoading: isLoadingSpots } = useFetchActivitySpots(trip?.primaryLocationId);

  // Form state
  const [startTime, setStartTime] = useState<string>(existingSegment?.startTime || '');
  const [endTime, setEndTime] = useState<string>(existingSegment?.endTime || '');
  const [notes, setNotes] = useState<string>(existingSegment?.customNotes || '');
  const [cost, setCost] = useState<string>(existingSegment?.estimatedCost?.toString() || '');
  const [selectedHotel, setSelectedHotel] = useState<HotelTypePreference | undefined>(
    existingSegment?.customHotel
  );
  const [selectedTransport, setSelectedTransport] = useState<TransportTypePreference | undefined>(
    existingSegment?.customTransport
  );
  const [selectedActivitySpot, setSelectedActivitySpot] = useState<ActivitySpot | undefined>(undefined);
  const [customActivityName, setCustomActivityName] = useState<string>(
    existingSegment?.customActivitySpotName || ''
  );
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showActivitySpotsList, setShowActivitySpotsList] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ==== TIME PICKER HANDLERS ====
  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartTimePicker(false);
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndTimePicker(false);
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      setEndTime(`${hours}:${minutes}`);
    }
  };

  // ==== VALIDATION ====
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Time validation
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      if (endMins <= startMins) {
        newErrors.time = t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_TIME_ERROR);
      }
    }

    // Cost validation
    if (cost && isNaN(Number(cost))) {
      newErrors.cost = t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_COST_ERROR);
    }

    // Custom activity name length validation
    if (customActivityName && (customActivityName.length < 2 || customActivityName.length > 500)) {
      newErrors.customActivityName = t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_NAME_ERROR);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==== SUBMIT ====
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_VALIDATION_ERROR), t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_VALIDATION_FAIL));
      return;
    }

    const costNum = cost ? Number(cost) : undefined;
    // Build activity fields: prefer selected spot (UUID link), fall back to custom text
    const activitySpotId = selectedActivitySpot?.id || undefined;
    const activitySpotName = !selectedActivitySpot && customActivityName.trim().length >= 2
      ? customActivityName.trim()
      : undefined;

    try {
      if (mode === 'add') {
        // Calculate next segmentOrder for this day
        const daySegments = trip.userSegments?.filter((s) => s.dayNumber === dayNumber) || [];
        const nextOrder = daySegments.length + 1;

        const description =
          notes.trim().length >= 2
            ? notes.trim()
            : customActivityName.trim().length >= 2
              ? customActivityName.trim()
              : `Day ${dayNumber} stop`;

        const payload: CreateSegmentData = {
          dayNumber,
          segmentOrder: nextOrder,
          shortDescription: description,
          customNotes: notes || undefined,
          customActivitySpotId: activitySpotId,
          customHotel: selectedHotel,
          customTransport: selectedTransport,
        };
        await onSubmit(payload);
      } else {
        // Edit mode
        const payload: UpdateSegmentData = {
          shortDescription:
            notes.trim().length >= 2
              ? notes.trim()
              : existingSegment?.shortDescription,
          customNotes: notes || undefined,
          customActivitySpotId: activitySpotId,
          customHotel: selectedHotel,
          customTransport: selectedTransport,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save segment');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Modal Overlay */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          disabled={isSubmitting}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal Content */}
        <View className="absolute bottom-0 left-0 right-0 bg-background dark:bg-background-dark rounded-t-2xl max-h-[90%]">
          <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-border dark:border-border-dark">
            <Text className="text-lg font-bold text-text dark:text-text-dark">
              {mode === 'add' ? t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ADD_TITLE) : t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_EDIT_TITLE)} - Day {dayNumber}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Feather name="x" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View className="p-6">
            {/* START TIME */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_START_TIME)}</Text>
              <TouchableOpacity
                onPress={() => setShowStartTimePicker(true)}
                className="flex-row items-center border rounded-lg px-4 py-3"
                style={{ borderColor, backgroundColor: surfaceColor, borderWidth: 1 }}
              >
                <Feather name="clock" size={16} color={primaryColor} />
                <TextInput
                  value={startTime}
                  placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_START_TIME_PLACEHOLDER)}
                  placeholderTextColor={mutedColor}
                  editable={false}
                  className="flex-1 ml-3 text-text dark:text-text-dark"
                />
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01 ${startTime || '09:00'}`)}
                  mode="time"
                  display="spinner"
                  onChange={handleStartTimeChange}
                />
              )}
            </View>

            {/* ACTIVITY SPOTS */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Feather name="map-pin" size={14} color={primaryColor} />
                <Text className="text-sm font-semibold text-text dark:text-text-dark ml-2">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_SPOT)}</Text>
              </View>
              
              {isLoadingSpots ? (
                <View className="flex-row items-center justify-center py-4">
                  <ActivityIndicator size="small" color={primaryColor} />
                  <Text className="ml-2 text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_LOADING)}</Text>
                </View>
              ) : activitySpots.length === 0 ? (
                <View className="py-4 px-4 rounded-lg" style={{ backgroundColor: surfaceColor }}>
                  <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_NONE)}</Text>
                </View>
              ) : (
                <View>
                  {/* Selected Activity Spot Display */}
                  {selectedActivitySpot && (
                    <View className="mb-3 p-3 rounded-lg border" style={{ borderColor: successColor, backgroundColor: isDark ? theme.colors['success-dark'] + '15' : theme.colors.success + '15' }}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-text dark:text-text-dark">{selectedActivitySpot.name}</Text>
                          {!!selectedActivitySpot.rating && (
                            <View className="flex-row items-center mt-1">
                              <Feather name="star" size={12} color={theme.colors.warning} />
                              <Text className="ml-1 text-xs text-muted dark:text-muted-dark">{selectedActivitySpot.rating.toFixed(1)} rating</Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity onPress={() => setSelectedActivitySpot(undefined)}>
                          <Feather name="x-circle" size={20} color={successColor} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  
                  {/* Activity Spots List Toggle */}
                  <TouchableOpacity
                    onPress={() => setShowActivitySpotsList(!showActivitySpotsList)}
                    className="flex-row items-center justify-between border rounded-lg px-4 py-3"
                    style={{ borderColor, backgroundColor: surfaceColor, borderWidth: 1 }}
                  >
                    <View className="flex-1">
                      <Text className="text-sm text-text dark:text-text-dark">
                        {selectedActivitySpot ? t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_CHANGE) : t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_CHOOSE)}
                      </Text>
                    </View>
                    <Feather name={showActivitySpotsList ? 'chevron-up' : 'chevron-down'} size={20} color={primaryColor} />
                  </TouchableOpacity>

                  {/* Activity Spots List */}
                  {showActivitySpotsList && (
                    <View className="mt-2 border rounded-lg overflow-hidden" style={{ borderColor, borderWidth: 1 }}>
                      <ScrollView 
                        nestedScrollEnabled
                        scrollEnabled={activitySpots.length > 4}
                        style={{ maxHeight: activitySpots.length > 4 ? 200 : undefined }}
                      >
                        {activitySpots.map((spot, index) => (
                          <TouchableOpacity
                            key={spot.id}
                            onPress={() => {
                              setSelectedActivitySpot(spot);
                              setCustomActivityName(''); // clear custom text when spot is selected
                              setShowActivitySpotsList(false);
                            }}
                            className="px-4 py-3"
                            style={{
                              borderBottomWidth: index !== activitySpots.length - 1 ? 1 : 0,
                              borderColor,
                              backgroundColor: selectedActivitySpot?.id === spot.id ? primaryColor + '15' : surfaceColor,
                            }}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <Text className={`text-sm font-medium ${selectedActivitySpot?.id === spot.id ? 'text-primary dark:text-primary-dark' : 'text-text dark:text-text-dark'}`}>
                                  {spot.name}
                                </Text>
                                {!!spot.rating && (
                                  <View className="flex-row items-center mt-1">
                                    <Feather name="star" size={11} color={theme.colors.warning} />
                                    <Text className="ml-1 text-xs text-muted dark:text-muted-dark">{spot.rating.toFixed(1)}</Text>
                                  </View>
                                )}
                              </View>
                              {selectedActivitySpot?.id === spot.id && (
                                <Feather name="check-circle" size={18} color={primaryColor} />
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* OR divider */}
                  <View className="flex-row items-center my-3">
                    <View className="flex-1 h-px bg-border dark:bg-border-dark" />
                    <Text className="mx-3 text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_OR)}</Text>
                    <View className="flex-1 h-px bg-border dark:bg-border-dark" />
                  </View>

                  {/* Custom Activity Name */}
                  <TextInput
                    value={customActivityName}
                    onChangeText={(text) => {
                      setCustomActivityName(text);
                      if (text.trim()) setSelectedActivitySpot(undefined); // clear spot when typing custom
                    }}
                    placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_PLACEHOLDER)}
                    placeholderTextColor={mutedColor}
                    className="border rounded-lg px-4 py-3 text-text dark:text-text-dark"
                    style={{ borderColor: errors.customActivityName ? theme.colors.error : borderColor, backgroundColor: surfaceColor, borderWidth: 1 }}
                  />
                  {errors.customActivityName && (
                    <Text className="text-xs text-error mt-1">{errors.customActivityName}</Text>
                  )}
                </View>
              )}

              {/* Custom activity name only (no spots available) */}
              {!isLoadingSpots && activitySpots.length === 0 && (
                <View>
                  <TextInput
                    value={customActivityName}
                    onChangeText={setCustomActivityName}
                    placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_PLACEHOLDER_EMPTY)}
                    placeholderTextColor={mutedColor}
                    className="border rounded-lg px-4 py-3 text-text dark:text-text-dark"
                    style={{ borderColor: errors.customActivityName ? theme.colors.error : borderColor, backgroundColor: surfaceColor, borderWidth: 1 }}
                  />
                  {errors.customActivityName && (
                    <Text className="text-xs text-error mt-1">{errors.customActivityName}</Text>
                  )}
                </View>
              )}

            </View>

            {/* END TIME */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_END_TIME)}</Text>
              <TouchableOpacity
                onPress={() => setShowEndTimePicker(true)}
                className="flex-row items-center border rounded-lg px-4 py-3"
                style={{ borderColor, backgroundColor: surfaceColor, borderWidth: 1 }}
              >
                <Feather name="clock" size={16} color={primaryColor} />
                <TextInput
                  value={endTime}
                  placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_END_TIME_PLACEHOLDER)}
                  placeholderTextColor={mutedColor}
                  editable={false}
                  className="flex-1 ml-3 text-text dark:text-text-dark"
                />
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01 ${endTime || '17:00'}`)}
                  mode="time"
                  display="spinner"
                  onChange={handleEndTimeChange}
                />
              )}
              {errors.time && (
                <Text className="text-xs text-error mt-1">{errors.time}</Text>
              )}
            </View>

            {/* NOTES */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_CUSTOM_NOTES)}</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_NOTES_PLACEHOLDER)}
                placeholderTextColor={mutedColor}
                multiline
                numberOfLines={3}
                className="border rounded-lg px-4 py-3 text-text dark:text-text-dark"
                style={{ borderColor, backgroundColor: surfaceColor, borderWidth: 1 }}
              />
            </View>

            {/* COST */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ESTIMATED_COST)}</Text>
              <View className="flex-row items-center border rounded-lg px-4 py-3" style={{ borderColor, backgroundColor: surfaceColor, borderWidth: 1 }}>
                <Feather name="dollar-sign" size={16} color={primaryColor} />
                <TextInput
                  value={cost}
                  onChangeText={setCost}
                  placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_COST_PLACEHOLDER)}
                  placeholderTextColor={mutedColor}
                  keyboardType="decimal-pad"
                  className="flex-1 ml-3 text-text dark:text-text-dark"
                />
              </View>
              {errors.cost && <Text className="text-xs text-error mt-1">{errors.cost}</Text>}
            </View>

            {/* HOTEL PREFERENCE */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Feather name="home" size={14} color={primaryColor} />
                <Text className="text-sm font-semibold text-text dark:text-text-dark ml-2">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_HOTEL_PREFERENCE)}</Text>
              </View>
              <View className="flex-row flex-wrap">
                {HOTEL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedHotel(selectedHotel === type ? undefined : type)}
                    className="px-3 py-2 rounded-full mr-2 mb-2"
                    style={{
                      backgroundColor: selectedHotel === type ? primaryColor : surfaceColor,
                      borderColor: selectedHotel === type ? primaryColor : borderColor,
                      borderWidth: 1,
                    }}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedHotel === type ? 'text-white' : 'text-text dark:text-text-dark'
                      }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* TRANSPORT PREFERENCE */}
            <View className="mb-8">
              <View className="flex-row items-center mb-2">
                <Feather name="truck" size={14} color={primaryColor} />
                <Text className="text-sm font-semibold text-text dark:text-text-dark ml-2">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_TRANSPORT_TYPE)}</Text>
              </View>
              <View className="flex-row flex-wrap">
                {TRANSPORT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedTransport(selectedTransport === type ? undefined : type)}
                    className="px-3 py-2 rounded-full mr-2 mb-2"
                    style={{
                      backgroundColor: selectedTransport === type ? primaryColor : surfaceColor,
                      borderColor: selectedTransport === type ? primaryColor : borderColor,
                      borderWidth: 1,
                    }}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedTransport === type ? 'text-white' : 'text-text dark:text-text-dark'
                      }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <View className="flex-row mb-6">
              <TouchableOpacity
                onPress={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-lg border mr-3"
                style={{ borderColor, backgroundColor: surfaceColor, borderWidth: 1 }}
              >
                <Text className="text-center font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_CANCEL_BTN)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-lg bg-primary"
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
              >
                <Text className="text-center font-semibold text-white">
                  {isSubmitting ? t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_SAVING_BTN) : mode === 'add' ? t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ADD_BTN) : t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_SAVE_BTN)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
