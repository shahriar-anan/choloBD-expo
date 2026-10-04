import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { UserInfoUI } from '../ui/userInfoUI';
import { AdminCard } from '../ui/adminCard';
import { HotelDeskSettings } from '../hotel/HotelDeskSettings';
import { getMyHotel } from '../../services/api/users';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

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
  const { t } = useTranslation();
  const [openingHotel, setOpeningHotel] = useState(false);
  const hotelAdminDesk = hotelOperator && role === 'SERVICE_ADMIN';
  const hotelDesk = hotelOperator && (role === 'SERVICE_ADMIN' || role === 'EMPLOYEE');

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
        contentContainerStyle={hotelDesk ? { paddingBottom: 120 } : undefined}
      >
        <View className="flex-row items-start justify-between px-6 pt-8 pb-2">
          <View className="flex-1">
            <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.WELCOME_BACK)}</Text>
            <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">
              {t(hotelDesk ? TRANSLATION_KEYS.TABS.DASHBOARD : TRANSLATION_KEYS.DASHBOARD.ADMIN_TITLE)}
            </Text>
          </View>
        </View>

        <View className="px-6 pb-8">
          <UserInfoUI
            userName={userName}
            email={email}
            imageUrl={imageUrl}
            role={role}
            userStatus={userStatus}
            onLogout={onLogout}
            hideLogout={hotelDesk}
          />

          <View className="mt-6 gap-3">
            <AdminCard
              title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.MY_HOTEL)}
              subtitle={hotelOperator ? undefined : t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.MY_HOTEL_DESC)}
              onPress={openMyHotel}
            />
            {hotelDesk ? (
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
                {hotelAdminDesk ? (
                  <AdminCard
                    title={t(TRANSLATION_KEYS.HOTEL_DESK.STAFF_TITLE)}
                    onPress={() => router.push('/(tabs)/dashboard/service-admin/staff')}
                  />
                ) : null}
                <AdminCard
                  title={t(TRANSLATION_KEYS.HOTEL_DESK.TASKS_TITLE)}
                  onPress={() => router.push('/(tabs)/dashboard/service-admin/tasks')}
                />
                <AdminCard
                  title={t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.QR_SCANNER)}
                  onPress={() => router.push(hotelAdminDesk ? '/(tabs)/dashboard/service-admin/qr-scanner' : '/(tabs)/qr-scanner')}
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
            {hotelOperator ? (
              <AdminCard
                title={t(TRANSLATION_KEYS.HOTEL_DESK.TASKS_TITLE)}
                onPress={() => router.push('/(tabs)/dashboard/service-admin/tasks')}
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

          {hotelAdminDesk ? <HotelDeskSettings onLogout={onLogout} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ServiceAdminDashboard;
