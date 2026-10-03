import React, { useEffect, useState } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import {
  isAttractionFlow,
  isDashboardBookingChromeHidden,
  isHotelBookingChild,
  isTripPlannerDetailTabBarHidden,
  tabBarScreenStyle,
} from '../../hooks/useHideTabBar';
import { AppTabBar } from '../../components/navigation/AppTabBar';
import { RootState } from '../../store/store';
import { useHotelAdminSession } from '../../hooks/useHotelAdminSession';
import { isTravelerRole } from '../../utilities/travelerShell';
import { getUnreadNotificationCount } from '../../services/api/notifications';

type IonName = keyof typeof Ionicons.glyphMap;

function tabIcon(focused: boolean, color: string, active: IonName, inactive: IonName) {
  return <Ionicons name={focused ? active : inactive} size={20} color={color} />;
}

function isBookingsIndex(pathname: string): boolean {
  return pathname === '/bookings' || pathname.endsWith('/bookings');
}

function hideTabBar(pathname: string, traveler: boolean, hotelAdmin: boolean): boolean {
  if (pathname.includes('/bookings')) {
    if (hotelAdmin) {
      return !isBookingsIndex(pathname);
    }
    return true;
  }
  if (traveler && (pathname.includes('/explore') || pathname.includes('/trip-planner') || pathname.includes('/community'))) {
    return true;
  }
  return isHotelBookingChild(pathname)
    || isAttractionFlow(pathname)
    || isTripPlannerDetailTabBarHidden(pathname)
    || isDashboardBookingChromeHidden(pathname);
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom ?? 0;
  const pathname = usePathname();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const traveler = isTravelerRole(role);
  const { isHotelAdmin } = useHotelAdminSession();
  const [unread, setUnread] = useState<number | null>(null);
  const inboxTab = traveler || isHotelAdmin;

  const tabBarActiveTintColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const tabBarInactiveTintColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const badge = inboxTab && unread !== null && unread > 0 ? (unread > 99 ? '99+' : unread) : undefined;

  useEffect(() => {
    if (!inboxTab) {
      setUnread(null);
      return;
    }
    let active = true;
    getUnreadNotificationCount()
      .then((count) => {
        if (active) {
          setUnread(count);
        }
      })
      .catch(() => {
        if (active) {
          setUnread(null);
        }
      });
    return () => {
      active = false;
    };
  }, [inboxTab, pathname]);

  const pageBackground = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const barHidden = hideTabBar(pathname, traveler, isHotelAdmin);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: pageBackground,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarActiveTintColor,
        tabBarInactiveTintColor: tabBarInactiveTintColor,
        tabBarStyle: barHidden
          ? { display: 'none', height: 0, overflow: 'hidden', backgroundColor: 'transparent' }
          : { ...tabBarScreenStyle(isDark, bottomInset), backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
        sceneStyle: {
          backgroundColor: pageBackground,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 0,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const isFocused = state.routes[state.index]?.name === 'index';
            if ((traveler || isHotelAdmin) && isFocused) {
              e.preventDefault();
              navigation.navigate('index');
            }
          },
        })}
        options={{
          title: t(traveler || isHotelAdmin ? TRANSLATION_KEYS.TABS.HOME : TRANSLATION_KEYS.TABS.HOMEPAGE),
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="bookings"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const isFocused = state.routes[state.index]?.name === 'bookings';
            if (!isFocused) {
              return;
            }
            e.preventDefault();
            navigation.navigate('bookings', { screen: 'index' });
          },
        })}
        options={{
          title: t(TRANSLATION_KEYS.TABS.BOOKINGS),
          href: traveler || isHotelAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'ticket', 'ticket-outline'),
        }}
      />
      <Tabs.Screen
        name="notifications"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const isFocused = state.routes[state.index]?.name === 'notifications';
            if (!isFocused) {
              return;
            }
            e.preventDefault();
            navigation.navigate('notifications', { screen: 'index' });
          },
        })}
        options={{
          title: t(TRANSLATION_KEYS.TABS.NOTIFICATIONS),
          href: traveler || isHotelAdmin ? undefined : null,
          tabBarBadge: badge,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'notifications', 'notifications-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const isFocused = state.routes[state.index]?.name === 'profile';
            if (!isFocused) {
              return;
            }
            e.preventDefault();
            navigation.navigate('profile', { screen: 'index' });
          },
        })}
        options={{
          title: t(TRANSLATION_KEYS.TABS.PROFILE),
          href: traveler ? undefined : null,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'person', 'person-outline'),
        }}
      />
      <Tabs.Screen
        name="explore"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const isFocused = state.routes[state.index]?.name === 'explore';
            if (!isFocused) {
              e.preventDefault();
              navigation.navigate('explore', { screen: 'index' });
            }
          },
        })}
        options={{
          title: t(TRANSLATION_KEYS.TABS.EXPLORE),
          href: traveler || isHotelAdmin ? null : undefined,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'compass', 'compass-outline'),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isHotelAdmin) {
              return;
            }
            const state = navigation.getState();
            const isFocused = state.routes[state.index]?.name === 'dashboard';
            if (!isFocused) {
              return;
            }
            e.preventDefault();
            navigation.navigate('dashboard', { screen: 'index' });
          },
        })}
        options={{
          title: t(TRANSLATION_KEYS.TABS.DASHBOARD),
          href: traveler ? null : undefined,
          tabBarIcon: ({ color, focused }) => tabIcon(
            focused,
            color,
            isHotelAdmin ? 'grid' : 'person',
            isHotelAdmin ? 'grid-outline' : 'person-outline',
          ),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: t(TRANSLATION_KEYS.TABS.TRACKING),
          href: traveler || isHotelAdmin ? null : undefined,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'checkmark-done', 'checkmark-done-outline'),
        }}
      />
      <Tabs.Screen
        name="trip-planner"
        options={{
          title: t(TRANSLATION_KEYS.TABS.TRIP_PLANNER),
          href: null,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'map', 'map-outline'),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </NavigationThemeProvider>
  );
}
