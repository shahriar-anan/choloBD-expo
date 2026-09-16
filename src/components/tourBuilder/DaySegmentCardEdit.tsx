import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { TourDaySegmentInput, TransportServiceType, HotelOptionType, TransportQualityType, TRANSPORT_QUALITY_MAP } from '../../types/tours';
import { TourSpotModal } from './TourSpotModal';
import { ActivitySpotModal } from './ActivitySpotModal';

interface EditState {
  tourSpotId?: string;
  activitySpotId?: string;
  transportOption?: TransportServiceType;
  transportQuality?: TransportQualityType;
  hotelOption?: HotelOptionType;
}

interface DaySegmentCardEditProps {
  dayNumber: number;
  editData: EditState;
  onEditDataChange: (data: EditState) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  getTourSpotName: (spotId: string) => string;
  getActivitySpotName: (spotId: string) => string;
  tourSpots: Array<{ id: string; name: string; location?: string }>;
  activitySpots: Array<{ id: string; name: string; location?: string }>;
  spotsLoading: boolean;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  primaryColor: string;
  successColor: string;
  errorColor: string;
  warningColor: string;
  isDark: boolean;
}

const TRANSPORT_OPTIONS: TransportServiceType[] = ['BUS', 'FLIGHT', 'TRAIN', 'CAR_RENTAL', 'FERRY', 'SELF_MANAGED'];
const HOTEL_OPTIONS: HotelOptionType[] = ['LUXURY', 'BUDGET', 'BOUTIQUE', 'RESORT', 'HOSTEL', 'GUESTHOUSE', 'APARTMENT'];

