import { useState, useEffect } from 'react';
import { getTourSpots, TourSpot, TourSpotFilters } from '../services/api/tourSpots';

export type { TourSpot };

export function useFetchTourSpots(filters?: TourSpotFilters) {
  const [spots, setSpots] = useState<TourSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        if (__DEV__) console.log('[useFetchTourSpots] Starting fetch with filters:', filters);
        setIsLoading(true);
        setError(null);
        const data = await getTourSpots(filters);
        if (__DEV__) console.log('[useFetchTourSpots] Fetch successful, spots count:', data.results.length);
        if (active) setSpots(data.results);
      } catch (err: any) {
        console.error('[useFetchTourSpots] ❌ Fetch error:', {
          message: err?.message,
          response: err?.response?.data,
          status: err?.response?.status
        });
        if (active) {
          setError(err?.message || 'Failed to fetch tour spots');
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
  }, [JSON.stringify(filters)]);

  return { spots, isLoading, error };
}
