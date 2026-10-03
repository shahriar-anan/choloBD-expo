# Rules — Bookings

## Scope

Traveller reservations only. `tracking/index.tsx` stays the hotel-admin screen. Do not point a `USER` at it.

## Data

Reuse the existing loaders:

- Hotels: `fetchUserBookings` / the list `user-bookings.tsx` already uses
- Tickets: the transport bookings loader
- Activities and guides: the attraction bookings loader

All merges those three results. Sort by the service date ascending for upcoming rows (`checkInDate`, `departureDateTime`, activity date, or guide start). A missing date sorts last. Do not invent a booking the APIs did not return.

Failed chip: the error message from the response, plus retry. Do not show an empty list in place of an error.

## Navigation

Detail, QR, pay, and cancel stay on the screens that already implement them. After the move, those screens are children of `bookings`, not `dashboard`.

Search and payment flows keep hiding the tab bar through `useHideTabBar`. The Bookings index keeps the bar.

Cancel still goes through the booking’s own eligibility and cancel call. Do not call a payment or wallet refund route from this tab.

## Copy

Chip labels in both locales: All, Hotels, Tickets, Activities. Page title is Bookings, the same word as the tab.

## Do not

- Do not add a Plans chip.
- Do not add a fifth chip for guides. Guides stay inside Activities.
- Do not show another user’s booking.
- Do not register this tab for `SERVICE_ADMIN` or `EMPLOYEE`.
