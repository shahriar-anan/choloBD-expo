import React from 'react';
import { View, Text, Image, TouchableOpacity, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import theme from '../../constants/theme';

interface PhotoCardProps {
  imageUrl?: string;
  width: DimensionValue;
  height: number;
  title: string;
  detail?: string;
  badge?: string;
  rating?: number;
  onPress: () => void;
}

export default function PhotoCard({
  imageUrl,
  width,
  height,
  title,
  detail,
  badge,
  rating,
  onPress,
}: PhotoCardProps) {
  const showRating = typeof rating === 'number' && rating > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ width, height, borderRadius: 18, ...theme.elevation.sm }}
    >
      <View style={{ flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#1c2430' }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="image" size={28} color="rgba(255,255,255,0.7)" />
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.78)']}
          locations={[0.35, 0.62, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        {badge ? (
          <View style={pillStyle('left')}>
            <Text style={pillText}>{badge}</Text>
          </View>
        ) : null}
        {showRating ? (
          <View style={pillStyle('right')}>
            <Feather name="star" size={11} color="#FBBF24" />
            <Text style={[pillText, { marginLeft: 4 }]}>{Number(rating).toFixed(1)}</Text>
          </View>
        ) : null}
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
            {title}
          </Text>
          {detail ? (
            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const pillText = { color: '#fff', fontSize: 12, fontWeight: '700' as const };

function pillStyle(side: 'left' | 'right'): ViewStyle {
  return {
    position: 'absolute',
    top: 10,
    left: side === 'left' ? 10 : undefined,
    right: side === 'right' ? 10 : undefined,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  };
}
