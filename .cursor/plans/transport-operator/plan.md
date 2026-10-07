# Transport admin — bus and car rental

**Folder:** `transport-operator` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **In progress** (mobile coach hub + wizard + detail, 2026-10-07).

Scope is the mobile app and the Express API. The Next.js dashboard already has a bus admin and is not part of this work.

After this plan, a transport `SERVICE_ADMIN` signs in with the existing login, lands on their own company, reads the passengers who booked that company, and adds a sellable coach (bus) or vehicle (car rental) under that company. They do not create the company. Platform admin still assigns `serviceType = TRANSPORT_SERVICE` and `serviceEntityId`.

Seed pair: `transportadmin1@gmail.com` / `root1234` (bus) and a car-rental `SERVICE_ADMIN` on a `CAR_RENTAL` transport. Traveler remains `user1@gmail.com` / `root1234`. Login is `POST /api/auth/login-jwt`.

## Traveler flow — already wired, do not rebuild

Increment `06-transport` is implemented in the app and the API. `npx tsc --noEmit` passed there. Device cases D-06, D-06a, D-06b, and D-06c were not run.

| Traveler step | Where it lives |
| --- | --- |
| From, To, date, bus vs rental | `transport-search.tsx` and the place/date/type screens |
| Trip list, All / AC / Non-AC | `transport-results.tsx` → `GET /api/transport-inventory/trips` |
| Seats, hold, boarding and dropping, passengers, return leg | `transport-trip.tsx`, `transport-stops.tsx`, `transport-passengers.tsx` |
| Pay | `transport-payment.tsx` with `TRANSPORT_SERVICE` |
| Rental vehicle and dates | `transport-rental.tsx` |
| Own tickets, detail, cancel | `dashboard/transport-bookings.tsx` and `[bookingId].tsx` |

A bus create succeeds only when all of these are already true: a live seat hold, a boarding stop, a later dropping stop on that route, contact phone and email, and one passenger (first name, last name, `MALE` or `FEMALE`) per seat. A class row alone is not a ticket a traveler can buy.

A rental create sends `transportId`, `transportVehicleId`, `departureDateTime`, and `arrivalDateTime`. It does not send a passenger list or a contact phone. The renter on the booking is `user` (name, username, email). Phone for a rental is only present if it is copied onto the booking.

### Gaps that this plan must close before the admin screens trust the data

1. **Passenger list is not locked to the caller’s company.** `GET /api/bookings/transports?transportId=` uses that id even when the caller is a `SERVICE_ADMIN` of a different company. `GET /api/bookings/transports/:bookingId` hides another traveler’s ticket from a `USER`, and does not hide it from a `SERVICE_ADMIN`.
2. **Rental “who booked” has no phone.** `BOOKING_INCLUDE.user` omits `phoneNumber`. Bus tickets already store `contactPhone`, `contactEmail`, passenger names, gender, seat, and stops.
3. **A new coach is unsellable until the chain exists.** Class (AC or Non-AC and a fare) → seat layout → route → at least two stops → one trip on that route and layout. The traveler screens already require that chain. This plan’s create flow must write the whole chain, not only the class.
4. **Fleet list hides cars that are not `AVAILABLE`.** `GET /api/transport-inventory/vehicles` is the public search and filters `vehicleStatus = AVAILABLE`. An admin managing the fleet cannot see a car they just marked out of service on that call.
5. **Writes do not check `transportType`.** A bus company can accept a rental category, and a rental company can accept a trip. The mobile screens will split by type; the API should reject the mismatch.
6. **Device QA of the traveler path is still open.** Do not rebuild those screens. The last test in [tests.md](tests.md) books a coach this admin created, using the existing traveler UI.

## Already in place (do not rebuild)

| Need | Today |
| --- | --- |
| Sign-in and role redirect | `login.tsx` → `resolveRoleHome`. A non-hotel `SERVICE_ADMIN` opens `/(tabs)/dashboard`. |
| Company for this admin | `GET /api/transports/my`. `SERVICE_ADMIN` gets an array of transports where `serviceAdminUserId` is that user. Empty assignment is **404**. |
| Coach class, layout, route, stop, trip, vehicle | `POST` / `PUT` / `DELETE` under `/api/transport-inventory`, behind `checkServiceAdminRole`. `assertCanManageTransport` allows the write only for that company’s `SERVICE_ADMIN` (or `MASTER_ADMIN`). |
| Passenger bookings | `GET /api/bookings/transports` with no `transportId` already limits a `SERVICE_ADMIN` to `serviceEntityId`. Items include seat, vehicle, class, trip, stops, and `user`. |
| Cancel | `GET .../:bookingId/cancellation-eligibility` then `DELETE .../:bookingId`. Operator cancel of a paid ticket is a full refund. The client must not call the payment refund route. |
| Mobile read client | `src/services/api/transports.ts` and `transportBookings.ts` already search trips, seats, holds, vehicles, and the traveler’s own bookings. They have no inventory writes and no `GET /transports/my`. |

