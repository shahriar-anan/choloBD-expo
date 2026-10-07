import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

export function CoachDateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = useState(value);

  const applyTime = (picked: Date) => {
    const next = new Date(draft);
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    onChange(next);
    setStep(null);
  };

  const onDate = (event: DateTimePickerEvent, picked?: Date) => {
    if (event.type === 'dismissed' || !picked) {
      setStep(null);
      return;
    }
    setDraft(picked);
    if (Platform.OS === 'android') setStep('time');
  };

  const onTime = (event: DateTimePickerEvent, picked?: Date) => {
    if (event.type === 'dismissed' || !picked) {
      setStep(null);
      return;
    }
    applyTime(picked);
  };

  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-semibold text-text dark:text-text-dark">{label}</Text>
      <Pressable
        onPress={() => {
          setDraft(value);
          setStep('date');
        }}
        className="px-3 py-3 border rounded-lg border-border dark:border-border-dark"
      >
        <Text className="text-text dark:text-text-dark">{value.toLocaleString()}</Text>
      </Pressable>
      {step === 'date' ? <DateTimePicker value={draft} mode="date" onChange={onDate} /> : null}
      {step === 'time' ? <DateTimePicker value={draft} mode="time" onChange={onTime} /> : null}
      {Platform.OS === 'ios' && step === 'date' ? (
        <Pressable onPress={() => setStep('time')} className="mt-2">
          <Text className="text-primary dark:text-primary-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.NEXT)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
