import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { useComplaintInboxLogic } from '@/hooks/useComplaintInboxLogic';
import { ComplaintCard } from '@/components/complaints';
import { ComplaintStatus } from '@/types/enums';

const FILTERS: Array<{ value: ComplaintStatus | ''; label: string }> = [
  { value: '', label: 'ALL' },
  { value: ComplaintStatus.OPEN, label: 'OPEN' },
  { value: ComplaintStatus.UNSOLVED, label: 'UNSOLVED' },
  { value: ComplaintStatus.CLOSED, label: 'CLOSED' },
];

export function ComplaintsTab() {
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
    <View className="flex-1 px-6 pt-4">
      <Text className="mb-1 text-lg font-semibold text-text dark:text-text-dark">
        {t(TRANSLATION_KEYS.COMPLAINTS.INBOX_TITLE)}
      </Text>
      <Text className="mb-3 text-sm text-muted dark:text-muted-dark">
        {t(TRANSLATION_KEYS.COMPLAINTS.INBOX_DESC)}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {FILTERS.map((filter) => {
          const active = statusFilter === filter.value;
          return (
            <Pressable
              key={filter.label}
              onPress={() => changeStatusFilter(filter.value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
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
                  fontSize: 12,
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
        <View className="items-center justify-center flex-1 py-16">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : error ? (
        <View className="p-4 border rounded-xl border-border dark:border-border-dark">
          <Text className="text-sm text-text dark:text-text-dark">{error}</Text>
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
            <Text className="mb-2 text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.COMPLAINTS.TOTAL_COUNT, { count: total })}
            </Text>
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
              />
              <Text className="mt-3 text-base font-semibold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.COMPLAINTS.EMPTY_TITLE)}
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
  );
}
