import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { useHotelRoomManagement } from '@/hooks/useHotelRoomManagement';
import { getMyHotel } from '@/services/api/users';
import { cloudinaryUpload } from '@/services/api/cloudinaryUpload';

const ROOM_TYPES = ['STANDARD', 'DELUXE', 'SUITE', 'PREMIUM', 'EXECUTIVE'];

export default function RoomTypeFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const { loading, handleCreateRoomType, handleUpdateRoomType } = useHotelRoomManagement();

  const mode = params.mode as 'create' | 'edit';
  const hotelId = params.hotelId as string;
  const roomTypeId = params.roomTypeId as string;

  const [formData, setFormData] = useState({
    roomType: 'STANDARD',
    singleBedCount: '0',
    doubleBedCount: '0',
    pricePerNight: '',
    totalCount: '',
    availableCount: '',
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingData, setLoadingData] = useState(mode === 'edit');

  useEffect(() => {
    if (mode === 'edit' && roomTypeId && hotelId) {
      loadRoomType();
    }
  }, [mode, roomTypeId, hotelId]);

  const loadRoomType = async () => {
    try {
      setLoadingData(true);
      const hotel = await getMyHotel(hotelId);
      const roomType = hotel?.roomTypes?.find((rt: any) => rt.id === roomTypeId);

      if (roomType) {
        setFormData({
          roomType: roomType.roomType || 'STANDARD',
          singleBedCount: String(roomType.singleBedCount || 0),
          doubleBedCount: String(roomType.doubleBedCount || 0),
          pricePerNight: String(roomType.pricePerNight || ''),
          totalCount: String(roomType.totalCount || ''),
          availableCount: String(roomType.availableCount || ''),
        });
        const existing =
          roomType.images?.map((img: any) => img.url).filter(Boolean) ||
          roomType.imageURLs ||
          [];
        setImageUrls(Array.isArray(existing) ? existing : []);
      }
    } catch {
      Alert.alert('Error', 'Failed to load room type details');
      router.back();
    } finally {
      setLoadingData(false);
    }
  };

  const pickAndUploadImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploadingImage(true);
      const uploaded = await cloudinaryUpload(result.assets[0].uri, 'hotel-rooms');
      setImageUrls((prev) => [...prev, uploaded.secure_url]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async () => {
    if (!formData.pricePerNight || parseFloat(formData.pricePerNight) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price per night');
      return;
    }

    if (!formData.totalCount || parseInt(formData.totalCount, 10) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid total count');
      return;
    }

    const singleBed = parseInt(formData.singleBedCount, 10) || 0;
    const doubleBed = parseInt(formData.doubleBedCount, 10) || 0;

    if (singleBed === 0 && doubleBed === 0) {
      Alert.alert('Validation Error', 'Please add at least one bed');
      return;
    }

    try {
      const data = {
        roomType: formData.roomType,
        singleBedCount: singleBed,
        doubleBedCount: doubleBed,
        pricePerNight: parseFloat(formData.pricePerNight),
        totalCount: parseInt(formData.totalCount, 10),
        availableCount: formData.availableCount
          ? parseInt(formData.availableCount, 10)
          : parseInt(formData.totalCount, 10),
        imageURLs: imageUrls,
      };

      if (mode === 'create') {
        await handleCreateRoomType({ ...data, hotelId });
      } else {
        await handleUpdateRoomType(roomTypeId, data);
      }

      router.back();
    } catch {
      // handled in hook
    }
  };

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;

  if (loadingData) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="items-center justify-center flex-1 bg-background dark:bg-background-dark"
      >
        <ActivityIndicator size="large" color={primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-4">
          <Pressable onPress={() => router.back()} style={{ padding: 6, marginBottom: 12 }}>
            <Ionicons name="chevron-back" size={24} color={text} />
          </Pressable>
          <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
            {mode === 'create' ? 'Add Room Type' : 'Edit Room Type'}
          </Text>
        </View>

        <View className="px-6 pb-8">
          <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">Room Type *</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {ROOM_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => setFormData({ ...formData, roomType: type })}
                className="px-4 py-2 border rounded-lg"
                style={{
                  backgroundColor: formData.roomType === type ? primary : 'transparent',
                  borderColor: formData.roomType === type ? primary : border,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: formData.roomType === type ? '#fff' : text }}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {(
            [
              ['singleBedCount', 'Single beds'],
              ['doubleBedCount', 'Double beds'],
              ['pricePerNight', 'Price per night (৳) *'],
              ['totalCount', 'Total rooms *'],
              ['availableCount', 'Available rooms'],
            ] as const
          ).map(([key, label]) => (
            <View key={key} className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">{label}</Text>
              <TextInput
                value={formData[key]}
                onChangeText={(v) => setFormData({ ...formData, [key]: v })}
                keyboardType="decimal-pad"
                className="px-4 py-3 border rounded-xl text-text dark:text-text-dark border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
              />
            </View>
          ))}

          <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">Images</Text>
          <View className="flex-row flex-wrap gap-3 mb-3">
            {imageUrls.map((url) => (
              <View key={url}>
                <Image source={{ uri: url }} style={{ width: 88, height: 88, borderRadius: 12 }} />
                <Pressable
                  onPress={() => removeImage(url)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: theme.colors.error,
                    borderRadius: 999,
                    padding: 2,
                  }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            onPress={pickAndUploadImage}
            disabled={uploadingImage}
            className="flex-row items-center justify-center py-3 mb-6 border rounded-xl border-border dark:border-border-dark"
          >
            {uploadingImage ? (
              <ActivityIndicator color={primary} />
            ) : (
              <>
                <Ionicons name="image-outline" size={18} color={primary} />
                <Text className="ml-2 font-semibold" style={{ color: primary }}>
                  Add image
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            disabled={loading || uploadingImage}
            className="items-center py-3 rounded-xl"
            style={{ backgroundColor: primary, opacity: loading || uploadingImage ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {mode === 'create' ? 'Create room type' : 'Save changes'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
