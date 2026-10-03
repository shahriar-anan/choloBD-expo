# 04 — Office and settings

**Folder:** `04-dashboard` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented.

Dashboard stays `ServiceAdminDashboard` for a hotel admin. It is the office, not a second today and not a second guest list.

## What the hotel admin sees

```
Dashboard

My hotel
Earnings
Availability
Complaints
QR scanner

Settings
  Language
  Appearance
  Log out
```

My hotel, earnings, availability, complaints, and the QR scanner keep the screens they already open.

Language and appearance use the same controls as the traveller profile (`LanguageToggle`, `setMode` cycling system, light, and dark). Log out uses the logout the dashboard already calls.

## What leaves this screen

- The house snapshot. Home owns that.
- The Current bookings card. Bookings owns that.
- The notifications bell in the header. The Notifications tab owns that.
- Staff and “your bookings”. Those rows are already hidden for `hotelOperator`. Leave them hidden.

A non-hotel `ServiceAdminDashboard` is unchanged, including its current cards.

## Left off

- The unread badge (increment 05).
- A hotel employee QR tab.
