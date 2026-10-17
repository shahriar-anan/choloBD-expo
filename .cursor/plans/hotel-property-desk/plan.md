# Hotel property desk — mobile

**Folder:** `hotel-property-desk` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Implemented in the Expo hotel property screens.** Device checks in `tests.md` are still open.

**Target:** the Expo hotel property screen opened from Dashboard → My hotel, and from `service-admin/index` when the admin has one hotel. File today: `src/app/(tabs)/dashboard/service-admin/hotel-info.tsx`.

This is a layout overhaul of that screen. It does not change shift rules, guest capacity, booking create, or the website. No new API routes. No Prisma CLI.

## What the screenshots show

Grand Palace is one scroll with four pills: Overview, Profile, Rooms, Reviews. Every pill is a stack of the same dark cards. The admin cannot tell a summary from an editor, and cannot read several of the values.

| What is on screen | What is wrong |
| --- | --- |
| Profile lines for amenities, nearby tours, nearby activities, and Bangla | The start of the text is cut off. "Wifi" shows as "i", "Lalbagh" as "albagh", "Amusement" as "usement". These are single-line inputs, so a long value scrolls and the beginning leaves the box. |
| Check-in in the middle of Profile, check-out after the nearby lists | Stay times are one decision and are split across the form. |
| Allow shift bookings at the bottom of Profile | A two-month lock sits in a contact form. The only on-screen hint is "Last changed", after the switch is already on. |
| Four room types, each with guests, price, Save, and a shift switch | Save is beside the nightly price, but it also saves guests and shift prices. With shifts open, one type becomes guests + price + three shift blocks. The type name scrolls off, so a price has no heading. |
| Add room type between the rate forms and Rooms (9) | Selling a type and cleaning a room are different jobs in one scroll. |
| Every room shows Ready to sell, Needs cleaning, Out of service | Nine copies of the same three buttons. Assign cleaning is a small text link. |
| Reviews as name · 4.4 / 5 and a full paragraph | No stars, no card, no shortened text. |
| Overview rating and type tiles, then green and blue stat boxes | Hardcoded green/blue, and the type tile can read "N/A". Room rows print `₹` instead of `৳`. Empty rooms say "No rooms available" in English only. `className="grid"` does nothing in React Native. |

## How reference apps split this

A hotel desk does not edit the property, the rate plan, and housekeeping in one form.

- **Airbnb host listing editor.** A list of sections. Tap one, edit it, save, come back. Pricing is never four open forms.
- **Booking.com extranet and Pulse.** Property contact and check-in/out stay together. Rooms and rates are a list: name, occupancy, price. Reviews are a score, stars, and a short quote.
- **Little Hotelier and Cloudbeds.** Housekeeping is a room list with one status. Tapping the room changes the status. Rates are not mixed into that list.
- **iOS grouped settings.** Inset cards, a label, the current value on the right, a chevron. One primary button on an editor.

CholoBD already has the data for that split. The screen is what mixes it.

## Outcome

My hotel opens a property home. From there the admin opens one job at a time: property text, stay times and the shift switch, one room type, one physical room, or reviews. An employee sees the same screens and can still change a room's status. They cannot edit rates, guests, shifts, or the profile.

The shift Add and cross stay. They move onto the room-type editor, one type at a time. Profile save still does not send `allowShiftBooking`.

## Parent structure

`hotel-info.tsx` becomes a folder. Existing links keep the path `/(tabs)/dashboard/service-admin/hotel-info?hotelId=`.

```
src/app/(tabs)/dashboard/service-admin/hotel-info/
  _layout.tsx                 loads the hotel, rooms, and reviews once
  index.tsx                   property home
  property.tsx                contact and listing text
  stay.tsx                    check-in, check-out, shift switch
  rates/index.tsx             room-type list
  rates/[roomTypeId].tsx      one type editor, including "new"
  rooms/index.tsx             housekeeping list
  reviews.tsx
src/components/hotelDesk/     rows, sheets, chips, editor chrome
```

`_layout` owns the fetch that `hotel-info.tsx` does today. Child screens read that state. Do not fetch the hotel again on every tab.

Dashboard → My hotel and the single-hotel redirect in `service-admin/index.tsx` still land on the property home.

The pill bar Overview / Profile / Rooms / Reviews goes away. Four pills were trying to be both a menu and an editor. The home is the menu.

## 1. Property home

The first screen after My hotel.

```
Grand Palace - Dhaka 1
Dhaka

4.6 average · 12 reviews          >
9 rooms · 9 ready to sell

Property details                  >
Stay times                        14:00–12:00  >
Shift booking                     On           >
Room rates                        4 types      >
Rooms                             9            >
```

- The review row opens `reviews`.
- The room count row opens `rooms`.
- Stay times and shift booking open `stay`. They are separate rows because one is a clock and the other is a locked business switch.
- Room rates opens the type list.
- Property details opens contact and listing text.
- No stat tiles in raw green and blue. Use the theme surface, one number, one label.
- Description, if present, is a short block under the name, four lines, then the section list. It is not a second page.

## 2. Property details

One editor. Save once, at the bottom. Leaving with unsaved edits asks before discarding.

**Contact.** Phone, email, website. Each field is one line, full width, tall enough to tap.

**Listing text.** Four groups, in this order: Amenities, Policies, Nearby tours, Nearby activities. Each group is English, then Bangla. The Bangla label names the group ("Amenities in Bangla"), not "Bangla (optional)".

Each value is a wrapping chip list, because the API stores string arrays and the current comma box is what clips:

- Saved items are chips. A cross removes that chip from the draft.
- Add opens a single-line field and a confirm. Empty confirm does nothing.
- The chips wrap. Nothing scrolls sideways.

Overview facilities that come from `hotelCategories` stay read-only on the property home. They are a different field from `amenities[]`. Do not write category chips from this editor. The listing-text section is the array `saveProfile` already sends.

## 3. Stay times and shift booking

One screen, two cards.

**Times.** Check-in and check-out side by side. Placeholder `HH:MM`. Helper text: 24-hour time. Both save with the same profile request as section 2, or with their own button on this screen if the admin has not opened property details. Either way it is `PUT /api/hotels/:hotelId` and it still must not send `allowShiftBooking`.

**Shift booking.** The switch, one sentence of what travelers will see, and the last-change date. If the server will reject a change, the card says so before the admin flips the switch: the next change is locked for two months, and the date already returned by the API. The confirm dialog stays. On the server error, show the server message. An employee sees On or Off and the date, with no switch.

## 4. Room rates

A list, not four open forms.

```
Single                         >
Sleeps 1 · ৳6,500 · Morning, Night

Double                         >
Sleeps 2 · ৳10,000 · Shifts off

Add a room type
```

- The shift names are only the slots that have a price and whose type switch is on. None is "Shifts off".
- The hotel switch off shows one line at the top: travelers will not see shift stays until shift booking is on. The list still opens.
- Add a room type pushes the editor with no id. The category chips (Single, Double, Deluxe, Suite) live on that editor, not on the list. Choosing a category prefills guests: 1, 2, 2, 4. The admin can change the number.
- ৳, never ₹.

## 5. Room-type editor

Pushed screen. The type name is the title and stays in the app bar.

Order:

1. Guests per room. Numeric. Helper: 1 to 10.
2. Price per night. The field shows ৳. This is the whole-day price.
3. Allow shift booking for this type. A switch with one line under it.
4. When the switch is on, three rows:

```
Morning (8 AM – 3 PM)          Add
Afternoon (3 PM – 10 PM)       ৳2,500    ×
Night (10 PM – 8 AM)           Add
```

Add reveals the price field under that row. The cross clears that draft and collapses the row. A shift with a stored price opens expanded. A type with the switch on and no price still shows the warning that the type will not appear in a shift search.

5. One Save at the bottom. It sends nightly price, guests, the type flag, and the three slot prices together, as today. Closed slots send `null`. An open slot with an empty or invalid price blocks Save and says why. `0` is not a price.

Unsaved changes: the app bar title stays, and Back asks to discard or keep editing. Do not rely on a one-line "Unsaved changes" under a heading that has scrolled away.

An employee opens this screen read-only: guests, nightly price, On or Off, and any slot price. No Add, no cross, no Save.

## 6. Rooms

Housekeeping only. Beds and the nightly price are not repeated on every room. Those belong to the room type, which is already on the rate list.

```
Room 101          Single       Ready to sell
Room 102          Single       Needs cleaning
```

Tap a row. A sheet offers:

- Ready to sell
- Needs cleaning
- Out of service
- Assign cleaning (admin)

The current status is marked. Choosing a status calls the same room-status update as today and closes the sheet. Assign cleaning still opens the tasks screen with `roomId`.

Employees can change status, as they can today. They do not see Assign cleaning.

The pill on the row uses theme success, warning, and a muted style for out of service. Not `green-100` / `yellow-100`.

## 7. Reviews

Reached from the property home, not from a fourth pill.

Each review is a card:

- Name
- Star icons for the numeric rating, and the number
- Date
- Three lines of the text, then Read more on that card

Empty: one sentence, both languages. Failed load: one sentence and the list stays empty. Do not dump the error object.

## Visual system

Use the theme tokens already on the hotel search screens. Do not add a new palette.

| Piece | Rule |
| --- | --- |
| Page | `bg-background`. Cards `bg-surface` (white / `surface-dark`), radius 16, padding 16. |
| Space | 16 between cards, 8 between a label and its control. |
| Type | Screen title 22 semibold. Card title 17 semibold. Body 15. Labels 13 muted. |
| Tap targets | Inputs and rows at least 48 tall. |
| Primary button | One full-width primary button per editor. Height 48. |
| Lists | A row shows the value and a chevron. The editor is the next screen. |
| Money | `৳` and the existing money formatter. |
| Color | Status and warnings from theme success, warning, and error. No Tailwind green/blue fills. |
| Dark | Same layout. Do not invent a second design. |

English and Bangla for every new string, in `en.json` and `bn.json`.

## Files

| File | Change |
| --- | --- |
| `hotel-info.tsx` | Remove after its folder replacement lands. Do not leave two screens. |
| `hotel-info/_layout.tsx` and the screens in the tree above | New |
| `src/components/hotelDesk/` | Rows, shift rows, chip editor, review card, status sheet |
| `src/locales/en.json`, `bn.json`, `translationKeys.ts` | New labels only |
| `ServiceAdminDashboard.tsx`, `service-admin/index.tsx` | Entry paths stay valid |

Do not edit traveler search, booking create, or the backend in this plan.

## Order

1. Shell and property home. Old tabs still reachable until each section has moved.
2. Property details and stay screen, including the chip editor and the shift card.
3. Rate list and room-type editor. Remove the inline rate forms.
4. Room list and status sheet. Remove the per-room button row.
5. Reviews screen. Remove the Reviews pill.
6. Delete the leftover blocks in the old file, then the old file.

Each step must leave My hotel openable. Do not ship the folder until step 1 renders the hotel name from the loaded record.