## What the admin sees after login today

`dashboard/index.tsx` renders `ServiceAdminDashboard` for every `SERVICE_ADMIN` who is not a hotel operator. Those cards open hotel screens (`My hotel`, hotel current bookings, hotel QR, staff). A bus or rental admin has no transport home.

## Left off

- Creating the company, assigning the admin, or a second company for the same admin.
- Transport `EMPLOYEE` screens (boarding, no-show). The booking-scope fix still applies to `EMPLOYEE` so a desk account cannot read another company. Their home stays as it is.
- Sales totals, earnings charts, and notifications beyond the inbox that already exists.
- Editing a passenger’s name, moving a seat, or marking a ticket paid by hand.
- Flight, train, ferry, QR check-in for transport, and the Next.js bus dashboard.
- Rebuilding traveler search, seats, payment, or cancel.

## Progress

Not started. Finish one round, run that round’s check in [tests.md](tests.md), then start the next. Rounds 1–2 are backend. Rounds 3–6 are the app and assume 1–2 are green.

---

## Round 1 — An admin only reads their own passengers

`TransportBookingService.getBookings` and `getBookingDetails`:

- `USER` stays limited to `userId = caller`.
- `SERVICE_ADMIN` with `serviceType = TRANSPORT_SERVICE` is limited to `transportId = serviceEntityId`. A query `transportId` that is not that id is 403, not a wider list.
- `EMPLOYEE` with `employeeServiceType = TRANSPORT_SERVICE` uses `employeeServiceEntityId` the same way.
- `MASTER_ADMIN` may still pass `transportId` or omit it.
- Detail of a booking whose `transportId` is not the caller’s company is 403 for admin and employee. The traveler owner can still open their own row.
- Add `phoneNumber` to the booking `user` select so a rental row can show a phone when the account has one.

Do not change the list envelope: `data` is `{ results, total, page, limit }`.

### Files

- `nodeapp/src/services/transportBookingService.ts`

### Exit

You run round 1 in [tests.md](tests.md). Admin 1 lists only their company. Admin 1 cannot list or open admin 2’s booking. `user1` still sees only their own tickets.

## Round 2 — Inventory writes match the company type

On create (and on update when the field is sent):

- `transportType = BUS`: class requires `busServiceType` and rejects `vehicleRentalCategory`. Layout, route, stop, and trip stay allowed. `POST /vehicles` throws.
- `transportType = CAR_RENTAL`: class requires `vehicleRentalCategory` and rejects `busServiceType`. `POST /vehicles` stays allowed. Layout, route, stop, and trip throw.

`GET /api/transport-inventory/vehicles` stays the public available-only list when the caller is missing or is not that company’s admin. When the caller is that company’s `SERVICE_ADMIN` (optional auth on this route), return every active vehicle, including `MAINTENANCE` and `OUT_OF_SERVICE`. Do not change the traveler rental screen’s filter; it already skips `isAvailable === false`.

### Files

- `nodeapp/src/services/transportInventoryService.ts`
- `nodeapp/src/routes/transportInventoryRoutes.ts` — optional auth on `GET /vehicles` only, before the write gate

### Exit

You run round 2. A bus admin cannot create a vehicle. A rental admin cannot create a trip. The bus admin’s vehicle list is unchanged because they have none.

## Round 3 — App client for the company, the fleet, and the passenger list

Add calls next to the existing transport clients. Screens do not call Axios.

