import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { KeyboardAwareScroll } from '../../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import i18next from 'i18next';
import theme from '../../../../constants/theme';
import { useServiceAdminLogic } from '../../../../hooks/useServiceAdminLogic';
import { updateMyHotel } from '../../../../services/api/users';
import { createHotelRoomType, updateHotelRoomStatus, updateHotelRoomTypePrice, HotelRoomDeskStatus } from '../../../../services/api/hotels';
import { getHotelReviews } from '../../../../services/api/reviews';
import { formatDeskDate } from '../../../../utilities/hotelDesk';
import {
  translateDescriptionIfNeeded,
  translateDisplayStringListIfNeeded,
} from '../../../../services/api/translation';
import { useTheme } from '../../../../hooks/useTheme';
import { RootState } from '../../../../store/store';

const ROOM_STATUSES: HotelRoomDeskStatus[] = ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
const ROOM_STATUS_LABELS: Record<HotelRoomDeskStatus, string> = {
  AVAILABLE: 'Ready to sell',
  MAINTENANCE: 'Needs cleaning',
  OUT_OF_SERVICE: 'Out of service',
};
const ROOM_TYPE_OPTIONS = ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE'];

type HotelInfoTab = 'overview' | 'profile' | 'rooms' | 'reviews';

const HOTEL_TABS: { id: HotelInfoTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'reviews', label: 'Reviews' },
];

function joinList(value: unknown): string {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string').join(', ') : '';
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
}

async function translateHotelDisplayFields(hotelData: any): Promise<any> {
  if (!hotelData || typeof hotelData !== 'object') {
    return hotelData;
  }

  const description = hotelData.description;
  const categoryNames = Array.isArray(hotelData.hotelCategories)
    ? hotelData.hotelCategories.map((hc: any) => hc?.category?.name)
    : [];

  const [translatedDescription, translatedCategoryNames] = await Promise.all([
    translateDescriptionIfNeeded(
      typeof description === 'string' ? description : '',
      i18next.language
    ),
    translateDisplayStringListIfNeeded(categoryNames, i18next.language),
  ]);

  const translatedHotelCategories = Array.isArray(hotelData.hotelCategories)
    ? hotelData.hotelCategories.map((hc: any, idx: number) => {
        const translatedName = translatedCategoryNames[idx];
        if (!translatedName || !hc?.category) {
          return hc;
        }
        return {
          ...hc,
          category: {
            ...hc.category,
            name: translatedName,
          },
        };
      })
    : hotelData.hotelCategories;

  const didDescriptionChange =
    typeof description === 'string' && translatedDescription !== description;
  const didCategoriesChange =
    translatedHotelCategories !== hotelData.hotelCategories;

  if (!didDescriptionChange && !didCategoriesChange) {
    return hotelData;
  }

  return {
    ...hotelData,
    description: didDescriptionChange ? translatedDescription : description,
    hotelCategories: translatedHotelCategories,
  };
}

