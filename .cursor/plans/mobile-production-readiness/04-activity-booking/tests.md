# Tests — increment 04 (activity booking)

## Agent checks

```bash
npx tsc --noEmit
```

## Device cases

### D-04 Book an activity

- Setup: active spot, future date, capacity.
- Expected: `POST /api/bookings/activity-spots`. Pay with `ACTIVITY_BOOKING`.

### D-04b Activity QR and cancel

- QR: `POST .../qr-generate`.
- Cancel tomorrow’s booking: refund if server allows.
- Cancel today’s booking: no refund when `refundAllowed: false`.
