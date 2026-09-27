# Tests — increment 06 (transport)

## Agent checks

```bash
npx tsc --noEmit
```

## Device cases

### D-06 Book a bus seat

- Expected: seat map `GET .../trips/:tripId/seats`. Create with `transportTripId` + `seatIds`. Pay `TRANSPORT_SERVICE`. Cancel >6h before departure refunds.

### D-06b Book a rental

- Expected: `transportVehicleId`, pickup/return datetimes. Cancel >24h refunds; inside 24h does not.
