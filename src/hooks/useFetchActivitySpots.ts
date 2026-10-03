import { useState, useEffect } from 'react';
import { getActivitySpots, ActivitySpot } from '../services/api/activitySpots';

export type { ActivitySpot };

export function useFetchActivitySpots(locationId: string | undefined) {
  const [spots, setSpots] = useState<ActivitySpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) {
      setSpots([]);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getActivitySpots({ locationId, limit: 100 });
        if (active) setSpots(data.results);
      } catch (err: any) {
        if (__DEV__) console.error('[useFetchActivitySpots] error:', err?.message);
        if (active) {
          setError(err?.message || 'Failed to fetch activity spots');
          setSpots([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [locationId]);

  return { spots, isLoading, error };
}
