import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import SideScroller from '../modals/SideScroller';
import AppBrandSection from './AppBrandSection';
import { useIsTraveler } from '../../hooks/useIsTraveler';

interface HomeHeaderProps {
  onNavigate?: (section: string, item: string) => void;
  onLogout?: () => void;
}

export default function HomeHeader({ onNavigate, onLogout }: HomeHeaderProps) {
  const { isDark } = useTheme();
  const traveler = useIsTraveler();

  const bgColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{
        backgroundColor: bgColor,
      }}
    >
      <View
        className="flex-row items-center justify-between px-3"
        style={{
          height: 52,
          backgroundColor: bgColor,
          borderBottomWidth: 0.5,
          borderBottomColor: borderColor,
        }}
      >
        <View className="flex-row items-center gap-1.5 flex-1">
          {traveler ? null : <SideScroller onNavigate={onNavigate} onLogout={onLogout} />}
          <AppBrandSection />
        </View>
      </View>
    </SafeAreaView>
  );
}
