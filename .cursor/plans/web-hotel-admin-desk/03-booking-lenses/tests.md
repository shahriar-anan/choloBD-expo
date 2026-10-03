# Tests — 03 booking lenses

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Use a hotel employee account and bookings you can identify: a multi-night stay arriving today, a guest whose check-in was before today and check-out is after today, a departure today, a morning or afternoon shift today, an unpaid pending booking, and a cancelled booking.

## Chips

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-03a The bookings tab opens on **Arriving**, not on a check-in date of today plus check-out of tomorrow.
- [ ] W-03b The multi-night arrival is on Arriving. It is absent from In house.
- [ ] W-03c The in-house guest is on In house and absent from Arriving.
- [ ] W-03d Today’s departure is on Departing.
- [ ] W-03e Today’s morning or afternoon shift stay is on Arriving.
- [ ] W-03f Unpaid shows the pending unpaid booking and does not show a cancelled booking.
- [ ] W-03g All shows pending, confirmed, and cancelled rows from the loaded list.
- [ ] W-03h An empty chip states which lens is empty. It does not say only “No bookings found” when other chips have rows.

## Search and row

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-03i Search finds a booking by confirmation code, by phone, and by the account last name when `guestName` is empty.
- [ ] W-03j The row shows shift, both dates as `3 Oct 2026`, Paid or Unpaid, room numbers, and confirmation code before any expand control.
- [ ] W-03k The phone number is a link. Activating it uses `tel:`.
- [ ] W-03l There is still no Check In or Cancel button.
