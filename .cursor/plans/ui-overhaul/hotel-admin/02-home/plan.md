# 02 — Today’s house

**Folder:** `02-home` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented.

The Home tab is `src/app/(tabs)/index.tsx`. For a traveller it stays the discovery home. For a hotel admin it becomes the desk that `dashboard/service-admin/today.tsx` and `HotelHouseSnapshot` already draw.

## What the hotel admin sees

```
Today’s date

[ Arriving n ]  [ In house n ]
[ Departing n ] [ Unpaid n ]

Week availability
```

The four counts use `matchesDeskBucket` and `useCurrentBookingsFetch`. Tapping a count opens Bookings with that lens (`arriving`, `inHouse`, `departing`, `unpaid`). Week availability opens the availability screen that today.tsx already opens.

No hotel search, no trip planner, no community row, no traveller promo carousel.

## Where it lives

Branch inside `index.tsx`, or extract the today screen and render it from `index.tsx` when the session is a hotel admin. One implementation. Do not leave a second today screen that can drift. `HotelHouseSnapshot` on the dashboard comes off in increment 04 so today is not drawn twice.

After this increment, `roleHome` for a hotel admin is `/(tabs)`.

## Left off

- Guest list filters and cards (increment 03).
- Removing the house snapshot from Dashboard (increment 04).
