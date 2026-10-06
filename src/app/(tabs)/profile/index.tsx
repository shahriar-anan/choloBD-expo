import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { ProfileAvatar } from '../../../components/ui/profileAvatar';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import LanguageToggle from '../../../components/ui/LanguageToggle';
import { profileDisplayName } from '../../../utilities/profileImage';

type ProfileRoute =
  | '/(tabs)/profile/account'
  | '/(tabs)/profile/about'
  | '/(tabs)/profile/tracking'
  | '/(tabs)/profile/offers'
  | '/(tabs)/profile/community'
  | '/(tabs)/profile/help';

const ACCOUNT_ROWS: { titleKey: string; route: ProfileRoute; icon: keyof typeof Ionicons.glyphMap; signedInOnly?: boolean }[] = [
  { titleKey: TRANSLATION_KEYS.PROFILE.EDIT_ACCOUNT, route: '/(tabs)/profile/account', icon: 'person-outline', signedInOnly: true },
  { titleKey: TRANSLATION_KEYS.PROFILE.ABOUT, route: '/(tabs)/profile/about', icon: 'information-circle-outline' },
  { titleKey: TRANSLATION_KEYS.PROFILE.TRACKING, route: '/(tabs)/profile/tracking', icon: 'navigate-outline' },
  { titleKey: TRANSLATION_KEYS.PROFILE.OFFERS, route: '/(tabs)/profile/offers', icon: 'pricetag-outline' },
  { titleKey: TRANSLATION_KEYS.PROFILE.COMMUNITY, route: '/(tabs)/profile/community', icon: 'people-outline' },
  { titleKey: TRANSLATION_KEYS.PROFILE.HELP, route: '/(tabs)/profile/help', icon: 'help-circle-outline' },
];

function appearanceLabel(mode: string): string {
  if (mode === 'light') return TRANSLATION_KEYS.PROFILE.APPEARANCE_LIGHT;
  if (mode === 'dark') return TRANSLATION_KEYS.PROFILE.APPEARANCE_DARK;
  return TRANSLATION_KEYS.PROFILE.APPEARANCE_SYSTEM;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-5">
      <Text className="px-5 mb-2 text-base font-bold text-text dark:text-text-dark">{title}</Text>
      <View
        className="mx-4 overflow-hidden bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
      >
        {children}
      </View>
    </View>
  );
}

export default function ProfileIndex() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, mode, setMode } = useTheme();
  const { auth, wallet, profileImageUrl, unreadCount, handleLogout, refreshTravelerHome } = useDashboardLogic();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const onPrimary = isDark ? theme.colors['onPrimary-dark'] : theme.colors.onPrimary;
  const header = theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const signedIn = Boolean(auth.user);
  const badge = unreadCount !== null && unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null;
  const displayName = profileDisplayName(auth.user);

  useFocusEffect(
    useCallback(() => {
      void refreshTravelerHome();
    }, [refreshTravelerHome]),
  );

  const cycleAppearance = () => {
    if (mode === 'system') {
      void setMode('light');
      return;
    }
    if (mode === 'light') {
      void setMode('dark');
      return;
    }
    void setMode('system');
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: header, paddingBottom: 28 }}>
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <Pressable
            onPress={signedIn ? () => router.push('/(tabs)/profile/account') : undefined}
            disabled={!signedIn}
            accessibilityRole={signedIn ? 'button' : undefined}
            accessibilityLabel={signedIn ? t(TRANSLATION_KEYS.PROFILE.EDIT_ACCOUNT) : undefined}
            className="flex-row items-center flex-1"
          >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ProfileAvatar
              imageUrl={profileImageUrl || auth.user?.imageUrl}
              userName={displayName || auth.user?.userName}
              email={auth.user?.email}
              size={56}
            />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-xl font-bold" style={{ color: onPrimary }} numberOfLines={1}>
              {displayName ? t(TRANSLATION_KEYS.PROFILE.GREETING, { name: displayName }) : t(TRANSLATION_KEYS.PROFILE.TITLE)}
            </Text>
            {auth.user?.email ? (
              <Text className="mt-0.5 text-sm" style={{ color: onPrimary, opacity: 0.85 }} numberOfLines={1}>
                {auth.user.email}
              </Text>
            ) : null}
          </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/notifications')}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.DASHBOARD.NOTIFICATIONS.TITLE)}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="notifications-outline" size={24} color={onPrimary} />
            {badge ? (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  backgroundColor: theme.colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {wallet ? (
          <View
            className="flex-row items-center px-4 py-4 mx-4 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
            style={{ marginTop: 16 }}
          >
            <Ionicons name="wallet-outline" size={22} color={primary} />
            <Text className="flex-1 ml-3 text-base text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.WALLET_COINS)}
            </Text>
            <Text className="text-base font-bold text-text dark:text-text-dark">
              {wallet.balance.toLocaleString('en-US')}
            </Text>
          </View>
        ) : <View style={{ height: 8 }} />}

        <SectionCard title={t(TRANSLATION_KEYS.PROFILE.SECTION_ACCOUNT)}>
          {ACCOUNT_ROWS.filter((row) => !row.signedInOnly || signedIn).map((row, index, rows) => (
            <View key={row.route}>
              <Pressable
                onPress={() => router.push(row.route)}
                accessibilityRole="button"
                accessibilityLabel={t(row.titleKey)}
                className="flex-row items-center px-4 py-4"
              >
                <Ionicons name={row.icon} size={22} color={textColor} />
                <Text className="flex-1 ml-3 text-base text-text dark:text-text-dark">{t(row.titleKey)}</Text>
                <Ionicons name="chevron-forward" size={18} color={muted} />
              </Pressable>
              {index < rows.length - 1 ? <View className="h-px mx-4 bg-border dark:bg-border-dark" /> : null}
            </View>
          ))}
        </SectionCard>

        <SectionCard title={t(TRANSLATION_KEYS.PROFILE.SECTION_PREFERENCES)}>
          <View className="flex-row items-center px-4 py-3">
            <Ionicons name="language-outline" size={22} color={textColor} />
            <Text className="flex-1 ml-3 text-base text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.COMMON.LANGUAGE)}
            </Text>
            <LanguageToggle textColor={textColor} isDark={isDark} size="small" />
          </View>
          <View className="h-px mx-4 bg-border dark:bg-border-dark" />
          <Pressable onPress={cycleAppearance} accessibilityRole="button" className="flex-row items-center px-4 py-4">
            <Ionicons name="contrast-outline" size={22} color={textColor} />
            <Text className="flex-1 ml-3 text-base text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.PROFILE.APPEARANCE)}
            </Text>
            <Text className="mr-2 text-sm text-muted dark:text-muted-dark">{t(appearanceLabel(mode))}</Text>
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </Pressable>
        </SectionCard>

        <View className="mx-4 mt-5 overflow-hidden bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
          <Pressable
            onPress={signedIn ? handleLogout : () => router.push('/(auth)/login')}
            accessibilityRole="button"
            className="flex-row items-center px-4 py-4"
          >
            <Ionicons name={signedIn ? 'log-out-outline' : 'log-in-outline'} size={22} color={primary} />
            <Text className="flex-1 ml-3 text-base font-semibold" style={{ color: primary }}>
              {signedIn ? t(TRANSLATION_KEYS.COMMON.LOGOUT) : t(TRANSLATION_KEYS.COMMUNITY.SIGN_IN)}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
