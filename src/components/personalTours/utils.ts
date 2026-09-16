/**
 * Personal Tour Package Form Utilities
 * Helper functions for building custom/personal tour itineraries
 * Adapted from frontend tour-package/utils.ts for React Native
 */

import { HotelType, TransportServiceType, TourType } from '../../types/enums';

export const MAX_STOPS_PER_DAY = 4;

export type PersonalTourSegmentRow = {
  id: string;
  dayNumber: number;
  segmentOrder: number;
  shortDescription: string;
  tourSpotId: string;
  activitySpotId: string;
  transportOption: TransportServiceType | '';
  hotelOption: HotelType | '';
  hotelId: string;
  activityCost: number;
  hotelCost: number;
  notes: string;
};

export type SpotOption = {
  label: string;
  value: string;
  locationId: string;
  rating?: number;
  cost?: number;
};

export type SelectOption = { label: string; value: string };

// Format currency as Bangladeshi Taka
export const formatTaka = (amount: number) => `৳ ${Math.round(amount).toLocaleString()}`;

// Convert enum values to title case
export const toTitle = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

// Convert enum object to select options
export const enumToOptions = (
  enumObj: Record<string, string>,
  emptyLabel: string
): SelectOption[] => {
  const values = Object.values(enumObj);
  return [
    { label: emptyLabel, value: '' },
    ...values.map((v) => ({ label: toTitle(v), value: v })),
  ];
};

// Map spots to select options with costs
export const mapSpotOptions = (
  emptyLabel: string,
  spots: Array<{
    name: string;
    id: string;
    locationId?: string;
    rating?: number;
    entryCost?: number;
  }>
): SpotOption[] => [
  { label: emptyLabel, value: '', locationId: '' },
  ...spots.map((spot) => ({
    label: spot.name,
    value: spot.id,
    locationId: spot.locationId ?? '',
    rating: spot.rating,
    cost: typeof spot.entryCost === 'number' ? spot.entryCost : undefined,
  })),
];

// Get cost from spot options
export const getSpotCost = (options: SpotOption[], value: string) => {
  if (!value) return 0;
  const cost = options.find((option) => option.value === value)?.cost;
  return typeof cost === 'number' ? cost : 0;
};

// Calculate total cost for a stop
export const getStopTotal = (row: Pick<PersonalTourSegmentRow, 'activityCost' | 'hotelCost'>) =>
  (row.activityCost || 0) + (row.hotelCost || 0);

// Sum all stop totals
export const sumStopTotals = (
  segments: Pick<PersonalTourSegmentRow, 'activityCost' | 'hotelCost'>[]
) => segments.reduce((total, row) => total + getStopTotal(row), 0);

// Create a blank segment for a given day
export const createBlankSegment = (
  dayNumber: number,
  segmentOrder = 1
): PersonalTourSegmentRow => ({
  id: `segment-${Date.now()}-${Math.random()}`,
  dayNumber,
  segmentOrder,
  shortDescription: '',
  tourSpotId: '',
  activitySpotId: '',
  transportOption: '',
  hotelOption: '',
  hotelId: '',
  activityCost: 0,
  hotelCost: 0,
  notes: '',
});

// Clamp day number to valid range
export const clampDayNumber = (dayNumber: number, duration: number) => {
  if (!duration) return 0;
  if (!dayNumber) return 0;
  return Math.min(Math.max(dayNumber, 1), duration);
};

// Filter segments to match duration
export const clampDaySegmentsToDuration = (
  segments: PersonalTourSegmentRow[],
  duration: number
): PersonalTourSegmentRow[] => {
  if (!duration) return [];
  return segments.filter((segment) => segment.dayNumber >= 1 && segment.dayNumber <= duration);
};

// Get next available day number
export const nextAvailableDayNumber = (
  segments: PersonalTourSegmentRow[],
  duration: number
) => {
  const used = new Set(segments.map((segment) => segment.dayNumber));
  for (let day = 1; day <= duration; day += 1) {
    if (!used.has(day)) return day;
  }
  return Math.min(duration, 1) || 1;
};

