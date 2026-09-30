# Tests — increment 10 (home feed under the hero)

## Agent checks

Run from `choloBD-expo` after Functional, and again after UI.

```bash
npx tsc --noEmit
```

Confirm the new clients call only these paths:

- `GET /api/hotels/popular`
- `GET /api/activity-spots/popular`
- `GET /api/tour-spots` or `GET /api/tour-spots/popular`
- `GET /api/tour-builder` with `isActive` and `isPopular`
- `GET /api/community/posts`

No `GET /api/search/combined` from this increment. No discount, coupon, or promo endpoint.

## Device cases

Traveler JWT. Homepage tab. Agents do not start Expo. The hero photo and the four tiles are still the increment 09 cases; do not retest them except to see they are still the first thing on the page.

### D-10-order Feed order

- Open Homepage. Scroll past the tiles.
- Expected, in order: promo carousel, Popular places, Featured holidays, Hot deals, From travelers.
- The Explore BD banner and the Travel together banner are gone.
- No search field, no chat button, no coin balance in the logo bar.

### D-10-promo Promo cards

- Swipe the carousel. Four photo cards. The next card peeks. Dots follow the swipe.
- Wallet and QR cards open the dashboard. Stays opens hotel search. Community opens the community tab.
- Wallet and QR both show a photo, not a solid color panel.
- No percent, no crossed-out price, no bank name, no ShareTrip / GoZayaan / Trip.com mark.

### D-10-places Popular places

- Five district photos in the page scroll, not a sideways row: Cox's Bazar full width, then two pairs. Each is mostly a photo, with the name on the image.
- A card opens the tour-spots list for the matching location when that name exists. Otherwise it opens the full list.
- See all opens the full tour-spots list.

### D-10-holidays Featured holidays

- The first package is a full-width photo. The name and `BDT` price sit on the image. Duration is a small pill. Rating is a small pill when it is greater than zero.
- Up to three more packages are rows under it: thumbnail, name, place, price. They do not swipe sideways.
- The card opens that package’s detail.
- See all opens the tour list.

### D-10-deals Hot deals chips

- Default chip is Stays. Up to four cards sit in a two-column grid. Each is mostly the hotel photo, with the name and nightly from-price on the image, and a rating pill when the rating is greater than zero. No crossed-out price. The chips do not swipe.
- A hotel card opens that hotel’s stay screen.
- Holidays chip shows packages. Activities chip shows entry cost.
- An activity card opens the preview: name, photo, place, rating, entry cost. No book button and no date field.

### D-10-community From travelers

- Up to four posts sit in a two-column grid. Each is mostly the photo, with the caption on the image.
- Under the grid, a full-width card opens the trip planner. It does not say AI.
- A card opens that post. See all opens the community feed.

### D-10-dark Dark mode

- Section titles, See all, chips, and card surfaces stay readable. Promo photos do not change.
