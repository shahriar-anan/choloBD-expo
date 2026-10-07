import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import AppBrandSection from '../homepage/AppBrandSection';
import { KeyboardAwareScroll } from '../ui/KeyboardAwareScroll';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface AuthScreenProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAwareScroll
        centerWhenClosed
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 24 + insets.bottom,
        }}
      >
        <View className="w-full max-w-md mx-auto rounded-2xl border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
          <View className="mb-6 items-center">
            <AppBrandSection width={240} height={90} />
          </View>
          <Text className="mb-2 text-center font-heading text-3xl font-bold text-text dark:text-text-dark">
            {title}
          </Text>
          <Text className="mb-6 text-center text-muted dark:text-muted-dark">{subtitle}</Text>
          <View className="gap-4">{children}</View>
          {footer}
        </View>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

interface AuthErrorBannerProps {
  message: string;
  dismissLabel: string;
  onDismiss: () => void;
}

export function AuthErrorBanner({ message, dismissLabel, onDismiss }: AuthErrorBannerProps) {
  const { isDark } = useTheme();
  const iconColor = isDark ? theme.colors['error-dark'] : theme.colors.error;

  return (
    <View
      className="flex-row items-center gap-3 rounded-xl border border-error px-3 py-3 dark:border-error-dark"
      accessibilityLiveRegion="polite"
    >
      <Text className="flex-1 text-sm text-error dark:text-error-dark">{message}</Text>
      <TouchableOpacity
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={dismissLabel}
        className="min-h-12 min-w-12 items-center justify-center"
      >
        <Ionicons name="close" size={20} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const KNOWN_AUTH_ERRORS: Record<string, string> = {
  'Invalid email or password': TRANSLATION_KEYS.AUTH.LOGIN.INVALID_CREDENTIALS,
  'Invalid credentials': TRANSLATION_KEYS.AUTH.LOGIN.INVALID_CREDENTIALS,
  'User with this email already exists': TRANSLATION_KEYS.AUTH.REGISTER.EMAIL_TAKEN,
};

export function authErrorText(
  raw: string,
  translate: (key: string) => string,
  fallbackKey: string,
): string {
  if (raw === 'Internal server error') {
    return translate(fallbackKey);
  }
  const known = KNOWN_AUTH_ERRORS[raw];
  if (known) {
    return translate(known);
  }
  if (raw.startsWith('auth.')) {
    return translate(raw);
  }
  return raw;
}

interface AuthSocialRowProps {
  googleReady: boolean;
  facebookReady: boolean;
  googleLoading: boolean;
  facebookLoading: boolean;
  onGoogle: () => void;
  onFacebook: () => void;
  googleLabel: string;
  facebookLabel: string;
  dividerLabel: string;
}

export function AuthSocialRow({
  googleReady,
  facebookReady,
  googleLoading,
  facebookLoading,
  onGoogle,
  onFacebook,
  googleLabel,
  facebookLabel,
  dividerLabel,
}: AuthSocialRowProps) {
  const { isDark } = useTheme();
  const iconColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  if (!googleReady && !facebookReady) {
    return null;
  }

  return (
    <View className="mt-4 gap-3">
      <View className="flex-row items-center">
        <View className="h-px flex-1 bg-border dark:bg-border-dark" />
        <Text className="px-3 text-sm text-muted dark:text-muted-dark">{dividerLabel}</Text>
        <View className="h-px flex-1 bg-border dark:bg-border-dark" />
      </View>
      {googleReady ? (
        <TouchableOpacity
          onPress={googleLoading ? undefined : onGoogle}
          disabled={googleLoading}
          accessibilityRole="button"
          accessibilityState={{ disabled: googleLoading, busy: googleLoading }}
          className="min-h-12 flex-row items-center justify-center gap-3 rounded-xl border border-border bg-surface-2 dark:border-border-dark dark:bg-surface-2-dark"
        >
          <Ionicons name="logo-google" size={20} color={iconColor} />
          <Text className="text-base font-semibold text-text dark:text-text-dark">{googleLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {facebookReady ? (
        <TouchableOpacity
          onPress={facebookLoading ? undefined : onFacebook}
          disabled={facebookLoading}
          accessibilityRole="button"
          accessibilityState={{ disabled: facebookLoading, busy: facebookLoading }}
          className="min-h-12 flex-row items-center justify-center gap-3 rounded-xl bg-primary dark:bg-primary-dark"
        >
          <Ionicons name="logo-facebook" size={20} color={theme.colors.onPrimary} />
          <Text className="text-base font-semibold text-on-primary">{facebookLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
