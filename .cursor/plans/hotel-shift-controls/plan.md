# Hotel shift controls — mobile

**Folder:** `hotel-shift-controls` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Sections 1–6 implemented in code.** Section 6 still needs the Prisma migration and `prisma generate` (do not run them from the agent). Device cases in `tests.md` are still unchecked.

**Target:** the Expo app, plus one backend route the hotel switch cannot work without. Do not change the website.

A traveler can already search Morning, Afternoon, Night, or Whole day and send that shift on create. A hotel cannot offer those slots from the app. Shift booking stays off until the hotel turns it on, and a room type is sold for a slot only when that type allows shifts and has a price for that slot. This plan is the mobile controls for that offer, the desk label so staff can see which slot was sold, and the traveler list and room step so they can book only what that hotel actually offers.

## What is already true

| Fact | Where |
| --- | --- |
| Traveler search defaults to Night and posts `shift`, dates, and `selectedRoomsMap` | `src/app/(tabs)/explore/` |
| Create rejects a shift stay unless `Hotel.allowShiftBooking` is true, the room type’s `allowShiftBooking` is true, and that slot’s price is not null | `hotelRoomBookingService.createBooking` |
| A shift is one flat price. Whole day uses `pricePerNight` times nights | Same service |
| Morning is 08:00–15:00, afternoon 15:00–22:00, night 22:00–08:00 the next morning | `SHIFT_TIMES` in `hotelService.ts` |
| List with `shift` keeps hotels that have some room type with `allowShiftBooking`. It does not require the hotel flag unless the query also sends `allowShiftBooking=true` | `HotelService.getAllHotels` |
| Availability returns `-1` for a null shift price. The room step treats a price of `0` or less as not selectable | `checkRoomAvailabilityForHotel`, `priceForShift` |
| Hotel detail `GET /api/hotels/:id` already returns `allowShiftBooking`, `lastBookingModeUpdateDate`, and each room type’s three shift prices plus `allowShiftBooking` | `getHotelById` |
| `PUT /api/hotel-rooms/roomTypes/:roomTypeId` already writes those room-type fields. The service spreads the body | `updateHotelRoomTypeAdmin` |
| `HotelService.updateBookingMode` enforces the two-month lock and sets `lastBookingModeUpdateDate`. Nothing routes to it | `hotelService.ts` only |
| The hotel profile save must not be used for this flag. `updateHotelInfo` would store `allowShiftBooking` and skip the lock | `PUT /api/hotels/:hotelId` |

The app hotel screen (`service-admin/hotel-info.tsx`) loads that detail and only edits the nightly price. The desk card (`bookingCard.tsx` with `deskView`) shows dates and a total, and does not name the shift. A result card still prints the cheapest nightly price during a shift search.

## Outcome

A hotel admin can turn shift booking on or off for their hotel, within the two-month lock, and can set each room type’s shift permission and the three slot prices. An employee of that hotel can read those settings and can see the shift on each desk booking. A traveler searching a shift sees only hotels that allow it, sees that slot’s price, and can select only a room type that allows shifts and has a price above zero for that slot. Whole-day search and the nightly price stay as they are.

New hotels stay shift-off. A new room type stays shift-off until the admin turns that type on.

## 1. Hotel switch

On the hotel info screen, profile section, admin only.

- One control: allow shift bookings. It shows the current value from `hotel.allowShiftBooking`.
- Save calls a new `PUT /api/hotels/:hotelId/booking-mode` with `{ allowShiftBooking: boolean }`.
- That route is the only backend change. Mount it beside `PUT /:hotelId`, after `checkServiceAdminRole` and `ensureUserAssignedToHotel`, and before `checkMasterAdminRole`. Validator: `hotelId` UUID, `allowShiftBooking` boolean. Controller calls `HotelService.updateBookingMode` and returns `{ status, message, data }`.
- On success, refresh the hotel. On the “already enabled/disabled” or “cannot be changed within 2 months” error, show the server message. Do not compute the next date on the client.
- If `lastBookingModeUpdateDate` is present, show it as the last change. The server remains the authority for whether another change is allowed.
- An employee sees the current value and the last change date, with no control.
- Profile save (`saveProfile`) does not send `allowShiftBooking`.

