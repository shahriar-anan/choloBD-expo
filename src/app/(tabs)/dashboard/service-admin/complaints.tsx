import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { useComplaintInboxLogic } from '@/hooks/useComplaintInboxLogic';
import { ComplaintCard } from '@/components/complaints';
import { ComplaintStatus } from '@/types/enums';

const FILTERS: Array<{ value: ComplaintStatus | ''; labelKey: string }> = [
  { value: '', labelKey: 'ALL' },
  { value: ComplaintStatus.OPEN, labelKey: 'OPEN' },
  { value: ComplaintStatus.UNSOLVED, labelKey: 'UNSOLVED' },
  { value: ComplaintStatus.CLOSED, labelKey: 'CLOSED' },
];

export default function HotelComplaintsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const {
    complaints,
    total,
    loading,
    refreshing,
    error,
    statusFilter,
    fetchInbox,
    onRefresh,
    changeStatusFilter,
  } = useComplaintInboxLogic();

  useEffect(() => {
    fetchInbox('');
  }, []);

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <View className="flex-1 px-6 pt-4">
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 6, marginBottom: 8 }}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={text} />
        </Pressable>

        <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS)}
        </Text>
        <Text className="mt-1 mb-4 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS_DESC)}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <Pressable
                key={filter.labelKey}
                onPress={() => changeStatusFilter(filter.value)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? primary : 'transparent',
                  borderWidth: 1,
                  borderColor: active
                    ? primary
                    : isDark
                      ? theme.colors['border-dark']
                      : theme.colors.border,
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : text,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {filter.value
                    ? filter.value
                    : t(TRANSLATION_KEYS.COMPLAINTS.ALL_STATUSES)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading && !refreshing ? (
          <View className="items-center justify-center flex-1">
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : error ? (
          <View className="p-4 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
            <Text className="text-sm text-text dark:text-text-dark">{error}</Text>
            <Pressable onPress={() => fetchInbox()} className="mt-3">
              <Text style={{ color: primary, fontWeight: '600' }}>
                {t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={complaints}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ComplaintCard
                complaint={item}
                onPress={(id) =>
                  router.push(`/(tabs)/dashboard/service-admin/complaints/${id}`)
                }
              />
            )}
            ListHeaderComponent={
              <Text className="mb-3 text-xs text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.COMPLAINTS.TOTAL_COUNT, { count: total })}
              </Text>
            }
            ListEmptyComponent={
              <View className="items-center py-16">
                <Ionicons
                  name="chatbubbles-outline"
                  size={48}
                  color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
                />
                <Text className="mt-3 text-base font-semibold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.COMPLAINTS.EMPTY_TITLE)}
                </Text>
                <Text className="mt-1 text-sm text-center text-muted dark:text-muted-dark px-8">
                  {t(TRANSLATION_KEYS.COMPLAINTS.EMPTY_DESC)}
                </Text>
              </View>
            }
            refreshing={refreshing}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
