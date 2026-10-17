# Rules — hotel property desk (mobile)

## Scope

The Expo property screen for one hotel: home, property text, stay times, shift switch, room rates, housekeeping, and reviews.

In: `src/app/(tabs)/dashboard/service-admin/hotel-info.tsx` and the `hotel-info/` folder that replaces it, plus `src/components/hotelDesk/` and the new copy keys.

Out: traveler search and booking, the website, new API routes, Prisma, and the Dashboard tab list from `ui-overhaul/hotel-admin`. My hotel still opens this screen. Do not restyle earnings, availability, complaints, or the QR scanner here.

## Who

| Action | Hotel `SERVICE_ADMIN` of this hotel | Hotel `EMPLOYEE` of this hotel |
| --- | --- | --- |
| Edit contact, listing text, check-in, check-out | Yes | Read only |
| Turn the hotel shift switch | Yes, with confirm, through the booking-mode route | Read only |
| Edit a room type's nightly price, guests, shift switch, and slot prices | Yes | Read only |
| Add a room type | Yes | No |
| Change a physical room's status | Yes | Yes |
| Assign cleaning | Yes | No |
| Read reviews | Yes | Yes |

Another hotel's admin never reaches this hotel's editor. The existing hotel assignment check stays.

## Data rules that this layout must not break

These come from `hotel-shift-controls`. The new screens call the same functions.

- Hotel shift switch saves only with `PUT /api/hotels/:hotelId/booking-mode`.
- Profile save (`PUT /api/hotels/:hotelId`) does not send `allowShiftBooking`.
- A shift change asks first and says the next change is locked for two months. A server rejection is shown as the server wrote it. The client does not invent the next date.
- Turning the hotel switch off does not delete slot prices.
- One room-type save sends `pricePerNight`, `maxGuests`, `allowShiftBooking`, and the three slot prices together on `PUT /api/hotel-rooms/roomTypes/:roomTypeId`.
- A slot is for sale only when the type switch is on and that slot's price is a number greater than 0.
- Add opens a slot. The cross clears it. A cleared slot is sent as `null` on Save. `0`, a negative number, or text blocks Save and is not stored.
- A type can be saved with the shift switch on and no slot price. The warning still shows.
- A new room type starts shift-off. Guests prefill Single 1, Double 2, Deluxe 2, Suite 4, and can be changed to an integer from 1 to 10.
- `maxGuests` is not calculated from beds.
- Preparing slot prices while the hotel switch is off is allowed.
- Room status still uses the current room update. Assign cleaning still opens tasks with `roomId`.

## Layout rules

- The property home is a menu of rows. Do not put editors on the home.
- One editor is one screen or one sheet, with one primary Save.
- Back from a dirty editor asks before discarding.
- Listing text is chips that wrap. No single-line input for a comma-separated list.
- Bangla fields are labeled with the group they belong to.
- `hotelCategories` on the home are read-only. Do not write them from the amenities chip editor.
- Housekeeping rows do not repeat bed counts or the nightly price.
- Money on this screen is `৳`.
- Colors come from the app theme. No Tailwind `green-*` or `blue-*` fills, and no hardcoded English empty state.
- Copy exists in `en.json` and `bn.json` before a screen is called done.
- `npx tsc --noEmit` in `choloBD-expo` passes for these files. Do not fix unrelated errors.

## Parent routes

- `hotel-info.tsx` is replaced by the `hotel-info/` folder. Do not keep both.
- `?hotelId=` remains the way in.
- Dashboard → My hotel and the one-hotel redirect in `service-admin/index.tsx` open the property home.
