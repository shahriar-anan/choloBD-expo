# 03 — Booking lenses

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

**Folder:** `03-booking-lenses` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Not started.** Depends on increment 2.

Employee **Bookings** defaults to check-in exactly today and check-out exactly tomorrow. A stay of two nights, a guest already in house, and a same-day shift stay all disappear. **Clear** restores that same pair. Search reads `guestName` only.

## Outcome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

The desk opens on who matters today. A row shows the facts needed before opening details: guest, shift, dates, payment, room numbers, confirmation code, and a phone link.

## Lenses

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Replace the two date fields with chips. Default chip: **Arriving**.

Copy the calendar-day rules from `choloBD-expo/src/utilities/hotelDesk.ts`:

| Chip | Who is included |
| --- | --- |
| Arriving | `CONFIRMED`, check-in calendar day is today, check-out is a later calendar day |
| Departing | `CONFIRMED`, check-out calendar day is today, check-in calendar day is before today |
| In house | `CONFIRMED`, check-in calendar day is before today, check-out calendar day is after today |
| All | Every loaded row, including pending and cancelled |

Add one case the Expo helper does not cover. A shift stay uses the same calendar day for check-in and check-out (morning 08:00–15:00, afternoon 15:00–22:00). Those `CONFIRMED` rows are **Arriving** when that calendar day is today. Night (22:00–08:00 next day) already spans two dates and follows the table above.

**Unpaid** is an extra chip, not a replacement: `paymentStatus` is `UNPAID` and `status` is `PENDING` or `CONFIRMED`, any dates. It is not limited to today.

**Clear** on the name search only clears the text. It does not change the selected chip.

## Search

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

One text field matches, case-insensitive, any of:

- `guestName`
- `user.firstName` and `user.lastName`
- phone from `guestPhoneNumber` or `user.phoneNumber`
- `confirmationCode`

## Row

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Always visible, without opening Actions:

- Guest display name (`guestName`, otherwise user first + last, otherwise “Guest”)
- Shift label (All day, Night, Morning, Afternoon)
- Check-in and check-out as `3 Oct 2026`
- Payment status (Paid / Unpaid)
- Room numbers from `roomDetails`, or “Assigned at check-in” when the list is empty
- Confirmation code
- Phone as a `tel:` link when a number exists

Actions may still expand for email, special requests, and the room price lines. Do not put Check In or Cancel back. Those return in increment 6.

Empty copy depends on the chip: “No arrivals today”, “No one in house”, “No departures today”, “No unpaid bookings”, “No bookings loaded”. When the hotel has bookings but the chip is empty, say which chip is active so staff do not think the hotel has no reservations.

## Leave alone

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- Admin Earnings tab. Increment 6 gives the admin this same list.
- Stay-status and cancel API calls.
- The Expo `hotelDesk.ts` file.

## Files

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- `src/utilities/hotelDeskLenses.ts` (new, web). Pure functions. Include the same-day shift case in comments and in the Arriving branch.
- `src/components/modular-components/dashboard/employee/hotel/HotelRoomBookingsManagement.tsx`
- `src/utilities/deskFormat.ts` from increment 2, for the date and shift labels

## Exit

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

[tests.md](tests.md). `npx tsc --noEmit` from `choloBD-expo`.
