# Rules — hotel shift controls (mobile)

## Scope

Expo hotel admin controls, the desk booking card, and the traveler list and room step that read those controls.

Backend, sections 1–4: one route, `PUT /api/hotels/:hotelId/booking-mode`, which calls the existing `HotelService.updateBookingMode`.

Backend, section 5: the shift conflict rule, Dhaka shift windows, the shift filter on the hotel list, shift handling in room-type availability, and the slot price validators.

Backend, section 6: `HotelRoomType.maxGuests` and `HotelRoomBooking.guestCount`, the guest-capacity check on list, create, and edit, and the bookable-until cutoff on list, availability, create, and edit. Two schema columns and a category backfill. Do not run Prisma CLI; ask before `migrate` and `generate`. The website room-type form and the website booking payload change. The website hotel profile form does not.

## Conflicts and time (server)

- A shift window is built from the Dhaka calendar day: Morning 08:00–15:00, Afternoon 15:00–22:00, Night 22:00 to 08:00 the next day, all `+06:00`. It never depends on the server time zone.
- A shift request is blocked by the same shift with the same start, or by any `ALL_DAY` booking that overlaps the shift window.
- An `ALL_DAY` request is blocked by any booking that overlaps it.
- Create, room-type availability, and the dated hotel list use the same conflict helper.
- A shift-search hotel list and shift availability count only room types that allow shifts and have a slot price above 0. If the hotel switch is off, no room type is counted.
- Slot prices on room-type writes are `null` or a number above 0.

## Who

| Action | Hotel `SERVICE_ADMIN` of that hotel | Hotel `EMPLOYEE` of that hotel | Traveler |
| --- | --- | --- | --- |
| Turn the hotel switch on or off | Yes | Read only | No |
| Edit nightly price, slot prices, and guests per room in the app | Yes | Read only | No |
| Set guests per room on the website room-type form | Yes, and `MASTER_ADMIN` | No | No |
| See the shift on a desk card | Yes | Yes | No |
| Search and book a slot the hotel offers | No | No | Yes |

`ensureUserAssignedToHotel` stays on the new route and on room-type writes. Another hotel’s admin cannot change this hotel.

## Hotel switch

- The switch is `Hotel.allowShiftBooking`. Default remains false.
- Save goes only to `PUT /api/hotels/:hotelId/booking-mode`.
- The profile `PUT /api/hotels/:hotelId` must not include `allowShiftBooking`. That update skips the two-month lock.
- A second change inside two months shows the server error. The client does not override it.
- Every change asks for confirmation first and says the next change is blocked for two months.
- Turning the hotel off does not delete room-type slot prices.

## Room type

- Nightly price stays `pricePerNight` and stays required.
- A shift slot is for sale only when the type’s `allowShiftBooking` is true and that slot’s price is a number greater than zero.
- An empty slot is stored as `null`. `0`, a negative number, or text is rejected with a message and is never turned into `null` without notice.
- Unsaved type changes are marked as unsaved. After a save, the row shows what the server returned.
- A shift-on type with no slot price shows a warning but can still be saved.
- `allowShiftBooking: false` on the type stops shift sale for that type and leaves stored prices in place.
- One save sends nightly price, the type flag, and the three slot prices together on the existing room-type `PUT`.
- A new room type defaults to shift-off.
- Preparing slot prices while the hotel switch is off is allowed. Travelers still cannot book a shift until the hotel switch is on.
## Guests per room

- `maxGuests` is how many guests one room of that type holds. It is an integer from 1 to 10. It is read as stored and is never calculated from beds at booking time.
- Existing room types are backfilled by category: Single 1, Double 2, Deluxe 2, Suite 4. The seed uses the same numbers. A new room type starts from that number for its category, and the person creating it can change it.
- The hotel `SERVICE_ADMIN` in the app, and the master admin or hotel admin on the website room-type form, can change it at any time. There is no lock. Employees can read it and cannot change it.
- A change applies to new bookings and edits. Existing bookings keep their rooms.
- Selected rooms cover the group when the sum of `maxGuests × quantity` is at least the guest count.
- The traveler sees how many each room sleeps. The dated list leaves out a hotel whose sellable rooms for that stay cannot hold the group. Confirm and Create stop with a modal when the chosen rooms are too small.
- Create requires `guestCount` (1–6), rejects a shortfall, and stores it on the booking. Editing rooms rechecks against the stored count. Old bookings with no count skip that recheck.

## Bookable until

- The clock is Asia/Dhaka.
- A shift can be booked until 3 hours before it ends, on any date. Last moments: Morning 12:00, Afternoon 19:00, Night 05:00 the next morning. A shift that has started can still be booked inside that limit, at the full slot price.
- A whole day can be booked until the hotel’s `checkInTime` on the check-in day, with no three-hour allowance. A missing or invalid time uses 14:00.
- From 00:00 to 05:00, the night that started at 22:00 the day before can still be booked. Its check-in date is yesterday. That is the only past check-in date allowed. The app asks whether the traveler means the running night or tonight.
- The dated hotel list, room-type availability, create, and whole-day date edits all use this cutoff. A closed stay is disabled in the shift choices, absent from search, and rejected by the server. The operator week board does not apply it.
- A reopened search with a past date is cleared. A reopened search for a closed stay explains why there are no results and offers another choice.

## What a traveler is offered

- A Morning, Afternoon, or Night search sends `shift` and `allowShiftBooking=true`.
- A Whole day search does not send `allowShiftBooking`.
- A shift result price is the lowest price above zero for that shift on a type that allows shifts.
- A room type is selectable for a shift only when the hotel switch is on, that type allows shifts, and the slot price is above zero. This applies on the room step and in **Add or change rooms** on guest details.
- The hotel page shows the shift price for a shift search. A hotel that cannot sell the chosen shift offers a switch to Whole day instead of a room list.
- Every path that opens a hotel outside search (recommended, home deals, trip plan) resets to the catalog stay first.
- Room quantities are cleared when the hotel, shift, or dates change, and limited to the rooms currently available.
- Confirm and Create ignore a second tap while one request is running.
- Guest details open only after the hotel detail loads.
- Create failures show the server message.
- A pending shift booking cannot have its dates edited. Only special requests can change.
- Create sends `guestCount` with the rooms and dates. The server still recomputes `totalPrice` and checks `guestCount` against `maxGuests`.

## Desk

- The desk card names the shift with the existing Whole day / Morning / Afternoon / Night strings.
- Missing `shift` displays as Whole day.
- Guest name, phone, email, payment method, and special requests stay on the opened stay, not on the card.
- Room lines on any booking card use the per-shift suffix for a shift booking.
- The week board hides Morning, Afternoon, and Night while the hotel switch is off.

## Copy

New strings in English and Bangla. Reuse existing shift labels.
