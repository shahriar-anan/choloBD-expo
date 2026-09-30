import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { usePopularActivities, usePopularHotels } from '../../hooks/useHomeFeed';
import { TourPackage } from '../../types/tours';
import { formatBdt } from '../../utils/money';
import { HomeFeedStatus, HomeSectionHeader } from './HomeSectionHeader';
import PhotoCard from './PhotoCard';

type DealChip = 'stays' | 'holidays' | 'activities';

interface DealTile {
  id: string;
  imageUrl?: string;
  title: string;
  detail?: string;
  rating?: number;
  onPress: () => void;
}

function DealGrid({ tiles }: { tiles: DealTile[] }) {
  const rows: DealTile[][] = [];
  for (let index = 0; index < tiles.length; index += 2) {
    rows.push(tiles.slice(index, index + 2));
  }

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View key={row.map((tile) => tile.id).join('-')} style={{ flexDirection: 'row', gap: 10, marginTop: rowIndex === 0 ? 0 : 10 }}>
          {row.map((tile) => (
            <View key={tile.id} style={{ flex: 1 }}>
              <PhotoCard
                imageUrl={tile.imageUrl}
                width="100%"
                height={168}
                title={tile.title}
                detail={tile.detail}
                rating={tile.rating}
                onPress={tile.onPress}
              />
            </View>
          ))}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}

interface HomeDealsSectionProps {
  packages: TourPackage[];
  packagesLoading: boolean;
  packagesError: string | null;
  onRetryPackages: () => void;
}

export default function HomeDealsSection({
  packages,
  packagesLoading,
  packagesError,
  onRetryPackages,
}: HomeDealsSectionProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const stays = usePopularHotels();
  const activities = usePopularActivities();
  const [chip, setChip] = useState<DealChip>('stays');

  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const onPrimary = theme.colors.onPrimary;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;

  const holidayCards = packages.slice(0, 4);
  const hasAny =
    stays.hotels.length > 0 ||
    holidayCards.length > 0 ||
    activities.activities.length > 0;
  const anyLoading = stays.isLoading || packagesLoading || activities.isLoading;
  const anyError = Boolean(stays.error || packagesError || activities.error);

  if (!anyLoading && !anyError && !hasAny) return null;

  const seeAll = () => {
    if (chip === 'stays') router.push('/(tabs)/explore/hotel-search?fromHome=true');
    if (chip === 'holidays') router.push('/(tabs)/explore/tour-list');
  };

  const showSeeAll =
    (chip === 'stays' && stays.hotels.length > 0) ||
    (chip === 'holidays' && holidayCards.length > 0);

  const activeLoading = chip === 'stays' ? stays.isLoading : chip === 'holidays' ? packagesLoading : activities.isLoading;
  const activeError = chip === 'stays' ? stays.error : chip === 'holidays' ? packagesError : activities.error;
  const activeRetry = chip === 'stays' ? stays.refetch : chip === 'holidays' ? onRetryPackages : activities.refetch;

  const chips: DealChip[] = ['stays', 'holidays', 'activities'];
  const chipLabel: Record<DealChip, string> = {
    stays: t(TRANSLATION_KEYS.HOME.DEALS.STAYS),
    holidays: t(TRANSLATION_KEYS.HOME.DEALS.HOLIDAYS),
    activities: t(TRANSLATION_KEYS.HOME.DEALS.ACTIVITIES),
  };

  return (
    <View style={{ paddingTop: 22, paddingBottom: 4 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <HomeSectionHeader
          title={t(TRANSLATION_KEYS.HOME.HOT_DEALS)}
          onSeeAll={showSeeAll ? seeAll : undefined}
        />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {chips.map((item) => {
            const selected = item === chip;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setChip(item)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: selected ? primary : surface,
                  borderWidth: selected ? 0 : 1,
                  borderColor: border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? onPrimary : text }}>
                  {chipLabel[item]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <HomeFeedStatus isLoading={activeLoading} error={activeError} onRetry={activeRetry} />
        {!activeLoading && !activeError && chip === 'stays' ? (
          <DealGrid
            tiles={stays.hotels.slice(0, 4).map((hotel) => ({
              id: hotel.id,
              imageUrl: hotel.imageUrl,
              title: hotel.name,
              detail: hotel.startingPrice ? formatBdt(hotel.startingPrice) : undefined,
              rating: hotel.rating,
              onPress: () => router.push({ pathname: '/(tabs)/explore/hotel-stay', params: { hotelId: hotel.id } }),
            }))}
          />
        ) : null}
        {!activeLoading && !activeError && chip === 'holidays' ? (
          <DealGrid
            tiles={holidayCards.map((pkg) => ({
              id: pkg.id,
              imageUrl: [...(pkg.images ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url,
              title: pkg.packageName,
              detail: pkg.totalBudget > 0 ? formatBdt(pkg.totalBudget) : undefined,
              rating: pkg.rating,
              onPress: () => router.push({ pathname: '/tour-package-detail', params: { id: pkg.id } }),
            }))}
          />
        ) : null}
        {!activeLoading && !activeError && chip === 'activities' ? (
          <DealGrid
            tiles={activities.activities.slice(0, 4).map((spot) => ({
              id: spot.id,
              imageUrl: spot.imageUrl,
              title: spot.name,
              detail: spot.entryCost ? formatBdt(spot.entryCost) : undefined,
              rating: spot.rating,
              onPress: () => router.push({ pathname: '/(tabs)/explore/activity-preview', params: { id: spot.id } }),
            }))}
          />
        ) : null}
      </View>
    </View>
  );
}