export function DaySegmentCardEdit({
  dayNumber,
  editData,
  onEditDataChange,
  onSave,
  onCancel,
  onDelete,
  getTourSpotName,
  getActivitySpotName,
  tourSpots,
  activitySpots,
  spotsLoading,
  surfaceColor,
  textColor,
  mutedColor,
  borderColor,
  primaryColor,
  successColor,
  errorColor,
  warningColor,
  isDark,
}: DaySegmentCardEditProps) {
  const { t } = useTranslation();
  const [tourSpotModalVisible, setTourSpotModalVisible] = useState(false);
  const [activitySpotModalVisible, setActivitySpotModalVisible] = useState(false);

  const currentTransportQualityOptions = editData.transportOption
    ? TRANSPORT_QUALITY_MAP[editData.transportOption] ?? []
    : [];

  const dynamicStyles = StyleSheet.create({
    input: {
      borderColor: borderColor,
      backgroundColor: surfaceColor,
      color: textColor,
    },
    transportButton: {
      borderColor: borderColor,
      backgroundColor: surfaceColor,
    },
    transportButtonActive: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    transportButtonText: {
      color: textColor,
    },
    hotelButton: {
      borderColor: borderColor,
      backgroundColor: surfaceColor,
    },
    hotelButtonActive: {
      backgroundColor: warningColor,
      borderColor: warningColor,
    },
    hotelButtonText: {
      color: textColor,
    },
    saveButton: {
      backgroundColor: successColor,
    },
    deleteButton: {
      backgroundColor: errorColor,
    },
  });

  return (
    <View
      className="mx-3 mb-3 overflow-hidden rounded-2xl"
      style={{
        backgroundColor: surfaceColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* Edit Mode Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b" style={{ borderColor }}>
        <View>
          <Text style={{ color: primaryColor }} className="text-sm font-bold">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.DAY_EDIT, { day: dayNumber })}
          </Text>
          <Text style={{ color: mutedColor }} className="mt-1 text-xs">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.CUSTOMIZE_ITINERARY)}
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel} className="p-1">
          <Ionicons name="close" size={24} color={mutedColor} />
        </TouchableOpacity>
      </View>

      <ScrollView className="gap-4 px-4 py-4">
        {/* Tour Spot Selection */}
        <View>
          <Text style={{ color: mutedColor }} className="mb-2 text-xs font-semibold tracking-wider uppercase">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.TOUR_SPOT)}
          </Text>
          <TouchableOpacity
            onPress={() => setTourSpotModalVisible(true)}
            style={[styles.input, dynamicStyles.input]}
            className="flex-row items-center justify-between px-4 py-3 border rounded-lg"
          >
            <Text style={{ color: editData.tourSpotId ? textColor : mutedColor }}>
              {editData.tourSpotId ? getTourSpotName(editData.tourSpotId) : t(TRANSLATION_KEYS.TOUR_BUILDER.SELECT_TOUR_SPOT)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={primaryColor} />
          </TouchableOpacity>
        </View>

        {/* Activity Spot Selection */}
        <View>
          <Text style={{ color: mutedColor }} className="mb-2 text-xs font-semibold tracking-wider uppercase">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.ACTIVITY_SPOT)}
          </Text>
          <TouchableOpacity
            onPress={() => setActivitySpotModalVisible(true)}
            style={[styles.input, dynamicStyles.input]}
            className="flex-row items-center justify-between px-4 py-3 border rounded-lg"
          >
            <Text style={{ color: editData.activitySpotId ? textColor : mutedColor }}>
              {editData.activitySpotId ? getActivitySpotName(editData.activitySpotId) : t(TRANSLATION_KEYS.TOUR_BUILDER.SELECT_ACTIVITY_SPOT)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={primaryColor} />
          </TouchableOpacity>
        </View>

        {/* Transport Option */}
        <View>
          <Text style={{ color: mutedColor }} className="mb-2 text-xs font-semibold tracking-wider uppercase">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.TRANSPORT)}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
            <View style={{ gap: 8, flexDirection: 'row' }}>
              {TRANSPORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.transportButton,
                    dynamicStyles.transportButton,
                    editData.transportOption === option && dynamicStyles.transportButtonActive,
                  ]}
                  onPress={() => onEditDataChange({ ...editData, transportOption: option, transportQuality: undefined })}
                >
                  <Text
                    style={[
                      styles.transportButtonText,
                      dynamicStyles.transportButtonText,
                      editData.transportOption === option && styles.transportButtonTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {option.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Transport Quality */}
        {currentTransportQualityOptions !== null && (
          <View>
            <Text style={{ color: mutedColor }} className="mb-2 text-xs font-semibold tracking-wider uppercase">
              {t(TRANSLATION_KEYS.TOUR_BUILDER.TRANSPORT_QUALITY)}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
              <View style={{ gap: 8, flexDirection: 'row' }}>
                <TouchableOpacity
                  style={[
                    styles.transportButton,
                    dynamicStyles.transportButton,
                    !editData.transportQuality && dynamicStyles.transportButtonActive,
                  ]}
                  onPress={() => onEditDataChange({ ...editData, transportQuality: undefined })}
                >
                  <Text
                    style={[
                      styles.transportButtonText,
                      dynamicStyles.transportButtonText,
                      !editData.transportQuality && styles.transportButtonTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {t(TRANSLATION_KEYS.TOUR_BUILDER.NONE)}
                  </Text>
                </TouchableOpacity>
                {currentTransportQualityOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.transportButton,
                      dynamicStyles.transportButton,
                      editData.transportQuality === option && dynamicStyles.transportButtonActive,
                    ]}
                    onPress={() => onEditDataChange({ ...editData, transportQuality: option })}
                  >
                    <Text
                      style={[
                        styles.transportButtonText,
                        dynamicStyles.transportButtonText,
                        editData.transportQuality === option && styles.transportButtonTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {option.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Hotel Option */}
        <View>
          <Text style={{ color: mutedColor }} className="mb-2 text-xs font-semibold tracking-wider uppercase">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.HOTEL)}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
            <View style={{ gap: 8, flexDirection: 'row' }}>
              {HOTEL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.hotelButton,
                    dynamicStyles.hotelButton,
                    editData.hotelOption === option && dynamicStyles.hotelButtonActive,
                  ]}
                  onPress={() => onEditDataChange({ ...editData, hotelOption: option })}
                >
                  <Text
                    style={[
                      styles.hotelButtonText,
                      dynamicStyles.hotelButtonText,
                      editData.hotelOption === option && styles.hotelButtonTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Modals */}
      <TourSpotModal
        visible={tourSpotModalVisible}
        onClose={() => setTourSpotModalVisible(false)}
        spots={tourSpots}
        selectedSpotId={editData.tourSpotId}
        onSelectSpot={(spotId) => onEditDataChange({ ...editData, tourSpotId: spotId })}
        loading={spotsLoading}
        surfaceColor={surfaceColor}
        textColor={textColor}
        mutedColor={mutedColor}
        borderColor={borderColor}
        primaryColor={primaryColor}
      />

      <ActivitySpotModal
        visible={activitySpotModalVisible}
        onClose={() => setActivitySpotModalVisible(false)}
        spots={activitySpots}
        selectedSpotId={editData.activitySpotId}
        onSelectSpot={(spotId) => onEditDataChange({ ...editData, activitySpotId: spotId })}
        loading={spotsLoading}
        surfaceColor={surfaceColor}
        textColor={textColor}
        mutedColor={mutedColor}
        borderColor={borderColor}
        primaryColor={primaryColor}
      />

      {/* Action Buttons */}
      <View className="flex-row gap-2 px-4 py-4 border-t" style={{ borderColor }}>
        <TouchableOpacity style={[styles.actionButton, dynamicStyles.saveButton]} onPress={onSave} className="active:opacity-80">
          <Text style={styles.actionButtonText}>{t(TRANSLATION_KEYS.TOUR_BUILDER.SAVE)}</Text>
        </TouchableOpacity>
        {onDelete && (
          <TouchableOpacity style={[styles.actionButton, dynamicStyles.deleteButton]} onPress={onDelete} className="active:opacity-80">
            <Text style={styles.actionButtonText}>{t(TRANSLATION_KEYS.TOUR_BUILDER.DELETE)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 44,
  },
  transportButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  transportButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transportButtonTextActive: {
    color: '#fff',
  },
  hotelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 90,
  },
  hotelButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hotelButtonTextActive: {
    color: '#fff',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
