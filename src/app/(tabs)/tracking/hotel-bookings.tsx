import React, { useEffect } from 'react';
import { View, ScrollView, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { RootState } from '../../../store/store';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import { TrackingCard } from '../../../components/ui/TrackingCard';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { goBack } from '../../../utilities/navigation';

export default function HotelBookingsPage() {
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);
  const { bookings, loading, onRefresh } = useDashboardLogic();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Refresh bookings when page is focused
  useEffect(() => {
    onRefresh();
  }, []);

  const isServiceAdmin = (auth.user as any)?.role === 'SERVICE_ADMIN';

  const handleDetailsPress = (bookingId: string) => {
    router.push(`/(tabs)/dashboard/${bookingId}`);
  };

  const handleQRPress = (bookingId: string) => {
    router.push(`/(tabs)/dashboard/${bookingId}/qr-generate`);
  };

  const handleCameraPress = () => {
    router.push('/(tabs)/dashboard/service-admin/qr-scanner');
  };

  const renderBookingCard = ({ item }: { item: any }) => {
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

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-8 pb-4">
        <TouchableOpacity onPress={() => goBack(router)} className="mb-4">
          <View className="flex-row items-center">
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? theme.colors['text-dark'] : theme.colors.text}
            />
            <Text className="ml-2 text-base text-primary dark:text-primary-dark">
              {t(TRANSLATION_KEYS.COMMON.BACK)}
            </Text>
          </View>
        </TouchableOpacity>

        <Text className="text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRACKING.HOTEL_BOOKINGS_SUBTITLE)}
        </Text>
        <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRACKING.CURRENT_BOOKINGS)}
        </Text>
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
          <Text className="text-lg font-semibold text-text dark:text-text-dark mb-2">
            {t(TRANSLATION_KEYS.TRACKING.NO_BOOKINGS_FOUND)}
          </Text>
          <Text className="text-sm text-muted dark:text-muted-dark text-center">
            {t(TRANSLATION_KEYS.TRACKING.NO_GUEST_BOOKINGS)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
