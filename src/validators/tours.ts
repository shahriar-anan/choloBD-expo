/**
 * Tour Builder Validation Schemas
 * Zod schemas for client-side validation of tour data
 */

import { z } from 'zod';
import { TourDaySegmentInput, ValidationResult, TourType, TransportServiceType, TransportQualityType, HotelOptionType } from '../types/tours';


/**
 * Schema for tour type
 */
export const TourTypeSchema = z.enum(['ADVENTURE', 'CULTURAL', 'BEACH', 'CITY_TOUR', 'NATURE', 'RELIGIOUS', 'HISTORICAL', 'MIXED']);

/**
 * Schema for transport service type
 */
export const TransportServiceTypeSchema = z.enum(['BUS', 'FLIGHT', 'TRAIN', 'CAR_RENTAL', 'FERRY', 'SELF_MANAGED']);

/**
 * Schema for transport quality type
 */
export const TransportQualityTypeSchema = z.enum([
  // BUS qualities
  'AC_SLEEPER',
  'NON_AC_SLEEPER',
  'AC_SEATER',
  'NON_AC_SEATER',
  'DELUXE',
  'SEMI_DELUXE',
  'LUXURY',
  // FLIGHT qualities
  'ECONOMY',
  'BUSINESS',
  'FIRST_CLASS',
  'PREMIUM_ECONOMY',
  // TRAIN qualities
  'AC_1_TIER',
  'AC_2_TIER',
  'AC_3_TIER',
  'SLEEPER',
  'GENERAL',
  'CHAIR_CAR',
]);

/**
 * Schema for hotel option type
 */
export const HotelOptionTypeSchema = z.enum(['LUXURY', 'BUDGET', 'BOUTIQUE', 'RESORT', 'HOSTEL', 'GUESTHOUSE', 'APARTMENT']);

/**
 * Schema for a single day segment input
 */
export const TourDaySegmentInputSchema = z.object({
  dayNumber: z.number().int().positive('Day number must be positive'),
  tourSpotId: z.string().min(1, 'Tour spot is required'),
  activitySpotId: z.string().optional(),
  transportOption: TransportServiceTypeSchema,
  transportQuality: TransportQualityTypeSchema.optional(),
  hotelOption: HotelOptionTypeSchema,
});

/**
 * Schema for create tour plan payload
 */
export const CreateTourPlanSchema = z.object({
  packageName: z.string().min(1, 'Package name is required').max(255, 'Package name too long'),
  shortDescription: z.string().max(500, 'Description too long').optional(),
  packageNameBn: z.string().max(255, 'Bangla name too long').optional(),
  shortDescriptionBn: z.string().max(500, 'Bangla description too long').optional(),
  tourType: TourTypeSchema,
  duration: z.number().int().positive('Duration must be at least 1 day'),
  maxGroupSize: z.number().int().positive('Group size must be positive').optional(),
  locationId: z.string().min(1, 'Location is required'),
  totalBudget: z.number().nonnegative('Budget cannot be negative'),
  rating: z.number().min(0).max(5, 'Rating must be 0-5').optional(),
  isActive: z.boolean().optional().default(true),
  isPopular: z.boolean().optional().default(false),
  daySegments: z.array(TourDaySegmentInputSchema).optional(),
});

/**
 * Schema for update tour plan payload
 */
export const UpdateTourPlanSchema = z.object({
  packageName: z.string().min(1, 'Package name is required').max(255, 'Package name too long').optional(),
  shortDescription: z.string().max(500, 'Description too long').optional(),
  packageNameBn: z.string().max(255, 'Bangla name too long').optional(),
  shortDescriptionBn: z.string().max(500, 'Bangla description too long').optional(),
  tourType: TourTypeSchema.optional(),
  duration: z.number().int().positive('Duration must be at least 1 day').optional(),
  maxGroupSize: z.number().int().positive('Group size must be positive').optional(),
  locationId: z.string().min(1, 'Location is required').optional(),
  totalBudget: z.number().nonnegative('Budget cannot be negative').optional(),
  rating: z.number().min(0).max(5, 'Rating must be 0-5').optional(),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  daySegments: z.array(TourDaySegmentInputSchema).optional(),
});

/**
 * Validate create tour plan data
 */
export function validateCreateTourPlan(data: any): ValidationResult {
  try {
    const result = CreateTourPlanSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = (err.path as (string | number)[]).join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: true, errors: {} };
  } catch (e) {
    if (__DEV__) console.error('[tours.ts validators] Unexpected validation error:', e);
    return {
      isValid: false,
      errors: { _error: 'Unexpected validation error' },
    };
  }
}

/**
 * Validate update tour plan data
 */
export function validateUpdateTourPlan(data: any): ValidationResult {
  try {
    const result = UpdateTourPlanSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = (err.path as (string | number)[]).join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: true, errors: {} };
  } catch (e) {
    if (__DEV__) console.error('[tours.ts validators] Unexpected validation error:', e);
    return {
      isValid: false,
      errors: { _error: 'Unexpected validation error' },
    };
  }
}

/**
 * Validate day segments match duration
 * - Each dayNumber must be between 1 and duration
 * - No duplicate dayNumbers
 */
export function validateSegmentsForDuration(segments: TourDaySegmentInput[], duration: number): ValidationResult {
  const errors: Record<string, string> = {};
  const dayNumbers = new Set<number>();

  segments.forEach((seg, idx) => {
    if (seg.dayNumber < 1 || seg.dayNumber > duration) {
      errors[`daySegments.${idx}.dayNumber`] = `Day number must be between 1 and ${duration}`;
    }
    if (dayNumbers.has(seg.dayNumber)) {
      errors[`daySegments.${idx}.dayNumber`] = `Duplicate day number: ${seg.dayNumber}`;
    }
    dayNumbers.add(seg.dayNumber);
  });

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}

/**
 * Check if reducing duration would orphan any segments
 */
export function checkOrphanedSegments(segments: TourDaySegmentInput[], newDuration: number): { orphaned: number[]; isValid: boolean } {
  const orphaned = segments.filter((seg) => seg.dayNumber > newDuration).map((seg) => seg.dayNumber);
  return { orphaned, isValid: orphaned.length === 0 };
}

/**
 * Helper to check if user is master admin
 */
export function isMasterAdmin(userRole: string | null | undefined): boolean {
  return userRole === 'masterAdmin' || userRole === 'admin';
}

