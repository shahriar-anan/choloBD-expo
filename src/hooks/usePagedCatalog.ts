import { useCallback, useEffect, useRef, useState } from 'react';
import type { PagedResult } from '../services/api/tourSpots';

export function usePagedCatalog<T>(
  filterKey: string,
  loadPage: (page: number) => Promise<PagedResult<T>>,
  enabled = true,
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    const requestId = generation.current + 1;
    generation.current = requestId;
    let active = true;

    if (!enabled) return;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setPage(1);
        const data = await loadPage(1);
        if (!active || generation.current !== requestId) return;
        setItems(data.results);
        setTotal(data.total);
        setPage(data.page);
        setLimit(data.limit);
      } catch (err: unknown) {
        if (!active || generation.current !== requestId) return;
        setItems([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        if (active && generation.current === requestId) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [filterKey, reloadKey, enabled]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || page * limit >= total) return;
    setIsLoadingMore(true);
    setError(null);
    const requestId = generation.current;
    try {
      const next = page + 1;
      const data = await loadPage(next);
      if (generation.current !== requestId) return;
      setItems((current) => [...current, ...data.results]);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, page, limit, total, loadPage]);

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  return {
    items,
    total,
    page,
    limit,
    isLoading,
    isLoadingMore,
    error,
    hasMore: page * limit < total,
    loadMore,
    refresh,
  };
}
