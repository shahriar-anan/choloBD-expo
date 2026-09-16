import { useCallback, useState } from 'react';
import {
  createPersonalTourPlan,
  deletePersonalTourPlan,
  deletePersonalTourPlanImages,
  getPersonalTourPlan,
  updatePersonalTourPlan,
} from '../services/api/tourBuilder';
import { cloudinaryUpload } from '../services/api/cloudinaryUpload';
import {
  CreatePersonalTourPlanData,
  TourPackage,
  UpdatePersonalTourPlanData,
} from '../types/tours';

export function usePersonalTourPlanLogic() {
  const [currentPlan, setCurrentPlan] = useState<TourPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async (tourPackageId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const plan = await getPersonalTourPlan(tourPackageId);
      setCurrentPlan(plan);
      return plan;
    } catch (err: any) {
      const message = err?.message || 'Failed to load personal tour plan';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPlan = useCallback(async (data: CreatePersonalTourPlanData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const plan = await createPersonalTourPlan(data);
      setCurrentPlan(plan);
      return plan;
    } catch (err: any) {
      const message = err?.message || 'Failed to create personal tour plan';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updatePlan = useCallback(async (tourPackageId: string, data: UpdatePersonalTourPlanData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const plan = await updatePersonalTourPlan(tourPackageId, data);
      setCurrentPlan(plan);
      return plan;
    } catch (err: any) {
      const message = err?.message || 'Failed to update personal tour plan';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deletePlan = useCallback(async (tourPackageId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await deletePersonalTourPlan(tourPackageId);
      setCurrentPlan(null);
    } catch (err: any) {
      const message = err?.message || 'Failed to delete personal tour plan';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteImages = useCallback(async (tourPackageId: string, imageIds: string[]) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await deletePersonalTourPlanImages(tourPackageId, imageIds);
      if (currentPlan?.id === tourPackageId) {
        await loadPlan(tourPackageId);
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to delete tour images';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentPlan?.id, loadPlan]);

  const uploadImages = useCallback(async (imageUris: string[]): Promise<string[]> => {
    try {
      setIsSubmitting(true);
      setError(null);

      const uploadPromises = imageUris.map((uri) =>
        cloudinaryUpload(uri, 'cholo_bd/personal-tours')
      );

      const results = await Promise.all(uploadPromises);
      const urls = results.map((result: { secure_url: string }) => result.secure_url);

      return urls;
    } catch (err: any) {
      const message = err?.message || 'Failed to upload images';
      setError(message);
      if (__DEV__) console.error('[usePersonalTourPlanLogic] Upload error:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    currentPlan,
    isLoading,
    isSubmitting,
    error,
    loadPlan,
    createPlan,
    updatePlan,
    deletePlan,
    deleteImages,
    uploadImages,
    clearError: () => setError(null),
  };
}
