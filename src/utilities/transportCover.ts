interface CoverImage {
  url?: string | null;
}

interface CoverVehicle {
  imageUrl?: string | null;
}

interface CoverTrip {
  layout?: { imageUrl?: string | null } | null;
}

interface CoverBooking {
  transportType?: string | null;
  transport?: { images?: CoverImage[] | null } | null;
  vehicle?: { imageUrl?: string | null; images?: CoverImage[] | null } | null;
  items?: Array<{
    transportVehicle?: CoverVehicle | null;
    transportTrip?: CoverTrip | null;
  }> | null;
}

function firstUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

/** Coach or car photo first. The operator gallery is only the fallback. */
export function transportBookingCoverUrl(booking: CoverBooking): string | null {
  const operatorImage = firstUrl(booking.transport?.images?.[0]?.url);
  const vehicleImage =
    firstUrl(booking.items?.find((item) => item.transportVehicle?.imageUrl)?.transportVehicle?.imageUrl) ||
    firstUrl(booking.vehicle?.imageUrl) ||
    firstUrl(booking.vehicle?.images?.[0]?.url);
  const coachImage = firstUrl(
    booking.items?.find((item) => item.transportTrip?.layout?.imageUrl)?.transportTrip?.layout?.imageUrl
  );
  if (String(booking.transportType || '').toUpperCase() === 'CAR_RENTAL') {
    return vehicleImage || operatorImage;
  }
  return coachImage || vehicleImage || operatorImage;
}
