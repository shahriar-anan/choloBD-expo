import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import { RootState, AppDispatch } from '../../../../store/store';
import { fetchPackageBookingsByPackageId } from '../../../../store/slices/packageBookingSlice';
import { PackageBookingCard } from '../../../../components/tourBuilder/PackageBookingCard';
import { usePackageBookingLogic } from '../../../../hooks/usePackageBookingLogic';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { goBack } from '../../../../utilities/navigation';

export default function PackageBookingDetailsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { packageId } = useLocalSearchParams<{ packageId: string }>();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const { bookings, bookingsLoading } = useSelector((s: RootState) => s.packageBooking);
  const { handleCancelBooking } = usePackageBookingLogic();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (packageId) {
      dispatch(fetchPackageBookingsByPackageId({ tourPackageId: packageId }));
    }
  }, [packageId, dispatch]);

  const onRefresh = async () => {
    if (packageId) {
      setRefreshing(true);
      await dispatch(fetchPackageBookingsByPackageId({ tourPackageId: packageId }));
      setRefreshing(false);
    }
  };

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () =>
            handleCancelBooking(bookingId, {}, () => {
              if (packageId) {
                dispatch(fetchPackageBookingsByPackageId({ tourPackageId: packageId }));
              }
            }),
        },
      ]
    );
  };


  const filteredBookings = statusFilter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === statusFilter);

  const statusOptions = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
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
          {t(TRANSLATION_KEYS.TRACKING.PACKAGE_BOOKING_LIST)}
        </Text>
        <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRACKING.PACKAGE_BOOKINGS)}
        </Text>

        {/* Status Filter */}
        <View className="mt-4">
          <Text className="text-sm font-medium text-text dark:text-text-dark mb-2">
            {t(TRANSLATION_KEYS.PACKAGE_BOOKING.FILTER_BY_STATUS)}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.7}
                className={`mr-2 px-4 py-2 rounded-full ${
                  statusFilter === status
                    ? 'bg-primary dark:bg-primary-dark'
                    : 'bg-surface dark:bg-surface-dark border border-border dark:border-border-dark'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    statusFilter === status
                      ? 'text-white'
                      : 'text-text dark:text-text-dark'
                  }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {bookingsLoading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredBookings && filteredBookings.length > 0 ? (
        <View className="px-6 pb-8">
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PackageBookingCard booking={item} hideViewDetails onCancel={handleCancel} />
            )}
            scrollEnabled={false}
          />
        </View>
      ) : (
        <View className="px-6 py-12 items-center">
          <Ionicons
            name="calendar-outline"
            size={64}
            color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
          />
          <Text className="text-lg font-semibold text-text dark:text-text-dark mb-2 mt-4">
            {t(TRANSLATION_KEYS.PACKAGE_BOOKING.NO_BOOKINGS)}
          </Text>
          <Text className="text-sm text-muted dark:text-muted-dark text-center">
            {statusFilter === 'ALL'
              ? t(TRANSLATION_KEYS.TRACKING.NO_BOOKINGS_FOR_PACKAGE)
              : `No ${statusFilter} bookings found`}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