| Call | Client |
| --- | --- |
| `GET /api/transports/my` | `getMyTransport()`. 404 or an empty array means no company. Use the first row. Ignore rows whose `transportType` is not `BUS` or `CAR_RENTAL`. |
| Classes, routes, layouts, trips, vehicles | GET with `transportId`. |
| `POST /classes`, `POST /layouts`, `POST /routes`, `POST /routes/:routeId/stops`, `POST /trips`, `POST /vehicles` | Bodies the validators already accept. Layout uses `transportClassId`, `seatCount`, and `compartmentName`. |
| `GET /api/bookings/transports` | No foreign `transportId`. The API scopes it. Unwrap `{ results, total, page, limit }`. |
| Eligibility + `DELETE /api/bookings/transports/:bookingId` | Reuse the traveler cancel helpers. |

### Files

- `src/services/api/transports.ts`
- `src/services/api/transportBookings.ts`
- `src/types/transports.ts`
- `src/hooks/useTransportOperator.ts` — loads profile assignment, `getMyTransport`, and exposes `transportId` and `transportType`

### Exit

You run `npx tsc --noEmit` from `choloBD-expo`. Rounds 1–2 still pass.

## Round 4 — Transport admin home

Branch `dashboard/index.tsx` the same way hotel already branches, using `GET /api/users/profile` (`serviceType`), not the login JWT claim.

- `SERVICE_ADMIN` and `serviceType === TRANSPORT_SERVICE` and `getMyTransport()` is `BUS` or `CAR_RENTAL`: transport operator home.
- Hotel operators stay on the hotel home.
- Every other `SERVICE_ADMIN` stays on the screen they have today.

Transport home cards:

1. **Passengers** — round 5.
2. **Coach services** when `transportType === BUS`, or **Vehicles** when `transportType === CAR_RENTAL` — round 6.

Show the company name from `GET /api/transports/my`. If that call is 404, the home says no company is assigned and does not open the other cards.

Strings go through `TRANSLATION_KEYS` and `en.json` + `bn.json`.

### Files

- `src/utilities/operatorAssignment.ts` — `isTransportServiceAdmin`
- `src/utilities/travelerShell.ts` — transport admin home is still `/(tabs)/dashboard` (same as today); do not send them to the traveler tabs
- `src/app/(tabs)/dashboard/index.tsx`
- `src/components/interface/ServiceAdminDashboard.tsx` — do not add transport cards onto the hotel card list. A transport admin must not see My hotel.
- `src/app/(tabs)/dashboard/transport-admin/index.tsx`

### Exit

You run `npx tsc --noEmit`.

## Round 5 — Passenger bookings

One list for bus and rental, fed by round 3’s booking list.

Each row: traveler name, confirmation code, status, payment status, total, departure. Bus rows also show seat labels and the route. Rental rows show the vehicle name or plate and the pickup and return times.

Open one booking: passengers (name, gender, seat), boarding and dropping stop names, `contactPhone`, `contactEmail`, and for rental the account email plus `user.phoneNumber` when set. Cancel uses eligibility, then DELETE. The button label follows eligibility (cancel, or cancel and refund with the amount). Do not call the refund API.

### Files

- `src/app/(tabs)/dashboard/transport-admin/bookings.tsx`
- `src/app/(tabs)/dashboard/transport-admin/bookings/[bookingId].tsx`

### Exit

You run `npx tsc --noEmit`.

## Round 6 — Create a sellable coach, or a vehicle

**Bus** (`transportType === BUS`), one flow on the coach screen:

1. Class: name, `busServiceType` (`AC_SEATER`, `NON_AC_SEATER`, `AC_SLEEPER`, `NON_AC_SLEEPER`), base price.
2. Layout: name, that class, seat count. The API generates the seats.
3. Route: origin and destination location ids (reuse the existing division/district picker).
4. Two stops on that route, with `stopOrder` 1 then 2. Names are required. Offsets are optional.
5. Trip: that route, that layout, departure and arrival, optional `coachLabel`.

List the company’s classes and upcoming trips under the form so the admin can see what they added. Delete stays off this screen.

**Car rental** (`transportType === CAR_RENTAL`):

1. Class: name, `vehicleRentalCategory`, base price (daily fare the traveler already reads).
2. Vehicle: that class, name, license plate.

List vehicles from the operator vehicle query (round 2), not the public available-only list.

A bus admin never sees the vehicle form. A rental admin never sees routes, layouts, or trips.

### Files

- `src/app/(tabs)/dashboard/transport-admin/coaches.tsx`
- `src/app/(tabs)/dashboard/transport-admin/vehicles.tsx`

### Exit

You run `npx tsc --noEmit`, then the create-and-book case in [tests.md](tests.md).
