import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TransportLayoutRef } from '../../types/transports';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { coachTypeLabelKey, layoutCoachClass, layoutSeatCount } from '../../utilities/coachOperator';

export function CoachCompactCard({
  layout,
  fallbackImageUrl,
  onPress,
}: {
  layout: TransportLayoutRef;
  fallbackImageUrl?: string | null;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const coachClass = layoutCoachClass(layout);
  const typeKey = coachTypeLabelKey(coachClass?.busServiceType);
  const typeLabel = typeKey ? t(typeKey) : coachClass?.busServiceType ?? '';
  const imageUri = layout.imageUrl || fallbackImageUrl;
  const initial = layout.name.trim().charAt(0).toUpperCase() || 'B';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-3 mb-3 border rounded-2xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} className="w-14 h-14 rounded-xl bg-border dark:bg-border-dark" />
      ) : (
        <View className="items-center justify-center w-14 h-14 rounded-xl bg-primary/15 dark:bg-primary-dark/20">
          <Text className="text-lg font-bold text-primary dark:text-primary-dark">{initial}</Text>
          <Ionicons name="bus-outline" size={14} color="#16a34a" style={{ position: 'absolute', bottom: 4, right: 4 }} />
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-base font-semibold text-text dark:text-text-dark" numberOfLines={1}>
          {layout.name}
        </Text>
        {typeLabel ? (
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
            {typeLabel}
          </Text>
        ) : null}
        <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
          {layoutSeatCount(layout)} {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SEAT_COUNT).toLowerCase()}
          {coachClass?.basePrice != null ? ` · ৳${coachClass.basePrice}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );
}
