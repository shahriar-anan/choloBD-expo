/**
 * Pure budget math for personal trip plans.
 * Planned = sum of stop costs. Budget = the traveler's cap.
 */

export type BudgetTone = 'ok' | 'warn' | 'over';

export interface BudgetState {
  remaining: number;
  ratio: number;
  tone: BudgetTone;
  overBy: number;
}

export interface CostStopLike {
  id?: string;
  dayNumber: number;
  segmentOrder: number;
  activityCost?: number;
  hotelCost?: number;
  estimatedCost?: number;
  shortDescription?: string;
  tourSpotName?: string;
}

export function stopKey(dayNumber: number, segmentOrder: number): string {
  return `${dayNumber}:${segmentOrder}`;
}

export function stopTotal(stop: { activityCost?: number; hotelCost?: number; estimatedCost?: number }): number {
  const split = (stop.activityCost || 0) + (stop.hotelCost || 0);
  return split > 0 ? split : Number(stop.estimatedCost || 0);
}

export function budgetState(planned: number, budget: number): BudgetState {
  const safePlanned = Number.isFinite(planned) ? Math.max(0, planned) : 0;
  const safeBudget = Number.isFinite(budget) ? Math.max(0, budget) : 0;
  const remaining = safeBudget - safePlanned;
  const ratio = safeBudget > 0 ? safePlanned / safeBudget : safePlanned > 0 ? 2 : 0;
  const overBy = remaining < 0 ? Math.abs(remaining) : 0;
  let tone: BudgetTone = 'ok';
  if (ratio > 1) tone = 'over';
  else if (ratio >= 0.8) tone = 'warn';
  return { remaining, ratio, tone, overBy };
}

/** Cap to offer when a plan is over budget, rounded up to the next 500. */
export function raisedBudgetAmount(planned: number): number {
  if (!(planned > 0)) return 500;
  return Math.ceil(planned / 500) * 500;
}

export function dailyAllowance(budget: number, days: number): number {
  if (!(budget > 0) || !(days > 0)) return 0;
  return Math.round(budget / days);
}

export function groupStopCostsByDay(
  stops: CostStopLike[]
): Array<{ dayNumber: number; total: number; stays: number; activities: number; stopCount: number }> {
  const byDay = new Map<number, { total: number; stays: number; activities: number; stopCount: number }>();
  for (const stop of stops) {
    const current = byDay.get(stop.dayNumber) || { total: 0, stays: 0, activities: 0, stopCount: 0 };
    const stays = stop.hotelCost || 0;
    const activities = stop.activityCost || 0;
    current.stays += stays;
    current.activities += activities;
    current.total += stopTotal(stop);
    current.stopCount += 1;
    byDay.set(stop.dayNumber, current);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayNumber, row]) => ({ dayNumber, ...row }));
}

export function categoryTotals(stops: CostStopLike[]): { stays: number; activities: number } {
  return stops.reduce(
    (acc, stop) => {
      acc.stays += stop.hotelCost || 0;
      acc.activities += stop.activityCost || 0;
      return acc;
    },
    { stays: 0, activities: 0 }
  );
}

export function topCostStops(stops: CostStopLike[], n = 3): CostStopLike[] {
  return [...stops]
    .sort((a, b) => stopTotal(b) - stopTotal(a))
    .filter((stop) => stopTotal(stop) > 0)
    .slice(0, n);
}

export function pricingFingerprint(
  stops: Array<{
    dayNumber: number;
    segmentOrder: number;
    activitySpotId?: string;
    hotelId?: string;
    hotelOption?: string;
  }>,
  budget: number
): string {
  const parts = stops
    .map(
      (stop) =>
        `${stop.dayNumber}:${stop.segmentOrder}:${stop.activitySpotId || ''}:${stop.hotelId || ''}:${stop.hotelOption || ''}`
    )
    .sort();
  return `${budget}|${parts.join('|')}`;
}

export function applyQuoteToStops<T extends CostStopLike>(
  stops: T[],
  quoteStops?: Array<{
    dayNumber: number;
    segmentOrder: number;
    activityCost: number;
    hotelCost: number;
    hotelRoomType?: string | null;
    hotelName?: string | null;
    total: number;
  }>
): T[] {
  if (!quoteStops?.length) return stops;
  const byKey = new Map(
    quoteStops.map((stop) => [stopKey(stop.dayNumber, stop.segmentOrder), stop])
  );
  return stops.map((stop) => {
    const quoted = byKey.get(stopKey(stop.dayNumber, stop.segmentOrder));
    if (!quoted) return stop;
    return {
      ...stop,
      activityCost: quoted.activityCost,
      hotelCost: quoted.hotelCost,
      hotelName: quoted.hotelName || (stop as T & { hotelName?: string }).hotelName,
      hotelRoomType: quoted.hotelRoomType ?? (stop as T & { hotelRoomType?: string }).hotelRoomType,
    };
  });
}

export function biggestCategoryShare(stays: number, activities: number): {
  label: 'stays' | 'activities' | 'none';
  percent: number;
} {
  const total = stays + activities;
  if (!(total > 0)) return { label: 'none', percent: 0 };
  if (stays >= activities) return { label: 'stays', percent: Math.round((stays / total) * 100) };
  return { label: 'activities', percent: Math.round((activities / total) * 100) };
}
