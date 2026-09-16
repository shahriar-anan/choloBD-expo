import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { useActivityAdminLogic } from '@/hooks/useActivityAdminLogic';

export default function ActivityProfileScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const {
    activitySpot,
    spotLoading,
    spotError,
    actionLoading,
    fetchMyActivitySpot,
    saveActivitySpot,
  } = useActivityAdminLogic();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [entryCost, setEntryCost] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [closingHours, setClosingHours] = useState('');
  const [isActive, setIsActive] = useState(true);

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;

  useEffect(() => {
    fetchMyActivitySpot();
  }, [fetchMyActivitySpot]);

  useEffect(() => {
    if (!activitySpot) return;
    setName(activitySpot.name || '');
    setDescription(activitySpot.description || '');
    setPhoneNumber(activitySpot.phoneNumber || '');
    setEntryCost(String(activitySpot.entryCost ?? ''));
    setOpeningHours(activitySpot.openingHours || '');
    setClosingHours(activitySpot.closingHours || '');
    setIsActive(activitySpot.isActive !== false);
  }, [activitySpot]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), 'Name is required');
      return;
    }
    const updated = await saveActivitySpot({
      name: name.trim(),
      description: description.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      entryCost: entryCost ? Number(entryCost) : undefined,
      openingHours: openingHours.trim() || undefined,
      closingHours: closingHours.trim() || undefined,
      isActive,
    });
    if (updated) setEditing(false);
  };

  const row = (label: string, value?: string | number | null) => (
    <View className="flex-row justify-between py-2 border-b border-border dark:border-border-dark">
      <Text className="text-sm text-muted dark:text-muted-dark">{label}</Text>
      <Text className="flex-1 ml-4 text-sm font-semibold text-right text-text dark:text-text-dark">
        {value ?? '—'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={{ padding: 6, marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={24} color={text} />
        </Pressable>

        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 mr-3">
            <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_PROFILE)}
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_PROFILE_DESC)}
            </Text>
          </View>
          {activitySpot ? (
            <Pressable
              onPress={() => (editing ? onSave() : setEditing(true))}
              disabled={actionLoading}
              className="px-3 py-2 rounded-lg"
              style={{ backgroundColor: primary }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                {editing ? t(TRANSLATION_KEYS.COMMON.SAVE) : 'Edit'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {spotLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : spotError || !activitySpot ? (
          <View className="p-4 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
            <Text className="text-sm text-text dark:text-text-dark">
              {spotError || 'No activity spot found'}
            </Text>
          </View>
        ) : editing ? (
          <View className="pb-10">
            {(
              [
                ['Name', name, setName],
                ['Description', description, setDescription],
                ['Phone', phoneNumber, setPhoneNumber],
                ['Entry cost (৳)', entryCost, setEntryCost],
                ['Opening hours', openingHours, setOpeningHours],
                ['Closing hours', closingHours, setClosingHours],
              ] as const
            ).map(([label, value, setter]) => (
              <View key={label} className="mb-3">
                <Text className="mb-1 text-sm font-semibold text-text dark:text-text-dark">{label}</Text>
                <TextInput
                  value={value}
                  onChangeText={setter}
                  multiline={label === 'Description'}
                  placeholderTextColor={muted}
                  style={{
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 12,
                    padding: 12,
                    color: text,
                    backgroundColor: surface,
                    minHeight: label === 'Description' ? 88 : undefined,
                    textAlignVertical: label === 'Description' ? 'top' : 'center',
                  }}
                />
              </View>
            ))}
            <View className="flex-row items-center justify-between mt-2 mb-6">
              <Text className="text-sm font-semibold text-text dark:text-text-dark">Active</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>
            <Pressable onPress={() => setEditing(false)} className="items-center py-3 mb-3">
              <Text style={{ color: muted }}>{t(TRANSLATION_KEYS.COMMON.CANCEL)}</Text>
            </Pressable>
          </View>
        ) : (
          <View className="p-4 mb-10 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
            <Text className="mb-3 text-xl font-bold text-text dark:text-text-dark">
              {activitySpot.name}
            </Text>
            {row('Type', activitySpot.activityType)}
            {row('Location', activitySpot.location?.name)}
            {row('Phone', activitySpot.phoneNumber)}
            {row('Entry cost', `৳${activitySpot.entryCost ?? 0}`)}
            {row('Hours', `${activitySpot.openingHours || '—'} – ${activitySpot.closingHours || '—'}`)}
            {row('Rating', activitySpot.rating?.toFixed?.(1) ?? activitySpot.rating)}
            {row('Status', activitySpot.isActive ? 'Active' : 'Inactive')}
            {activitySpot.description ? (
              <Text className="mt-4 text-sm leading-5 text-muted dark:text-muted-dark">
                {activitySpot.description}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
