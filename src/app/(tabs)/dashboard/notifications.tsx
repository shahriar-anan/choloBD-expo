import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { useLanguage } from '../../../providers/LanguageProvider';
import { useNotificationInbox } from '../../../hooks/useNotificationInbox';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { AppNotification } from '../../../types/notification';

function formatCreatedTime(value: string, language: string): string {
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

export default function NotificationsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { items, loading, markingAll, openNotification, markAllRead } = useNotificationInbox();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const unreadSurface = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];
  const hasUnread = items.some((item) => !item.isRead);

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      onPress={() => openNotification(item)}
      accessibilityRole="button"
      className="px-4 py-4 border-b border-border dark:border-border-dark"
      style={{ backgroundColor: item.isRead ? 'transparent' : unreadSurface }}
    >
      <View className="flex-row items-start">
        {!item.isRead ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              marginTop: 6,
              marginRight: 8,
              backgroundColor: primaryColor,
            }}
          />
        ) : null}
        <View className="flex-1">
          <Text
            className={
              item.isRead
                ? 'text-sm text-muted dark:text-muted-dark'
                : 'text-sm font-semibold text-text dark:text-text-dark'
            }
          >
            {item.content}
          </Text>
          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
            {formatCreatedTime(item.createdAt, currentLanguage)}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1">
        <View className="flex-row items-center px-4 pt-2 pb-3">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.BACK)}
            style={{ padding: 6, marginRight: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </Pressable>
          <Text className="flex-1 text-2xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.TITLE)}
          </Text>
          {hasUnread ? (
            <Pressable
              onPress={markAllRead}
              disabled={markingAll}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.MARK_ALL_READ)}
            >
              <Text className="text-sm font-semibold" style={{ color: primaryColor, opacity: markingAll ? 0.5 : 1 }}>
                {t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.MARK_ALL_READ)}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View className="items-center justify-center flex-1">
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : items.length === 0 ? (
          <Text className="px-6 mt-8 text-sm text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.EMPTY)}
          </Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
