import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { TourPackage } from '../../types/tours';
import { formatBdt } from '../../utils/money';
import PhotoCard from './PhotoCard';

interface TourPackageCardProps {
  tourPackage: TourPackage;
  layout?: 'cover' | 'row';
  onPress?: () => void;
}

export default function TourPackageCard({ tourPackage, layout = 'cover', onPress }: TourPackageCardProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const imageUrl = [...(tourPackage.images ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url;
  const showPrice = typeof tourPackage.totalBudget === 'number' && tourPackage.totalBudget > 0;
  const price = showPrice ? formatBdt(tourPackage.totalBudget) : undefined;
  const duration = tourPackage.duration > 0
    ? t(TRANSLATION_KEYS.HOME.DURATION_DAYS, { count: tourPackage.duration })
    : undefined;
  const open = onPress ?? (() => undefined);

  if (layout === 'row') {
    const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
    const meta = [tourPackage.location?.name, duration].filter(Boolean).join(' · ');

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={open}
        style={{
          flexDirection: 'row',
          backgroundColor: surface,
          borderRadius: 16,
          overflow: 'hidden',
          marginTop: 10,
          ...theme.elevation.sm,
        }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: 108, height: 96 }} resizeMode="cover" />
        ) : (
          <View style={{ width: 108, height: 96, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1c2430' }}>
            <Feather name="image" size={22} color="rgba(255,255,255,0.7)" />
          </View>
        )}
        <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' }}>
          <Text style={{ color: text, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
            {tourPackage.packageName}
          </Text>
          {meta ? (
            <Text style={{ color: muted, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
          {price ? (
            <Text style={{ color: text, fontSize: 13, fontWeight: '700', marginTop: 6 }} numberOfLines={1}>
              {price}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <PhotoCard
      imageUrl={imageUrl}
      width="100%"
      height={200}
      title={tourPackage.packageName}
      detail={price}
      badge={duration}
      rating={tourPackage.rating}
      onPress={open}
    />
  );
}
