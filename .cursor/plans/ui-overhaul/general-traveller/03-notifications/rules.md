# Rules — Notifications

## Scope

`src/app/(tabs)/notifications/`, `src/hooks/useNotificationInbox.ts`, and the unread count already loaded for the dashboard.

Reuse `getMyNotifications`, `markNotificationRead`, `markAllNotificationsRead`, and `GET /api/notifications/unread-count` in `src/services/api/notifications.ts`.

## Badge

The count is `data.count`. A failed count hides the badge. Do not show `0`.

Reload on focus. Do not poll.

## Links

Only navigate when `relatedEntityId` is present and the traveller detail screen for that type exists under `bookings`. A tap with nowhere to go marks the row read and stays on the list.

Do not call `POST /api/notifications`. Do not call delete.

## Hotel desk

`dashboard/notifications.tsx` remains the hotel admin entry. Its hotel booking link stays `/(tabs)/dashboard/:bookingId`.
