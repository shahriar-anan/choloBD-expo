import { appAlert } from '../components/ui/appAlert';
import { useEffect, useRef, useState } from 'react';

import { fetchHotelById } from '../services/api/hotelDetail';
import { HotelDetail } from '../types/hotels';
import { useLanguage } from '../providers/LanguageProvider';

export function useFetchHotelDetail() {
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const lastHotelId = useRef<string | null>(null);
  const { currentLanguage } = useLanguage();

  const fetchHotelDetail = async (hotelId: string) => {
    lastHotelId.current = hotelId;
    try {
      setLoading(true);
      const data = await fetchHotelById(hotelId);
      setHotel(data);
      return data;
    } catch (e: any) {
      if (__DEV__) console.error('[useFetchHotelDetail] error', e?.response?.data || e.message);
      appAlert('Error', 'Failed to load hotel details', undefined, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lastHotelId.current) {
      fetchHotelDetail(lastHotelId.current);
    }
  }, [currentLanguage]);

  return {
    hotel,
    loading,
    fetchHotelDetail,
    clearHotel: () => {
      lastHotelId.current = null;
      setHotel(null);
    },
  };
}
