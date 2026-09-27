# Rules — increment 02 (cancel and refund)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Scope

Hotel and **catalog package** bookings only. Do not add activity, guide, transport, or trip cancel in this increment.

## Cancel flow

1. `GET .../cancellation-eligibility` before showing cancel.
2. Cancel only if `canCancel` is true.
3. Display server `reason`, `refundAllowed`, `refundAmount`, `refundMethod`.
4. Never call `POST /api/payments/refund` or wallet admin refund APIs from the traveler app.

## Endpoints

| Product | Eligibility | Cancel |
| --- | --- | --- |
| Hotel | `GET /api/bookings/hotel-rooms/:bookingId/cancellation-eligibility` | `DELETE /api/bookings/hotel-rooms/:bookingId` |
| Package | `GET /api/bookings/package-bookings/:bookingId/cancellation-eligibility` | `PUT /api/bookings/package-bookings/:bookingId/cancel` |

## Package UX rule

Paid package bookings may be cancellable with refund (policy: more than 7 days before start). Do **not** limit cancel UI to `status === 'PENDING'`.

## Type

Use shared `CancellationEligibility` in `src/types/cancellation.ts` (see `plan.md`).
