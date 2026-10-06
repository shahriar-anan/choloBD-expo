import React, { forwardRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

interface AuthFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  secure?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  blurOnSubmit?: boolean;
  onSubmitEditing?: () => void;
}

export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  {
    label,
    value,
    onChangeText,
    onBlur,
    error,
    hint,
    placeholder,
    secure = false,
    showPasswordLabel,
    hidePasswordLabel,
    keyboardType,
    autoCapitalize = 'none',
    autoComplete,
    textContentType,
    returnKeyType,
    blurOnSubmit,
    onSubmitEditing,
  },
  ref,
) {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const placeholderColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const iconColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const hasError = Boolean(error);

  return (
    <View>
      <Text className="mb-2 text-sm text-muted dark:text-muted-dark">{label}</Text>
      <View
        className={`flex-row items-center rounded-lg border bg-surface-2 dark:bg-surface-2-dark ${
          hasError ? 'border-error dark:border-error-dark' : 'border-border dark:border-border-dark'
        }`}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secure && !visible}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          importantForAutofill="yes"
          returnKeyType={returnKeyType}
          blurOnSubmit={blurOnSubmit}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={label}
          className="min-h-12 flex-1 px-3 py-3 text-base text-text dark:text-text-dark"
        />
        {secure ? (
          <TouchableOpacity
            onPress={() => setVisible((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={visible ? hidePasswordLabel : showPasswordLabel}
            className="min-h-12 min-w-12 items-center justify-center"
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={iconColor} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text className="mt-1 text-xs text-error dark:text-error-dark" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{hint}</Text>
      ) : null}
    </View>
  );
});
