# Rules — Today’s house

## Scope

The Home tab for a hotel admin only. Traveller `index.tsx` content stays.

## Data

Reuse `useCurrentBookingsFetch` and `matchesDeskBucket`. Do not invent a count the bookings payload does not support. A failed load shows the error and a retry. It does not show zeros.

Shift windows stay the ones `hotelDesk` already uses. Do not draw a new calendar.

## Navigation

Each count pushes the Bookings tab with the matching lens. Until increment 03, that may still be `dashboard/service-admin/current-bookings?lens=`. After 03, it is the Bookings tab. Do not push the traveller bookings list.

Week availability pushes the existing availability screen.

## Copy

Date line can stay the formatted date from `formatDeskDate`. Count labels Arriving, In house, Departing, and Unpaid need both locales. Do not leave those four strings hardcoded in English once this screen is the Home tab.

## Do not

- Do not show Explore tiles.
- Do not show another hotel’s stays.
- Do not add check-in buttons on Home. Those stay on the booking card.
