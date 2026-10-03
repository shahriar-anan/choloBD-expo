/**
 * Tour Spot Detail View Component
 * Displays complete tour spot information
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TourSpotImage {
  id: string;
  url: string;
  altText?: string;
  order: number;
}

interface TourSpotReview {
  id: string;
  title?: string;
  description?: string;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    userName: string;
    imageUrl?: string;
  };
}

interface TourSpotLocation {
  id: string;
  name: string;
  locationType?: string;
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface TourSpotDetail {
  id: string;
  name: string;
  description?: string;
  tourType: string;
  rating?: number;
  isPopular: boolean;
  isActive: boolean;
  bestTimeToVisit?: string;
  seasonalInfo?: any;
  createdAt: string;
  location: TourSpotLocation;
  images: TourSpotImage[];
  reviews: TourSpotReview[];
  nearbyHotelsCount?: number;
  nearbyActivitySpotsCount?: number;
  nearbyGuidesCount?: number;
}

interface TourSpotDetailViewProps {
  spot: TourSpotDetail;
}

export function TourSpotDetailView({ spot }: TourSpotDetailViewProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const warningColor = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;

  const tourTypeLabel = t(
    TRANSLATION_KEYS.TOUR_SPOTS.TYPES[spot.tourType as keyof typeof TRANSLATION_KEYS.TOUR_SPOTS.TYPES] || 
    TRANSLATION_KEYS.TOUR_SPOTS.TYPES.MIXED
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Image Gallery */}
      {spot.images && spot.images.length > 0 ? (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {spot.images.map((image) => (
              <Image
                key={image.id}
                source={{ uri: image.url }}
                style={{ width: SCREEN_WIDTH, height: 300 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          {spot.images.length > 1 && (
            <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              {spot.images.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: index === activeImageIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={{ width: SCREEN_WIDTH, height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
          <Ionicons name="image-outline" size={64} color={mutedColor} />
        </View>
      )}

      <View style={{ padding: 16 }}>
        {/* Title & Type */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, flex: 1, marginRight: 12 }}>
            {spot.name}
          </Text>
          <View style={{ backgroundColor: primaryColor, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
              {tourTypeLabel}
            </Text>
          </View>
        </View>

        {/* Rating & Popular */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {spot.rating !== undefined && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={18} color={warningColor} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                {spot.rating.toFixed(1)}
              </Text>
            </View>
          )}
          {spot.isPopular && (
            <View style={{ backgroundColor: warningColor, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>
                ⭐ POPULAR
              </Text>
            </View>
          )}
        </View>

        {/* Location */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: borderColor }}>
          <Ionicons name="location" size={20} color={primaryColor} />
          <Text style={{ fontSize: 15, color: mutedColor }}>
            {spot.location.name}
            {spot.location.country && `, ${spot.location.country}`}
          </Text>
        </View>

        {/* About Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 12 }}>
            {t(TRANSLATION_KEYS.TOUR_SPOTS.DETAILS.ABOUT)}
          </Text>
          <Text style={{ fontSize: 15, color: textColor, lineHeight: 22 }}>
            {spot.description || t(TRANSLATION_KEYS.TOUR_SPOTS.DETAILS.NO_DESCRIPTION)}
          </Text>
        </View>

        {(spot.nearbyHotelsCount ?? 0) > 0 ? (
          <Text style={{ fontSize: 14, color: mutedColor, marginBottom: 12 }}>
            {t(TRANSLATION_KEYS.ATTRACTIONS.NEARBY_HOTELS, { count: spot.nearbyHotelsCount })}
          </Text>
        ) : null}
        {(spot.nearbyActivitySpotsCount ?? 0) > 0 && spot.location?.id ? (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(tabs)/explore/attractions',
              params: { tab: 'activities', locationId: spot.location.id },
            })}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: borderColor }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>
              {t(TRANSLATION_KEYS.ATTRACTIONS.NEARBY_ACTIVITIES, { count: spot.nearbyActivitySpotsCount })}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={mutedColor} />
          </TouchableOpacity>
        ) : null}
        {(spot.nearbyGuidesCount ?? 0) > 0 && spot.location?.id ? (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(tabs)/explore/attractions',
              params: { tab: 'guides', locationId: spot.location.id },
            })}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, marginBottom: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>
              {t(TRANSLATION_KEYS.ATTRACTIONS.NEARBY_GUIDES, { count: spot.nearbyGuidesCount })}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={mutedColor} />
          </TouchableOpacity>
        ) : null}

        {/* Best Time to Visit */}
        {spot.bestTimeToVisit && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 12 }}>
              {t(TRANSLATION_KEYS.TOUR_SPOTS.DETAILS.BEST_TIME)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: surfaceColor, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: borderColor }}>
              <Ionicons name="calendar" size={20} color={primaryColor} />
              <Text style={{ fontSize: 15, color: textColor }}>
                {spot.bestTimeToVisit}
              </Text>
            </View>
          </View>
        )}

        {/* Location Info */}
        {(spot.location.latitude || spot.location.longitude) && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 12 }}>
              {t(TRANSLATION_KEYS.TOUR_SPOTS.DETAILS.LOCATION_INFO)}
            </Text>
            <View style={{ backgroundColor: surfaceColor, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: borderColor }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="navigate" size={18} color={primaryColor} />
                <Text style={{ fontSize: 14, color: mutedColor }}>
                  {t(TRANSLATION_KEYS.TOUR_SPOTS.DETAILS.COORDINATES)}:
                </Text>
                <Text style={{ fontSize: 14, color: textColor, fontFamily: 'monospace' }}>
                  {spot.location.latitude?.toFixed(4)}, {spot.location.longitude?.toFixed(4)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Reviews Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 12 }}>
            {t(TRANSLATION_KEYS.TOUR_SPOTS.DETAILS.REVIEWS)}
            {spot.reviews.length > 0 && (
              <Text style={{ fontSize: 14, fontWeight: '400', color: mutedColor }}>
                {' '}({spot.reviews.length})
              </Text>
            )}
          </Text>
          
          {spot.reviews.length > 0 ? (
            spot.reviews.map((review) => (
              <View
                key={review.id}
                style={{
                  backgroundColor: surfaceColor,
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: borderColor,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>
                    {review.user.userName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={14} color={warningColor} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                      {review.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>
                {review.title && (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginBottom: 4 }}>
                    {review.title}
                  </Text>
                )}
                {review.description && (
                  <Text style={{ fontSize: 14, color: mutedColor, lineHeight: 20, marginBottom: 8 }}>
                    {review.description}
                  </Text>
                )}
                <Text style={{ fontSize: 12, color: mutedColor }}>
                  {formatDate(review.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Ionicons name="chatbubble-outline" size={32} color={mutedColor} />
              <Text style={{ fontSize: 14, color: mutedColor, marginTop: 8 }}>
                {t(TRANSLATION_KEYS.TOUR_SPOTS.DETAILS.NO_REVIEWS)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
