# Tests — increment 03 (package payment)

## Agent checks

```bash
npx tsc --noEmit
```

## Device cases

SSLCommerz sandbox or wallet as needed.

### D-03 Pay a package booking

- Setup: `PackageBooking` in `UNPAID` after purchase flow.
- Steps: pay → complete sandbox → return to app.
- Expected: initialize with `serviceType: PACKAGE_BOOKING`, `serviceTypeId` = booking id. Transaction poll via `GET /api/payments/transaction/:id`. Booking `PAID` on success.

Re-run **D-00** (hotel pay regression) if payment shared code changed.
