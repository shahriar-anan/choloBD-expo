import { useCallback } from 'react';
import { type ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './useTheme';
import theme from '../constants/theme';

export const TAB_BAR_HEIGHT = 52;
const TAB_BAR_FLOAT_GAP = 14;

export function tabBarScreenStyle(isDark: boolean, bottomInset: number): ViewStyle {
    return {
        position: 'absolute',
        start: 16,
        end: 16,
        left: 16,
        right: 16,
        bottom: bottomInset + TAB_BAR_FLOAT_GAP,
        height: TAB_BAR_HEIGHT,
        paddingTop: 4,
        paddingBottom: 4,
        paddingHorizontal: 0,
        borderRadius: TAB_BAR_HEIGHT / 2,
        borderTopWidth: 0,
        backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface,
        display: 'flex',
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    };
}

export function tabBarClearance(bottomInset: number): number {
    return TAB_BAR_HEIGHT + bottomInset + TAB_BAR_FLOAT_GAP + 12;
}

const hiddenTabBarStyle: ViewStyle = { display: 'none', height: 0, overflow: 'hidden' };

interface TabBarNavigation {
    setOptions: (options: { tabBarStyle: ViewStyle }) => void;
    getParent: () => TabBarNavigation | undefined;
}

function applyTabBarStyle(navigation: TabBarNavigation, style: ViewStyle): void {
    let current: TabBarNavigation | undefined = navigation;
    for (let depth = 0; depth < 4 && current; depth += 1) {
        current.setOptions({ tabBarStyle: style });
        current = current.getParent();
    }
}

export function isAttractionFlow(pathname: string): boolean {
    return pathname.includes('/attractions')
        || pathname.includes('/tour-spots-detail')
        || pathname.includes('/activity-preview')
        || pathname.includes('/guide-detail');
}

export function isHotelBookingChild(pathname: string): boolean {
    if (pathname.includes('hotel-search') || pathname.includes('transport-search')) {
        return false;
    }
    return pathname.endsWith('/booking')
        || pathname.includes('hotel-destination')
        || pathname.includes('hotel-dates')
        || pathname.includes('hotel-room-count')
        || pathname.includes('hotel-results')
        || pathname.includes('hotel-stay')
        || pathname.includes('hotel-room-types')
        || pathname.includes('transport-from')
        || pathname.includes('transport-to')
        || pathname.includes('transport-date')
        || pathname.includes('transport-type')
        || pathname.includes('transport-results')
        || pathname.includes('transport-trip')
        || pathname.includes('transport-rental')
        || pathname.includes('transport-stops')
        || pathname.includes('transport-passengers')
        || pathname.includes('transport-payment')
        || pathname.endsWith('/payment');
}

const dashboardReservedSegments = new Set([
    'index',
    'notifications',
    'payment',
    'transport-bookings',
    'service-admin',
    'recent-bookings',
    'user-bookings',
]);

const tripPlannerListSegments = new Set(['create', 'edit', 'list', 'index']);

/** Personal trip detail `trip-planner/[id]` — hide bottom tabs like booking detail screens. */
export function isTripPlannerDetailTabBarHidden(pathname: string): boolean {
    const match = pathname.match(/\/trip-planner\/([^/]+)\/?$/);
    if (!match) {
        return false;
    }
    return !tripPlannerListSegments.has(match[1]);
}

export function useTripPlannerTabBar(pathname: string, forceHide = false): void {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const bottomInset = insets.bottom ?? 0;
    const hidden = forceHide || isTripPlannerDetailTabBarHidden(pathname);

    useFocusEffect(
        useCallback(() => {
            const nav = navigation as TabBarNavigation;
            applyTabBarStyle(nav, hidden ? hiddenTabBarStyle : tabBarScreenStyle(isDark, bottomInset));
            return () => {
                applyTabBarStyle(nav, tabBarScreenStyle(isDark, bottomInset));
            };
        }, [navigation, isDark, bottomInset, hidden]),
    );
}

export function isDashboardBookingChromeHidden(pathname: string): boolean {
    if (pathname.includes('user-bookings') || pathname.includes('recent-bookings')) {
        return true;
    }
    if (/\/dashboard\/transport-bookings\/[^/]+/.test(pathname)) {
        return true;
    }
    if (/\/dashboard\/attraction-bookings\/[^/]+/.test(pathname)) {
        return true;
    }
    const match = pathname.match(/\/dashboard\/([^/]+)\/?$/);
    if (!match) {
        return false;
    }
    return !dashboardReservedSegments.has(match[1]);
}

export function useDashboardBookingTabBar(pathname: string): void {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const bottomInset = insets.bottom ?? 0;
    const hidden = isDashboardBookingChromeHidden(pathname);

    useFocusEffect(
        useCallback(() => {
            const nav = navigation as TabBarNavigation;
            applyTabBarStyle(nav, hidden ? hiddenTabBarStyle : tabBarScreenStyle(isDark, bottomInset));
            return () => {
                applyTabBarStyle(nav, tabBarScreenStyle(isDark, bottomInset));
            };
        }, [navigation, isDark, bottomInset, hidden]),
    );
}

export function usePathTabBar(hidden: boolean): void {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const bottomInset = insets.bottom ?? 0;

    useFocusEffect(
        useCallback(() => {
            const nav = navigation as TabBarNavigation;
            applyTabBarStyle(nav, hidden ? hiddenTabBarStyle : tabBarScreenStyle(isDark, bottomInset));
            return () => {
                applyTabBarStyle(nav, tabBarScreenStyle(isDark, bottomInset));
            };
        }, [navigation, isDark, bottomInset, hidden]),
    );
}

export function useHotelFlowTabBar(pathname: string, forceHide = false): void {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const bottomInset = insets.bottom ?? 0;
    const hidden = forceHide || isHotelBookingChild(pathname) || isAttractionFlow(pathname);

    useFocusEffect(
        useCallback(() => {
            applyTabBarStyle(navigation as TabBarNavigation, hidden ? hiddenTabBarStyle : tabBarScreenStyle(isDark, bottomInset));
            return () => {
                applyTabBarStyle(navigation as TabBarNavigation, tabBarScreenStyle(isDark, bottomInset));
            };
        }, [navigation, isDark, bottomInset, hidden]),
    );
}
