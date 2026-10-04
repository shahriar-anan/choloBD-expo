import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../ui/LanguageToggle';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface HotelDeskSettingsProps {
  onLogout: () => void;
  showHeading?: boolean;
}

export function HotelDeskSettings({ onLogout, showHeading = true }: HotelDeskSettingsProps) {
  const { t } = useTranslation();
  const { isDark, mode, setMode } = useTheme();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const cycleAppearance = () => {
    if (mode === 'system') {
      void setMode('light');
      return;
    }
    if (mode === 'light') {
      void setMode('dark');
      return;
    }
    void setMode('system');
  };

  const appearanceLabel = mode === 'light'
    ? TRANSLATION_KEYS.PROFILE.APPEARANCE_LIGHT
    : mode === 'dark'
      ? TRANSLATION_KEYS.PROFILE.APPEARANCE_DARK
      : TRANSLATION_KEYS.PROFILE.APPEARANCE_SYSTEM;

  return (
    <View className={showHeading ? 'mt-6' : 'mt-4'}>
      {showHeading ? (
        <Text className="mb-2 text-base font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.SETTINGS)}
        </Text>
      ) : null}
      <View className="overflow-hidden bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
        <View className="flex-row items-center px-4 py-3">
          <Ionicons name="language-outline" size={22} color={textColor} />
          <Text className="flex-1 ml-3 text-base text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.COMMON.LANGUAGE)}
          </Text>
          <LanguageToggle textColor={textColor} isDark={isDark} size="small" />
        </View>
        <View className="h-px mx-4 bg-border dark:bg-border-dark" />
        <Pressable onPress={cycleAppearance} accessibilityRole="button" className="flex-row items-center px-4 py-4">
          <Ionicons name="contrast-outline" size={22} color={textColor} />
          <Text className="flex-1 ml-3 text-base text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.PROFILE.APPEARANCE)}
          </Text>
          <Text className="mr-2 text-sm text-muted dark:text-muted-dark">{t(appearanceLabel)}</Text>
          <Ionicons name="chevron-forward" size={18} color={muted} />
        </Pressable>
        <View className="h-px mx-4 bg-border dark:bg-border-dark" />
        <Pressable onPress={onLogout} accessibilityRole="button" className="flex-row items-center px-4 py-4">
          <Ionicons name="log-out-outline" size={22} color={primary} />
          <Text className="flex-1 ml-3 text-base font-semibold" style={{ color: primary }}>
            {t(TRANSLATION_KEYS.COMMON.LOGOUT)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
