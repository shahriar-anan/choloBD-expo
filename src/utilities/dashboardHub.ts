import { mapHotel, mapTransport, RecentBookingView } from './recentBookingItems';

export type AttentionReason = 'unpaid' | 'startingSoon';

export interface DashboardAttentionItem extends RecentBookingView {
  reason: AttentionReason;
}

export interface TravelerDashboardHub {
  upNext: RecentBookingView | null;
  attentionItems: DashboardAttentionItem[];
  hotelActiveCount: number;
  transportActiveCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface TimedBooking {
  view: RecentBookingView;
  startMs: number;
  endMs: number;
}

function parseMs(value?: string | null): number | null {
  if (!value) {
    return null;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function stayEndMs(checkOut?: string | null): number | null {
  if (!checkOut) {
    return null;
  }
  const parsed = new Date(checkOut);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  if (!checkOut.includes('T')) {
    parsed.setHours(23, 59, 59, 999);
  }
  return parsed.getTime();
}

function cancelled(status: string): boolean {
  return status.toUpperCase() === 'CANCELLED';
}

function unpaid(paymentStatus: string): boolean {
  return paymentStatus.toUpperCase() === 'UNPAID';
}

function timedHotel(booking: any): TimedBooking | null {
  const view = mapHotel(booking);
  const startMs = parseMs(booking?.checkInDate);
  if (!view || startMs === null || cancelled(view.status)) {
    return null;
  }
  const endMs = stayEndMs(booking?.checkOutDate) ?? startMs;
  return { view, startMs, endMs };
}

function timedTransport(booking: any): TimedBooking | null {
  const view = mapTransport(booking);
  const startMs = parseMs(booking?.departureDateTime);
  if (!view || startMs === null || cancelled(view.status)) {
    return null;
  }
  const endMs = parseMs(booking?.arrivalDateTime) ?? startMs;
  return { view, startMs, endMs };
}

function stillRelevant(item: TimedBooking, now: number): boolean {
  return item.endMs >= now;
}

function activeCount(bookings: any[], map: (booking: any) => RecentBookingView | null): number {
  return bookings.reduce((count, booking) => {
    const view = map(booking);
    if (!view || cancelled(view.status)) {
      return count;
    }
    return count + 1;
  }, 0);
}

export function buildTravelerDashboardHub(hotels: any[], transports: any[], now = Date.now()): TravelerDashboardHub {
  const hotelTimed = hotels.map(timedHotel).filter((item): item is TimedBooking => item !== null);
  const transportTimed = transports.map(timedTransport).filter((item): item is TimedBooking => item !== null);
  const actionable = [...hotelTimed, ...transportTimed];

  const upcoming = actionable
    .filter((item) => stillRelevant(item, now))
    .sort((left, right) => left.startMs - right.startMs);

  const seen = new Set<string>();
  const attentionItems: DashboardAttentionItem[] = [];

  const pushAttention = (item: TimedBooking, reason: AttentionReason) => {
    if (seen.has(item.view.id) || attentionItems.length >= 3) {
      return;
    }
    seen.add(item.view.id);
    attentionItems.push({ ...item.view, reason });
  };

  actionable
    .filter((item) => unpaid(item.view.paymentStatus))
    .sort((left, right) => left.startMs - right.startMs)
    .forEach((item) => pushAttention(item, 'unpaid'));

  actionable
    .filter((item) => item.startMs >= now && item.startMs <= now + DAY_MS)
    .sort((left, right) => left.startMs - right.startMs)
    .forEach((item) => pushAttention(item, 'startingSoon'));

  return {
    upNext: upcoming[0]?.view ?? null,
    attentionItems,
    hotelActiveCount: activeCount(hotels, mapHotel),
    transportActiveCount: activeCount(transports, mapTransport),
  };
}
