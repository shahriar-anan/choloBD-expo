/**
 * Attractions hub: Places, Things to do, and Guides.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useFetchLocations } from '../../../hooks/useFetchLocations';
import { useActivityCatalog, usePlaceCatalog } from '../../../hooks/useAttractionsCatalog';
import { useGuides } from '../../../hooks/useGuides';
import { TourSpotListCard } from '../../../components/tourSpots';
import { ActivitySpotListCard } from '../../../components/activitySpots/ActivitySpotListCard';
import { GuideListCard } from '../../../components/guides/GuideListCard';
import type { TourSpot } from '../../../hooks/useFetchTourSpots';
import type { ActivitySpot } from '../../../services/api/activitySpots';
import type { GuideSummary } from '../../../types/guides';
import type { Location } from '../../../types/locations';
import { goBack } from '../../../utilities/navigation';

type AttractionsTab = 'places' | 'activities' | 'guides';

const ACTIVITY_TYPES = [
  'SIGHTSEEING',
  'ADVENTURE_SPORTS',
  'WATER_ACTIVITIES',
  'CULTURAL_EXPERIENCE',
  'FOOD_TASTING',
  'SHOPPING',
  'WILDLIFE',
] as const;

const GUIDE_LANGUAGES = ['ENGLISH', 'BENGALI', 'HINDI', 'ARABIC', 'MANDARIN_CHINESE'] as const;

function readTab(value: string | string[] | undefined): AttractionsTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'activities' || raw === 'guides') return raw;
  return 'places';
}

function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw || undefined;
}

export default function AttractionsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; locationId?: string; fromHome?: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { locations } = useFetchLocations();

  const [tab, setTab] = useState<AttractionsTab>(readTab(params.tab));
  const [search, setSearch] = useState('');
  const [locationFocused, setLocationFocused] = useState(false);
  const [pickedLocationId, setPickedLocationId] = useState<string | undefined>(readParam(params.locationId));
  const [activityType, setActivityType] = useState<string | undefined>();
  const [language, setLanguage] = useState<string | undefined>();
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const routeLocationId = readParam(params.locationId);
  const routeTab = readTab(params.tab);
  const districts = useMemo(
    () => locations.filter((location) => location.locationType === 'DISTRICT'),
    [locations],
  );

  useEffect(() => {
    setTab(routeTab);
    setActivityType(undefined);
    setLanguage(undefined);
    setVerifiedOnly(false);
  }, [routeTab]);

  useEffect(() => {
    if (!routeLocationId) return;
    const district = districts.find((location) => location.id === routeLocationId);
    if (!district) return;
    setPickedLocationId(district.id);
    setSearch(district.name);
  }, [routeLocationId, districts]);

  const selectedDistrict = districts.find((location) => location.id === pickedLocationId);
  const query = search.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!query) return districts;
    return districts.filter((location) => location.name.toLowerCase().includes(query));
  }, [districts, query]);
  const showSuggestions = locationFocused && search.trim().toLowerCase() !== (selectedDistrict?.name.toLowerCase() ?? '\0');

  const sharedFilters = pickedLocationId ? { locationId: pickedLocationId } : {};

  const places = usePlaceCatalog(sharedFilters, tab === 'places');
  const activities = useActivityCatalog(
    { ...sharedFilters, ...(activityType ? { activityType } : {}) },
    tab === 'activities',
  );
  const guides = useGuides(
    {
      ...sharedFilters,
      ...(language ? { language } : {}),
      ...(verifiedOnly ? { isVerified: true } : {}),
    },
    tab === 'guides',
  );

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const onPrimary = isDark ? theme.colors['onPrimary-dark'] : theme.colors.onPrimary;

  const catalog = tab === 'places' ? places : tab === 'activities' ? activities : guides;

  const handleBack = () => {
    if (params.fromHome === 'true') {
      router.replace('/(tabs)');
      return;
    }
    goBack(router);
  };

  const selectTab = (next: AttractionsTab) => {
    setTab(next);
    setActivityType(undefined);
    setLanguage(undefined);
    setVerifiedOnly(false);
  };

  const openPlace = (spot: TourSpot) => {
    router.push({ pathname: '/(tabs)/explore/tour-spots-detail', params: { id: spot.id } });
  };

  const openActivity = (spot: ActivitySpot) => {
    router.push({ pathname: '/(tabs)/explore/activity-preview', params: { id: spot.id } });
  };

  const openGuide = (guide: GuideSummary) => {
    router.push({ pathname: '/(tabs)/explore/guide-detail', params: { id: guide.id } });
  };

  const chooseDistrict = (district: Location) => {
    setPickedLocationId(district.id);
    setSearch(district.name);
    setLocationFocused(false);
  };

  const clearDistrict = () => {
    setPickedLocationId(undefined);
    setSearch('');
    setLocationFocused(true);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={handleBack} accessibilityRole="button" style={{ marginRight: 8, minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.ATTRACTIONS.TITLE)}
        </Text>
      </View>

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
              if (selectedDistrict && value.trim().toLowerCase() !== selectedDistrict.name.toLowerCase()) {
                setPickedLocationId(undefined);
              }
              setLocationFocused(true);
            }}
            onFocus={() => setLocationFocused(true)}
            placeholder={t(TRANSLATION_KEYS.ATTRACTIONS.SEARCH)}
            placeholderTextColor={mutedColor}
            style={{ flex: 1, marginLeft: 8, color: textColor, fontSize: 15, paddingVertical: 10 }}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={clearDistrict} accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
                {t(TRANSLATION_KEYS.ATTRACTIONS.NO_DISTRICTS)}
              </Text>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 220 }}>
                {suggestions.map((district) => (
                  <TouchableOpacity
                    key={district.id}
                    onPress={() => chooseDistrict(district)}
                    style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}
                  >
                    <Text style={{ color: textColor, fontSize: 15, fontWeight: '600' }}>{district.name}</Text>
                    {district.state ? (
                      <Text style={{ marginTop: 2, color: mutedColor, fontSize: 12 }}>{district.state}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}
      </View>

      <View className="px-4 pb-3 flex-row" style={{ gap: 8 }}>
        {(['places', 'activities', 'guides'] as AttractionsTab[]).map((value) => {
          const label = value === 'places'
            ? t(TRANSLATION_KEYS.ATTRACTIONS.TABS.PLACES)
            : value === 'activities'
              ? t(TRANSLATION_KEYS.ATTRACTIONS.TABS.ACTIVITIES)
              : t(TRANSLATION_KEYS.ATTRACTIONS.TABS.GUIDES);
          const selected = tab === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => selectTab(value)}
              style={{
                flex: 1,
                minHeight: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
                backgroundColor: selected ? primaryColor : surfaceColor,
                borderWidth: 1,
                borderColor: selected ? primaryColor : borderColor,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: selected ? onPrimary : textColor, textAlign: 'center' }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'activities' ? (
        <View style={{ height: 48, flexGrow: 0, flexShrink: 0 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 48 }}
          >
          {ACTIVITY_TYPES.map((type) => (
            <FilterChip
              key={type}
              label={t(TRANSLATION_KEYS.ATTRACTIONS.ACTIVITY_TYPES[type])}
              selected={activityType === type}
              onPress={() => setActivityType((current) => (current === type ? undefined : type))}
              primaryColor={primaryColor}
              onPrimary={onPrimary}
              textColor={textColor}
              surfaceColor={surfaceColor}
            />
          ))}
          </ScrollView>
        </View>
      ) : null}

      {tab === 'guides' ? (
        <View style={{ height: 48, flexGrow: 0, flexShrink: 0 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 48 }}
          >
          <FilterChip
            label={t(TRANSLATION_KEYS.ATTRACTIONS.VERIFIED_ONLY)}
            selected={verifiedOnly}
            onPress={() => setVerifiedOnly((current) => !current)}
            primaryColor={primaryColor}
            onPrimary={onPrimary}
            textColor={textColor}
            surfaceColor={surfaceColor}
          />
          {GUIDE_LANGUAGES.map((code) => (
            <FilterChip
              key={code}
              label={t(TRANSLATION_KEYS.ATTRACTIONS.LANGUAGES[code])}
              selected={language === code}
              onPress={() => setLanguage((current) => (current === code ? undefined : code))}
              primaryColor={primaryColor}
              onPrimary={onPrimary}
              textColor={textColor}
              surfaceColor={surfaceColor}
            />
          ))}
          </ScrollView>
        </View>
      ) : null}

      {!catalog.isLoading && !catalog.error && catalog.total > 0 ? (
        <Text className="px-4 pb-2 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.ATTRACTIONS.RESULTS_COUNT, { count: catalog.total })}
        </Text>
      ) : null}

      {catalog.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : catalog.error && catalog.items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text className="mt-3 text-center text-base text-text dark:text-text-dark">{catalog.error}</Text>
          <TouchableOpacity
            onPress={catalog.refresh}
            style={{ marginTop: 16, backgroundColor: primaryColor, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}
          >
            <Text style={{ color: onPrimary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          numColumns={2}
          columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
          data={catalog.items as Array<TourSpot | ActivitySpot | GuideSummary>}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <Ionicons name="map-outline" size={48} color={mutedColor} />
              <Text className="mt-3 text-lg font-semibold text-text dark:text-text-dark text-center">
                {t(TRANSLATION_KEYS.ATTRACTIONS.EMPTY)}
              </Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark text-center">
                {t(TRANSLATION_KEYS.ATTRACTIONS.EMPTY_DESC)}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (tab === 'places') {
              const spot = item as TourSpot;
              return <TourSpotListCard compact spot={spot} onPress={() => openPlace(spot)} />;
            }
            if (tab === 'activities') {
              const spot = item as unknown as ActivitySpot;
              return <ActivitySpotListCard compact spot={spot} onPress={() => openActivity(spot)} />;
            }
            const guide = item as unknown as GuideSummary;
            return <GuideListCard compact guide={guide} onPress={() => openGuide(guide)} />;
          }}
          ListFooterComponent={
            <View className="py-2">
              {catalog.error ? (
                <Text className="mb-2 text-center text-sm" style={{ color: theme.colors.error }}>{catalog.error}</Text>
              ) : null}
              {catalog.hasMore ? (
                <TouchableOpacity
                  onPress={catalog.loadMore}
                  disabled={catalog.isLoadingMore}
                  style={{ alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10 }}
                >
                  {catalog.isLoadingMore ? (
                    <ActivityIndicator color={primaryColor} />
                  ) : (
                    <Text style={{ color: primaryColor, fontWeight: '700' }}>{t(TRANSLATION_KEYS.ATTRACTIONS.LOAD_MORE)}</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
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
