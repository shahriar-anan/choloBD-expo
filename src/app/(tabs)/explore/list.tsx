import React from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { HotelListUI } from '../../../components/ui/hotelListUI';
import { useExplore } from './_provider';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { goBack } from '../../../utilities/navigation';

export default function ExploreList() {
  const { hotels, hotelsLoading, selectHotel } = useExplore();
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  return (
    <SafeAreaView
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-4 pt-4 pb-2">
          <Pressable
            onPress={() => goBack(router)}
            style={{ padding: 6 }}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)}
          >
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </Pressable>
          <Text className="ml-1 text-2xl font-bold font-heading text-text dark:text-text-dark">{t(TRANSLATION_KEYS.EXPLORE.TITLE)}</Text>
        </View>

        <View className="px-6 pb-6">
          <HotelListUI hotels={hotels} loading={hotelsLoading} onSelectHotel={selectHotel} showImages showPrice />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
