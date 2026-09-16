/**
 * Tour Image Upload Component
 * Handles image picking and uploading for personal tour packages
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { usePersonalTourPlanLogic } from '../../hooks/usePersonalTourPlanLogic';

interface TourImage {
  url: string;
  publicId?: string;
}

interface TourImageUploadProps {
  tourId?: string;
  initialImages?: TourImage[];
  onImagesChange?: (images: TourImage[]) => void;
  maxImages?: number;
}

export function TourImageUpload({
  tourId,
  initialImages = [],
  onImagesChange,
  maxImages = 5,
}: TourImageUploadProps) {
  const { isDark } = useTheme();
  const [images, setImages] = useState<TourImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const { uploadImages: uploadTourImages, deleteImages: deleteTourPlanImages } = usePersonalTourPlanLogic();

  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(images);
    }
  }, [images]);

  const canAddMore = images.length < maxImages;

  const pickImages = async () => {
    if (!canAddMore || uploading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxImages - images.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadSelectedImages(result.assets);
      }
    } catch (error) {
      if (__DEV__) console.error('[TourImageUpload] Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const takePhoto = async () => {
    if (!canAddMore || uploading) return;

    if (cameraPermission === false) {
      Alert.alert(
        'Camera Access Denied',
        'Please enable camera permissions in settings to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadSelectedImages(result.assets);
      }
    } catch (error) {
      if (__DEV__) console.error('[TourImageUpload] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadSelectedImages = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);
    try {
      // Convert assets to the format expected by uploadTourImages
      const imageUris = assets.map((asset) => asset.uri);
      
      // Upload images (this would call your API to upload to Cloudinary or Firebase)
      const uploadedUrls = await uploadTourImages(imageUris);
      
      const newImages: TourImage[] = uploadedUrls.map((url) => ({ url }));
      setImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      if (__DEV__) console.error('[TourImageUpload] Error uploading images:', error);
      Alert.alert('Error', 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // If we have a tourId and the image has a publicId, delete from server
              if (tourId && imageToRemove.publicId) {
                await deleteTourPlanImages(tourId, [imageToRemove.publicId]);
              }
              
              setImages((prev) => prev.filter((_, i) => i !== index));
            } catch (error) {
              if (__DEV__) console.error('[TourImageUpload] Error removing image:', error);
              Alert.alert('Error', 'Failed to remove image. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text style={{ color: textColor }} className="text-base font-semibold">
            Tour Images
          </Text>
          <Text style={{ color: mutedColor }} className="text-xs mt-0.5">
            {images.length} / {maxImages} images
          </Text>
        </View>
        {images.length > 0 && (
          <Text style={{ color: mutedColor }} className="text-xs">
            Optional
          </Text>
        )}
      </View>

      {/* Image Grid */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
          contentContainerStyle={{ gap: 12 }}
        >
          {images.map((image, index) => (
            <View
              key={index}
              style={{ borderColor: borderColor }}
              className="relative w-32 h-32 rounded-lg border overflow-hidden"
            >
              <Image
                source={{ uri: image.url }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => removeImage(index)}
                style={{ backgroundColor: errorColor }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Upload Buttons */}
      {canAddMore && (
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={pickImages}
            disabled={uploading}
            style={{
              backgroundColor: primaryColor,
              opacity: uploading ? 0.5 : 1,
            }}
            className="flex-1 py-3 rounded-lg flex-row items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white font-semibold text-sm">Uploading...</Text>
              </>
            ) : (
              <>
                <Ionicons name="images" size={18} color="#fff" />
                <Text className="text-white font-semibold text-sm">Choose Photos</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePhoto}
            disabled={uploading}
            style={{
              borderColor: primaryColor,
              opacity: uploading ? 0.5 : 1,
            }}
            className="flex-1 py-3 rounded-lg border flex-row items-center justify-center gap-2"
          >
            <Ionicons name="camera" size={18} color={primaryColor} />
            <Text style={{ color: primaryColor }} className="font-semibold text-sm">
              Take Photo
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Text */}
      {images.length === 0 && (
        <View className="mt-3 p-3 rounded-lg" style={{ backgroundColor: mutedColor + '20' }}>
          <Text style={{ color: mutedColor }} className="text-xs text-center">
            Add up to {maxImages} photos to showcase your tour package. You can skip this and add
            photos later.
          </Text>
        </View>
      )}
    </View>
  );
}
