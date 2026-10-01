import { bookingSortTime } from './newestBooking';

export type RecentBookingKind = 'hotel' | 'transport' | 'activity' | 'guide' | 'package' | 'trip';

export interface RecentBookingView {
  id: string;
  kind: RecentBookingKind;
  title: string;
  detail: string;
  status: string;
  paymentStatus: string;
  price: number | null;
  sortTime: number;
}

export interface TravelerBookingSources {
  hotels: any[];
  transports: any[];
  activities: any[];
  guides: any[];
  packages: any[];
  trips: any[];
}

function named(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === 'string') {
      return name.trim();
    }
  }
  return '';
}

function money(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function rangeLabel(start?: string | null, end?: string | null): string {
  const left = formatDate(start);
  const right = formatDate(end);
  if (left && right) {
    return `${left} → ${right}`;
  }
  return left || right;
}

export function mapHotel(booking: any): RecentBookingView | null {
  if (!booking?.id) return null;
  return {
    id: booking.id,
    kind: 'hotel',
    title: booking.hotel?.name || booking.hotelName || 'Hotel',
    detail: rangeLabel(booking.checkInDate, booking.checkOutDate),
    status: booking.status || '',
    paymentStatus: booking.paymentStatus || '',
    price: money(booking.totalPrice),
    sortTime: bookingSortTime(booking),
  };
}

export function mapTransport(booking: any): RecentBookingView | null {
  if (!booking?.id) return null;
  const from = named(booking.departureLocation) || named(booking.boardingStop);
  const to = named(booking.arrivalLocation) || named(booking.droppingStop);
  const route = from && to ? `${from} → ${to}` : from || to;
  return {
    id: booking.id,
    kind: 'transport',
    title: booking.transport?.name || route || 'Ticket',
    detail: route && booking.transport?.name ? `${route} · ${formatDate(booking.departureDateTime)}` : formatDate(booking.departureDateTime) || route,
    status: booking.status || '',
    paymentStatus: booking.paymentStatus || '',
    price: money(booking.totalPrice ?? booking.price),
    sortTime: bookingSortTime(booking),
  };
}

function mapActivity(booking: any): RecentBookingView | null {
  if (!booking?.id) return null;
  return {
    id: booking.id,
    kind: 'activity',
    title: booking.activitySpot?.name || 'Activity',
    detail: formatDate(booking.bookingDate),
    status: booking.status || '',
    paymentStatus: booking.paymentStatus || '',
    price: money(booking.totalPrice ?? booking.price),
    sortTime: bookingSortTime(booking),
  };
}

function mapGuide(booking: any): RecentBookingView | null {
  if (!booking?.id) return null;
  const guideName = [booking.guide?.firstName, booking.guide?.lastName].filter(Boolean).join(' ');
  return {
    id: booking.id,
    kind: 'guide',
    title: guideName || 'Guide',
    detail: formatDate(booking.startTime || booking.bookingDate),
    status: booking.status || '',
    paymentStatus: booking.paymentStatus || '',
    price: money(booking.totalPrice ?? booking.price),
    sortTime: bookingSortTime(booking),
  };
}

function mapPackage(booking: any): RecentBookingView | null {
  if (!booking?.id) return null;
  return {
    id: booking.id,
    kind: 'package',
    title: booking.tourPackage?.packageName || 'Package',
    detail: rangeLabel(booking.startDate, booking.endDate) || formatDate(booking.bookingDate || booking.createdAt),
    status: booking.status || '',
    paymentStatus: booking.paymentStatus || '',
    price: money(booking.totalPrice),
    sortTime: bookingSortTime({
      createdAt: booking.createdAt,
      bookedAt: booking.bookedAt || booking.bookingDate,
      checkInDate: booking.startDate,
    }),
  };
}

function mapTrip(booking: any): RecentBookingView | null {
  if (!booking?.id) return null;
  return {
    id: booking.id,
    kind: 'trip',
    title: booking.tourPackage?.packageName || 'Trip',
    detail: rangeLabel(booking.checkInDate, booking.checkOutDate),
    status: booking.status || '',
    paymentStatus: booking.paymentStatus || '',
    price: money(booking.totalAmount ?? booking.totalPrice),
    sortTime: bookingSortTime(booking),
  };
}

export function buildRecentBookingItems(sources: TravelerBookingSources, limit = 5): RecentBookingView[] {
  const items = [
    ...sources.hotels.map(mapHotel),
    ...sources.transports.map(mapTransport),
    ...sources.activities.map(mapActivity),
    ...sources.guides.map(mapGuide),
    ...sources.packages.map(mapPackage),
    ...sources.trips.map(mapTrip),
  ].filter((item): item is RecentBookingView => item !== null);

  return items.sort((left, right) => right.sortTime - left.sortTime).slice(0, limit);
}
