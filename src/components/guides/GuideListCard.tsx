import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { formatBdt } from '../../utils/money';
import type { GuideSummary } from '../../types/guides';

interface GuideListCardProps {
  guide: GuideSummary;
  onPress?: () => void;
  compact?: boolean;
}

export function GuideListCard({ guide, onPress, compact = false }: GuideListCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const name = [guide.firstName, guide.lastName].filter(Boolean).join(' ');
  const initial = (guide.firstName || guide.lastName || '?').slice(0, 1).toUpperCase();
  const languages = guide.languages.slice(0, 2).map((code) => {
    const key = TRANSLATION_KEYS.ATTRACTIONS.LANGUAGES[code as keyof typeof TRANSLATION_KEYS.ATTRACTIONS.LANGUAGES];
    return key ? t(key) : code;
  });

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="overflow-hidden rounded-2xl"
        style={{ flex: 1, backgroundColor: surfaceColor, ...theme.elevation.sm }}
      >
        <View style={{ height: 112, backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
          {guide.imageUrl ? (
            <Image source={{ uri: guide.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: primaryColor }}>{initial}</Text>
            </View>
          )}
        </View>
        <View style={{ padding: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 36 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, flex: 1 }} numberOfLines={2}>
              {name}
            </Text>
            {guide.isVerified ? <Ionicons name="checkmark-circle" size={14} color={successColor} /> : null}
          </View>
          <Text style={{ marginTop: 6, fontSize: 12, color: mutedColor }} numberOfLines={1}>
            {[guide.locationName, languages.join(', ')].filter(Boolean).join(' · ')}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 13, fontWeight: '700', color: primaryColor }} numberOfLines={1}>
            {t(TRANSLATION_KEYS.ATTRACTIONS.PER_DAY, { price: formatBdt(guide.pricePerDay) })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-3 flex-row items-center rounded-2xl p-3"
      style={{ backgroundColor: surfaceColor, ...theme.elevation.sm }}
    >
      {guide.imageUrl ? (
        <Image source={{ uri: guide.imageUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: primaryColor }}>{initial}</Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, flexShrink: 1 }} numberOfLines={1}>
            {name}
          </Text>
          {guide.isVerified ? (
            <Ionicons name="checkmark-circle" size={16} color={successColor} style={{ marginLeft: 6 }} />
          ) : null}
        </View>
        {guide.locationName ? (
          <Text style={{ marginTop: 2, fontSize: 13, color: mutedColor }} numberOfLines={1}>
            {guide.locationName}
          </Text>
        ) : null}
        {languages.length > 0 ? (
          <Text style={{ marginTop: 4, fontSize: 13, color: mutedColor }} numberOfLines={1}>
            {languages.join(', ')}
          </Text>
        ) : null}
        <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '700', color: primaryColor }}>
          {t(TRANSLATION_KEYS.ATTRACTIONS.PER_DAY, { price: formatBdt(guide.pricePerDay) })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
