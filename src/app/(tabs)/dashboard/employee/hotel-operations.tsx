import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { HotelMetricsTab } from '@/components/employee/hotel/HotelMetricsTab';
import { RoomStatusTab } from '@/components/employee/hotel/RoomStatusTab';
import { BookingsTab } from '@/components/employee/hotel/BookingsTab';
import { MaintenanceTab } from '@/components/employee/hotel/MaintenanceTab';
import { ComplaintsTab } from '@/components/employee/hotel/ComplaintsTab';

type TabType = 'metrics' | 'rooms' | 'bookings' | 'complaints' | 'maintenance';

export default function HotelOperationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>('metrics');

  const tabs = [
    { id: 'metrics' as TabType, label: 'Metrics', icon: 'stats-chart' },
    { id: 'rooms' as TabType, label: 'Room Status', icon: 'bed' },
    { id: 'bookings' as TabType, label: 'Bookings', icon: 'calendar' },
    { id: 'complaints' as TabType, label: 'Complaints', icon: 'chatbubbles' },
    { id: 'maintenance' as TabType, label: 'Maintenance', icon: 'construct' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'metrics':
        return <HotelMetricsTab />;
      case 'rooms':
        return <RoomStatusTab />;
      case 'bookings':
        return <BookingsTab />;
      case 'complaints':
        return <ComplaintsTab />;
      case 'maintenance':
        return <MaintenanceTab />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-4 border-b border-border dark:border-border-dark">
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 6, marginBottom: 12 }}
            accessibilityRole="button"
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? theme.colors['text-dark'] : theme.colors.text}
            />
          </Pressable>

          <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.EMPLOYEE_CARDS.HOTEL_OPERATIONS)}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.EMPLOYEE_CARDS.HOTEL_OPERATIONS_DESC)}
          </Text>
        </View>

        {/* Tab Navigation */}
        <View className="px-6 py-3 border-b border-border dark:border-border-dark">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className="flex-row items-center px-4 py-2 border rounded-lg"
                style={{
                  backgroundColor:
                    activeTab === tab.id
                      ? isDark
                        ? theme.colors['primary-dark']
                        : theme.colors.primary
                      : 'transparent',
                  borderColor:
                    activeTab === tab.id
                      ? isDark
                        ? theme.colors['primary-dark']
                        : theme.colors.primary
                      : isDark
                      ? theme.colors['border-dark']
                      : theme.colors.border,
                }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={
                    activeTab === tab.id
                      ? '#ffffff'
                      : isDark
                      ? theme.colors['text-dark']
                      : theme.colors.text
                  }
                />
                <Text
                  className="ml-2 text-sm font-semibold"
                  style={{
                    color:
                      activeTab === tab.id
                        ? '#ffffff'
                        : isDark
                        ? theme.colors['text-dark']
                        : theme.colors.text,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View className="flex-1">
          {renderContent()}
        </View>
      </View>
    </SafeAreaView>
  );
}
