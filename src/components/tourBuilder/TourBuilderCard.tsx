/**
 * Tour Builder Card Component
 * Modern, clean card for service admin users to create new tour packages
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

console.log('[TourBuilderCard] Component loaded');

interface TourBuilderCardProps {
  onPress?: () => void;
  subtitle?: string;
}

export function TourBuilderCard({
  onPress,
  subtitle,
}: TourBuilderCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const primaryLight = isDark ? theme.colors['primary-dark'] + '20' : theme.colors.primary + '15';

  return (
    <TouchableOpacity
      onPress={() => {
        console.log('[TourBuilderCard] Pressed');
        onPress?.();
      }}
      className="mb-4 overflow-hidden rounded-2xl active:opacity-75"
      style={{
        backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface,
        shadowColor: primaryColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="overflow-hidden rounded-2xl">
        {/* Gradient Background Pattern */}
        <View
          className="absolute top-0 right-0 w-32 h-32 rounded-full"
          style={{
            backgroundColor: primaryLight,
            transform: [{ translateX: 50 }, { translateY: -50 }],
          }}
        />
        <View
          className="absolute bottom-0 left-0 w-40 h-40 rounded-full"
          style={{
            backgroundColor: primaryLight,
            transform: [{ translateX: -50 }, { translateY: 50 }],
          }}
        />

        {/* Content */}
        <View className="relative px-6 py-8 flex-row items-center justify-between">
          {/* Left Side - Text Content */}
          <View className="flex-1 pr-4">
            <View className="flex-row items-center gap-3 mb-2">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Ionicons name="hammer" size={24} color="#fff" />
              </View>
              <Text className="text-xl font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TOUR_BUILDER.TITLE)}</Text>
            </View>

            <Text className="text-sm text-muted dark:text-muted-dark leading-5 mb-4">
              {subtitle || t(TRANSLATION_KEYS.TOUR_BUILDER.CARD_SUBTITLE)}
            </Text>

            {/* Quick Info Tags */}
            <View className="flex-row flex-wrap gap-2">
              <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TOUR_BUILDER.EASY_SETUP)}
                </Text>
              </View>
              <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TOUR_BUILDER.FAST_DEPLOY)}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Side - Icon */}
          <View className="items-center justify-center">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: primaryLight,
              }}
            >
              <Ionicons name="add-circle" size={32} color={primaryColor} />
            </View>
          </View>
        </View>

        {/* Action Button at Bottom */}
        <View className="px-6 pb-6 pt-2 flex-row items-center justify-between">
          <Text className="text-xs text-muted dark:text-muted-dark font-medium">
            Start creating your first tour package
          </Text>
          <View className="flex-row items-center gap-1" style={{ marginLeft: 8 }}>
            <Text className="text-xs font-semibold text-primary dark:text-primary-dark">
              Begin
            </Text>
            <Ionicons name="arrow-forward" size={14} color={primaryColor} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default TourBuilderCard;
