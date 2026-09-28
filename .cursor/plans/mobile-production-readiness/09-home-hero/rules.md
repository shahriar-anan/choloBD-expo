# Rules — increment 09 (home hero and booking entry)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Scope

The photo and the service launcher on `src/app/(tabs)/index.tsx` only.

Out of this increment:

- Logo header contents (menu, wordmark). No wallet balance, membership, or avatar on home. Dashboard already shows those (03b).
- Explore BD banner, Community banner, tour-package strip, and trending spots, except the top margin that clears the overlapping tiles.
- Hotel search screens (01b), trip planner (01), and any new booking vertical.
- Flight, visa, eSIM, shop, airport transfer, gift card. The backend does not sell them.
- A destination / date / guest form on the home screen. Tiles open the existing flows.
- `QuickBookingWidget` and `HeroSection`. Leave them unmounted.

## Launcher

- Four tiles, in order: Hotels, Plan Trip, Attractions, Transport.
- Routes already in the app: hotel search with `fromHome=true`, trip planner, tour-spots list with `fromHome=true`.
- Transport is visible and does not navigate. No Coming Soon label and no Soon badge. Increment 06 wires the tap.
- Do not add a “+ more” control. There is no second page of products yet.
- Strings go through `TRANSLATION_KEYS` in English and Bengali. Transport uses `home.quickActions.transport`.
- Icons are filled MaterialCommunityIcons, size 30, in the theme primary color: `bed`, `map-marker-path`, `binoculars`, `bus-side`. No Feather line icons, no remote icon URLs, and no third-party brand marks.

## Photo

- One still landscape image: Inani Beach, Cox’s Bazar (`photo-1753731581991-03a92edcb279`). Do not keep the desk flat-lay (`photo-1488646953014`) or the open-road photo on this hero.
- Overlay **Hello, Traveller** (`home.helloTraveller`) on the upper left of the image. Do not render `home.tagline` or `home.taglineSubtitle`.
- The home logo bar stays 52px. The wordmark there is the original 130×52. Do not change the login or register logo size.
- The launcher overlaps the photo. The row is not a separate band with its own bottom border.

## Visual

- Tiles use `surface` / white, radius 16, theme elevation. Page background stays `background`.
- Dark mode uses `surface-dark` tiles and `primary-dark` icons. The photo does not change.
- Do not introduce a second blue header behind the tiles. The logo bar stays as it is.
