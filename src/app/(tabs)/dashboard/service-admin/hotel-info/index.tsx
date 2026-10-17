import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DeskCard, DeskScreen, MenuRow } from '../../../../../components/hotelDesk/chrome';
import { textForAppLanguage } from '../../../../../components/hotelDesk/draft';
import { useHotelProperty } from '../../../../../components/hotelDesk/HotelPropertyContext';
import { TRANSLATION_KEYS } from '../../../../../constants/translationKeys';
import { useTheme } from '../../../../../hooks/useTheme';
import theme from '../../../../../constants/theme';

export default function HotelPropertyHome() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const banglaApp = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('bn');
  const { hotel, hotelId, rooms, reviews, loading, loadError, reviewsError } = useHotelProperty();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  if (loading) {
    return (
      <DeskScreen title={textForAppLanguage(hotel?.name, hotel?.nameBn, banglaApp) || t(TRANSLATION_KEYS.HOTEL_DESK.PROPERTY_DETAILS)}>
        <ActivityIndicator color={primary} />
      </DeskScreen>
    );
  }

  if (loadError || !hotel) {
    return (
      <DeskScreen title={t(TRANSLATION_KEYS.HOTEL_DESK.PROPERTY_DETAILS)}>
        <Text className="text-base text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.NO_HOTEL_ASSIGNED)}</Text>
      </DeskScreen>
    );
  }

  const location = textForAppLanguage(hotel.location?.city || hotel.location?.name, hotel.location?.nameBn, banglaApp);
  const description = textForAppLanguage(hotel.description, hotel.descriptionBn, banglaApp);
  const scores = reviews.map((review) => Number(review.rating)).filter((score) => Number.isFinite(score));
  const average = scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : Number(hotel.rating);
  const rating = Number.isFinite(average) ? average.toFixed(1) : '0.0';
  const ready = rooms.filter((room) => String(room.roomStatus || '').toUpperCase() === 'AVAILABLE').length;
  const stay = [hotel.checkInTime, hotel.checkOutTime].filter(Boolean).join('–');
  const open = (path: string) => router.push(`${path}?hotelId=${hotelId}` as any);

  return (
    <DeskScreen title={textForAppLanguage(hotel.name, hotel.nameBn, banglaApp) || t(TRANSLATION_KEYS.HOTEL_DESK.PROPERTY_DETAILS)}>
      {location ? <Text className="mb-2 text-[15px] text-muted dark:text-muted-dark">{location}</Text> : null}
      {description ? (
        <Text className="mb-4 text-[15px] leading-6 text-text dark:text-text-dark" numberOfLines={4}>{description}</Text>
      ) : null}
      <DeskCard>
        <MenuRow
          label={t(TRANSLATION_KEYS.HOTEL_DESK.REVIEWS)}
          hint={reviewsError
            ? t(TRANSLATION_KEYS.HOTEL_DESK.REVIEWS_FAILED)
            : t(TRANSLATION_KEYS.HOTEL_DESK.AVERAGE_REVIEWS, { rating, count: reviews.length })}
          onPress={() => open('/(tabs)/dashboard/service-admin/hotel-info/reviews')}
        />
        <MenuRow
          label={t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOMS)}
          hint={t(TRANSLATION_KEYS.HOTEL_DESK.ROOMS_READY, { count: rooms.length, ready })}
          onPress={() => open('/(tabs)/dashboard/service-admin/hotel-info/rooms')}
        />
        <MenuRow
          label={t(TRANSLATION_KEYS.HOTEL_DESK.PROPERTY_DETAILS)}
          onPress={() => open('/(tabs)/dashboard/service-admin/hotel-info/property')}
        />
        <MenuRow
          label={t(TRANSLATION_KEYS.HOTEL_DESK.STAY_TIMES)}
          value={stay || undefined}
          onPress={() => open('/(tabs)/dashboard/service-admin/hotel-info/stay')}
        />
        <MenuRow
          label={t(TRANSLATION_KEYS.HOTEL_DESK.ALLOW_SHIFT_BOOKINGS)}
          value={hotel.allowShiftBooking ? t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_BOOKING_ON) : t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_BOOKING_OFF)}
          onPress={() => open('/(tabs)/dashboard/service-admin/hotel-info/stay')}
        />
        <MenuRow
          label={t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_RATES)}
          value={t(TRANSLATION_KEYS.HOTEL_DESK.TYPES_COUNT, { count: hotel.roomTypes?.length ?? 0 })}
          last
          onPress={() => open('/(tabs)/dashboard/service-admin/hotel-info/rates')}
        />
      </DeskCard>
      {hotel.hotelCategories?.length ? (
        <View className="flex-row flex-wrap gap-2">
          {hotel.hotelCategories.map((item: any, index: number) => (
            <View key={item.id || item.categoryId || `${item.category?.name}-${index}`} className="px-3 py-2 rounded-full bg-white dark:bg-surface-dark">
              <Text className="text-sm text-text dark:text-text-dark">
                {textForAppLanguage(item.category?.name || item.name, item.category?.nameBn, banglaApp)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </DeskScreen>
  );
}
