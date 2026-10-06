/**
 * Personal trip itinerary helpers aligned with the web tour-package form.
 */

import { PersonalDaySegmentInput } from '../types/trips';

export const MAX_STOPS_PER_DAY = 4;
export const MIN_DURATION = 1;
export const MAX_DURATION = 14;

export const TOUR_TYPE_VALUES = [
  'ADVENTURE',
  'CULTURAL',
  'BEACH',
  'CITY_TOUR',
  'NATURE',
  'RELIGIOUS',
  'HISTORICAL',
  'MIXED',
] as const;

export const TRANSPORT_VALUES = [
  'BUS',
  'FLIGHT',
  'TRAIN',
  'CAR_RENTAL',
  'FERRY',
  'SELF_MANAGED',
] as const;

export const HOTEL_VALUES = [
  'LUXURY',
  'BUDGET',
  'BOUTIQUE',
  'RESORT',
  'HOSTEL',
  'GUESTHOUSE',
  'APARTMENT',
] as const;

export interface WizardStop {
  id: string;
  dayNumber: number;
  segmentOrder: number;
  shortDescription: string;
  tourSpotId: string;
  tourSpotName?: string;
  tourSpotImageUrl?: string;
  activitySpotId?: string;
  activitySpotName?: string;
  activitySpotImageUrl?: string;
  transportOption?: string;
  hotelOption?: string;
  hotelId?: string;
  hotelName?: string;
  hotelImageUrl?: string;
  activityCost?: number;
  hotelCost?: number;
  notes?: string;
}

