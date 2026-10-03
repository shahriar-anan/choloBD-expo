import { useCallback } from 'react';
import { getCatalogTourPlansPage } from '../services/api/tourBuilder';
import { getTrips } from '../services/api/tripPlanner';
import type { TourType } from '../types/tours';
import { usePagedCatalog } from './usePagedCatalog';

const PAGE_SIZE = 20;

export function usePersonalPlans(locationId: string | undefined, enabled = true) {
  const filterKey = JSON.stringify({ locationId: locationId ?? '' });
  const loadPage = useCallback(
    async (page: number) => {
      try {
        const data = await getTrips({
          ...(locationId ? { locationId } : {}),
          page,
          limit: PAGE_SIZE,
        });
        return {
          results: data.trips,
          total: data.pagination.total,
          page: data.pagination.page,
          limit: data.pagination.limit,
        };
      } catch (error: unknown) {
        const message = error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Request failed';
        throw new Error(message || 'Request failed');
      }
    },
    [filterKey, locationId],
  );
  return usePagedCatalog(filterKey, loadPage, enabled);
}

export function useCatalogPlans(
  filters: { divisionId?: string; tourType?: TourType },
  enabled = true,
) {
  const filterKey = JSON.stringify({
    divisionId: filters.divisionId ?? '',
    tourType: filters.tourType ?? '',
  });
  const loadPage = useCallback(
    (page: number) =>
      getCatalogTourPlansPage({
        ...(filters.divisionId ? { divisionId: filters.divisionId } : {}),
        ...(filters.tourType ? { tourType: filters.tourType } : {}),
        page,
        limit: PAGE_SIZE,
      }),
    [filterKey, filters.divisionId, filters.tourType],
  );
  return usePagedCatalog(filterKey, loadPage, enabled);
}
