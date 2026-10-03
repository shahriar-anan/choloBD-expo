# Tests — Bookings

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Search traveller components for `/(tabs)/dashboard/user-bookings`, `/(tabs)/dashboard/transport-bookings`, and `/(tabs)/dashboard/attraction-bookings`. After this increment those pushes from traveller screens point at `/(tabs)/bookings/...`.

Hotel admin pushes to `dashboard/service-admin` and `tracking` stay.

## Device cases

A person runs these. The agent does not launch Expo.

### D-B1 All

- Sign in as a traveller with one hotel, one bus or rental, and one activity or guide booking.
- Open Bookings. All is selected.
- Expected: all three cards. The tab bar is visible. The Bookings icon is selected.

### D-B2 Chips

- Hotels shows only hotel rows and the status filters.
- Tickets shows only transport rows.
- Activities shows the existing activities and guides switch.
- Pull to refresh reloads the open chip.

### D-B3 Detail

- Open a hotel card. The tab bar hides. Back returns to the same chip.
- Pay and cancel behave as they do on the current detail screens.

### D-B4 Empty

- A traveller with no rows sees the empty sentence and can open hotel search, transport search, and attractions.

### D-B5 Hotel admin

- A hotel admin’s Tracking tab still lists guest stays or the admin cards. It does not show the traveller chips.
