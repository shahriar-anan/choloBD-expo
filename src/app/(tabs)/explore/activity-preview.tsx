import React, { useState } from 'react';
import { KeyboardAwareScroll } from '../../../components/ui/KeyboardAwareScroll';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useActivityPreview } from '../../../hooks/useHomeFeed';
import { useActivityBookingLogic } from '../../../hooks/useActivityBookingLogic';
import { formatBdt } from '../../../utils/money';
import type { RootState } from '../../../store/store';
import { goBack } from '../../../utilities/navigation';

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function ActivityPreviewPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const spotId = typeof id === 'string' ? id : undefined;
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const { spot, isLoading, error, refetch } = useActivityPreview(spotId);
  const booking = useActivityBookingLogic();

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [showDate, setShowDate] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [note, setNote] = useState('');

  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const star = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const onPrimary = isDark ? theme.colors['onPrimary-dark'] : theme.colors.onPrimary;
  const background = isDark ? theme.colors['background-dark'] : theme.colors.background;

  const typeKey = spot?.activityType
    ? TRANSLATION_KEYS.ATTRACTIONS.ACTIVITY_TYPES[spot.activityType as keyof typeof TRANSLATION_KEYS.ATTRACTIONS.ACTIVITY_TYPES]
    : undefined;
  const priceLabel = spot?.entryCost === 0
    ? t(TRANSLATION_KEYS.ATTRACTIONS.FREE)
    : typeof spot?.entryCost === 'number'
      ? formatBdt(spot.entryCost)
      : null;
  const gallery = spot?.images?.length ? spot.images : spot?.imageUrl ? [{ id: 'cover', url: spot.imageUrl }] : [];

  const submit = async () => {
    if (!spotId || !userId) return;
    const bookingId = await booking.book({
      activitySpotId: spotId,
      userId,
      bookingDate: toIsoDate(date),
      participantCount: participants,
      ...(note.trim() ? { specialRequests: note.trim().slice(0, 500) } : {}),
    });
    if (bookingId) {
      router.replace({
        pathname: '/(tabs)/dashboard/attraction-bookings',
        params: { tab: 'activities' },
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
        <TouchableOpacity onPress={() => goBack(router)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={primary} />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={primary} />
        </View>
      ) : error || !spot ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Text style={{ color: muted, fontSize: 14 }}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={{ marginTop: 8 }}>
            <Text style={{ color: primary, fontWeight: '600' }}>{t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAwareScroll contentContainerStyle={{ paddingBottom: 32 }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {gallery.length > 0 ? gallery.map((image) => (
              <Image key={image.id} source={{ uri: image.url }} style={{ width, height: 220 }} resizeMode="cover" />
            )) : (
              <View style={{ height: 220, width: '100%', backgroundColor: surface, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="image-outline" size={36} color={muted} />
              </View>
            )}
          </ScrollView>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: text }}>{spot.name}</Text>
            {spot.locationName ? (
              <Text style={{ marginTop: 6, fontSize: 14, color: muted }}>{spot.locationName}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 }}>
              {typeKey ? <Text style={{ color: primary, fontWeight: '700' }}>{t(typeKey)}</Text> : null}
              {typeof spot.rating === 'number' && spot.rating > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={14} color={star} />
                  <Text style={{ marginLeft: 4, color: text, fontWeight: '700' }}>{spot.rating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
            {priceLabel ? (
              <Text style={{ marginTop: 12, fontSize: 18, fontWeight: '700', color: primary }}>{priceLabel}</Text>
            ) : null}
            {spot.description ? (
              <Text style={{ marginTop: 14, fontSize: 15, lineHeight: 22, color: text }}>{spot.description}</Text>
            ) : null}
            <Fact label={t(TRANSLATION_KEYS.ATTRACTIONS.HOURS)} value={[spot.openingHours, spot.closingHours].filter(Boolean).join(' – ')} text={text} muted={muted} />
            <Fact label={t(TRANSLATION_KEYS.ATTRACTIONS.DURATION)} value={spot.duration} text={text} muted={muted} />
            <Fact label={t(TRANSLATION_KEYS.ATTRACTIONS.AGE)} value={spot.ageRestriction} text={text} muted={muted} />
            <Fact label={t(TRANSLATION_KEYS.ATTRACTIONS.BEST_TIME)} value={spot.bestTimeToVisit} text={text} muted={muted} />

            <View style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: surface, borderWidth: 1, borderColor: border }}>
              {userId ? (
                <>
                  <Text style={{ color: muted, fontSize: 13, fontWeight: '600' }}>{t(TRANSLATION_KEYS.ATTRACTIONS.DATE)}</Text>
                  <TouchableOpacity onPress={() => setShowDate(true)} style={{ marginTop: 6, paddingVertical: 10 }}>
                    <Text style={{ color: text, fontSize: 16 }}>{date.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  {showDate ? (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      minimumDate={new Date()}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_event, next) => {
                        if (Platform.OS === 'android') setShowDate(false);
                        if (next) setDate(next);
                      }}
                    />
                  ) : null}
                  <Text style={{ marginTop: 12, color: muted, fontSize: 13, fontWeight: '600' }}>
                    {t(TRANSLATION_KEYS.ATTRACTIONS.PARTICIPANTS)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <TouchableOpacity onPress={() => setParticipants((count) => Math.max(1, count - 1))} style={{ padding: 8 }}>
                      <Ionicons name="remove-circle-outline" size={28} color={primary} />
                    </TouchableOpacity>
                    <Text style={{ minWidth: 32, textAlign: 'center', color: text, fontSize: 18, fontWeight: '700' }}>{participants}</Text>
                    <TouchableOpacity onPress={() => setParticipants((count) => Math.min(100, count + 1))} style={{ padding: 8 }}>
                      <Ionicons name="add-circle-outline" size={28} color={primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ marginTop: 12, color: muted, fontSize: 13, fontWeight: '600' }}>{t(TRANSLATION_KEYS.ATTRACTIONS.NOTE)}</Text>
                  <TextInput
                    value={note}
                    onChangeText={(value) => setNote(value.slice(0, 500))}
                    multiline
                    maxLength={500}
                    style={{ marginTop: 6, minHeight: 72, color: text, borderWidth: 1, borderColor: border, borderRadius: 10, padding: 10 }}
                  />
                  {booking.error ? (
                    <Text style={{ marginTop: 10, color: theme.colors.error }}>{booking.error}</Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={submit}
                    disabled={booking.isSubmitting}
                    style={{ marginTop: 16, backgroundColor: primary, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {booking.isSubmitting ? (
                      <ActivityIndicator color={onPrimary} />
                    ) : (
                      <Text style={{ color: onPrimary, fontWeight: '700', fontSize: 16 }}>{t(TRANSLATION_KEYS.ATTRACTIONS.BOOK)}</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/login')}
                  style={{ backgroundColor: primary, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: onPrimary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.ATTRACTIONS.SIGN_IN_BOOK)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAwareScroll>
      )}
    </SafeAreaView>
  );
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
