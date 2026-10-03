# 05 — Notifications tab

**Folder:** `05-notifications` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented.

The Notifications tab already renders the traveller inbox. A hotel admin needs the operator inbox: same `useNotificationInbox` call the dashboard screen uses, with traveller deep links off.

## What the hotel admin sees

The inbox layout the traveller tab already uses: cards, a type icon, time, unread dot, Today and Earlier. Mark all read stays.

The badge on the tab icon is `GET /api/notifications/unread-count`. `99+` caps it. Zero hides it. A failed count hides it. Reload the count when the pathname changes, the same way the traveller badge does.

Tapping a row marks it read and opens the related stay on the operator booking screen. It must not open `/(tabs)/bookings/stay`, `ticket`, or `activity`.

## Where it lives

Branch `src/app/(tabs)/notifications/index.tsx` on hotel admin, or pass `{ traveler: false }` from that screen for this role. The dashboard notifications page can remain for roles that still link to it. Hotel admin no longer needs that link.

## Left off

- Hotel employee notifications. They still use the old bar and the dashboard inbox.
