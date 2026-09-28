# Rules — increment 01b (hotel search flow)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Scope

Traveler hotel search, list, detail, and room choice (S1–S13). Confirm opens the existing guest-details screen.

Out of this increment:

- Cancel/refund (increment 02), package payment, and later verticals.
- Children, child ages, adults, and any guest maximum.
- Maps, promo banners, and ad creatives.
- City-wide facet counts.
- Tour packages in the destination list (drop `tourPackages` from combined search).
- Staff hotel admin.

## Data

- Destination typing lists divisions and districts first (4, from `/api/locations/search`), then hotels (3), tour spots (2), and activity spots (2) from `/api/search/type`. Exact place names rank first. Do not list tour packages.
- Choosing a location and pressing Search Hotel loads hotel cards for that place. Detail opens from a card.
- Hotel list filters are only query params `GET /api/hotels` already accepts. Extra sort, price, star, and amenity filters run on the fetched rows.
- “Show N Hotels” is the length of that filtered list.
- Do not render missing fields as `0` or as ShareTrip perks.
- Create booking sends `selectedRoomsMap` quantity = room count, plus guest contact the existing form already collects. Do not send ages or guest counts.
- Location line is location name, city, and country. Hotel detail does not include street address.
- The tab bar stays on the hotel search home. Hide it on every later screen in this flow.
- Guest details shows the chosen stay and guest fields first. Extra rooms open from **Add or change rooms**. Do not offer Clear Search on that screen.

## Visual

Theme tokens and translation keys (`en`, `bn`). Room-list warning says CholoBD. Facilities are chips. The hotel detail price row and the guest-details total row are a single compact bar.
