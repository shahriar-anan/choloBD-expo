import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { getMyHotel } from '@/services/api/users';
import { updateHotelInfo, updateHotelCoreInfo } from '@/services/api/hotels';

export default function HotelEditScreen() {
  const router = useRouter();
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [isActive, setIsActive] = useState(true);

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  useEffect(() => {
    const load = async () => {
      if (!hotelId) {
        setLoading(false);
        return;
      }
      try {
        const hotel = await getMyHotel(hotelId);
        setName(hotel?.name || '');
        setDescription(hotel?.description || '');
        setEmail(hotel?.email || '');
        setPhoneNumber(hotel?.phoneNumber || '');
        setWebsite(hotel?.website || '');
        setCheckInTime(hotel?.checkInTime || '');
        setCheckOutTime(hotel?.checkOutTime || '');
        setIsActive(hotel?.isActive !== false);
      } catch (err: any) {
        Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), err?.message || 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hotelId, t]);

  const onSave = async () => {
    if (!hotelId) return;
    if (!name.trim()) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.NAME_REQUIRED));
      return;
    }

    try {
      setSaving(true);
      await Promise.all([
        updateHotelCoreInfo(hotelId, { name: name.trim() }),
        updateHotelInfo(hotelId, {
          description: description.trim() || undefined,
          email: email.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          website: website.trim() || undefined,
          checkInTime: checkInTime.trim() || undefined,
          checkOutTime: checkOutTime.trim() || undefined,
          isActive,
        }),
      ]);
      Alert.alert(t(TRANSLATION_KEYS.COMMON.SUCCESS), t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.SAVE_SUCCESS));
      router.back();
    } catch (err: any) {
      Alert.alert(
        t(TRANSLATION_KEYS.COMMON.ERROR),
        err?.response?.data?.message || err?.message || 'Failed to save hotel'
      );
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: { multiline?: boolean; placeholder?: string }
  ) => (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={opts?.placeholder}
        placeholderTextColor={muted}
        multiline={opts?.multiline}
        style={{
          borderWidth: 1,
          borderColor: border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: opts?.multiline ? 12 : 10,
          minHeight: opts?.multiline ? 96 : undefined,
          color: text,
          backgroundColor: surface,
          textAlignVertical: opts?.multiline ? 'top' : 'center',
        }}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="items-center justify-center flex-1 bg-background dark:bg-background-dark"
      >
        <ActivityIndicator size="large" color={primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={{ padding: 6, marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={24} color={text} />
        </Pressable>

        <Text className="mb-1 text-2xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.TITLE)}
        </Text>
        <Text className="mb-6 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.SUBTITLE)}
        </Text>

        {field(t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.NAME), name, setName)}
        {field(t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.DESCRIPTION), description, setDescription, {
          multiline: true,
        })}
        {field(t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.EMAIL), email, setEmail, {
          placeholder: 'hotel@example.com',
        })}
        {field(t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.PHONE), phoneNumber, setPhoneNumber)}
        {field(t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.WEBSITE), website, setWebsite)}
        {field(t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.CHECK_IN), checkInTime, setCheckInTime, {
          placeholder: '14:00',
        })}
        {field(t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.CHECK_OUT), checkOutTime, setCheckOutTime, {
          placeholder: '11:00',
        })}

        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-sm font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.HOTEL_EDIT.ACTIVE)}
          </Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        <Pressable
          onPress={onSave}
          disabled={saving}
          className="items-center py-3 mb-10 rounded-xl"
          style={{ backgroundColor: primary, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {t(TRANSLATION_KEYS.COMMON.SAVE)}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
