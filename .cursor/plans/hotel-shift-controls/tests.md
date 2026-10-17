# Tests — hotel shift controls (mobile)

Use a hotel `SERVICE_ADMIN` and an `EMPLOYEE` of the same hotel. A second hotel admin is the negative case. A traveler account books. Password and seed users follow `11-hotel-operator` (`hoteladmin1@gmail.com`, `hotelemployee1@gmail.com`, `root1234`) when those accounts are loaded.

Start from a hotel whose `allowShiftBooking` is false and whose room types have null slot prices.

## Hotel switch

- Admin opens hotel info. The switch is off. There is no last-change date on a hotel that has never been changed.
- Admin turns it on. `GET /api/hotels/:id` returns `allowShiftBooking: true` and a `lastBookingModeUpdateDate`.
- Admin turns it on again. The server message is shown. The flag stays true.
- Admin turns it off, then immediately on. The second change is rejected with the two-month message. The flag stays off.
- Profile save (phone or email) does not change `allowShiftBooking` or `lastBookingModeUpdateDate`.
- Employee sees on or off and cannot save it.
- The other hotel’s admin gets a failed response on this hotel’s booking-mode route.

## Room type prices

- With the hotel switch on, admin enables shifts on one room type, sets morning `1800` and night `2200`, and leaves afternoon empty. After reload, afternoon is empty and the other two prices match.
- Save afternoon as `0`. The form does not send it. The stored afternoon price stays null.
- Admin turns that type’s shift flag off and saves. The type reloads with the flag off and the morning and night prices still stored.
- Admin adds a new room type with only a nightly price. It reloads with shift booking off and null slot prices.
- With the hotel switch off, admin can still save a night price on a type. A traveler Night search does not list this hotel.
- Employee sees the prices and cannot edit them.

## Desk

- Create a night booking and a whole-day booking at this hotel.
- Admin desk list: the night row says Night, the whole-day row says Whole day.
- Employee sees the same labels.
- Open the night stay. Guest name, phone, email, payment method, and special requests are on that page. The room rate uses the shift suffix.

## Traveler

- Hotel switch on, one type with night `2200` and `allowShiftBooking` true, another type shift-off with only a nightly price.
- Night search lists this hotel. The card price is `2200`, not the nightly price.
- The room step lets the traveler select the night type. The shift-off type is not selectable.
- Create succeeds. The booking’s `shift` is `NIGHT` and `totalPrice` is `2200` for one room.
- Clear the night price (null) and search Night again. That type is not selectable. If it was the only shift type, the card does not show the nightly price as the night price.
- Turn the hotel switch off. Night search does not list the hotel. Whole day search still lists it, and the card shows the nightly price.
- A morning search does not treat the night price as the morning price.

## Fix round (plan section 5)

Conflicts and time:

- Book room type A with one free room, Whole day, from today to the day after tomorrow. Search Morning for tomorrow. Type A shows 0 free, and create for that shift fails with the not-enough-rooms message.
- Book Night for today on a type with one room. Search Whole day from today to tomorrow. That type shows 0 free.
- Book Morning for today. Afternoon for today on the same room type still has the room free.
- Run the backend with `TZ=UTC`. Create Night for a date. `checkInDate` is `YYYY-MM-DDT16:00:00.000Z` (22:00 Dhaka), and `checkOutDate` is the next day at `02:00Z`. The desk shows it arriving on that Dhaka date. The refund preview counts hours to 22:00 Dhaka time.
- Repeat with `TZ=Asia/Dhaka`. Same stored values.

List and availability:

- Hotel switch off, type shift-on with a night price. Website and app Night searches do not list the hotel. Room-type availability for Night returns `isAvailable: false` and 0 for every type.
- Hotel switch on, type shift-on with only a morning price. A Night search does not list the hotel. A Morning search lists it.
- `PUT /api/hotel-rooms/roomTypes/:id` with `nightShiftPrice: 0`, `-5`, or `"abc"` fails validation. `null` is accepted and clears the price.

Traveler:

- Pick Night on results, then change to Whole day. The results screen does not crash and does not fetch until checkout is picked.
- Open a hotel from home deals while the saved shift is Night. The stay resets to the catalog Whole day stay.
- Night search, then open a hotel whose switch is off (for example through a trip plan). The hotel page explains that it only takes whole-day stays, and the button switches the stay to Whole day.
- On a Night search, the hotel page price bar shows the night price with “per shift”.
- Select 2 rooms, go back, and change the dates to a range with 1 free. The quantity drops to 1 or clears. The total matches the payload.
- Double-tap Confirm and then Create. One booking is created.
- On guest details for a Night stay, **Add or change rooms** does not list a shift-off type.
- With the hotel detail request failing (offline), Confirm stays on the room step with an error instead of opening a blank screen.
- Create for a room that was just taken shows the server message, not “Failed to create booking”.
- Open a pending Night booking. Date fields are not editable. Special requests can be saved.
- Traveler booking card room lines say “per shift” for a Night booking.
- The rating filter has no 4.5+ option, or 5 returns only 5-star hotels.

