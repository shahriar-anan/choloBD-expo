/**
 * Day Plan Tab Component
 * Display and manage daily segments for each day of the trip
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { TripPlan, UserSegment } from '../../../types/trips';
import { useTripPlannerLogic } from '../../../hooks/useTripPlannerLogic';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { DeleteSegmentConfirm } from '../modals/DeleteSegmentConfirm';
import { StopSegmentForm } from '../StopSegmentForm';
import { tripDurationFromDates, countStopsForDay, nextSegmentOrderForDay, WizardItineraryStop, MAX_STOPS_PER_DAY } from '../../../utils/tripPlanItinerary';

interface DayPlanTabProps {
  trip: TripPlan;
}

export function DayPlanTab({ trip }: DayPlanTabProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { updateSegment, deleteSegment, isFormSubmitting, addSegment } = useTripPlannerLogic();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const errorColor = isDark ? '#EF4444' : '#DC2626';

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<UserSegment | null>(null);

  const totalDays = tripDurationFromDates(trip.startDate, trip.endDate);

  // ==== MODAL HANDLERS ====
  const openAddModal = (day: number) => {
    setSelectedDay(day);
    setSelectedSegment(null);
    setAddModalVisible(true);
  };

  const openEditModal = (segment: UserSegment) => {
    setSelectedSegment(segment);
    setSelectedDay(segment.dayNumber);
    setEditModalVisible(true);
  };

  const openDeleteModal = (segment: UserSegment) => {
    setSelectedSegment(segment);
    setDeleteModalVisible(true);
  };

  const handleDeleteSegment = async () => {
    try {
      if (selectedSegment) {
        await deleteSegment(trip.id, selectedSegment.id);
        setDeleteModalVisible(false);
      }
    } catch (error: any) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), error?.message || 'Failed to delete segment');
    }
  };

  const segmentToWizard = (segment: UserSegment): WizardItineraryStop => ({
    id: segment.id,
    dayNumber: segment.dayNumber,
    segmentOrder: segment.segmentOrder,
    shortDescription: segment.shortDescription || segment.customNotes || `Day ${segment.dayNumber}`,
    tourSpotId: segment.customTourSpotId || '',
    activitySpotId: segment.customActivitySpotId,
    transportOption: segment.customTransport,
    hotelOption: segment.customHotel,
    notes: segment.customNotes,
  });

  const handleSaveStop = async (stop: WizardItineraryStop, mode: 'add' | 'edit') => {
    const payload = {
      dayNumber: stop.dayNumber,
      segmentOrder: stop.segmentOrder,
      shortDescription: stop.shortDescription,
      customTourSpotId: stop.tourSpotId,
      customActivitySpotId: stop.activitySpotId,
      customHotel: stop.hotelOption,
      customTransport: stop.transportOption,
      customNotes: stop.notes,
    };
    if (mode === 'add') {
      await addSegment(trip.id, payload);
      setAddModalVisible(false);
    } else if (selectedSegment) {
      await updateSegment(trip.id, selectedSegment.id, payload);
      setEditModalVisible(false);
    }
  };

  if (totalDays < 1) {
    return (
      <View className="items-center justify-center py-8">
        <Feather name="map" size={40} color={mutedColor} />
        <Text className="text-muted dark:text-muted-dark mt-3">{t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_EMPTY_TITLE)}</Text>
        <Text className="text-xs text-muted dark:text-muted-dark mt-1">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_EMPTY_SUBTITLE)}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => {
        const daySegments = (trip.userSegments?.filter((s) => s.dayNumber === dayNum) || []).sort(
          (a, b) => a.segmentOrder - b.segmentOrder
        );
        return (
          <View key={dayNum} className="mb-6">
            {/* Day Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Text className="font-bold text-white text-sm">{dayNum}</Text>
                </View>
                <Text className="ml-3 text-lg font-bold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: dayNum })}
                </Text>
              </View>
            </View>

            {/* Segments for this day */}
            {daySegments.length > 0 ? (
              <View className="mb-4">
                {daySegments.map((segment) => (
                  <View
                    key={segment.id}
                    className="bg-surface dark:bg-surface-dark rounded-lg mb-3 border border-border dark:border-border-dark overflow-hidden"
                    style={{
                      borderLeftWidth: 5,
                      borderLeftColor: primaryColor,
                    }}
                  >
                    {/* Card Header with Time and Actions */}
                    <View className="flex-row items-start justify-between p-4 border-b border-border dark:border-border-dark">
                      <View className="flex-1">
                        {segment.shortDescription && (
                          <Text className="text-base font-semibold text-text dark:text-text-dark mb-2">
                            {segment.shortDescription}
                          </Text>
                        )}
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => openEditModal(segment)}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                        >
                          <Feather name="edit-2" size={16} color={primaryColor} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => openDeleteModal(segment)}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                        >
                          <Feather name="trash-2" size={16} color={errorColor} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Card Content */}
                    <View className="p-4">
                      {/* Activity/Tour Information */}
                      {(segment.activityDetails?.name || segment.customActivitySpotName || segment.customActivitySpotId) && (
                        <View className="mb-4 pb-4 border-b border-border dark:border-border-dark">
                          <View className="flex-row items-start">
                            <Feather name="map-pin" size={16} color={primaryColor} />
                            <View className="flex-1 ml-3">
                              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase">
                                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_ACTIVITY_LABEL)}
                              </Text>
                              <Text className="text-sm font-semibold text-text dark:text-text-dark mt-1">
                                {segment.activityDetails?.name || segment.customActivitySpotName || t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_ACTIVITY_FALLBACK)}
                              </Text>
                              {segment.activityDetails?.cost && (
                                <Text className="text-xs text-muted dark:text-muted-dark mt-1">
                                  {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_ACTIVITY_COST, { cost: segment.activityDetails.cost })}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Hotel Preference */}
                      {(segment.customHotel || segment.hotelDetails?.name) && (
                        <View className="mb-4 pb-4 border-b border-border dark:border-border-dark">
                          <View className="flex-row items-start">
                            <Feather name="home" size={16} color={primaryColor} />
                            <View className="flex-1 ml-3">
                              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase">
                                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_HOTEL_LABEL)}
                              </Text>
                              {segment.hotelDetails?.name && (
                                <Text className="text-sm font-semibold text-text dark:text-text-dark mt-1">
                                  {segment.hotelDetails.name}
                                </Text>
                              )}
                              {segment.customHotel && (
                                <Text className={`text-sm font-semibold text-text dark:text-text-dark ${segment.hotelDetails?.name ? 'mt-1' : 'mt-1'}`}>
                                  {segment.customHotel}
                                </Text>
                              )}
                              {segment.hotelDetails?.cost && (
                                <Text className="text-xs text-muted dark:text-muted-dark mt-1">
                                  {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_ACTIVITY_COST, { cost: segment.hotelDetails.cost })}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Transport Preference */}
                      {(segment.customTransport || segment.transportDetails?.name) && (
                        <View className="mb-4 pb-4 border-b border-border dark:border-border-dark">
                          <View className="flex-row items-start">
                            <Feather name="truck" size={16} color={primaryColor} />
                            <View className="flex-1 ml-3">
                              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase">
                                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_TRANSPORT_LABEL)}
                              </Text>
                              {segment.transportDetails?.name && (
                                <Text className="text-sm font-semibold text-text dark:text-text-dark mt-1">
                                  {segment.transportDetails.name}
                                </Text>
                              )}
                              {segment.customTransport && (
                                <Text className={`text-sm font-semibold text-text dark:text-text-dark ${segment.transportDetails?.name ? 'mt-1' : 'mt-1'}`}>
                                  {segment.customTransport}
                                </Text>
                              )}
                              {segment.transportDetails?.cost && (
                                <Text className="text-xs text-muted dark:text-muted-dark mt-1">
                                  {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_ACTIVITY_COST, { cost: segment.transportDetails.cost })}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Notes */}
                      {segment.customNotes && (
                        <View className="mb-4 pb-4 border-b border-border dark:border-border-dark">
                          <View className="flex-row items-start">
                            <Feather name="edit-3" size={16} color={primaryColor} />
                            <View className="flex-1 ml-3">
                              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase">
                                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_NOTES_LABEL)}
                              </Text>
                              <Text className="text-sm text-text dark:text-text-dark mt-1 leading-5">
                                {segment.customNotes}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Cost Information */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Feather name="dollar-sign" size={16} color={successColor} />
                          <View className="ml-3">
                            <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase">
                                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_EST_COST_LABEL)}
                              </Text>
                            <Text className="text-lg font-bold text-text dark:text-text-dark mt-1">
                              ₹{segment.estimatedCost || 0}
                            </Text>
                          </View>
                        </View>

                        {/* Booking Status if available */}
                        {(segment.hotelRoomBookingId || segment.transportBookingId || segment.activityBookingId) && (
                          <View className="flex-row items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: isDark ? theme.colors['success-dark'] + '20' : theme.colors.success + '20' }}>
                            <Feather name="check-circle" size={12} color={successColor} />
                            <Text className="text-xs font-semibold ml-1" style={{ color: successColor }}>
                              {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_BOOKED_BADGE)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-surface dark:bg-surface-dark rounded-lg p-4 mb-4 items-center">
                <Text className="text-sm text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_NO_SEGMENTS, { day: dayNum })}
                </Text>
              </View>
            )}

            {/* Add Segment Button */}
            <TouchableOpacity
              onPress={() => {
                if (countStopsForDay(trip.userSegments?.map(segmentToWizard) || [], dayNum) >= MAX_STOPS_PER_DAY) {
                  Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_LIMIT, { max: MAX_STOPS_PER_DAY }));
                  return;
                }
                openAddModal(dayNum);
              }}
              className="flex-row items-center justify-center py-3 rounded-lg border-2"
              style={{
                borderColor: primaryColor,
                borderStyle: 'dashed',
              }}
            >
              <Feather name="plus" size={18} color={primaryColor} />
              <Text className="ml-2 font-semibold" style={{ color: primaryColor }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_ADD_ACTIVITY)}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Modals */}
      {trip.primaryLocationId && (addModalVisible || editModalVisible) && (
        <StopSegmentForm
          visible={addModalVisible || editModalVisible}
          locationId={trip.primaryLocationId}
          dayNumber={selectedDay || 1}
          isLastStopOnDay={
            addModalVisible
              ? true
              : selectedSegment
                ? selectedSegment.segmentOrder ===
                  Math.max(
                    ...(trip.userSegments || [])
                      .filter((s) => s.dayNumber === selectedSegment.dayNumber)
                      .map((s) => s.segmentOrder),
                    selectedSegment.segmentOrder
                  )
                : true
          }
          initial={
            addModalVisible
              ? {
                  id: `stop-${Date.now()}`,
                  dayNumber: selectedDay || 1,
                  segmentOrder: nextSegmentOrderForDay(
                    (trip.userSegments || []).map(segmentToWizard),
                    selectedDay || 1
                  ),
                  shortDescription: '',
                  tourSpotId: '',
                }
              : segmentToWizard(selectedSegment!)
          }
          onClose={() => {
            setAddModalVisible(false);
            setEditModalVisible(false);
          }}
          onSave={(stop) => {
            void handleSaveStop(stop, addModalVisible ? 'add' : 'edit').catch((error: any) => {
              Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), error?.message || 'Failed to save segment');
            });
          }}
        />
      )}

      <DeleteSegmentConfirm
        visible={deleteModalVisible}
        segment={selectedSegment}
        onConfirm={handleDeleteSegment}
        onCancel={() => setDeleteModalVisible(false)}
        isDeleting={isFormSubmitting}
      />
    </View>
  );
}
