import React from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/LanguageProvider';
import { useTheme } from '../../hooks/useTheme';
import { UserInfoUI } from '../ui/userInfoUI';
import { AdminCard } from '../ui/adminCard';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import theme from '../../constants/theme';

interface ServiceAdminDashboardProps {
  userName?: string;
  email?: string;
  imageUrl?: string;
  role?: string;
  userStatus?: string;
  onLogout: () => void;
  hotelOperator?: boolean;
}

export function ServiceAdminDashboard({
  userName,
  email,
  imageUrl,
  role,
  userStatus,
  onLogout,
  hotelOperator = false,
}: ServiceAdminDashboardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} refreshControl={undefined}>
        <View className="flex-row items-start justify-between px-6 pt-8 pb-2">
          <View className="flex-1">
            <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.WELCOME_BACK)}</Text>
            <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">{t(TRANSLATION_KEYS.DASHBOARD.ADMIN_TITLE)}</Text>
          </View>
          {hotelOperator ? (
            <Pressable
              onPress={() => router.push('/(tabs)/dashboard/notifications')}
              accessibilityLabel={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.NOTIFICATIONS)}
              className="p-2"
            >
              <Ionicons name="notifications-outline" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
            </Pressable>
          ) : null}
        </View>

        <View className="px-6 pb-8">
          <UserInfoUI
            userName={userName}
            email={email}
            imageUrl={imageUrl}
            role={role}
            userStatus={userStatus}
            onLogout={onLogout}
          />

          <View className="mt-6 space-y-3">
            <AdminCard
              title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.MY_HOTEL)}
              subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.MY_HOTEL_DESC)}
              onPress={() => router.push('/(tabs)/dashboard/service-admin')}
            />
            <AdminCard
              title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.CURRENT_BOOKINGS)}
              subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.CURRENT_BOOKINGS_DESC)}
              onPress={() => router.push('/(tabs)/dashboard/service-admin/current-bookings')}
            />
            <AdminCard
              title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.QR_SCANNER)}
              subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.QR_SCANNER_DESC)}
              onPress={() => router.push('/(tabs)/dashboard/service-admin/qr-scanner')}
            />
            {hotelOperator ? (
              <AdminCard
                title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS)}
                subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS_DESC)}
                onPress={() => router.push('/(tabs)/dashboard/service-admin/complaints')}
              />
            ) : null}
            {hotelOperator ? null : (
              <>
                <AdminCard
                  title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.STAFF_INFO)}
                  subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.STAFF_INFO_DESC)}
                  onPress={() => router.push('/(tabs)/dashboard/service-admin/staff')}
                />
                <AdminCard
                  title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.YOUR_BOOKINGS_ADMIN)}
                  subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.YOUR_BOOKINGS_ADMIN_DESC)}
                  onPress={() => router.push('/(tabs)/dashboard/service-admin/your-bookings')}
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ServiceAdminDashboard;
