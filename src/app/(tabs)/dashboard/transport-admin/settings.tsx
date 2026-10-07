import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../hooks/useTheme';
import { useDashboardLogic } from '../../../../hooks/useDashboardLogic';
import theme from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { ProfileAvatar } from '../../../../components/ui/profileAvatar';
import LanguageToggle from '../../../../components/ui/LanguageToggle';
import { profileDisplayName } from '../../../../utilities/profileImage';
import { goBack } from '../../../../utilities/navigation';

type SettingsRoute = '/(tabs)/profile/account' | '/(tabs)/profile/about' | '/(tabs)/profile/help';

const ACCOUNT_ROWS: { titleKey: string; route: SettingsRoute; icon: keyof typeof Ionicons.glyphMap }[] = [
  { titleKey: TRANSLATION_KEYS.PROFILE.EDIT_ACCOUNT, route: '/(tabs)/profile/account', icon: 'person-outline' },
  { titleKey: TRANSLATION_KEYS.PROFILE.ABOUT, route: '/(tabs)/profile/about', icon: 'information-circle-outline' },
  { titleKey: TRANSLATION_KEYS.PROFILE.HELP, route: '/(tabs)/profile/help', icon: 'help-circle-outline' },
];

function appearanceLabel(mode: string): string {
  if (mode === 'light') return TRANSLATION_KEYS.PROFILE.APPEARANCE_LIGHT;
  if (mode === 'dark') return TRANSLATION_KEYS.PROFILE.APPEARANCE_DARK;
  return TRANSLATION_KEYS.PROFILE.APPEARANCE_SYSTEM;
}

export default function TransportAdminSettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, mode, setMode } = useTheme();
  const { auth, profileImageUrl, handleLogout } = useDashboardLogic();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const onPrimary = isDark ? theme.colors['onPrimary-dark'] : theme.colors.onPrimary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const displayName = profileDisplayName(auth.user);

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
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary, paddingBottom: 28 }}>
        <View className="flex-row items-center px-5 pt-4">
          <Pressable
            onPress={() => goBack(router)}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
          >
            <Ionicons name="arrow-back" size={22} color={onPrimary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/profile/account')}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.PROFILE.EDIT_ACCOUNT)}
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
                {displayName ? t(TRANSLATION_KEYS.PROFILE.GREETING, { name: displayName }) : t(TRANSLATION_KEYS.DASHBOARD.SETTINGS)}
              </Text>
              {auth.user?.email ? (
                <Text className="mt-0.5 text-sm" style={{ color: onPrimary, opacity: 0.85 }} numberOfLines={1}>
                  {auth.user.email}
                </Text>
              ) : null}
            </View>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-5">
          <Text className="px-5 mb-2 text-base font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.PROFILE.SECTION_ACCOUNT)}
          </Text>
          <View className="mx-4 overflow-hidden bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
            {ACCOUNT_ROWS.map((row, index) => (
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
                {index < ACCOUNT_ROWS.length - 1 ? <View className="h-px mx-4 bg-border dark:bg-border-dark" /> : null}
              </View>
            ))}
          </View>
        </View>

        <View className="mt-5">
          <Text className="px-5 mb-2 text-base font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.PROFILE.SECTION_PREFERENCES)}
          </Text>
          <View className="mx-4 overflow-hidden bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
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
          </View>
        </View>

        <View className="mx-4 mt-5 overflow-hidden bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
          <Pressable onPress={handleLogout} accessibilityRole="button" className="flex-row items-center px-4 py-4">
            <Ionicons name="log-out-outline" size={22} color={primary} />
            <Text className="flex-1 ml-3 text-base font-semibold" style={{ color: primary }}>
              {t(TRANSLATION_KEYS.COMMON.LOGOUT)}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
