import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DeskScreen } from '../../../../../components/hotelDesk/chrome';
import { useHotelProperty } from '../../../../../components/hotelDesk/HotelPropertyContext';
import { TRANSLATION_KEYS } from '../../../../../constants/translationKeys';
import { useTheme } from '../../../../../hooks/useTheme';
import theme from '../../../../../constants/theme';
import { appDateLocale, formatDeskDate } from '../../../../../utilities/hotelDesk';

export default function ReviewsScreen() {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const { reviews, reviewsError, loading } = useHotelProperty();
  const [openId, setOpenId] = useState<string | null>(null);
  const locale = appDateLocale(i18n.language);

  return (
    <DeskScreen title={t(TRANSLATION_KEYS.HOTEL_DESK.REVIEWS)}>
      {loading && reviews.length === 0 ? (
        <Text className="text-base text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.LOADING_HOTEL_DETAILS)}</Text>
      ) : null}
      {!loading && reviewsError ? (
        <Text className="text-base text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.REVIEWS_FAILED)}</Text>
      ) : null}
      {!loading && !reviewsError && reviews.length === 0 ? (
        <Text className="text-base text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.NO_REVIEWS)}</Text>
      ) : null}
      {reviews.map((review) => {
        const name = [review.user?.firstName, review.user?.lastName].filter(Boolean).join(' ')
          || review.user?.userName
          || t(TRANSLATION_KEYS.HOTEL_DESK.GUEST);
        const stars = Math.max(0, Math.min(5, Math.round(Number(review.rating) || 0)));
        const expanded = openId === review.id;
        return (
          <View key={review.id} className="p-4 mb-3 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark">
            <View className="flex-row items-center mb-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Ionicons key={index} name={index < stars ? 'star' : 'star-outline'} size={14} color={warning} />
              ))}
              <Text className="ml-2 text-sm font-semibold text-text dark:text-text-dark">{Number(review.rating) || 0}</Text>
            </View>
            <Text className="text-base font-semibold text-text dark:text-text-dark">{name}</Text>
            <Text className="mt-1 text-[13px] text-muted dark:text-muted-dark">{formatDeskDate(review.createdAt, locale)}</Text>
            {review.description ? (
              <>
                <Text className="mt-2 text-[15px] leading-6 text-text dark:text-text-dark" numberOfLines={expanded ? undefined : 3}>
                  {review.description}
                </Text>
                {String(review.description).length > 120 ? (
                  <TouchableOpacity onPress={() => setOpenId(expanded ? null : review.id)} className="justify-center h-12">
                    <Text className="font-semibold text-primary dark:text-primary-dark">
                      {expanded ? t(TRANSLATION_KEYS.HOTEL_SEARCH.SHOW_LESS) : t(TRANSLATION_KEYS.HOTEL_SEARCH.READ_MORE)}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}
          </View>
        );
      })}
    </DeskScreen>
  );
}
