# Rules — increment 03 (payment types)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Catalog packages

Do not add a traveler purchase or pay flow for catalog tour packages in this increment.

- No pay-after-purchase on the current package booking screens.
- No `POST /api/bookings/package-bookings/:tourPackageId/purchase` from a new screen.
- A personal trip plan does not buy a catalog package. Increment 07 pays `TRIP_PACKAGE` only.

Viewing and buying a catalog package happens only in a later trip-plan segment. Do not invent that screen here.

## Payment initialize (hotel, and later products)

`POST /api/payments/initialize` with:

- `serviceType`
- `serviceTypeId` = booking id
- `bookingId` = same id
- No `userId` for auth

`PACKAGE_BOOKING` is allowed on the type union. No screen in this increment sends it.

## ServiceType union

Extend `src/types/payments.ts` to:

`HOTEL_BOOKING` | `PACKAGE_BOOKING` | `TRIP_PACKAGE` | `TRANSPORT_SERVICE` | `ACTIVITY_BOOKING` | `GUIDE_SERVICE` | `WALLET_TOP_UP`

## Browser flow

Only `usePaymentLogic`: open gateway URL, then `GET /api/payments/transaction/:transactionId`.
