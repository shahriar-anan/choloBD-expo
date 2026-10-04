import React from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HotelDeskSettings } from '../../components/hotel/HotelDeskSettings';
import { useDashboardLogic } from '../../hooks/useDashboardLogic';
import { tabBarClearance } from '../../hooks/useHideTabBar';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

export default function HotelEmployeeSettings() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { handleLogout } = useDashboardLogic();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: tabBarClearance(insets.bottom) }}>
        <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.SETTINGS)}
        </Text>
        <HotelDeskSettings onLogout={handleLogout} showHeading={false} />
      </ScrollView>
    </SafeAreaView>
  );
}
