# Tests — increment 09 (home hero and booking entry)

## Agent checks

```bash
npx tsc --noEmit
```

Run from `choloBD-expo` after the Tours label exists, and again after the hero and grid change.

No new API client. Do not add a service check.

## Device cases

Traveler JWT. Homepage tab. Agents do not start Expo.

### D-09-photo Image above the launcher

- Open Homepage.
- Expected: a short logo bar with the original-size wordmark. Under it, a wide photo of Inani Beach, Cox’s Bazar (coast and palms), not the desk photo and not the open-road photo. **Hello, Traveller** is overlaid on the upper left of the photo in cursive. No “Prepaid. QR Easy…” line and no QR subtitle.
- The service tiles sit on the bottom edge of that photo. The photo and the full tile row are visible without scrolling.

### D-09-tiles Launcher

- Expected: four tiles, left to right: Hotels, Plan Trip, Attractions, Transport. White (or dark-mode surface) rounded squares. Icons are a bed, a route, binoculars, and a bus, in the primary color, with the label under each. No Tours tile, no Coming Soon label, no Soon badge, no “+ more”.
- No date field, destination field, or guest stepper on this screen.

### D-09-nav Tile routes

- Hotels opens hotel search. Plan Trip opens the trip planner. Attractions opens the tour-spots list. Transport does not open a screen.
- Back from each returns to Homepage. The tab bar stays on Homepage.

### D-09-below Content under the launcher

- Expected: Explore BD, then Travel together, still on this page, below the tiles, not covered by them. Tour packages and trending spots still follow those banners.
- Dark mode: tiles stay readable (surface fill, primary icon). The photo is the same landscape.
