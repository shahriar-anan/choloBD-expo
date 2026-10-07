import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { Location } from '../../types/locations';

interface SearchableLocationInputProps {
  locations: Location[];
  loadingLocations: boolean;
  selectedLocationId: string;
  onLocationSelect: (locationId: string) => void;
  label?: string;
}

export function SearchableLocationInput({
  locations,
  loadingLocations,
  selectedLocationId,
  onLocationSelect,
  label,
}: SearchableLocationInputProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const bgColor = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  // Helper function to format location display
  const getLocationDisplay = (location: Location) => {
    if (!location.locationType) return location.name;
    
    // Format: "Dhaka (District, Dhaka Division)"
    const type = location.locationType.charAt(0) + location.locationType.slice(1).toLowerCase();
    const parent = location.state ? `, ${location.state}` : '';
    return `${location.name} (${type}${parent})`;
  };

  const getLocationSubtitle = (location: Location) => {
    if (!location.state && !location.country) return '';
    return `${location.state || ''}${location.state && location.country ? ', ' : ''}${location.country || ''}`.trim();
  };

  // Filter locations based on search text
  const filteredLocations = useMemo(() => {
    if (!searchText.trim()) return locations;
    return locations.filter((location) =>
      location.name.toLowerCase().includes(searchText.toLowerCase()) ||
      location.state?.toLowerCase().includes(searchText.toLowerCase()) ||
      location.locationType?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, locations]);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  const handleLocationSelect = (locationId: string) => {
    const loc = locations.find((l) => l.id === locationId);
    onLocationSelect(locationId);
    setSearchText(loc ? loc.name : '');
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputChange = (text: string) => {
    setSearchText(text);
    // When user clears the search, also clear the selected location
    if (text === '') {
      onLocationSelect('');
    }
  };

  const handleClear = () => {
    setSearchText('');
    onLocationSelect(''); // Also clear the selected location
    setShowDropdown(false);
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
        {label ?? t('explore.searchLocation')}
      </Text>

      {/* Search Input */}
      <View
        className="flex-row items-center px-3 py-2 border rounded-lg"
        style={{
          borderColor,
          backgroundColor: surfaceColor,
          borderWidth: 1,
        }}
      >
        <Ionicons name="search" size={18} color={primaryColor} />
        <TextInput
          placeholder={t('explore.typeLocationPlaceholder')}
          placeholderTextColor={mutedColor}
          value={searchText}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 8,
            color: textColor,
            fontSize: 14,
          }}
        />
        {(searchText || selectedLocationId) && (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="close-circle" size={18} color={mutedColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown Results */}
      {showDropdown && (
        <View
          className="z-10 mt-2 overflow-hidden bg-white border rounded-lg border-border dark:border-border-dark dark:bg-surface-dark max-h-64"
          style={{ borderColor }}
        >
          {loadingLocations ? (
            <View className="items-center p-4">
              <ActivityIndicator size="small" color={primaryColor} />
            </View>
          ) : filteredLocations.length === 0 ? (
            <View className="items-center p-4">
              <Text className="text-muted dark:text-muted-dark">{t('explore.noLocations')}</Text>
            </View>
          ) : (
            <ScrollView
              nestedScrollEnabled={true}
              scrollEnabled={filteredLocations.length > 6}
              style={{ maxHeight: 256 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {filteredLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  activeOpacity={0.7}
                  onPress={() => handleLocationSelect(location.id)}
                  className={`p-4 border-b border-border dark:border-border-dark`}
                  style={{
                    backgroundColor:
                      selectedLocationId === location.id
                        ? `${primaryColor}20`
                        : bgColor,
                  }}
                >
                  <View className="flex-row items-start">
                    <Ionicons name="location" size={16} color={primaryColor} style={{ marginRight: 8, marginTop: 2 }} />
                    <View className="flex-1">
                      <Text className="font-medium text-text dark:text-text-dark">
                        {location.name}
                      </Text>
                      {(location.locationType || location.state) && (
                        <Text className="mt-1 text-xs" style={{ color: mutedColor }}>
                          {location.locationType && `${location.locationType.charAt(0) + location.locationType.slice(1).toLowerCase()}`}
                          {location.state && location.locationType && ' • '}
                          {location.state}
                        </Text>
                      )}
                    </View>
                    {selectedLocationId === location.id && (
                      <Ionicons name="checkmark" size={18} color={primaryColor} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}
