import { appAlert } from '../components/ui/appAlert';
import { useCallback } from 'react';

import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  createDraftPost,
  updatePostImages,
  tagUser,
  respondToTag,
  removeTag,
  reactToPost,
  deactivatePost,
} from '../store/slices/communitySlice';
import { uploadCommunityImage } from '../services/api/communityMedia';
import { COMMUNITY_IMAGE_UPLOAD_ENABLED } from '../constants/api';

export function useCommunityPostLogic() {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((s: RootState) => s.community);

  const createDraft = useCallback(async (data: { userTripPlanId?: string; caption?: string }) => {
    try {
      const res = await dispatch(createDraftPost(data)).unwrap();
      return res;
    } catch (error: any) {
      console.error('[useCommunityPostLogic] createDraft error:', error);
      appAlert('Error', error?.message || 'Failed to create draft post', undefined, 'error');
      return null;
    }
  }, [dispatch]);

  const uploadImagesAndAttach = useCallback(
    async (postId: string, images: Array<{ url: string; order?: number; altText?: string }>) => {
      try {
        const res = await dispatch(updatePostImages({ postId, body: { images } })).unwrap();
        return res;
      } catch (error: any) {
        console.error('[useCommunityPostLogic] updatePostImages error:', error);
        appAlert('Error', error?.message || 'Failed to upload images', undefined, 'error');
        return null;
      }
    },
    [dispatch]
  );

  const pickAndUploadImages = useCallback(async (currentCount = 0) => {
    try {
      if (!COMMUNITY_IMAGE_UPLOAD_ENABLED) {
        appAlert('Image upload unavailable', 'The app is currently configured for manual image URLs only.');
        return [] as Array<{ url: string; order?: number; altText?: string }>;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        appAlert('Permission required', 'Please allow access to your photo library to add images.');
        return [] as Array<{ url: string; order?: number; altText?: string }>;
      }

      const remaining = Math.max(1, 5 - currentCount);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return [] as Array<{ url: string; order?: number; altText?: string }>;
      }

      const uploads: Array<{ url: string; order?: number; altText?: string }> = [];
      for (let index = 0; index < result.assets.length && uploads.length < remaining; index += 1) {
        const asset = result.assets[index];
        try {
          const url = await uploadCommunityImage({
            uri: asset.uri,
            name: asset.fileName || `community-${Date.now()}-${index}.jpg`,
            type: asset.mimeType || 'image/jpeg',
          });
          uploads.push({
            url,
            order: currentCount + uploads.length,
            altText: asset.fileName || 'community image',
          });
        } catch (uploadError: any) {
          console.error('[useCommunityPostLogic] uploadCommunityImage error:', uploadError);
          appAlert('Upload failed', uploadError?.message || 'Could not upload one of the selected images.', undefined, 'error');
        }
      }

      return uploads;
    } catch (error: any) {
      console.error('[useCommunityPostLogic] pickAndUploadImages error:', error);
      appAlert('Error', error?.message || 'Failed to select images.', undefined, 'error');
      return [] as Array<{ url: string; order?: number; altText?: string }>;
    }
  }, []);

  const takeAndUploadPhoto = useCallback(async () => {
    try {
      if (!COMMUNITY_IMAGE_UPLOAD_ENABLED) {
        appAlert('Image upload unavailable', 'The app is currently configured for manual image URLs only.');
        return null;
      }

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        appAlert('Permission required', 'Please allow access to your camera to take photos.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return null;
      }

      const asset = result.assets[0];
      try {
        const url = await uploadCommunityImage({
          uri: asset.uri,
          name: asset.fileName || `community-${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        });
        return {
          url,
          order: 0, // will be set by caller based on current count
          altText: asset.fileName || 'community photo',
        };
      } catch (uploadError: any) {
        console.error('[useCommunityPostLogic] uploadCommunityImage error:', uploadError);
        appAlert('Upload failed', uploadError?.message || 'Could not upload the captured photo.', undefined, 'error');
        return null;
      }
    } catch (error: any) {
      console.error('[useCommunityPostLogic] takeAndUploadPhoto error:', error);
      appAlert('Error', error?.message || 'Failed to take photo.', undefined, 'error');
      return null;
    }
  }, []);

  const doTagUser = useCallback(async (postId: string, taggedUserId: string) => {
    try {
      const res = await dispatch(tagUser({ postId, body: { taggedUserId } })).unwrap();
      return res;
    } catch (error: any) {
      console.error('[useCommunityPostLogic] tagUser error:', error);
      appAlert('Error', error?.message || 'Failed to tag user', undefined, 'error');
      return null;
    }
  }, [dispatch]);

  const respondTag = useCallback(async (postId: string, response: 'ACCEPTED' | 'DECLINED') => {
    try {
      const res = await dispatch(respondToTag({ postId, body: { response } })).unwrap();
      return res;
    } catch (error: any) {
      console.error('[useCommunityPostLogic] respondToTag error:', error);
      appAlert('Error', error?.message || 'Failed to respond to tag', undefined, 'error');
      return null;
    }
  }, [dispatch]);

  const doRemoveTag = useCallback(async (postId: string, taggedUserId: string) => {
    try {
      const res = await dispatch(removeTag({ postId, taggedUserId })).unwrap();
      return res;
    } catch (error: any) {
      console.error('[useCommunityPostLogic] removeTag error:', error);
      appAlert('Error', error?.message || 'Failed to remove tag', undefined, 'error');
      return null;
    }
  }, [dispatch]);

  const toggleReact = useCallback(async (postId: string) => {
    try {
      const res = await dispatch(reactToPost(postId)).unwrap();
      return res;
    } catch (error: any) {
      console.error('[useCommunityPostLogic] reactToPost error:', error);
      appAlert('Error', error?.message || 'Failed to react to post', undefined, 'error');
      return null;
    }
  }, [dispatch]);

  const doDeactivate = useCallback(async (postId: string) => {
    try {
      const res = await dispatch(deactivatePost(postId)).unwrap();
      return res;
    } catch (error: any) {
      console.error('[useCommunityPostLogic] deactivatePost error:', error);
      appAlert('Error', error?.message || 'Failed to deactivate post', undefined, 'error');
      return null;
    }
  }, [dispatch]);

  return {
    // state
    feed: state.feed,
    currentPost: state.currentPost,
    loading: state.formLoading || state.currentLoading,
    error: state.formError || state.currentError,

    // actions
    createDraft,
    uploadImagesAndAttach,
    pickAndUploadImages,
    takeAndUploadPhoto,
    doTagUser,
    respondTag,
    doRemoveTag,
    toggleReact,
    doDeactivate,
  };
}
