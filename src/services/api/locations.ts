import { getApiInstance } from './axiosClient';
import { Location } from '../../types/locations';

export async function fetchLocations(): Promise<Location[]> {
  const api = getApiInstance();
  const res = await api.get('/api/locations');
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
