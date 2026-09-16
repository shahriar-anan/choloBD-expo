import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { RootState } from '@/store/store';
import { getUserHotelBookings } from '@/services/api/hotelBookings';

export function BookingsTab() {
  const router = useRouter();
  const { isDark } = useTheme();
  const auth = useSelector((s: RootState) => s.auth);

  const hotelId = auth.user?.employeeServiceEntityId || auth.user?.serviceEntityId;

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('today');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (hotelId) fetchBookings();
  }, [hotelId, filter]);

  const fetchBookings = async () => {
    if (!hotelId) return;

    try {
      setLoading(true);
      const data = await getUserHotelBookings({ hotelId });
      let filtered = data.results || [];
      const today = new Date().toDateString();

      if (filter === 'today') {
        filtered = filtered.filter((b: any) => {
          const checkIn = new Date(b.checkInDate).toDateString();
          const checkOut = new Date(b.checkOutDate).toDateString();
          return checkIn === today || checkOut === today;
        });
      } else if (filter === 'upcoming') {
        filtered = filtered.filter((b: any) => new Date(b.checkInDate) > new Date());
      }

      setBookings(filtered);
    } catch {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const guest = (
        b.guestName ||
        b.user?.userName ||
        b.user?.name ||
        ''
      ).toLowerCase();
      const code = (b.confirmationCode || '').toLowerCase();
      const email = (b.guestEmail || b.user?.email || '').toLowerCase();
      return guest.includes(q) || code.includes(q) || email.includes(q);
    });
  }, [bookings, query]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return isDark ? theme.colors['primary-dark'] : theme.colors.primary;
      case 'CHECKED_IN':
      case 'COMPLETED':
        return isDark ? theme.colors['success-dark'] : theme.colors.success;
      case 'CANCELLED':
        return isDark ? theme.colors['error-dark'] : theme.colors.error;
      default:
        return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    }
  };

  const guestLabel = (item: any) =>
    item.guestName || item.user?.userName || item.user?.name || 'Guest';

  const roomLines = (item: any) => {
    if (Array.isArray(item.roomDetails) && item.roomDetails.length > 0) {
      return item.roomDetails.map((rd: any, idx: number) => {
        const roomNo = rd.hotelRoom?.roomNumber || rd.roomNumber || '—';
        const typeName =
          rd.hotelRoom?.hotelRoomType?.name ||
          rd.hotelRoom?.hotelRoomType?.roomType ||
          rd.roomType ||
          'Room';
        return `${typeName} #${roomNo}${rd.pricePerNight ? ` · ৳${rd.pricePerNight}` : ''}`;
      });
    }
    const single =
      item.room?.roomNumber || item.roomType?.roomType
        ? `Room ${item.room?.roomNumber || 'TBD'} · ${item.roomType?.roomType || 'N/A'}`
        : null;
    return single ? [single] : [];
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

  const renderBookingItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    const expanded = expandedId === item.id;
    const lines = roomLines(item);

    return (
      <Pressable
        onPress={() => setExpandedId(expanded ? null : item.id)}
        className="p-4 mb-3 border rounded-xl bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-base font-semibold text-text dark:text-text-dark">
              {item.confirmationCode || item.id.slice(0, 8)}
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {guestLabel(item)}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${statusColor}22` }}
          >
            <Text className="text-xs font-semibold" style={{ color: statusColor }}>
              {item.status}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-1">
          <Ionicons
            name="calendar-outline"
            size={16}
            color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
          />
          <Text className="ml-2 text-sm text-text dark:text-text-dark">
            {new Date(item.checkInDate).toLocaleDateString()} –{' '}
            {new Date(item.checkOutDate).toLocaleDateString()}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
            ৳{(item.totalCost ?? item.totalPrice ?? 0).toLocaleString()}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
          />
        </View>

        {expanded ? (
          <View className="pt-3 mt-3 border-t border-border dark:border-border-dark">
            {(item.guestEmail || item.user?.email) && (
              <Text className="mb-1 text-sm text-muted dark:text-muted-dark">
                Email: {item.guestEmail || item.user?.email}
              </Text>
            )}
            {(item.guestPhoneNumber || item.user?.phoneNumber) && (
              <Text className="mb-1 text-sm text-muted dark:text-muted-dark">
                Phone: {item.guestPhoneNumber || item.user?.phoneNumber}
              </Text>
            )}
            {item.specialRequests ? (
              <Text className="mb-2 text-sm text-muted dark:text-muted-dark">
                Requests: {item.specialRequests}
              </Text>
            ) : null}
            {lines.length > 0 ? (
              lines.map((line: string, idx: number) => (
                <Text key={`${item.id}-room-${idx}`} className="text-sm text-text dark:text-text-dark">
                  {line}
                </Text>
              ))
            ) : (
              <Text className="text-sm text-muted dark:text-muted-dark">No room line items</Text>
            )}
            <Pressable
              onPress={() => router.push(`/(tabs)/dashboard/${item.id}`)}
              className="items-center py-2 mt-3 rounded-lg"
              style={{
                backgroundColor: isDark ? theme.colors['primary-dark'] : theme.colors.primary,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Open details</Text>
            </Pressable>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;

  return (
    <View className="flex-1 p-6">
      <Text className="mb-4 text-lg font-semibold text-text dark:text-text-dark">
        Hotel Bookings
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search guest, email, or code"
        placeholderTextColor={muted}
        style={{
          borderWidth: 1,
          borderColor: border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 12,
          color: text,
          backgroundColor: surface,
        }}
      />

      <View className="flex-row gap-2 mb-4">
        {(['today', 'upcoming', 'all'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className="px-4 py-2 border rounded-lg"
            style={{
              backgroundColor:
                filter === f
                  ? isDark
                    ? theme.colors['primary-dark']
                    : theme.colors.primary
                  : 'transparent',
              borderColor:
                filter === f
                  ? isDark
                    ? theme.colors['primary-dark']
                    : theme.colors.primary
                  : border,
            }}
          >
            <Text
              className="text-sm font-semibold capitalize"
              style={{ color: filter === f ? '#ffffff' : text }}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {visible.length === 0 ? (
        <View className="items-center justify-center py-12">
          <Ionicons name="calendar-outline" size={64} color={muted} />
          <Text className="mt-4 text-base text-center text-muted dark:text-muted-dark">
            No bookings found
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
