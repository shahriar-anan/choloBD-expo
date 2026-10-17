/**
 * Tour Booking Page
 * Page for purchasing a tour package
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { KeyboardAwareScroll } from '../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../providers/LanguageProvider';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchTourPlanDetail } from '../../../store/slices/tourBuilderSlice';
import { TourBookingForm } from '../../../components/tourBuilder/TourBookingForm';
import { usePackageBookingLogic } from '../../../hooks/usePackageBookingLogic';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { roleBookings } from '../../../utilities/travelerShell';
import { goBack } from '../../../utilities/navigation';
import { AppAlert } from '../../../components/ui/appAlert';

console.log('[TourBookingPage] Component loaded');

export default function TourBookingPage() {
  const router = useRouter();
  const { packageId } = useLocalSearchParams<{ packageId: string }>();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
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
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  // Fetch package details on mount
  useEffect(() => {
    if (packageId) {
      console.log('[TourBookingPage] Fetching tour package:', packageId);
      dispatch(fetchTourPlanDetail({ tourPackageId: packageId, localize: true }));
    }
  }, [packageId, dispatch, currentLanguage]);

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
    goBack(router);
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
      <KeyboardAwareScroll className="flex-1" showsVerticalScrollIndicator={false}>
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
      </KeyboardAwareScroll>

      <AppAlert
        visible={showSuccessModal}
        tone="success"
        title={t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKING_SUCCESS)}
        message={t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKING_SUCCESS_DESC)}
        detailLabel={t(TRANSLATION_KEYS.PACKAGE_BOOKING.CONFIRMATION_CODE)}
        detail={lastPurchasedBooking?.confirmationCode}
        footnote={t(TRANSLATION_KEYS.PACKAGE_BOOKING.PAYMENT_COMING_SOON)}
        actions={[{ label: t(TRANSLATION_KEYS.PACKAGE_BOOKING.VIEW_MY_BOOKINGS), tone: 'primary' }]}
        onDismiss={handleCloseSuccessModal}
        onAction={handleCloseSuccessModal}
      />
    </SafeAreaView>
  );
}
