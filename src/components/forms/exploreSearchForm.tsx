import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { appAlert } from '../ui/appAlert';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { SearchableLocationInput } from '../ui/SearchableLocationInput';

interface Location {
  id: string;
  name: string;
}

interface ExploreSearchFormProps {
  locations: Location[];
  loadingLocations: boolean;
  onSearch: (filters: { locationId: string }) => void;
  canSearch?: boolean;
  onPreSearchValidationFail?: () => void;
  searching?: boolean;
}

export function ExploreSearchForm({
  locations,
  loadingLocations,
  onSearch,
  canSearch = true,
  onPreSearchValidationFail,
  searching = false,
}: ExploreSearchFormProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  const onPrimaryColor = isDark ? theme.colors['onPrimary-dark'] : theme.colors['onPrimary'];
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const handleSearch = () => {
    if (!selectedLocationId) {
      appAlert(
        t(TRANSLATION_KEYS.COMMON.ERROR),
        t(TRANSLATION_KEYS.EXPLORE.CHOOSE_LOCATION)
      , undefined, 'error');
      return;
    }

    if (!canSearch) {
      if (onPreSearchValidationFail) {
        onPreSearchValidationFail();
      }
      return;
    }

    onSearch({
      locationId: selectedLocationId,
    });
  };

  return (
    <View className="p-4 mb-6 bg-white border shadow dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
      {/* Searchable Location Input */}
      <SearchableLocationInput
        locations={locations}
        loadingLocations={loadingLocations}
        selectedLocationId={selectedLocationId}
        onLocationSelect={setSelectedLocationId}
      />

      {/* Search Button */}
      <TouchableOpacity
        onPress={handleSearch}
        disabled={searching || !selectedLocationId}
        className={`mt-2 p-4 rounded-lg flex-row items-center justify-center ${
          searching || !selectedLocationId
            ? 'bg-primary/50 dark:bg-primary-dark/50'
            : 'bg-primary dark:bg-primary-dark'
        }`}
      >
        {searching ? (
          <ActivityIndicator size="small" color={onPrimaryColor} style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="search" size={18} color={onPrimaryColor} style={{ marginRight: 8 }} />
        )}
        <Text className="font-bold text-white">{searching ? t(TRANSLATION_KEYS.EXPLORE.SEARCHING) : t(TRANSLATION_KEYS.EXPLORE.FIND_HOTELS)}</Text>
      </TouchableOpacity>
    </View>
  );
}
