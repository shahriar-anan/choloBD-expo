import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface HomeSectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function HomeSectionHeader({ title, onSeeAll }: HomeSectionHeaderProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ flex: 1, fontSize: 20, fontWeight: '700', color: text, marginRight: 12 }} numberOfLines={1}>
        {title}
      </Text>
      {onSeeAll ? (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: primary }}>
            {t(TRANSLATION_KEYS.HOME.SEE_ALL)}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface HomeFeedStatusProps {
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function HomeFeedStatus({ isLoading, error, onRetry }: HomeFeedStatusProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 16, alignItems: 'flex-start' }}>
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  if (!error) return null;

  return (
    <View style={{ paddingVertical: 8 }}>
      <Text style={{ fontSize: 13, color: muted }} numberOfLines={2}>
        {error}
      </Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: primary }}>
            {t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
