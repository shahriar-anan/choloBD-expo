import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import theme from '../../../../constants/theme';
import { useTheme } from '../../../../hooks/useTheme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { getMyHotel } from '../../../../services/api/users';
import { getHotelStaff, HotelStaffMember, staffDisplayName } from '../../../../services/api/hotelDesk';
import { goBack } from '../../../../utilities/navigation';

export default function StaffPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [staff, setStaff] = useState<HotelStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hotels = await getMyHotel();
      const hotelId = hotels[0]?.id;
      if (!hotelId) {
        setStaff([]);
        return;
      }
      setStaff(await getHotelStaff(hotelId));
    } catch (loadError: any) {
      setStaff([]);
      setError(loadError?.response?.data?.message || t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.LOAD_HOTEL_FAILED));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 p-6">
        <Pressable onPress={() => goBack(router)} accessibilityRole="button" style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.HOTEL_DESK.STAFF_TITLE)}
        </Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.STAFF_INFO_DESC)}
        </Text>

        {loading ? (
          <ActivityIndicator className="mt-8" color={theme.colors.primary} />
        ) : error ? (
          <Text className="mt-6 text-sm text-text dark:text-text-dark">{error}</Text>
        ) : (
          <FlatList
            className="mt-6"
            data={staff}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={(
              <Text className="text-sm text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.HOTEL_DESK.STAFF_EMPTY)}
              </Text>
            )}
            renderItem={({ item }) => {
              const active = String(item.userStatus).toUpperCase() === 'ACTIVE';
              return (
                <View className="flex-row items-center p-4 mb-3 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  ) : (
                    <View className="items-center justify-center w-11 h-11 rounded-full bg-background dark:bg-background-dark">
                      <Ionicons name="person" size={20} color={textColor} />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-text dark:text-text-dark">{staffDisplayName(item)}</Text>
                    {item.phoneNumber ? (
                      <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{item.phoneNumber}</Text>
                    ) : null}
                    <Text className={`mt-1 text-xs font-semibold ${active ? 'text-primary dark:text-primary-dark' : 'text-muted dark:text-muted-dark'}`}>
                      {active ? t(TRANSLATION_KEYS.HOTEL_DESK.STAFF_ACTIVE) : t(TRANSLATION_KEYS.HOTEL_DESK.STAFF_INACTIVE)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
