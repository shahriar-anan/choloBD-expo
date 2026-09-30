import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useActivityPreview } from '../../../hooks/useHomeFeed';
import { formatBdt } from '../../../utils/money';

export default function ActivityPreviewPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const spotId = typeof id === 'string' ? id : undefined;
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { spot, isLoading, error, refetch } = useActivityPreview(spotId);

  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const star = isDark ? theme.colors['warning-dark'] : theme.colors.warning;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? theme.colors['background-dark'] : theme.colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={primary} />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={primary} />
        </View>
      ) : error || !spot ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Text style={{ color: muted, fontSize: 14 }}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={{ marginTop: 8 }}>
            <Text style={{ color: primary, fontWeight: '600' }}>{t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView>
          <View style={{ height: 240, backgroundColor: surface }}>
            {spot.imageUrl ? (
              <Image source={{ uri: spot.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="image" size={36} color={muted} />
              </View>
            )}
          </View>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: text }}>{spot.name}</Text>
            {spot.location ? (
              <Text style={{ marginTop: 6, fontSize: 14, color: muted }}>{spot.location}</Text>
            ) : null}
            {typeof spot.rating === 'number' && spot.rating > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
                <Feather name="star" size={14} color={star} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: text }}>{spot.rating.toFixed(1)}</Text>
              </View>
            ) : null}
            {typeof spot.entryCost === 'number' && spot.entryCost > 0 ? (
              <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '700', color: primary }}>
                {t(TRANSLATION_KEYS.HOME.ENTRY_COST)} {formatBdt(spot.entryCost)}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
