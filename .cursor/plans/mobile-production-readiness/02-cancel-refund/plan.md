# 02 — Cancel and refund on hotel and package bookings

**Folder:** `02-cancel-refund` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: Not started. Depends on increment 01. UI starts only after Functional typechecks.

Hotel cancel has no client. Package cancel calls the right URL but the screen only offers it when `status === 'PENDING'`. Paid cancels are allowed by policy and may refund. This phase wires eligibility and cancel for those two products only.

## Functional

### Shared type

Add `src/types/cancellation.ts`:

```ts
export interface CancellationEligibility {
  canCancel: boolean;
  refundAllowed: boolean;
  refundAmount: number;
  refundMethod: "sslcommerz" | "wallet" | "none";
  reason: string;
}
```

A cancel result is the booking plus `eligibility` and an optional `refund`. Type it per service. Do not call payment or wallet refund endpoints from these functions.

### Hotel

Extend `src/services/api/bookings.ts`:

- `getHotelCancellationEligibility(bookingId)` → `GET /api/bookings/hotel-rooms/:bookingId/cancellation-eligibility`
- `cancelHotelBooking(bookingId)` → `DELETE /api/bookings/hotel-rooms/:bookingId`

Keep create, list, get, and update as they are. `src/hooks/useBookingLogic.tsx` gains `loadEligibility` and `cancelBooking` that call those functions. Do not cancel when `canCancel` is false; throw the server `reason` so the UI can show it.

`src/services/api/hotelBookings.ts` still points at `/api/hotel-bookings`. Nothing should call that URL. Leave the type export if `HotelBookingInfo` is imported elsewhere, and do not add new calls in that file.

### Package

`src/services/api/packageBookings.ts` already has `PUT /api/bookings/package-bookings/:bookingId/cancel` with optional `reason` and `notes`. Add:

- `getPackageCancellationEligibility(bookingId)` → `GET /api/bookings/package-bookings/:bookingId/cancellation-eligibility`

Update `src/hooks/usePackageBookingLogic.tsx` so `handleCancelBooking` fetches eligibility first. Remove the comment and any guard that limits cancel to `PENDING`. The hook cancels when `canCancel` is true, including paid bookings. Pass through `reason` and `notes` (each max 500 characters).

### Exit

`npx tsc --noEmit` passes. No new screens yet.

## UI

Only after the functional exit.

### Hotel booking detail

`src/app/(tabs)/dashboard/[bookingId].tsx`

- On open, if the booking is not already `CANCELLED`, `COMPLETED`, `REFUNDED`, or `NO_SHOW`, load eligibility.
- Show `reason`. If `refundAllowed`, show `refundAmount` and `refundMethod`.
- Confirm cancel only when `canCancel` is true. Success refreshes the booking and shows the refund payload when present.
- Strings go through `TRANSLATION_KEYS`.

### Package booking detail

`src/app/(tabs)/dashboard/package-bookings/[bookingId].tsx`

- Remove the `booking.status === 'PENDING'` gate around the cancel form.
- Same eligibility preview as the hotel screen before the reason and notes fields.
- Keep the existing reason and notes inputs. Disable submit while `canCancel` is false and show `reason`.

Device cases: D-02, D-02b, D-02c, D-02d, D-02e in [tests.md](tests.md).
