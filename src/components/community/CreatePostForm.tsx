import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, Linking } from 'react-native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useCommunityPostLogic } from '../../hooks/useCommunityPostLogic';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

const communityCreateFormSchema = z.object({
  userTripPlanId: z.string().uuid().optional(),
  caption: z.string().min(1, 'Caption is required').max(2000, 'Caption must be 2000 characters or less'),
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL'),
        order: z.number().int().nonnegative().optional(),
        altText: z.string().max(500).optional(),
      })
    )
    .min(1, 'At least one image is required')
    .max(5, 'Max 5 images allowed'),
});

type CreatePostFormValues = z.infer<typeof communityCreateFormSchema>;

interface CreatePostFormProps {
  initialValues?: Partial<CreatePostFormValues>;
  onSubmit: (values: CreatePostFormValues) => void;
  isSubmitting?: boolean;
}

export function CreatePostForm({ initialValues, onSubmit, isSubmitting }: CreatePostFormProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { pickAndUploadImages, takeAndUploadPhoto } = useCommunityPostLogic();
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const [isPickingImages, setIsPickingImages] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  const { control, handleSubmit, reset } = useForm<CreatePostFormValues>({
    resolver: zodResolver(communityCreateFormSchema),
    defaultValues: {
      userTripPlanId: initialValues?.userTripPlanId,
      caption: initialValues?.caption ?? '',
      images: initialValues?.images ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'images' });

  useEffect(() => {
    reset({
      userTripPlanId: initialValues?.userTripPlanId,
      caption: initialValues?.caption ?? '',
      images: initialValues?.images ?? [],
    });
  }, [initialValues, reset]);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  const submit = (values: CreatePostFormValues) => onSubmit(values);

  const handleInvalidSubmit = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    const message = firstError?.message || 'Please check the form for errors';
    Alert.alert(t('common.error'), message);
  };

  const handlePickAndUploadImages = async () => {
    if (isSubmitting || isPickingImages) return;

    setIsPickingImages(true);
    try {
      const uploads = await pickAndUploadImages(fields.length);
      for (const upload of uploads) {
        append({
          url: upload.url,
          order: upload.order ?? fields.length,
          altText: upload.altText ?? 'community image',
        });
      }
    } finally {
      setIsPickingImages(false);
    }
  };

  const handleTakeAndUploadPhoto = async () => {
    if (isSubmitting || isTakingPhoto) return;

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

    setIsTakingPhoto(true);
    try {
      const upload = await takeAndUploadPhoto();
      if (upload) {
        append({
          url: upload.url,
          order: upload.order ?? fields.length,
          altText: upload.altText ?? 'community photo',
        });
      }
    } finally {
      setIsTakingPhoto(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}> 
        <Text style={[styles.label, { color: text }]}>{t(TRANSLATION_KEYS.COMMUNITY.CAPTION_LABEL)}</Text>
        <Controller
          control={control}
          name="caption"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              multiline
              placeholder={t(TRANSLATION_KEYS.COMMUNITY.CAPTION_PLACEHOLDER)}
              placeholderTextColor={muted}
              style={[styles.input, { color: text, borderColor: border }]}
            />
          )}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.label, { color: text }]}>{t(TRANSLATION_KEYS.COMMUNITY.IMAGE_URLS_LABEL)}</Text>
        </View>
        <Text style={[styles.helperText, { color: muted }]}>Upload photos from your device or take a photo. They will be automatically uploaded to cloud storage.</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            onPress={handlePickAndUploadImages} 
            disabled={isSubmitting || isPickingImages || fields.length >= 5} 
            style={[styles.pickBtn, { borderColor: primary, backgroundColor: fields.length >= 5 ? muted : 'transparent' }]}
          >
            {isPickingImages ? (
              <ActivityIndicator size="small" color={primary} />
            ) : (
              <>
                <Ionicons name="image-outline" size={16} color={fields.length >= 5 ? muted : primary} />
                <Text style={[styles.pickBtnText, { color: fields.length >= 5 ? muted : primary }]}>{t(TRANSLATION_KEYS.COMMUNITY.PICK_FROM_DEVICE)}</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleTakeAndUploadPhoto} 
            disabled={isSubmitting || isTakingPhoto || fields.length >= 5} 
            style={[styles.pickBtn, { borderColor: primary, backgroundColor: fields.length >= 5 ? muted : 'transparent' }]}
          >
            {isTakingPhoto ? (
              <ActivityIndicator size="small" color={primary} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={16} color={fields.length >= 5 ? muted : primary} />
                <Text style={[styles.pickBtnText, { color: fields.length >= 5 ? muted : primary }]}>Take Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {fields.map((field, index) => (
          <View key={field.id} style={styles.imagePreviewRow}>
            <Image source={{ uri: field.url }} style={styles.imagePreview} />
            <TouchableOpacity onPress={() => remove(index)} style={styles.removeBtn}>
              <Ionicons name="close-circle" size={24} color={errorColor} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSubmit(submit, handleInvalidSubmit)}
          disabled={isSubmitting}
          style={[styles.primaryBtn, { backgroundColor: primary }]}
        >
          <Text style={styles.primaryBtnText}>{isSubmitting ? t(TRANSLATION_KEYS.COMMUNITY.SAVING) : t('common.save')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    marginBottom: 12,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeBtn: {
    padding: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  pickBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
