import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { fetchHotels, HotelFilters } from '../services/api/hotels';
import { Hotel } from '../types/hotels';
import { useLanguage } from '../providers/LanguageProvider';

export function useFetchHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFilters = useRef<HotelFilters | null>(null);
  const { currentLanguage } = useLanguage();

  const fetchHotelsAction = async (filters: HotelFilters = {}) => {
    lastFilters.current = filters;
    try {
      setLoading(true);
      const data = await fetchHotels(filters);
      setHotels(data);
    } catch (e: any) {
      if (__DEV__) console.error('[useFetchHotels] error', e?.response?.data || e.message);
      Alert.alert('Error', 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lastFilters.current) {
      fetchHotelsAction(lastFilters.current);
    }
  }, [currentLanguage]);

  return {
    hotels,
    loading,
    fetchHotels: fetchHotelsAction,
    clearHotels: () => {
      lastFilters.current = null;
      setHotels([]);
    },
  };
}
