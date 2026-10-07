import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { goBack } from '../../../../utilities/navigation';
import { useTranslation } from 'react-i18next';
import { AdminCard } from '../../../../components/ui/adminCard';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { useServiceAdminLogic } from '../../../../hooks/useServiceAdminLogic';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import theme from '../../../../constants/theme';
import { useTheme } from '../../../../hooks/useTheme';

export default function ServiceAdminIndex() {
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);
  const { isDark } = useTheme();
  const { fetchMyHotel } = useServiceAdminLogic();
  const { t } = useTranslation();
  const [hotels, setHotels] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      let openedHotel = false;
      try {
        setLoading(true);
        console.log('[ServiceAdminIndex] ▶️ Starting load...');
        console.log('[ServiceAdminIndex] auth.user?.id:', auth.user?.id);
        
        if (!auth.user?.id) {
          console.log('[ServiceAdminIndex] ❌ No user ID found');
          return;
        }

        const res = await fetchMyHotel();
        const hotelsList = Array.isArray(res) ? res : [];

        if (hotelsList.length === 1 && hotelsList[0]?.id) {
          openedHotel = true;
          router.replace(`/(tabs)/dashboard/service-admin/hotel-info?hotelId=${hotelsList[0].id}`);
          return;
        }

        if (hotelsList.length === 0) {
          setMessage(null);
          setHotels([]);
          return;
        }

        setHotels(hotelsList);
        setMessage(null);
      } catch (e: any) {
        console.error('[ServiceAdminIndex] ❌ Error:', {
          message: e.message,
          status: e?.response?.status,
          data: e?.response?.data,
          fullError: e
        });
        if (e?.response?.status === 401) {
          setMessage(t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.AUTH_FAILED));
        } else {
          setMessage(t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.LOAD_HOTEL_FAILED));
        }
        setHotels([]);
      } finally {
        if (!openedHotel) setLoading(false);
        console.log('[ServiceAdminIndex] ✅ Load complete');
      }
    };
    load();
  }, [auth.user?.id, fetchMyHotel, router, t]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 pt-6 pb-8">
          <Pressable
            onPress={() => goBack(router)}
            style={{ padding: 6, marginLeft: -6, alignSelf: 'flex-start' }}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)}
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
          </Pressable>
          <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.HOTELS_TITLE)}</Text>
          <Text className="text-sm text-muted dark:text-muted-dark mt-1">{t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.HOTELS_SUBTITLE)}</Text>

          {loading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text className="mt-3 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.LOADING_HOTELS)}</Text>
            </View>
          ) : message ? (
            <View className="p-4 mt-6 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <Text className="text-sm text-red-700 dark:text-red-200">{message}</Text>
            </View>
          ) : hotels.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-lg font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.NO_HOTELS_FOUND)}</Text>
              <Text className="mt-2 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.HOTEL_LIST_EMPTY)}</Text>
            </View>
          ) : (
            <View className="mt-6 space-y-3">
              {hotels.map((hotel) => (
                <AdminCard
                  key={hotel.id}
                  title={hotel.name ?? t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.UNNAMED_HOTEL)}
                  subtitle={hotel.location?.name ?? '—'}
                  onPress={() => router.push(`/(tabs)/dashboard/service-admin/hotel-info?hotelId=${hotel.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
