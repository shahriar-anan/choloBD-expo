/**
 * Home booking launcher. Tiles overlap the hero photo. Transport is shown and does not navigate.
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface QuickAction {
  id: string;
  translationKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string | null;
}

interface QuickActionGridProps {
  onNavigate?: (actionId: string) => void;
}

export default function QuickActionGrid({ onNavigate }: QuickActionGridProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'book-hotel',
        translationKey: TRANSLATION_KEYS.HOME.QUICK_ACTIONS.BOOK_HOTEL,
        icon: 'bed',
        route: '/(tabs)/explore/hotel-search?fromHome=true',
      },
      {
        id: 'plan-trip',
        translationKey: TRANSLATION_KEYS.HOME.QUICK_ACTIONS.PLAN_TRIP,
        icon: 'map-marker-path',
        route: '/(tabs)/trip-planner',
      },
      {
        id: 'browse-tours',
        translationKey: TRANSLATION_KEYS.HOME.QUICK_ACTIONS.ATTRACTIONS,
        icon: 'binoculars',
        route: '/(tabs)/explore/tour-spots-list?fromHome=true',
      },
      {
        id: 'transport',
        translationKey: TRANSLATION_KEYS.HOME.QUICK_ACTIONS.TRANSPORT,
        icon: 'bus-side',
        route: null,
      },
    ],
    []
  );

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  const handleActionPress = (action: QuickAction) => {
    if (!action.route) {
      return;
    }
    if (onNavigate) {
      onNavigate(action.id);
    }
    router.push(action.route);
  };

  return (
    <View
      style={{
        marginTop: -28,
        paddingHorizontal: 16,
        paddingBottom: 4,
        zIndex: 2,
      }}
    >
      <View className="flex-row" style={{ gap: 10 }}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            activeOpacity={action.route ? 0.7 : 1}
            disabled={!action.route}
            onPress={() => handleActionPress(action)}
            className="flex-1 items-center"
          >
            <View
              className="items-center justify-center"
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: surfaceColor,
                ...theme.elevation.md,
              }}
            >
              <MaterialCommunityIcons name={action.icon} size={30} color={primaryColor} />
            </View>
            <Text
              className="font-semibold text-center"
              style={{
                color: textColor,
                fontSize: 12,
                marginTop: 6,
                maxWidth: 76,
              }}
              numberOfLines={2}
            >
              {t(action.translationKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
