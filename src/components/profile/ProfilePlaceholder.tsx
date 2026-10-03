import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface ProfilePlaceholderProps {
  title: string;
}

export function ProfilePlaceholder({ title }: ProfilePlaceholderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 pt-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">{title}</Text>
      </View>
    </SafeAreaView>
  );
}