## 2. Room type slots

On the same screen, room rates, admin only. Each existing room type keeps the nightly price field.

When the admin turns shift booking on for that type, show three inputs: morning, afternoon, night. A slot for sale needs a number greater than zero. An empty slot is sent as `null` and is not for sale. `0` is not a price.

Save one type with the existing `PUT /api/hotel-rooms/roomTypes/:roomTypeId`:

```json
{
  "pricePerNight": 3500,
  "allowShiftBooking": true,
  "morningShiftPrice": 1800,
  "afternoonShiftPrice": null,
  "nightShiftPrice": 2200
}
```

Sending `allowShiftBooking: false` keeps any stored slot prices and stops that type from being shift-bookable. The nightly price is always required and is unchanged by the shift fields.

Add room type uses the same fields. Default the new type to shift-off and send only `hotelId`, `roomType`, `pricePerNight`, and `totalCount` until the admin opts that type in. `POST /api/hotel-rooms/roomTypes` already accepts the shift fields when they are sent.

If the hotel switch is off, the admin may still prepare a type’s slot prices. Show one line that travelers will not see shift stays until the hotel switch is on. Do not block the save.

An employee sees the nightly price, whether the type allows shifts, and any slot price that is set. No inputs.

`updateHotelRoomTypePrice` in `src/services/api/hotels.ts` grows to send the shift fields. Do not add a second endpoint.

## 3. Desk list

On the desk booking card (`deskView` in `bookingCard.tsx`), under the check-in and check-out dates, show the shift in words: Whole day, Morning, Afternoon, or Night. Use the existing `hotelSearch` strings. A missing `shift` is Whole day.

Admin and employee both see it. Opening the stay still shows guest contact, payment method, special requests, and the per-shift rate. Do not add those again to the card.

## 4. Traveler sees the offer

Only these traveler changes. Do not rebuild search, dates, guests, or create.

- When the search shift is not Whole day, `fetchHotels` also sends `allowShiftBooking=true`. Hotels that have not turned the switch on drop out of that search. Whole day does not send it.
- A result card for a shift search shows the lowest slot price among that hotel’s room types that allow shifts and have a price above zero for the selected shift. It does not show `pricePerNight` as if it were the slot price. If no slot is priced, the card does not invent a number.
- On the room step, a type can be selected only when `allowShiftBooking` is true and `priceForShift` is above zero. Other types stay visible as not available for that stay.

## 5. Fix round (review of 2026-10-17)

A full pass over the traveler flow, the hotel admin and employee screens, and the backend found the gaps below. Fix them in this order. The first group can sell a room twice or charge for a stay the hotel cannot deliver.

### 5a. Backend — selling and timing (critical)

1. **A whole-day guest does not block a shift.** In `createBooking`, `checkRoomAvailabilityForHotel`, and the dated branch of `getAllHotels`, the shift conflict only matches bookings whose `checkInDate` equals the shift start exactly. A whole-day booking starts at its own check-in time, often on an earlier day, so it never matches. A room held by a two-night guest shows as free for Morning and can be booked again.
   Fix: for a shift request, a booked room conflicts when it has the **same shift with the same start**, or **any `ALL_DAY` booking whose window overlaps the shift window** (`checkInDate < shiftEnd` and `checkOutDate > shiftStart`). Keep the `ALL_DAY` request rule (any overlap) as it is. Use one shared helper so the three places cannot drift.
2. **Shift times depend on the server clock.** `computeShiftDates` and the copies in `hotelService.ts` call `setHours` on `new Date('YYYY-MM-DD')`. That is only Dhaka time when the process runs with `TZ=Asia/Dhaka`. Nothing in the repo sets that. On a UTC host, Night is stored as 04:00 the next day and Morning as 14:00. Desk dates, refund hours, and the check-out button then land on the wrong day.
   Fix: build shift windows from the Dhaka calendar day with explicit offsets (`${ymd}T08:00:00+06:00`, `T15:00`, `T22:00`, and Night ending at `T08:00` the next day). Use `calendarYmd` from `dhakaCalendar.ts` for the date part. Refund eligibility at line ~1126 should read the stored `checkInDate`, because it already holds the shift start.
