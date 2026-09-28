# 07 — Trip checkout

**Folder:** `07-trip-checkout` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: Not started. Personal plan CRUD must be done in increment 01. Segment links that store booking ids wait until the activity client (increment 04) and transport client (increment 06) exist, and only if the personal-plan body accepts those fields. UI starts only after Functional typechecks.

A personal plan is not a catalog purchase. Checkout creates a `TripBooking` and pays with `TRIP_PACKAGE`. Catalog packages are not bought here. Viewing and buying them waits for a later trip-plan segment (see increment 03).

## Functional

Add `src/services/api/tripBookings.ts`, `src/types/tripBookings.ts`, and `src/hooks/useTripCheckoutLogic.tsx`.

| Function | Call |
| --- | --- |
| Create | `POST /api/bookings/trip-bookings` |
| List mine | `GET /api/bookings/trip-bookings/my` |
| Get | `GET /api/bookings/trip-bookings/:bookingId` |
| Eligibility | `GET /api/bookings/trip-bookings/:bookingId/cancellation-eligibility` |
| Cancel | `PUT /api/bookings/trip-bookings/:bookingId/cancel` |

Create body: required `tourPackageId` (the personal plan id). Optional `specialRequests` (max 500) and `paymentMethod` (max 50). The server copies dates and the priced total from the plan. The client does not send `totalAmount`.

List query: optional `status`, `paymentStatus` (`UNPAID` or `PAID`), `limit` (1–100), `offset`, `sortBy` (`bookedAt`, `totalAmount`, `status`), `sortOrder`.

Pay with `startPayment({ serviceType: "TRIP_PACKAGE", serviceTypeId, bookingId })`. Never call `POST /api/bookings/package-bookings/:id/purchase` for a plan whose `kind` is `PERSONAL`.

Cancel body: optional `reason` (max 500). Reuse `CancellationEligibility`.

### Segment booking links

The personal plan update body today accepts spot and entity ids on `daySegments` (`tourSpotId`, `activitySpotId`, `hotelId`, `transportId`), not booking ids. Do not send `hotelRoomBookingId`, `activityBookingId`, or `transportBookingId` unless a later backend validator accepts them. Until then, the checkout hook only creates the `TripBooking`. Attaching paid hotel, activity, or transport bookings onto days is out of this phase.

### Exit

`npx tsc --noEmit` passes.

## UI

Only after the functional exit.

- On the personal plan screen `src/app/(tabs)/trip-planner/[id].tsx`, add checkout when the plan has at least one day segment and a future start. Show the plan total the detail payload already returns. Submit creates the trip booking and starts payment.
- A trips section on the dashboard lists `GET /api/bookings/trip-bookings/my`, opens one booking, and cancels through eligibility. This is separate from catalog package bookings.
- Hide checkout when a non-terminal trip booking already exists for that plan (the server rejects a second active one). Show the existing booking instead.

Device cases: D-07 and D-07b in [tests.md](tests.md).
