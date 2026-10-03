# Tests — Home entries

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Confirm traveller home does not render `SideScroller`. Confirm traveller login does not `replace` `/(tabs)/dashboard`.

## Device cases

A person runs these. The agent does not launch Expo.

### D-H1 Home

- Sign in as a traveller. Home has no hamburger.
- Hotel, Plan trip, Attractions, and Transport each open their flow. Back from the first screen of each returns to Home. The tab bar is hidden on that flow and visible again on Home.

### D-H2 Community

- “See all” on the traveller-photos row opens the feed. Back returns to Home.
- A post opens the post. Back returns to the feed.

### D-H3 Pay

- Finish a hotel or bus payment as a traveller.
- Expected: Bookings, with that reservation visible. Not Dashboard and not Tracking.

### D-H4 Hotel admin home

- Sign in as a hotel admin and open Home.
- Expected: their current header and tabs, including Explore and Dashboard.
