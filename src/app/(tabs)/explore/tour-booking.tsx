/**
 * Tour Booking Page
 * Page for purchasing a tour package
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchTourPlanDetail } from '../../../store/slices/tourBuilderSlice';
import { TourBookingForm } from '../../../components/tourBuilder/TourBookingForm';
import { usePackageBookingLogic } from '../../../hooks/usePackageBookingLogic';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { roleBookings } from '../../../utilities/travelerShell';

console.log('[TourBookingPage] Component loaded');

export default function TourBookingPage() {
  const router = useRouter();
  const { packageId } = useLocalSearchParams<{ packageId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { detail: tourPackage, detailLoading } = useSelector((state: RootState) => state.tourBuilder);
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const {
    handlePurchase,
    purchaseLoading,
    lastPurchasedBooking,
    clearLastPurchased,
  } = usePackageBookingLogic();

  const [quantity, setQuantity] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  // Fetch package details on mount
  useEffect(() => {
    if (packageId) {
      console.log('[TourBookingPage] Fetching tour package:', packageId);
      dispatch(fetchTourPlanDetail(packageId));
    }
  }, [packageId, dispatch]);

  // Show success modal when booking is created
  useEffect(() => {
    if (lastPurchasedBooking) {
      console.log('[TourBookingPage] Booking created:', lastPurchasedBooking.confirmationCode);
      setShowSuccessModal(true);
    }
  }, [lastPurchasedBooking]);

  const handleSubmit = async () => {
    if (!packageId) return;

    const bookingData = {
      quantity,
      specialRequests: specialRequests.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    await handlePurchase(packageId, bookingData);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    clearLastPurchased();
    router.replace(roleBookings(role));
  };

  const handleBack = () => {
    router.back();
  };

  if (detailLoading || !tourPackage) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
        <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.COMMON.LOADING)}...
        </Text>
      </SafeAreaView>
    );
  }

  // Check if package is active
  if (!tourPackage.isActive) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <View className="px-6 pt-4 pb-4 flex-row items-center">
          <Ionicons name="chevron-back" size={24} color={primaryColor} onPress={handleBack} />
          <Text className="ml-3 text-2xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOK_TOUR)}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="close-circle-outline" size={64} color={mutedColor} />
          <Text className="mt-4 text-lg font-semibold text-center text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.PACKAGE_BOOKING.PACKAGE_INACTIVE)}
          </Text>
          <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.PACKAGE_BOOKING.PACKAGE_INACTIVE_DESC)}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center">
          <Ionicons name="chevron-back" size={24} color={primaryColor} onPress={handleBack} />
          <View className="flex-1 ml-3">
            <Text className="text-2xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOK_TOUR)}
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.COMPLETE_BOOKING)}
            </Text>
          </View>
        </View>

        {/* Booking Form */}
        <View className="px-6 pb-6">
          <TourBookingForm
            packageName={tourPackage.packageName}
            totalBudget={tourPackage.totalBudget}
            maxGroupSize={tourPackage.maxGroupSize}
            quantity={quantity}
            setQuantity={setQuantity}
            specialRequests={specialRequests}
            setSpecialRequests={setSpecialRequests}
            notes={notes}
            setNotes={setNotes}
            onSubmit={handleSubmit}
            submitting={purchaseLoading}
          />
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseSuccessModal}
      >
        <View className="flex-1 items-center justify-center bg-black/50">
          <View
            className="w-11/12 p-6 rounded-2xl"
            style={{
              backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface,
              maxWidth: 400,
            }}
          >
            {/* Success Icon */}
            <View className="items-center mb-4">
              <View
                className="items-center justify-center w-20 h-20 rounded-full"
                style={{ backgroundColor: `${successColor}20` }}
              >
                <Ionicons name="checkmark-circle" size={48} color={successColor} />
              </View>
            </View>

            {/* Title */}
            <Text className="mb-2 text-2xl font-bold text-center text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKING_SUCCESS)}
            </Text>

            {/* Confirmation Code */}
            {lastPurchasedBooking && (
              <View className="items-center mb-4">
                <Text className="mb-1 text-sm text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.PACKAGE_BOOKING.CONFIRMATION_CODE)}
                </Text>
                <View
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: `${primaryColor}15`, borderWidth: 1, borderColor: `${primaryColor}40` }}
                >
                  <Text className="text-xl font-bold" style={{ color: primaryColor }}>
                    {lastPurchasedBooking.confirmationCode}
                  </Text>
                </View>
              </View>
            )}

            {/* Message */}
            <Text className="mb-6 text-sm text-center text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKING_SUCCESS_DESC)}
            </Text>

            {/* Payment Notice */}
            <View
              className="p-3 mb-6 rounded-lg"
              style={{ backgroundColor: `${mutedColor}10`, borderWidth: 1, borderColor: `${mutedColor}30` }}
            >
              <Text className="text-xs text-center text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.PACKAGE_BOOKING.PAYMENT_COMING_SOON)}
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              onPress={handleCloseSuccessModal}
              className="p-4 rounded-xl"
              style={{ backgroundColor: primaryColor }}
              activeOpacity={0.8}
            >
              <Text className="text-base font-bold text-center text-white">
                {t(TRANSLATION_KEYS.PACKAGE_BOOKING.VIEW_MY_BOOKINGS)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
