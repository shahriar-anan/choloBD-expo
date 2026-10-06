import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import theme from '../../constants/theme';

interface AuthButtonProps {
  label: string;
  loadingLabel: string;
  loading: boolean;
  onPress: () => void;
}

export function AuthButton({ label, loadingLabel, loading, onPress }: AuthButtonProps) {
  return (
    <TouchableOpacity
      onPress={loading ? undefined : onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={loading ? loadingLabel : label}
      accessibilityState={{ disabled: loading, busy: loading }}
      className="min-h-12 flex-row items-center justify-center rounded-lg bg-primary px-4 dark:bg-primary-dark"
    >
      {loading ? <ActivityIndicator color={theme.colors.onPrimary} size="small" /> : null}
      <Text className={`font-medium text-on-primary ${loading ? 'ml-2' : ''}`}>
        {loading ? loadingLabel : label}
      </Text>
    </TouchableOpacity>
  );
}
