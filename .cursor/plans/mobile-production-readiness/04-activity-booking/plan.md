# 04 — Activity booking

**Folder:** `04-activity-booking` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: Not started. Depends on increment 03 (shared payment types and `usePaymentLogic`). UI starts only after Functional typechecks.

Activity spots can be listed after phase 01. Booking, pay, QR, and cancel do not exist in the app. Hotel QR stays on the hotel endpoints.

## Functional

Add `src/services/api/activityBookings.ts` and `src/types/activityBookings.ts`. Add a hook `src/hooks/useActivityBookingLogic.tsx`. No Redux slice unless the hook cannot hold the booking list without one. Prefer the hook.

| Function | Call |
| --- | --- |
| Create | `POST /api/bookings/activity-spots` |
| List | `GET /api/bookings/activity-spots` |
| Get | `GET /api/bookings/activity-spots/:bookingId` |
| Update | `PUT /api/bookings/activity-spots/:bookingId` |
| Eligibility | `GET /api/bookings/activity-spots/:bookingId/cancellation-eligibility` |
| Cancel | `DELETE /api/bookings/activity-spots/:bookingId` |
| QR | `POST /api/bookings/activity-spots/:bookingId/qr-generate` |
| Scan | `POST /api/bookings/activity-spots/qr-scan` with `{ qrToken }` |

Create body:

- Required: `activitySpotId` (uuid), `userId` (the signed-in user id; the validator requires it), `bookingDate` (ISO-8601, not in the past), `participantCount` (1–100).
- Optional: `specialRequirements`, `specialRequests` (max 500), `paymentMethod` of `wallet`, `sslcommerz`, or `cash`.

Pay with `startPayment({ serviceType: "ACTIVITY_BOOKING", serviceTypeId, bookingId })` after create. Reuse `CancellationEligibility` from phase 02. Cancel only when `canCancel` is true.

Spot detail data already comes from `GET /api/activity-spots/:id` once phase 01 fixes the list URL. Add `getActivitySpotById` in `src/services/api/activitySpots.ts` if it is missing. Do not use `/location/:id`.

### Exit

`npx tsc --noEmit` passes.

## UI

Only after the functional exit.

- New screens under `src/app/(tabs)/explore/` for activity spot detail and booking form: date, participant count, optional notes, then pay.
- Dashboard list and detail for the user’s activity bookings, with eligibility and cancel using the same pattern as phase 02.
- QR: from the activity booking detail, generate a code. The existing scanner in `src/app/(tabs)/dashboard/service-admin/qr-scanner.tsx` must post activity tokens to `/api/bookings/activity-spots/qr-scan` when the token is not a hotel token, or offer an explicit activity scan mode. Hotel scan stays `POST /api/bookings/hotel-rooms/qr-scan`.
- Home or explore entry that today only opens tour spots should gain a path to the activity list (`GET /api/activity-spots`). Do not send ride or guide cards here.

Strings through `TRANSLATION_KEYS`. Device cases: D-04 and D-04b in [tests.md](tests.md).
