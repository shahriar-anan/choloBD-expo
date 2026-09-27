# Tests — increment 07 (trip checkout)

## Agent checks

```bash
npx tsc --noEmit
```

## Device cases

Requires personal plan from increment 01.

### D-07 Check out a personal plan

- Setup: plan with segments, start >7 days away.
- Expected: `POST /api/bookings/trip-bookings` with `tourPackageId`. Pay `TRIP_PACKAGE`. Cancel `PUT .../cancel` with refund when eligible.

### D-07b No catalog purchase for personal plan

- Expected: no call to package-bookings purchase for personal plan checkout.
