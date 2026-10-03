# Tests — Office and settings

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

## Device cases

### D-H12 Office rows

- Sign in as a hotel admin and open Dashboard.
- Expected: My hotel, Earnings, Availability, Complaints, QR scanner, then language, appearance, and log out.
- Current bookings and the today counts are absent.
- The header has no bell.

### D-H13 Each tool opens

- My hotel opens that hotel’s info.
- QR scanner opens the existing scanner.
- Earnings, availability, and complaints open the screens they open today.

### D-H14 Other admin unchanged

- Sign in as a non-hotel service admin and open Dashboard.
- Expected: the cards that admin already had, including staff if that branch shows staff today.

### D-H15 Appearance

- Cycle appearance. Light, dark, and system match the traveller profile control.