export function createClientStopId(): string {
  return `stop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankStop(dayNumber: number, segmentOrder: number): WizardStop {
  return {
    id: createClientStopId(),
    dayNumber,
    segmentOrder,
    shortDescription: '',
    tourSpotId: '',
    activitySpotId: '',
    transportOption: '',
    hotelOption: '',
    hotelId: '',
    notes: '',
    activityCost: 0,
    hotelCost: 0,
  };
}

export function formatEnumLabel(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatTaka(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '৳ 0';
  return `৳ ${Math.round(value).toLocaleString()}`;
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

export function formatDisplayDate(value?: string | null): string {
  if (!value) return '';
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function countStopsForDay(stops: WizardStop[], dayNumber: number): number {
  return stops.filter((stop) => stop.dayNumber === dayNumber).length;
}

export function nextSegmentOrderForDay(stops: WizardStop[], dayNumber: number): number {
  const orders = stops
    .filter((stop) => stop.dayNumber === dayNumber)
    .map((stop) => stop.segmentOrder || 1);
  return orders.length > 0 ? Math.max(...orders) + 1 : 1;
}

export function clampDaySegmentsToDuration(stops: WizardStop[], duration: number): WizardStop[] {
  if (!duration) return [];
  return stops.filter((stop) => stop.dayNumber >= 1 && stop.dayNumber <= duration);
}

export function missingDurationDays(stops: WizardStop[], duration: number): number[] {
  if (!duration) return [];
  const present = new Set(
    stops
      .map((stop) => stop.dayNumber)
      .filter((day) => day >= 1 && day <= duration)
  );
  const missing: number[] = [];
  for (let day = 1; day <= duration; day += 1) {
    if (!present.has(day)) missing.push(day);
  }
  return missing;
}

export function getDetailsContinueReason(input: {
  packageName: string;
  totalBudget: number;
  division: string;
  tourType: string;
  duration: number;
  startDate: string;
  shortDescription: string;
}): string | null {
  const missing: string[] = [];
  if (!input.packageName.trim()) missing.push('package name');
  if (!(input.totalBudget > 0)) missing.push('estimated total cost');
  if (!input.division.trim()) missing.push('division');
  if (!input.tourType) missing.push('tour type');
  if (!(input.duration > 0)) missing.push('duration');
  if (!input.startDate) missing.push('start date');
  if (!input.shortDescription.trim()) missing.push('short description');
  if (missing.length === 0) return null;
  if (missing.length === 1) return `Add a ${missing[0]} to continue.`;
  return `Complete the following to continue: ${missing.join(', ')}.`;
}

export function getStopTotal(stop: WizardStop): number {
  return (stop.activityCost || 0) + (stop.hotelCost || 0);
}

export function sumStopTotals(stops: WizardStop[]): number {
  return stops.reduce((total, stop) => total + getStopTotal(stop), 0);
}

export function getOverBudgetReason(computedTotal: number, estimatedBudget: number): string | null {
  if (!(estimatedBudget > 0) || computedTotal <= estimatedBudget) return null;
  return `Current itinerary cost ${formatTaka(computedTotal)} is over the estimated budget of ${formatTaka(estimatedBudget)}. Raise the estimate or choose lower-cost stops.`;
}

export function getItineraryContinueReason(
  stops: WizardStop[],
  duration: number,
  computedTotal = 0,
  estimatedBudget = 0
): string | null {
  if (!(duration > 0)) return 'Select a duration before adding the itinerary.';
  const missing = missingDurationDays(stops, duration);
  if (stops.length === 0 || missing.length > 0) {
    return `This trip is ${duration} day${duration === 1 ? '' : 's'}. Add at least one stop on: Day ${missing.join(', Day ') || '1'}.`;
  }
  const incomplete = stops.some(
    (stop) => !stop.tourSpotId.trim() || stop.shortDescription.trim().length < 2
  );
  if (incomplete) {
    return 'Each stop needs a tour spot and a short description before you can continue.';
  }
  return getOverBudgetReason(computedTotal, estimatedBudget);
}

export function groupStopsByDay(stops: WizardStop[]): Array<[number, WizardStop[]]> {
  const grouped = new Map<number, WizardStop[]>();
  for (const stop of stops) {
    const list = grouped.get(stop.dayNumber) || [];
    list.push(stop);
    grouped.set(stop.dayNumber, list);
  }
  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayNumber, dayStops]) => [
      dayNumber,
      [...dayStops].sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1)),
    ]);
}

export function applyOvernightHotelToLastStop(stops: WizardStop[]): WizardStop[] {
  const next: WizardStop[] = [];
  for (const [, dayStops] of groupStopsByDay(stops)) {
    const ordered = dayStops.map((stop, index) => ({ ...stop, segmentOrder: index + 1 }));
    const hotelSource = [...ordered].reverse().find((stop) => stop.hotelOption || stop.hotelId);
    ordered.forEach((stop, index) => {
      const isLast = index === ordered.length - 1;
      next.push({
        ...stop,
        hotelOption: isLast ? hotelSource?.hotelOption || '' : '',
        hotelId: isLast ? hotelSource?.hotelId || '' : '',
        hotelName: isLast ? hotelSource?.hotelName : undefined,
        hotelCost: isLast ? hotelSource?.hotelCost || 0 : 0,
      });
    });
  }
  return next;
}

export function moveStopWithinDay(
  stops: WizardStop[],
  stopId: string,
  direction: 'up' | 'down'
): WizardStop[] {
  const target = stops.find((stop) => stop.id === stopId);
  if (!target) return stops;
  const dayStops = stops
    .filter((stop) => stop.dayNumber === target.dayNumber)
    .sort((a, b) => a.segmentOrder - b.segmentOrder);
  const index = dayStops.findIndex((stop) => stop.id === stopId);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= dayStops.length) return stops;
  const reordered = [...dayStops];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(swapIndex, 0, moved);
  const orderById = new Map(reordered.map((stop, order) => [stop.id, order + 1]));
  return stops.map((stop) =>
    orderById.has(stop.id) ? { ...stop, segmentOrder: orderById.get(stop.id)! } : stop
  );
}

export function removeStop(stops: WizardStop[], stopId: string): WizardStop[] {
  return applyOvernightHotelToLastStop(stops.filter((stop) => stop.id !== stopId));
}

/** Earlier day-editor screens keep enum-typed stop fields. */
export interface WizardItineraryStop {
  id: string;
  dayNumber: number;
  segmentOrder: number;
  shortDescription: string;
  tourSpotId: string;
  tourSpotName?: string;
  activitySpotId?: string;
  activitySpotName?: string;
  transportOption?: import('../types/trips').TransportTypePreference;
  hotelOption?: import('../types/trips').HotelTypePreference;
  notes?: string;
}

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

export function wizardStopsToDaySegments(stops: WizardStop[]): PersonalDaySegmentInput[] {
  const normalized = applyOvernightHotelToLastStop(stops);
  return normalized.map((stop) => ({
    dayNumber: stop.dayNumber,
    segmentOrder: stop.segmentOrder,
    shortDescription: stop.shortDescription.trim(),
    tourSpotId: stop.tourSpotId || undefined,
    activitySpotId: stop.activitySpotId || undefined,
    transportOption: stop.transportOption || undefined,
    hotelOption: stop.hotelOption || undefined,
    hotelId: stop.hotelId || undefined,
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
  if (!input.packageName.trim() || input.packageName.trim().length < 2) return 'packageName';
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
  stops: WizardStop[],
  duration: number
): 'missingDays' | 'incompleteStop' | 'tooManyStops' | null {
  if (!(duration > 0)) return 'missingDays';
  const missing = missingDurationDays(stops, duration);
  if (missing.length > 0) return 'missingDays';
  for (let day = 1; day <= duration; day += 1) {
    if (countStopsForDay(stops, day) > MAX_STOPS_PER_DAY) return 'tooManyStops';
  }
  const incomplete = stops.some(
    (stop) => !stop.tourSpotId.trim() || stop.shortDescription.trim().length < 2
  );
  if (incomplete) return 'incompleteStop';
  return null;
}
