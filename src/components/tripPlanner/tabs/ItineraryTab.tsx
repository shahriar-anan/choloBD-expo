/**
 * Itinerary Tab Component
 * Trip-level notes list for packing lists, reminders, and travel notes
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { appAlert } from '../../ui/appAlert';
import { Feather } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TripPlan } from '../../../types/trips';
import { updateTripAsync } from '../../../store/slices/tripPlannerSlice';
import type { AppDispatch } from '../../../store/store';

interface ItineraryTabProps {
  trip: TripPlan;
  onTripUpdate?: (updatedTrip: TripPlan) => void;
}

const MAX_CHARS = 5000;
const CHAR_THRESHOLD = 4000; // 80% of max

export function ItineraryTab({ trip, onTripUpdate }: ItineraryTabProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  // Build color palette based on theme
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const backgroundColor = isDark ? theme.colors['background-dark'] : theme.colors.background;

  const [notesList, setNotesList] = useState<string[]>(trip.generalNotes || []);
  const [newNote, setNewNote] = useState('');
  const [isEditing, setIsEditing] = useState((trip.generalNotes?.length || 0) === 0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate total character count
  const totalCharCount = notesList.reduce((sum, note) => sum + note.length, 0);
  const hasUnsavedChanges = JSON.stringify(notesList) !== JSON.stringify(trip.generalNotes || []);

  const addNote = () => {
    const trimmedNote = newNote.trim();
    
    if (!trimmedNote) {
      setError(t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_NOTE_EMPTY_ERROR));
      return;
    }

    if (trimmedNote.length > 500) {
      setError(t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_NOTE_LENGTH_ERROR));
      return;
    }

    const newTotal = totalCharCount + trimmedNote.length;
    if (newTotal > MAX_CHARS) {
      setError(t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CHAR_LIMIT_ERROR, { current: totalCharCount, total: newTotal }));
      return;
    }

    setNotesList([...notesList, trimmedNote]);
    setNewNote('');
    setError(null);
  };

  const deleteNote = (index: number) => {
    setNotesList(notesList.filter((_, i) => i !== index));
    setError(null);
  };

  const validateNotes = (): boolean => {
    if (totalCharCount > MAX_CHARS) {
      setError(t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CHAR_LIMIT_ERROR, { current: totalCharCount, total: totalCharCount }));
      return false;
    }
    
    if (notesList.some(note => !note || note.trim().length === 0)) {
      setError(t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_NOTE_EMPTY_ERROR));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateNotes()) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await dispatch(
        updateTripAsync({
          id: trip.id,
          payload: { generalNotes: notesList.length > 0 ? notesList : undefined },
        })
      );

      if (result.payload) {
        const updatedTrip = result.payload as TripPlan;
        setIsEditing(false);
        
        if (onTripUpdate) {
          onTripUpdate(updatedTrip);
        }

        appAlert('Success', t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_NOTES_SAVED, { count: notesList.length }), undefined, 'success');
      } else {
        throw new Error('Failed to save notes');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save notes';
      if (__DEV__) console.error('[ItineraryTab] Error saving notes:', err);
      setError(errorMsg);
      appAlert('Error', errorMsg, undefined, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    appAlert(
      t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CLEAR_ALL_CONFIRM),
      t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CLEAR_ALL_WARNING),
      [
        { text: t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CANCEL_BTN), onPress: () => {} },
        {
          text: t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CLEAR_ALL_BTN),
          onPress: () => {
            setNotesList([]);
            setNewNote('');
            setError(null);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      appAlert(
        t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_DISCARD_CHANGES),
        t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_DISCARD_WARNING),
        [
          { text: t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_KEEP_EDITING), onPress: () => {} },
          {
            text: t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_DISCARD),
            onPress: () => {
              console.log('[ItineraryTab] Discarding changes');
              setNotesList(trip.generalNotes || []);
              setNewNote('');
              setError(null);
              setIsEditing(false);
            },
            style: 'destructive',
          },
        ]
      );
    } else {
      setIsEditing(false);
    }
  };

  // Empty state
  if (!isEditing && (!notesList || notesList.length === 0)) {
    return (
      <View className="items-center justify-center flex-1 px-4 py-12">
        <Feather name="edit-3" size={48} color={mutedColor} />
        <Text className="mt-4 text-lg font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_EMPTY_TITLE)}
        </Text>
        <Text className="mt-2 mb-6 text-sm text-center text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_EMPTY_SUBTITLE)}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setIsEditing(true);
          }}
          className="flex-row items-center px-6 py-3 rounded-lg bg-primary"
        >
          <Feather name="plus" size={18} color="white" />
          <Text className="ml-2 font-semibold text-white">{t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_ADD_NOTES_BTN)}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Edit mode
  if (isEditing) {
    const charPercentage = (totalCharCount / MAX_CHARS) * 100;
    const isNearLimit = totalCharCount > CHAR_THRESHOLD;
    const progressColor = isNearLimit ? '#EF4444' : '#10B981';

    return (
      <View className="flex-1 px-4 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_NOTES_TITLE)} ({notesList.length})
          </Text>
          <TouchableOpacity onPress={handleCancel} disabled={isSaving}>
            <Feather name="x" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View className="p-3 mb-4 border rounded-lg" style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'], borderColor: isDark ? theme.colors['error-dark'] : theme.colors.error }}>
            <Text style={{ color: isDark ? theme.colors['error-dark'] : theme.colors.error }}>{error}</Text>
          </View>
        )}

        {/* Add Note Input */}
        <View className="flex-row gap-2 mb-4">
          <TextInput
            value={newNote}
            onChangeText={setNewNote}
            placeholder={t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_NOTE_PLACEHOLDER)}
            placeholderTextColor={mutedColor}
            maxLength={500}
            className="flex-1 px-3 py-2 border rounded-lg bg-surface dark:bg-surface-dark border-border dark:border-border-dark text-text dark:text-text-dark"
            style={{
              color: textColor,
            }}
            editable={!isSaving}
          />
          <TouchableOpacity
            onPress={addNote}
            disabled={isSaving || !newNote.trim()}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: isSaving || !newNote.trim() ? (isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2']) : theme.colors.primary, opacity: isSaving || !newNote.trim() ? 0.6 : 1 }}
          >
            <Feather name="plus" size={20} color={isSaving || !newNote.trim() ? (isDark ? theme.colors['muted-dark'] : theme.colors.muted) : 'white'} />
          </TouchableOpacity>
        </View>

        {/* Notes List */}
        <View className="flex-1 mb-4 border rounded-lg bg-surface dark:bg-surface-dark border-border dark:border-border-dark p-3">
          {notesList.length === 0 ? (
            <Text className="text-sm text-center text-muted dark:text-muted-dark py-8">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_EMPTY_NOTES_MSG)}
            </Text>
          ) : (
            <FlatList
              data={notesList}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View className="flex-row items-center gap-3 mb-3 p-3 rounded-lg" style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
                  <View className="flex-1">
                    <Text className="text-sm text-text dark:text-text-dark">{item}</Text>
                    <Text className="text-xs text-muted dark:text-muted-dark mt-1">
                      {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CHAR_COUNT, { current: item.length })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteNote(index)}
                    disabled={isSaving}
                  >
                    <Feather name="trash-2" size={18} color={isDark ? theme.colors['error-dark'] : theme.colors.error} />
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Character Counter */}
        <View className="mb-4">
          {/* Progress Bar */}
          <View className="h-2 mb-2 overflow-hidden rounded-full" style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'] }}>
            <View
              style={{
                width: `${Math.min(charPercentage, 100)}%`,
                height: '100%',
                backgroundColor: progressColor,
              }}
            />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold" style={{ color: isNearLimit ? (isDark ? theme.colors['error-dark'] : theme.colors.error) : (isDark ? theme.colors['success-dark'] : theme.colors.success) }}>
              {totalCharCount} / {MAX_CHARS}
            </Text>
            {isNearLimit && (
              <Text className="text-xs" style={{ color: isDark ? theme.colors['error-dark'] : theme.colors.error }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CHARS_REMAINING, { remaining: MAX_CHARS - totalCharCount })}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleCancel}
            disabled={isSaving}
            className="items-center flex-1 py-3 rounded-lg"
            style={{ backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'], opacity: isSaving ? 0.6 : 1 }}
          >
            <Text className="font-semibold text-text dark:text-text-dark">
              {hasUnsavedChanges ? t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CANCEL_BTN) : t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_DONE_BTN)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClear}
            disabled={isSaving || notesList.length === 0}
            className="flex-1 rounded-lg py-3 items-center"
            style={{ backgroundColor: isSaving || notesList.length === 0 ? (isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2']) : (isDark ? theme.colors['error-dark'] + '20' : theme.colors.error + '20'), opacity: isSaving || notesList.length === 0 ? 0.6 : 1 }}
          >
            <Text className="font-semibold" style={{ color: isSaving || notesList.length === 0 ? (isDark ? theme.colors['muted-dark'] : theme.colors.muted) : (isDark ? theme.colors['error-dark'] : theme.colors.error) }}>
              {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CLEAR_ALL_BTN)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`flex-1 rounded-lg py-3 items-center flex-row justify-center ${
              isSaving || !hasUnsavedChanges
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'bg-primary'
            }`}
          >
            {isSaving && <Feather name="loader" size={16} color="white" />}
            <Text className={`font-semibold ${isSaving || !hasUnsavedChanges ? 'text-muted dark:text-muted-dark' : 'text-white'}`}>
              {isSaving ? t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_SAVING_BTN) : t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_SAVE_BTN)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Display mode
  return (
    <View className="flex-1 px-4 py-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_NOTES_TITLE)} ({notesList.length})
        </Text>
        <TouchableOpacity
          onPress={() => {
            setIsEditing(true);
          }}
        >
          <Feather name="edit" size={20} color={primaryColor} />
        </TouchableOpacity>
      </View>

      {/* Notes List */}
      <FlatList
        data={notesList}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View className="flex-row items-start gap-3 mb-3 p-3 rounded-lg bg-surface dark:bg-surface-dark border border-border dark:border-border-dark">
            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mt-0.5">
              <Text className="text-xs font-bold text-white">{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm text-text dark:text-text-dark leading-5">{item}</Text>
              <Text className="text-xs text-muted dark:text-muted-dark mt-1">
                {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_CHAR_COUNT, { current: item.length })}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-sm text-center text-muted dark:text-muted-dark py-8">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_EMPTY_NOTES_MSG)}
          </Text>
        }
        scrollEnabled={false}
      />

      {/* Info Footer */}
      <View className="p-3 mt-4 border rounded-lg" style={{ backgroundColor: isDark ? theme.colors['primary-dark'] + '10' : theme.colors.primary + '10', borderColor: isDark ? theme.colors['primary-dark'] + '40' : theme.colors.primary + '30' }}>
        <View className="flex-row items-flex-start">
          <Feather name="info" size={16} color={isDark ? theme.colors['primary-dark'] : theme.colors.primary} />
          <Text className="flex-1 ml-2 text-xs text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.ITINERARY_INFO_FOOTER, { current: totalCharCount, remaining: MAX_CHARS - totalCharCount })}
          </Text>
        </View>
      </View>
    </View>
  );
}
