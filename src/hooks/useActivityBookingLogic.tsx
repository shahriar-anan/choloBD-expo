import { useCallback, useState } from 'react';
import { createActivityBooking, CreateActivityBookingInput } from '../services/api/activityBookings';

export function useActivityBookingLogic() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const book = useCallback(async (input: CreateActivityBookingInput): Promise<string | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createActivityBooking(input);
      return created.id;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Activity booking could not be created';
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { book, isSubmitting, error };
}
