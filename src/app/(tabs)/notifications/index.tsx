import React, { useCallback, useMemo } from 'react';
import { View, Text, SectionList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { useLanguage } from '../../../providers/LanguageProvider';
import { useNotificationInbox } from '../../../hooks/useNotificationInbox';
import { useHotelAdminSession } from '../../../hooks/useHotelAdminSession';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { AppNotification } from '../../../types/notification';

function iconFor(type?: string | null): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'HOTEL_BOOKING':
      return 'bed-outline';
    case 'TRANSPORT_BOOKING':
    case 'TRANSPORT_SERVICE':
      return 'bus-outline';
    case 'ACTIVITY_BOOKING':
      return 'walk-outline';
    case 'GUIDE_SERVICE':
    case 'GUIDE_BOOKING':
      return 'person-outline';
    case 'PACKAGE_BOOKING':
    case 'TRIP_PACKAGE':
      return 'map-outline';
    case 'WALLET':
      return 'wallet-outline';
    case 'COMPLAINT':
      return 'chatbubble-ellipses-outline';
    default:
      return 'notifications-outline';
  }
}

function formatWhen(value: string, language: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isToday(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

export default function NotificationsTab() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { isHotelAdmin, pending } = useHotelAdminSession();
  const { items, loading, markingAll, openNotification, markAllRead, load } = useNotificationInbox({ traveler: !isHotelAdmin });
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const pale = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const hasUnread = items.some((item) => !item.isRead);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const sections = useMemo(() => {
    const today = items.filter((item) => isToday(item.createdAt));
    const earlier = items.filter((item) => !isToday(item.createdAt));
    const groups: { title: string; data: AppNotification[] }[] = [];
    if (today.length > 0) {
      groups.push({ title: t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.TODAY), data: today });
    }
    if (earlier.length > 0) {
      groups.push({ title: t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.EARLIER), data: earlier });
    }
    return groups;
  }, [items, t]);

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      onPress={() => openNotification(item)}
      accessibilityRole="button"
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 16,
        backgroundColor: surface,
        paddingHorizontal: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: pale,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconFor(item.relatedEntityType)} size={22} color={primaryColor} />
      </View>
      <View className="flex-1 ml-3">
        <Text
          className={item.isRead ? 'text-sm text-muted dark:text-muted-dark' : 'text-sm font-semibold text-text dark:text-text-dark'}
        >
          {item.content}
        </Text>
        <Text className="mt-1.5 text-xs" style={{ color: muted }}>
          {formatWhen(item.createdAt, currentLanguage)}
        </Text>
      </View>
      {!item.isRead ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            marginTop: 6,
            marginLeft: 8,
            backgroundColor: primaryColor,
          }}
        />
      ) : null}
    </Pressable>
  );

  if (pending) {
    return (
      <View className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-6 pt-4 pb-4">
        <Text className="flex-1 text-3xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.TITLE)}
        </Text>
        {hasUnread ? (
          <Pressable onPress={markAllRead} disabled={markingAll} accessibilityRole="button" style={{ paddingVertical: 8 }}>
            <Text className="text-sm font-semibold" style={{ color: primaryColor, opacity: markingAll ? 0.5 : 1 }}>
              {t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.MARK_ALL_READ)}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {loading && items.length === 0 ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : items.length === 0 ? (
        <View className="items-center justify-center flex-1 px-8">
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: pale,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="notifications-outline" size={32} color={primaryColor} />
          </View>
          <Text className="mt-4 text-base font-semibold text-center text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.EMPTY)}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text className="px-6 pt-2 pb-2 text-sm font-semibold text-muted dark:text-muted-dark">
              {section.title}
            </Text>
          )}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </SafeAreaView>
  );
}
