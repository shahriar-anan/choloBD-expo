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

## UI polish (hotel list and hotel detail only)

Functional wiring is already executed. This pass does not add endpoints or change package screens.

- Hide the tab bar on `user-bookings` and `[bookingId]` via `useHideTabBar`. Restore it when those screens blur. Dashboard home keeps the bar.
- One bottom inset after the bar is hidden. The hotel list must not show a gray `background` band above the old tab-bar slot.
- Booking list and booking detail include `hotel.images` (`url`, `altText`, ordered by `order`) from the existing hotel booking reads. No new route and no schema change. Cover is `images[0].url`. Missing image uses a theme placeholder, not a stock URL.
- Traveler booking cards show that cover beside the hotel name. Detail opens with a full-width hero, hotel name as the title under the photo, then stay dates, rooms, and guest as grouped rows. Do not leave the detail body as a column of raw label/value lines.
- Cancel, Generate QR, and unpaid Complete payment share one bottom stack. Cancel stays fully visible and is disabled when `canCancel` is false. Scroll content clears that stack.
- Strings through `TRANSLATION_KEYS`. Do not change cancel or eligibility behavior.
