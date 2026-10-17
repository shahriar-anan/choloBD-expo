import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

interface AdminCardProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export const AdminCard: React.FC<AdminCardProps> = ({ title, subtitle, onPress }) => {
  const { isDark } = useTheme();

  const handlePress = () => {
    // eslint-disable-next-line no-console
    console.log('[AdminCard] pressed', { title, subtitle });
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark" style={{ elevation: 2 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-semibold text-text dark:text-text-dark">{title}</Text>
            {subtitle ? (
              <Text
                style={{ color: isDark ? theme.colors['muted-dark'] : theme.colors.muted }}
                className="mt-1 text-sm"
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default AdminCard;
