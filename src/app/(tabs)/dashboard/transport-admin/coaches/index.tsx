import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../hooks/useTheme';
import theme from '../../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../../constants/translationKeys';
import { useTransportOperator } from '../../../../../hooks/useTransportOperator';
import { CoachCompactCard } from '../../../../../components/transportOperator/CoachCompactCard';
import { getTransportLayouts } from '../../../../../services/api/transports';
import { TransportLayoutRef } from '../../../../../types/transports';
import { COACH_BUS_TYPES, CoachBusType, layoutCoachClass } from '../../../../../utilities/coachOperator';
import { goBack } from '../../../../../utilities/navigation';

type TypeFilter = 'ALL' | CoachBusType;

export default function TransportAdminCoachesHubPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const { transport, transportId, transportType, loading: opLoading } = useTransportOperator(true);

  const [layouts, setLayouts] = useState<TransportLayoutRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [filterOpen, setFilterOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!transportId) return;
    const rows = await getTransportLayouts(transportId);
    setLayouts(rows);
  }, [transportId]);

  useFocusEffect(
    useCallback(() => {
      if (!transportId) return;
      setLoading(true);
      reload()
        .catch(() => setLayouts([]))
        .finally(() => setLoading(false));
    }, [transportId, reload])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return layouts.filter((layout) => {
      if (typeFilter !== 'ALL') {
        const coachClass = layoutCoachClass(layout);
        if (coachClass?.busServiceType !== typeFilter) return false;
      }
      if (!q) return true;
      return layout.name.toLowerCase().includes(q);
    });
  }, [layouts, query, typeFilter]);

  const companyImage = transport?.images?.[0]?.url ?? null;

  const filterLabel =
    typeFilter === 'ALL'
      ? t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FILTER_ALL)
      : t(
          typeFilter === 'AC_SEATER'
            ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.AC_SEATER
            : typeFilter === 'NON_AC_SEATER'
              ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.NON_AC_SEATER
              : typeFilter === 'AC_SLEEPER'
                ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.AC_SLEEPER
                : TRANSLATION_KEYS.TRANSPORT_OPERATOR.NON_AC_SLEEPER
        );

  if (opLoading || !transportId) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  if (transportType !== 'BUS') {
    return (
      <SafeAreaView edges={['top']} className="flex-1 px-6 bg-background dark:bg-background-dark">
        <Text className="mt-8 text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.BUS_ONLY)}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => goBack(router)} style={{ padding: 6, marginRight: 12 }} accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color={primary} />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.COACH_SERVICES)}
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/dashboard/transport-admin/coaches/new')}
            className="items-center justify-center w-10 h-10 rounded-full bg-primary dark:bg-primary-dark"
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_COACH)}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>

        <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
          <View className="flex-row items-center flex-1 px-3 py-2 border rounded-xl border-border dark:border-border-dark">
            <Ionicons name="search" size={18} color={muted} />
            <TextInput
              className="flex-1 ml-2 text-text dark:text-text-dark"
              placeholder={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SEARCH_COACHES)}
              placeholderTextColor={muted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Pressable
            onPress={() => setFilterOpen((open) => !open)}
            className="flex-row items-center px-3 py-2 border rounded-xl border-border dark:border-border-dark"
          >
            <Ionicons name="options-outline" size={18} color={primary} />
            <Text className="ml-1 text-sm text-text dark:text-text-dark">{filterLabel}</Text>
          </Pressable>
        </View>

        {filterOpen ? (
          <View className="flex-row flex-wrap mb-3">
            <Pressable
              onPress={() => {
                setTypeFilter('ALL');
                setFilterOpen(false);
              }}
              className={`px-3 py-2 mr-2 mb-2 rounded-full border ${typeFilter === 'ALL' ? 'border-primary bg-primary/15' : 'border-border dark:border-border-dark'}`}
            >
              <Text className="text-sm text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FILTER_ALL)}</Text>
            </Pressable>
            {COACH_BUS_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  setTypeFilter(type);
                  setFilterOpen(false);
                }}
                className={`px-3 py-2 mr-2 mb-2 rounded-full border ${typeFilter === type ? 'border-primary bg-primary/15' : 'border-border dark:border-border-dark'}`}
              >
                <Text className="text-sm text-text dark:text-text-dark">
                  {t(
                    type === 'AC_SEATER'
                      ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.AC_SEATER
                      : type === 'NON_AC_SEATER'
                        ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.NON_AC_SEATER
                        : type === 'AC_SLEEPER'
                          ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.AC_SLEEPER
                          : TRANSLATION_KEYS.TRANSPORT_OPERATOR.NON_AC_SLEEPER
                  )}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push('/(tabs)/dashboard/transport-admin/coaches/new')}
          className="flex-row items-center justify-center py-3 mb-2 border border-dashed rounded-xl border-primary dark:border-primary-dark"
        >
          <Ionicons name="add-circle-outline" size={20} color={primary} />
          <Text className="ml-2 font-semibold text-primary dark:text-primary-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_COACH)}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {loading ? (
          <ActivityIndicator color={primary} className="mt-8" />
        ) : filtered.length === 0 ? (
          <Text className="mt-6 text-sm text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.NO_COACHES)}
          </Text>
        ) : (
          filtered.map((layout) => (
            <CoachCompactCard
              key={layout.id}
              layout={layout}
              fallbackImageUrl={companyImage}
              onPress={() => router.push(`/(tabs)/dashboard/transport-admin/coaches/${layout.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
