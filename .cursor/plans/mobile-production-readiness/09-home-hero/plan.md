# 09 — Home hero and booking entry

**Folder:** `09-home-hero` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** UI in place. Device cases in tests.md are not run yet.

**Depends on:** nothing. Hotel search (01b) and the trip planner (01) are already the destinations of two tiles. This increment does not wait on 03–08.

**Reference:** ShareTrip and GoZayaan home screens (2026-09-28). Both put the service launcher on the visual header, in the first viewport, and keep promo cards below it. Visual style stays `src/constants/theme.ts`. No ShareTrip or GoZayaan artwork, logos, or copy.

## What is wrong today

The home screen is `src/app/(tabs)/index.tsx`. Order: logo header, then `HeroBackground`, then `QuickActionGrid`, then the Explore BD and Community banners.

| | ShareTrip | GoZayaan | CholoBD now |
| --- | --- | --- | --- |
| First viewport | Greeting, then a 4-column launcher sitting on the brand header | Destination photo, greeting on the photo, circular launcher on the seam | Desk photo (camera, map, notebook) with a two-line product slogan |
| Launcher | White raised cards, illustrated icons, labels under each | White circles overlapping the photo | Four gray outlined squares in a row under the photo, hairline under the row |
| Dead slots | Extra services live behind “+3 more” | Unfinished products stay off the row | The fourth tile is Transport, labeled Coming Soon, with a Soon badge |
| Copy on the image | Short welcome | “Hello, Traveler” | “Prepaid. QR Easy. Cash-Free Journeys.” plus a sentence about scanning QR codes |
| After the launcher | Promo card, then destination rows | Promo cards, then Hot Deals | Two large photo banners before any list |

The launcher is the hero form. Neither reference app puts destination, date, or guest fields on the home screen. Those open after a tile tap. CholoBD already has that for hotels (S1–S13). `QuickBookingWidget` and `HeroSection` are not mounted and stay unmounted.

The photo is the wrong subject. A flat-lay of gear explains a product. The references use a place (GoZayaan) or a solid brand field (ShareTrip) so the launcher is what you see first.

## What changes

### Photo

`HeroBackground` keeps a full-bleed photo under the existing logo header. The header stays a solid bar (menu + wordmark). Do not paint wallet, membership, or a greeting into that bar. Those live on the dashboard (03b).

- Replace the desk photo (`photo-1488646953014`) with a landscape of Inani Beach, Cox’s Bazar (`photo-1753731581991-03a92edcb279`). Explore BD keeps its own mountain photo.
- Photo height is 168px. The tiles still overlap the bottom by about 28px. The first screen shows the greeting, the photo, and the full tile row without scrolling.
- Overlay on the image: **Hello, Traveller** (`home.helloTraveller`), white, top-left, in a bold cursive face (Snell Roundhand Black on iOS, bold cursive on Android). No tagline and no subtitle. `home.tagline` and `home.taglineSubtitle` stay in the locale files and are not rendered here.
- The logo bar is 52px tall. The wordmark on that bar is the original 130×52. Login and register keep their larger logo.
- A short bottom fade so the white tiles separate from the photo. No heavy black gradient, because there is no text to protect.

### Launcher

`QuickActionGrid` overlaps the bottom of the photo by about 28px (negative top margin). It is not a toolbar: remove the bottom border.

Four live tiles, equal width, this order:

| Tile | Label key | Route |
| --- | --- | --- |
| Hotels | `home.quickActions.bookHotel` | `/(tabs)/explore/hotel-search?fromHome=true` |
| Plan Trip | `home.quickActions.planTrip` | `/(tabs)/trip-planner` |
| Attractions | `home.quickActions.attractions` | `/(tabs)/explore/tour-spots-list?fromHome=true` |
| Transport | `home.quickActions.transport` | None. The tile is visible and does not navigate. Wiring waits for increment 06. |

Each tile: white surface in light mode, `surface` in dark mode, corner radius 16, about 64×64, existing theme elevation. The glyph is a filled MaterialCommunityIcon at size 30 in `primary` / `primary-dark`. Label under the tile, 12px, semibold, two lines max, centered. Horizontal padding 16, gap about 10.

Icons are filled MaterialCommunityIcons, size 30, in the theme primary color: `bed` (Hotels), `map-marker-path` (Plan Trip), `binoculars` (Attractions), `bus-side` (Transport). These replace the Feather line icons.

Transport is shown and does not open a screen. No Coming Soon label and no Soon badge. Flight, Visa, eSIM, Shop, airport transfer, and gift card stay off this row. Tours is not a tile. The tour list remains reachable from the page sections below.

### Below the row

Explore BD and Community banners stay as they are. Their top spacing clears the overlapping tiles. Do not restyle `TourPackagesSection` or `SuggestedToursSection` in this increment.

## Functional

No new endpoint, service, hook, or type. Hotel search, trip planner, tour-spot list, and tour list already exist.

### Exit

`npx tsc --noEmit` from `choloBD-expo` after the locale key for Tours exists. There is no service work before UI.

## UI

Files:

- `src/components/homepage/HeroBackground.tsx`
- `src/components/homepage/QuickActionGrid.tsx`
- `src/app/(tabs)/index.tsx` (order stays; only if the overlap needs a wrapper)
- `src/constants/translationKeys.ts`, `src/locales/en.json`, `src/locales/bn.json` for the Tours label

`HomeHeader` stays. Do not mount `QuickBookingWidget` or `HeroSection`.

### Exit

Device cases in [tests.md](tests.md). A person runs them. Agents do not start Expo.
