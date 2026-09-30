import React, { useRef, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { HOME_PROMOS, HomePromoId } from '../../constants/homePromos';

const COPY: Record<HomePromoId, { title: string; body: string; cta: string }> = {
  wallet: {
    title: TRANSLATION_KEYS.HOME.PROMOS.WALLET_TITLE,
    body: TRANSLATION_KEYS.HOME.PROMOS.WALLET_BODY,
    cta: TRANSLATION_KEYS.HOME.PROMOS.WALLET_CTA,
  },
  stays: {
    title: TRANSLATION_KEYS.HOME.PROMOS.STAYS_TITLE,
    body: TRANSLATION_KEYS.HOME.PROMOS.STAYS_BODY,
    cta: TRANSLATION_KEYS.HOME.PROMOS.STAYS_CTA,
  },
  qr: {
    title: TRANSLATION_KEYS.HOME.PROMOS.QR_TITLE,
    body: TRANSLATION_KEYS.HOME.PROMOS.QR_BODY,
    cta: TRANSLATION_KEYS.HOME.PROMOS.QR_CTA,
  },
  community: {
    title: TRANSLATION_KEYS.HOME.PROMOS.COMMUNITY_TITLE,
    body: TRANSLATION_KEYS.HOME.PROMOS.COMMUNITY_BODY,
    cta: TRANSLATION_KEYS.HOME.PROMOS.COMMUNITY_CTA,
  },
};

export default function HomePromoCarousel() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 64, 340);
  const gap = 12;
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + gap));
    if (next !== index && next >= 0 && next < HOME_PROMOS.length) {
      setIndex(next);
    }
  };

  return (
    <View style={{ marginTop: 16 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + gap}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {HOME_PROMOS.map((promo, promoIndex) => {
          const copy = COPY[promo.id];
          const isLast = promoIndex === HOME_PROMOS.length - 1;
          return (
            <TouchableOpacity
              key={promo.id}
              activeOpacity={0.92}
              onPress={() => router.push(promo.route)}
              style={{
                width: cardWidth,
                height: 168,
                marginRight: isLast ? 0 : gap,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: '#102033',
                ...theme.elevation.md,
              }}
            >
              <Image source={{ uri: promo.imageUri }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.72)']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }} numberOfLines={2}>
                  {t(copy.title)}
                </Text>
                <Text style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.9)' }} numberOfLines={2}>
                  {t(copy.body)}
                </Text>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 12,
                    backgroundColor: '#fff',
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: primary }}>
                    {t(copy.cta)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 }}>
        {HOME_PROMOS.map((promo, dotIndex) => (
          <View
            key={promo.id}
            style={{
              width: dotIndex === index ? 16 : 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: dotIndex === index ? primary : (isDark ? theme.colors['border-dark'] : theme.colors.border),
            }}
          />
        ))}
      </View>
    </View>
  );
}
