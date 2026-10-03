import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useGuideDetail } from '../../../hooks/useGuides';
import { useGuideRequest } from '../../../hooks/useGuideRequest';
import { formatBdt } from '../../../utils/money';
import type { RootState } from '../../../store/store';

const DAY_KEYS = [
  TRANSLATION_KEYS.ATTRACTIONS.DAYS.SUN,
  TRANSLATION_KEYS.ATTRACTIONS.DAYS.MON,
  TRANSLATION_KEYS.ATTRACTIONS.DAYS.TUE,
  TRANSLATION_KEYS.ATTRACTIONS.DAYS.WED,
  TRANSLATION_KEYS.ATTRACTIONS.DAYS.THU,
  TRANSLATION_KEYS.ATTRACTIONS.DAYS.FRI,
  TRANSLATION_KEYS.ATTRACTIONS.DAYS.SAT,
];

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function combineDateAndTime(day: Date, time: Date): string {
  const combined = new Date(day);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined.toISOString();
}

function atTime(hours: number, minutes: number): Date {
  const value = new Date();
  value.setHours(hours, minutes, 0, 0);
  return value;
}

export default function GuideDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const guideId = typeof id === 'string' ? id : undefined;
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const { guide, isLoading, error, refresh } = useGuideDetail(guideId);
  const request = useGuideRequest(guideId);

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [startTime, setStartTime] = useState(() => atTime(9, 0));
  const [endTime, setEndTime] = useState(() => atTime(18, 0));
  const [picker, setPicker] = useState<'date' | 'start' | 'end' | null>(null);
  const [travelers, setTravelers] = useState(1);
  const [note, setNote] = useState('');

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const star = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const success = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const onPrimary = isDark ? theme.colors['onPrimary-dark'] : theme.colors.onPrimary;
  const background = isDark ? theme.colors['background-dark'] : theme.colors.background;

  useEffect(() => {
    if (!guide) return;
    const bookingDate = toIsoDate(date);
    const end = combineDateAndTime(date, endTime);
    if (guide.requiresStartTime) {
      request.check({ bookingDate, endTime: end, startTime: combineDateAndTime(date, startTime) });
      return;
    }
    request.check({ bookingDate, endTime: end });
  }, [guide?.id, guide?.requiresStartTime, date, startTime, endTime]);

  const name = [guide?.firstName, guide?.lastName].filter(Boolean).join(' ');
  const languages = (guide?.languages ?? []).map((code) => {
    const key = TRANSLATION_KEYS.ATTRACTIONS.LANGUAGES[code as keyof typeof TRANSLATION_KEYS.ATTRACTIONS.LANGUAGES];
    return key ? t(key) : code;
  });
  const specializations = (guide?.specializations ?? []).map((code) => {
    const key = TRANSLATION_KEYS.TOUR_SPOTS.TYPES[code as keyof typeof TRANSLATION_KEYS.TOUR_SPOTS.TYPES];
    return key ? t(key) : code;
  });
  const workingDays = (guide?.workingDays ?? [])
    .slice()
    .sort((left, right) => left - right)
    .map((day) => (DAY_KEYS[day] ? t(DAY_KEYS[day]) : String(day)))
    .join(', ');
  const blocked = request.availability && !request.availability.available;
  const availabilityText = request.isChecking
    ? t(TRANSLATION_KEYS.ATTRACTIONS.CHECKING)
    : request.availability?.reason || request.checkError || '';

  const submit = async () => {
    if (!guide || !userId || blocked) return;
    const bookingId = await request.submit({
      guideId: guide.id,
      userId,
      bookingDate: toIsoDate(date),
      endTime: combineDateAndTime(date, endTime),
      travelerCount: travelers,
      ...(guide.requiresStartTime ? { startTime: combineDateAndTime(date, startTime) } : {}),
      ...(note.trim() ? { specialRequests: note.trim().slice(0, 500) } : {}),
    });
    if (bookingId) {
      router.replace({
        pathname: '/(tabs)/dashboard/attraction-bookings',
        params: { tab: 'guides' },
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 48 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={primary} />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={primary} />
        </View>
      ) : error || !guide ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Text style={{ color: text }}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={{ marginTop: 12 }}>
            <Text style={{ color: primary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {guide.imageUrl ? (
            <Image source={{ uri: guide.imageUrl }} style={{ width: '100%', height: 240 }} resizeMode="cover" />
          ) : null}
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: text, flexShrink: 1 }}>{name}</Text>
              {guide.isVerified ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color={success} />
                  <Text style={{ marginLeft: 4, color: success, fontWeight: '700' }}>{t(TRANSLATION_KEYS.ATTRACTIONS.VERIFIED)}</Text>
                </View>
              ) : null}
            </View>
            {guide.locationName ? <Text style={{ marginTop: 6, color: muted }}>{guide.locationName}</Text> : null}
            <Text style={{ marginTop: 10, fontSize: 18, fontWeight: '700', color: primary }}>
              {t(TRANSLATION_KEYS.ATTRACTIONS.PER_DAY, { price: formatBdt(guide.pricePerDay) })}
            </Text>
            {guide.rating > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Ionicons name="star" size={14} color={star} />
                <Text style={{ marginLeft: 4, color: text, fontWeight: '700' }}>{guide.rating.toFixed(1)}</Text>
              </View>
            ) : null}
            {guide.bio ? <Text style={{ marginTop: 14, fontSize: 15, lineHeight: 22, color: text }}>{guide.bio}</Text> : null}
            {languages.length > 0 ? <Fact label={t(TRANSLATION_KEYS.ATTRACTIONS.LANGUAGES_LABEL)} value={languages.join(', ')} text={text} muted={muted} /> : null}
            {specializations.length > 0 ? <Fact label={t(TRANSLATION_KEYS.TOUR_SPOTS.TOUR_TYPE)} value={specializations.join(', ')} text={text} muted={muted} /> : null}
            <Fact label={t(TRANSLATION_KEYS.ATTRACTIONS.EXPERIENCE, { count: guide.experienceYears })} value={t(TRANSLATION_KEYS.ATTRACTIONS.TOURS_COMPLETED, { count: guide.toursCompleted })} text={text} muted={muted} />
            <Fact
              label={t(TRANSLATION_KEYS.ATTRACTIONS.WORKING_HOURS)}
              value={[workingDays, [guide.workingHoursStart, guide.workingHoursEnd].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}
              text={text}
              muted={muted}
            />
            {guide.unavailableDates.length > 0 ? (
              <Fact label={t(TRANSLATION_KEYS.ATTRACTIONS.UNAVAILABLE)} value={guide.unavailableDates.join(', ')} text={text} muted={muted} />
            ) : null}

            <View style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: surface, borderWidth: 1, borderColor: border }}>
              {request.submitted ? (
                <>
                  <Text style={{ color: text, fontSize: 18, fontWeight: '700' }}>{t(TRANSLATION_KEYS.ATTRACTIONS.PENDING_TITLE)}</Text>
                  <Text style={{ marginTop: 8, color: muted, lineHeight: 20 }}>{t(TRANSLATION_KEYS.ATTRACTIONS.PENDING_BODY)}</Text>
                </>
              ) : userId ? (
                <>
                  <FieldLabel label={t(TRANSLATION_KEYS.ATTRACTIONS.DATE)} muted={muted} />
                  <TouchableOpacity onPress={() => setPicker('date')} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: text, fontSize: 16 }}>{date.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  {guide.requiresStartTime ? (
                    <>
                      <FieldLabel label={t(TRANSLATION_KEYS.ATTRACTIONS.START_TIME)} muted={muted} />
                      <TouchableOpacity onPress={() => setPicker('start')} style={{ paddingVertical: 8 }}>
                        <Text style={{ color: text, fontSize: 16 }}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                  <FieldLabel label={t(TRANSLATION_KEYS.ATTRACTIONS.END_TIME)} muted={muted} />
                  <TouchableOpacity onPress={() => setPicker('end')} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: text, fontSize: 16 }}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TouchableOpacity>
                  {picker ? (
                    <DateTimePicker
                      value={picker === 'date' ? date : picker === 'start' ? startTime : endTime}
                      mode={picker === 'date' ? 'date' : 'time'}
                      minimumDate={picker === 'date' ? new Date() : undefined}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_event, next) => {
                        if (Platform.OS === 'android') setPicker(null);
                        if (!next) return;
                        if (picker === 'date') setDate(next);
                        if (picker === 'start') setStartTime(next);
                        if (picker === 'end') setEndTime(next);
                      }}
                    />
                  ) : null}
                  <FieldLabel label={t(TRANSLATION_KEYS.ATTRACTIONS.TRAVELERS)} muted={muted} />
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setTravelers((count) => Math.max(1, count - 1))} style={{ padding: 8 }}>
                      <Ionicons name="remove-circle-outline" size={28} color={primary} />
                    </TouchableOpacity>
                    <Text style={{ minWidth: 32, textAlign: 'center', color: text, fontSize: 18, fontWeight: '700' }}>{travelers}</Text>
                    <TouchableOpacity onPress={() => setTravelers((count) => Math.min(50, count + 1))} style={{ padding: 8 }}>
                      <Ionicons name="add-circle-outline" size={28} color={primary} />
                    </TouchableOpacity>
                  </View>
                  <FieldLabel label={t(TRANSLATION_KEYS.ATTRACTIONS.NOTE)} muted={muted} />
                  <TextInput
                    value={note}
                    onChangeText={(value) => setNote(value.slice(0, 500))}
                    multiline
                    maxLength={500}
                    style={{ minHeight: 72, color: text, borderWidth: 1, borderColor: border, borderRadius: 10, padding: 10 }}
                  />
                  {availabilityText ? (
                    <Text style={{ marginTop: 10, color: blocked ? theme.colors.error : muted }}>{availabilityText}</Text>
                  ) : null}
                  {request.submitError ? (
                    <Text style={{ marginTop: 8, color: theme.colors.error }}>{request.submitError}</Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={submit}
                    disabled={request.isSubmitting || request.isChecking || Boolean(blocked)}
                    style={{
                      marginTop: 16,
                      backgroundColor: primary,
                      borderRadius: 12,
                      minHeight: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: request.isSubmitting || request.isChecking || blocked ? 0.6 : 1,
                    }}
                  >
                    {request.isSubmitting ? (
                      <ActivityIndicator color={onPrimary} />
                    ) : (
                      <Text style={{ color: onPrimary, fontWeight: '700', fontSize: 16 }}>{t(TRANSLATION_KEYS.ATTRACTIONS.REQUEST)}</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/login')}
                  style={{ backgroundColor: primary, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: onPrimary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.ATTRACTIONS.SIGN_IN_REQUEST)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function FieldLabel({ label, muted }: { label: string; muted: string }) {
  return <Text style={{ marginTop: 12, color: muted, fontSize: 13, fontWeight: '600' }}>{label}</Text>;
}

function Fact({ label, value, text, muted }: { label: string; value?: string; text: string; muted: string }) {
  if (!value) return null;
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ marginTop: 2, color: text, fontSize: 15 }}>{value}</Text>
    </View>
  );
}
