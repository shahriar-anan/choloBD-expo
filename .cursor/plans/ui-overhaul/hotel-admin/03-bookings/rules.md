# Rules — Guest bookings

## Scope

Guest stays for the signed-in hotel admin’s hotel. The traveller chip list stays behind `isTravelerRole`.

## Data

Reuse `useCurrentBookingsFetch` and `matchesDeskBucket`. Search stays the client filter `current-bookings.tsx` already applies. Do not add a server search.

Cancel still calls `getHotelCancellationEligibility` and `cancelHotelBooking`. Do not call a payment or wallet refund route from this tab.

Record-stay still uses `updateHotelStayStatus` and `canRecordStay`.

## Navigation

Lenses are Arriving, In house, Departing, Unpaid, and All. Home’s four counts map onto the first four. All does not appear on Home.

Opening a card does not switch the selected tab to Dashboard.

## Copy

Lens labels in both locales. Page title is Bookings, the same word as the tab.

## Do not

- Do not show tickets, activities, guides, or the admin’s own trips.
- Do not show another hotel’s guests. The fetch is already scoped to the admin’s hotel. Do not widen it.
- Do not add a QR scanner on this tab.
