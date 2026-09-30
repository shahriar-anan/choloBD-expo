# 10 — Home feed under the hero

**Folder:** `10-home-feed` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** UI in place. Device cases in tests.md are not run yet.

**Depends on:** increment 09. The photo, greeting, and four-tile launcher stay as 09 left them. This increment only changes what scrolls underneath.

**Does not wait on:** 04 (activity booking), 05 (guides), 07 (trip checkout), or 08 (search). Live rows use public catalog reads that already exist. Activity cards open a read-only preview; booking stays in 04. Combined search stays in 08.

## What the reference apps do under the launcher

Sources: ShareTrip, GoZayaan, and Trip.com home screens (the six images attached with this request). Hero, greeting, membership badge, coin balance, and the service icon grid are out of scope. Increment 09 already fixed the photo and the four tiles, and it keeps wallet and membership on the dashboard.

| Pattern | ShareTrip | GoZayaan | Trip.com | Decision for CholoBD |
| --- | --- | --- | --- | --- |
| Wide promo under the launcher | ST Pay card, then a fare ad with Book now | “How to book” clip, then a film banner | Coupon strip, then two sale cards (50% off, $99) | One horizontal promo carousel. Static. Replaces the two full-bleed banners. |
| Destination row | “Holiday in Popular Cities” — photo, city name, See all | — | City chips under search (New York, Shanghai, …) | Live row from popular tour spots, grouped by location. |
| Large holiday card | Duration pill, photo, city, title, “Price starts from” | — | Itinerary cards (Chicago 3-day, Bali 5D4N) | Restyle popular catalog packages into that card. |
| Deals with chips | — | Hot Deals: Trending, Hotel, Flight, Others, plus bank cards (67% / 7%) | “New user discounts”, Claim all, 10% off hotels | Chips for products we sell. Prices are real starting prices. Percent-off and bank brands are not shown. |
| Inspiration / community | — | — | Mixed feed: promos, articles, “Create itinerary” | A short row of live community posts, plus one card into the trip planner. |
| Search field | Not on the first screen | Not on the first screen | Destination field under the icons | Leave it for increment 08. Do not mount `SearchSection` here. |
| Extra products | Flight, visa, eSIM, shop, airport transfer, “+3 more” | Flight, visa | Flights, trains, flight+hotel, vacation rentals, events, Ask AI | Off this page. The backend does not sell them. |
| Header chrome | Name, Silver, coins | Menu on the photo | Silver, coins | Stays on the dashboard (03b). Do not add it to `HomeHeader`. |
| Chat / Ask AI bubble | Blue chat button | — | “Ask AI or hold to speak” | No chat product and no assistant. Do not add a floating button. |

The web homepage (`NextJS-choloBD-frontend` `HomepageContent`) already lists popular hotels, tours, activities, and guides from the API. Its transport strip is hardcoded and includes train and air. Do not copy that strip. Mobile transport stays the launcher tile from increment 06.

## What is on the home screen today

`src/app/(tabs)/index.tsx`, under the launcher:

1. Explore BD banner (`ExploreBDBanner`, 165px).
2. Community banner (same component, second photo).
3. `TourPackagesSection` — popular active packages, icon-colored cards, no photo, no price, no duration on the card face.
4. `SuggestedToursSection` — popular tour spots as photo cards.

`NearbyLocationsSection` is fake hotels (“The Grand Palace Hotel”) and is not mounted. Leave it unmounted. `FeaturesGrid`, `QuickBookingWidget`, `HeroSection`, `TransportTypeSelector`, and `SearchSection` stay unmounted.

## What the backend can fill

Public reads. No new backend route.

| Home block | Endpoint | Fields to show | Tap opens |
| --- | --- | --- | --- |
| Popular places | `GET /api/tour-spots/popular?limit=24` (or `GET /api/tour-spots?isPopular=true`) | Group by `location.id`. Cover = first spot image. Label = location name. | Tour-spots list filtered by that `locationId` |
| Featured holidays | `GET /api/tour-builder?isActive=true&isPopular=true` (catalog only; the service already forces `kind=CATALOG`) | `images[0]`, `duration` (nights/days), `location.name`, `packageName`, `totalBudget` | `/tour-package-detail?id=` |
| Hot deals — Stays | `GET /api/hotels/popular?limit=8` | Photo, name, `location.name`, `rating`, lowest `roomTypes.pricePerNight` | `/(tabs)/explore/hotel-stay?hotelId=` |
| Hot deals — Holidays | Same package list as above, not a second fetch | Same package fields | Same package detail |
| Hot deals — Activities | `GET /api/activity-spots/popular?limit=8` | Photo, name, location, `rating`, `entryCost` | New read-only preview in this increment. Book stays increment 04. |
| From travelers | `GET /api/community/posts?page=1&limit=6` | First photo, caption, `wowCount` | `/(tabs)/community/[postId]` |

`GET /api/guides` is public (`firstName`, `lastName`, `rating`, `pricePerDay`, `location`, images). There is no traveler guide screen until increment 05. Do not put guides on this page.

Locations have no photo and no `isPopular` flag. City covers come from popular tour spots, not from `GET /api/locations`.

There is no coupon, campaign, bank-offer, or promo model. `SiteConfig` only toggles seeded rows. Promo cards are local constants.

Hotels have no discount, strike price, or “from city center” distance. Increment 01b already keeps those off hotel search. Same rule here: show `pricePerNight` as “from”, never a crossed-out price.

## Screen order

Under the existing launcher, top to bottom:

