import React from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { ProfileAvatar } from '../ui/profileAvatar';
import { RecentBookingCard } from '../ui/recentBookingCard';
import { TravelerWalletStrip } from '../../hooks/useDashboardLogic';
import { RecentBookingView } from '../../utilities/recentBookingItems';

interface UserDashboardProps {
  userName?: string;
  email?: string;
  imageUrl?: string;
  userStatus?: string;
  recentBookingItems?: RecentBookingView[];
  wallet: TravelerWalletStrip | null;
  unreadCount: number | null;
  onLogout: () => void;
  onPressRecentBooking: (item: RecentBookingView) => void;
}

function formatUnreadBadge(count: number): string {
  return count > 99 ? '99+' : String(count);
}

function statusColor(status: string | undefined, isDark: boolean): string {
  switch (status?.toUpperCase()) {
    case 'SUSPENDED':
    case 'BANNED':
      return isDark ? theme.colors['error-dark'] : theme.colors.error;
    case 'PENDING':
    case 'UNVERIFIED':
      return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    case 'INACTIVE':
      return isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    default:
      return isDark ? theme.colors['success-dark'] : theme.colors.success;
  }
}

interface DashboardLinkRowProps {
  title: string;
  iconName: 'bed' | 'compass' | 'bus' | 'binoculars';
  onPress: () => void;
  showDivider: boolean;
}

function DashboardLinkRow({ title, iconName, onPress, showDivider }: DashboardLinkRowProps) {
  const { isDark } = useTheme();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const pale = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];

  return (
    <View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        className="flex-row items-center py-4"
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: pale,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={28} color={primaryColor} />
        </View>
        <Text className="flex-1 ml-4 text-base font-semibold text-text dark:text-text-dark">
          {title}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={mutedColor} />
      </Pressable>
      {showDivider ? <View className="h-px bg-border dark:bg-border-dark" /> : null}
    </View>
  );
}

export function UserDashboard({
  userName,
  email,
  imageUrl,
  userStatus,
  recentBookingItems = [],
  wallet,
  unreadCount,
  onLogout,
  onPressRecentBooking,
}: UserDashboardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const onPrimaryColor = isDark ? theme.colors['onPrimary-dark'] : theme.colors['onPrimary'];
  const badge = unreadCount !== null && unreadCount > 0 ? formatUnreadBadge(unreadCount) : null;
  const previewBooking = recentBookingItems[0];
  const previewCanOpen =
    previewBooking?.kind === 'hotel' || previewBooking?.kind === 'transport';

  const statusKey = (userStatus?.toUpperCase() || 'ACTIVE') as keyof typeof TRANSLATION_KEYS.DASHBOARD.STATUSES;
  const statusTranslation = TRANSLATION_KEYS.DASHBOARD.STATUSES[statusKey];
  const statusLabel = statusTranslation ? t(statusTranslation) : (userStatus || t(TRANSLATION_KEYS.DASHBOARD.STATUSES.ACTIVE));

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-2">
          <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.USER_TITLE)}
          </Text>
        </View>

        <View className="flex-row items-center px-6 pt-3 pb-4">
          <ProfileAvatar imageUrl={imageUrl} userName={userName} email={email} size={48} />
          <View className="flex-1 ml-3">
            {userName ? (
              <Text className="text-lg font-bold font-heading text-text dark:text-text-dark" numberOfLines={1}>
                {userName}
              </Text>
            ) : null}
            {email ? (
              <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                {email}
              </Text>
            ) : null}
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor(userStatus, isDark) }} />
              <Text className="ml-1 text-xs text-text dark:text-text-dark">{statusLabel}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/dashboard/notifications')}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.TITLE)}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="notifications-outline" size={22} color={textColor} />
            {badge ? (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 2,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  backgroundColor: primaryColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: onPrimaryColor, fontSize: 10, fontWeight: '700' }}>{badge}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.SIDESCROLLER.GENERAL_ITEMS.LOGOUT)}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="log-out-outline" size={22} color={textColor} />
          </Pressable>
        </View>

        {wallet ? (
          <View className="mx-6 mt-1 mb-2 px-4 py-4 rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark flex-row items-center">
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="cash-outline" size={20} color={primaryColor} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-xs text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.DASHBOARD.WALLET_COINS)}
              </Text>
              <Text className="mt-0.5 text-xl font-bold text-text dark:text-text-dark">
                {wallet.balance.toLocaleString('en-US')}
              </Text>
            </View>
          </View>
        ) : null}

        <View className="px-6 mt-2">
          <DashboardLinkRow
            title={t(TRANSLATION_KEYS.DASHBOARD.USER_CARDS.MY_BOOKINGS)}
            iconName="bed"
            onPress={() => router.push('/(tabs)/dashboard/user-bookings')}
            showDivider
          />
          <DashboardLinkRow
            title={t(TRANSLATION_KEYS.DASHBOARD.USER_CARDS.MY_TRANSPORT_BOOKINGS)}
            iconName="bus"
            onPress={() => router.push('/(tabs)/dashboard/transport-bookings')}
            showDivider
          />
          <DashboardLinkRow
            title={t(TRANSLATION_KEYS.DASHBOARD.USER_CARDS.ATTRACTION_BOOKINGS)}
            iconName="binoculars"
            onPress={() => router.push('/(tabs)/dashboard/attraction-bookings')}
            showDivider
          />
          <DashboardLinkRow
            title={t(TRANSLATION_KEYS.DASHBOARD.USER_CARDS.TRIP_PLANNER)}
            iconName="compass"
            onPress={() => router.push('/(tabs)/trip-planner')}
            showDivider={false}
          />
        </View>

        <View className="px-6 pt-6 pb-8">
          <Pressable
            onPress={() => router.push('/(tabs)/dashboard/recent-bookings')}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.DASHBOARD.RECENT_BOOKINGS)}
            className="flex-row items-center mb-3"
          >
            <Text className="text-lg font-bold font-heading text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.RECENT_BOOKINGS)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={mutedColor} style={{ marginLeft: 6 }} />
          </Pressable>
          {previewBooking ? (
            <RecentBookingCard
              item={previewBooking}
              compact
              onPress={previewCanOpen ? onPressRecentBooking : undefined}
            />
          ) : (
            <Text className="text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.NO_BOOKINGS)}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default UserDashboard;
