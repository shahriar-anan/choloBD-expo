# Rules — increment 10 (home feed under the hero)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Scope

Everything on `src/app/(tabs)/index.tsx` below `QuickActionGrid`.

Out of this increment:

- `HomeHeader`, `HeroBackground`, `QuickActionGrid`. No wallet balance, membership, avatar, or greeting changes. Those stay as increment 09 and dashboard 03b left them.
- `SearchSection` and `GET /api/search/combined`. Increment 08 mounts search.
- Guide cards and `GET /api/guides`. Increment 05.
- Activity booking, payment, and QR. The new screen is a preview only.
- Flight, train, visa, eSIM, shop, airport transfer, gift card, events, and any “+ more” launcher.
- A floating chat or voice button.
- `NearbyLocationsSection` and its hardcoded hotels. Do not mount it.
- `FeaturesGrid`, `QuickBookingWidget`, `HeroSection`, `TransportTypeSelector`. Leave them unmounted.
- Backend schema, new routes, and Prisma CLI.

## Live data

- Popular places are the five districts in `HOME_DISTRICTS`, with stock photos. They are not grouped from live tour-spot images.
- Holidays are catalog packages (`GET /api/tour-builder` already returns `kind=CATALOG` only) with `isActive=true` and `isPopular=true`.
- Stays use `GET /api/hotels/popular`. Starting price is the lowest `roomTypes.pricePerNight` that is greater than zero.
- Activities use `GET /api/activity-spots/popular`. Show `entryCost` as the price.
- Community uses active posts only (`GET /api/community/posts`).
- Empty live lists hide that section. The district row stays. Do not keep a placeholder card of fake hotels.
- Seeded rows follow the server’s demo-data filter. Do not add a client-side `isSeeded` query.

## Mocks

- Promo cards are a local constant plus locale strings. They are not an API and they are not a coupon.
- A promo may show a headline, a photo, and a pill that opens a real route (dashboard, hotel search, community, transport search, trip planner).
- Do not show a percent off, a crossed-out price, “Claim”, a coupon code, or a bank or card brand. Checkout prices are unchanged.
- Do not use ShareTrip, GoZayaan, Trip.com, oneworld, or any bank logo or name.
- The web homepage’s hardcoded bus/train/air ticket list is not a source for this page.

## Navigation

| Tap | Destination |
| --- | --- |
| Popular place | `/(tabs)/explore/tour-spots-list` with that `locationId` |
| Popular places See all | `/(tabs)/explore/tour-spots-list?fromHome=true` |
| Package card or Holidays See all | Existing package detail, or `/(tabs)/explore/tour-list` for See all |
| Hotel card | `/(tabs)/explore/hotel-stay?hotelId=` |
| Stays See all | `/(tabs)/explore/hotel-search?fromHome=true` |
| Activity card | `/(tabs)/explore/activity-preview` with the spot id. No book control. |
| Activities See all | Same preview is not a list. See all opens the first screen that already lists activities if one exists; otherwise hide See all on the Activities chip until increment 04. |
| Community card | `/(tabs)/community/[postId]` |
| Community See all | `/(tabs)/community` |
| Itinerary trailer | `/(tabs)/trip-planner` |

Do not label a control Coming Soon.

## Visual

- Theme tokens from `src/constants/theme.ts`. Page background stays `background`.
- Catalog cards are mostly the photo. Name, price, and rating sit on the image. No tall caption block under the photo.
- The promo carousel is the only horizontal scroller. Places, holidays, deals, and posts scroll with the page.
- Strings go through `TRANSLATION_KEYS` in English and Bengali, including promo headlines and “Price starts from”.
- Duration uses the package `duration` integer and a localized “days” label. Do not invent a day-by-day title the package does not have.
