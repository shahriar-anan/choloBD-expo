import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { formatBdt } from '../../utils/money';
import type { ActivitySpot } from '../../services/api/activitySpots';

interface ActivitySpotListCardProps {
  spot: ActivitySpot;
  onPress?: () => void;
  compact?: boolean;
}

export function ActivitySpotListCard({ spot, onPress, compact = false }: ActivitySpotListCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const warningColor = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const typeKey = spot.activityType
    ? TRANSLATION_KEYS.ATTRACTIONS.ACTIVITY_TYPES[spot.activityType as keyof typeof TRANSLATION_KEYS.ATTRACTIONS.ACTIVITY_TYPES]
    : undefined;
  const priceLabel = spot.entryCost === 0
    ? t(TRANSLATION_KEYS.ATTRACTIONS.FREE)
    : typeof spot.entryCost === 'number'
      ? formatBdt(spot.entryCost)
      : null;
  const showRating = typeof spot.rating === 'number' && spot.rating > 0;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="overflow-hidden rounded-2xl"
        style={{ flex: 1, backgroundColor: surfaceColor, ...theme.elevation.sm }}
      >
        <View style={{ height: 112, backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
          {spot.imageUrl ? (
            <Image source={{ uri: spot.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={28} color={mutedColor} />
            </View>
          )}
          {typeKey ? (
            <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: primaryColor, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, maxWidth: '80%' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }} numberOfLines={1}>{t(typeKey)}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, minHeight: 36 }} numberOfLines={2}>
            {spot.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 12, color: mutedColor, flex: 1 }} numberOfLines={1}>
              {spot.locationName || spot.duration || ''}
            </Text>
            {showRating ? (
              <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: '700', color: textColor }}>{spot.rating?.toFixed(1)}</Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 12, color: mutedColor, flex: 1 }} numberOfLines={1}>
              {spot.locationName && spot.duration ? spot.duration : ''}
            </Text>
            {priceLabel ? (
              <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '700', color: primaryColor }} numberOfLines={1}>
                {priceLabel}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-4 overflow-hidden rounded-2xl"
      style={{ backgroundColor: surfaceColor, ...theme.elevation.md }}
    >
      <View style={{ height: 168, backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
        {spot.imageUrl ? (
          <Image source={{ uri: spot.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="image-outline" size={40} color={mutedColor} />
          </View>
        )}
      </View>
      <View className="p-4">
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }} numberOfLines={2}>
          {spot.name}
        </Text>
        {spot.locationName ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Ionicons name="location" size={16} color={primaryColor} />
            <Text style={{ marginLeft: 6, fontSize: 14, color: mutedColor, flex: 1 }} numberOfLines={1}>
              {spot.locationName}
            </Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
          {typeKey ? (
            <Text style={{ fontSize: 12, fontWeight: '600', color: primaryColor }}>{t(typeKey)}</Text>
          ) : null}
          {spot.duration ? (
            <Text style={{ fontSize: 13, color: mutedColor }}>{spot.duration}</Text>
          ) : null}
          {typeof spot.rating === 'number' && spot.rating > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
              <Ionicons name="star" size={14} color={warningColor} />
              <Text style={{ marginLeft: 4, fontSize: 13, fontWeight: '700', color: textColor }}>
                {spot.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
        {priceLabel ? (
          <Text style={{ marginTop: 8, fontSize: 16, fontWeight: '700', color: primaryColor }}>{priceLabel}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
