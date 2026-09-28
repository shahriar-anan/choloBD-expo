import React from 'react';
import { View, Image, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1753731581991-03a92edcb279?w=1400&h=700&fit=crop';

export default function HeroBackground() {
  const { t } = useTranslation();

  return (
    <View className="relative overflow-hidden bg-neutral-800" style={{ height: 168 }}>
      <Image
        source={{ uri: HERO_IMAGE_URL }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.38)', 'transparent', 'rgba(0,0,0,0.20)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View className="absolute top-0 left-0 right-0 px-5 pt-4">
        <Text
          style={{
            color: '#fff',
            fontFamily: Platform.select({
              ios: 'SnellRoundhand-Black',
              android: 'cursive',
              default: 'cursive',
            }),
            fontWeight: Platform.OS === 'ios' ? undefined : '700',
            fontSize: 30,
            textShadowColor: 'rgba(0,0,0,0.55)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }}
        >
          {t(TRANSLATION_KEYS.HOME.HELLO_TRAVELLER)}
        </Text>
      </View>
    </View>
  );
}
