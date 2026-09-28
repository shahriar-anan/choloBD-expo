import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

// Sajek Valley / Bandarban-style green hill landscape
const BANNER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&h=400&fit=crop';

interface ExploreBDBannerProps {
  href?: string;
  imageUri?: string;
  label?: string;
  title?: string;
  subtitle?: string;
}

export default function ExploreBDBanner({
  href = '/(tabs)/explore',
  imageUri = BANNER_IMAGE,
  label,
  title,
  subtitle,
}: ExploreBDBannerProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const handlePress = () => {
    router.push(href);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      className="mx-4 mt-5 mb-3"
      style={{ borderRadius: 20, overflow: 'hidden', height: 165, ...theme.elevation.md }}
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageUri }}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        resizeMode="cover"
      />

      {/* Gradient — dark on left/bottom, transparent on right */}
      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0.08)']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Content */}
      <View className="absolute inset-0 flex-row items-center justify-between px-5">
        {/* Left text */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: 'rgba(255,255,255,0.72)',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {label || t(TRANSLATION_KEYS.HOME.EXPLORE_BANNER.LABEL)}
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: '#fff',
              lineHeight: 30,
              marginBottom: 8,
            }}
          >
            {title || t(TRANSLATION_KEYS.HOME.EXPLORE_BANNER.TITLE)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.80)',
              fontWeight: '400',
              letterSpacing: 0.5,
            }}
          >
            {subtitle || t(TRANSLATION_KEYS.HOME.EXPLORE_BANNER.SUBTITLE)}
          </Text>
        </View>

        {/* Right CTA circle */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.22)',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 16,
          }}
        >
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
