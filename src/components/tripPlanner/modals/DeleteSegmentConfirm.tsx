/**
 * Delete Segment Confirmation Modal
 * Confirms deletion of a trip segment with details
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { appAlert } from '../../ui/appAlert';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { UserSegment } from '../../../types/trips';

interface DeleteSegmentConfirmProps {
  visible: boolean;
  segment: UserSegment | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteSegmentConfirm({
  visible,
  segment,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteSegmentConfirmProps) {
  const { t } = useTranslation();
  console.log('[DeleteSegmentConfirm] Rendering with visible:', visible, 'segment:', segment?.id);
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const errorColor = isDark ? '#EF4444' : '#DC2626';

  const handleConfirm = async () => {
    try {
      console.log('[DeleteSegmentConfirm] Confirming delete for segment:', segment?.id);
      await onConfirm();
      console.log('[DeleteSegmentConfirm] Delete confirmed successfully');
    } catch (error: any) {
      console.error('[DeleteSegmentConfirm] Delete error:', error);
      appAlert('Error', error?.message || 'Failed to delete segment', undefined, 'error');
    }
  };

  if (!visible || !segment) return null;

  const timeRange =
    segment.startTime && segment.endTime
      ? `${segment.startTime} - ${segment.endTime}`
      : segment.startTime
      ? `From ${segment.startTime}`
      : 'No time specified';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Overlay */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onCancel}
        disabled={isDeleting}
        className="absolute inset-0 bg-black/50"
      />

      {/* Dialog */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-background dark:bg-background-dark rounded-2xl p-6" style={{ width: '100%', maxWidth: 300 }}>
        {/* Icon + Title */}
        <View className="items-center mb-4">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: `${errorColor}20` }}
          >
            <Feather name="trash-2" size={24} color={errorColor} />
          </View>
          <Text className="text-xl font-bold text-text dark:text-text-dark text-center">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_SEGMENT_TITLE)}
          </Text>
        </View>

        {/* Segment Details */}
        <View className="bg-surface dark:bg-surface-dark rounded-lg p-4 mb-6">
          <View className="flex-row items-start mb-3">
            <Feather name="calendar" size={16} color={mutedColor} />
            <Text className="ml-2 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_SEGMENT_DAY, { day: segment.dayNumber })}
            </Text>
          </View>
          {segment.customNotes && (
            <View className="flex-row items-start mb-3">
              <Feather name="file-text" size={16} color={mutedColor} />
              <Text className="ml-2 text-sm text-muted dark:text-muted-dark flex-1">
                {segment.customNotes}
              </Text>
            </View>
          )}
          <View className="flex-row items-start">
            <Feather name="clock" size={16} color={mutedColor} />
            <Text className="ml-2 text-sm text-muted dark:text-muted-dark">
              {timeRange}
            </Text>
          </View>
        </View>

        {/* Warning Message */}
        <Text className="text-sm text-muted dark:text-muted-dark text-center mb-6">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_SEGMENT_WARNING)}
        </Text>

        {/* Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-lg border border-border dark:border-border-dark"
            style={{ opacity: isDeleting ? 0.6 : 1 }}
          >
            <Text className="text-center font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_SEGMENT_CANCEL)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-lg"
            style={{
              backgroundColor: errorColor,
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            <Text className="text-center font-semibold text-white">
              {isDeleting ? t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_SEGMENT_DELETING) : t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_SEGMENT_DELETE)}
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
}
