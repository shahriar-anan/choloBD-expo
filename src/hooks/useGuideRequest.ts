import { useCallback, useState } from 'react';
import { checkGuideAvailability } from '../services/api/guides';
import { createGuideBooking } from '../services/api/guideBookings';
import type { CreateGuideBookingInput, GuideAvailability } from '../types/guides';

export function useGuideRequest(guideId?: string) {
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<GuideAvailability | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const check = useCallback(async (query: { bookingDate: string; endTime: string; startTime?: string }) => {
    if (!guideId) return null;
    setIsChecking(true);
    setCheckError(null);
    try {
      const result = await checkGuideAvailability(guideId, query);
      setAvailability(result);
      return result;
    } catch (err: unknown) {
      setAvailability(null);
      const message = err instanceof Error ? err.message : 'Could not check availability';
      setCheckError(message);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [guideId]);

  const submit = useCallback(async (input: CreateGuideBookingInput): Promise<string | null> => {
    if (availability && !availability.available) {
      setSubmitError(availability.reason || 'Guide is not available');
      return null;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createGuideBooking(input);
      setSubmitted(true);
      return created.id;
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Guide request could not be sent');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [availability]);

  return {
    check,
    submit,
    isChecking,
    availability,
    checkError,
    isSubmitting,
    submitError,
    submitted,
  };
}
