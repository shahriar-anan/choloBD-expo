/**
 * Add/edit a single itinerary stop (tour spot required, short description, optional activity/hotel/transport).
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScroll } from '../ui/KeyboardAwareScroll';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import * as tourBuilder from '../../services/api/tourBuilder';
import {
  WizardItineraryStop,
  MAX_STOPS_PER_DAY,
  nextSegmentOrderForDay,
  countStopsForDay,
} from '../../utils/tripPlanItinerary';
import { HotelTypePreference, TransportTypePreference } from '../../types/trips';

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
  'CAR_RENTAL',
  'FERRY',
  'SELF_MANAGED',
];

interface StopSegmentFormProps {
  visible: boolean;
  locationId: string;
  dayNumber: number;
  isLastStopOnDay: boolean;
  initial: WizardItineraryStop;
  onClose: () => void;
  onSave: (stop: WizardItineraryStop) => void;
}

export function StopSegmentForm({
  visible,
  locationId,
  dayNumber,
  isLastStopOnDay,
  initial,
  onClose,
  onSave,
}: StopSegmentFormProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  const [shortDescription, setShortDescription] = useState(initial.shortDescription);
  const [tourSpotId, setTourSpotId] = useState(initial.tourSpotId);
  const [tourSpotName, setTourSpotName] = useState(initial.tourSpotName || '');
  const [activitySpotId, setActivitySpotId] = useState(initial.activitySpotId || '');
  const [activitySpotName, setActivitySpotName] = useState(initial.activitySpotName || '');
  const [hotelOption, setHotelOption] = useState<HotelTypePreference | undefined>(initial.hotelOption);
  const [transportOption, setTransportOption] = useState<TransportTypePreference | undefined>(
    initial.transportOption
  );
  const [notes, setNotes] = useState(initial.notes || '');
  const [tourSpots, setTourSpots] = useState<Array<{ id: string; name: string }>>([]);
  const [activitySpots, setActivitySpots] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setShortDescription(initial.shortDescription);
    setTourSpotId(initial.tourSpotId);
    setTourSpotName(initial.tourSpotName || '');
    setActivitySpotId(initial.activitySpotId || '');
    setActivitySpotName(initial.activitySpotName || '');
    setHotelOption(initial.hotelOption);
    setTransportOption(initial.transportOption);
    setNotes(initial.notes || '');
  }, [visible, initial]);

  useEffect(() => {
    if (!visible || !locationId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [tours, activities] = await Promise.all([
          tourBuilder.getTourSpots(locationId),
          tourBuilder.getActivitySpots(locationId),
        ]);
        if (!cancelled) {
          setTourSpots(tours.map((s: any) => ({ id: s.id, name: s.name })));
          setActivitySpots(activities.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, locationId]);

  const handleSave = () => {
    if (!tourSpotId || shortDescription.trim().length < 2) return;
    onSave({
      ...initial,
      dayNumber,
      shortDescription: shortDescription.trim(),
      tourSpotId,
      tourSpotName,
      activitySpotId: activitySpotId || undefined,
      activitySpotName: activitySpotName || undefined,
      hotelOption: isLastStopOnDay ? hotelOption : undefined,
      transportOption,
      notes: notes.trim() || undefined,
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center justify-between px-6 pt-12 pb-4 border-b border-border dark:border-border-dark">
          <Text className="text-lg font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ADD_TITLE)} · {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: dayNumber })}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={primaryColor} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator className="mt-8" color={primaryColor} />
        ) : (
          <KeyboardAwareScroll className="flex-1 px-6 py-4">
            <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_DESC)}
            </Text>
            <TextInput
              value={shortDescription}
              onChangeText={setShortDescription}
              className="p-3 mb-4 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark"
              placeholderTextColor={mutedColor}
            />
            <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TOUR_SPOT)}
            </Text>
            {tourSpots.map((spot) => (
              <TouchableOpacity
                key={spot.id}
                onPress={() => {
                  setTourSpotId(spot.id);
                  setTourSpotName(spot.name);
                  if (shortDescription.trim().length < 2) setShortDescription(spot.name.slice(0, 200));
                }}
                className={`p-3 mb-2 rounded-lg border ${
                  tourSpotId === spot.id ? 'border-primary bg-primary/10' : 'border-border dark:border-border-dark'
                }`}
              >
                <Text className="text-text dark:text-text-dark">{spot.name}</Text>
              </TouchableOpacity>
            ))}
            <Text className="text-sm font-semibold text-text dark:text-text-dark mt-4 mb-2">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_ACTIVITY_SPOT)}
            </Text>
            {activitySpots.map((spot) => (
              <TouchableOpacity
                key={spot.id}
                onPress={() => {
                  setActivitySpotId(spot.id);
                  setActivitySpotName(spot.name);
                }}
                className={`p-3 mb-2 rounded-lg border ${
                  activitySpotId === spot.id ? 'border-primary bg-primary/10' : 'border-border dark:border-border-dark'
                }`}
              >
                <Text className="text-text dark:text-text-dark">{spot.name}</Text>
              </TouchableOpacity>
            ))}
            {isLastStopOnDay && (
              <>
                <Text className="text-sm font-semibold text-text dark:text-text-dark mt-4 mb-2">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_HOTEL_PREFERENCE)}
                </Text>
                <View className="flex-row flex-wrap mb-4">
                  {HOTEL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setHotelOption(hotelOption === type ? undefined : type)}
                      className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
                        hotelOption === type ? 'bg-primary border-primary' : 'border-border dark:border-border-dark'
                      }`}
                    >
                      <Text className={`text-xs ${hotelOption === type ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.SEGMENT_TRANSPORT_TYPE)}
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {TRANSPORT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setTransportOption(transportOption === type ? undefined : type)}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
                    transportOption === type ? 'bg-primary border-primary' : 'border-border dark:border-border-dark'
                  }`}
                >
                  <Text className={`text-xs ${transportOption === type ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleSave} className="py-3 rounded-lg bg-primary mb-8">
              <Text className="text-center font-semibold text-white">{t(TRANSLATION_KEYS.COMMON.SAVE)}</Text>
            </TouchableOpacity>
          </KeyboardAwareScroll>
        )}
      </View>
    </Modal>
  );
}
