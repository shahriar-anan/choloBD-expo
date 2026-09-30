import { useCallback, useEffect, useState } from 'react';
import { fetchPopularHotels, PopularHotel } from '../services/api/hotels';
import { getPopularActivitySpots, getActivitySpotById, ActivitySpot } from '../services/api/activitySpots';
import { getPopularTourSpots, TourSpot } from '../services/api/tourSpots';
import { fetchActivePosts } from '../services/api/community';
import { CommunityPost } from '../types/community';
import { fetchLocations } from '../services/api/locations';

export interface PopularPlace {
  locationId: string;
  name: string;
  imageUrl?: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return 'Request failed';
}

export function useLocationIdsByName() {
  const [byName, setByName] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const rows = await fetchLocations();
        if (!active || !Array.isArray(rows)) return;
        const next: Record<string, string> = {};
        const rank: Record<string, number> = {};
        for (const row of rows) {
          const name = row.name?.trim().toLowerCase();
          if (!name || !row.id) continue;
          const score = row.locationType === 'DISTRICT' ? 2 : 1;
          if ((rank[name] ?? 0) > score) continue;
          next[name] = row.id;
          rank[name] = score;
        }
        setByName(next);
      } catch {
        if (active) setByName({});
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return byName;
}

export function groupSpotsByLocation(spots: TourSpot[], cap = 8): PopularPlace[] {
  const places: PopularPlace[] = [];
  const seen = new Set<string>();
  for (const spot of spots) {
    if (!spot.locationId || seen.has(spot.locationId)) continue;
    seen.add(spot.locationId);
    places.push({
      locationId: spot.locationId,
      name: spot.locationName,
      imageUrl: spot.imageUrl,
    });
    if (places.length >= cap) break;
  }
  return places;
}

function useLoad<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const next = await loader();
        if (active) setData(next);
      } catch (err: unknown) {
        if (active) {
          setError(errorMessage(err));
          setData(initial);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [reloadToken]);

  return { data, isLoading, error, refetch };
}

export function usePopularPlaces() {
  const { data, isLoading, error, refetch } = useLoad(
    async () => groupSpotsByLocation(await getPopularTourSpots(24)),
    [] as PopularPlace[]
  );
  return { places: data, isLoading, error, refetch };
}

export function usePopularHotels() {
  const { data, isLoading, error, refetch } = useLoad(
    () => fetchPopularHotels(8),
    [] as PopularHotel[]
  );
  return { hotels: data, isLoading, error, refetch };
}

export function usePopularActivities() {
  const { data, isLoading, error, refetch } = useLoad(
    () => getPopularActivitySpots(8),
    [] as ActivitySpot[]
  );
  return { activities: data, isLoading, error, refetch };
}

export function useHomeCommunityPosts() {
  const { data, isLoading, error, refetch } = useLoad(async () => {
    const page = await fetchActivePosts({ page: 1, limit: 6 });
    return page.results ?? [];
  }, [] as CommunityPost[]);
  return { posts: data, isLoading, error, refetch };
}

export function useActivityPreview(activitySpotId?: string) {
  const [spot, setSpot] = useState<ActivitySpot | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(activitySpotId));
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!activitySpotId) {
        setSpot(null);
        setIsLoading(false);
        setError(null);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const next = await getActivitySpotById(activitySpotId);
        if (!active) return;
        setSpot(next);
        if (!next) setError('Request failed');
      } catch (err: unknown) {
        if (!active) return;
        setSpot(null);
        setError(errorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [activitySpotId, reloadToken]);

  return { spot, isLoading, error, refetch };
}
