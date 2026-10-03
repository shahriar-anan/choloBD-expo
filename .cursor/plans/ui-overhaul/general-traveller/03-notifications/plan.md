# 03 — Notifications

**Folder:** `03-notifications` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented. Device cases are not run yet. Depends on 01 and 02.

The inbox already exists at `src/app/(tabs)/dashboard/notifications.tsx` and `useNotificationInbox`. Increment 01 mounts it on the Notifications tab. This increment makes that tab the traveller inbox and points its deep links at Bookings.

## What the traveller sees

The tab opens the current list: newest first, mark-all-read, empty sentence “No notifications”.

The tab icon shows the unread count from `GET /api/notifications/unread-count`. `99+` caps the badge. Zero hides the badge.

Reload the list and the count when the tab gains focus.

## Deep links

`useNotificationInbox` today sends `HOTEL_BOOKING` to `/(tabs)/dashboard/:id` and `PACKAGE_BOOKING` to `/(tabs)/dashboard`.

For a traveller:

| `relatedEntityType` | Opens |
| --- | --- |
| `HOTEL_BOOKING` | `/(tabs)/bookings/:id` when `relatedEntityId` is set |
| `TRANSPORT_BOOKING` | The transport detail under `bookings` when `relatedEntityId` is set |
| `ACTIVITY_BOOKING` or `GUIDE_SERVICE` | The matching detail under `bookings` when `relatedEntityId` is set |
| Anything else, including `PACKAGE_BOOKING` with no detail route | Stay on the notification. Do not dump the traveller on Dashboard. |

Mark read still happens before the navigation, as it does now.

A hotel admin who opens `/(tabs)/dashboard/notifications` keeps the current hotel deep links. Branch on role inside `openNotification`, or pass a flag from the screen. Do not send a hotel admin into the traveller Bookings stack.

## Left off

- A bell on Profile.
- Creating or deleting notifications.
- A second inbox component.
