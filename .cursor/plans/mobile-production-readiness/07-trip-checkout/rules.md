# Rules — increment 07 (trip checkout)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Product boundary

Personal `TourPackage` (`kind: PERSONAL`) → **`TripBooking`** + payment `TRIP_PACKAGE`.

Never sell a personal plan via `POST /api/bookings/package-bookings/:id/purchase` or `PACKAGE_BOOKING`.

## Endpoints

`/api/bookings/trip-bookings` (create, my list, get, eligibility, cancel) per `plan.md`.

## Segment booking links

Optional `hotelRoomBookingId`, `activityBookingId`, `transportBookingId` on `daySegments` only after increments 04 and 06 exist and backend accepts them.

## Cancel

Same eligibility pattern as package/trip policy (7 days before start for traveler refund).
