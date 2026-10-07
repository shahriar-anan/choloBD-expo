import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { goBack } from '../../utilities/navigation';

interface ProfilePlaceholderProps {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  detail?: string;
}

export function ProfilePlaceholder({ title, body, icon, detail }: ProfilePlaceholderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 pt-2">
        <Pressable
          onPress={() => goBack(router)}
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">{title}</Text>
      </View>

      <View className="px-4 mt-6">
        <View className="items-center px-6 py-8 bg-white border rounded-3xl border-border dark:bg-surface-dark dark:border-border-dark">
          <View
            className="items-center justify-center rounded-full bg-background dark:bg-background-dark"
            style={{ width: 56, height: 56 }}
          >
            <Ionicons name={icon} size={28} color={primary} />
          </View>
          <Text className="mt-4 text-base leading-6 text-center text-text dark:text-text-dark">{body}</Text>
          {detail ? (
            <Text className="mt-3 text-sm font-semibold text-muted dark:text-muted-dark">{detail}</Text>
          ) : null}
          <Text className="mt-4 text-sm font-bold" style={{ color: primary }}>
            {t(TRANSLATION_KEYS.COMMON.COMING_SOON)}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
