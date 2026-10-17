/**
 * Full-screen stop editor used by the personal trip wizard.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScroll } from '../ui/KeyboardAwareScroll';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import {
  TRANSPORT_VALUES,
  WizardStop,
  formatEnumLabel,
} from '../../utils/tripPlanItinerary';
import { CatalogPickerModal } from './CatalogPickerModal';
import { CatalogPickKind, CatalogPickResult } from './catalogPickerTypes';
import { SelectedPlaceRow } from './SelectedPlaceRow';

export interface NamedOption {
  id: string;
  name: string;
  cost?: number;
  locationId?: string;
}

interface StopEditorSheetProps {
  visible: boolean;
  stop: WizardStop;
  divisionId: string;
  isLastStop: boolean;
  onClose: () => void;
  onSave: (stop: WizardStop) => void;
}

type PickerState = { kind: CatalogPickKind } | null;

export function StopEditorSheet({
  visible,
  stop,
  divisionId,
  isLastStop,
  onClose,
  onSave,
}: StopEditorSheetProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const [draft, setDraft] = useState<WizardStop>(stop);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState>(null);

  React.useEffect(() => {
    setDraft(stop);
    setError(null);
    setPicker(null);
  }, [stop, visible]);

  const save = () => {
    if (!draft.tourSpotId) {
      setError(t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_NEED_SPOT));
      return;
    }
    if (draft.shortDescription.trim().length < 2) {
      setError(t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_NEED_DESC));
      return;
    }
    onSave({
      ...draft,
      shortDescription: draft.shortDescription.trim(),
      hotelOption: isLastStop ? draft.hotelOption : '',
      hotelId: isLastStop ? draft.hotelId : '',
      hotelName: isLastStop ? draft.hotelName : undefined,
      hotelCost: isLastStop ? draft.hotelCost : 0,
      hotelImageUrl: isLastStop ? draft.hotelImageUrl : undefined,
    });
  };

  const applyCatalogPick = (kind: CatalogPickKind, pick: CatalogPickResult) => {
    if (kind === 'tourSpot') {
      setDraft((prev) => ({
        ...prev,
        tourSpotId: pick.id,
        tourSpotName: pick.name,
        tourSpotImageUrl: pick.imageUrl,
        shortDescription:
          prev.shortDescription.trim().length < 2 ? pick.name.slice(0, 200) : prev.shortDescription,
      }));
      return;
    }
    if (kind === 'activity') {
      setDraft((prev) => ({
        ...prev,
        activitySpotId: pick.id,
        activitySpotName: pick.name,
        activitySpotImageUrl: pick.imageUrl,
        activityCost: pick.cost ?? 0,
      }));
      return;
    }
    setDraft((prev) => ({
      ...prev,
      hotelId: pick.id,
      hotelName: pick.name,
      hotelImageUrl: pick.imageUrl,
      hotelCost: pick.cost ?? 0,
      hotelOption: pick.hotelType || prev.hotelOption,
    }));
  };

  const transportChip = (value: string) => {
    const selected = draft.transportOption === value;
    return (
      <TouchableOpacity
        key={value}
        onPress={() =>
          setDraft((prev) => ({
            ...prev,
            transportOption: selected ? '' : value,
          }))
        }
        className={`flex-row items-center px-3 py-2.5 rounded-full border ${
          selected ? 'bg-primary border-primary' : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'
        }`}
      >
        {selected ? <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 4 }} /> : null}
        <Text className={selected ? 'text-white text-sm font-medium' : 'text-text dark:text-text-dark text-sm'}>
          {formatEnumLabel(value)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
          <View className="px-4 py-3 flex-row items-center border-b border-border dark:border-border-dark">
            <Text className="flex-1 text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_TITLE, {
                day: draft.dayNumber,
                order: draft.segmentOrder,
              })}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={24} color={mutedColor} />
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <KeyboardAwareScroll
              avoiding={false}
              className="flex-1 px-4 pt-4"
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_DESC)}
              </Text>
              <TextInput
                value={draft.shortDescription}
                onChangeText={(shortDescription) => setDraft((prev) => ({ ...prev, shortDescription }))}
                multiline
                textAlignVertical="top"
                placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_DESC_PH)}
                placeholderTextColor={mutedColor}
                className="border border-border dark:border-border-dark rounded-xl px-3 py-3 text-text dark:text-text-dark mb-4 min-h-[96px] bg-surface dark:bg-surface-dark"
              />

              <View className="rounded-2xl p-3 mb-4 bg-surface dark:bg-surface-dark">
                <Text className="text-sm font-bold text-text dark:text-text-dark mb-1">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_PLACES_SECTION)}
                </Text>
                <SelectedPlaceRow
                  label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TOUR_SPOT)}
                  required
                  emptyLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CHOOSE_TOUR_SPOT)}
                  emptyIcon="map-outline"
                  value={
                    draft.tourSpotId
                      ? {
                          id: draft.tourSpotId,
                          name: draft.tourSpotName,
                          imageUrl: draft.tourSpotImageUrl,
                          subtitle: draft.tourSpotName,
                        }
                      : undefined
                  }
                  onPressChoose={() => setPicker({ kind: 'tourSpot' })}
                  onPressChange={() => setPicker({ kind: 'tourSpot' })}
                />
                <SelectedPlaceRow
                  label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ACTIVITY)}
                  emptyLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CHOOSE_ACTIVITY)}
                  emptyIcon="bicycle-outline"
                  value={
                    draft.activitySpotId
                      ? {
                          id: draft.activitySpotId,
                          name: draft.activitySpotName,
                          imageUrl: draft.activitySpotImageUrl,
                          cost: draft.activityCost,
                        }
                      : undefined
                  }
                  onPressChoose={() => setPicker({ kind: 'activity' })}
                  onPressChange={() => setPicker({ kind: 'activity' })}
                  onPressRemove={() =>
                    setDraft((prev) => ({
                      ...prev,
                      activitySpotId: undefined,
                      activitySpotName: undefined,
                      activitySpotImageUrl: undefined,
                      activityCost: 0,
                    }))
                  }
                />
                {isLastStop ? (
                  <SelectedPlaceRow
                    label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HOTEL)}
                    emptyLabel={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CHOOSE_HOTEL)}
                    emptyIcon="bed-outline"
                    value={
                      draft.hotelId
                        ? {
                            id: draft.hotelId,
                            name: draft.hotelName,
                            imageUrl: draft.hotelImageUrl,
                            subtitle: draft.hotelOption ? formatEnumLabel(draft.hotelOption) : undefined,
                            cost: draft.hotelCost,
                          }
                        : undefined
                    }
                    onPressChoose={() => setPicker({ kind: 'hotel' })}
                    onPressChange={() => setPicker({ kind: 'hotel' })}
                    onPressRemove={() =>
                      setDraft((prev) => ({
                        ...prev,
                        hotelId: '',
                        hotelName: undefined,
                        hotelImageUrl: undefined,
                        hotelCost: 0,
                      }))
                    }
                  />
                ) : (
                  <SelectedPlaceRow
                    label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HOTEL)}
                    emptyLabel=""
                    emptyIcon="bed-outline"
                    disabled
                    disabledHint={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HOTEL_LAST_ONLY)}
                    onPressChoose={() => {}}
                    onPressChange={() => {}}
                  />
                )}
              </View>

              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TRANSPORT)}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">{TRANSPORT_VALUES.map(transportChip)}</View>

              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_NOTES)}
              </Text>
              <TextInput
                value={draft.notes || ''}
                onChangeText={(notes) => setDraft((prev) => ({ ...prev, notes }))}
                multiline
                textAlignVertical="top"
                placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_NOTES_PH)}
                placeholderTextColor={mutedColor}
                className="border border-border dark:border-border-dark rounded-xl px-3 py-3 text-text dark:text-text-dark mb-2 min-h-[80px] bg-surface dark:bg-surface-dark"
              />
            </KeyboardAwareScroll>
            <View className="px-4 py-3 border-t border-border dark:border-border-dark">
              {error ? <Text className="text-error text-sm mb-2 text-center">{error}</Text> : null}
              <TouchableOpacity onPress={save} className="bg-primary rounded-xl py-3.5 items-center">
                <Text className="text-onPrimary font-semibold">{t(TRANSLATION_KEYS.COMMON.SAVE)}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {picker ? (
        <CatalogPickerModal
          visible
          kind={picker.kind}
          divisionId={divisionId}
          selectedId={
            picker.kind === 'tourSpot'
              ? draft.tourSpotId
              : picker.kind === 'activity'
                ? draft.activitySpotId
                : draft.hotelId
          }
          onClose={() => setPicker(null)}
          onSelect={(pick) => applyCatalogPick(picker.kind, pick)}
        />
      ) : null}
    </>
  );
}
