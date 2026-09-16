import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { Complaint } from '@/types/complaints';

interface ComplaintCardProps {
  complaint: Complaint;
  onPress: (id: string) => void;
}

function statusColor(status: string, isDark: boolean) {
  switch (status) {
    case 'OPEN':
      return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    case 'UNSOLVED':
      return isDark ? theme.colors['error-dark'] : theme.colors.error;
    case 'CLOSED':
      return isDark ? theme.colors['success-dark'] : theme.colors.success;
    default:
      return isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  }
}

export function ComplaintCard({ complaint, onPress }: ComplaintCardProps) {
  const { isDark } = useTheme();
  const color = statusColor(complaint.status, isDark);
  const guest =
    complaint.complainantName ||
    complaint.complainant?.userName ||
    'Guest';
  const created =
    typeof complaint.createdAt === 'string'
      ? complaint.createdAt.slice(0, 10)
      : new Date(complaint.createdAt).toISOString().slice(0, 10);

  return (
    <Pressable
      onPress={() => onPress(complaint.id)}
      className="p-4 mb-3 border rounded-xl bg-surface dark:bg-surface-dark border-border dark:border-border-dark active:opacity-80"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="flex-1 mr-3 text-base font-semibold text-text dark:text-text-dark"
          numberOfLines={2}
        >
          {complaint.title}
        </Text>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: color + '22',
          }}
        >
          <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
            {complaint.status}
          </Text>
        </View>
      </View>

      <Text
        className="mb-3 text-sm text-muted dark:text-muted-dark"
        numberOfLines={2}
      >
        {complaint.description}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons
            name="person-outline"
            size={14}
            color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
          />
          <Text className="ml-1 text-xs text-muted dark:text-muted-dark">
            {guest}
          </Text>
        </View>
        <Text className="text-xs text-muted dark:text-muted-dark">{created}</Text>
      </View>
    </Pressable>
  );
}
