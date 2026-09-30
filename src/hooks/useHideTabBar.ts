import { useCallback } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './useTheme';
import theme from '../constants/theme';

export function tabBarScreenStyle(isDark: boolean, bottomInset: number): ViewStyle {
    return {
        borderTopColor: isDark ? theme.colors['border-dark'] : theme.colors.border,
        backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface,
        height: 60 + bottomInset,
        paddingBottom: Platform.OS === 'ios' ? bottomInset : bottomInset + 8,
        display: 'flex',
    };
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
    'package-bookings',
    'transport-bookings',
    'service-admin',
]);

export function isDashboardBookingChromeHidden(pathname: string): boolean {
    if (pathname.includes('user-bookings')) {
        return true;
    }
    if (/\/dashboard\/transport-bookings\/[^/]+/.test(pathname)) {
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

export function useHotelFlowTabBar(pathname: string): void {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const bottomInset = insets.bottom ?? 0;
    const hidden = isHotelBookingChild(pathname);

    useFocusEffect(
        useCallback(() => {
            applyTabBarStyle(navigation as TabBarNavigation, hidden ? hiddenTabBarStyle : tabBarScreenStyle(isDark, bottomInset));
        }, [navigation, isDark, bottomInset, hidden]),
    );
}
