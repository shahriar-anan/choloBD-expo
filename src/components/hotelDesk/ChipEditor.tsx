import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { FieldLabel } from './chrome';

export function ChipEditor({
  label,
  items,
  onChange,
  readOnly,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const [draft, setDraft] = useState('');

  const add = () => {
    const next = draft.trim();
    if (!next) return;
    onChange([...items, next]);
    setDraft('');
  };

  return (
    <View className="mb-5">
      <FieldLabel>{label}</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        {items.map((item, index) => (
          <View key={`${item}-${index}`} className="flex-row items-center px-3 py-2 rounded-full bg-background dark:bg-background-dark">
            <Text className="text-sm text-text dark:text-text-dark">{item}</Text>
            {readOnly ? null : (
              <TouchableOpacity
                accessibilityLabel={t(TRANSLATION_KEYS.HOTEL_DESK.DISCARD)}
                onPress={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="items-center justify-center w-8 h-8 ml-1"
              >
                <Ionicons name="close" size={14} color={muted} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
      {readOnly ? null : (
        <View className="flex-row items-center mt-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={add}
            placeholder={t(TRANSLATION_KEYS.HOTEL_DESK.CHIP_PLACEHOLDER)}
            placeholderTextColor={muted}
            className="flex-1 h-12 px-3 text-base bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark text-text dark:text-text-dark"
          />
          <TouchableOpacity onPress={add} className="items-center justify-center h-12 px-4 ml-2 rounded-xl bg-primary">
            <Text className="text-sm font-semibold text-white">{t(TRANSLATION_KEYS.HOTEL_DESK.ADD_ITEM)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
