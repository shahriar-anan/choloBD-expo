import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useCurrentBookingsFetch } from '../../hooks/useCurrentBookingsFetch';
import { UserInfoUI } from '../ui/userInfoUI';
import { AdminCard } from '../ui/adminCard';
import LanguageToggle from '../ui/LanguageToggle';
import { getMyHotel } from '../../services/api/users';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import theme from '../../constants/theme';
import { DeskBucket, formatDeskDate, matchesDeskBucket } from '../../utilities/hotelDesk';

const HOUSE_ROWS: { lens: DeskBucket; label: string }[] = [
  { lens: 'arriving', label: 'Arriving' },
  { lens: 'inHouse', label: 'In house' },
  { lens: 'departing', label: 'Departing' },
  { lens: 'unpaid', label: 'Unpaid' },
];

function HotelHouseSnapshot() {
  const router = useRouter();
  const { bookings, loading, error } = useCurrentBookingsFetch(100);
  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    HOUSE_ROWS.forEach((row) => {
      next[row.lens] = bookings.filter((booking) => matchesDeskBucket(booking, row.lens)).length;
    });
    return next;
  }, [bookings]);

  return (
    <View className="mt-6">
      <Text className="text-lg font-bold text-text dark:text-text-dark">{formatDeskDate(new Date())}</Text>
      {loading ? (
        <ActivityIndicator className="mt-4" size="small" color={theme.colors.primary} />
      ) : error ? (
        <Text className="mt-3 text-sm text-muted dark:text-muted-dark">Could not load today&apos;s house.</Text>
      ) : (
        <View className="flex-row flex-wrap gap-3 mt-3">
          {HOUSE_ROWS.map((row) => (
            <Pressable
              key={row.lens}
              onPress={() => router.push(`/(tabs)/dashboard/service-admin/current-bookings?lens=${row.lens}`)}
              className="w-[47%] p-4 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark"
            >
              <Text className="text-2xl font-bold text-primary dark:text-primary-dark">{counts[row.lens] ?? 0}</Text>
              <Text className="mt-1 text-sm text-text dark:text-text-dark">{row.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

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
  const { isDark, mode, setMode } = useTheme();
  const { t } = useTranslation();
  const [openingHotel, setOpeningHotel] = useState(false);
  const hotelAdminDesk = hotelOperator && role === 'SERVICE_ADMIN';
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

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

  const appearanceLabel = mode === 'light'
    ? TRANSLATION_KEYS.PROFILE.APPEARANCE_LIGHT
    : mode === 'dark'
      ? TRANSLATION_KEYS.PROFILE.APPEARANCE_DARK
      : TRANSLATION_KEYS.PROFILE.APPEARANCE_SYSTEM;

  const openMyHotel = async () => {
    if (!hotelOperator) {
      router.push('/(tabs)/dashboard/service-admin');
      return;
    }
    if (openingHotel) return;
    setOpeningHotel(true);
    try {
      const hotels = await getMyHotel();
      const hotelId = hotels.length === 1 ? hotels[0]?.id : null;
      if (hotelId) {
        router.push(`/(tabs)/dashboard/service-admin/hotel-info?hotelId=${hotelId}`);
        return;
      }
      router.push('/(tabs)/dashboard/service-admin');
    } catch {
      router.push('/(tabs)/dashboard/service-admin');
    } finally {
      setOpeningHotel(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
        contentContainerStyle={hotelAdminDesk ? { paddingBottom: 120 } : undefined}
      >
        <View className="flex-row items-start justify-between px-6 pt-8 pb-2">
          <View className="flex-1">
            <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.WELCOME_BACK)}</Text>
            <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">
              {t(hotelAdminDesk ? TRANSLATION_KEYS.TABS.DASHBOARD : TRANSLATION_KEYS.DASHBOARD.ADMIN_TITLE)}
            </Text>
          </View>
          {hotelOperator && !hotelAdminDesk ? (
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
            hideLogout={hotelAdminDesk}
          />

          {hotelOperator && !hotelAdminDesk ? <HotelHouseSnapshot /> : null}

          <View className="mt-6 gap-3">
            <AdminCard
              title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.MY_HOTEL)}
              subtitle={hotelOperator ? undefined : t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.MY_HOTEL_DESC)}
              onPress={openMyHotel}
            />
            {hotelAdminDesk ? (
              <>
                <AdminCard
                  title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.EARNINGS)}
                  onPress={() => router.push('/(tabs)/dashboard/service-admin/earnings')}
                />
                <AdminCard
                  title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.AVAILABILITY)}
                  onPress={() => router.push('/(tabs)/dashboard/service-admin/availability')}
                />
                <AdminCard
                  title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS)}
                  onPress={() => router.push('/(tabs)/dashboard/service-admin/complaints')}
                />
                <AdminCard
                  title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.QR_SCANNER)}
                  onPress={() => router.push('/(tabs)/dashboard/service-admin/qr-scanner')}
                />
              </>
            ) : (
              <>
            <AdminCard
              title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.CURRENT_BOOKINGS)}
              subtitle={hotelOperator ? undefined : t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.CURRENT_BOOKINGS_DESC)}
              onPress={() => router.push('/(tabs)/dashboard/service-admin/current-bookings')}
            />
            <AdminCard
              title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.QR_SCANNER)}
              subtitle={hotelOperator ? undefined : t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.QR_SCANNER_DESC)}
              onPress={() => router.push('/(tabs)/dashboard/service-admin/qr-scanner')}
            />
            {hotelOperator ? (
              <AdminCard
                title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.EARNINGS)}
                onPress={() => router.push('/(tabs)/dashboard/service-admin/earnings')}
              />
            ) : null}
            {hotelOperator ? (
              <AdminCard
                title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.AVAILABILITY)}
                onPress={() => router.push('/(tabs)/dashboard/service-admin/availability')}
              />
            ) : null}
            {hotelOperator ? (
              <AdminCard
                title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS)}
                onPress={() => router.push('/(tabs)/dashboard/service-admin/complaints')}
              />
            ) : null}
              </>
            )}
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

          {hotelAdminDesk ? (
            <View className="mt-6">
              <Text className="mb-2 text-base font-bold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.DASHBOARD.SETTINGS)}
              </Text>
              <View className="overflow-hidden bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
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
                  <Text className="mr-2 text-sm text-muted dark:text-muted-dark">{t(appearanceLabel)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={muted} />
                </Pressable>
                <View className="h-px mx-4 bg-border dark:bg-border-dark" />
                <Pressable onPress={onLogout} accessibilityRole="button" className="flex-row items-center px-4 py-4">
                  <Ionicons name="log-out-outline" size={22} color={primary} />
                  <Text className="flex-1 ml-3 text-base font-semibold" style={{ color: primary }}>
                    {t(TRANSLATION_KEYS.COMMON.LOGOUT)}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ServiceAdminDashboard;
