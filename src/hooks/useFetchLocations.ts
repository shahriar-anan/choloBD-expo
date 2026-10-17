import { appAlert } from '../components/ui/appAlert';
import { useEffect, useState } from 'react';

import { fetchLocations } from '../services/api/locations';
import { Location } from '../types/locations';
import { useLanguage } from '../providers/LanguageProvider';

export function useFetchLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    load();
  }, [currentLanguage]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchLocations({ localize: true });
      setLocations(data);
    } catch (e: any) {
      if (__DEV__) console.error('[useFetchLocations] error', e?.response?.data || e.message);
      appAlert('Error', 'Failed to load locations', undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    locations,
    loading,
    refetch: load,
  };
}
