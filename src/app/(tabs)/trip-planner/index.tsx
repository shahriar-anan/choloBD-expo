/**
 * Trip plan hub: personal plans and published catalog templates.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useFetchLocations } from '../../../hooks/useFetchLocations';
import { useCatalogPlans, usePersonalPlans } from '../../../hooks/useTripPlanHub';
import { deleteTrip } from '../../../services/api/tripPlanner';
import { RootState } from '../../../store/store';
import type { Location } from '../../../types/locations';
import type { TourPackage, TourType } from '../../../types/tours';
import type { TripPlan } from '../../../types/trips';
import { TOUR_TYPE_VALUES } from '../../../utils/tripPlanItinerary';
import { formatTaka } from '../../../utils/tripPlanItinerary';
import { formatBdt } from '../../../utils/money';
import { goBack } from '../../../utilities/navigation';

type HubTab = 'mine' | 'templates';

function readTab(value: string | string[] | undefined): HubTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'templates') return 'templates';
  return 'mine';
}

function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw || undefined;
}

export default function TripPlannerIndex() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; locationId?: string; fromHome?: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { locations } = useFetchLocations();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const isInitializing = useSelector((state: RootState) => state.auth.isInitializing);

  const [tab, setTab] = useState<HubTab>(readTab(params.tab));
  const [search, setSearch] = useState('');
  const [locationFocused, setLocationFocused] = useState(false);
  const [pickedDivisionId, setPickedDivisionId] = useState<string | undefined>(readParam(params.locationId));
  const [tourType, setTourType] = useState<TourType | undefined>();

  const routeTab = readTab(params.tab);
  const routeLocationId = readParam(params.locationId);
  const divisions = useMemo(
    () => locations.filter((location) => location.locationType === 'DIVISION'),
    [locations],
  );

  useEffect(() => {
    setTab(routeTab);
    setTourType(undefined);
  }, [routeTab]);

  useEffect(() => {
    if (!routeLocationId) return;
    const division = divisions.find((location) => location.id === routeLocationId);
    if (!division) return;
    setPickedDivisionId(division.id);
    setSearch(division.name);
  }, [routeLocationId, divisions]);

  const selectedDivision = divisions.find((location) => location.id === pickedDivisionId);
  const query = search.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!query) return divisions;
    return divisions.filter((location) => location.name.toLowerCase().includes(query));
  }, [divisions, query]);
  const showSuggestions = locationFocused && search.trim().toLowerCase() !== (selectedDivision?.name.toLowerCase() ?? '\0');

  const mineEnabled = tab === 'mine' && isAuthenticated && !isInitializing;
  const plans = usePersonalPlans(undefined, mineEnabled);
  const templates = useCatalogPlans(
    {
      ...(pickedDivisionId ? { divisionId: pickedDivisionId } : {}),
      ...(tourType ? { tourType } : {}),
    },
    tab === 'templates',
  );

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const onPrimary = isDark ? theme.colors['onPrimary-dark'] : theme.colors.onPrimary;
  const accentWash = isDark ? 'rgba(93, 173, 226, 0.16)' : 'rgba(0, 102, 255, 0.10)';

  const handleBack = () => {
    if (params.fromHome === 'true') {
      router.replace('/(tabs)');
      return;
    }
    goBack(router);
  };

  const selectTab = (next: HubTab) => {
    setTab(next);
    setTourType(undefined);
    if (next !== 'templates') setLocationFocused(false);
  };

  const chooseDivision = (division: Location) => {
    setPickedDivisionId(division.id);
    setSearch(division.name);
    setLocationFocused(false);
  };

  const clearDivision = () => {
    setPickedDivisionId(undefined);
    setSearch('');
    setLocationFocused(true);
  };

  const startBlank = () => {
    router.push('/(tabs)/trip-planner/create');
  };

  const openPlan = (tripId: string) => {
    router.push(`/(tabs)/trip-planner/${tripId}`);
  };

  const openTemplate = (packageId: string) => {
    router.push({ pathname: '/(tabs)/explore/tour-detail', params: { id: packageId } });
  };

  const confirmDelete = (tripId: string, tripName: string) => {
    Alert.alert(
      t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_TRIP_TITLE),
      t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_TRIP_MESSAGE, { name: tripName }),
      [
        { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
        {
          text: t(TRANSLATION_KEYS.COMMON.DELETE),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrip(tripId);
              plans.refresh();
            } catch (error: unknown) {
              const message = error && typeof error === 'object' && 'message' in error
                ? String((error as { message?: string }).message)
                : t(TRANSLATION_KEYS.COMMON.ERROR);
              Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), message);
            }
          },
        },
      ],
    );
  };

  const needsSignIn = tab === 'mine' && !isInitializing && (!isAuthenticated || (plans.error?.includes('Unauthorized') ?? false));
  const active = tab === 'mine' ? plans : templates;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-4 pt-1 pb-1">
        <TouchableOpacity onPress={handleBack} accessibilityRole="button" accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)} style={{ alignSelf: 'flex-start', minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_TITLE)}
        </Text>
      </View>

      <View className="px-4 pt-3 pb-3" style={{ flexDirection: 'row', gap: 8 }}>
        {([
          { id: 'mine' as HubTab, icon: 'create-outline' as const, label: t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_TAB_MINE) },
          { id: 'templates' as HubTab, icon: 'map-outline' as const, label: t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_TAB_TEMPLATES) },
        ]).map((item) => {
          const selected = tab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => selectTab(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              activeOpacity={0.85}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? primaryColor : surfaceColor,
                borderWidth: 1,
                borderColor: selected ? primaryColor : borderColor,
              }}
            >
              <Ionicons name={item.icon} size={16} color={selected ? onPrimary : primaryColor} />
              <Text
                numberOfLines={1}
                style={{
                  marginLeft: 6,
                  flexShrink: 1,
                  fontSize: 13,
                  fontWeight: '700',
                  color: selected ? onPrimary : textColor,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'templates' ? (
        <View className="px-4 pb-3" style={{ zIndex: 2 }}>
          <View
            className="flex-row items-center rounded-xl px-3"
            style={{ backgroundColor: surfaceColor, borderWidth: 1, borderColor, minHeight: 44 }}
          >
            <Ionicons name="search" size={18} color={mutedColor} />
            <TextInput
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                if (selectedDivision && value.trim().toLowerCase() !== selectedDivision.name.toLowerCase()) {
                  setPickedDivisionId(undefined);
                }
                setLocationFocused(true);
              }}
              onFocus={() => setLocationFocused(true)}
              placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_SEARCH)}
              placeholderTextColor={mutedColor}
              style={{ flex: 1, marginLeft: 8, color: textColor, fontSize: 15, paddingVertical: 10 }}
              autoCorrect={false}
              returnKeyType="search"
            />
            {search ? (
              <TouchableOpacity onPress={clearDivision} accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={mutedColor} />
              </TouchableOpacity>
            ) : null}
          </View>
          {showSuggestions ? (
            <View
              style={{
                marginTop: 6,
                maxHeight: 240,
                borderRadius: 12,
                borderWidth: 1,
                borderColor,
                backgroundColor: surfaceColor,
                overflow: 'hidden',
              }}
            >
              {suggestions.length === 0 ? (
                <Text style={{ paddingHorizontal: 14, paddingVertical: 12, color: mutedColor, fontSize: 14 }}>
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_NO_DIVISIONS)}
                </Text>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 220 }}>
                  {suggestions.map((division) => (
                    <TouchableOpacity
                      key={division.id}
                      onPress={() => chooseDivision(division)}
                      style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}
                    >
                      <Text style={{ color: textColor, fontSize: 15, fontWeight: '600' }}>{division.name}</Text>
                      {division.state ? (
                        <Text style={{ marginTop: 2, color: mutedColor, fontSize: 12 }}>{division.state}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      {tab === 'templates' ? (
        <View style={{ height: 48, flexGrow: 0, flexShrink: 0 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 48 }}
          >
            {TOUR_TYPE_VALUES.map((type) => (
              <FilterChip
                key={type}
                label={t(TRANSLATION_KEYS.TOUR_SPOTS.TYPES[type])}
                selected={tourType === type}
                onPress={() => setTourType((current) => (current === type ? undefined : type))}
                primaryColor={primaryColor}
                onPrimary={onPrimary}
                textColor={textColor}
                surfaceColor={surfaceColor}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {needsSignIn ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="lock-closed-outline" size={48} color={mutedColor} />
          <Text className="mt-3 text-lg font-semibold text-text dark:text-text-dark text-center">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_SIGN_IN_TITLE)}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark text-center">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_SIGN_IN_BODY)}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={{ marginTop: 16, backgroundColor: primaryColor, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}
          >
            <Text style={{ color: onPrimary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.AUTH.LOGIN.SIGN_IN)}</Text>
          </TouchableOpacity>
        </View>
      ) : tab === 'mine' && isInitializing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : tab === 'templates' && !active.isLoading && !active.error && active.total > 0 ? (
        <Text className="px-4 pb-2 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_RESULTS, { count: active.total })}
        </Text>
      ) : null}

      {needsSignIn || (tab === 'mine' && isInitializing) ? null : active.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : active.error && active.items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text className="mt-3 text-center text-base text-text dark:text-text-dark">{active.error}</Text>
          <TouchableOpacity
            onPress={active.refresh}
            style={{ marginTop: 16, backgroundColor: primaryColor, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}
          >
            <Text style={{ color: onPrimary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}</Text>
          </TouchableOpacity>
        </View>
      ) : tab === 'mine' ? (
        <FlatList
          key="mine"
          style={{ flex: 1 }}
          data={plans.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
          ListHeaderComponent={
            <View>
              <TouchableOpacity
                onPress={startBlank}
                accessibilityRole="button"
                activeOpacity={0.85}
                style={{
                  marginTop: 4,
                  marginBottom: 22,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor,
                  backgroundColor: surfaceColor,
                  overflow: 'hidden',
                  ...theme.elevation.sm,
                }}
              >
                <View style={{ height: 4, backgroundColor: primaryColor }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: accentWash,
                    }}
                  >
                    <Ionicons name="add" size={26} color={primaryColor} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14, marginRight: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                      {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_START_BLANK)}
                    </Text>
                    <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 18, color: mutedColor }}>
                      {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_START_BLANK_DESC)}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={primaryColor} />
                </View>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_YOURS)}
                </Text>
                {!plans.error && plans.total > 0 ? (
                  <Text style={{ fontSize: 13, fontWeight: '600', color: mutedColor }}>
                    {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_RESULTS, { count: plans.total })}
                  </Text>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <Ionicons name="map-outline" size={48} color={mutedColor} />
              <Text className="mt-3 text-lg font-semibold text-text dark:text-text-dark text-center">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_EMPTY_MINE)}
              </Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark text-center">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_EMPTY_MINE_DESC)}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PersonalPlanRow
              trip={item}
              borderColor={borderColor}
              surfaceColor={surfaceColor}
              textColor={textColor}
              mutedColor={mutedColor}
              daysLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DAYS)}
              onPress={() => openPlan(item.id)}
              onDelete={() => confirmDelete(item.id, item.name)}
            />
          )}
          ListFooterComponent={
            <LoadMoreFooter
              error={plans.error}
              hasMore={plans.hasMore}
              isLoadingMore={plans.isLoadingMore}
              onLoadMore={plans.loadMore}
              primaryColor={primaryColor}
              loadMoreLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_LOAD_MORE)}
            />
          }
        />
      ) : (
        <FlatList
          key="templates"
          style={{ flex: 1 }}
          numColumns={2}
          columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
          data={templates.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <Ionicons name="map-outline" size={48} color={mutedColor} />
              <Text className="mt-3 text-lg font-semibold text-text dark:text-text-dark text-center">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_EMPTY_TEMPLATES)}
              </Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark text-center">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_EMPTY_TEMPLATES_DESC)}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <CatalogPlanCard
              tour={item}
              typeLabel={t(TRANSLATION_KEYS.TOUR_SPOTS.TYPES[item.tourType] || TRANSLATION_KEYS.TOUR_SPOTS.TYPES.MIXED)}
              daysLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DAYS)}
              onPress={() => openTemplate(item.id)}
            />
          )}
          ListFooterComponent={
            <LoadMoreFooter
              error={templates.error}
              hasMore={templates.hasMore}
              isLoadingMore={templates.isLoadingMore}
              onLoadMore={templates.loadMore}
              primaryColor={primaryColor}
              loadMoreLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.HUB_LOAD_MORE)}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function PersonalPlanRow({
  trip,
  borderColor,
  surfaceColor,
  textColor,
  mutedColor,
  daysLabel,
  onPress,
  onDelete,
}: {
  trip: TripPlan;
  borderColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  daysLabel: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: 12,
        overflow: 'hidden',
        borderRadius: 12,
        borderWidth: 1,
        borderColor,
        backgroundColor: surfaceColor,
      }}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }}>
        {trip.images?.[0]?.url ? (
          <Image source={{ uri: trip.images[0].url }} style={{ height: 112, width: '100%' }} />
        ) : null}
        <View style={{ padding: 14 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>{trip.name}</Text>
          {trip.shortDescription || trip.description ? (
            <Text style={{ marginTop: 4, fontSize: 13, color: mutedColor }} numberOfLines={2}>
              {trip.shortDescription || trip.description}
            </Text>
          ) : null}
          <Text style={{ marginTop: 8, fontSize: 12, color: mutedColor }}>
            {trip.primaryLocation?.name}
            {trip.duration ? ` · ${trip.duration} ${daysLabel}` : ''}
            {` · ${formatTaka(trip.estimatedBudget)}`}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        activeOpacity={0.7}
        style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderLeftWidth: 1, borderLeftColor: borderColor }}
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );
}

function CatalogPlanCard({
  tour,
  typeLabel,
  daysLabel,
  onPress,
}: {
  tour: TourPackage;
  typeLabel: string;
  daysLabel: string;
  onPress: () => void;
}) {
  const { isDark } = useTheme();
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const imageUrl = [...(tour.images ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url;
  const price = typeof tour.totalBudget === 'number' && tour.totalBudget > 0 ? formatBdt(tour.totalBudget) : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: surfaceColor, ...theme.elevation.sm }}
    >
      <View style={{ height: 112, backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="image-outline" size={28} color={mutedColor} />
          </View>
        )}
        <View style={{ position: 'absolute', top: 8, left: 8, maxWidth: '80%', backgroundColor: primaryColor, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }} numberOfLines={1}>{typeLabel}</Text>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, minHeight: 36 }} numberOfLines={2}>
          {tour.packageName}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: mutedColor }} numberOfLines={1}>
          {[tour.location?.name, tour.duration ? `${tour.duration} ${daysLabel}` : undefined].filter(Boolean).join(' · ')}
        </Text>
        {price ? (
          <Text style={{ marginTop: 6, fontSize: 13, fontWeight: '700', color: textColor }} numberOfLines={1}>
            {price}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function LoadMoreFooter({
  error,
  hasMore,
  isLoadingMore,
  onLoadMore,
  primaryColor,
  loadMoreLabel,
}: {
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  primaryColor: string;
  loadMoreLabel: string;
}) {
  return (
    <View style={{ paddingVertical: 8 }}>
      {error ? (
        <Text style={{ marginBottom: 8, textAlign: 'center', fontSize: 13, color: theme.colors.error }}>{error}</Text>
      ) : null}
      {hasMore ? (
        <TouchableOpacity
          onPress={onLoadMore}
          disabled={isLoadingMore}
          style={{ alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10 }}
        >
          {isLoadingMore ? (
            <ActivityIndicator color={primaryColor} />
          ) : (
            <Text style={{ color: primaryColor, fontWeight: '700' }}>{loadMoreLabel}</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
  primaryColor,
  onPrimary,
  textColor,
  surfaceColor,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  primaryColor: string;
  onPrimary: string;
  textColor: string;
  surfaceColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        alignSelf: 'flex-start',
        flexGrow: 0,
        flexShrink: 0,
        marginRight: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: selected ? primaryColor : surfaceColor,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? onPrimary : textColor }}>{label}</Text>
    </TouchableOpacity>
  );
}
