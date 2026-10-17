import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

export interface StopCardPlace {
  key: string;
  label: string;
  name: string;
  imageUrl?: string;
  onPress?: () => void;
}

interface StopCardProps {
  title: string;
  description?: string;
  notes?: string;
  showNotes?: boolean;
  places: StopCardPlace[];
  transport?: string;
  badge?: string;
  children?: React.ReactNode;
  /** Single total shown on the card. The activity and stay split stays in details. */
  totalLabel?: string;
  onDetails?: () => void;
  detailsLabel?: string;
  onPress?: () => void;
  reorder?: {
    canUp: boolean;
    canDown: boolean;
    onUp: () => void;
    onDown: () => void;
    onDelete: () => void;
    upLabel: string;
    downLabel: string;
    deleteLabel: string;
  };
}

export function StopCard({
  title,
  description,
  notes,
  showNotes,
  places,
  transport,
  badge,
  children,
  totalLabel,
  onDetails,
  detailsLabel,
  onPress,
  reorder,
}: StopCardProps) {
  const { isDark } = useTheme();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const error = isDark ? theme.colors['error-dark'] : theme.colors.error;

  const body = (
    <View>
      <View className="flex-row items-start">
        {badge ? (
          <View className="w-7 h-7 rounded-full bg-primary items-center justify-center mr-2 mt-0.5">
            <Text className="text-white font-bold" style={{ fontSize: theme.typography.trip.caption }}>{badge}</Text>
          </View>
        ) : null}
        <Text className="flex-1 text-base font-semibold text-text dark:text-text-dark">
          {title}
        </Text>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={muted} /> : null}
      </View>
      {description ? (
        <Text className="text-sm text-muted dark:text-muted-dark mt-1">
          {description}
        </Text>
      ) : null}
      {showNotes && notes ? (
        <Text className="text-sm text-text dark:text-text-dark mt-2">
          {notes}
        </Text>
      ) : null}
      {places.map((place) => (
        <PlaceRow key={place.key} place={place} muted={muted} />
      ))}
      {transport ? (
        <Text className="text-sm text-muted dark:text-muted-dark mt-2">
          {transport}
        </Text>
      ) : null}
      {children}
      {totalLabel || onDetails ? (
        <View className="flex-row items-center mt-3">
          <Text className="text-sm font-semibold text-text dark:text-text-dark flex-1 pr-3">
            {totalLabel}
          </Text>
          {onDetails ? (
            <TouchableOpacity
              onPress={onDetails}
              accessibilityRole="button"
              accessibilityLabel={detailsLabel}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                {detailsLabel} ›
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <View
      className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 mb-3"
      style={theme.elevation.sm}
    >
      {onPress ? (
        <TouchableOpacity onPress={onPress} accessibilityRole="button">
          {body}
        </TouchableOpacity>
      ) : (
        body
      )}
      {reorder ? (
        <View className="flex-row items-center mt-2">
          {reorder.canUp ? (
            <TouchableOpacity
              onPress={reorder.onUp}
              accessibilityLabel={reorder.upLabel}
              className="w-11 h-11 items-center justify-center"
            >
              <Ionicons name="arrow-up" size={20} color={primary} />
            </TouchableOpacity>
          ) : (
            <View className="w-11 h-11" />
          )}
          {reorder.canDown ? (
            <TouchableOpacity
              onPress={reorder.onDown}
              accessibilityLabel={reorder.downLabel}
              className="w-11 h-11 items-center justify-center"
            >
              <Ionicons name="arrow-down" size={20} color={primary} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={reorder.onDelete}
            accessibilityLabel={reorder.deleteLabel}
            className="w-11 h-11 items-center justify-center ml-auto"
          >
            <Ionicons name="trash-outline" size={20} color={error} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function PlaceRow({ place, muted }: { place: StopCardPlace; muted: string }) {
  const row = (
    <View className="flex-row items-center mt-3">
      <View className="w-10 h-10 rounded-lg overflow-hidden bg-background dark:bg-background-dark mr-3">
        {place.imageUrl ? (
          <Image source={{ uri: place.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={18} color={muted} />
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className="uppercase font-semibold text-muted dark:text-muted-dark" style={{ fontSize: theme.typography.trip.caption }}>
          {place.label}
        </Text>
        <Text className="text-sm text-text dark:text-text-dark" numberOfLines={2}>
          {place.name}
        </Text>
      </View>
      {place.onPress ? <Ionicons name="chevron-forward" size={16} color={muted} /> : null}
    </View>
  );
  if (!place.onPress) return row;
  return (
    <TouchableOpacity onPress={place.onPress} accessibilityRole="button" accessibilityLabel={place.name}>
      {row}
    </TouchableOpacity>
  );
}
