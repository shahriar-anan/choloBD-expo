# Tests — Notifications

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Confirm a traveller path in `openNotification` does not `push` `/(tabs)/dashboard` or `/(tabs)/tracking`.

## Device cases

A person runs these. The agent does not launch Expo.

### D-N1 Badge

- Sign in as a traveller with at least one unread notification.
- Expected: a count on the Notifications icon. Mark all read clears it. Leaving and returning reloads the list.

### D-N2 Hotel deep link

- Tap a hotel booking notification.
- Expected: that booking’s detail under Bookings, tab bar hidden. Back returns to Notifications.

### D-N3 Unknown type

- Tap a notification with no detail screen.
- Expected: the row marks read. The list stays open.

### D-N4 Hotel admin

- Open notifications from the hotel dashboard.
- Expected: the hotel inbox still opens a hotel booking on the dashboard stack.
