# 06 — Transport

**Folder:** `06-transport` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: Not started. Depends on increment 03. Can be built in parallel with increments 04 and 05. UI starts only after Functional typechecks.

The app has a display-only transport tab and a home ride card that does not book. On-platform inventory is bus and car rental. Do not add flight or train booking.

## Functional

Add `src/services/api/transports.ts`, `src/services/api/transportBookings.ts`, `src/types/transports.ts`, and `src/hooks/useTransportBookingLogic.tsx`.

Search and inventory (public reads):

- `GET /api/transports`
- `GET /api/transports/search`
- `GET /api/transports/location/:locationId`
- `GET /api/transports/:transportId`
- `GET /api/transport-inventory/trips`
- `GET /api/transport-inventory/trips/:tripId`
- `GET /api/transport-inventory/trips/:tripId/seats`
- `GET /api/transport-inventory/vehicles`

Booking:

| Function | Call |
| --- | --- |
| Create | `POST /api/bookings/transports` |
| List | `GET /api/bookings/transports` |
| Get | `GET /api/bookings/transports/:bookingId` |
| Eligibility | `GET /api/bookings/transports/:bookingId/cancellation-eligibility` |
| Cancel | `DELETE /api/bookings/transports/:bookingId` with optional `cancellationReason` (max 500) |

Bus create: `transportId`, `transportTripId`, and `seatIds` (or `passengers` with `seatId` and `passengerName`). Rental create: `transportId`, `transportVehicleId`, `departureDateTime`, `arrivalDateTime`.

If `transportType` is `FLIGHT` or `TRAIN`, the service throws that it cannot be booked on-platform. The client should not offer those types. `FERRY` and `SELF_MANAGED` are out of this phase.

Pay with `serviceType: "TRANSPORT_SERVICE"`. Reuse `CancellationEligibility`. Operator inventory writes (classes, routes, layouts) stay out of the traveler app.

### Exit

`npx tsc --noEmit` passes.

## UI

Only after the functional exit.

- Replace the empty state in `src/components/tripPlanner/tabs/TransportTab.tsx` with a link into the booking flow, plus any transport bookings already returned on the plan. Do not pretend a `transportBookingId` on an old trip-segment shape is live data.
- New explore screens: search, bus trip with seat map from `isAvailable` on each seat, rental vehicle with pickup and return. No airline or train seat map.
- Home ride card (`FeaturesGrid` id `ride-tickets`, and `TransportTypeSelector` if it is mounted) opens this flow.
- Dashboard list and detail with pay, eligibility, and cancel.

Device cases: D-06 and D-06b in [tests.md](tests.md).
