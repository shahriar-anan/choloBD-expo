# 03 — Package payment

**Folder:** `03-package-payment` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: Not started. Depends on increment 02. UI starts only after Functional typechecks.

Hotel pay already opens SSLCommerz from `usePaymentLogic`. Catalog package purchase creates a `PackageBooking` and does not start payment. This phase pays that booking with `PACKAGE_BOOKING` and widens the client `ServiceType` union so later phases can reuse the same hook.

## Functional

### Payment types

In `src/types/payments.ts`, set `ServiceType` to:

`HOTEL_BOOKING` | `PACKAGE_BOOKING` | `TRIP_PACKAGE` | `TRANSPORT_SERVICE` | `ACTIVITY_BOOKING` | `GUIDE_SERVICE` | `WALLET_TOP_UP`

Add `bookingId: string` to `InitializePaymentParams`. `src/services/api/payments.ts` already posts the params object to `POST /api/payments/initialize`. Callers must send:

- `serviceType`
- `serviceTypeId` = the booking id
- `bookingId` = the same booking id

Do not send `userId` for authorization. Optional `phone`, `email`, `userName`, and `paymentAmount` may stay if a screen already collects them.

`usePaymentLogic` stays the only gateway starter. It opens `gatewayPageURL` and then reads `GET /api/payments/transaction/:transactionId`. No second browser helper.

### Package purchase then pay

`src/services/api/packageBookings.ts` `purchasePackage` stays `POST /api/bookings/package-bookings/:tourPackageId/purchase` with optional `quantity` (1–100), `specialRequests`, `notes`, `startDate`, `endDate`, and `participantCount`.

`src/hooks/usePackageBookingLogic.tsx` (or `usePaymentLogic` called from the package flow) after a successful purchase:

1. Read the new booking id from the purchase response.
2. Call `startPayment({ serviceType: "PACKAGE_BOOKING", serviceTypeId: bookingId, bookingId })`.
3. Return both the booking and the payment result. A failed or dismissed browser session leaves the booking `UNPAID` so the user can retry from booking detail.

Hotel call sites in `src/app/(tabs)/explore/payment.tsx` and `src/app/(tabs)/dashboard/payment.tsx` must pass `bookingId` as well as `serviceTypeId` when they are updated in the UI section. The functional change is the type and the hook accepting that field. Do not switch hotel `serviceType` away from `HOTEL_BOOKING`.

### Exit

`npx tsc --noEmit` passes. Existing hotel payment call sites still compile. If the new `bookingId` field is required, update those two call sites in the UI section immediately after, still before any new package screen work.

## UI

Only after the functional exit.

- Package booking confirmation, `src/app/(tabs)/explore/tour-booking.tsx` or the screen that submits purchase: after purchase, offer pay and run the existing payment screen or call `usePaymentLogic` in place. Do not build a new WebView.
- `src/app/(tabs)/dashboard/package-bookings/[bookingId].tsx`: if `paymentStatus` is `UNPAID` and status is not `CANCELLED`, show pay. Route into `src/app/(tabs)/dashboard/payment.tsx` with `serviceType=PACKAGE_BOOKING` and the booking id, or call the hook directly.
- `src/app/(tabs)/explore/payment.tsx` and `src/app/(tabs)/dashboard/payment.tsx`: pass `bookingId` together with `serviceTypeId`.

Device case: D-03 in [tests.md](tests.md). Re-run D-00 if hotel pay was touched.
