/**
 * Day Segment Card Component
 * Modern, clean, minimal design with nativewind
 * Refactored to use extracted components for better maintainability
 */

import React, { useState } from 'react';
import { TourDaySegment, TourDaySegmentInput, TransportServiceType, HotelOptionType, TransportQualityType } from '../../types/tours';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { useDaySegmentSpots } from '../../hooks/useDaySegmentSpots';
import { DaySegmentCardEdit } from './DaySegmentCardEdit';
import { DaySegmentCardDisplay } from './DaySegmentCardDisplay';


interface DaySegmentCardProps {
  segment: TourDaySegment | TourDaySegmentInput;
  dayNumber: number;
  isEditable?: boolean;
  onUpdate?: (segment: TourDaySegmentInput) => void;
  onDelete?: () => void;
  isEnriched?: boolean; // true if it's a TourDaySegment with names
  locationId?: string; // Location ID to filter tour spots and activity spots
}

export function DaySegmentCard({
  segment,
  dayNumber,
  isEditable = false,
  onUpdate,
  onDelete,
  isEnriched = false,
  locationId,
}: DaySegmentCardProps) {
  const { isDark } = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);

  // Use custom hook for spot fetching and name resolution
  const {
    tourSpots,
    activitySpots,
    spotsLoading,
    getTourSpotName,
    getActivitySpotName,
  } = useDaySegmentSpots(locationId, isEditMode);

  // Theme colors
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const warningColor = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;

  const [editData, setEditData] = useState<{
    tourSpotId?: string;
    activitySpotId?: string;
    transportOption?: TransportServiceType;
    transportQuality?: TransportQualityType;
    hotelOption?: HotelOptionType;
  }>({
    tourSpotId: segment.tourSpotId,
    activitySpotId: segment.activitySpotId,
    transportOption: segment.transportOption,
    transportQuality: segment.transportQuality,
    hotelOption: segment.hotelOption,
  });

  const handleSave = () => {
    onUpdate?.({ dayNumber, ...editData });
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setEditData({
      tourSpotId: segment.tourSpotId,
      activitySpotId: segment.activitySpotId,
      transportOption: segment.transportOption,
      transportQuality: segment.transportQuality,
      hotelOption: segment.hotelOption,
    });
    setIsEditMode(false);
  };

  const handleDelete = () => {
    onDelete?.();
    setIsEditMode(false);
  };

  // Edit mode
  if (isEditMode && isEditable) {
    return (
      <DaySegmentCardEdit
        dayNumber={dayNumber}
        editData={editData}
        onEditDataChange={setEditData}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={onDelete ? handleDelete : undefined}
        tourSpots={tourSpots}
        activitySpots={activitySpots}
        spotsLoading={spotsLoading}
        getTourSpotName={getTourSpotName}
        getActivitySpotName={getActivitySpotName}
        primaryColor={primaryColor}
        successColor={successColor}
        warningColor={warningColor}
        errorColor={errorColor}
        textColor={textColor}
        mutedColor={mutedColor}
        borderColor={borderColor}
        surfaceColor={surfaceColor}
        isDark={isDark}
      />
    );
  }

  // Display mode (not editing)
  const enrichedSeg = segment as TourDaySegment;
  const tourSpotName = isEnriched
    ? enrichedSeg.tourSpotName
    : (segment.tourSpotId ? getTourSpotName(segment.tourSpotId) : undefined) || 'Tour Spot';
  const activityName = isEnriched
    ? enrichedSeg.activitySpotName || 'N/A'
    : segment.activitySpotId
      ? getActivitySpotName(segment.activitySpotId) || 'N/A'
      : 'N/A';

  return (
    <DaySegmentCardDisplay
      segment={segment}
      dayNumber={dayNumber}
      isEditable={isEditable}
      onEditPress={() => setIsEditMode(true)}
      tourSpotName={tourSpotName}
      activityName={activityName}
      successColor={successColor}
      warningColor={warningColor}
      primaryColor={primaryColor}
      surfaceColor={surfaceColor}
      textColor={textColor}
      borderColor={borderColor}
      mutedColor={mutedColor}
      isDark={isDark}
    />
  );
}
