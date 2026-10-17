import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChipEditor } from '../../../../../components/hotelDesk/ChipEditor';
import { DeskScreen, FieldLabel, PrimaryButton, useLeaveGuard } from '../../../../../components/hotelDesk/chrome';
import { stringList } from '../../../../../components/hotelDesk/draft';
import { useHotelProperty } from '../../../../../components/hotelDesk/HotelPropertyContext';
import { TRANSLATION_KEYS } from '../../../../../constants/translationKeys';
import { useTheme } from '../../../../../hooks/useTheme';
import theme from '../../../../../constants/theme';

interface ListingDraft {
  phoneNumber: string;
  email: string;
  website: string;
  amenities: string[];
  amenitiesBn: string[];
  policies: string[];
  policiesBn: string[];
  nearbyTourSpots: string[];
  nearbyTourSpotsBn: string[];
  nearbyActivitySpots: string[];
  nearbyActivitySpotsBn: string[];
}

function draftFromHotel(hotel: any): ListingDraft {
  return {
    phoneNumber: hotel?.phoneNumber || '',
    email: hotel?.email || '',
    website: hotel?.website || '',
    amenities: stringList(hotel?.amenities),
    amenitiesBn: stringList(hotel?.amenitiesBn),
    policies: stringList(hotel?.policies),
    policiesBn: stringList(hotel?.policiesBn),
    nearbyTourSpots: stringList(hotel?.nearbyTourSpots),
    nearbyTourSpotsBn: stringList(hotel?.nearbyTourSpotsBn),
    nearbyActivitySpots: stringList(hotel?.nearbyActivitySpots),
    nearbyActivitySpotsBn: stringList(hotel?.nearbyActivitySpotsBn),
  };
}

export default function PropertyDetailsScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const { hotel, isHotelAdmin, savingProfile, saveProfile } = useHotelProperty();
  const saved = useMemo(() => draftFromHotel(hotel), [hotel]);
  const [draft, setDraft] = useState<ListingDraft>(saved);
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hotel || hydrated.current) return;
    hydrated.current = true;
    setDraft(draftFromHotel(hotel));
  }, [hotel]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  useLeaveGuard(isHotelAdmin && dirty);

  const setField = (key: keyof ListingDraft, value: string | string[]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    try {
      await saveProfile({
        phoneNumber: draft.phoneNumber.trim() || undefined,
        email: draft.email.trim() || undefined,
        website: draft.website.trim() || undefined,
        amenities: draft.amenities,
        amenitiesBn: draft.amenitiesBn,
        policies: draft.policies,
        policiesBn: draft.policiesBn,
        nearbyTourSpots: draft.nearbyTourSpots,
        nearbyTourSpotsBn: draft.nearbyTourSpotsBn,
        nearbyActivitySpots: draft.nearbyActivitySpots,
        nearbyActivitySpotsBn: draft.nearbyActivitySpotsBn,
      });
      setDraft((current) => ({
        ...current,
        phoneNumber: current.phoneNumber.trim(),
        email: current.email.trim(),
        website: current.website.trim(),
      }));
      Alert.alert(t(TRANSLATION_KEYS.HOTEL_DESK.PROFILE_SAVED_TITLE), t(TRANSLATION_KEYS.HOTEL_DESK.PROFILE_SAVED));
    } catch (error: any) {
      Alert.alert(
        t(TRANSLATION_KEYS.HOTEL_DESK.PROFILE_SAVED_TITLE),
        error?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_SAVE_PROFILE),
      );
    }
  };

  const inputClass = 'h-12 px-3 mb-4 text-base bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark text-text dark:text-text-dark';

  return (
    <DeskScreen
      title={t(TRANSLATION_KEYS.HOTEL_DESK.PROPERTY_DETAILS)}
      footer={isHotelAdmin ? (
        <PrimaryButton
          label={savingProfile ? t(TRANSLATION_KEYS.HOTEL_DESK.SAVING) : t(TRANSLATION_KEYS.HOTEL_DESK.SAVE_PROFILE)}
          onPress={() => { void save(); }}
          disabled={savingProfile || !dirty}
        />
      ) : undefined}
    >
      <FieldLabel>{t(TRANSLATION_KEYS.HOTEL_DESK.PHONE)}</FieldLabel>
      <TextInput editable={isHotelAdmin} value={draft.phoneNumber} onChangeText={(value) => setField('phoneNumber', value)} keyboardType="phone-pad" placeholderTextColor={muted} className={inputClass} />
      <FieldLabel>{t(TRANSLATION_KEYS.PROFILE.EMAIL)}</FieldLabel>
      <TextInput editable={isHotelAdmin} value={draft.email} onChangeText={(value) => setField('email', value)} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={muted} className={inputClass} />
      <FieldLabel>{t(TRANSLATION_KEYS.HOTEL_DESK.WEBSITE)}</FieldLabel>
      <TextInput editable={isHotelAdmin} value={draft.website} onChangeText={(value) => setField('website', value)} autoCapitalize="none" placeholderTextColor={muted} className={inputClass} />
      <ChipEditor label={t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.AMENITIES)} items={draft.amenities} onChange={(items) => setField('amenities', items)} readOnly={!isHotelAdmin} />
      <ChipEditor label={t(TRANSLATION_KEYS.HOTEL_DESK.AMENITIES_BN)} items={draft.amenitiesBn} onChange={(items) => setField('amenitiesBn', items)} readOnly={!isHotelAdmin} />
      <ChipEditor label={t(TRANSLATION_KEYS.HOTEL_DESK.POLICIES)} items={draft.policies} onChange={(items) => setField('policies', items)} readOnly={!isHotelAdmin} />
      <ChipEditor label={t(TRANSLATION_KEYS.HOTEL_DESK.POLICIES_BN)} items={draft.policiesBn} onChange={(items) => setField('policiesBn', items)} readOnly={!isHotelAdmin} />
      <ChipEditor label={t(TRANSLATION_KEYS.HOTEL_DESK.NEARBY_TOURS)} items={draft.nearbyTourSpots} onChange={(items) => setField('nearbyTourSpots', items)} readOnly={!isHotelAdmin} />
      <ChipEditor label={t(TRANSLATION_KEYS.HOTEL_DESK.TOURS_BN)} items={draft.nearbyTourSpotsBn} onChange={(items) => setField('nearbyTourSpotsBn', items)} readOnly={!isHotelAdmin} />
      <ChipEditor label={t(TRANSLATION_KEYS.HOTEL_DESK.NEARBY_ACTIVITIES)} items={draft.nearbyActivitySpots} onChange={(items) => setField('nearbyActivitySpots', items)} readOnly={!isHotelAdmin} />
      <ChipEditor label={t(TRANSLATION_KEYS.HOTEL_DESK.ACTIVITIES_BN)} items={draft.nearbyActivitySpotsBn} onChange={(items) => setField('nearbyActivitySpotsBn', items)} readOnly={!isHotelAdmin} />
    </DeskScreen>
  );
}
