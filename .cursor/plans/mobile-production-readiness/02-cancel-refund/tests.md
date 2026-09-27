# Tests — increment 02 (cancel and refund)

## Agent checks

```bash
npx tsc --noEmit
```

After Functional, before UI (per [_shared/global-rules.md](../_shared/global-rules.md)).

## Device cases

Traveler JWT. Use bookings inside and outside policy windows (server enforces; app displays eligibility only).

### D-02 Hotel cancel outside 24 hours

- Setup: hotel booking check-in more than 24 hours away.
- Expected: eligibility then `DELETE /api/bookings/hotel-rooms/:id`. Paid digital: `refundAllowed: true`. Status `CANCELLED`.

### D-02b Hotel cancel inside 24 hours or after start

- Expected: server `reason` shown. No confirm if `canCancel` is false. If cancel allowed with no refund, say so before confirm.

### D-02c Package cancel when pending

- Setup: unpaid `PENDING` package booking.
- Expected: `PUT .../cancel`. No refund object. Status `CANCELLED`.

### D-02d Package cancel when paid, more than 7 days out

- Expected: cancel available even when not `PENDING`. Refund in response. App does not call `/api/payments/refund`.

### D-02e Package cancel inside 7 days

- Expected: follows `canCancel`; `refundAllowed` false with clear copy before confirm.
