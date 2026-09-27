# Rules — increment 06 (transport)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Scope

**Bus** and **car rental** only. No flight or train booking UI or API calls.

## Inventory

Public reads: transports search, trips, seats, vehicles per `plan.md`.

## Booking

`POST /api/bookings/transports` with trip/seat or vehicle datetime fields as required by backend validators.

## Payment and cancel

Pay: `TRANSPORT_SERVICE`. Cancel: eligibility GET then `DELETE`. Refund windows: bus 6h before departure; rental 24h before pickup (server-side).
