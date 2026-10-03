# 04 — Profile

**Folder:** `04-profile` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented with the traveller bar. Device cases are not run yet. Depends on 01.

`UserDashboard` is a menu: hotel bookings, tickets, activities, trip planner, one recent booking, a wallet number, a bell, and logout. Bookings and Notifications are tabs now. This screen keeps the person and the app settings.

`UserDashboard` stays in the repo for reference until nothing imports it. The Profile tab does not render it. Hotel admin still renders `ServiceAdminDashboard`.

## What the traveller sees

```
Profile

(avatar)  Name
          email

Wallet coins
12,400

About               ›
Tracking            ›
Offers              ›
Community           ›
Help                ›

Language          English ›
Appearance        System ›

Log out
```

- Avatar, name, and email match the current profile row: photo from `GET /api/users/profile`, otherwise an initial. No Dicebear.
- Wallet coins is the same display-only card as today (`GET /api/wallets/own-wallet`, `balance` only). A failed wallet call hides the card. Tapping it does nothing until a top-up screen exists.
- About, Tracking, Offers, Community, and Help are rows on this screen. Each opens its own screen under Profile. Those screens show the title and a back control only. No list, no copy, and no “coming soon” alert.
- Language uses the existing `LanguageToggle` behavior (English / বাংলা).
- Appearance uses `useTheme().setMode`: System, Light, Dark. The value already persists in AsyncStorage under `app_theme_mode`.
- Log out is the last row. It runs the same `logoutUser` action as the current dashboard, then `/(auth)/login`.

No status dot. No role label. No bell. No booking rows. No trip planner row. No recent-booking card.

Tracking on Profile is not the Bookings tab. It is an empty screen until a later plan fills it. Community on Profile is not the home photo row. It is an empty screen too.

## Left off

- Editing the name, email, or photo.
- Wallet top-up.
- My trips. Bookings is that list.
- Hotel desk tools.
