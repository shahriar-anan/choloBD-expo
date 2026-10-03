# Tests — Notifications tab

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

## Device cases

### D-H16 Inbox

- Sign in as a hotel admin and open Notifications.
- Expected: the card inbox, Today and Earlier when both exist, and Mark all read when something is unread.
- An empty inbox shows the empty state, not a spinner that never ends.

### D-H17 Badge

- With unread items, the tab icon shows the count.
- After Mark all read, the badge disappears.
- A failed count request leaves the icon without a badge.

### D-H18 Open a stay

- Tap a hotel booking notification.
- Expected: that stay’s operator detail. The screen is not the traveller stay page.

### D-H19 Traveller inbox

- Sign in as `USER`.
- Expected: tapping a booking notification still opens the traveller booking detail.
