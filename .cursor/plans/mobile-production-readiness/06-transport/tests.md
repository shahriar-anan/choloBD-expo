# Tests — increment 06 (transport)

## Agent checks

Run from `choloBD-expo` after the functional exit, and again after UI:

```bash
npx tsc --noEmit
```

Do not start Expo. Backend coverage for holds, stops, and the return leg is `ExpressJS-choloBD-backend/nodeapp/scripts/tests/test-transport-booking-flow.js`. Device QA data: `npm run seed:bus-ticket-qa` in `ExpressJS-choloBD-backend/nodeapp/` (see **QA seed** in [plan.md](plan.md)).

## Device cases

### D-06 One-way bus

- Search From, To, and a journey date. Leave return empty.
- Results show fare, seats left, and the All / AC / Non-AC counts for that day.
- Open a trip, select seats on each deck that exists, continue, and see the hold timer.
- Pick a boarding stop and a later dropping stop.
- Enter phone, email, and each passenger’s name and gender.
- Create succeeds. Pay with `TRANSPORT_SERVICE`. The ticket shows seats, stops, and passengers.
- Cancel more than 6 hours before departure refunds. The eligibility screen states the outcome.

### D-06a Return bus

- Set a return date on the search home.
- After outbound stops, pick a return trip on the reverse route and hold those seats.
- Create returns two confirmation codes with the same `roundTripGroupId`.
- Each unpaid leg can be paid. Cancelling one leg does not cancel the other.
- A return search that is not the reverse route cannot be submitted.

### D-06b Car rental

- Type stays car rental. The return-date row is not required.
- Book with `transportVehicleId` and pickup/return datetimes.
- Cancel more than 24 hours before pickup refunds. Inside 24 hours it does not.

### D-06c Hold expiry

- Hold seats, wait until the timer ends, and confirm create is refused until the seats are held again.
- Seats another traveler holds show as unavailable. The holder can still continue with those seats.
