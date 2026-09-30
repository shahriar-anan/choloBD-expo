# 03 — Payment types only (catalog package buy removed)

**Folder:** `03-package-payment` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: Functional done (types + hotel `bookingId` on initialize). Device cases D-03 / D-03b not run. Catalog package buy stays out.

Catalog tour packages are **not** bought from the current package purchase screens, and they are **not** bought by checking out a personal trip plan. The only place a traveler will view and buy a catalog package is a trip-plan segment that will be specified later. Do not design or build that segment in this increment.

## Removed from this increment

Do not add pay-after-purchase on `src/app/(tabs)/explore/tour-booking.tsx` or any other screen that calls `POST /api/bookings/package-bookings/:tourPackageId/purchase`.

Do not add a pay button on `src/app/(tabs)/dashboard/package-bookings/[bookingId].tsx`.

Do not send `PACKAGE_BOOKING` from the personal trip plan (increment 07). A personal plan checks out as `TripBooking` + `TRIP_PACKAGE` only.

Leave `purchasePackage` in place if something else already calls it. Do not add a new traveler path that creates a `PackageBooking`.

## Functional

Hotel pay already opens SSLCommerz from `usePaymentLogic`. This phase only widens the client payment types so increments 04–07 can reuse that hook.

In `src/types/payments.ts`, set `ServiceType` to:

`HOTEL_BOOKING` | `PACKAGE_BOOKING` | `TRIP_PACKAGE` | `TRANSPORT_SERVICE` | `ACTIVITY_BOOKING` | `GUIDE_SERVICE` | `WALLET_TOP_UP`

Add `bookingId: string` to `InitializePaymentParams`. `src/services/api/payments.ts` already posts the params object to `POST /api/payments/initialize`. Callers must send:

- `serviceType`
- `serviceTypeId` = the booking id
- `bookingId` = the same booking id

Do not send `userId` for authorization. Optional `phone`, `email`, `userName`, and `paymentAmount` may stay if a screen already collects them.

`usePaymentLogic` stays the only gateway starter. It opens `gatewayPageURL` and then reads `GET /api/payments/transaction/:transactionId`. No second browser helper.

`PACKAGE_BOOKING` stays in the union for the later trip-plan segment. No screen in this increment calls it.

### Exit

`npx tsc --noEmit` passes. Existing hotel payment call sites still compile. If the new `bookingId` field is required, update `src/app/(tabs)/explore/payment.tsx` and `src/app/(tabs)/dashboard/payment.tsx` to pass `bookingId` as well as `serviceTypeId`. Hotel `serviceType` stays `HOTEL_BOOKING`.

## UI

Only the two hotel payment call sites above, and only to pass `bookingId`.

No catalog package browse, purchase, or pay screen. That UI is a later trip-plan segment, specified when the product shape is ready.

## Later (not this increment)

Catalog packages are viewed and bought only inside the trip plan module, on the segment that will be added later. Until that spec exists, travelers have no new way to purchase a catalog package.
