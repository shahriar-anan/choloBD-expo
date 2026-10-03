/**
 * Public guide catalog. Contact fields are dropped even if the payload includes them.
 */

import { getApiInstance } from './axiosClient';
import { unwrapList } from './personalPlanMapping';
import type { PagedResult } from './tourSpots';
import type { GuideAvailability, GuideFilters, GuideSummary } from '../../types/guides';

export async function getGuides(filters?: GuideFilters): Promise<PagedResult<GuideSummary>> {
  const api = getApiInstance();
  const params: Record<string, string | number | boolean> = {};
  if (filters?.locationId) params.locationId = filters.locationId;
  if (filters?.divisionId) params.divisionId = filters.divisionId;
  if (filters?.specialization) params.specialization = filters.specialization;
  if (filters?.language) params.language = filters.language;
  if (filters?.name) params.name = filters.name;
  if (filters?.isVerified !== undefined) params.isVerified = filters.isVerified;
  if (filters?.minRating !== undefined) params.minRating = filters.minRating;
  if (filters?.page !== undefined) params.page = filters.page;
  if (filters?.limit !== undefined) params.limit = filters.limit;

  try {
    const response = await api.get('/api/guides', { params });
    return readPage(response.data?.data);
  } catch (error: unknown) {
    throw new Error(readApiMessage(error));
  }
}

export async function getGuideById(guideId: string): Promise<GuideSummary> {
  const api = getApiInstance();
  try {
    const response = await api.get(`/api/guides/${guideId}`);
    const guide = response.data?.data;
    if (!guide?.id) {
      throw new Error(response.data?.message || 'Guide not found');
    }
    return mapGuide(guide);
  } catch (error: unknown) {
    throw new Error(readApiMessage(error));
  }
}

export async function checkGuideAvailability(
  guideId: string,
  query: { bookingDate: string; endTime: string; startTime?: string }
): Promise<GuideAvailability> {
  const api = getApiInstance();
  const params: Record<string, string> = {
    bookingDate: query.bookingDate,
    endTime: query.endTime,
  };
  if (query.startTime) params.startTime = query.startTime;

  try {
    const response = await api.get(`/api/guides/${guideId}/availability`, { params });
    const data = response.data?.data;
    return {
      available: Boolean(data?.available),
      reason: typeof data?.reason === 'string' ? data.reason : undefined,
    };
  } catch (error: unknown) {
    throw new Error(readApiMessage(error));
  }
}

function mapGuide(guide: any): GuideSummary {
  const locationName = guide.location?.name || '';
  return {
    id: guide.id,
    firstName: guide.firstName || '',
    lastName: guide.lastName || '',
    bio: guide.bio || undefined,
    specializations: Array.isArray(guide.specializations) ? guide.specializations : [],
    languages: Array.isArray(guide.languages) ? guide.languages : [],
    experienceYears: typeof guide.experienceYears === 'number' ? guide.experienceYears : 0,
    toursCompleted: typeof guide.toursCompleted === 'number' ? guide.toursCompleted : 0,
    rating: typeof guide.rating === 'number' ? guide.rating : 0,
    pricePerDay: typeof guide.pricePerDay === 'number' ? guide.pricePerDay : 0,
    isVerified: Boolean(guide.isVerified),
    locationId: guide.location?.id || guide.locationId,
    locationName,
    imageUrl: guide.images?.[0]?.url || undefined,
    workingDays: Array.isArray(guide.workingDays) ? guide.workingDays.filter((day: unknown) => typeof day === 'number') : [],
    workingHoursStart: guide.workingHoursStart || undefined,
    workingHoursEnd: guide.workingHoursEnd || undefined,
    requiresStartTime: Boolean(guide.requiresStartTime),
    unavailableDates: readUnavailableDates(guide.unavailableDates),
  };
}

function readUnavailableDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function readPage(data: unknown): PagedResult<GuideSummary> {
  const rows = unwrapList<any>(data);
  const payload = data && typeof data === 'object' && !Array.isArray(data)
    ? data as { total?: number; page?: number; limit?: number }
    : {};
  return {
    results: rows.map(mapGuide),
    total: typeof payload.total === 'number' ? payload.total : rows.length,
    page: typeof payload.page === 'number' ? payload.page : 1,
    limit: typeof payload.limit === 'number' ? payload.limit : (rows.length || 20),
  };
}

function readApiMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || 'Request failed';
}