// Get next segment order for a day
export const nextSegmentOrderForDay = (
  segments: PersonalTourSegmentRow[],
  dayNumber: number
) => {
  const orders = segments
    .filter((segment) => segment.dayNumber === dayNumber)
    .map((segment) => segment.segmentOrder || 1);
  return orders.length > 0 ? Math.max(...orders) + 1 : 1;
};

// Count stops for a specific day
export const countStopsForDay = (segments: PersonalTourSegmentRow[], dayNumber: number) =>
  segments.filter((segment) => segment.dayNumber === dayNumber).length;

// Check if day is at stop limit
export const isDayAtStopLimit = (
  segments: PersonalTourSegmentRow[],
  dayNumber: number,
  limit = MAX_STOPS_PER_DAY
) => countStopsForDay(segments, dayNumber) >= limit;

// Get days that are missing stops
export const missingDurationDays = (
  segments: PersonalTourSegmentRow[],
  duration: number
): number[] => {
  if (!duration) return [];
  const daysWithStops = new Set(segments.map((segment) => segment.dayNumber));
  const missing: number[] = [];
  for (let day = 1; day <= duration; day += 1) {
    if (!daysWithStops.has(day)) missing.push(day);
  }
  return missing;
};

// Check if every day has at least one stop
export const everyDurationDayHasAStop = (
  segments: PersonalTourSegmentRow[],
  duration: number
) => duration > 0 && missingDurationDays(segments, duration).length === 0;

// Check if over budget
export const isOverBudget = (computedTotal: number, estimatedBudget: number) =>
  estimatedBudget > 0 && computedTotal > estimatedBudget;

// Get reason why details step can't continue
export const getDetailsContinueReason = ({
  packageName,
  totalBudget,
  division,
  tourType,
  duration,
  shortDescription,
  startDate,
}: {
  packageName: string;
  totalBudget?: number;
  division: string;
  tourType: string;
  duration: number;
  shortDescription: string;
  startDate?: string;
}): string | null => {
  const missing: string[] = [];
  if (!packageName.trim()) missing.push('package name');
  if (!(totalBudget && totalBudget > 0)) missing.push('estimated total cost');
  if (!division.trim()) missing.push('division');
  if (!tourType) missing.push('tour type');
  if (!(duration > 0)) missing.push('duration');
  if (!startDate) missing.push('start date');
  if (!shortDescription.trim()) missing.push('short description');
  if (missing.length === 0) return null;
  if (missing.length === 1) return `Add a ${missing[0]} to continue.`;
  return `Complete the following to continue: ${missing.join(', ')}.`;
};

// Get reason why over budget
export const getOverBudgetReason = (
  computedTotal: number,
  estimatedBudget: number
): string | null => {
  if (!isOverBudget(computedTotal, estimatedBudget)) return null;
  return `Current itinerary cost ${formatTaka(computedTotal)} is over the estimated budget of ${formatTaka(estimatedBudget)}. Raise the estimate or choose lower-cost stops.`;
};

// Get reason why itinerary step can't continue
export const getItineraryContinueReason = (
  segments: PersonalTourSegmentRow[],
  duration: number,
  missingDays: number[],
  computedTotal = 0,
  estimatedBudget = 0
): string | null => {
  if (!(duration > 0)) return 'Select a duration before adding the itinerary.';
  if (segments.length === 0) {
    return `Add at least one stop to each of the ${duration} tour day${duration === 1 ? '' : 's'} to continue.`;
  }
  if (missingDays.length > 0) {
    return `Add at least one stop to every day. Missing: Day ${missingDays.join(', Day ')}.`;
  }
  const incomplete = segments.some(
    (segment) => !segment.tourSpotId.trim() || segment.shortDescription.trim().length < 2
  );
  if (incomplete) {
    return 'Each stop needs a tour spot and a short description before you can continue.';
  }
  return getOverBudgetReason(computedTotal, estimatedBudget);
};

