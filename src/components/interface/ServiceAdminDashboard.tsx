import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import { UserInfoUI } from '../ui/userInfoUI';
import { AdminCard } from '../ui/adminCard';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { RootState } from '../../store/store';

interface ServiceAdminDashboardProps {
  userName?: string;
  email?: string;
  imageUrl?: string;
  role?: string;
  userStatus?: string;
  onLogout: () => void;
}

type ServiceKind = 'hotel' | 'guide' | 'activity' | 'transport' | 'unknown';

function resolveServiceKind(serviceType?: string | null): ServiceKind {
  const value = (serviceType || '').toUpperCase();
  if (
    value.includes('HOTEL') ||
    value === 'HOTEL_BOOKING' ||
    value === 'HOTEL_SERVICE'
  ) {
    return 'hotel';
  }
  if (value.includes('GUIDE') || value === 'GUIDE_SERVICE') return 'guide';
  if (value.includes('ACTIVITY') || value === 'ACTIVITY_BOOKING') return 'activity';
  if (
    value.includes('TRANSPORT') ||
    value.includes('BUS') ||
    value === 'TRANSPORT_SERVICE'
  ) {
    return 'transport';
  }
  return 'unknown';
}

export function ServiceAdminDashboard({
  userName,
  email,
  imageUrl,
  role,
  userStatus,
  onLogout,
}: ServiceAdminDashboardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const auth = useSelector((s: RootState) => s.auth);
  const serviceKind = resolveServiceKind(auth.user?.serviceType);

  const hotelCards = (
    <>
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
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.HOTEL_STATS)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.HOTEL_STATS_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/hotel-stats')}
      />
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.HOTEL_EARNINGS)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.HOTEL_EARNINGS_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/hotel-earnings')}
      />
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ROOM_TYPES)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ROOM_TYPES_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/room-types')}
      />
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/complaints')}
      />
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.QR_SCANNER)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.QR_SCANNER_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/qr-scanner')}
      />
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
  );

  const guideCards = (
    <>
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.GUIDE_PROFILE)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.GUIDE_PROFILE_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/guide-profile')}
      />
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.GUIDE_REQUESTS)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.GUIDE_REQUESTS_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/guide-requests')}
      />
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.GUIDE_EARNINGS)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.GUIDE_EARNINGS_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/guide-earnings')}
      />
    </>
  );

  const activityCards = (
    <>
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_PROFILE)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_PROFILE_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/activity-profile')}
      />
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_BOOKINGS)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_BOOKINGS_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/activity-bookings-admin')}
      />
      <AdminCard
        title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_EARNINGS)}
        subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_EARNINGS_DESC)}
        onPress={() => router.push('/(tabs)/dashboard/service-admin/activity-earnings')}
      />
    </>
  );

  const transportCards = (
    <AdminCard
      title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.TRANSPORT_MANAGEMENT)}
      subtitle={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.TRANSPORT_MANAGEMENT_DESC)}
      onPress={() => router.push('/(tabs)/dashboard/service-admin/transport-admin')}
    />
  );

  const cards =
    serviceKind === 'hotel'
      ? hotelCards
      : serviceKind === 'guide'
        ? guideCards
        : serviceKind === 'activity'
          ? activityCards
          : serviceKind === 'transport'
            ? transportCards
            : (
              <>
                {hotelCards}
                {guideCards}
                {activityCards}
                {transportCards}
              </>
            );

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-8 pb-2">
          <Text className="text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.WELCOME_BACK)}
          </Text>
          <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_TITLE)}
          </Text>
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

          <View className="mt-6 space-y-3">{cards}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ServiceAdminDashboard;
