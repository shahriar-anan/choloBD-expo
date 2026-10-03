# Tests — Guest bookings

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

## Device cases

### D-H8 Guest list

- Sign in as a hotel admin and open Bookings.
- Expected: Arriving, In house, Departing, Unpaid, All. No Hotels / Tickets / Activities chips.
- A guest card shows the guest, dates, and status it shows today.

### D-H9 Lens from Home

- On Home, tap Unpaid.
- Expected: Bookings opens with Unpaid selected.

### D-H10 Stay actions

- Open a guest card. The Bookings tab stays selected.
- Cancel still asks through the existing eligibility. A stay that `canRecordStay` rejects does not offer record-stay.

### D-H11 Traveller list

- Sign in as `USER` and open Bookings.
- Expected: All, Hotels, Tickets, Activities. No Arriving lens.
