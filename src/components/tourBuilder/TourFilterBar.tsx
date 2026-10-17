/**
 * Tour Filter Bar Component
 * Allows filtering of tour lists by various criteria
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TourFilters } from '../../types/tours';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

console.log('[TourFilterBar] Component loaded');

interface TourFilterBarProps {
  locations?: Array<{ id: string; name: string }>;
  onFilterChange: (filters: TourFilters) => void;
  onReset?: () => void;
}

export function TourFilterBar({ locations = [], onFilterChange, onReset }: TourFilterBarProps) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TourFilters>({});

  const tourTypes = [
    { value: 'Adventure', labelKey: TRANSLATION_KEYS.TOUR_BUILDER.TOUR_TYPES.ADVENTURE },
    { value: 'Beach', labelKey: TRANSLATION_KEYS.TOUR_BUILDER.TOUR_TYPES.BEACH },
    { value: 'Cultural', labelKey: TRANSLATION_KEYS.TOUR_BUILDER.TOUR_TYPES.CULTURAL },
    { value: 'Wildlife', labelKey: TRANSLATION_KEYS.TOUR_BUILDER.TOUR_TYPES.WILDLIFE },
    { value: 'Heritage', labelKey: TRANSLATION_KEYS.TOUR_BUILDER.TOUR_TYPES.HERITAGE },
  ];

  const handleFilterUpdate = (newFilters: TourFilters) => {
    console.log('[TourFilterBar] Updating filters:', newFilters);
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    console.log('[TourFilterBar] Resetting filters');
    setFilters({});
    onReset?.();
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== null).length;

  return (
    <View style={styles.container}>
      {/* Filter toggle button */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => {
          console.log('[TourFilterBar] Toggle filters, show:', !showFilters);
          setShowFilters(!showFilters);
        }}
      >
        <Text style={styles.filterButtonText}>{t(TRANSLATION_KEYS.TOUR_BUILDER.FILTERS)} {activeFilterCount > 0 && `(${activeFilterCount})`}</Text>
      </TouchableOpacity>

      {/* Filter options */}
      {showFilters && (
        <ScrollView style={styles.filterPanel} scrollEnabled={false}>
          {/* Location Filter */}
          {locations.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{t(TRANSLATION_KEYS.TOUR_BUILDER.FILTER_LOCATION)}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionList}>
                <TouchableOpacity
                  style={[styles.filterOption, !filters.locationId && styles.filterOptionActive]}
                  onPress={() => handleFilterUpdate({ ...filters, locationId: undefined })}
                >
                  <Text style={[styles.filterOptionText, !filters.locationId && styles.filterOptionTextActive]}>
                    {t(TRANSLATION_KEYS.TOUR_BUILDER.ALL)}
                  </Text>
                </TouchableOpacity>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.filterOption, filters.locationId === loc.id && styles.filterOptionActive]}
                    onPress={() => handleFilterUpdate({ ...filters, locationId: loc.id })}
                  >
                    <Text style={[styles.filterOptionText, filters.locationId === loc.id && styles.filterOptionTextActive]}>
                      {loc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Tour Type Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>{t(TRANSLATION_KEYS.TOUR_BUILDER.FILTER_TOUR_TYPE)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionList}>
              <TouchableOpacity
                style={[styles.filterOption, !filters.tourType && styles.filterOptionActive]}
                onPress={() => handleFilterUpdate({ ...filters, tourType: undefined })}
              >
                <Text style={[styles.filterOptionText, !filters.tourType && styles.filterOptionTextActive]}>{t(TRANSLATION_KEYS.TOUR_BUILDER.ALL)}</Text>
              </TouchableOpacity>
              {tourTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.filterOption, filters.tourType === type.value && styles.filterOptionActive]}
                  onPress={() => handleFilterUpdate({ ...filters, tourType: type.value as import('../../types/tours').TourType })}
                >
                  <Text style={[styles.filterOptionText, filters.tourType === type.value && styles.filterOptionTextActive]}>
                    {t(type.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Budget Range */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>{t(TRANSLATION_KEYS.TOUR_BUILDER.FILTER_BUDGET)}</Text>
            <View style={styles.budgetInputs}>
              <TextInput
                style={styles.budgetInput}
                placeholder={t(TRANSLATION_KEYS.TOUR_BUILDER.BUDGET_MIN)}
                keyboardType="decimal-pad"
                value={filters.minBudget ? String(filters.minBudget) : ''}
                onChangeText={(text) =>
                  handleFilterUpdate({
                    ...filters,
                    minBudget: text ? parseFloat(text) : undefined,
                  })
                }
              />
              <Text style={styles.budgetSeparator}>-</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder={t(TRANSLATION_KEYS.TOUR_BUILDER.BUDGET_MAX)}
                keyboardType="decimal-pad"
                value={filters.maxBudget ? String(filters.maxBudget) : ''}
                onChangeText={(text) =>
                  handleFilterUpdate({
                    ...filters,
                    maxBudget: text ? parseFloat(text) : undefined,
                  })
                }
              />
            </View>
          </View>

          {/* Status Filters */}
          <View style={styles.filterGroup}>
            <View style={styles.statusRow}>
              <View style={styles.statusOption}>
                <TouchableOpacity
                  style={[styles.checkbox, filters.isActive !== false && styles.checkboxChecked]}
                  onPress={() =>
                    handleFilterUpdate({
                      ...filters,
                      isActive: filters.isActive === false ? undefined : false,
                    })
                  }
                />
                <Text style={styles.statusLabel}>{t(TRANSLATION_KEYS.TOUR_BUILDER.ACTIVE_ONLY)}</Text>
              </View>

              <View style={styles.statusOption}>
                <TouchableOpacity
                  style={[styles.checkbox, filters.isPopular === true && styles.checkboxChecked]}
                  onPress={() =>
                    handleFilterUpdate({
                      ...filters,
                      isPopular: filters.isPopular === true ? undefined : true,
                    })
                  }
                />
                <Text style={styles.statusLabel}>{t(TRANSLATION_KEYS.TOUR_BUILDER.POPULAR_ONLY)}</Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          {activeFilterCount > 0 && (
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>{t(TRANSLATION_KEYS.TOUR_BUILDER.RESET_FILTERS)}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterPanel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  optionList: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterOptionActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  budgetInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  budgetSeparator: {
    fontSize: 12,
    color: '#999',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  statusLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  resetButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButtonText: {
    color: '#f44336',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default TourFilterBar;
