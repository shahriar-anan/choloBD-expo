/**
 * Full-screen stop editor used by the personal trip wizard.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { appAlert } from '../ui/appAlert';
import { Feather, Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScroll } from '../ui/KeyboardAwareScroll';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import {
  TRANSPORT_VALUES,
  WizardStop,
  formatEnumLabel,
  formatTaka,
} from '../../utils/tripPlanItinerary';
import { CatalogPickerModal } from './CatalogPickerModal';
import { CatalogPickKind, CatalogPickResult } from './catalogPickerTypes';
import { SelectedPlaceRow } from './SelectedPlaceRow';
import { StopCostLines } from './budget/StopCostLines';
import { applyQuoteToStops, budgetState, stopTotal } from '../../utils/tripBudget';
import { toneColor } from './budget/BudgetMeter';
import { usePlanQuote } from '../../hooks/usePlanQuote';

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
  budget?: number;
  otherStops?: WizardStop[];
  onClose: () => void;
  onSave: (stop: WizardStop) => void;
}

type PickerState = { kind: CatalogPickKind } | null;

export function StopEditorSheet({
  visible,
  stop,
  divisionId,
  isLastStop,
  budget = 0,
  otherStops = [],
  onClose,
  onSave,
}: StopEditorSheetProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const keyboardOpen = useKeyboardVisible();
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const [draft, setDraft] = useState<WizardStop>(stop);
  const [movedFromOrder, setMovedFromOrder] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState>(null);
  const [showLines, setShowLines] = useState(false);
  const baselineRef = useRef(JSON.stringify(stop));
  const otherStopsRef = useRef(otherStops);
  otherStopsRef.current = otherStops;
  const quoteInput = useMemo(() => [...otherStops, draft], [otherStops, draft]);
  const { quote, totals } = usePlanQuote(quoteInput, budget, visible);
  const pricedDraft =
    totals.source === 'quote' && quote?.stops ? applyQuoteToStops([draft], quote.stops)[0] : draft;

  React.useEffect(() => {
    if (!visible) return;
    const source = isLastStop && !stop.hotelId
      ? [...otherStopsRef.current].reverse().find((item) => item.dayNumber === stop.dayNumber && item.hotelId)
      : undefined;
    const next: WizardStop = source?.hotelId
      ? {
          ...stop,
          hotelId: source.hotelId,
          hotelName: source.hotelName,
          hotelImageUrl: source.hotelImageUrl,
          hotelCost: source.hotelCost || 0,
          hotelOption: source.hotelOption || '',
          hotelRoomType: source.hotelRoomType,
        }
      : stop;
    setDraft(next);
    setMovedFromOrder(source?.hotelId ? source.segmentOrder : null);
    baselineRef.current = JSON.stringify(next);
    setError(null);
    setPicker(null);
  }, [stop, visible, isLastStop]);

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
      activityCost: pricedDraft.activityCost ?? draft.activityCost,
      hotelOption: isLastStop ? draft.hotelOption : '',
      hotelId: isLastStop ? draft.hotelId : '',
      hotelName: isLastStop ? (pricedDraft.hotelName || draft.hotelName) : undefined,
      hotelRoomType: isLastStop ? (pricedDraft.hotelRoomType || draft.hotelRoomType) : undefined,
      hotelCost: isLastStop ? (pricedDraft.hotelCost ?? draft.hotelCost ?? 0) : 0,
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
    if (kind === 'hotel') {
      setMovedFromOrder(null);
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
      hotelRoomType: undefined,
    }));
  };

  const thisStopTotal = stopTotal(pricedDraft);
  const afterState = budgetState(totals.plannedTotal, budget);
  const remainingForKind = (kind: CatalogPickKind) => {
    const currentCost =
      kind === 'activity' ? pricedDraft.activityCost || 0 : kind === 'hotel' ? pricedDraft.hotelCost || 0 : 0;
    return budget - (totals.plannedTotal - currentCost);
  };
  const requestClose = () => {
    if (JSON.stringify(draft) === baselineRef.current) {
      onClose();
      return;
    }
    appAlert(
      t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DISCARD_STOP_TITLE),
      t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DISCARD_STOP_BODY),
      [
        { text: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_KEEP_EDITING), style: 'cancel' },
        { text: t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_DISCARD_CONFIRM), style: 'destructive', onPress: onClose },
      ]
    );
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
      <Modal visible={visible} animationType="slide" onRequestClose={requestClose}>
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
          <View className="px-4 py-3 flex-row items-center border-b border-border dark:border-border-dark">
            <Text className="flex-1 text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>
              {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_STOP_TITLE, {
                day: draft.dayNumber,
                order: draft.segmentOrder,
              })}
            </Text>
            <TouchableOpacity onPress={requestClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={24} color={mutedColor} />
            </TouchableOpacity>
          </View>
            <KeyboardAwareScroll
              className="flex-1 px-4 pt-4"
              contentContainerStyle={{ paddingBottom: 24 }}
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
                            subtitle: [
                              draft.hotelRoomType ? formatEnumLabel(draft.hotelRoomType) : draft.hotelOption ? formatEnumLabel(draft.hotelOption) : undefined,
                              typeof pricedDraft.hotelCost === 'number' && pricedDraft.hotelCost > 0
                                ? t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_PER_NIGHT, { amount: formatTaka(pricedDraft.hotelCost) })
                                : undefined,
                            ]
                              .filter(Boolean)
                              .join(' · '),
                            cost: pricedDraft.hotelCost,
                          }
                        : undefined
                    }
                    onPressChoose={() => setPicker({ kind: 'hotel' })}
                    onPressChange={() => setPicker({ kind: 'hotel' })}
                    footnote={
                      movedFromOrder != null && draft.hotelId
                        ? t(TRANSLATION_KEYS.TRIP_PLANNER.HOTEL_MOVED, { order: movedFromOrder })
                        : undefined
                    }
                    onPressRemove={() => {
                      setMovedFromOrder(null);
                      setDraft((prev) => ({
                        ...prev,
                        hotelId: '',
                        hotelName: undefined,
                        hotelImageUrl: undefined,
                        hotelOption: '',
                        hotelRoomType: undefined,
                        hotelCost: 0,
                      }));
                    }}
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
            {keyboardOpen ? null : (
            <View className="px-4 py-3 border-t border-border dark:border-border-dark">
              {error ? <Text className="text-error text-sm mb-2 text-center">{error}</Text> : null}
              <View className="flex-row justify-between mb-3">
                <Text className="text-sm font-semibold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_THIS_STOP, { amount: formatTaka(thisStopTotal) })}
                </Text>
                <Text className="text-sm font-semibold" style={{ color: toneColor(afterState.tone, isDark) }}>
                  {totals.isUpdating
                    ? t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_UPDATING)
                    : afterState.tone === 'over'
                      ? t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_OVER_AFTER, { amount: formatTaka(afterState.overBy) })
                      : t(TRANSLATION_KEYS.TRIP_PLANNER.BUDGET_LEFT_AFTER, { amount: formatTaka(afterState.remaining) })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLines((open) => !open)} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text className="text-xs font-semibold text-primary">
                  {showLines
                    ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_HIDE_STOP_LINES)
                    : t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEE_STOP_LINES)}
                </Text>
              </TouchableOpacity>
              {showLines ? (
                <StopCostLines
                  hasActivity={Boolean(pricedDraft.activitySpotId)}
                  activityCost={pricedDraft.activityCost}
                  showHotel={isLastStop && Boolean(pricedDraft.hotelId)}
                  hotelCost={pricedDraft.hotelCost}
                  hotelRoomType={pricedDraft.hotelRoomType || draft.hotelRoomType}
                  transportOption={draft.transportOption}
                  total={thisStopTotal}
                />
              ) : null}
              <TouchableOpacity onPress={save} className="bg-primary rounded-xl py-3.5 items-center mt-3">
                <Text className="text-onPrimary font-semibold">{t(TRANSLATION_KEYS.COMMON.SAVE)}</Text>
              </TouchableOpacity>
            </View>
            )}
        </SafeAreaView>
      </Modal>

      {picker ? (
        <CatalogPickerModal
          visible
          kind={picker.kind}
          divisionId={divisionId}
          remainingBudget={remainingForKind(picker.kind)}
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
