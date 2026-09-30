import { useState, useEffect } from 'react';
import { getTourPlans } from '../services/api/tourBuilder';
import { TourPackage, TourFilters } from '../types/tours';

export function useFetchTourPackages(filters?: TourFilters) {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = () => setReloadToken((token) => token + 1);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        if (__DEV__) console.log('[useFetchTourPackages] Starting fetch with filters:', filters);
        setIsLoading(true);
        setError(null);
        const data = await getTourPlans(filters);
        if (__DEV__) console.log('[useFetchTourPackages] Fetch successful, count:', data.length);
        if (active) setPackages(data);
      } catch (err: any) {
        if (__DEV__) console.error('[useFetchTourPackages] Fetch error:', err?.response?.data || err.message);
        if (active) {
          setError(err?.message || 'Failed to fetch tour packages');
          setPackages([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [JSON.stringify(filters), reloadToken]);

  return { packages, isLoading, error, refetch };
}
