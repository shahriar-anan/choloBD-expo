import React, { useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch, RootState } from '../store/store';
import { fetchTourPlanDetail } from '../store/slices/tourBuilderSlice';
import { DaySegmentCard } from '../components/tourBuilder/DaySegmentCard';
import { ErrorAlert } from '../components/tourBuilder/ErrorAlert';
import { useTheme } from '../hooks/useTheme';
import { theme } from '../constants/theme';
import { TRANSLATION_KEYS } from '../constants/translationKeys';
import { goBack } from '../utilities/navigation';

export default function TourPackageDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { detail, detailLoading, detailError } = useSelector((state: RootState) => state.tourBuilder);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const warningColor = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  useEffect(() => {
    if (id) {
      dispatch(fetchTourPlanDetail(id));
    }
  }, [id]);

  const handleBack = () => {
    goBack(router);
  };

  const handleBookTour = () => {
    if (!id) return;
    router.push({
      pathname: '/(tabs)/explore/tour-booking',
      params: { packageId: id },
    });
  };

  const handleUseAsPlan = () => {
    if (!id) return;
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    router.push({
      pathname: '/(tabs)/trip-planner/create',
      params: { templateId: id },
    });
  };

  if (detailLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
        <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TOUR_BUILDER.LOADING_DETAILS)}
        </Text>
      </SafeAreaView>
    );
  }

  if (detailError || !detail) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" style={{ paddingTop: insets.top }}>
        <View className="px-6 pt-2 pb-4 flex-row items-center">
          <Ionicons
            name="chevron-back"
            size={24}
            color={primaryColor}
            onPress={handleBack}
            style={{ marginRight: 12 }}
          />
          <Text className="text-2xl font-bold text-text dark:text-text-dark">Tour Details</Text>
        </View>
        <View className="flex-1 px-6">
          {detailError && <ErrorAlert error={detailError} onDismiss={() => {}} />}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pb-4 flex-row items-center">
          <Ionicons
            name="chevron-back"
            size={24}
            color={primaryColor}
            onPress={handleBack}
            style={{ marginRight: 12 }}
          />
          <Text className="text-2xl font-bold text-text dark:text-text-dark flex-1">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.TOUR_DETAILS_TITLE)}
          </Text>
        </View>

        {/* Tour Info */}
        <View className="px-6 mb-6">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {detail.packageName}
          </Text>

          {/* Badges */}
          <View className="flex-row gap-2 mt-3 flex-wrap">
            <View style={{ backgroundColor: isDark ? '#1e3a5f' : '#E3F2FD', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: primaryColor }}>
                {detail.tourType}
              </Text>
            </View>
            {detail.isPopular && (
              <View style={{ backgroundColor: isDark ? '#3f2c1e' : '#FFF3E0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: warningColor }}>
                  {t(TRANSLATION_KEYS.TOUR_BUILDER.POPULAR_BADGE)}
                </Text>
              </View>
            )}
            {!detail.isActive && (
              <View style={{ backgroundColor: isDark ? '#3f1e1e' : '#FFEBEE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: errorColor }}>
                  {t(TRANSLATION_KEYS.TOUR_BUILDER.INACTIVE_BADGE)}
                </Text>
              </View>
            )}
          </View>

          {detail.shortDescription && (
            <Text className="mt-3 text-sm text-muted dark:text-muted-dark leading-5">
              {detail.shortDescription}
            </Text>
          )}
        </View>

        {/* Quick Info Grid */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-4">
            <View style={{ flex: 1, backgroundColor: isDark ? '#1e3a5f' : '#E3F2FD', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: mutedColor, fontWeight: '600' }}>
                {t(TRANSLATION_KEYS.TOUR_BUILDER.DURATION_STAT)}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginTop: 4 }}>
                {detail.duration} {detail.duration === 1 ? t(TRANSLATION_KEYS.TOUR_BUILDER.DAY_SINGULAR) : t(TRANSLATION_KEYS.TOUR_BUILDER.DAYS_PLURAL)}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: isDark ? '#1e3f2c' : '#E8F5E9', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: mutedColor, fontWeight: '600' }}>
                {t(TRANSLATION_KEYS.TOUR_BUILDER.BUDGET_STAT)}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginTop: 4 }}>
                ৳{detail.totalBudget?.toLocaleString() || '0'}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: isDark ? '#312e58' : '#F3E5F5', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: mutedColor, fontWeight: '600' }}>
                {t(TRANSLATION_KEYS.TOUR_BUILDER.GROUP_SIZE_STAT)}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginTop: 4 }}>
                {detail.maxGroupSize || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Location */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center gap-2">
            <Ionicons name="location" size={18} color={errorColor} />
            <Text className="text-sm text-text dark:text-text-dark font-semibold">
              {detail.location.name}
            </Text>
          </View>
        </View>

        {/* Rating */}
        {detail.rating !== undefined && detail.rating !== null && (
          <View className="px-6 mb-6">
            <View className="flex-row items-center gap-2">
              <Ionicons name="star" size={18} color={warningColor} />
              <Text className="text-sm text-text dark:text-text-dark font-semibold">
                {detail.rating.toFixed(1)} / 5.0
              </Text>
            </View>
          </View>
        )}

        {/* Day Segments */}
        {detail.daySegments && detail.daySegments.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-lg font-bold text-text dark:text-text-dark mb-3">
              {t(TRANSLATION_KEYS.TOUR_BUILDER.ITINERARY)}
            </Text>
            {detail.daySegments.map((segment, index) => (
              <View key={index} className="mb-3">
                <DaySegmentCard
                  segment={segment}
                  dayNumber={segment.dayNumber}
                  isEditable={false}
                  isEnriched={true}
                />
              </View>
            ))}
          </View>
        )}

        {detail.isActive && <View style={{ height: 148 }} />}
      </ScrollView>

      {detail.isActive && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: isDark ? theme.colors['border-dark'] : theme.colors.border,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: Math.max(16, insets.bottom),
            gap: 8,
            backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface,
          }}
        >
          <TouchableOpacity
            onPress={handleUseAsPlan}
            className="flex-row items-center justify-center p-4 rounded-lg"
            style={{ borderWidth: 1, borderColor: primaryColor }}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={20} color={primaryColor} style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold" style={{ color: primaryColor }}>
              {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_USE_AS_PLAN)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleBookTour}
            className="flex-row items-center justify-center p-4 rounded-lg"
            style={{ backgroundColor: successColor }}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold text-white">
              {t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOK_THIS_TOUR)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
