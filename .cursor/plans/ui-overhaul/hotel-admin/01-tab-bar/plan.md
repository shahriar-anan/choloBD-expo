# 01 — Hotel admin tab bar

**Folder:** `01-tab-bar` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented.

`src/app/(tabs)/_layout.tsx` already splits travellers from everyone else. Travellers see Home, Bookings, Notifications, Profile. Everyone else sees Homepage, Explore, Dashboard, Tracking.

A hotel admin is the exception inside that second group.

## Who sees which bar

| Session | Bar |
| --- | --- |
| Signed out, or `USER` | Traveller bar, unchanged |
| `SERVICE_ADMIN` and `serviceType === 'HOTEL_BOOKING'` | Home, Bookings, Dashboard, Notifications |
| `EMPLOYEE`, including a hotel employee | Homepage, Explore, Dashboard, Tracking |
| `SERVICE_ADMIN` with any other service | Homepage, Explore, Dashboard, Tracking |
| `MASTER_ADMIN` | Homepage, Explore, Dashboard, Tracking |

`serviceType` comes from the profile `useDashboardLogic` already loads. Do not add a new profile call from the tab layout if that hook’s value can be read from the same store or the same request. If the layout cannot see it yet, load it once and keep the previous bar until it returns.

## Tabs

No new route group. Reuse the routes that already exist.

| Route | Visible title | Focused icon | Unfocused icon |
| --- | --- | --- | --- |
| `index` | `tabs.home` | `home` | `home-outline` |
| `bookings` | `tabs.bookings` | `ticket` | `ticket-outline` |
| `dashboard` | `tabs.dashboard` | `grid` | `grid-outline` |
| `notifications` | `tabs.notifications` | `notifications` | `notifications-outline` |

English: Home, Bookings, Dashboard, Notifications. Bengali: হোম, বুকিং, ড্যাশবোর্ড, বিজ্ঞপ্তি.

`tabs.homepage` stays for every role that still shows the old bar.

For a hotel admin, set `href: null` on `explore`, `profile`, `tracking`, `trip-planner`, and `community`. Bookings and Notifications stay visible. Those two routes still render the traveller screens until increments 03 and 05. That is why 02 and 03 follow immediately.

## Re-tap

Tapping the active hotel-admin tab pops that tab to its index. Do not reset a traveller’s stack from this listener, and do not reset Explore for a bus operator.

## Landing

After sign-in, a hotel admin opens Home (`/(tabs)`), which increment 02 turns into today’s house. Until 02 lands, do not change `roleHome`.

## Left off

- Today’s house on Home (increment 02).
- Guest list on Bookings (increment 03).
- Settings on Dashboard (increment 04).
- Unread badge (increment 05).
- Any hotel employee tab, including a QR tab.
