# Tests — Attractions hub

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Run once when services and hooks compile, and again after the screens exist.

Confirm the attractions tile, the explore attractions card, and popular-places “see all” point at `/(tabs)/explore/attractions`. Confirm no service file calls `/api/tour-spots` with `spotType` or `maxEntryCost`.

## Device cases

A person runs these. The agent does not launch Expo.

### D-A1 Open Attractions from the home tile

- Tap the binoculars tile.
- Expected: Attractions hub, Places tab selected, tour spots listed.
- Back returns to the home tab.

### D-A2 Switch catalogs

- Open Things to do. Activity cards show a duration when the spot has one, and an entry price (or free when the cost is 0).
- Open Guides. Cards show a person, languages, and a price per day.
- Switch back to Places. The same location chip still applies.
- Search text filters the open tab by name. An empty tab shows the empty state, not a spinner that never ends.

### D-A3 Place detail and nearby

- Open a place that has activities or guides in its location.
- Expected: photo, description, rating, tour type. No price and no book button.
- “Things to do here” opens the hub on Things to do with that `locationId`.
- “Guides here” opens the hub on Guides with that `locationId`.

### D-A4 Book an activity

- Setup: signed-in traveler, active spot, a future date, participant count inside 1–100.
- Expected: `POST /api/bookings/activity-spots`, then the payment browser with `ACTIVITY_BOOKING`.
- A past date shows the server message and does not open payment.
- Signed out: the screen offers login and does not post.

### D-A5 Request a guide

- Setup: signed-in traveler, active guide, a working day, end time inside working hours.
- Expected: availability check, then `POST /api/bookings/guides`. Confirmation says the request is pending. No pay button. No phone number and no email.
- A guide with `requiresStartTime` shows a start-time field. One without it does not.
- An unavailable day shows the server reason and does not create a second request.
