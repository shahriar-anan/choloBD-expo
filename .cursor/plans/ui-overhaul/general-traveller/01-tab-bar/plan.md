# 01 — Traveller tab bar

**Folder:** `01-tab-bar` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented. Device cases are not run yet.

`src/app/(tabs)/_layout.tsx` shows Homepage, Explore, Dashboard, and Tracking to everyone. Trip Planner and Community are `href: null`.

For a traveller, that bar becomes Home, Bookings, Notifications, Profile. Explore, Dashboard, Tracking, Trip Planner, and Community stay mounted and stay hidden.

## Who sees which bar

Read `role` from the auth slice.

| Session | Bar |
| --- | --- |
| Signed out, or `USER` | Home, Bookings, Notifications, Profile |
| `SERVICE_ADMIN`, `EMPLOYEE`, `MASTER_ADMIN` | Current bar, unchanged |

While the profile request is in flight, keep the last known role. Do not flash the traveller bar and then swap it for a hotel admin.

## Tabs

Add three route groups under `src/app/(tabs)/`:

- `bookings` — screen built in [02-bookings](../02-bookings/plan.md). This increment only needs the route so the tab exists.
- `notifications` — render the existing inbox from `src/app/(tabs)/dashboard/notifications.tsx`. The hotel dashboard may keep linking to `/(tabs)/dashboard/notifications`.
- `profile` — screen built in [04-profile](../04-profile/plan.md). This increment only needs the route.

Visible options for a traveller:

| Route | Title key | Focused icon | Unfocused icon |
| --- | --- | --- | --- |
| `index` | `tabs.home` | `home` | `home-outline` |
| `bookings` | `tabs.bookings` | `ticket` | `ticket-outline` |
| `notifications` | `tabs.notifications` | `notifications` | `notifications-outline` |
| `profile` | `tabs.profile` | `person` | `person-outline` |

English: Home, Bookings, Notifications, Profile. Bengali: হোম, বুকিং, বিজ্ঞপ্তি, প্রোফাইল.

`tabs.homepage` stays for the hotel bar. Do not relabel that tab in this increment.

For a traveller, set `href: null` on `explore`, `dashboard`, `tracking`, `trip-planner`, and `community`.

## Re-tap

Tapping the active traveller tab pops that tab to its index. The Explore listener that resets `explore` to `index` stays for roles that still show Explore.

## Left off

- Combined booking list (increment 02).
- Unread badge (increment 03).
- Profile rows (increment 04).
- Removing the home drawer (increment 05).
- Any change to hotel admin or hotel employee navigation.
