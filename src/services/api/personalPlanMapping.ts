/**
 * Maps personal TourPackage API payloads to legacy TripPlan shapes used by the UI.
 */

import {
  TripPlan,
  TripSummary,
  UserSegment,
  PersonalDaySegmentApi,
  PersonalDaySegmentInput,
  CreateTripData,
  UpdateTripData,
  CreateSegmentData,
  UpdateSegmentData,
  TripStatus,
  BudgetStatus,
  HotelTypePreference,
  TransportTypePreference,
  TourTypePreference,
} from '../../types/trips';
import { applyOvernightHotelToLastStop, wizardStopsToDaySegments, WizardItineraryStop, WizardStop, createClientStopId, inferEndDateString, toDateInputValue } from '../../utils/tripPlanItinerary';

export function mapDaySegmentToUserSegment(
  seg: PersonalDaySegmentApi,
  planId: string
): UserSegment {
  const now = new Date().toISOString();
  return {
    id: seg.id,
    userTripPlanId: planId,
    dayNumber: seg.dayNumber,
    segmentOrder: seg.segmentOrder ?? 1,
    customNotes: seg.notes ?? undefined,
    shortDescription: seg.shortDescription,
    hotelRoomBookingId: seg.hotelRoomBookingId ?? undefined,
    transportBookingId: seg.transportBookingId ?? undefined,
    activityBookingId: seg.activityBookingId ?? undefined,
    customTourSpotId: seg.tourSpotId ?? undefined,
    customActivitySpotId: seg.activitySpotId ?? undefined,
    customActivitySpotName: seg.activitySpotName ?? undefined,
    customHotel: (seg.hotelOption as UserSegment['customHotel']) ?? undefined,
    customTransport: (seg.transportOption as UserSegment['customTransport']) ?? undefined,
    estimatedCost: seg.estimatedCost ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapPersonalPlanToTripPlan(raw: any): TripPlan {
  const daySegments: PersonalDaySegmentApi[] = raw?.daySegments ?? [];
  const location = raw?.location;
  const owner = raw?.ownerUser ?? raw?.createdByUser;

  const plan: TripPlan = {
    id: raw.id,
    userId: raw.ownerUserId ?? owner?.id ?? '',
    name: raw.packageName ?? raw.name ?? 'My trip',
    description: raw.shortDescription,
    generalNotes: Array.isArray(raw.generalNotes) ? raw.generalNotes : [],
    primaryLocationId: raw.locationId ?? location?.id ?? '',
    startDate: raw.startDate,
    endDate: raw.endDate,
    status: (raw.status as TripStatus) ?? 'PLANNING',
    estimatedBudget: raw.estimatedBudget ?? raw.totalBudget ?? 0,
    actualCost: raw.actualCost,
    participantCount: raw.participantCount ?? 1,
    preferredHotelType: raw.preferredHotelType ?? 'RESORT',
    preferredTransport: raw.preferredTransport ?? 'BUS',
    isPublic: Boolean(raw.isPublic),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    user: owner
      ? {
          id: owner.id,
          userName: owner.userName ?? '',
          email: owner.email ?? '',
          firstName: owner.firstName ?? '',
          lastName: owner.lastName ?? '',
        }
      : {
          id: '',
          userName: '',
          email: '',
          firstName: '',
          lastName: '',
        },
    primaryLocation: location
      ? {
          id: location.id,
          name: location.name,
          locationType: location.locationType ?? 'CITY',
          country: location.country ?? '',
          state: location.state,
        }
      : {
          id: raw.locationId ?? '',
          name: 'Unknown',
          locationType: 'CITY',
          country: '',
        },
    daySegments,
    userSegments: daySegments.map((seg) => mapDaySegmentToUserSegment(seg, raw.id)),
    _count: {
      userSegments: daySegments.length,
      tripBookings: raw.tripBookings?.length ?? raw._count?.tripBookings ?? 0,
    },
  };

  return plan;
}

export function mapCreateTripDataToPersonalApi(
  data: CreateTripData,
  daySegments?: PersonalDaySegmentInput[]
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    packageName: data.name,
    shortDescription: data.description,
    tourType: data.tourType,
    locationId: data.primaryLocationId,
    startDate: data.startDate,
    endDate: data.endDate,
    estimatedBudget: data.estimatedBudget,
    participantCount: data.participantCount,
    preferredHotelType: data.preferredHotelType,
    preferredTransport: data.preferredTransport,
    generalNotes: data.generalNotes,
    daySegments,
  };
  if (data.basedOnPackageId) {
    body.basedOnPackageId = data.basedOnPackageId;
  }
  return body;
}

export function mapUpdateTripDataToPersonalApi(data: UpdateTripData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.packageName = data.name;
  if (data.description !== undefined) payload.shortDescription = data.description;
  if (data.generalNotes !== undefined) payload.generalNotes = data.generalNotes;
  if (data.estimatedBudget !== undefined) payload.estimatedBudget = data.estimatedBudget;
  if (data.status !== undefined) payload.status = data.status;
  if (data.participantCount !== undefined) payload.participantCount = data.participantCount;
  if (data.daySegments !== undefined) payload.daySegments = data.daySegments;
  return payload;
}

function resolveShortDescription(
  data: CreateSegmentData | UpdateSegmentData,
  dayNumber: number,
  fallback?: string
): string {
  const explicit = data.shortDescription?.trim();
  if (explicit && explicit.length >= 2) return explicit.slice(0, 1000);
  const fromNotes = data.customNotes?.trim();
  if (fromNotes && fromNotes.length >= 2) return fromNotes.slice(0, 1000);
  if (fallback && fallback.length >= 2) return fallback.slice(0, 1000);
  return `Day ${dayNumber} plan`;
}

export function mapCreateSegmentToDaySegment(
  data: CreateSegmentData,
  dayNumber: number
): PersonalDaySegmentInput {
  return {
    dayNumber,
    segmentOrder: data.segmentOrder ?? 1,
    shortDescription: resolveShortDescription(data, dayNumber),
    tourSpotId: data.customTourSpotId,
    activitySpotId: data.customActivitySpotId,
    transportOption: data.customTransport,
    hotelOption: data.customHotel,
    notes: data.customNotes,
  };
}

export function mergeSegmentUpdate(
  existing: PersonalDaySegmentApi,
  data: UpdateSegmentData
): PersonalDaySegmentInput {
  const dayNumber = data.dayNumber ?? existing.dayNumber;
  return {
    dayNumber,
    segmentOrder: data.segmentOrder ?? existing.segmentOrder ?? 1,
    shortDescription: resolveShortDescription(
      data,
      dayNumber,
      existing.shortDescription
    ),
    tourSpotId: data.customTourSpotId ?? existing.tourSpotId ?? undefined,
    activitySpotId: data.customActivitySpotId ?? existing.activitySpotId ?? undefined,
    transportOption: data.customTransport ?? existing.transportOption ?? undefined,
    hotelOption: data.customHotel ?? existing.hotelOption ?? undefined,
    notes: data.customNotes ?? existing.notes ?? undefined,
  };
}

export function daySegmentsForPut(segments: PersonalDaySegmentApi[]): PersonalDaySegmentInput[] {
  return segments.map((seg) => ({
    dayNumber: seg.dayNumber,
    segmentOrder: seg.segmentOrder ?? 1,
    shortDescription: seg.shortDescription,
    tourSpotId: seg.tourSpotId ?? undefined,
    activitySpotId: seg.activitySpotId ?? undefined,
    transportOption: seg.transportOption ?? undefined,
    hotelOption: seg.hotelOption ?? undefined,
    hotelId: seg.hotelId ?? undefined,
    transportId: seg.transportId ?? undefined,
    notes: seg.notes ?? undefined,
  }));
}

export function buildTripSummaryFromPlan(trip: TripPlan): TripSummary {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const totalDays =
    Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
      ? trip.userSegments?.reduce((max, s) => Math.max(max, s.dayNumber), 0) || 1
      : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const estimated = trip.estimatedBudget ?? 0;
  let budgetStatus: BudgetStatus = 'WITHIN_BUDGET';
  if (trip.actualCost != null && trip.actualCost > estimated) {
    budgetStatus = 'EXCEEDED_BUDGET';
  } else if (trip.actualCost != null && trip.actualCost > estimated * 0.85) {
    budgetStatus = 'APPROACHING_BUDGET';
  }

  return {
    tripId: trip.id,
    tripName: trip.name,
    status: trip.status,
    startDate: trip.startDate,
    endDate: trip.endDate,
    totalDays,
    participantCount: trip.participantCount,
    costBreakdown: {
      hotel: { total: 0, confirmed: 0, pending: 0 },
      transport: { total: 0, confirmed: 0, pending: 0 },
      activity: { total: 0, confirmed: 0, pending: 0 },
    },
    totalEstimatedCost: estimated,
    totalConfirmedCost: trip.actualCost ?? 0,
    totalPendingCost: Math.max(0, estimated - (trip.actualCost ?? 0)),
    costPerPerson: trip.participantCount > 0 ? estimated / trip.participantCount : estimated,
    estimatedBudget: estimated,
    actualCost: trip.actualCost,
    budgetStatus,
    bookingsSummary: {
      hotels: trip.userSegments?.filter((s) => s.hotelRoomBookingId).length ?? 0,
      transport: trip.userSegments?.filter((s) => s.transportBookingId).length ?? 0,
      activities: trip.userSegments?.filter((s) => s.activityBookingId).length ?? 0,
    },
  };
}

export function normalizeDaySegmentsInput(
  segments: PersonalDaySegmentInput[]
): PersonalDaySegmentInput[] {
  const wizard: WizardItineraryStop[] = segments.map((seg, index) => ({
    id: `seg-${index}`,
    dayNumber: seg.dayNumber,
    segmentOrder: seg.segmentOrder ?? 1,
    shortDescription: seg.shortDescription,
    tourSpotId: seg.tourSpotId || '',
    activitySpotId: seg.activitySpotId,
    transportOption: seg.transportOption as TransportTypePreference | undefined,
    hotelOption: seg.hotelOption as HotelTypePreference | undefined,
    notes: seg.notes,
  }));
  return wizardStopsToDaySegments(applyOvernightHotelToLastStop(wizard));
}

export function catalogSegmentsToWizardStops(segments: any[]): WizardStop[] {
  return (segments || []).map((segment) => ({
    id: createClientStopId(),
    dayNumber: segment.dayNumber,
    segmentOrder: segment.segmentOrder || 1,
    shortDescription: segment.shortDescription || segment.tourSpotName || 'Stop',
    tourSpotId: segment.tourSpotId || '',
    tourSpotName: segment.tourSpotName,
    activitySpotId: segment.activitySpotId || undefined,
    activitySpotName: segment.activitySpotName,
    transportOption: segment.transportOption || '',
    hotelOption: segment.hotelOption || '',
    hotelId: segment.hotelId || '',
    hotelName: segment.hotelName,
    notes: segment.notes || '',
    activityCost: Number(segment.activityCost || segment.estimatedCost || 0),
    hotelCost: Number(segment.hotelCost || 0),
  }));
}

export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: T[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

function asHotel(value?: string | null): HotelTypePreference {
  const allowed: HotelTypePreference[] = [
    'RESORT', 'HOSTEL', 'BOUTIQUE', 'BUDGET', 'LUXURY', 'GUESTHOUSE', 'APARTMENT',
  ];
  return allowed.includes(value as HotelTypePreference) ? (value as HotelTypePreference) : 'RESORT';
}

function asTransport(value?: string | null): TransportTypePreference {
  const allowed: TransportTypePreference[] = [
    'BUS', 'FLIGHT', 'TRAIN', 'CAR_RENTAL', 'FERRY', 'SELF_MANAGED',
  ];
  return allowed.includes(value as TransportTypePreference)
    ? (value as TransportTypePreference)
    : 'BUS';
}

function mapPackageSegment(seg: any, planId: string): UserSegment {
  const now = new Date().toISOString();
  return {
    id: seg.id || createClientStopId(),
    userTripPlanId: planId,
    dayNumber: seg.dayNumber,
    segmentOrder: seg.segmentOrder || 1,
    shortDescription: seg.shortDescription || '',
    customNotes: seg.notes || seg.customNotes || seg.shortDescription || '',
    estimatedCost: Number(seg.estimatedCost || 0),
    customTourSpotId: seg.tourSpotId || undefined,
    customActivitySpotId: seg.activitySpotId || undefined,
    customActivitySpotName: seg.activitySpotName || undefined,
    tourSpotName: seg.tourSpotName || undefined,
    activitySpotName: seg.activitySpotName || undefined,
    hotelName: seg.hotelName || undefined,
    customHotel: seg.hotelOption ? asHotel(seg.hotelOption) : undefined,
    customTransport: seg.transportOption ? asTransport(seg.transportOption) : undefined,
    createdAt: seg.createdAt || now,
    updatedAt: seg.updatedAt || now,
  };
}

export function mapPersonalPackageToTripPlan(pkg: any): TripPlan {
  const id = pkg.id;
  const location = pkg.location || {};
  const segments = (pkg.daySegments || []).map((seg: any) => mapPackageSegment(seg, id));
  return {
    id,
    userId: pkg.createdByUserId || pkg.userId || '',
    name: pkg.packageName || 'Trip plan',
    description: pkg.shortDescription || '',
    shortDescription: pkg.shortDescription || '',
    generalNotes: Array.isArray(pkg.generalNotes) ? pkg.generalNotes : undefined,
    primaryLocationId: location.id || pkg.locationId || '',
    startDate: pkg.startDate || new Date().toISOString(),
    endDate: pkg.endDate || pkg.startDate || new Date().toISOString(),
    status: (pkg.status as TripStatus) || 'PLANNING',
    estimatedBudget: Number(pkg.estimatedBudget ?? pkg.totalBudget ?? 0),
    actualCost: pkg.actualCost != null ? Number(pkg.actualCost) : undefined,
    participantCount: Number(pkg.participantCount ?? pkg.maxGroupSize ?? 1),
    preferredHotelType: asHotel(pkg.preferredHotelType),
    preferredTransport: asTransport(pkg.preferredTransport),
    isPublic: false,
    createdAt: pkg.createdAt || new Date().toISOString(),
    updatedAt: pkg.updatedAt || new Date().toISOString(),
    user: {
      id: pkg.createdByUserId || '',
      userName: '',
      email: '',
      firstName: '',
      lastName: '',
    },
    primaryLocation: {
      id: location.id || pkg.locationId || '',
      name: location.name || 'Bangladesh',
      locationType: location.locationType || 'REGION',
      country: location.country || 'Bangladesh',
    },
    userSegments: segments,
    images: Array.isArray(pkg.images)
      ? pkg.images.map((image: any) => ({ url: image.url, altText: image.altText }))
      : [],
    tourType: pkg.tourType,
    duration: pkg.duration,
    maxGroupSize: pkg.maxGroupSize,
    rating: pkg.rating,
    isActive: pkg.isActive,
    basedOnPackageName: pkg.basedOnPackage?.packageName,
    basedOnPackageId: pkg.basedOnPackageId || pkg.basedOnPackage?.id,
  };
}

export function tripPlanToWizardStops(trip: TripPlan): WizardStop[] {
  return (trip.userSegments || []).map((segment) => ({
    id: segment.id,
    dayNumber: segment.dayNumber,
    segmentOrder: segment.segmentOrder,
    shortDescription: segment.shortDescription || segment.customNotes || '',
    tourSpotId: segment.customTourSpotId || '',
    tourSpotName: segment.tourSpotName,
    activitySpotId: segment.customActivitySpotId,
    activitySpotName: segment.activitySpotName || segment.customActivitySpotName,
    transportOption: segment.customTransport,
    hotelOption: segment.customHotel,
    hotelName: segment.hotelName,
    notes: segment.customNotes,
    activityCost: 0,
    hotelCost: segment.estimatedCost || 0,
  }));
}

export interface PersonalPlanSaveInput {
  packageName: string;
  totalBudget: number;
  shortDescription: string;
  tourType: string;
  locationId: string;
  startDate: string;
  duration: number;
  basedOnPackageId?: string;
  daySegments: WizardStop[];
  imageURLs?: string[];
}

export function buildPersonalPlanBody(input: PersonalPlanSaveInput, mode: 'create' | 'edit') {
  const endDate = inferEndDateString(input.startDate, input.duration);
  const segments = applyOvernightHotelToLastStop(input.daySegments);
  const body: Record<string, unknown> = {
    packageName: input.packageName.trim(),
    totalBudget: input.totalBudget,
    estimatedBudget: input.totalBudget,
    shortDescription: input.shortDescription.trim(),
    tourType: input.tourType,
    locationId: input.locationId,
    startDate: input.startDate,
    endDate,
    daySegments: segments.map((segment) => ({
      dayNumber: segment.dayNumber,
      segmentOrder: segment.segmentOrder,
      shortDescription: segment.shortDescription.trim(),
      tourSpotId: segment.tourSpotId,
      activitySpotId: segment.activitySpotId || undefined,
      transportOption: segment.transportOption || undefined,
      hotelOption: segment.hotelOption || undefined,
      hotelId: segment.hotelId || undefined,
      notes: segment.notes?.trim() || undefined,
      estimatedCost: (segment.activityCost || 0) + (segment.hotelCost || 0),
    })),
  };
  if (mode === 'create' && input.basedOnPackageId) {
    body.basedOnPackageId = input.basedOnPackageId;
  }
  if (input.imageURLs && input.imageURLs.length > 0) {
    body.imageURLs = input.imageURLs;
  }
  return body;
}

export function durationFromTrip(trip: TripPlan): number {
  if (trip.duration && trip.duration > 0) return trip.duration;
  const start = toDateInputValue(trip.startDate);
  const end = toDateInputValue(trip.endDate);
  if (!start || !end) return 1;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}
