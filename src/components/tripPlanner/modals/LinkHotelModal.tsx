/**
 * Link Hotel Booking Modal
 * Allows user to select which day segment to link an existing hotel booking to
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { appAlert } from '../../ui/appAlert';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { HotelBookingInfo } from '../../../services/api/hotelBookings';
import { TripPlan } from '../../../types/trips';

interface LinkHotelModalProps {
  visible: boolean;
  booking: (HotelBookingInfo & { dateRange: string; applicableDays: number[] }) | null;
  trip: TripPlan;
  onClose: () => void;
  onConfirm: (dayNumber: number) => Promise<void>;
  isSubmitting: boolean;
}

export function LinkHotelModal({
  visible,
  booking,
  trip,
  onClose,
  onConfirm,
  isSubmitting,
}: LinkHotelModalProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const backgroundColor = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;

  if (!visible || !booking) return null;

  const handleConfirm = async () => {
    if (!selectedDay) {
      appAlert('Error', 'Please select a day to link this hotel booking', undefined, 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await onConfirm(selectedDay);
      setSelectedDay(null);
      onClose();
    } catch (error: any) {
      appAlert('Error', error?.message || 'Failed to link hotel booking', undefined, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const { applicableDays } = booking;
  const hasApplicableDays = applicableDays && applicableDays.length > 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        disabled={isSubmitting || isProcessing}
        className="absolute inset-0 bg-black/50"
      />

      <View className="absolute bottom-0 left-0 right-0 bg-background dark:bg-background-dark rounded-t-2xl max-h-[90%]">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-border dark:border-border-dark">
            <Text className="text-lg font-bold text-text dark:text-text-dark flex-1">
              Link Hotel Booking
            </Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting || isProcessing}>
              <Feather name="x" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View className="p-6">
            {/* Hotel Details Section */}
            <View className="mb-6 p-4 rounded-lg border" style={{ borderColor, backgroundColor: surfaceColor }}>
              <View className="flex-row items-center mb-3">
                <Feather name="home" size={20} color={primaryColor} />
                <Text className="ml-3 text-lg font-bold text-text dark:text-text-dark flex-1">
                  {booking.hotelName}
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <Feather name="calendar" size={14} color={mutedColor} />
                <Text className="ml-3 text-sm text-muted dark:text-muted-dark">
                  {booking.dateRange}
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <Feather name="map-pin" size={14} color={mutedColor} />
                <Text className="ml-3 text-sm text-muted dark:text-muted-dark">
                  {booking.location}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Feather name="tag" size={14} color={mutedColor} />
                <Text className="ml-3 text-sm font-semibold text-text dark:text-text-dark">
                  ₹{booking.totalPrice}
                </Text>
              </View>
            </View>

            {/* Day Selection */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-3">
                Select Trip Day
              </Text>

              {!hasApplicableDays && (
                <View className="p-4 rounded-lg border border-dashed mb-4" style={{ borderColor }}>
                  <View className="flex-row items-start">
                    <Feather name="alert-circle" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                    <Text className="ml-3 text-xs text-muted dark:text-muted-dark flex-1">
                      This booking dates don't fully overlap with your trip dates. You can still link it to any day.
                    </Text>
                  </View>
                </View>
              )}

              {/* Recommended Days (with overlap) */}
              {hasApplicableDays && (
                <View className="mb-4">
                  <Text className="text-xs text-muted dark:text-muted-dark mb-2">
                    Recommended (overlapping dates):
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {applicableDays.map((day) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => setSelectedDay(day)}
                        className={`px-4 py-3 rounded-lg border-2 min-w-[70px] items-center ${
                          selectedDay === day
                            ? 'border-[2px]'
                            : 'border-border dark:border-border-dark'
                        }`}
                        style={{
                          backgroundColor:
                            selectedDay === day
                              ? primaryColor
                              : surfaceColor,
                          borderColor:
                            selectedDay === day
                              ? primaryColor
                              : borderColor,
                        }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{
                            color:
                              selectedDay === day
                                ? 'white'
                                : textColor,
                          }}
                        >
                          Day {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* All Days */}
              <View>
                <Text className="text-xs text-muted dark:text-muted-dark mb-2">
                  {hasApplicableDays ? 'Or select any day:' : 'Select a day:'}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {Array.from({ length: trip.userSegments?.reduce((max, s) => Math.max(max, s.dayNumber), 0) || 1 }).map(
                    (_, index) => {
                      const day = index + 1;
                      const isRecommended = applicableDays?.includes(day);

                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setSelectedDay(day)}
                          className={`px-4 py-3 rounded-lg border-2 min-w-[70px] items-center ${
                            selectedDay === day
                              ? 'border-[2px]'
                              : isRecommended
                              ? 'border-green-500 dark:border-green-400'
                              : 'border-border dark:border-border-dark'
                          }`}
                          style={{
                            backgroundColor:
                              selectedDay === day
                                ? primaryColor
                                : isRecommended
                                ? successColor + '20'
                                : surfaceColor,
                            borderColor:
                              selectedDay === day
                                ? primaryColor
                                : isRecommended
                                ? successColor
                                : borderColor,
                          }}
                        >
                          <Text
                            className="font-semibold text-sm"
                            style={{
                              color:
                                selectedDay === day
                                  ? 'white'
                                  : textColor,
                            }}
                          >
                            Day {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              </View>
            </View>

            {/* Status indicator */}
            <View
              className="p-3 rounded-lg mb-4 flex-row items-center"
              style={{
                backgroundColor:
                  booking.status === 'CONFIRMED'
                    ? '#DBEAFE'
                    : booking.status === 'PENDING'
                    ? '#FEF3C7'
                    : '#F3E8FF',
              }}
            >
              <Feather
                name={
                  booking.status === 'CONFIRMED'
                    ? 'check-circle'
                    : 'clock'
                }
                size={14}
                color={
                  booking.status === 'CONFIRMED'
                    ? primaryColor
                    : '#F59E0B'
                }
              />
              <Text
                className="ml-2 text-xs font-semibold"
                style={{
                  color:
                    booking.status === 'CONFIRMED'
                      ? primaryColor
                      : '#F59E0B',
                }}
              >
                Booking Status: {booking.status}
              </Text>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!selectedDay || isSubmitting || isProcessing}
              className="w-full py-4 rounded-lg items-center"
              style={{
                backgroundColor:
                  !selectedDay || isSubmitting || isProcessing
                    ? '#D1D5DB'
                    : primaryColor,
              }}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="font-semibold text-white text-base">
                  Confirm Link
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting || isProcessing}
              className="w-full py-3 rounded-lg items-center mt-3 border"
              style={{ borderColor, borderWidth: 1 }}
            >
              <Text className="font-semibold" style={{ color: textColor }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
