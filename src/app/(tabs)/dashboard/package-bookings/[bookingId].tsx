/**
 * Package Booking Detail Page
 * Displays detailed information about a specific package booking
 * Cancel flow uses server eligibility (not PENDING-only)
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePackageBookingLogic } from '../../../../hooks/usePackageBookingLogic';
import { useTheme } from '../../../../hooks/useTheme';
import { theme } from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { PackageBooking } from '../../../../types/packageBookings';
import { CancellationEligibility } from '../../../../types/cancellation';
import { getPackageCancellationEligibility } from '../../../../services/api/packageBookings';
import { CancellationEligibilityPreview } from '../../../../components/booking/CancellationEligibilityPreview';
import {
  shouldFetchCancellationEligibility,
  getCancelActionLabel,
} from '../../../../utilities/bookingCancelHelpers';

export default function PackageBookingDetailPage() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const {
    fetchBookingDetail,
    handleCancelBooking,
    cancelLoading,
  } = usePackageBookingLogic();

  const [booking, setBooking] = useState<PackageBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');
  const [eligibility, setEligibility] = useState<CancellationEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const warningColor = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;

  useEffect(() => {
    if (bookingId) {
      loadBookingDetail();
    }
  }, [bookingId]);

  const loadBookingDetail = async () => {
    setLoading(true);
    const result = await fetchBookingDetail(bookingId);
    if (result) {
      setBooking(result);
      if (shouldFetchCancellationEligibility(result.status)) {
        setEligibilityLoading(true);
        try {
          const eligibilityResult = await getPackageCancellationEligibility(bookingId);
          setEligibility(eligibilityResult);
        } catch (error: any) {
          console.error('[PackageBookingDetail] eligibility error', error);
          setEligibility(null);
        } finally {
          setEligibilityLoading(false);
        }
      } else {
        setEligibility(null);
      }
    }
    setLoading(false);
  };

  const handleCancelPress = () => {
    if (!eligibility?.canCancel) {
      Alert.alert(
        t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANNOT_CANCEL),
        eligibility?.reason || t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANNOT_CANCEL_DESC)
      );
      return;
    }
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingId) return;

    await handleCancelBooking(
      bookingId,
      {
        reason: cancelReason.trim() || undefined,
        notes: cancelNotes.trim() || undefined,
      },
      () => {
        setShowCancelModal(false);
        setCancelReason('');
        setCancelNotes('');
        // Reload booking to show updated status
        loadBookingDetail();
      }
    );
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return successColor;
      case 'PENDING':
        return warningColor;
      case 'CANCELLED':
      case 'REFUNDED':
      case 'NO_SHOW':
        return errorColor;
      default:
        return mutedColor;
    }
  };

  const showCancelSection =
    booking && shouldFetchCancellationEligibility(booking.status);

  if (loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator size="large" color={primaryColor} />
        <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.COMMON.LOADING)}...
        </Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center px-6 pt-4 pb-4">
          <Pressable onPress={handleBack} style={{ padding: 6, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color={primaryColor} />
          </Pressable>
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKING_DETAILS)}
          </Text>
        </View>
        <View className="items-center justify-center flex-1 px-6">
          <Ionicons name="alert-circle-outline" size={64} color={errorColor} />
          <Text className="mt-4 text-lg font-semibold text-center text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKING_NOT_FOUND)}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-4">
          <View className="flex-row items-center flex-1">
            <Pressable onPress={handleBack} style={{ padding: 6, marginRight: 12 }}>
              <Ionicons name="chevron-back" size={24} color={primaryColor} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKING_DETAILS)}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 pb-6">
          {/* Status Badge */}
          <View className="flex-row items-center justify-between mb-6">
            <View
              style={{ backgroundColor: `${getStatusColor(booking.status)}20` }}
              className="px-4 py-2 rounded-lg"
            >
              <Text style={{ color: getStatusColor(booking.status) }} className="text-sm font-bold">
                {booking.status}
              </Text>
            </View>
            <View
              style={{
                backgroundColor:
                  booking.paymentStatus === 'PAID' ? `${successColor}20` : `${warningColor}20`,
              }}
              className="px-4 py-2 rounded-lg"
            >
              <Text
                style={{ color: booking.paymentStatus === 'PAID' ? successColor : warningColor }}
                className="text-sm font-bold"
              >
                {booking.paymentStatus}
              </Text>
            </View>
          </View>

          {/* Confirmation Code */}
          <View className="p-4 mb-6 rounded-xl" style={{ backgroundColor: surfaceColor, borderWidth: 1, borderColor }}>
            <Text className="mb-1 text-sm font-semibold text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.CONFIRMATION_CODE)}
            </Text>
            <Text className="text-2xl font-bold" style={{ color: primaryColor }}>
              {booking.confirmationCode}
            </Text>
          </View>

          {/* Package Information */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.PACKAGE_INFO)}
            </Text>
            <View className="p-4 rounded-xl" style={{ backgroundColor: surfaceColor, borderWidth: 1, borderColor }}>
              <Text className="mb-2 text-xl font-bold text-text dark:text-text-dark">
                {booking.tourPackage?.packageName || 'N/A'}
              </Text>
              {booking.tourPackage?.location && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-outline" size={16} color={mutedColor} style={{ marginRight: 6 }} />
                  <Text className="text-sm text-muted dark:text-muted-dark">
                    {booking.tourPackage.location.name}
                  </Text>
                </View>
              )}
              {booking.tourPackage?.duration && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="calendar-outline" size={16} color={mutedColor} style={{ marginRight: 6 }} />
                  <Text className="text-sm text-muted dark:text-muted-dark">
                    {booking.tourPackage.duration} {booking.tourPackage.duration === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Booking Details */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKING_INFO)}
            </Text>
            <View className="gap-3 p-4 rounded-xl" style={{ backgroundColor: surfaceColor, borderWidth: 1, borderColor }}>
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color={mutedColor} style={{ marginRight: 12, width: 24 }} />
                <View className="flex-1">
                  <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKED_ON)}</Text>
                  <Text className="text-sm font-semibold text-text dark:text-text-dark">{formatDate(booking.bookingDate)}</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={20} color={mutedColor} style={{ marginRight: 12, width: 24 }} />
                <View className="flex-1">
                  <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.PACKAGE_BOOKING.QUANTITY)}</Text>
                  <Text className="text-sm font-semibold text-text dark:text-text-dark">
                    {booking.quantity} {booking.quantity === 1 ? 'person' : 'people'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={20} color={mutedColor} style={{ marginRight: 12, width: 24 }} />
                <View className="flex-1">
                  <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.PACKAGE_BOOKING.TOTAL_PRICE)}</Text>
                  <Text className="text-lg font-bold" style={{ color: primaryColor }}>
                    ৳{booking.totalPrice.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Special Requests */}
          {booking.specialRequests && (
            <View className="mb-6">
              <Text className="mb-3 text-lg font-bold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.PACKAGE_BOOKING.SPECIAL_REQUESTS)}
              </Text>
              <View className="p-4 rounded-xl" style={{ backgroundColor: surfaceColor, borderWidth: 1, borderColor }}>
                <Text className="text-sm text-text dark:text-text-dark">{booking.specialRequests}</Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {booking.notes && (
            <View className="mb-6">
              <Text className="mb-3 text-lg font-bold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.PACKAGE_BOOKING.NOTES)}
              </Text>
              <View className="p-4 rounded-xl" style={{ backgroundColor: surfaceColor, borderWidth: 1, borderColor }}>
                <Text className="text-sm text-text dark:text-text-dark">{booking.notes}</Text>
              </View>
            </View>
          )}

          {/* Cancellation Info */}
          {booking.status === 'CANCELLED' && (
            <View className="mb-6">
              <Text className="mb-3 text-lg font-bold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANCELLATION_INFO)}
              </Text>
              <View className="p-4 rounded-xl" style={{ backgroundColor: `${errorColor}10`, borderWidth: 1, borderColor: `${errorColor}40` }}>
                {booking.cancelledAt && (
                  <Text className="mb-2 text-sm text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANCELLED_ON)}: {formatDate(booking.cancelledAt)}
                  </Text>
                )}
                {booking.cancellationReason && (
                  <Text className="mb-1 text-sm text-text dark:text-text-dark">
                    <Text className="font-semibold">{t(TRANSLATION_KEYS.PACKAGE_BOOKING.REASON)}:</Text> {booking.cancellationReason}
                  </Text>
                )}
                {booking.cancellationNotes && (
                  <Text className="text-sm text-text dark:text-text-dark">
                    <Text className="font-semibold">{t(TRANSLATION_KEYS.PACKAGE_BOOKING.NOTES)}:</Text> {booking.cancellationNotes}
                  </Text>
                )}
              </View>
            </View>
          )}

          {eligibilityLoading && showCancelSection && (
            <View className="items-center mb-6">
              <ActivityIndicator size="small" color={primaryColor} />
            </View>
          )}

          {eligibility && showCancelSection && (
            <View className="mb-6">
              <CancellationEligibilityPreview
                eligibility={eligibility}
                t={t}
                surfaceColor={surfaceColor}
                borderColor={borderColor}
                textColor={textColor}
                mutedColor={mutedColor}
                primaryColor={primaryColor}
              />
            </View>
          )}

          {/* Cancel Button */}
          {showCancelSection && (
            <TouchableOpacity
              onPress={handleCancelPress}
              disabled={!eligibility?.canCancel || eligibilityLoading}
              className="flex-row items-center justify-center p-4 rounded-xl"
              style={{
                backgroundColor:
                  !eligibility?.canCancel || eligibilityLoading ? mutedColor : errorColor,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text className="text-base font-bold text-white">
                {eligibility
                  ? getCancelActionLabel(eligibility)
                  : t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANCEL_BOOKING)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View
            className="p-6 rounded-t-3xl"
            style={{
              backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface,
              maxHeight: '80%',
            }}
          >
            <Text className="mb-4 text-2xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANCEL_BOOKING)}
            </Text>

            <Text className="mb-4 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANCEL_CONFIRMATION)}
            </Text>

            {eligibility && (
              <CancellationEligibilityPreview
                eligibility={eligibility}
                t={t}
                surfaceColor={isDark ? '#1a1a1a' : '#f5f5f5'}
                borderColor={borderColor}
                textColor={textColor}
                mutedColor={mutedColor}
                primaryColor={primaryColor}
              />
            )}

            {/* Reason Input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANCEL_REASON)} ({t(TRANSLATION_KEYS.BOOKING.OPTIONAL)})
              </Text>
              <TextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder={t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANCEL_REASON_PLACEHOLDER)}
                placeholderTextColor={mutedColor}
                className="p-3 text-sm rounded-lg text-text dark:text-text-dark"
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  borderWidth: 1,
                  borderColor,
                }}
                maxLength={500}
              />
            </View>

            {/* Notes Input */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.PACKAGE_BOOKING.ADDITIONAL_NOTES)} ({t(TRANSLATION_KEYS.BOOKING.OPTIONAL)})
              </Text>
              <TextInput
                value={cancelNotes}
                onChangeText={setCancelNotes}
                placeholder={t(TRANSLATION_KEYS.PACKAGE_BOOKING.NOTES_PLACEHOLDER)}
                placeholderTextColor={mutedColor}
                multiline
                numberOfLines={3}
                className="p-3 text-sm rounded-lg text-text dark:text-text-dark"
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  borderWidth: 1,
                  borderColor,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                maxLength={500}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="flex-1 p-4 rounded-xl"
                style={{ backgroundColor: isDark ? '#333' : '#e0e0e0' }}
                activeOpacity={0.8}
              >
                <Text className="text-base font-bold text-center" style={{ color: textColor }}>
                  {t(TRANSLATION_KEYS.COMMON.CANCEL)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmCancel}
                disabled={cancelLoading || !eligibility?.canCancel}
                className="flex-row items-center justify-center flex-1 p-4 rounded-xl"
                style={{
                  backgroundColor:
                    cancelLoading || !eligibility?.canCancel ? mutedColor : errorColor,
                }}
                activeOpacity={0.8}
              >
                {cancelLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={24} color="#fff" style={{ marginRight: 4 }} />
                    <Text className="text-base font-bold text-white">
                      {t(TRANSLATION_KEYS.COMMON.CONFIRM)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
