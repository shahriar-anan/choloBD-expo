import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, View } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import {
  CommonActions,
  DarkTheme,
  DefaultTheme,
  NavigationProp,
  ParamListBase,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
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
import { isTravelerRole, roleHome } from '../../utilities/travelerShell';
import { getUnreadNotificationCount } from '../../services/api/notifications';

type IonName = keyof typeof Ionicons.glyphMap;

function tabIcon(focused: boolean, color: string, active: IonName, inactive: IonName) {
  return <Ionicons name={focused ? active : inactive} size={20} color={color} />;
}

function isBookingsIndex(pathname: string): boolean {
  return pathname === '/bookings' || pathname.endsWith('/bookings');
}

function hideTabBar(pathname: string, traveler: boolean): boolean {
  if (pathname.includes('/bookings')) {
    return !isBookingsIndex(pathname);
  }
  if (traveler && (pathname.includes('/explore') || pathname.includes('/trip-planner') || pathname.includes('/community'))) {
    return true;
  }
  return isHotelBookingChild(pathname)
    || isAttractionFlow(pathname)
    || isTripPlannerDetailTabBarHidden(pathname)
    || isDashboardBookingChromeHidden(pathname);
}

/** Hidden traveler tabs are only entered through links, so a stale stack would resurface under the next push. */
function resetTabStack(navigation: NavigationProp<ParamListBase>, routeKey: string): void {
  const state = navigation.getState();
  if (!state || state.routes[state.index]?.key === routeKey) {
    return;
  }
  if (!state.routes.some((item) => item.key === routeKey && item.state)) {
    return;
  }
  navigation.dispatch({
    ...CommonActions.reset({
      ...state,
      routes: state.routes.map((item) => (item.key === routeKey ? { ...item, state: undefined } : item)),
    }),
    target: state.key,
  });
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom ?? 0;
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const traveler = isTravelerRole(role);
  const { isHotelAdmin, isHotelEmployee, isTransportAdmin, pending } = useHotelAdminSession();
  const hotelDesk = isHotelAdmin || isHotelEmployee;
  const [unread, setUnread] = useState<number | null>(null);
  const inboxTab = traveler || hotelDesk || isTransportAdmin;

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
  const barHidden = hideTabBar(pathname, traveler);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) {
        return false;
      }
      const home = roleHome(role);
      if (pathname === '/' || pathname === (home === '/(tabs)' ? '/' : '/dashboard')) {
        return false;
      }
      router.replace(home);
      return true;
    });
    return () => subscription.remove();
  }, [pathname, role, router]);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: pageBackground,
    },
  };

  if (pending) {
    return (
      <NavigationThemeProvider value={navigationTheme}>
        <View className="items-center justify-center flex-1" style={{ backgroundColor: pageBackground }}>
          <ActivityIndicator />
        </View>
      </NavigationThemeProvider>
    );
  }

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
            if ((traveler || hotelDesk) && isFocused) {
              e.preventDefault();
              navigation.navigate('index');
            }
          },
        })}
        options={{
          title: t(traveler || hotelDesk ? TRANSLATION_KEYS.TABS.HOME : TRANSLATION_KEYS.TABS.HOMEPAGE),
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
          href: traveler || hotelDesk || isTransportAdmin ? undefined : null,
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
        listeners={({ navigation, route }) => ({
          blur: () => {
            if (traveler) {
              resetTabStack(navigation, route.key);
            }
          },
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
          href: traveler || hotelDesk || isTransportAdmin ? null : undefined,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'compass', 'compass-outline'),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        listeners={({ navigation, route }) => ({
          blur: () => {
            if (traveler) {
              resetTabStack(navigation, route.key);
            }
          },
          tabPress: (e) => {
            if (!hotelDesk) {
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
            hotelDesk ? 'grid' : 'person',
            hotelDesk ? 'grid-outline' : 'person-outline',
          ),
        }}
      />
      <Tabs.Screen
        name="qr-scanner"
        options={{
          title: t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.QR_SCANNER),
          href: isHotelEmployee ? undefined : null,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'qr-code', 'qr-code-outline'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t(TRANSLATION_KEYS.DASHBOARD.SETTINGS),
          href: isHotelEmployee ? undefined : null,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'settings', 'settings-outline'),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: t(TRANSLATION_KEYS.TABS.TRACKING),
          href: traveler || hotelDesk ? null : undefined,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'checkmark-done', 'checkmark-done-outline'),
        }}
      />
      <Tabs.Screen
        name="trip-planner"
        listeners={({ navigation, route }) => ({
          blur: () => resetTabStack(navigation, route.key),
        })}
        options={{
          title: t(TRANSLATION_KEYS.TABS.TRIP_PLANNER),
          href: null,
          tabBarIcon: ({ color, focused }) => tabIcon(focused, color, 'map', 'map-outline'),
        }}
      />
      <Tabs.Screen
        name="community"
        listeners={({ navigation, route }) => ({
          blur: () => resetTabStack(navigation, route.key),
        })}
        options={{
          href: null,
        }}
      />
    </Tabs>
    </NavigationThemeProvider>
  );
}
