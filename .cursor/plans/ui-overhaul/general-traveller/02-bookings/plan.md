# 02 — Bookings

**Folder:** `02-bookings` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented with increment 01. Device cases are not run yet.

Tracking (`src/app/(tabs)/tracking/index.tsx`) lists hotel stays for a traveller and a hotel menu for a service admin. Hotel, ticket, and activity lists live under Dashboard as separate rows. Those rows go away for a traveller. This tab is the only place a traveller sees a reservation.

## What the traveller sees

```
Bookings

[ All ]  [ Hotels ]  [ Tickets ]  [ Activities ]

— cards for the selected chip —
```

Default chip is **All**. Soonest upcoming date first. Past and cancelled rows follow, still inside the same chip.

| Chip | Source screen today | Card |
| --- | --- | --- |
| All | The three lists below, merged | Each row keeps the card it already uses |
| Hotels | `dashboard/user-bookings.tsx` | Hotel `BookingCard`, including its status filters |
| Tickets | `dashboard/transport-bookings.tsx` | Bus and car-rental cards |
| Activities | `dashboard/attraction-bookings.tsx` | Existing Activities and Guides switch inside this chip |

The Hotels chip keeps All / Unpaid / Confirmed / Pending / Cancelled. Those filters do not apply to Tickets or Activities.

Empty chip: one sentence, then actions that open hotel search, transport search, and attractions. Those routes already exist under `explore/`.

Pull to refresh reloads the open chip.

## Where the screens live

Traveller list and detail routes live under `src/app/(tabs)/bookings/` so the Bookings tab stays selected.

Move the traveller screens, and update every traveller `push` that targets them:

- Hotel list, hotel detail, hotel QR, hotel payment
- Transport list and transport detail
- Attraction list and attraction detail

Leave these where they are. They belong to the hotel desk:

- `dashboard/service-admin/**`
- `dashboard/index.tsx` for `ServiceAdminDashboard`
- `tracking/**` (hotel admin still opens it)

`useDashboardLogic` can still load the data. The Bookings screen is the traveller caller. Do not add a second fetch layer.

A booking detail hides the tab bar, as hotel and transport checkout already do. The list does not. Remove the `user-bookings` and `recent-bookings` exceptions in `isDashboardBookingChromeHidden` once those lists are no longer the traveller destination. `recent-bookings` is not linked from Bookings.

## Left off

- Trip plans. Home opens `/(tabs)/trip-planner`.
- Package-booking management. Traveller package list screens were already removed.
- Guest lists, QR scan of someone else’s code, earnings, staff.
- A Dashboard row that repeats these chips.