3. **The shift search lists hotels that cannot sell that shift.** `getAllHotels` with `shift` only needs some room type to have `allowShiftBooking`. It ignores the hotel switch and the slot price. When `shift` is set, also require `Hotel.allowShiftBooking = true`. Count a room type as bookable only when it allows shifts, has more than 0 rooms free, and has a price above 0 for that shift. This keeps the website and the app the same.
4. **Room-type availability lets the room step offer shift-off types.** In `checkRoomAvailabilityForHotel`, for a shift request:
   - If the hotel switch is off, return `isAvailable: false`, a clear `message`, and `availableRooms: 0` on every type.
   - Return `availableRooms: 0` for any type that has `allowShiftBooking` off or no price above 0 for that shift.
5. **Room-type writes accept any price.** Add optional checks to `updateHotelRoomTypeAdminValidation` and `createHotelRoomTypeValidation` for `morningShiftPrice`, `afternoonShiftPrice`, and `nightShiftPrice`. Each must be `null` or a float greater than 0. `0` is not accepted.

No schema change and no Prisma CLI.

### 5b. App — traveler booking flow

6. **Results crash after switching to Whole day.** Whole day clears checkout to `''`. `hotel-results.tsx` stays mounted and calls `shortRangeLabel(checkIn, '')`, which throws. Guard the subtitle the way `hotel-stay.tsx` does. Do not fetch hotels while `isValidStay` is false; show the pick-dates line instead.
7. **The hotel page ignores the shift.** In `hotel-stay.tsx`:
   - The price bar shows the nightly price with “per night” even for a shift search. Use `minShiftPrice` and the per-shift suffix.
   - For a shift search on a hotel whose `allowShiftBooking` is off, or whose types have no price for that shift, do not open rooms. Show one line saying this hotel only takes whole-day stays, and a button that switches the search to Whole day and opens dates.
8. **Entry points that skip the catalog reset.** `HomeDealsSection` and `TripPlanDetailView` push `hotel-stay` with whatever shift was saved last, which defaults to Night. Call `applyCatalogStay()` before both pushes, as the recommended cards already do.
9. **Room step checks the type but not the hotel.** `hotel-room-types.tsx` already loads the hotel. When the hotel switch is off and the shift is not Whole day, no type is selectable. Clear `selected` when the hotel, shift, or dates change. Clamp each quantity to the new `availableRooms` when availability reloads. Compute the total from the same filtered map that is sent. Ignore a second Confirm tap while one is running, using a ref rather than state.
10. **Guest details can add a shift-off type.** In `booking.tsx`, **Add or change rooms** filters by price only. Use `canSelectRoomForShift`. `changeRoomQty` in `_provider.tsx` must not add a type that fails that check.
11. **Blank guest screen.** `openGuestDetails` pushes `booking` even when `fetchHotelDetail` returned null, and `booking.tsx` returns `null`. Navigate only when the detail loaded.
12. **The traveler never sees why create failed.** `useBookingLogic.submitBooking` always shows “Failed to create booking”. Show `e.response.data.message` when present. That covers “Not enough available rooms”, “does not allow shift-based room bookings”, and a past check-in.
13. **A traveler can edit a shift stay into a broken one.** On `dashboard/[bookingId].tsx`, a PENDING booking can be edited. For a shift booking, the edit form sends the calendar days, which wipes the shift times. The server does not recompute the price or recheck availability when only dates change. For `shift !== 'ALL_DAY'`, hide date edits and allow only special requests.
14. **Room lines on the traveler card say “per night”.** `bookingCard.tsx` room lines always append the nightly suffix. Use the per-shift suffix for a shift booking, matching the details page.
15. **The 4.5+ rating filter.** `Hotel.rating` is an integer and the list controller uses `parseInt`. Remove 4.5+ from `HotelFilterSheet`, or send `5` and label it 5 stars. Do not send 4.5.

### 5c. App — hotel admin and employee

