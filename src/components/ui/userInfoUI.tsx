import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { ProfileAvatar } from './profileAvatar';

interface UserInfoUIProps {
  userName?: string;
  email?: string;
  imageUrl?: string;
  role?: string;
  userStatus?: string;
  onLogout: () => void;
}

export function UserInfoUI({ userName, email, imageUrl, userStatus, onLogout }: UserInfoUIProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Status color mapping
  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return isDark ? theme.colors['success-dark'] : theme.colors.success;
      case 'SUSPENDED':
      case 'BANNED':
        return isDark ? theme.colors['error-dark'] : theme.colors.error;
      case 'PENDING':
      case 'UNVERIFIED':
        return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
      case 'INACTIVE':
        return isDark ? theme.colors['muted-dark'] : theme.colors.muted;
      default:
        return isDark ? theme.colors['success-dark'] : theme.colors.success;
    }
  };

  // Get translated status
  const getTranslatedStatus = (statusValue?: string) => {
    if (!statusValue) return t(TRANSLATION_KEYS.DASHBOARD.STATUSES.ACTIVE);
    const statusKey = statusValue.toUpperCase() as keyof typeof TRANSLATION_KEYS.DASHBOARD.STATUSES;
    const translationKey = TRANSLATION_KEYS.DASHBOARD.STATUSES[statusKey];
    return translationKey ? t(translationKey) : statusValue;
  };

  const translatedStatus = getTranslatedStatus(userStatus);

  return (
    <View className="mb-6">
      {/* Profile Header Card with gradient-like appearance */}
      <View className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark" style={theme.elevation.sm}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <ProfileAvatar imageUrl={imageUrl} userName={userName} email={email} size={72} />
            
            {/* User Info */}
            <View className="flex-1 ml-4">
              <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
                {(userName || 'User').split(' ')[0]}
              </Text>
              <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{email || 'No email'}</Text>
              
              {/* Quick Status */}
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(userStatus) }} />
                <Text className="ml-1 text-xs text-text dark:text-text-dark">{translatedStatus}</Text>
              </View>
            </View>
          </View>
          
          {/* Logout Button */}
          <TouchableOpacity 
            onPress={onLogout} 
            className="p-3 rounded-lg" 
            style={{ backgroundColor: isDark ? theme.colors['error-dark'] : theme.colors.error, elevation: 2, minWidth: 44, minHeight: 44 }}
            accessibilityRole="button"
            accessibilityLabel="Logout"
            accessibilityHint="Double tap to log out of your account"
          >
            <Ionicons name="log-out" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
