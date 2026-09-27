/**
 * Personal trip plan itinerary helpers (aligned with web tour-package utils).
 */

import { PersonalDaySegmentInput } from '../types/trips';
import { HotelTypePreference, TransportTypePreference } from '../types/trips';

export const MAX_STOPS_PER_DAY = 4;

export type TourTypeValue =
  | 'ADVENTURE'
  | 'CULTURAL'
  | 'BEACH'
  | 'CITY_TOUR'
  | 'NATURE'
  | 'RELIGIOUS'
  | 'HISTORICAL'
  | 'MIXED';

export const TOUR_TYPE_VALUES: TourTypeValue[] = [
  'ADVENTURE',
  'CULTURAL',
  'BEACH',
  'CITY_TOUR',
  'NATURE',
  'RELIGIOUS',
  'HISTORICAL',
  'MIXED',
];

export interface WizardItineraryStop {
  id: string;
  dayNumber: number;
  segmentOrder: number;
  shortDescription: string;
  tourSpotId: string;
  tourSpotName?: string;
  activitySpotId?: string;
  activitySpotName?: string;
  transportOption?: TransportTypePreference;
  hotelOption?: HotelTypePreference;
  notes?: string;
}

export function inferEndDateString(startDate: string, duration: number): string {
  if (!startDate || !duration) return '';
  const parsed = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  parsed.setDate(parsed.getDate() + duration - 1);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** API datetimes: start at beginning of first day, end at end of last calendar day. */
export function toPersonalPlanStartIso(dateYmd: string): string {
  return `${dateYmd}T00:00:00.000Z`;
}

export function toPersonalPlanEndIso(endDateYmd: string): string {
  return `${endDateYmd}T23:59:59.999Z`;
}

export function tripDurationFromDates(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}

export function countStopsForDay(stops: WizardItineraryStop[], dayNumber: number): number {
  return stops.filter((s) => s.dayNumber === dayNumber).length;
}

export function nextSegmentOrderForDay(stops: WizardItineraryStop[], dayNumber: number): number {
  const orders = stops.filter((s) => s.dayNumber === dayNumber).map((s) => s.segmentOrder || 1);
  return orders.length > 0 ? Math.max(...orders) + 1 : 1;
}

export function missingDurationDays(stops: WizardItineraryStop[], duration: number): number[] {
  if (!duration) return [];
  const withStops = new Set<number>();
  for (const stop of stops) {
    if (stop.dayNumber >= 1 && stop.dayNumber <= duration) withStops.add(stop.dayNumber);
  }
  const missing: number[] = [];
  for (let d = 1; d <= duration; d += 1) {
    if (!withStops.has(d)) missing.push(d);
  }
  return missing;
}

export function createBlankStop(dayNumber: number, segmentOrder: number): WizardItineraryStop {
  return {
    id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    dayNumber,
    segmentOrder,
    shortDescription: '',
    tourSpotId: '',
  };
}

export function applyOvernightHotelToLastStop(stops: WizardItineraryStop[]): WizardItineraryStop[] {
  const byDay = new Map<number, WizardItineraryStop[]>();
  for (const stop of stops) {
    const list = byDay.get(stop.dayNumber) || [];
    list.push({ ...stop });
    byDay.set(stop.dayNumber, list);
  }
  const next: WizardItineraryStop[] = [];
  for (const day of [...byDay.keys()].sort((a, b) => a - b)) {
    const ordered = (byDay.get(day) || [])
      .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1))
      .map((s, index) => ({ ...s, segmentOrder: index + 1 }));
    const hotelSource = [...ordered].reverse().find((s) => s.hotelOption);
    ordered.forEach((stop, index) => {
      const isLast = index === ordered.length - 1;
      next.push({
        ...stop,
        hotelOption: isLast ? hotelSource?.hotelOption : undefined,
      });
    });
  }
  return next.sort((a, b) => a.dayNumber - b.dayNumber || a.segmentOrder - b.segmentOrder);
}

export function wizardStopsToDaySegments(stops: WizardItineraryStop[]): PersonalDaySegmentInput[] {
  const normalized = applyOvernightHotelToLastStop(stops);
  return normalized.map((stop) => ({
    dayNumber: stop.dayNumber,
    segmentOrder: stop.segmentOrder,
    shortDescription: stop.shortDescription.trim(),
    tourSpotId: stop.tourSpotId || undefined,
    activitySpotId: stop.activitySpotId || undefined,
    transportOption: stop.transportOption,
    hotelOption: stop.hotelOption,
    notes: stop.notes?.trim() || undefined,
  }));
}

export function getDetailsContinueBlockReason(input: {
  packageName: string;
  shortDescription: string;
  tourType: string;
  locationId: string;
  startDate: string;
  duration: number;
  estimatedBudget: number;
  participantCount: number;
}): string | null {
  if (!input.packageName.trim() || input.packageName.trim().length < 2) {
    return 'packageName';
  }
  if (!input.shortDescription.trim()) return 'shortDescription';
  if (!input.tourType) return 'tourType';
  if (!input.locationId) return 'location';
  if (!input.startDate) return 'startDate';
  if (!(input.duration > 0 && input.duration <= 60)) return 'duration';
  if (!(input.participantCount >= 1)) return 'participantCount';
  if (!(input.estimatedBudget > 0)) return 'estimatedBudget';
  return null;
}

export function getItineraryContinueBlockReason(
  stops: WizardItineraryStop[],
  duration: number
): 'missingDays' | 'incompleteStop' | 'tooManyStops' | null {
  if (!(duration > 0)) return 'missingDays';
  const missing = missingDurationDays(stops, duration);
  if (missing.length > 0) return 'missingDays';
  for (let day = 1; day <= duration; day += 1) {
    if (countStopsForDay(stops, day) > MAX_STOPS_PER_DAY) return 'tooManyStops';
  }
  const incomplete = stops.some(
    (s) => !s.tourSpotId.trim() || s.shortDescription.trim().length < 2
  );
  if (incomplete) return 'incompleteStop';
  return null;
}
