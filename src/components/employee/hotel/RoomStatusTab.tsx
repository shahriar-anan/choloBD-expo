import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { RootState } from '@/store/store';
import { getHotelRooms } from '@/services/api/hotelRooms';
import { useHotelRoomManagement } from '@/hooks/useHotelRoomManagement';

const ROOM_STATUSES = [
  { value: 'AVAILABLE', label: 'Available', color: '#10B981', icon: 'checkmark-circle' },
  { value: 'OCCUPIED', label: 'Occupied', color: '#EF4444', icon: 'person' },
  { value: 'CLEANING', label: 'Cleaning', color: '#3B82F6', icon: 'water' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: '#F59E0B', icon: 'construct' },
];

export function RoomStatusTab() {
  const { isDark } = useTheme();
  const auth = useSelector((s: RootState) => s.auth);
  const { handleUpdateRoomStatus } = useHotelRoomManagement();
  
  const hotelId = auth.user?.employeeServiceEntityId || auth.user?.serviceEntityId;

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    if (hotelId) {
      fetchRooms();
    }
  }, [hotelId]);

  const fetchRooms = async () => {
    if (!hotelId) return;

    try {
      setLoading(true);
      const data = await getHotelRooms(hotelId);
      setRooms(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      await handleUpdateRoomStatus(roomId, { roomStatus: newStatus });
      await fetchRooms();
    } catch (error) {
      // Error handled in hook
    }
  };

  const getStatusConfig = (status: string) => {
    return ROOM_STATUSES.find((s) => s.value === status) || ROOM_STATUSES[0];
  };

  if (loading) {
    return (
      <View className="items-center justify-center py-12">
        <ActivityIndicator
          size="large"
          color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
        />
      </View>
    );
  }

  if (rooms.length === 0) {
    return (
      <View className="items-center justify-center py-12">
        <Ionicons
          name="bed-outline"
          size={64}
          color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
        />
        <Text className="mt-4 text-base text-center text-muted dark:text-muted-dark">
          No rooms found
        </Text>
      </View>
    );
  }

  const renderRoomItem = ({ item }: { item: any }) => {
    const statusConfig = getStatusConfig(item.roomStatus);
    const isExpanded = selectedRoom === item.id;

    return (
      <View className="mb-3">
        <Pressable
          onPress={() => setSelectedRoom(isExpanded ? null : item.id)}
          className="p-4 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-semibold text-text dark:text-text-dark">
                Room {item.roomNumber}
              </Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                {item.roomType?.roomType || 'N/A'} - Floor {item.floorNumber || 'N/A'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${statusConfig.color}20` }}
              >
                <Text className="text-xs font-semibold" style={{ color: statusConfig.color }}>
                  {statusConfig.label}
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={isDark ? theme.colors['text-dark'] : theme.colors.text}
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>
        </Pressable>

        {isExpanded && (
          <View className="p-4 mt-2 border rounded-xl bg-white dark:bg-surface-dark border-border dark:border-border-dark">
            <Text className="mb-3 text-sm font-semibold text-text dark:text-text-dark">
              Change Status
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ROOM_STATUSES.map((status) => (
                <Pressable
                  key={status.value}
                  onPress={() => handleStatusChange(item.id, status.value)}
                  className="flex-row items-center px-3 py-2 border rounded-lg"
                  style={{
                    backgroundColor:
                      item.roomStatus === status.value
                        ? `${status.color}20`
                        : 'transparent',
                    borderColor:
                      item.roomStatus === status.value
                        ? status.color
                        : isDark
                        ? theme.colors['border-dark']
                        : theme.colors.border,
                  }}
                >
                  <Ionicons
                    name={status.icon as any}
                    size={16}
                    color={status.color}
                  />
                  <Text
                    className="ml-2 text-sm font-semibold"
                    style={{ color: status.color }}
                  >
                    {status.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 p-6">
      <Text className="mb-4 text-lg font-semibold text-text dark:text-text-dark">
        Room Status Management
      </Text>
      <FlatList
        data={rooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
