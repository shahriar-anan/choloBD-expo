import React from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

export type ContentWriteLanguage = 'en' | 'bn';

export function ContentLanguageChoice({
  value,
  onChange,
}: {
  value: ContentWriteLanguage;
  onChange: (value: ContentWriteLanguage) => void;
}) {
  const { t } = useTranslation();
  const options: Array<{ id: ContentWriteLanguage; label: string }> = [
    { id: 'en', label: t(TRANSLATION_KEYS.CONTENT_LANGUAGE.ENGLISH) },
    { id: 'bn', label: t(TRANSLATION_KEYS.CONTENT_LANGUAGE.BANGLA) },
  ];

  return (
    <View className="mt-4">
      <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
        {t(TRANSLATION_KEYS.CONTENT_LANGUAGE.WRITE_IN)}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => onChange(option.id)}
              className={`px-3.5 py-2 rounded-full border ${
                selected
                  ? 'bg-primary border-primary'
                  : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'
              }`}
            >
              <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
        {value === 'bn'
          ? t(TRANSLATION_KEYS.CONTENT_LANGUAGE.BANGLA_ONLY_HINT)
          : t(TRANSLATION_KEYS.CONTENT_LANGUAGE.ENGLISH_OPTIONAL_HINT)}
      </Text>
    </View>
  );
}

export function OptionalBanglaField({
  value,
  onChangeText,
  placeholderTextColor,
  multiline,
  className,
  style,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholderTextColor?: string;
  multiline?: boolean;
  className?: string;
  style?: TextInputProps['style'];
}) {
  const { t } = useTranslation();

  return (
    <View className="mt-2">
      <Text className="mb-1 text-xs text-muted dark:text-muted-dark">
        {t(TRANSLATION_KEYS.CONTENT_LANGUAGE.OPTIONAL_BANGLA)}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t(TRANSLATION_KEYS.CONTENT_LANGUAGE.OPTIONAL_BANGLA_PH)}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'auto'}
        className={className}
        style={style}
      />
    </View>
  );
}
