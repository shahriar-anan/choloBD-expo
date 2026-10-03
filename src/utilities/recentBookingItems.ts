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
  imageUrl: string | null;
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

function imageUrlFrom(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = imageUrlFrom(item);
      if (found) {
        return found;
      }
    }
    return null;
  }
  if (value && typeof value === 'object' && 'url' in value) {
    return imageUrlFrom((value as { url?: unknown }).url);
  }
  return null;
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
    imageUrl: imageUrlFrom(booking.hotel?.images) || imageUrlFrom(booking.hotelDetails?.images) || imageUrlFrom(booking.hotel?.imageUrl),
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
    imageUrl: imageUrlFrom(booking.transport?.images) || imageUrlFrom(booking.vehicle?.images),
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
    imageUrl: imageUrlFrom(booking.activitySpot?.images) || imageUrlFrom(booking.activitySpot?.imageUrl),
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
    imageUrl: imageUrlFrom(booking.guide?.images) || imageUrlFrom(booking.guide?.imageUrl),
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
    imageUrl: imageUrlFrom(booking.tourPackage?.images),
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
    imageUrl: imageUrlFrom(booking.tourPackage?.images),
  };
}

function serviceTime(raw: any): number {
  const value = raw?.checkInDate || raw?.departureDateTime || raw?.startTime || raw?.bookingDate || raw?.bookedAt;
  if (!value) {
    return 0;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function withServiceTime(raw: any, mapped: RecentBookingView | null): RecentBookingView | null {
  if (!mapped) {
    return null;
  }
  const when = serviceTime(raw);
  return when > 0 ? { ...mapped, sortTime: when } : mapped;
}

/** Hotel, ticket, activity, and guide rows. Trip plans and packages stay off this list. */
export function listTravelerReservations(sources: TravelerBookingSources): RecentBookingView[] {
  const items = [
    ...sources.hotels.map((raw) => withServiceTime(raw, mapHotel(raw))),
    ...sources.transports.map((raw) => withServiceTime(raw, mapTransport(raw))),
    ...sources.activities.map((raw) => withServiceTime(raw, mapActivity(raw))),
    ...sources.guides.map((raw) => withServiceTime(raw, mapGuide(raw))),
  ].filter((item): item is RecentBookingView => item !== null);

  const now = Date.now();
  const upcoming = items.filter((item) => item.sortTime >= now).sort((left, right) => left.sortTime - right.sortTime);
  const earlier = items.filter((item) => item.sortTime < now).sort((left, right) => right.sortTime - left.sortTime);
  return [...upcoming, ...earlier];
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
