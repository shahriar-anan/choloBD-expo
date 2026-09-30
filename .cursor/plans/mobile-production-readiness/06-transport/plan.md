# 06 — Transport

**Folder:** `06-transport` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Bus ticket flow implemented (holds, stops, passengers, return leg, enriched results). `npx tsc --noEmit` passed. Device cases D-06 / D-06a / D-06b / D-06c not run.

**Depends on:** increment 03 (`TRANSPORT_SERVICE` + `bookingId` on payment initialize). Backend bus ticket APIs are done (`ExpressJS-choloBD-backend/.cursor/plans/bus-ticket-booking-flow/`).

**QA seed:** After `npm run seed:all`, run `npm run seed:bus-ticket-qa` from `ExpressJS-choloBD-backend/nodeapp/` (`scripts/one-off/seed-bus-ticket-qa.ts`) to load Dhaka–Chattogram / Dhaka–Sylhet trips (Coach, AC(Economy), AC (Business)), sample tickets, and rental vehicles; re-run when seeded dates are in the past. Login `user1@gmail.com` / `root1234`.

**Keep:** `transport-search.tsx` after the home transport icon. From, To, journey date, and transport type stay. From/To stay division and district only. Do not restyle that screen.

**Design:** Follow `src/constants/theme.ts` and the hotel-search chrome already used on transport (gradient header, white card, `PillButton`). Do not copy the reference app’s layout, promo carousel, fare strikethrough, coupons, or insurance.

Bus and car rental only. No flight or train.

```
transport-search (existing)
 ├─ return date row (optional, bus only) ─► existing date screen
 ├─ BUS Search ─► results (date strip, All / AC / Non-AC)
 │                 └─ trip ─► seats (decks, hold, fare bar)
 │                              └─ boarding + dropping
 │                                   ├─ return date set ─► return results ─► return seats
 │                                   └─ passengers ─► create ─► existing payment
 └─ CAR_RENTAL Search ─► existing rental screen
```

Dashboard list and detail stay. Detail gains the ticket fields. Pay and cancel stay on the existing screens.

## Already in the app

- Search home, From/To pickers, single date, bus vs rental type.
- Trip list, seat tap, and rental pickup/return that call the old create body (`seatIds` only).
- Dashboard list, detail, `TRANSPORT_SERVICE` pay, eligibility, and cancel.
- Home ride card and trip-planner transport tab open this flow.

A bus create from the current seat screen fails. The API requires a live seat hold, and the client does not post one.

## Functional

Extend the existing transport types, `src/services/api/transports.ts`, `src/services/api/transportBookings.ts`, and `src/hooks/useTransportBookingLogic.tsx`. Do not add operator inventory writes.

### Trip list

`GET /api/transport-inventory/trips` already returns, per trip:

- `availableSeatCount`, `totalSeatCount`, `lowestFare`
- `busServiceTypes`, `coachLabel`, `transportImageUrl`
- operator name, `departureDateTime`, `arrivalDateTime`

Fetch one day with `originLocationId`, `destinationLocationId`, and `departureDate`. Filter All / AC / Non-AC on that array:

- AC: any `busServiceTypes` value starting with `AC_`
- Non-AC: `NON_AC_SEATER` or `NON_AC_SLEEPER`
- Other values (`DELUXE`, `SEMI_DELUXE`, `LUXURY`) stay on All only

Do not use the `busServiceType` query for these chips. It accepts one enum value and cannot express Non-AC.

### Trip detail and seats

`GET /api/transport-inventory/trips/:tripId` includes `route.stops` (`name`, `stopOrder`, `arrivalOffsetMinutes`, `latitude`, `longitude`).

`GET .../trips/:tripId/seats` returns `compartmentName`, `isAvailable`, `seatLabel`, and `transportClass.basePrice`. Group seats by compartment, ordered by `sortOrder` when the trip payload has it.

### Holds

