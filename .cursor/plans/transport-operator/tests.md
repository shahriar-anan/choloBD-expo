# Tests — transport admin

## Agent checks

Backend rounds run from `ExpressJS-choloBD-backend/nodeapp` against a local API. Do not run Prisma CLI.

App rounds, from `choloBD-expo`:

```bash
npx tsc --noEmit
```

Do not start Expo for the type check. Device cases are last.

Login: `POST /api/auth/login-jwt`. Password `root1234`.

| Account | Use |
| --- | --- |
| `transportadmin1@gmail.com` | Bus company A |
| A second transport `SERVICE_ADMIN` on a different `Transport` | Company B. Use a seeded rental admin when one exists; otherwise any other `transportadmin*` whose `serviceEntityId` is not company A. |
| `user1@gmail.com` | Traveler |

## Round 1 — booking scope

- Admin A `GET /api/bookings/transports` returns only rows with their `transportId`.
- Admin A `GET /api/bookings/transports?transportId=<company B>` is 403.
- Admin A `GET /api/bookings/transports/:bookingId` for a company B booking is 403.
- `user1` still receives only their own rows, and can open their own booking.
- A rental or bus row includes `user.phoneNumber` when the account has one (field present; value may be null).

## Round 2 — type guard and fleet list

- Admin A `POST /api/transport-inventory/vehicles` is rejected.
- A rental admin `POST /api/transport-inventory/trips` is rejected.
- Admin A `POST /api/transport-inventory/classes` without `busServiceType` is rejected.
- A rental admin `POST /api/transport-inventory/classes` without `vehicleRentalCategory` is rejected.
- Public `GET /api/transport-inventory/vehicles?transportId=` still returns only `AVAILABLE` vehicles.
- The rental admin, with a Bearer token, receives vehicles that are not `AVAILABLE` for their own `transportId`.

## Round 3 — types

`npx tsc --noEmit` in `choloBD-expo`. Rounds 1–2 still pass.

## Round 4 — home

`npx tsc --noEmit`.

Device, after rounds 5–6 exist:

- `transportadmin1` lands on the transport home, sees the company name, and does not see My hotel.
- A hotel admin still sees the hotel home.
- `user1` still sees the traveler home.

## Round 5 — passengers

`npx tsc --noEmit`.

Device:

- Admin A opens Passengers and sees a booking on their company: name, code, status, payment, price.
- A bus row shows at least one seat. Opening it shows passenger name, gender, stops, and contact phone.
- Cancel shows the eligibility outcome before it deletes. A paid booking cancelled by the admin is a full refund. The app does not call `POST /api/payments/refund`.

## Round 6 — create, then the existing traveler buys it

`npx tsc --noEmit`.

Device, bus:

- Admin A creates an AC or Non-AC class, a layout with a seat count, a route, two stops, and a trip whose departure is more than 6 hours ahead.
- `user1` finds that trip in the existing search, holds a seat, picks those stops, enters passengers, pays, and the ticket appears on Admin A’s passenger list.

Device, rental, when a rental admin account is available:

- That admin creates a class and a vehicle.
- `user1` books it on `transport-rental` for a window more than 24 hours ahead.
- The rental admin sees that renter’s name and email on the booking.

Do not treat D-06a (return leg) or D-06c (hold expiry) as part of this plan. Those stay on `06-transport/tests.md`.
