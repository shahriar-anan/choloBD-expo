/**
 * Tour Spot List Card Component
 * Card for displaying tour spots in list view
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { TourSpot } from '../../hooks/useFetchTourSpots';

interface TourSpotListCardProps {
  spot: TourSpot;
  onPress?: () => void;
  compact?: boolean;
}

export function TourSpotListCard({ spot, onPress, compact = false }: TourSpotListCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const warningColor = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  // Map tour type to display label
  const tourTypeLabel = t(TRANSLATION_KEYS.TOUR_SPOTS.TYPES[spot.tourType as keyof typeof TRANSLATION_KEYS.TOUR_SPOTS.TYPES] || TRANSLATION_KEYS.TOUR_SPOTS.TYPES.MIXED);
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
          <View style={{ position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ backgroundColor: primaryColor, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, maxWidth: '70%' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }} numberOfLines={1}>{tourTypeLabel}</Text>
            </View>
            {spot.isPopular ? <Ionicons name="star" size={14} color={warningColor} /> : null}
          </View>
        </View>
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, minHeight: 36 }} numberOfLines={2}>
            {spot.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Ionicons name="location" size={12} color={primaryColor} />
            <Text style={{ marginLeft: 4, fontSize: 12, color: mutedColor, flex: 1 }} numberOfLines={1}>
              {spot.locationName}
            </Text>
            {showRating ? (
              <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: '700', color: textColor }}>
                {spot.rating?.toFixed(1)}
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
      style={{
        backgroundColor: surfaceColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Image Section */}
      <View style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
        {spot.imageUrl ? (
          <Image
            source={{ uri: spot.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
            <Ionicons name="image-outline" size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
          </View>
        )}

        {/* Badges Overlay */}
        <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Tour Type Badge */}
          <View style={{ backgroundColor: primaryColor, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
              {tourTypeLabel}
            </Text>
          </View>

          {/* Popular Badge */}
          {spot.isPopular && (
            <View style={{ backgroundColor: warningColor, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
                ⭐ Popular
              </Text>
            </View>
          )}
        </View>

        {/* Rating Badge */}
        {spot.rating !== undefined && (
          <View style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.95)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={14} color={warningColor} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
              {spot.rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View className="p-4">
        {/* Title */}
        <Text
          style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 8 }}
          numberOfLines={2}
        >
          {spot.name}
        </Text>

        {/* Location */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Ionicons name="location" size={16} color={primaryColor} />
          <Text style={{ fontSize: 14, color: mutedColor, flex: 1 }} numberOfLines={1}>
            {spot.locationName}
          </Text>
        </View>

        {/* Description */}
        {spot.description && (
          <Text
            style={{ fontSize: 13, color: mutedColor, lineHeight: 18 }}
            numberOfLines={2}
          >
            {spot.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
