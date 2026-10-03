# Rules — Notifications tab

## Scope

The hotel admin inbox and its tab badge. Do not change the traveller inbox behavior.

## Data

`useNotificationInbox` without `traveler: true`. Unread count is the same `getUnreadNotificationCount` helper the tab layout already calls for travellers. Extend that call to hotel admins. Do not add a second endpoint.

## Navigation

Deep links stay on the operator booking routes. A row with no route marks read and stays on the inbox.

## Copy

Title, mark all read, empty, Today, and Earlier reuse `dashboard.notifications.*`. Do not add a second inbox vocabulary.

## Do not

- Do not badge a hotel employee in this increment.
- Do not send a hotel admin into the traveller Bookings stack.
