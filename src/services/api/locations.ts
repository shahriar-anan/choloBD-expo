import { getApiInstance } from './axiosClient';
import { Location } from '../../types/locations';
import { withCatalogLang } from './catalogLang';

export async function fetchLocations(options?: { localize?: boolean }): Promise<Location[]> {
  const api = getApiInstance();
  const params = options?.localize ? withCatalogLang() : undefined;
  const res = await api.get('/api/locations', params ? { params } : undefined);
  return res.data.data || [];
}

export async function fetchDivisionIdByName(name: string): Promise<string | null> {
  const api = getApiInstance();
  const res = await api.get('/api/locations', { params: { locationType: 'DIVISION' } });
  const rows = (res.data?.data || []) as Array<{ id: string; name?: string }>;
  const target = name.trim().toLowerCase();
  const match = rows.find((row) => row.name?.trim().toLowerCase() === target);
  return match?.id || null;
}

export { Location } from '../../types/locations';
