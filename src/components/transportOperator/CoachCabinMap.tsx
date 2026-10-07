import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { layoutDeck } from '../../utilities/busSeatLayout';
import { TransportSeat } from '../../types/transports';

function SteeringWheel({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export interface CoachCabinMapProps {
  seats: TransportSeat[];
  showAvailability: boolean;
  gateLabel: string;
  wheelLabel: string;
  windowLabel: string;
  aisleLabel: string;
  muted: string;
  ink: string;
  soldFill: string;
  availableFill: string;
  cabin: string;
  onSeatPress?: (seat: TransportSeat) => void;
  busySeatId?: string | null;
}

export function CoachCabinMap({
  seats,
  showAvailability,
  gateLabel,
  wheelLabel,
  windowLabel,
  aisleLabel,
  muted,
  ink,
  soldFill,
  availableFill,
  cabin,
  onSeatPress,
  busySeatId,
}: CoachCabinMapProps) {
  const rows = layoutDeck(seats);
  if (rows.length === 0) return null;

  return (
    <View className="px-3 pt-4 pb-2 mb-4 rounded-3xl" style={{ backgroundColor: cabin }}>
      <View className="flex-row items-center justify-between px-2 mb-2">
        <View className="items-center">
          <Ionicons name="enter-outline" size={22} color={muted} />
          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{gateLabel}</Text>
        </View>
        <View className="items-center">
          <SteeringWheel color={muted} />
          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{wheelLabel}</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-center mb-2">
        <Text className="text-xs text-muted dark:text-muted-dark" style={{ width: 120, textAlign: 'center' }}>
          {windowLabel}
        </Text>
        <Text className="text-xs text-muted dark:text-muted-dark" style={{ width: 28, textAlign: 'center' }}>
          {aisleLabel}
        </Text>
        <Text className="text-xs text-muted dark:text-muted-dark" style={{ width: 120, textAlign: 'center' }}>
          {windowLabel}
        </Text>
      </View>
      {rows.map((row) => {
        const leftSlots = row.variant === 'ac' ? 1 : 2;
        const paint = (seat: (typeof row.left)[number]) => {
          const taken = showAvailability && !seat.isAvailable;
          const seatStyle = {
            width: 52,
            height: 40,
            marginHorizontal: 4,
            marginBottom: 8,
            borderRadius: 10,
            backgroundColor: taken ? soldFill : availableFill,
            borderWidth: 1.5,
            borderColor: taken ? soldFill : ink,
            opacity: busySeatId === seat.id ? 0.45 : 1,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
          };
          const label = (
            <Text style={{ color: taken ? muted : ink, fontSize: 11, fontWeight: '600' }}>
              {seat.displayLabel}
            </Text>
          );
          if (!onSeatPress) {
            return (
              <View key={seat.id} style={seatStyle}>
                {label}
              </View>
            );
          }
          return (
            <Pressable key={seat.id} onPress={() => onSeatPress(seat)} disabled={busySeatId === seat.id} style={seatStyle}>
              {label}
            </Pressable>
          );
        };
        return (
          <View key={row.rowKey} className="flex-row items-start justify-center">
            <View style={{ width: leftSlots * 60, flexDirection: 'row', justifyContent: 'flex-end' }}>
              {row.left.map(paint)}
            </View>
            <View style={{ width: 28 }} />
            <View style={{ width: 120, flexDirection: 'row', justifyContent: 'flex-start' }}>
              {row.right.map(paint)}
            </View>
          </View>
        );
      })}
    </View>
  );
}
