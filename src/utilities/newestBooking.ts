export interface NewestBookingFields {
  createdAt?: string | null;
  bookedAt?: string | null;
  checkInDate?: string | null;
  departureDateTime?: string | null;
}

function parseTime(value?: string | null): number | null {
  if (!value) {
    return null;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function bookingSortTime(booking: NewestBookingFields): number {
  const created = parseTime(booking.createdAt);
  if (created !== null) {
    return created;
  }
  const booked = parseTime(booking.bookedAt);
  if (booked !== null) {
    return booked;
  }
  const departure = parseTime(booking.departureDateTime);
  if (departure !== null) {
    return departure;
  }
  return parseTime(booking.checkInDate) ?? 0;
}

export function pickNewestBooking<T extends NewestBookingFields>(
  bookings: T[] | null | undefined
): T | undefined {
  if (!bookings || bookings.length === 0) {
    return undefined;
  }
  return [...bookings].sort((a, b) => bookingSortTime(b) - bookingSortTime(a))[0];
}
