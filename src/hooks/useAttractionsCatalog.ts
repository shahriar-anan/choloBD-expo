import { useCallback } from 'react';
import { getTourSpots, TourSpotFilters } from '../services/api/tourSpots';
import { getActivitySpots, ActivitySpotFilters } from '../services/api/activitySpots';
import { usePagedCatalog } from './usePagedCatalog';

export function usePlaceCatalog(filters: Omit<TourSpotFilters, 'page' | 'limit'>, enabled = true) {
  const filterKey = JSON.stringify(filters);
  const loadPage = useCallback(
    (page: number) => getTourSpots({ ...filters, page, limit: 20 }),
    [filterKey],
  );
  return usePagedCatalog(filterKey, loadPage, enabled);
}

export function useActivityCatalog(filters: Omit<ActivitySpotFilters, 'page' | 'limit'>, enabled = true) {
  const filterKey = JSON.stringify(filters);
  const loadPage = useCallback(
    (page: number) => getActivitySpots({ ...filters, page, limit: 20 }),
    [filterKey],
  );
  return usePagedCatalog(filterKey, loadPage, enabled);
}