16. **One tap locks the hotel switch for two months.** The switch saves on change. Before calling `updateHotelBookingMode`, show a confirm alert stating that the next change is blocked for two months. Cancel leaves the switch where it was.
17. **Bad slot input silently clears a stored price.** `parseSlot` turns `abc`, `0`, or a negative number into `null`, which deletes the stored price on save. Empty means not for sale. Any other value that is not a number above 0 shows `PRICE_INVALID`-style copy and blocks the save.
18. **Room-type edits look saved when they are not.** Changing the type switch or a slot price does nothing until **Save**. Mark the row as unsaved, and after a successful save reload that type’s flag and slot prices from the response, so `0` or blank does not keep showing.
19. **Shift-on type with no slot price.** If the admin enables shifts on a type and leaves all three slots empty, warn that this type will not appear in shift search. Do not block the save.
20. **The week board shows shift counts for slots the hotel does not sell.** In `service-admin/availability.tsx`, when the hotel switch is off, hide Morning, Afternoon, and Night from the stay selector. With the switch on, the counts in a shift view come from the corrected availability in 5a.4.

## 6. Guest capacity and same-day cutoff

Two gaps remain after section 5. The app treats a Single room as one guest by its name. That number belongs to the hotel. Search also still offers a stay that has no useful time left.

Decisions (2026-10-17):

- Guest limits for existing rooms follow common hotel occupancy, and anyone who can edit a room type can change them.
- The booking stores the guest count.
- Between 00:00 and 05:00 a traveler can still book the night that started at 22:00 the day before.

### 6a. Guests a room type can hold

**Schema.** Two columns, one migration. Do not run Prisma CLI. After the schema edit, stop and ask Shahriar to run `prisma migrate dev --create-only`, add the backfill below to the generated SQL, then `prisma migrate dev` and `prisma generate` from `nodeapp/`.

- `HotelRoomType.maxGuests Int @default(2)`. How many guests one room of that type may hold. It is read as stored. It is never calculated from beds at booking time.
- `HotelRoomBooking.guestCount Int?`. Guests on this booking. Set on every new booking. Old bookings stay `null` and show no guest line.

**Backfill for existing room types.** Usual hotel occupancy by category. Deluxe is a better grade of a double room, not a bigger room.

| Category | `maxGuests` |
| --- | --- |
| Single | 1 |
| Double | 2 |
| Deluxe | 2 |
| Suite | 4 |

```sql
UPDATE "HotelRoomType" SET "maxGuests" = CASE "roomType"
    WHEN 'SINGLE' THEN 1
    WHEN 'DOUBLE' THEN 2
    WHEN 'DELUXE' THEN 2
    WHEN 'SUITE' THEN 4
END;
```

**Who sets and changes it.** The limit is an integer from 1 to 10. It can be changed at any time with no lock. A change applies to new bookings and edits from then on. Existing bookings keep their rooms.

- Hotel `SERVICE_ADMIN` in the app (`service-admin/hotel-info.tsx`):
  - When adding a room type, the limit is filled from the category table above and can be changed before adding.
  - On an existing type, the limit is an input next to the nightly price and is saved with the same Save button. It counts as an unsaved change like the price.
  - An employee sees the number and cannot edit it.
- Master admin and hotel admin on the website, in `HotelRoomTypeForm`, on both create and edit. On create, the limit is prefilled from the category when one is chosen and can be overwritten. The hotel profile form does not create room types, so it does not get this field.
- Seed in `3-comprehensive-hotel-seeder.ts`, on every row of `ROOM_TYPE_CONFIGS`, using the same table.

**Server.**

- On room-type create, `maxGuests` is required, integer 1–10. On update it is optional, integer 1–10.
- Hotel list, hotel detail, and room-type availability return `maxGuests`.

**Traveler rule.** Selected rooms cover the group when the sum of `maxGuests × quantity` is at least the guest count. For two guests:

- One Double (2) covers them.
- Two Singles (1 each) cover them.
- One Single does not.

This rule replaces `loneSingleRoomForGuests`.

- **Results.** The dated hotel list takes `guestCount`. It drops a hotel when the rooms it can sell for that stay hold fewer guests in total than the group.
- **Room step.** Each room card shows how many guests it sleeps. Confirm with too little room opens a modal that names the guest count and how many the chosen rooms hold, and does not continue.
- **Guest details.** Create shows the same modal before sending.
- **Create on the server.** `guestCount` is required, integer 1–6. Create rejects the same shortfall and stores `guestCount`.
- **Website.** `HotelBookingModule` sends its existing `numberOfGuests` as `guestCount`.
- **Edit.** `updateBooking` rechecks capacity with the stored `guestCount` when rooms change. A booking with `null` guest count skips this check.
- **Desk.** The opened stay in the app shows the guest count when it is set.

