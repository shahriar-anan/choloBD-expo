import { useCallback, useState } from 'react';
import { getUserProfile, getMyHotel, getOperatorHotel, getHotelRooms } from '../services/api/users';

export function useServiceAdminLogic() {
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (__DEV__) console.log('[useServiceAdminLogic.fetchProfile] Calling getUserProfile...');
      const result = await getUserProfile();
      if (__DEV__) console.log('[useServiceAdminLogic.fetchProfile] Success:', result);
      return result;
    } catch (e) {
      console.error('[useServiceAdminLogic.fetchProfile] ❌ Error:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyHotel = useCallback(async () => {
    try {
      setLoading(true);
      if (__DEV__) console.log('[useServiceAdminLogic.fetchMyHotel] Calling getMyHotel...');
      const result = await getMyHotel();
      if (__DEV__) console.log('[useServiceAdminLogic.fetchMyHotel] Success:', { length: result.length });
      return result;
    } catch (e: any) {
      console.error('[useServiceAdminLogic.fetchMyHotel] ❌ Error:', {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
        fullError: e
      });
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOperatorHotel = useCallback(async (hotelId: string) => {
    try {
      setLoading(true);
      const result = await getOperatorHotel(hotelId);
      return result;
    } catch (e: any) {
      console.error('[useServiceAdminLogic.fetchOperatorHotel] Error:', e?.message ?? e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHotelRooms = useCallback(async (hotelId: string) => {
    try {
      setLoading(true);
      if (__DEV__) console.log('[useServiceAdminLogic.fetchHotelRooms] Calling getHotelRooms...', { hotelId });
      const result = await getHotelRooms(hotelId);
      if (__DEV__) console.log('[useServiceAdminLogic.fetchHotelRooms] Success:', result);
      return result;
    } catch (e: any) {
      console.error('[useServiceAdminLogic.fetchHotelRooms] ❌ Error:', {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data
      });
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchProfile,
    fetchMyHotel,
    fetchOperatorHotel,
    fetchHotelRooms,
  };
}

export default useServiceAdminLogic;