| Call | Body | Result |
| --- | --- | --- |
| `POST /api/transport-inventory/trips/:tripId/seat-holds` | `{ seatIds }` | `{ tripId, seatIds, expiresAt }` |
| `DELETE` the same path | — | releases this user’s holds on that trip |

Auth required. A new hold replaces this user’s holds on that trip. Create fails unless every selected seat is still held by this user. Hold on **Continue**, not on each tap. If the traveler changes seats, hold the new set before create.

### Create

`POST /api/bookings/transports` for a bus:

- `transportId`, `transportTripId`
- `boardingStopId`, `droppingStopId` (both on this trip’s route; dropping `stopOrder` greater than boarding)
- `contactPhone` (max 20), `contactEmail`
- `passengers[]`: `seatId`, `passengerFirstName`, `passengerLastName`, `passengerGender` (`MALE` or `FEMALE`)
- optional `returnLeg`: `{ transportTripId, seatIds, passengers? }`

One-way returns the booking and leaves `roundTripGroupId` empty. A return leg returns `{ roundTripGroupId, bookings }` with two confirmation codes. The return route must be the reverse of the outbound route. Each leg is its own unpaid booking.

`totalPrice` is the sum of seat `basePrice`. Do not send a coupon, insurance, or strike price.

Rental create stays `transportId`, `transportVehicleId`, `departureDateTime`, `arrivalDateTime`. No holds, stops, or passengers.

### Ticket detail

`GET /api/bookings/transports/:bookingId` includes stops, contact, passenger names and gender, and `linkedLegBookingId` when a return leg exists. Cancel still judges each leg on its own `departureDateTime` (bus: 6 hours). Pay each unpaid leg with the existing `TRANSPORT_SERVICE` initialize (`bookingId` = that leg).

### Exit

`npx tsc --noEmit` passes before UI edits.

## UI

After the functional exit. Strings go through `TRANSLATION_KEYS` and `en.json` + `bn.json`.

### Search home

Leave the layout. Add one optional return-date row on the existing card, bus only, using the current date screen. Clearing it keeps the trip one-way. Rental ignores it and keeps `transport-rental.tsx`.

### Results

Replace the current list content in `transport-results.tsx`. Same header and card style as the rest of explore.

- Date strip: changing the day writes the search date and refetches.
- Chips: All, AC, Non-AC, with counts from the loaded list.
- Each card: operator image when `transportImageUrl` is set, name, departure and arrival, `coachLabel` when set, `lowestFare`, seats left. Sold-out trips stay visible and cannot be opened.
- A return leg reuses this screen with the locations swapped and the return date.

### Seats

Replace the seat body in `transport-trip.tsx`.

- One group per `compartmentName` (lower deck, upper deck, or a single coach).
- Three states: available, unavailable, selected. Selected is local until Continue.
- Continue holds the seats and opens stops. The bar shows the seat count and the sum of `basePrice`.
- Show the remaining time from `expiresAt`. When it hits zero, clear the hold and send the traveler back to seats.

### Stops

New screen. List stops in `stopOrder`. Boarding first, then dropping stops after it. Clock time is departure plus `arrivalOffsetMinutes` when that offset is set. If both latitude and longitude are set, a direction button opens the maps app with those coordinates. There is no routing API.

### Passengers

New screen. Phone, email, and for each held seat: first name, last name, gender. Submit creates the booking. A return leg is included only when return seats were held. Then open the existing payment screen for the outbound booking. When a second booking exists, the confirmation names both codes and pay is offered per unpaid leg.

### Dashboard

List rows can stay. Detail shows coach seats, boarding and dropping names, contact, passengers, and a link to `linkedLegBookingId`. Pay and cancel stay as they are, per booking.

Hide the tab bar on the new stops and passenger screens the same way other transport child screens hide it.

## Out of scope

- Redesign of `transport-search.tsx`
- Promo carousel, crossed-out fares, coupons, per-passenger insurance
- Separate bKash, Nagad, or card integrations (those stay inside SSLCommerz)
- Flight, train, ferry, operator layout editors
- Rental seat maps or boarding points

Device cases: [tests.md](tests.md).
