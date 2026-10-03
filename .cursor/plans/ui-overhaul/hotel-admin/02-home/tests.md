# Tests — Today’s house

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

## Device cases

### D-H5 Home is the desk

- Sign in as a hotel admin and open Home.
- Expected: today’s date and four counts. No hotel search and no community row.
- Sign in as `USER` and open Home.
- Expected: the traveller home, unchanged.

### D-H6 Count opens a lens

- Tap Arriving.
- Expected: the guest list filtered to arriving stays, not the traveller Bookings chips.

### D-H7 Empty and failed

- A hotel with no stays shows zeros, not an error.
- A failed bookings request shows an error and retry, not zeros.
