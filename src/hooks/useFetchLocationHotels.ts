import { appAlert } from '../components/ui/appAlert';
import { useState } from 'react';

import { fetchHotels } from '../services/api/hotels';
import { Hotel } from '../types/hotels';

export function useFetchLocationHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHotelsForLocation = async (
    locationId: string,
    filters?: { minRating?: number; hotelType?: string }
  ) => {
    try {
      setLoading(true);
      const data = await fetchHotels({
        locationId,
        hotelType: filters?.hotelType,
        minRating: filters?.minRating,
        isActive: true,
      });
      setHotels(data);
    } catch (e: any) {
      if (__DEV__) console.error('[useFetchLocationHotels] error', e?.response?.data || e.message);
      appAlert('Error', 'Failed to load available hotels', undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    hotels,
    loading,
    fetchHotelsForLocation,
  };
}
