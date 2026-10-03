import React from 'react';
import { Text, View } from 'react-native';

export function DetailCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View className="p-4 mx-3 mt-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
      {title ? <Text className="mb-2 text-base font-bold text-text dark:text-text-dark">{title}</Text> : null}
      {children}
    </View>
  );
}

export function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return (
    <View className="py-2">
      <Text className="text-xs text-muted dark:text-muted-dark">{label}</Text>
      <Text className="mt-0.5 text-sm text-text dark:text-text-dark">{String(value)}</Text>
    </View>
  );
}
