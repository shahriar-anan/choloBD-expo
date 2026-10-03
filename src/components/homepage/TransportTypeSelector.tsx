import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface TransportOption {
  id: string;
  label: keyof typeof TRANSLATION_KEYS.HOME.TRANSPORT;
  icon: keyof typeof Feather.glyphMap;
  route: string;
}

const TRANSPORT_OPTIONS: TransportOption[] = [
  {
    id: 'bus-rental',
    label: 'BUS_RENTAL',
    icon: 'truck',
    route: '/(tabs)/explore/transport-search',
  },
  {
    id: 'trip-plan',
    label: 'TRIP_PLAN',
    icon: 'calendar',
    route: '/(tabs)/trip-planner?tab=mine',
  },
  {
    id: 'track',
    label: 'TRACK',
    icon: 'navigation',
    route: '/(tabs)/tracking',
  },
  {
    id: 'dashboard',
    label: 'DASHBOARD',
    icon: 'grid',
    route: '/(tabs)/dashboard',
  },
];

export default function TransportTypeSelector() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string>('hotels');

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  const handlePress = (option: TransportOption) => {
    setActiveId(option.id);
    router.push(option.route);
  };

  return (
    <View className="px-2 py-4 bg-white dark:bg-neutral-950">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
      >
        {TRANSPORT_OPTIONS.map((option) => {
          const isActive = activeId === option.id;
          const bgColor = isActive ? primaryColor : 'transparent';
          const iconColor = isActive ? '#fff' : primaryColor;
          const labelColor = isActive ? '#fff' : textColor;

          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => handlePress(option)}
              activeOpacity={0.7}
              className="items-center gap-2 px-3 py-3 border rounded-lg"
              style={{
                backgroundColor: bgColor,
                borderColor: isActive ? primaryColor : mutedColor,
                borderWidth: 1.5,
                minWidth: 85,
              }}
            >
              <Feather name={option.icon} size={20} color={iconColor} />
              <Text
                className="text-xs font-semibold text-center"
                style={{ color: labelColor }}
                numberOfLines={1}
              >
                {t(TRANSLATION_KEYS.HOME.TRANSPORT[option.label])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
