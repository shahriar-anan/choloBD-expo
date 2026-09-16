import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { TourDaySegment, TourDaySegmentInput } from '../../types/tours';
import { DetailRow } from './DetailRow';

interface DaySegmentCardDisplayProps {
  segment: TourDaySegment | TourDaySegmentInput;
  dayNumber: number;
  isEditable: boolean;
  onEditPress: () => void;
  tourSpotName: string;
  activityName: string;
  successColor: string;
  warningColor: string;
  primaryColor: string;
  surfaceColor: string;
  textColor: string;
  borderColor: string;
  mutedColor: string;
  isDark: boolean;
}

export function DaySegmentCardDisplay({
  segment,
  dayNumber,
  isEditable,
  onEditPress,
  tourSpotName,
  activityName,
  successColor,
  warningColor,
  primaryColor,
  surfaceColor,
  textColor,
  borderColor,
  mutedColor,
  isDark,
}: DaySegmentCardDisplayProps) {
  const { t } = useTranslation();
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
      {/* Day Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b" style={{ borderColor }}>
        <View className="flex-row items-center gap-3">
          <View className="items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: primaryColor }}>
            <Text className="text-lg font-bold text-white">{dayNumber}</Text>
          </View>
          <View>
            <Text style={{ color: textColor }} className="text-base font-bold">
              {t(TRANSLATION_KEYS.TOUR_BUILDER.DAY_EDIT, { day: dayNumber })}
            </Text>
            <Text style={{ color: mutedColor }} className="text-xs">
              {tourSpotName}
            </Text>
          </View>
        </View>
        {isEditable && (
          <TouchableOpacity onPress={onEditPress} className="p-2">
            <Ionicons name="create-outline" size={20} color={primaryColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Details */}
      <View className="gap-3 px-4 py-4">
        {segment.activitySpotId && (
          <DetailRow icon="sparkles" label={t(TRANSLATION_KEYS.TOUR_BUILDER.ACTIVITY_LABEL)} value={activityName} color={successColor} />
        )}

        <DetailRow
          icon="car"
          label={t(TRANSLATION_KEYS.TOUR_BUILDER.TRANSPORT)}
          value={(segment.transportOption || 'N/A').replace(/_/g, ' ')}
          color={primaryColor}
        />

        {segment.transportQuality && (
          <DetailRow
            icon="star"
            label={t(TRANSLATION_KEYS.TOUR_BUILDER.QUALITY_LABEL)}
            value={segment.transportQuality.replace(/_/g, ' ')}
            color={primaryColor}
          />
        )}

        <DetailRow
          icon="bed"
          label={t(TRANSLATION_KEYS.TOUR_BUILDER.HOTEL)}
          value={segment.hotelOption || 'N/A'}
          color={warningColor}
        />
      </View>
    </View>
  );
}
