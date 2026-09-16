import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import theme from '../../../../constants/theme';
import { useTheme } from '../../../../hooks/useTheme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';

/**
 * Hotel staff roster is provisioned by MASTER_ADMIN (PUT /users/:id/role).
 * There is no SERVICE_ADMIN staff-list API — show an honest empty state instead of dummy data.
 */
export default function StaffPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <View className="p-6">
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={24} color={text} />
        </Pressable>

        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.STAFF_INFO)}
        </Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.STAFF_INFO_DESC)}
        </Text>

        <View className="items-center p-6 py-12 mt-8 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
          <Ionicons
            name="people-outline"
            size={48}
            color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
          />
          <Text className="mt-4 text-base font-semibold text-center text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.STAFF.UNAVAILABLE_TITLE)}
          </Text>
          <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark px-4">
            {t(TRANSLATION_KEYS.DASHBOARD.STAFF.UNAVAILABLE_DESC)}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
