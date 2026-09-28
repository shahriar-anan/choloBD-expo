# Tests — increment 02 (cancel and refund)

## Agent checks

```bash
npx tsc --noEmit
```

After Functional, before UI (per [_shared/global-rules.md](../_shared/global-rules.md)).

## Device cases — UI polish first

**Passed on device 2026-09-28**, including the later list filter, shorter hero, QR beside the confirmation code, no guest row, no room rows on the list, and Pay with Wallet coins on Complete Payment.

Traveler JWT. Screenshots from before the pass: list showed a gray band above the tab bar; detail header was a tall empty bar; Generate QR covered Cancel booking.

### D-02-ui-list Hotel bookings list chrome

- Open My Bookings (`user-bookings`).
- Expected: no Homepage / Explore / Dashboard / Tracking bar. No gray band under the last card. Each card shows the hotel cover (placeholder only if that hotel has no image). Leaving the screen restores the tab bar on dashboard home.

### D-02-ui-detail Hotel booking detail chrome

- Open a confirmed hotel booking (the Cox’s Bazar sample is fine: check-in already started, so cancel is not allowed).
- Expected: full-width hotel photo, hotel name as the title under it, then stay dates, rooms, and guest as grouped rows (not a plain text list). No tab bar. Cancellation reason is readable. Cancel booking is fully visible and disabled. Generate QR sits under it and does not cover it. Unpaid bookings still show Complete payment under QR.

## Device cases — policy

Traveler JWT. Use bookings inside and outside policy windows (server enforces; app displays eligibility only). Run after D-02-ui*.

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
