# 05 — Home entries

**Folder:** `05-home-entries` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented. Device cases are not run yet. Depends on 01, 02, and 04.

Home still has a hamburger whose items repeat the tabs or raise an alert. Login and several payment successes send a traveller to Dashboard. This increment points traveller entry and exit at Home and Bookings.

## Home header

Remove `SideScroller` from `HomeHeader` for a traveller. The brand stays.

Language lived in that drawer. It now lives on Profile. Do not keep the drawer open just for the toggle.

Delete the traveller branches in `handleNavigate` that alert for wallet, payment, settings, help, and about, and the branches that push Explore, Dashboard, Tracking, or the QR scanner. If nothing calls `handleNavigate` after the drawer is gone, delete the handler.

The quick-action tiles stay: hotel search, trip planner, attractions, transport search.

`HomeCommunityRow` still opens a post and “see all” on `/(tabs)/community`. The plan-a-trip card on that row still opens `/(tabs)/trip-planner`.

## Hidden stacks

Explore, Trip Planner, and Community are hidden tabs. On those screens the traveller bar must not sit underneath with no tab selected.

For a `USER`:

- Hide the tab bar on `explore`, `trip-planner`, and `community`.
- The first screen of each flow (hotel search, attractions, transport search, tour list, trip list, community feed) shows a back control that returns to Home.
- Wizard screens that already hide the bar (hotel dates through payment, transport steps, booking detail) stay as they are.

Hotel admin still sees the Explore tab and the drawer behavior they have today. Gate the header and the forced hide on `role === 'USER'` or signed out.

## After login and after pay

| From | Traveller goes to |
| --- | --- |
| Login or register success | `/(tabs)` Home |
| Hotel payment success, transport payment success, tour booking success | `/(tabs)/bookings` on the chip for that product |
| A link that used to `replace` `/(tabs)/dashboard` or `/(tabs)/tracking` from a traveller screen | Bookings, or Home when the screen was only a menu |

Hotel admin login still replaces to `/(tabs)/dashboard`.

## Left off

- Redesigning the hero, promos, or deal rows.
- A new search field on Home. The tiles are the launcher.
- Community moderation. Master admin pending posts stay on the community stack.
