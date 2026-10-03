import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { AttractionBookingCard } from '../../../components/attractions/AttractionBookingCard';
import { AttractionBookingTab, useAttractionBookings } from '../../../hooks/useAttractionBookings';
import { cancelActivityBooking } from '../../../services/api/activityBookings';
import { cancelGuideBooking } from '../../../services/api/guideBookings';
import type { RootState } from '../../../store/store';

type BookingTab = Exclude<AttractionBookingTab, 'places'>;

const TABS: { id: BookingTab; labelKey: string }[] = [
  { id: 'activities', labelKey: TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TAB_ACTIVITIES },
  { id: 'guides', labelKey: TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TAB_GUIDES },
];

function readTab(value: string | string[] | undefined): BookingTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return tab === 'guides' ? 'guides' : 'activities';
}

export default function AttractionBookingsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const { activities, guides, loading, error, refresh } = useAttractionBookings(userId);
  const [tab, setTab] = useState<BookingTab>(readTab(params.tab));
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  useFocusEffect(
    useCallback(() => {
      setTab(readTab(params.tab));
      refresh();
    }, [params.tab, refresh]),
  );

  const openPayment = (bookingId: string, serviceType: 'ACTIVITY_BOOKING' | 'GUIDE_SERVICE', totalPrice: number) => {
    router.push({
      pathname: '/(tabs)/dashboard/payment',
      params: {
        bookingId,
        serviceType,
        totalPrice: String(totalPrice),
      },
    });
  };

  const confirmCancel = (bookingId: string, kind: 'activity' | 'guide') => {
    Alert.alert(t(TRANSLATION_KEYS.BOOKING.CANCEL), undefined, [
      { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
      {
        text: t(TRANSLATION_KEYS.BOOKING.CANCEL),
        style: 'destructive',
        onPress: () => {
          void runCancel(bookingId, kind);
        },
      },
    ]);
  };

  const runCancel = async (bookingId: string, kind: 'activity' | 'guide') => {
    setCancellingId(bookingId);
    try {
      if (kind === 'activity') {
        await cancelActivityBooking(bookingId);
      } else {
        await cancelGuideBooking(bookingId);
      }
      await refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.NOT_FOUND);
      Alert.alert(t(TRANSLATION_KEYS.BOOKING.CANCEL), message);
    } finally {
      setCancellingId(null);
    }
  };

  const rows = tab === 'guides' ? guides : activities;
  const emptyKey = tab === 'guides'
    ? TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.EMPTY_GUIDES
    : TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.EMPTY_ACTIVITIES;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center mb-4" style={{ flexGrow: 0, flexShrink: 0 }}>
          <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 6, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text dark:text-text-dark" style={{ textTransform: 'uppercase' }}>
              {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.TITLE)}
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.DESC)}
            </Text>
          </View>
        </View>

        <View style={{ flexGrow: 0, flexShrink: 0, marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {TABS.map((item) => {
              const selected = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setTab(item.id)}
                  className="px-4 py-2 mr-2 rounded-full"
                  style={{
                    backgroundColor: selected ? primary : 'transparent',
                    borderWidth: 1,
                    borderColor: primary,
                    alignSelf: 'center',
                  }}
                >
                  <Text style={{ color: selected ? '#fff' : primary }} className="text-sm font-semibold">
                    {t(item.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading && rows.length === 0 ? (
          <View className="items-center justify-center flex-1">
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : error && rows.length === 0 ? (
          <Text className="mt-8 text-center text-muted dark:text-muted-dark">{error}</Text>
        ) : rows.length === 0 ? (
          <Text className="mt-8 text-center text-muted dark:text-muted-dark">{t(emptyKey)}</Text>
        ) : tab === 'guides' ? (
          <FlatList
            style={{ flex: 1 }}
            data={guides}
            keyExtractor={(item) => item.id}
            onRefresh={refresh}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <AttractionBookingCard
                kind="guide"
                booking={item}
                cancelling={cancellingId === item.id}
                onPay={() => openPayment(item.id, 'GUIDE_SERVICE', item.totalPrice)}
                onCancel={() => confirmCancel(item.id, 'guide')}
              />
            )}
          />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={activities}
            keyExtractor={(item) => item.id}
            onRefresh={refresh}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <AttractionBookingCard
                kind="activity"
                booking={item}
                cancelling={cancellingId === item.id}
                onPay={() => openPayment(item.id, 'ACTIVITY_BOOKING', item.totalPrice)}
                onCancel={() => confirmCancel(item.id, 'activity')}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