1. **Promo carousel** — the only sideways swipe. Four photo cards, peek of the next card, paging dots. Replaces both `ExploreBDBanner` mounts.
2. **Popular places** — a mosaic in the page scroll: Cox's Bazar full width, then Rangamati and Bandarban, then Sylhet and Khulna.
3. **Featured holidays** — one full-width cover, then up to three rows (photo, name, place, price).
4. **Hot deals** — title, See all, chips **Stays / Holidays / Activities** in one row. The selected chip is a two-column grid, up to four cards.
5. **From travelers** — up to four posts in a two-column grid, then a full-width “Build your itinerary” card that opens `/(tabs)/trip-planner`.

Hide a live section when its list is empty. The district row stays. Do not render the current tall “No packages” / “No spots” blocks. A failed request shows one line and a retry, not a full-height error.

Section titles are one line. Drop the paragraph under `home.tourPackages` and `home.suggestedTours` on this page. See all sits on the right in the primary color, the way ShareTrip places SEE ALL.

## Promo cards (the mock)

File: `src/constants/homePromos.ts`. Four photo cards. English and Bengali strings live in the locale files; the constant holds ids, image URLs, and routes.

| Card | Looks like | Route |
| --- | --- | --- |
| Wallet | Photo, headline about paying with wallet coins, pill button. | `/(tabs)/dashboard` (03b already shows the coin balance) |
| Stays | Photo of a hotel, headline, pill button. The fare-ad slot, without a fake discount. | `/(tabs)/explore/hotel-search?fromHome=true` |
| QR | Photo of a check-in code, headline, pill button. | `/(tabs)/dashboard` |
| Community | Photo, headline, pill button. Keeps the entry the second banner has today. | `/(tabs)/community` |

Images are landscape photos of places in Bangladesh (Unsplash URLs already used in the app, or the same style). No ShareTrip, GoZayaan, Trip.com, oneworld, City Bank, AMEX, or Visa marks. No “67%”, “10% off”, “Claim all”, coupon code, or strike price. The visual is the card shape (bold headline, photo, pill), not a discount the checkout will not honor.

A fourth static card is allowed only if it links to `/(tabs)/explore/transport-search?fromHome=true` with bus copy. Do not mention flights or trains.

## Functional

No backend change.

- `src/services/api/hotels.ts` — `fetchPopularHotels(limit)` → `GET /api/hotels/popular`. Unwrap `response.data.data`. Map the lowest positive `roomTypes.pricePerNight` to `startingPrice`. Map the first image URL.
- `src/services/api/activitySpots.ts` — `getPopularActivitySpots(limit)` → `GET /api/activity-spots/popular`. The existing `getActivitySpots` requires a `locationId`; do not reuse it for this row.
- Popular places: five static districts in `HOME_DISTRICTS` (Cox's Bazar, Rangamati, Bandarban, Sylhet, Khulna) with stock photos. A tap looks up `GET /api/locations` by name and opens the tour-spots list with that `locationId` when the name matches.
- Packages: keep `useFetchTourPackages({ isActive: true, isPopular: true })`. Confirm the client sends those query params (it already does via `getTourPlans`).
- Community: `useFetchCommunityPosts(1, 6)` is enough. Do not add a new community client.
- `src/types/` only if the popular-hotel and popular-activity shapes are not already typed. Do not invent discount fields.

`tour-spots-list` today reads `fromHome` only. Accept an optional `locationId` and pass it to `getTourSpots`. That is the See all / city tap for Popular places. No other explore-screen changes.

### Exit

`npx tsc --noEmit` from `choloBD-expo`. Agent checks in [tests.md](tests.md). No UI files before that.

## UI

Files:

- `src/app/(tabs)/index.tsx` — order above. Remove both `ExploreBDBanner` mounts. Do not touch `HomeHeader`, `HeroBackground`, or `QuickActionGrid`.
- New: `src/components/homepage/HomePromoCarousel.tsx`
- New: `src/components/homepage/PopularPlacesSection.tsx` and a small cover card
- `src/components/homepage/TourPackagesSection.tsx` and `TourPackageCard.tsx` — photo card: duration pill (“3 days” from `duration`), location, name, “Price starts from” + BDT `totalBudget`. Width about 280. Radius 16. Theme elevation.
- New: `src/components/homepage/HomeDealsSection.tsx` — chips and the three card variants
- New: `src/components/homepage/HomeCommunityRow.tsx`
- New: `src/app/(tabs)/explore/activity-preview.tsx` — photo, name, location, rating, entry cost. No book, pay, or date control.
- `src/app/(tabs)/explore/tour-spots-list.tsx` — optional `locationId`
- `src/constants/homePromos.ts`
- `src/constants/translationKeys.ts`, `src/locales/en.json`, `src/locales/bn.json`
- `src/components/homepage/index.ts` — export the new sections

Money: prefix `BDT` and a grouped integer (`BDT 14,500`). Hide the price line when the number is missing or not greater than zero.

Chips remember the last selection only for the current visit. Default chip is Stays.

### Exit

Device cases in [tests.md](tests.md). A person runs them. Agents do not start Expo.

## Later, not this increment

- Guide row, after increment 05 has a traveler list.
- Home search field, increment 08 (`SearchSection`). Place it above the promo carousel when that increment lands.
- Activity book / pay / QR, increment 04. The preview screen grows a book button then; do not add it now.
- Launcher “+ more”, flight, visa, eSIM, shop, airport transfer.
- Collapsing the tile row into an icon strip on scroll (ShareTrip). That edits the 09 hero.
- Floating chat or Ask AI.
