import { useCallback, useEffect, useState } from 'react';
import { getGuideById, getGuides } from '../services/api/guides';
import type { GuideFilters, GuideSummary } from '../types/guides';
import { usePagedCatalog } from './usePagedCatalog';

export function useGuides(filters: Omit<GuideFilters, 'page' | 'limit'>, enabled = true) {
  const filterKey = JSON.stringify(filters);
  const loadPage = useCallback(
    (page: number) => getGuides({ ...filters, page, limit: 20 }),
    [filterKey],
  );
  return usePagedCatalog(filterKey, loadPage, enabled);
}

export function useGuideDetail(guideId?: string) {
  const [guide, setGuide] = useState<GuideSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(guideId));
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!guideId) {
      setGuide(null);
      setIsLoading(false);
      setError('Guide not found');
      return;
    }

    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getGuideById(guideId);
        if (active) setGuide(data);
      } catch (err: unknown) {
        if (!active) return;
        setGuide(null);
        setError(err instanceof Error ? err.message : 'Guide not found');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [guideId, reloadKey]);

  const refresh = useCallback(() => setReloadKey((value) => value + 1), []);

  return { guide, isLoading, error, refresh };
}