// Group segments by day
export const groupStopsByDay = (
  segments: PersonalTourSegmentRow[]
): Array<[number, PersonalTourSegmentRow[]]> => {
  const grouped = new Map<number, PersonalTourSegmentRow[]>();
  for (const segment of segments) {
    const list = grouped.get(segment.dayNumber) || [];
    list.push(segment);
    grouped.set(segment.dayNumber, list);
  }
  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayNumber, stops]) => [
      dayNumber,
      [...stops].sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1)),
    ]);
};

// Apply overnight hotel to last stop of each day
export const applyOvernightHotelToLastStop = (
  segments: PersonalTourSegmentRow[]
): PersonalTourSegmentRow[] => {
  const grouped = groupStopsByDay(segments);
  const next: PersonalTourSegmentRow[] = [];
  for (const [, stops] of grouped) {
    const ordered = stops.map((stop, index) => ({ ...stop, segmentOrder: index + 1 }));
    const hotelSource = [...ordered].reverse().find((stop) => stop.hotelOption || stop.hotelId);
    ordered.forEach((stop, index) => {
      const isLast = index === ordered.length - 1;
      next.push({
        ...stop,
        hotelOption: isLast ? (hotelSource?.hotelOption || '') : '',
        hotelId: isLast ? (hotelSource?.hotelId || '') : '',
        hotelCost: isLast ? (hotelSource?.hotelCost || 0) : 0,
      });
    });
  }
  return next;
};

// Move stop within its day (up or down)
export const moveStopWithinDay = (
  segments: PersonalTourSegmentRow[],
  stopId: string,
  direction: -1 | 1
): PersonalTourSegmentRow[] => {
  const stop = segments.find((segment) => segment.id === stopId);
  if (!stop) return segments;

  const sameDay = segments
    .filter((segment) => segment.dayNumber === stop.dayNumber)
    .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
  const index = sameDay.findIndex((segment) => segment.id === stopId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= sameDay.length) return segments;

  const reordered = [...sameDay];
  const current = reordered[index];
  const swapWith = reordered[targetIndex];
  if (!current || !swapWith) return segments;
  reordered[index] = swapWith;
  reordered[targetIndex] = current;

  const orderById = new Map(reordered.map((segment, i) => [segment.id, i + 1]));
  return applyOvernightHotelToLastStop(
    segments.map((segment) => {
      const nextOrder = orderById.get(segment.id);
      return nextOrder === undefined ? segment : { ...segment, segmentOrder: nextOrder };
    })
  );
};

// Collect unique visit spot names
export const collectVisitSpotNames = (
  segments: { tourSpotId: string }[],
  spots: { id: string; name: string }[]
): string[] => {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const segment of segments) {
    if (!segment.tourSpotId) continue;
    const name = spots.find((spot) => spot.id === segment.tourSpotId)?.name;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
};

// Format date for display
export const formatDisplayDate = (dateStr: string) => {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Infer end date from start date and duration
export const inferEndDate = (startDate: string, duration: number) => {
  if (!startDate || !duration) return '';
  const parsed = new Date(`${startDate}T00:00:00`);
  if (isNaN(parsed.getTime())) return '';
  parsed.setDate(parsed.getDate() + duration - 1);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert date to YYYY-MM-DD format
export const toDateInputValue = (value?: Date | string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

// Count tour/activity spots in a division
export const countSpotsInDivision = (
  locations: Array<{
    id: string;
    parentLocationId?: string;
    _count?: { tourSpots?: number; activitySpots?: number };
  }> | undefined,
  divisionId: string
): { tourSpots: number; activitySpots: number } => {
  if (!locations?.length || !divisionId) {
    return { tourSpots: 0, activitySpots: 0 };
  }

  return locations.reduce<{ tourSpots: number; activitySpots: number }>(
    (counts, location) => {
      if (location.id !== divisionId && location.parentLocationId !== divisionId) {
        return counts;
      }
      return {
        tourSpots: counts.tourSpots + (location._count?.tourSpots ?? 0),
        activitySpots: counts.activitySpots + (location._count?.activitySpots ?? 0),
      };
    },
    { tourSpots: 0, activitySpots: 0 }
  );
};
