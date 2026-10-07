import React, { useEffect } from 'react';
import { View, ScrollView, Text, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { useLanguage } from '../../../providers/LanguageProvider';
import theme from '../../../constants/theme';
import { RootState } from '../../../store/store';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import { TrackingCard } from '../../../components/ui/TrackingCard';
import { AdminCard } from '../../../components/ui/adminCard';
import { TransportLiveBoard } from '../../../components/transportOperator/TransportLiveBoard';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';

export default function TrackingPage() {
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);
  const { bookings, loading, onRefresh, serviceType, operatorProfileLoaded } = useDashboardLogic();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // Refresh bookings when page is focused
  useEffect(() => {
    onRefresh();
  }, []);

  const isServiceAdmin = (auth.user as any)?.role === 'SERVICE_ADMIN';
  const isHotelAdmin = isServiceAdmin && serviceType === 'HOTEL_BOOKING';
  const isTransportAdmin = isServiceAdmin && serviceType === 'TRANSPORT_SERVICE';
  const showPackageBookings = isServiceAdmin && operatorProfileLoaded && !isHotelAdmin && !isTransportAdmin;

  const handleDetailsPress = (bookingId: string) => {
    router.push(`/(tabs)/dashboard/${bookingId}`);
  };

  const handleQRPress = (bookingId: string) => {
    router.push(`/(tabs)/dashboard/${bookingId}/qr-generate`);
  };

  const handleCameraPress = () => {
    // Navigate to QR scanner for service admin
    router.push('/(tabs)/dashboard/service-admin/qr-scanner');
  };

  const renderBookingCard = ({ item }: { item: any }) => {
    // For regular users: show hotel name
    // For service admins: show guest name
    const displayTitle = isServiceAdmin
      ? item.user?.userName || item.user?.firstName || 'Guest'
      : item.hotel?.name || 'Hotel';

    const displaySubtitle = isServiceAdmin
      ? item.hotel?.name
      : item.user?.userName || item.user?.email;

    return (
      <TrackingCard
        title={displayTitle}
        subtitle={displaySubtitle}
        checkInDate={item.checkInDate}
        checkOutDate={item.checkOutDate}
        onDetailsPress={() => handleDetailsPress(item.id)}
        onQRPress={() => handleQRPress(item.id)}
        onCameraPress={isServiceAdmin ? handleCameraPress : undefined}
        isServiceAdmin={isServiceAdmin}
      />
    );
  };

  if (isServiceAdmin && !operatorProfileLoaded) {
    return (
      <View className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator color={isDark ? theme.colors['primary-dark'] : theme.colors.primary} />
      </View>
    );
  }

  if (isTransportAdmin) {
    return <TransportLiveBoard />;
  }

  // If SERVICE_ADMIN, show cards to navigate to different booking types
  if (isServiceAdmin) {
    return (
      <ScrollView className="flex-1 bg-background dark:bg-background-dark" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-8 pb-4">
          <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRACKING.MANAGE_STAYS)}</Text>
          <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRACKING.TRACK_BOOKING)}</Text>
        </View>

        <View className="px-6 pb-8 space-y-3">
          <AdminCard
            title={t(TRANSLATION_KEYS.TRACKING.CURRENT_BOOKINGS)}
            subtitle={t(TRANSLATION_KEYS.TRACKING.CURRENT_BOOKINGS_DESC)}
            onPress={() => router.push('/(tabs)/tracking/hotel-bookings')}
          />
          {showPackageBookings ? (
            <AdminCard
              title={t(TRANSLATION_KEYS.TRACKING.PACKAGE_BOOKINGS)}
              subtitle={t(TRANSLATION_KEYS.TRACKING.PACKAGE_BOOKINGS_DESC)}
              onPress={() => router.push('/(tabs)/tracking/package-bookings')}
            />
          ) : null}
        </View>
      </ScrollView>
    );
  }

  // Regular user view - show their bookings
  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-8 pb-4">
        <Text className="text-sm text-muted dark:text-muted-dark flex-1">{t(TRANSLATION_KEYS.TRACKING.MANAGE_STAYS)}</Text>
        <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark flex-1">{t(TRANSLATION_KEYS.TRACKING.TRACK_BOOKING)}</Text>
      </View>

      {loading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : bookings && bookings.length > 0 ? (
        <View className="px-6 pb-8">
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={renderBookingCard}
            scrollEnabled={false}
          />
        </View>
      ) : (
        <View className="px-6 py-12 items-center">
          <Text className="text-lg font-semibold text-text dark:text-text-dark mb-2">{t(TRANSLATION_KEYS.TRACKING.NO_BOOKINGS_FOUND)}</Text>
          <Text className="text-sm text-muted dark:text-muted-dark flex-1">
            {isServiceAdmin ? t(TRANSLATION_KEYS.TRACKING.NO_GUEST_BOOKINGS) : t(TRANSLATION_KEYS.TRACKING.NO_ACTIVE_BOOKINGS)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