export default function HotelInfoPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const auth = useSelector((s: RootState) => s.auth);
  const isHotelAdmin = auth.user?.role === 'SERVICE_ADMIN';
  const hotelId = params.hotelId as string | undefined;

  const { fetchOperatorHotel, fetchHotelRooms } = useServiceAdminLogic();
  const [hotel, setHotel] = useState<any | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');
  const [policiesText, setPoliciesText] = useState('');
  const [nearbyToursText, setNearbyToursText] = useState('');
  const [nearbyActivitiesText, setNearbyActivitiesText] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [roomPrices, setRoomPrices] = useState<Record<string, string>>({});
  const [newRoomType, setNewRoomType] = useState('SINGLE');
  const [newRoomPrice, setNewRoomPrice] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [savingTypeId, setSavingTypeId] = useState<string | null>(null);
  const [tab, setTab] = useState<HotelInfoTab>('overview');

  useEffect(() => {
    const load = async () => {
      if (!hotelId) return;
      setLoading(true);
      try {
        const h = await fetchOperatorHotel(hotelId);
        setHotel(h ?? null);
        setPhoneNumber(h?.phoneNumber ?? '');
        setEmail(h?.email ?? '');
        setWebsite(h?.website ?? '');
        setCheckInTime(h?.checkInTime ?? '');
        setCheckOutTime(h?.checkOutTime ?? '');
        setAmenitiesText(joinList(h?.amenities));
        setPoliciesText(joinList(h?.policies));
        setNearbyToursText(joinList(h?.nearbyTourSpots));
        setNearbyActivitiesText(joinList(h?.nearbyActivitySpots));
        const prices: Record<string, string> = {};
        (h?.roomTypes ?? []).forEach((roomType: any) => {
          if (roomType?.id) prices[roomType.id] = String(roomType.pricePerNight ?? '');
        });
        setRoomPrices(prices);
        setLoading(false);

        const nextHotel = await translateHotelDisplayFields(h);
        if (nextHotel !== h) {
          setHotel(nextHotel ?? null);
        }
      } catch (e) {
        console.error('[HotelInfoPage] fetchOperatorHotel error', e);
        setLoading(false);
      }

      try {
        const rs = await fetchHotelRooms(hotelId);
        setRooms(rs ?? []);
      } catch (e) {
        console.error('[HotelInfoPage] fetchHotelRooms error', e);
      }

      try {
        setReviews(await getHotelReviews(hotelId));
      } catch (e) {
        console.error('[HotelInfoPage] getHotelReviews error', e);
      }
    };
    load();
  }, [hotelId, fetchOperatorHotel, fetchHotelRooms]);

  const saveProfile = async () => {
    if (!hotelId || !isHotelAdmin) return;
    setSavingProfile(true);
    try {
      const payload: {
        phoneNumber?: string;
        email?: string;
        website?: string;
        checkInTime?: string;
        checkOutTime?: string;
        amenities: string[];
        policies: string[];
        nearbyTourSpots: string[];
        nearbyActivitySpots: string[];
      } = {
        amenities: splitList(amenitiesText),
        policies: splitList(policiesText),
        nearbyTourSpots: splitList(nearbyToursText),
        nearbyActivitySpots: splitList(nearbyActivitiesText),
      };
      if (phoneNumber.trim()) payload.phoneNumber = phoneNumber.trim();
      if (email.trim()) payload.email = email.trim();
      if (website.trim()) payload.website = website.trim();
      if (checkInTime.trim()) payload.checkInTime = checkInTime.trim();
      if (checkOutTime.trim()) payload.checkOutTime = checkOutTime.trim();
      const updated = await updateMyHotel(hotelId, payload);
      setHotel((current: any) => ({ ...current, ...updated }));
      Alert.alert('Hotel profile', 'Contact details saved.');
    } catch (e: any) {
      Alert.alert('Hotel profile', e?.response?.data?.message || 'Could not save hotel details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const setRoomStatus = async (roomId: string, roomStatus: HotelRoomDeskStatus) => {
    setSavingRoomId(roomId);
    try {
      const updated = await updateHotelRoomStatus(roomId, roomStatus);
      setRooms((current) => current.map((room) => (room.id === roomId ? { ...room, ...updated } : room)));
    } catch (e: any) {
      Alert.alert('Room status', e?.response?.data?.message || 'Could not update this room.');
    } finally {
      setSavingRoomId(null);
    }
  };

  const saveRoomPrice = async (roomTypeId: string) => {
    const price = Number(roomPrices[roomTypeId]);
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert('Room rate', 'Enter a nightly price of zero or more.');
      return;
    }
    setSavingTypeId(roomTypeId);
    try {
      const updated = await updateHotelRoomTypePrice(roomTypeId, price);
      setHotel((current: any) => ({
        ...current,
        roomTypes: (current?.roomTypes ?? []).map((roomType: any) => (
          roomType.id === roomTypeId ? { ...roomType, ...updated, pricePerNight: price } : roomType
        )),
      }));
    } catch (e: any) {
      Alert.alert('Room rate', e?.response?.data?.message || 'Could not update this rate.');
    } finally {
      setSavingTypeId(null);
    }
  };

  const addRoomType = async () => {
    if (!hotelId) return;
    const price = Number(newRoomPrice);
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert('Room rate', 'Enter a nightly price of zero or more.');
      return;
    }
    setSavingTypeId('new');
    try {
      await createHotelRoomType({
        hotelId,
        roomType: newRoomType,
        pricePerNight: price,
        totalCount: 1,
      });
      const refreshed = await fetchOperatorHotel(hotelId);
      setHotel(refreshed ?? null);
      const prices: Record<string, string> = {};
      (refreshed?.roomTypes ?? []).forEach((roomType: any) => {
        if (roomType?.id) prices[roomType.id] = String(roomType.pricePerNight ?? '');
      });
      setRoomPrices(prices);
      setRooms(await fetchHotelRooms(hotelId));
      setNewRoomPrice('');
    } catch (e: any) {
      Alert.alert('Room rate', e?.response?.data?.message || 'Could not add this room type.');
    } finally {
      setSavingTypeId(null);
    }
  };

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const successColor = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const warningColor = isDark ? theme.colors['warning-dark'] : theme.colors.warning;

  const totalRooms = hotel?._count?.rooms ?? hotel?.totalRooms ?? 0;
  const availableRooms = hotel?.availableRooms ?? 0;
  const rating = hotel?.rating ?? 0;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-6 pt-4 pb-3 bg-white border-b dark:bg-surface-dark border-border dark:border-border-dark">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/dashboard');
          }}
          className="flex-row items-center"
        >
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
          <Text className="ml-2 font-semibold text-primary dark:text-primary-dark">Back</Text>
        </TouchableOpacity>
        {hotel ? (
          <View className="mt-3">
            <Text className="text-2xl font-bold text-text dark:text-text-dark">{hotel.name}</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="location" size={14} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} />
              <Text className="ml-1 text-sm text-muted dark:text-muted-dark">
                {hotel.location?.city ?? hotel.location?.name ?? '—'}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-3 text-sm text-muted dark:text-muted-dark">Loading hotel details...</Text>
        </View>
      ) : hotel ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center' }}
          >
            {HOTEL_TABS.map((item) => {
              const selected = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setTab(item.id)}
                  className="px-4 py-2 mr-2 rounded-full"
                  style={{
                    backgroundColor: selected ? primaryColor : 'transparent',
                    borderWidth: 1,
                    borderColor: primaryColor,
                  }}
                >
                  <Text style={{ color: selected ? '#fff' : primaryColor }} className="text-sm font-semibold">
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <KeyboardAwareScroll showsVerticalScrollIndicator={false} className="flex-1">
          <View className="px-6 pt-2 pb-8">
            {tab === 'overview' ? (
            <>
            <View className="p-4 mb-6 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
              <Text className="mb-3 font-semibold text-text dark:text-text-dark">Listing checklist</Text>
              {[
                { label: 'Name', complete: Boolean(hotel.name?.trim()) },
                { label: 'Phone', complete: Boolean(hotel.phoneNumber?.trim()) },
                { label: 'Email', complete: Boolean(hotel.email?.trim()) },
                { label: 'Location', complete: Boolean(hotel.location?.name || hotel.location?.city) },
                { label: 'Check-in and check-out', complete: Boolean(hotel.checkInTime && hotel.checkOutTime) },
                { label: 'Description', complete: Boolean(hotel.description?.trim()) },
                { label: 'Photos', complete: Array.isArray(hotel.images) && hotel.images.length > 0 },
                { label: 'Room types', complete: (hotel.roomTypes ?? []).some((roomType: { pricePerNight?: number }) => (roomType.pricePerNight ?? 0) > 0) },
                { label: 'Policies', complete: Boolean(policiesText.trim()) },
              ].map((row) => (
                <View key={row.label} className="flex-row items-center justify-between py-1">
                  <Text className="text-sm text-text dark:text-text-dark">{row.label}</Text>
                  <Text className={`text-sm font-semibold ${row.complete ? 'text-primary dark:text-primary-dark' : 'text-red-600 dark:text-red-300'}`}>
                    {row.complete ? 'Complete' : 'Missing'}
                  </Text>
                </View>
              ))}
            </View>
            </>
            ) : null}

            {tab === 'profile' ? (
            <View className="p-4 mb-6 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
              <Text className="mb-3 font-semibold text-text dark:text-text-dark">Contact</Text>
              <Text className="text-sm text-muted dark:text-muted-dark">Phone</Text>
              {isHotelAdmin ? (
                <TextInput value={phoneNumber} onChangeText={setPhoneNumber} className="px-3 py-2 mt-1 mb-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
              ) : (
                <Text className="mb-3 text-base text-text dark:text-text-dark">{hotel.phoneNumber || '—'}</Text>
              )}
              <Text className="text-sm text-muted dark:text-muted-dark">Email</Text>
              {isHotelAdmin ? (
                <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" className="px-3 py-2 mt-1 mb-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
              ) : (
                <Text className="mb-3 text-base text-text dark:text-text-dark">{hotel.email || '—'}</Text>
              )}
              <Text className="text-sm text-muted dark:text-muted-dark">Website</Text>
              {isHotelAdmin ? (
                <TextInput value={website} onChangeText={setWebsite} autoCapitalize="none" className="px-3 py-2 mt-1 mb-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
              ) : (
                <Text className="mb-3 text-base text-text dark:text-text-dark">{hotel.website || '—'}</Text>
              )}
              <Text className="text-sm text-muted dark:text-muted-dark">Check-in</Text>
              {isHotelAdmin ? (
                <TextInput value={checkInTime} onChangeText={setCheckInTime} placeholder="HH:MM" className="px-3 py-2 mt-1 mb-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
              ) : (
                <Text className="mb-3 text-base text-text dark:text-text-dark">{hotel.checkInTime || '—'}</Text>
              )}
              <Text className="text-sm text-muted dark:text-muted-dark">Amenities</Text>
              {isHotelAdmin ? (
                <TextInput value={amenitiesText} onChangeText={setAmenitiesText} placeholder="Wifi, Breakfast" className="px-3 py-2 mt-1 mb-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
              ) : (
                <Text className="mb-3 text-base text-text dark:text-text-dark">{amenitiesText || '—'}</Text>
              )}
              <Text className="text-sm text-muted dark:text-muted-dark">Policies</Text>
              {isHotelAdmin ? (
                <TextInput value={policiesText} onChangeText={setPoliciesText} placeholder="No smoking, No pets" className="px-3 py-2 mt-1 mb-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
              ) : (
                <Text className="mb-3 text-base text-text dark:text-text-dark">{policiesText || '—'}</Text>
              )}
              <Text className="text-sm text-muted dark:text-muted-dark">Nearby tour spots</Text>
              {isHotelAdmin ? (
                <TextInput value={nearbyToursText} onChangeText={setNearbyToursText} className="px-3 py-2 mt-1 mb-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
              ) : (
                <Text className="mb-3 text-base text-text dark:text-text-dark">{nearbyToursText || '—'}</Text>
              )}
              <Text className="text-sm text-muted dark:text-muted-dark">Nearby activities</Text>
              {isHotelAdmin ? (
                <TextInput value={nearbyActivitiesText} onChangeText={setNearbyActivitiesText} className="px-3 py-2 mt-1 mb-3 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
              ) : (
                <Text className="mb-3 text-base text-text dark:text-text-dark">{nearbyActivitiesText || '—'}</Text>
              )}
              <Text className="text-sm text-muted dark:text-muted-dark">Check-out</Text>
              {isHotelAdmin ? (
                <TextInput value={checkOutTime} onChangeText={setCheckOutTime} placeholder="HH:MM" className="px-3 py-2 mt-1 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
              ) : (
                <Text className="text-base text-text dark:text-text-dark">{hotel.checkOutTime || '—'}</Text>
              )}
              {isHotelAdmin ? (
                <TouchableOpacity onPress={saveProfile} disabled={savingProfile} className="px-4 py-3 mt-4 rounded-lg bg-primary">
                  <Text className="font-semibold text-center text-white">{savingProfile ? 'Saving...' : 'Save profile'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            ) : null}

            {tab === 'rooms' ? (
            <View className="p-4 mb-6 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
              <Text className="mb-3 font-semibold text-text dark:text-text-dark">Room rates</Text>
              {(hotel.roomTypes ?? []).map((roomType: any) => (
                <View key={roomType.id} className="mb-3">
                  <Text className="text-sm text-text dark:text-text-dark">{roomType.roomType}</Text>
                  {isHotelAdmin ? (
                    <View className="flex-row items-center gap-2 mt-1">
                      <TextInput
                        value={roomPrices[roomType.id] ?? ''}
                        onChangeText={(value) => setRoomPrices((current) => ({ ...current, [roomType.id]: value }))}
                        keyboardType="numeric"
                        className="flex-1 px-3 py-2 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark"
                      />
                      <TouchableOpacity onPress={() => saveRoomPrice(roomType.id)} disabled={savingTypeId === roomType.id} className="px-3 py-2 rounded-lg bg-primary">
                        <Text className="text-sm font-semibold text-white">{savingTypeId === roomType.id ? '...' : 'Save'}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text className="text-base text-text dark:text-text-dark">৳{roomType.pricePerNight}</Text>
                  )}
                </View>
              ))}
              {isHotelAdmin ? (
                <View className="pt-2 mt-2 border-t border-border dark:border-border-dark">
                  <Text className="mb-2 text-sm text-muted dark:text-muted-dark">Add a room type</Text>
                  <View className="flex-row flex-wrap gap-2 mb-2">
                    {ROOM_TYPE_OPTIONS.map((option) => (
                      <TouchableOpacity key={option} onPress={() => setNewRoomType(option)} className={`px-3 py-2 rounded-full border ${newRoomType === option ? 'bg-primary border-primary' : 'border-border dark:border-border-dark'}`}>
                        <Text className={`text-xs font-semibold ${newRoomType === option ? 'text-white' : 'text-text dark:text-text-dark'}`}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput value={newRoomPrice} onChangeText={setNewRoomPrice} keyboardType="numeric" placeholder="Price per night" className="px-3 py-2 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark" />
                  <TouchableOpacity onPress={addRoomType} disabled={savingTypeId === 'new'} className="px-4 py-3 mt-2 rounded-lg bg-primary">
                    <Text className="font-semibold text-center text-white">{savingTypeId === 'new' ? 'Adding...' : 'Add room type'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
            ) : null}

            {tab === 'reviews' ? (
            <View className="p-4 mb-6 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
              <Text className="mb-3 font-semibold text-text dark:text-text-dark">Reviews</Text>
              {reviews.length === 0 ? (
                <Text className="text-sm text-muted dark:text-muted-dark">No reviews yet.</Text>
              ) : reviews.map((review) => (
                <View key={review.id} className="mb-3">
                  <Text className="text-sm font-semibold text-text dark:text-text-dark">
                    {[review.user?.firstName, review.user?.lastName].filter(Boolean).join(' ') || 'Guest'} · {review.rating} / 5
                  </Text>
                  <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{review.description}</Text>
                  <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{formatDeskDate(review.createdAt)}</Text>
                </View>
              ))}
            </View>
            ) : null}

            {tab === 'overview' ? (
            <>
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 p-4 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="mb-1 text-xs text-muted dark:text-muted-dark">Rating</Text>
                    <Text className="text-2xl font-bold text-text dark:text-text-dark">{rating.toFixed(1)}</Text>
                  </View>
                  <Ionicons name="star" size={32} color={warningColor} />
                </View>
              </View>

              <View className="flex-1 p-4 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="mb-1 text-xs text-muted dark:text-muted-dark">Type</Text>
                    <Text className="text-lg font-bold text-text dark:text-text-dark">{hotel.type ?? 'N/A'}</Text>
                  </View>
                  <Ionicons name="business-outline" size={32} color={primaryColor} />
                </View>
              </View>
            </View>

            {/* Overview Card */}
            {hotel.description && (
              <View className="p-4 mb-6 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="information-circle" size={20} color={primaryColor} />
                  <Text className="ml-2 font-semibold text-text dark:text-text-dark">Description</Text>
                </View>
                <Text className="text-sm leading-6 text-muted dark:text-muted-dark">
                  {hotel.description}
                </Text>
              </View>
            )}

            {/* Room Statistics */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="enter-outline" size={20} color={primaryColor} />
                <Text className="ml-2 text-lg font-semibold text-text dark:text-text-dark">Room Statistics</Text>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 p-4 border border-green-200 bg-green-50 dark:bg-green-950 rounded-xl dark:border-green-800">
                  <Text className="mb-1 text-xs text-green-700 dark:text-green-300">Open for sale</Text>
                  <Text className="text-2xl font-bold text-green-700 dark:text-green-300">{availableRooms}</Text>
                </View>

                <View className="flex-1 p-4 border border-blue-200 bg-blue-50 dark:bg-blue-950 rounded-xl dark:border-blue-800">
                  <Text className="mb-1 text-xs text-blue-700 dark:text-blue-300">Rooms</Text>
                  <Text className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalRooms}</Text>
                </View>
              </View>
            </View>

            {/* Amenities */}
            {hotel.hotelCategories && hotel.hotelCategories.length > 0 && (
              <View className="p-4 mb-6 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="sparkles" size={20} color={primaryColor} />
                  <Text className="ml-2 font-semibold text-text dark:text-text-dark">Amenities</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {hotel.hotelCategories.map((hc: any) => (
                    <View 
                      key={hc.id} 
                      className="px-3 py-2 border border-blue-200 rounded-full bg-blue-50 dark:bg-blue-950 dark:border-blue-800"
                    >
                      <Text className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {hc.category?.name ?? '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            </>
            ) : null}

            {tab === 'rooms' ? (
            <View>
              <View className="flex-row items-center mb-4">
                <Ionicons name="list" size={20} color={primaryColor} />
                <Text className="ml-2 text-lg font-semibold text-text dark:text-text-dark">
                  Rooms ({rooms.length})
                </Text>
              </View>

              {rooms.length > 0 ? (
                <View className="gap-3">
                  {rooms.map((room, idx) => (
                    <View 
                      key={room.id ?? idx}
                      className="p-4 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark"
                    >
                      {/* Room Type Header */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-base font-bold text-text dark:text-text-dark">
                            {room.roomNumber ? `Room ${room.roomNumber}` : 'Room'}
                          </Text>
                          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                            {room.hotelRoomType?.roomType ?? room.roomType ?? 'Unknown type'}
                          </Text>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${
                          room.roomStatus?.toUpperCase() === 'AVAILABLE'
                            ? 'bg-green-100 dark:bg-green-950'
                            : 'bg-yellow-100 dark:bg-yellow-950'
                        }`}>
                          <Text className={`text-xs font-semibold ${
                            room.roomStatus?.toUpperCase() === 'AVAILABLE'
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {ROOM_STATUS_LABELS[room.roomStatus as HotelRoomDeskStatus] ?? room.roomStatus ?? 'N/A'}
                          </Text>
                        </View>
                      </View>

                      {isHotelAdmin ? (
                        <TouchableOpacity
                          onPress={() => router.push(`/(tabs)/dashboard/service-admin/tasks?roomId=${room.id}`)}
                          className="self-start mb-3"
                        >
                          <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                            {i18next.t('hotelDesk.assignCleaning')}
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      <View className="flex-row flex-wrap gap-2">
                        {ROOM_STATUSES.map((status) => {
                          const selected = room.roomStatus === status;
                          return (
                            <TouchableOpacity
                              key={status}
                              disabled={savingRoomId === room.id || selected}
                              onPress={() => setRoomStatus(room.id, status)}
                              className={`px-3 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'border-border dark:border-border-dark'}`}
                            >
                              <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                                {ROOM_STATUS_LABELS[status]}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Room Details Grid */}
                      <View className="grid gap-2">
                        {room.pricePerNight && (
                          <View className="flex-row items-center justify-between py-2 border-t border-border dark:border-border-dark">
                            <View className="flex-row items-center">
                              <Ionicons name="cash" size={16} color={successColor} />
                              <Text className="ml-2 text-sm text-muted dark:text-muted-dark">Price per Night</Text>
                            </View>
                            <Text className="font-semibold text-text dark:text-text-dark">₹{room.pricePerNight}</Text>
                          </View>
                        )}

                        {room.availableCount !== undefined && (
                          <View className="flex-row items-center justify-between py-2 border-t border-border dark:border-border-dark">
                            <View className="flex-row items-center">
                              <Ionicons name="checkmark-circle" size={16} color={successColor} />
                              <Text className="ml-2 text-sm text-muted dark:text-muted-dark">Open for sale</Text>
                            </View>
                            <Text className="font-semibold text-text dark:text-text-dark">
                              {room.availableCount}/{room.totalCount}
                            </Text>
                          </View>
                        )}

                        {room.hotelRoomType?.singleBedCount !== undefined && (
                          <View className="flex-row items-center justify-between py-2 border-t border-border dark:border-border-dark">
                            <View className="flex-row items-center">
                              <Ionicons name="bed" size={16} color={primaryColor} />
                              <Text className="ml-2 text-sm text-muted dark:text-muted-dark">Single Beds</Text>
                            </View>
                            <Text className="font-semibold text-text dark:text-text-dark">
                              {room.hotelRoomType.singleBedCount}
                            </Text>
                          </View>
                        )}

                        {room.hotelRoomType?.doubleBedCount !== undefined && (
                          <View className="flex-row items-center justify-between py-2 border-t border-border dark:border-border-dark">
                            <View className="flex-row items-center">
                              <Ionicons name="bed" size={16} color={primaryColor} />
                              <Text className="ml-2 text-sm text-muted dark:text-muted-dark">Double Beds</Text>
                            </View>
                            <Text className="font-semibold text-text dark:text-text-dark">
                              {room.hotelRoomType.doubleBedCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="items-center p-6 bg-white border dark:bg-surface-dark rounded-xl border-border dark:border-border-dark">
                  <Ionicons name="archive-outline" size={32} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} />
                  <Text className="mt-2 text-sm text-muted dark:text-muted-dark">No rooms available</Text>
                </View>
              )}
            </View>
            ) : null}
          </View>
        </KeyboardAwareScroll>
        </>
      ) : (
        <View className="items-center justify-center flex-1 px-6">
          <Ionicons name="warning" size={48} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} />
          <Text className="mt-4 text-lg font-semibold text-text dark:text-text-dark">Hotel not found</Text>
          <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
            The hotel information could not be loaded. Please try again.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
