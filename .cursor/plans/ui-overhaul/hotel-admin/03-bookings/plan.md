# 03 — Guest bookings

**Folder:** `03-bookings` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented.

`src/app/(tabs)/bookings/index.tsx` is the traveller reservation list. A hotel admin who opens Bookings must not see All, Hotels, Tickets, and Activities.

They see the list that `dashboard/service-admin/current-bookings.tsx` already is: search, lenses, and `BookingCard`.

## What the hotel admin sees

```
Bookings

[ Arriving ] [ In house ] [ Departing ] [ Unpaid ] [ All ]

— search —
— guest cards —
```

Default lens is Arriving, matching `current-bookings.tsx`. Home passes a lens and that lens is selected.

Each card keeps the actions it has now: open the stay, cancel through eligibility, and record stay when `canRecordStay` allows it. QR generate on a guest stay stays the hotel QR screen that card already opens.

## Where the screens live

Render this list from the Bookings tab so the tab stays selected. Keep one list implementation. `current-bookings.tsx` can become that screen, or the Bookings index can render it. Do not fork a second guest list.

A stay detail opened from this tab stays under a route that leaves Bookings selected. Re-export the operator detail the way traveller stays re-export `dashboard/[bookingId]`, if that screen already shows the operator actions. Do not write a second detail.

The traveller path in `bookings/index.tsx` is unchanged and still hidden from this role by the tab layout. The branch is here so a deep link cannot show traveller chips to a hotel admin.

## Left off

- Earnings, availability, and the QR scanner (increment 04).
- Notification deep links (increment 05).