### 6b. Stays that no longer have time left

One rule for every shift on every date. The clock is Asia/Dhaka, so a server in another time zone gives the same answer.

**A shift can be booked until 3 hours before it ends.** A shift that has already started can still be booked inside that limit, and it costs the full slot price. After the limit it is hidden from choices and search, and create rejects it.

| Stay | Window | Last moment to book |
| --- | --- | --- |
| Morning | 08:00–15:00 | 12:00 the same day |
| Afternoon | 15:00–22:00 | 19:00 the same day |
| Night | 22:00–08:00 | 05:00 the next morning |
| Whole day | from the hotel’s `checkInTime` | the check-in time on the check-in day. A missing or invalid time uses `14:00` |

A whole day is not given the three-hour allowance. The traveler cannot book it once that hotel’s check-in time has passed today.

Examples:

- At 11:00, Morning today can be booked because 4 hours remain.
- At 12:00 it still can, because 3 hours remain. After 12:00 it cannot.
- At 15:00, Morning has ended. Afternoon can be booked until 19:00.
- At 18:00, tonight’s Night can be booked. Its window is 22:00 today to 08:00 tomorrow, so it stays bookable until 05:00 tomorrow.
- A later date has its whole window ahead, so it is never cut off.

**The night that is already running.** At 01:00 the current night started at 22:00 yesterday. It can still be booked until 05:00.

- **Server.** For `NIGHT` only, the past-date check allows yesterday as the check-in date while now is at or before 05:00. Validators and the service use the same helper. Any other past check-in is still rejected.
- **App.** Between 00:00 and 05:00, choosing today with Night asks which night is meant: the one running now (yesterday 22:00 to today 08:00) or tonight (today 22:00 to tomorrow 08:00). The running night is sent with yesterday’s date.

**Where it applies.**

- Dated `getAllHotels`, `checkRoomAvailabilityForHotel`, and `createBooking`. A closed stay returns `isAvailable: false`, `availableRooms: 0`, and a message saying the stay has closed. Create throws that message.
- `updateBooking`, when it changes dates on a whole-day booking. The same whole-day check-in rule applies. Shift bookings already cannot change dates.
- Not the operator week board (`getShiftAvailability`). Staff still see past and running stays.

**App.**

- Shift chips for today disable a shift that is closed and say why. It does not matter whether the date or the shift was picked first.
- Confirming today on the date step for a closed shift opens a modal and keeps the previous date.
- When the saved search reopens:
  - A check-in date before today is cleared. The running night is the one exception while it is still open.
  - If the saved shift has closed for today, the results screen says so and offers Whole day or tomorrow instead of an empty list.
- Whole day can be confirmed for today. Hotels whose check-in has passed are left out of the results. If none remain, the empty screen says today’s check-in time has passed and offers tomorrow.

**Refund.** No change to refund rules. A shift booked after it started is past its start, so traveler cancel gives no refund. The confirm screen does not need extra copy for this.

## Copy

English and Bangla in `src/locales/en.json`, `src/locales/bn.json`, and `src/constants/translationKeys.ts`. Reuse `hotelSearch.wholeDay`, `morning`, `afternoon`, `night`, and `perShift` for labels that already exist.

Section 5 adds: the whole-day-only hotel line and button, the two-month confirm, the invalid slot price message, the unsaved row label, and the no-slot-price warning.

Section 6 adds:

- The guests-per-room label and its validation message.
- A "sleeps N" line on room cards.
- The too-few-guests modal, with `{{count}}` guests and `{{capacity}}` that the chosen rooms hold.
- The shift-closed line and modal.
- The two-night choice shown between 00:00 and 05:00.
- The shift-closed and check-in-passed empty results.
- The guest-count line on the opened stay.

## Leave alone

