# Rules — increment 03 (package payment)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Payment initialize

`POST /api/payments/initialize` with:

- `serviceType: PACKAGE_BOOKING`
- `serviceTypeId` = package booking id
- `bookingId` = same id
- No `userId` for auth

## ServiceType union

Extend `src/types/payments.ts` to include all types later increments need:

`HOTEL_BOOKING` | `PACKAGE_BOOKING` | `TRIP_PACKAGE` | `TRANSPORT_SERVICE` | `ACTIVITY_BOOKING` | `GUIDE_SERVICE` | `WALLET_TOP_UP`

## Browser flow

Only `usePaymentLogic`: open gateway URL, then `GET /api/payments/transaction/:transactionId`.

## Product boundary

Catalog package checkout creates `PackageBooking` then pays with `PACKAGE_BOOKING`. Personal plans use increment 07 (`TRIP_PACKAGE`), not this flow.
