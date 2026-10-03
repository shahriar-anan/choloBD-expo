# Rules — Profile

## Scope

New screen at `src/app/(tabs)/profile/index.tsx`. It may use `useDashboardLogic` for the profile photo, wallet, and logout. It must not render `DashboardLinkRow`, `RecentBookingCard`, or the notifications bell.

Do not delete `UserDashboard.tsx` in this increment if hotel or home code still imports it. Do stop the traveller tab from mounting it.

## Rows

| Row | Action |
| --- | --- |
| About, Tracking, Offers, Community, Help | Push an empty screen in the Profile stack. Title and back only. |
| Language | Existing language switch |
| Appearance | `setMode('system' \| 'light' \| 'dark')` |
| Log out | Existing logout |

Wallet is a card, not a navigation row. Do not fill the five empty screens with feed data, offers, or a second booking list.

## Copy

Page title is Profile in both locales, the same word as the tab. Reuse `dashboard.walletCoins` for the wallet label.

## Do not

- Do not show `userStatus` or `role`.
- Do not alert “Coming soon” on the empty screens.
- Do not link those rows to `user-bookings`, `transport-bookings`, `attraction-bookings`, `recent-bookings`, `trip-planner`, or `/(tabs)/community`.
- Do not add this tab for hotel roles.
