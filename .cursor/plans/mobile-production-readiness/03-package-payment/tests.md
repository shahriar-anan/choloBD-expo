# Tests — increment 03 (payment types)

## Agent checks

```bash
npx tsc --noEmit
```

## Device cases

### D-03 No catalog package purchase

- Open the current tour-package and trip-plan screens a traveler can reach.
- Expected: there is no new path that buys a catalog package or starts `PACKAGE_BOOKING` payment. Personal plan checkout is still increment 07 (`TRIP_PACKAGE`), not this increment.

### D-03b Hotel pay still sends booking id

- Pay an unpaid hotel booking from Complete Payment.
- Expected: initialize still uses `serviceType: HOTEL_BOOKING`, and the body includes `serviceTypeId` and `bookingId` as the same hotel booking id. No `userId` for authorization.

Re-run hotel pay if `usePaymentLogic` or the initialize body changed.
