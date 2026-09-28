import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { tabBarScreenStyle } from '../../hooks/useHideTabBar';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom ?? 0;

  const { isDark } = useTheme();
  const { t } = useTranslation();

  const tabBarActiveTintColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const tabBarInactiveTintColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarActiveTintColor,
        tabBarInactiveTintColor: tabBarInactiveTintColor,
        tabBarStyle: tabBarScreenStyle(isDark, bottomInset),
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t(TRANSLATION_KEYS.TABS.HOMEPAGE),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const isFocused = state.routes[state.index]?.name === 'explore';
            // Only intervene when switching TO explore from another tab.
            // navigate() to 'index' will pop any screens above it in the stack.
            if (!isFocused) {
              e.preventDefault();
              navigation.navigate('explore', { screen: 'index' });
            }
          },
        })}
        options={{
          title: t(TRANSLATION_KEYS.TABS.EXPLORE),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t(TRANSLATION_KEYS.TABS.DASHBOARD),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: t(TRANSLATION_KEYS.TABS.TRACKING),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'checkmark-done' : 'checkmark-done-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trip-planner"
        options={{
          title: t(TRANSLATION_KEYS.TABS.TRIP_PLANNER),
          href: null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