- Website hotel profile form. Guest capacity is on the room-type form.
- Website booking list. Section 6b changes search and create for every client through the server.
- Destination search (`divisionId` / `locationId` / hotel name).
- Desk buckets in `hotelDesk.ts`. They are right once 5a.2 stores Dhaka shift times.
- Operator week board availability. It does not apply the traveler cutoff.
- Do not run Prisma CLI. Section 6a needs two columns and the backfill; ask before `migrate` and `generate`.

## Files

App:

- `src/app/(tabs)/dashboard/service-admin/hotel-info.tsx`
- `src/services/api/hotels.ts`
- `src/components/ui/bookingCard.tsx`
- `src/app/(tabs)/explore/hotel-results.tsx`
- `src/app/(tabs)/explore/hotel-room-types.tsx`
- `src/utilities/hotelSearch.ts` — a helper for the lowest slot price on a list card
- locale files and `translationKeys.ts`

Backend, sections 1–4 (done):

- `nodeapp/src/routes/hotelRoutes.ts`
- `nodeapp/src/validators/hotelValidators.ts`
- `nodeapp/src/controllers/hotelController.ts`

Section 5:

- Backend: `nodeapp/src/services/hotelRoomBookingService.ts`, `nodeapp/src/services/hotelService.ts`, `nodeapp/src/utilities/dhakaCalendar.ts` (shift window helper), `nodeapp/src/validators/hotelRoomValidators.ts`
- App: `hotel-results.tsx`, `hotel-stay.tsx`, `hotel-room-types.tsx`, `booking.tsx`, `_provider.tsx`, `useBookingLogic.tsx`, `dashboard/[bookingId].tsx`, `bookingCard.tsx`, `HotelFilterSheet.tsx`, `HomeDealsSection.tsx`, `TripPlanDetailView.tsx`, `service-admin/hotel-info.tsx`, `service-admin/availability.tsx`, locale files

Section 6:

- Schema: `nodeapp/prisma/schema.prisma` (`HotelRoomType.maxGuests`, `HotelRoomBooking.guestCount`), plus the backfill in the generated migration. Ask before Prisma CLI.
- Backend: `dhakaCalendar.ts` (bookable-until helper, running-night check), `hotelRoomValidators.ts`, `hotelRoomService.ts`, `hotelBookingValidators.ts`, `hotelBookingController.ts`, `hotelRoomBookingService.ts` (create, update), `hotelService.ts` (list with `guestCount`, availability), `hotelValidators.ts` (list `guestCount` query), seed `3-comprehensive-hotel-seeder.ts`
- Backend scripts that create hotel bookings and must send `guestCount`: `scripts/tests/test-hotel-desk.js`, `test-hotel-operator-access.js`, `test-bilingual-content.js`, `test-trip-plan-segments-checkout.ts`
- App: `hotel-info.tsx`, `hotel-search.tsx` / `hotel-stay.tsx` (shift chips), `hotel-dates.tsx`, `hotel-results.tsx`, `hotel-room-types.tsx`, `booking.tsx`, `_provider.tsx`, `useBookingLogic.tsx`, `HotelSearchContext.tsx` (stale saved search), `services/api/hotels.ts`, `services/api/bookings.ts`, `types/hotels.ts`, `types/hotelSearch.ts`, `hotelSearch.ts`, the stay detail screen, locale files
- Website: `HotelRoomTypeForm.tsx`, `src/validators/hotelRoomValidators.ts`, `src/types/global.d.ts`, `hotelBookingApi.ts`, `HotelBookingModule.tsx` (send `guestCount`)

## Exit

[tests.md](tests.md). `npx tsc --noEmit` from `choloBD-expo` and from `nodeapp`. A hotel with the switch on, one room type opted in, and a night price above zero can be found on a Night search and booked. A hotel with the switch off does not appear on that search and still appears on a Whole day search. A room held by a whole-day guest cannot be booked for any shift inside that stay. A Night booking made on a UTC server is stored as 22:00 Dhaka time. Two guests cannot confirm one room whose `maxGuests` is 1, and the saved booking has `guestCount` 2 when they book a Double. After the migration, an existing Double has `maxGuests` 2. A morning search today at 12:00 Dhaka still lists hotels. After 12:00 it returns none. Tonight’s Night can be booked at 18:00. The running night can be booked at 01:00. A whole-day search for today omits a hotel whose check-in time has passed.
