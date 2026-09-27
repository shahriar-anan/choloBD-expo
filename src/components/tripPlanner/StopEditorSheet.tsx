/**
 * Full-screen stop editor used by the personal trip wizard.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { getApiInstance } from '../../services/api/axiosClient';
import { unwrapList } from '../../services/api/personalPlanMapping';
import {
  HOTEL_VALUES,
  TRANSPORT_VALUES,
  WizardStop,
  formatEnumLabel,
  formatTaka,
} from '../../utils/tripPlanItinerary';

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

function readCost(raw: any): number {
  const roomPrice = Array.isArray(raw?.roomTypes)
    ? raw.roomTypes.map((room: any) => Number(room?.pricePerNight)).find((price: number) => Number.isFinite(price))
    : undefined;
  const value = raw?.entryFee ?? raw?.entryCost ?? raw?.cost ?? roomPrice ?? raw?.pricePerNight ?? raw?.basePrice;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNamed(raw: any): NamedOption {
  return {
    id: raw.id,
    name: raw.name || 'Untitled',
    cost: readCost(raw),
    locationId: raw.locationId || raw.location?.id,
  };
}

function DivisionSearchList({
  label,
  endpoint,
  divisionId,
  hotelType,
  selectedId,
  selectedName,
  onSelect,
  allowClear,
  placeholder,
  suggestOnType = false,
}: {
  label: string;
  endpoint: string;
  divisionId: string;
  hotelType?: string;
  selectedId?: string;
  selectedName?: string;
  onSelect: (option: NamedOption | null) => void;
  allowClear?: boolean;
  placeholder: string;
  suggestOnType?: boolean;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<NamedOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!divisionId || (suggestOnType && !query.trim())) {
      setOptions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      (async () => {
        setLoading(true);
        try {
          const api = getApiInstance();
          const res = await api.get(endpoint, {
            params: {
              divisionId,
              limit: 50,
              ...(query.trim() ? { name: query.trim() } : {}),
              ...(hotelType ? { hotelType } : {}),
            },
          });
          if (!cancelled) setOptions(unwrapList<any>(res.data?.data).map(toNamed));
        } catch {
          if (!cancelled) setOptions([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [divisionId, endpoint, hotelType, query, suggestOnType]);

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">{label}</Text>
      {selectedName ? (
        <Text className="text-xs text-primary mb-2">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SELECTED)}: {selectedName}
        </Text>
      ) : null}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        autoCorrect={false}
        className="border border-border dark:border-border-dark rounded-lg px-3 py-2 text-text dark:text-text-dark mb-2"
      />
      {allowClear && selectedId ? (
        <TouchableOpacity onPress={() => onSelect(null)} className="mb-2">
          <Text className="text-xs text-primary">{t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CLEAR_CATALOG)}</Text>
        </TouchableOpacity>
      ) : null}
      {loading && (!suggestOnType || query.trim()) ? <ActivityIndicator className="my-2" /> : null}
      {!divisionId ? (
        <Text className="text-xs text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_NEED_DIVISION)}
        </Text>
      ) : null}
      {options.map((option) => {
        const selected = option.id === selectedId;
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => {
              onSelect(option);
              if (suggestOnType) setQuery('');
            }}
            className={`px-3 py-2 rounded-lg mb-1 ${selected ? 'bg-primary' : 'bg-surface dark:bg-surface-dark'}`}
          >
            <Text className={selected ? 'text-onPrimary font-semibold' : 'text-text dark:text-text-dark'}>
              {option.name}
              {option.cost ? ` · ${formatTaka(option.cost)}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
      {!loading && divisionId && (!suggestOnType || query.trim()) && options.length === 0 ? (
        <Text className="text-xs text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_EMPTY)}
        </Text>
      ) : null}
    </View>
  );
}

export function StopEditorSheet({
  visible,
  stop,
  divisionId,
  isLastStop,
  onClose,
  onSave,
}: StopEditorSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<WizardStop>(stop);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setDraft(stop);
    setError(null);
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
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <View className="px-4 py-3 flex-row items-center justify-between border-b border-border dark:border-border-dark">
          <Text className="text-lg font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_TITLE, {
              day: draft.dayNumber,
              order: draft.segmentOrder,
            })}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
          <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_DESC)}
          </Text>
          <TextInput
            value={draft.shortDescription}
            onChangeText={(shortDescription) => setDraft((prev) => ({ ...prev, shortDescription }))}
            multiline
            placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_DESC_PH)}
            placeholderTextColor="#94A3B8"
            className="border border-border dark:border-border-dark rounded-lg px-3 py-3 text-text dark:text-text-dark mb-4 min-h-[88px]"
          />
          <DivisionSearchList
            label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TOUR_SPOT)}
            endpoint="/api/tour-spots"
            divisionId={divisionId}
            placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_SPOTS)}
            suggestOnType
            selectedId={draft.tourSpotId}
            selectedName={draft.tourSpotName}
            onSelect={(option) =>
              setDraft((prev) => ({
                ...prev,
                tourSpotId: option?.id || '',
                tourSpotName: option?.name,
              }))
            }
          />
          <DivisionSearchList
            label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_ACTIVITY)}
            endpoint="/api/activity-spots"
            divisionId={divisionId}
            placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_ACTIVITIES)}
            suggestOnType
            selectedId={draft.activitySpotId}
            selectedName={draft.activitySpotName}
            allowClear
            onSelect={(option) =>
              setDraft((prev) => ({
                ...prev,
                activitySpotId: option?.id,
                activitySpotName: option?.name,
                activityCost: option?.cost || 0,
              }))
            }
          />
          <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_TRANSPORT)}
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {TRANSPORT_VALUES.map((value) => {
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
                  className={`px-3 py-2 rounded-full ${selected ? 'bg-primary' : 'bg-surface dark:bg-surface-dark'}`}
                >
                  <Text className={selected ? 'text-onPrimary text-xs' : 'text-text dark:text-text-dark text-xs'}>
                    {formatEnumLabel(value)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {isLastStop ? (
            <>
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HOTEL_TYPE)}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {HOTEL_VALUES.map((value) => {
                  const selected = draft.hotelOption === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setDraft((prev) => ({
                          ...prev,
                          hotelOption: selected ? '' : value,
                        }))
                      }
                      className={`px-3 py-2 rounded-full ${selected ? 'bg-primary' : 'bg-surface dark:bg-surface-dark'}`}
                    >
                      <Text className={selected ? 'text-onPrimary text-xs' : 'text-text dark:text-text-dark text-xs'}>
                        {formatEnumLabel(value)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <DivisionSearchList
                label={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HOTEL)}
                endpoint="/api/hotels"
                divisionId={divisionId}
                hotelType={draft.hotelOption || undefined}
                placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_HOTELS)}
                selectedId={draft.hotelId}
                selectedName={draft.hotelName}
                allowClear
                onSelect={(option) =>
                  setDraft((prev) => ({
                    ...prev,
                    hotelId: option?.id || '',
                    hotelName: option?.name,
                    hotelCost: option?.cost || 0,
                  }))
                }
              />
            </>
          ) : (
            <Text className="text-xs text-muted dark:text-muted-dark mb-4">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HOTEL_LAST_ONLY)}
            </Text>
          )}
          <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_NOTES)}
          </Text>
          <TextInput
            value={draft.notes || ''}
            onChangeText={(notes) => setDraft((prev) => ({ ...prev, notes }))}
            multiline
            placeholderTextColor="#94A3B8"
            className="border border-border dark:border-border-dark rounded-lg px-3 py-3 text-text dark:text-text-dark mb-4"
          />
          {error ? <Text className="text-error mb-3">{error}</Text> : null}
        </ScrollView>
        <View className="px-4 py-3 border-t border-border dark:border-border-dark">
          <TouchableOpacity onPress={save} className="bg-primary rounded-lg py-3 items-center">
            <Text className="text-onPrimary font-semibold">{t(TRANSLATION_KEYS.COMMON.SAVE)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
