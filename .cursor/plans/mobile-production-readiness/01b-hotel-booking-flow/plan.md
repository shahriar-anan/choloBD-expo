# 01b — Hotel search and room selection

**Folder:** `01b-hotel-booking-flow` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Done. Checked on device 2026-09-28.

**Depends on:** increment 01. Package cancel and refund stay in `02-cancel-refund/` and are not part of this increment.

**Reference:** ShareTrip screen order S1–S13. Visual style is `src/constants/theme.ts` and existing theme classes. No ShareTrip branding, photos, or ad artwork.

**Approved cuts (2026-09-28):** no children, no guest maximum, no adults count, no map, no city-wide facet counts, no promo slot.

**Destination:** typing lists divisions and districts first (4), then hotels (3), tour spots (2), and activity spots (2). Locations come from `GET /api/locations/search` (exact name first, division before district). Hotels and spots come from `GET /api/search/type`. Tour packages are not listed.

Tapping a location only stores it. **Search Hotel** then shows hotel cards for that place. Detail opens from a card. That list is not a city-wide facet. Facet counts stay omitted.

A division or district uses `divisionId` (that place plus direct children). Any other location uses `locationId`.

```
S1 Hotel search home
 ├─ Destination ─► S2/S3 divisions and districts (4), hotels (3), tour spots (2), activity spots (2)
 ├─ Nights ─► S4 date range
 ├─ Rooms ─► S5 room count
 └─ Search Hotel ─► S6 hotel cards for the chosen location
                     ├─ Filter sheet on the fetched rows (no facet counts)
                     └─ hotel card ─► S9–S11 detail (location text, no map)
                                        └─ See All Rooms ─► S12
                                                             └─ room ─► S13
                                                                          └─ Confirm ─► existing guest-details screen
```

## What the backend allows

| Step | Route | Use |
| --- | --- | --- |
| Typed destination | `GET /api/locations/search?name=`, then `GET /api/search/type` for hotels, tour spots, and activity spots | Order: division and district (4), hotels (3), tour spots (2), activity spots (2). An exact place name such as Dhaka ranks first. |
| Hotel list | `GET /api/hotels` | `divisionId` for a division or district, otherwise `locationId`. Also `name`, rating, dates, `page`, `limit`. |
| Hotel detail | `GET /api/hotels/:id` | Images, reviews, room types, bed counts, nightly prices. No `address` relation. Show location name, city, and country. |
| Create booking | `POST /api/bookings/hotel-rooms` | Dates, `selectedRoomsMap`, guest name/email/phone. Quantity = room count. No adults, children, or ages. |

Do not call unmounted `searchAllFields`. Do not add guides to this picker (`/search/type?guide=true` is a different endpoint). Do not show strike price, distance, perks, meal plans, cancellation deadlines, pets, bathroom, area, payment logos, or a map.

## SearchParams

Persisted locally. Shared by S1, S5, S6, S9, and S12.

```ts
HotelSearchDestination {
  kind: 'hotel' | 'place'
  id: string
  name: string
  subtitle: string
  locationId?: string
}
HotelSearchParams {
  destination: HotelSearchDestination | null
  checkIn: string
  checkOut: string
  roomCount: number
}
```

Defaults: no destination, check-in today, 2 nights, room count 1. Minimum 1 night, maximum 30, check-out after check-in, past dates disabled. Room count minimum 1. No guest cap.

**Search Hotel:** a chosen location opens S6. A division or district sends `divisionId`. A chosen hotel sends that hotel’s `locationId` and `name`. Anything else sends `locationId`. Hotel detail is opened from a card on that list.

**Checked behavior (2026-09-28):**

- The tab bar stays on the search home. It is hidden on destination, dates, room count, results, hotel detail, rooms, and guest details.
- Hotel detail shows facilities as chips and a light price bar with **See all rooms**.
- Guest details leads with the chosen stay and the guest form. **Add or change rooms** is closed until opened, then the list scrolls into view. The bottom row is the total and **Create Booking**. There is no Clear Search control.
- An expired access token is refreshed before the booking list is requested. A recoverable 401 is not logged as a hard failure.

## Filters

Applied to the **fetched page**, not a city-wide total. “Show N Hotels” equals the cards after the filter. No parenthetical facet counts.

- Sort: highest `rating` (then review count when present), cheapest `pricePerNight`, or rating descending.
- Price: optional 5 buckets from min–max nightly price on that set.
- Property name: filter those rows by name (the list API also accepts `name` when the query is sent).
- Stars: `rating` in the selected set (3, 4, 5).
- Amenities: hotel must include each selected string from `amenities` on that set.
- Omit distance, meal plan, and cancellation sections.

## Confirm

S13 Confirm opens the existing guest-details booking screen with `hotelId`, one `roomTypeId`, `quantity = roomCount`, and the dates. Payment and cancel stay out of this increment.

## Functional then UI

**Functional:** types, pure helpers (nights, price format, buckets, bed line, list filter), combined-search client, hotel list query params. `npx tsc --noEmit` before screens.

**UI:** S1–S13 as above. Strings via `TRANSLATION_KEYS` (`en` and `bn`). Dark mode. Loading, empty, and error on data screens. S12 warning names CholoBD. Room spec line shows bed counts only when greater than zero.

## Acceptance

- S1 → S13 in this order. Hotel search result opens detail. Spot result opens the hotel list for that location.
- Dates and room count show on the subtitles that use them.
- “Show N Hotels” matches the filtered cards. No city-wide counts.
- Date range blocks the past and highlights across months.
- Room stepper starts at 1 and has no guest maximum and no child row.
- No map, no promo, no ShareTrip assets, no invented fields.
- Confirm reaches the existing guest form and does not call refund APIs.

## Preserved for later

- Increment 02 cancel/refund.
- Increments 03–08.
- Street `Address` text until hotel detail includes that relation.
- Guides in destination search.
- Combined search matching a city name for hotels (today it matches hotel name only).
