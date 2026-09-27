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
import { applyOvernightHotelToLastStop, wizardStopsToDaySegments, WizardItineraryStop } from '../../utils/tripPlanItinerary';

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

export function catalogSegmentsToWizardStops(
  segments: Array<{
    dayNumber: number;
    segmentOrder?: number;
    shortDescription?: string;
    tourSpotId?: string | null;
    activitySpotId?: string | null;
    transportOption?: string | null;
    hotelOption?: string | null;
    notes?: string | null;
  }>,
  duration: number
): WizardItineraryStop[] {
  return segments
    .filter((s) => s.dayNumber >= 1 && s.dayNumber <= duration)
    .map((seg) => ({
      id: `stop-${seg.dayNumber}-${seg.segmentOrder ?? 1}-${Math.random().toString(36).slice(2, 7)}`,
      dayNumber: seg.dayNumber,
      segmentOrder: seg.segmentOrder ?? 1,
      shortDescription: seg.shortDescription?.trim() || `Day ${seg.dayNumber}`,
      tourSpotId: seg.tourSpotId || '',
      activitySpotId: seg.activitySpotId || undefined,
      transportOption: (seg.transportOption as TransportTypePreference) || undefined,
      hotelOption: (seg.hotelOption as HotelTypePreference) || undefined,
      notes: seg.notes || undefined,
    }));
}