Hotel admin and employee:

- Admin flips the hotel switch. A confirm appears. Cancel leaves the switch and the server flag unchanged. Confirm saves.
- Admin types `0` or `abc` in a slot and taps Save. An error is shown, the save is blocked, and the stored price is unchanged.
- Admin changes a slot without saving. The row is marked unsaved. After saving, the row shows the server values.
- Admin turns shifts on for a type with all slots empty. A warning appears. Save still succeeds.
- Hotel switch off: the week board stay selector shows only Whole day. Employee sees the same.

## Regression

- Whole day create still uses `pricePerNight` and a checkout after check-in.
- `npx tsc --noEmit` in `choloBD-expo` and in `nodeapp` reports no new errors in these files.
- Whole day conflicts between two whole-day bookings behave as before.
- Website hotel admin screens for profile and the booking list are unchanged. The room-type form gains `maxGuests`. The booking request sends `guestCount`.

## Guest capacity (plan section 6a)

Migration and setup:

- After migrate, existing room types read Single 1, Double 2, Deluxe 2, Suite 4. Existing bookings have no guest count, and their stay screen shows no guest line.
- The seed creates the same numbers.

Admin in the app:

- Choosing Suite prefills 4. The admin changes it to 3 and adds the type. It reloads as 3.
- The admin changes an existing Double from 2 to 3 and saves. The row shows unsaved until Save, then reloads as 3.
- `0`, `11`, blank, and text are rejected with a message.
- An employee sees the numbers and cannot edit them. Another hotel’s admin gets a failed response on this hotel’s room type.

Website:

- The master admin creates a room type. Choosing Double prefills 2, and the value can be overwritten. A save without a valid number fails.
- Editing an existing type changes the number. The app reads the new number.

Traveler:

- The traveler searches with 4 guests. A hotel whose free sellable rooms hold only 3 in total is not listed.
- Each room card shows how many guests it sleeps.
- With 2 guests, one Single can be selected, but Confirm opens a modal naming 2 guests and capacity 1, and does not continue.
- Two Singles confirm. One Double confirms.
- The same check runs on Create on the guest details screen.

Server:

- Create without `guestCount` fails validation.
- Create with too little room returns the server message.
- A successful create stores `guestCount`, and the opened stay shows it.
- Editing a pending booking to fewer rooms than its guest count needs is rejected.
- The website booking sends `guestCount`, and the same shortfall is rejected there.
- After the scripts are updated, `test-hotel-desk.js`, `test-hotel-operator-access.js`, `test-bilingual-content.js`, and `test-trip-plan-segments-checkout.ts` still pass.

## Bookable until (plan section 6b)

Use a clock set in Asia/Dhaka. Repeat the server cases with the API on a UTC machine.

Morning and afternoon:

- At 11:00, Morning today can be booked. At 12:00 it still can.
- At 12:01, Morning today is disabled in the shift choices and gone from search. Create for it fails.
- At 15:00, Morning is still closed. Afternoon can be booked until 19:00 and is closed at 19:01.

Night:

- At 18:00, tonight’s Night can be booked. The stored check-in is 22:00 today.
- At 23:30, the same night can still be booked.
- At 01:00, choosing today with Night asks which night is meant.
  - Choosing the running night creates a booking with check-in at 22:00 yesterday.
  - Choosing tonight creates a booking with check-in at 22:00 today.
- At 05:01, the running night cannot be booked, and a create with yesterday’s date fails. Tonight’s Night can still be booked.
- A create for Morning with yesterday’s date fails at any hour.

Whole day:

- Hotel check-in is 14:00. At 13:59, a whole-day search for today lists it. At 14:00 it is gone and create fails. A second hotel with check-in 18:00 is still listed at 14:00.
- A hotel with a blank check-in time uses 14:00.
- If no hotel is left, the empty screen says today’s check-in has passed and offers tomorrow.
- At 15:00, editing a pending whole-day booking to start today is rejected.

App search screens:

- Shift choices: pick today, then the shift. Morning is disabled after 12:00 with a reason. Pick Morning, then today. The date step shows a modal and keeps the previous date.
- Saved search, closed shift: save a Morning search for today at 09:00, then reopen the app at 13:00. Results explain that the shift has closed and offer Whole day or tomorrow.
- Saved search, past date: a search saved yesterday reopens with no date.

Other screens and dates:

- The operator week board still shows today’s Morning bookings after 12:00.
- Every shift on a later date can be booked at any hour.
- The website list and create use the same rules.
