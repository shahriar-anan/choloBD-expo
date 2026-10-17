import React, { useEffect } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScroll } from '../ui/KeyboardAwareScroll';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { goBack } from '../../utilities/navigation';

export function useLeaveGuard(dirty: boolean): { allowLeave: () => void } {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dirtyRef = React.useRef(dirty);
  const bypassRef = React.useRef(false);
  dirtyRef.current = dirty;
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (!dirtyRef.current || bypassRef.current) return;
      event.preventDefault();
      Alert.alert(
        t(TRANSLATION_KEYS.HOTEL_DESK.DISCARD_TITLE),
        t(TRANSLATION_KEYS.HOTEL_DESK.DISCARD_BODY),
        [
          { text: t(TRANSLATION_KEYS.HOTEL_DESK.KEEP_EDITING), style: 'cancel' },
          {
            text: t(TRANSLATION_KEYS.HOTEL_DESK.DISCARD),
            style: 'destructive',
            onPress: () => navigation.dispatch(event.data.action),
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, t]);
  return {
    allowLeave: () => {
      bypassRef.current = true;
    },
  };
}

export function DeskScreen({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-4 pt-3 pb-3 bg-white border-b dark:bg-surface-dark border-border dark:border-border-dark">
        <TouchableOpacity onPress={() => goBack(router)} className="flex-row items-center h-12">
          <Ionicons name="chevron-back" size={24} color={primary} />
          <Text className="ml-1 text-base font-semibold text-primary dark:text-primary-dark">{t(TRANSLATION_KEYS.COMMON.BACK)}</Text>
        </TouchableOpacity>
        <Text className="text-[22px] font-semibold text-text dark:text-text-dark">{title}</Text>
      </View>
      <KeyboardAwareScroll className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: footer ? 24 : 32 }}>
        {children}
      </KeyboardAwareScroll>
      {footer}
    </SafeAreaView>
  );
}

export function DeskCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-4 overflow-hidden bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark">
      {children}
    </View>
  );
}

export function MenuRow({
  label,
  hint,
  value,
  tone = 'muted',
  onPress,
  last,
}: {
  label: string;
  hint?: string;
  value?: string;
  tone?: 'muted' | 'success' | 'warning';
  onPress: () => void;
  last?: boolean;
}) {
  const { isDark } = useTheme();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const toneColor = tone === 'success'
    ? (isDark ? theme.colors['success-dark'] : theme.colors.success)
    : tone === 'warning'
      ? (isDark ? theme.colors['warning-dark'] : theme.colors.warning)
      : muted;
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-4 min-h-[56px] py-2 ${last ? '' : 'border-b border-border dark:border-border-dark'}`}
    >
      <View className="flex-1 mr-2">
        <Text className="text-base font-semibold text-text dark:text-text-dark">{label}</Text>
        {hint ? <Text className="mt-0.5 text-sm text-muted dark:text-muted-dark" numberOfLines={2}>{hint}</Text> : null}
      </View>
      {value ? <Text className="max-w-[42%] mr-2 text-sm text-right" numberOfLines={2} style={{ color: toneColor }}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={muted} />
    </TouchableOpacity>
  );
}

export function FieldLabel({ children }: { children: string }) {
  return <Text className="mb-2 text-[13px] text-muted dark:text-muted-dark">{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View className="px-4 pt-2 pb-4 bg-background dark:bg-background-dark">
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        className="items-center justify-center h-12 rounded-xl bg-primary"
        style={{ opacity: disabled ? 0.6 : 1 }}
      >
        <Text className="text-base font-semibold text-white">{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
