# Rules — transport admin (bus and car rental)

Shared mobile rules: [mobile-production-readiness/_shared/global-rules.md](../mobile-production-readiness/_shared/global-rules.md).

Backend domain: `ExpressJS-choloBD-backend/.cursor/rules/booking/transport-booking-rules.mdc`. Refund: `refund-policy-for-services.mdc` and `refund-wiring.mdc`. Roles: `user-hierarchy.mdc`.

## Who this plan is for

| Role | Assignment | Company id |
| --- | --- | --- |
| Transport `SERVICE_ADMIN` | `serviceType = TRANSPORT_SERVICE`, `serviceEntityId`, and `Transport.serviceAdminUserId` | `serviceEntityId` |
| Traveler `USER` | none | their own `userId` on bookings only |

`GET /api/users/profile` is the source for `serviceType`. Do not branch the home on the login JWT `userServiceType`.

One admin, one company. This plan does not create a `Transport` row.

`transportType` on that company picks the screen:

| `transportType` | Admin creates | Traveler buys |
| --- | --- | --- |
| `BUS` | Class with `busServiceType`, layout, route, stops, trip | A seat on that trip |
| `CAR_RENTAL` | Class with `vehicleRentalCategory`, then a vehicle | That vehicle for a date window |

## Response shapes

`GET /api/transports/my` for a `SERVICE_ADMIN` with at least one company:

```json
{ "status": "success", "message": "...", "data": [ { "id": "...", "transportType": "BUS" } ] }
```

No company stays **404**. Do not change that to an empty 200 in this plan.

`GET /api/bookings/transports` stays:

```json
{ "status": "success", "data": { "results": [], "total": 0, "page": 1, "limit": 10 } }
```

## Writes

- Inventory writes stay on `/api/transport-inventory` behind `checkServiceAdminRole` and `assertCanManageTransport`.
- A bus company rejects rental classes and vehicles. A rental company rejects layouts, routes, stops, and trips.
- Cancel is eligibility GET, then `DELETE /api/bookings/transports/:bookingId`. Optional `cancellationReason`. No `POST /api/payments/refund`.

## Mobile layering

Screens call the transport hook and `src/services/api/`. No Axios in `src/app/` or `src/components/`.

Hotel operator home is unchanged. A transport admin does not render hotel cards.

## Do not

- Add a second booking root for bus or rental.
- Let the admin set `Transport.capacity` or `vehicleCount` and treat it as stock.
- Store a booked flag on `TransportSeat` or flip `vehicleStatus` to `BOOKED` on create.
- Rebuild `transport-search`, seats, holds, stops, passengers, rental checkout, or payment.
