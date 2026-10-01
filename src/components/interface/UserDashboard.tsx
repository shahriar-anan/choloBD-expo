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
import { DashboardAttentionItem } from '../../utilities/dashboardHub';

interface UserDashboardProps {
  userName?: string;
  email?: string;
  imageUrl?: string;
  recentBookingItems?: RecentBookingView[];
  upNext?: RecentBookingView | null;
  attentionItems?: DashboardAttentionItem[];
  hotelActiveCount?: number;
  transportActiveCount?: number;
  wallet: TravelerWalletStrip | null;
  unreadCount: number | null;
  onLogout: () => void;
  onPressRecentBooking: (item: RecentBookingView) => void;
}

function formatUnreadBadge(count: number): string {
  return count > 99 ? '99+' : String(count);
}

function greetingKey(hour: number): string {
  if (hour < 12) return TRANSLATION_KEYS.DASHBOARD.GOOD_MORNING;
  if (hour < 17) return TRANSLATION_KEYS.DASHBOARD.GOOD_AFTERNOON;
  return TRANSLATION_KEYS.DASHBOARD.GOOD_EVENING;
}

function canOpenBooking(item: RecentBookingView | null | undefined): boolean {
  return item?.kind === 'hotel' || item?.kind === 'transport';
}

interface ManageTileProps {
  title: string;
  subtitle?: string;
  iconName: 'bed' | 'bus' | 'compass';
  onPress: () => void;
}

function ManageTile({ title, subtitle, iconName, onPress }: ManageTileProps) {
  const { isDark } = useTheme();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const pale = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      className="flex-1 px-2 py-3 rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark"
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: pale,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName} size={18} color={primaryColor} />
      </View>
      <Text className="mt-2 text-xs font-semibold text-text dark:text-text-dark" numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-0.5 text-[11px] text-muted dark:text-muted-dark" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function UserDashboard({
  userName,
  email,
  imageUrl,
  recentBookingItems = [],
  upNext = null,
  attentionItems = [],
  hotelActiveCount = 0,
  transportActiveCount = 0,
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
  const previewCanOpen = canOpenBooking(previewBooking);
  const upNextCanOpen = canOpenBooking(upNext);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <ProfileAvatar imageUrl={imageUrl} userName={userName} email={email} size={48} />
          <View className="flex-1 ml-3">
            <Text className="text-xs text-muted dark:text-muted-dark">
              {t(greetingKey(new Date().getHours()))}
            </Text>
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

        <View className="px-6">
          <Text className="mb-2 text-lg font-bold font-heading text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.UP_NEXT)}
          </Text>
          {upNext ? (
            <RecentBookingCard
              item={upNext}
              onPress={upNextCanOpen ? onPressRecentBooking : undefined}
            />
          ) : (
            <View className="mb-2">
              <Text className="text-sm text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.DASHBOARD.NO_UPCOMING)}
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/trip-planner')}
                accessibilityRole="button"
                accessibilityLabel={t(TRANSLATION_KEYS.DASHBOARD.PLAN_A_TRIP)}
                className="mt-2"
              >
                <Text className="text-sm font-semibold" style={{ color: primaryColor }}>
                  {t(TRANSLATION_KEYS.DASHBOARD.PLAN_A_TRIP)}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {attentionItems.length > 0 ? (
          <View className="px-6 mt-4">
            <Text className="mb-2 text-lg font-bold font-heading text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.NEEDS_ATTENTION)}
            </Text>
            {attentionItems.map((item) => (
              <Pressable
                key={`${item.kind}-${item.id}`}
                onPress={() => onPressRecentBooking(item)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                className="flex-row items-center px-3 py-3 mb-2 rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark"
              >
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                    {item.reason === 'unpaid'
                      ? t(TRANSLATION_KEYS.DASHBOARD.UNPAID)
                      : t(TRANSLATION_KEYS.DASHBOARD.STARTING_SOON)}
                    {item.detail ? ` · ${item.detail}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={mutedColor} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {wallet ? (
          <View className="mx-6 mt-4 px-4 py-4 rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark flex-row items-center">
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

        <View className="flex-row px-6 mt-4 gap-2">
          <ManageTile
            title={t(TRANSLATION_KEYS.DASHBOARD.USER_CARDS.MY_BOOKINGS)}
            subtitle={t(TRANSLATION_KEYS.DASHBOARD.ACTIVE_COUNT, { count: hotelActiveCount })}
            iconName="bed"
            onPress={() => router.push('/(tabs)/dashboard/user-bookings')}
          />
          <ManageTile
            title={t(TRANSLATION_KEYS.DASHBOARD.USER_CARDS.MY_TRANSPORT_BOOKINGS)}
            subtitle={t(TRANSLATION_KEYS.DASHBOARD.ACTIVE_COUNT, { count: transportActiveCount })}
            iconName="bus"
            onPress={() => router.push('/(tabs)/dashboard/transport-bookings')}
          />
          <ManageTile
            title={t(TRANSLATION_KEYS.DASHBOARD.USER_CARDS.TRIP_PLANNER)}
            iconName="compass"
            onPress={() => router.push('/(tabs)/trip-planner')}
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
